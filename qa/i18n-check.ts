/**
 * Verificador de traducciones (npm run qa:i18n).
 *
 * 1. Junta todas las frases de la interfaz: cada `t('...')` y `tn(n, '...', '...')`
 *    con texto literal en src/. Falla si alguna llamada a t()/tn() no usa
 *    texto literal (no se podría verificar).
 * 2. Junta todos los nombres de ítems y tareas que la app puede generar,
 *    recorriendo todas las combinaciones relevantes del formulario.
 * 3. Falla si alguna frase o ítem no tiene traducción al inglés, o si hay
 *    traducciones que ya no se usan. También chequea que los {parámetros}
 *    coincidan entre español e inglés.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildRawItems } from '../src/data/buildItems';
import { buildBoatChecklist, buildHomeChecklist } from '../src/data/homeTasks';
import { DEFAULT_FORM } from '../src/data/trip';
import { EN } from '../src/i18n/en';
import { EN_ITEMS } from '../src/i18n/enItems';
import type { TripFormState } from '../src/types';

const errors: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

// --- 1. Frases de la interfaz
const uiKeys = new Set<string>();
const lit = String.raw`'((?:[^'\\]|\\.)*)'`;
for (const file of walk('src')) {
  if (file.includes(`src/i18n/`)) continue;
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\b(t|tn)\(/g)) {
    const rest = src.slice(m.index! + m[0].length);
    if (m[1] === 't') {
      const mm = rest.match(new RegExp('^' + lit));
      if (!mm) errors.push(`${file}: t() sin texto literal → ${rest.slice(0, 40)}`);
      else uiKeys.add(mm[1].replace(/\\'/g, "'"));
    } else {
      const mm = rest.match(new RegExp(`^[^,]+,\\s*${lit},\\s*${lit}`));
      if (!mm) errors.push(`${file}: tn() sin textos literales → ${rest.slice(0, 40)}`);
      else [mm[1], mm[2]].forEach((k) => uiKeys.add(k.replace(/\\'/g, "'")));
    }
  }
}

// --- 2. Ítems y tareas generados
const itemKeys = new Set<string>();
const opts = {
  dest: [['playa'], ['montana'], ['ciudad'], ['playa', 'montana', 'ciudad']],
  clima: ['calor', 'templado', 'frio', 'lluvia'],
  motivo: ['placer', 'trabajo'],
  turismo: ['relax', 'aventura', 'cultura', 'fiesta', 'ski', 'navegar', 'buceo'],
  aloj: ['hotel', 'depto', 'hostel', 'amigos', 'camping'],
  transporte: ['avion', 'auto', 'bus', 'tren'],
  maletas: [['carry'], ['bodega'], ['mochila'], ['carry', 'bodega'], ['bodega', 'mochila']],
  dias: [1, 7],
} as const;
for (const dest of opts.dest)
  for (const clima of opts.clima)
    for (const motivo of opts.motivo)
      for (const turismo of opts.turismo)
        for (const aloj of opts.aloj)
          for (const transporte of opts.transporte)
            for (const maletas of opts.maletas)
              for (const dias of opts.dias)
                for (const flags of [false, true]) {
                  const f = {
                    ...DEFAULT_FORM, dest: [...dest], clima, motivo, turismo, aloj, transporte, maletas: [...maletas], dias,
                    vestidos: flags, lavaRopa: flags, bebe: flags, mascota: flags, deporte: flags, equipoPropio: flags,
                  } as TripFormState;
                  for (const it of buildRawItems(f)) itemKeys.add(it.name);
                  for (const task of buildHomeChecklist(f)) itemKeys.add(task.label);
                  for (const task of buildBoatChecklist(f)) itemKeys.add(task.label);
                }

// --- 3. Comparación
const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const k of uiKeys) {
  if (!(k in EN)) errors.push(`Falta traducir (interfaz): ${JSON.stringify(k)}`);
  else if (params(k) !== params(EN[k])) errors.push(`Parámetros distintos: ${JSON.stringify(k)} → ${JSON.stringify(EN[k])}`);
}
for (const k of itemKeys) if (!(k in EN_ITEMS)) errors.push(`Falta traducir (ítem): ${JSON.stringify(k)}`);
for (const k of Object.keys(EN)) if (!uiKeys.has(k)) errors.push(`Traducción sin uso (interfaz): ${JSON.stringify(k)}`);
for (const k of Object.keys(EN_ITEMS)) if (!itemKeys.has(k)) errors.push(`Traducción sin uso (ítem): ${JSON.stringify(k)}`);
for (const [k, v] of [...Object.entries(EN), ...Object.entries(EN_ITEMS)]) {
  if (/[áéíóúñ¿¡]/i.test(v)) errors.push(`La traducción parece estar en español: ${JSON.stringify(k)} → ${JSON.stringify(v)}`);
}

console.log(`Frases de interfaz: ${uiKeys.size} · Ítems y tareas: ${itemKeys.size}`);
if (errors.length) {
  console.log(`\n${errors.length} problemas:\n` + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: todo tiene traducción al inglés.');
}
