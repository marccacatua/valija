/**
 * Verificador de traducciones (npm run qa:i18n).
 *
 * 1. Junta todas las frases de la interfaz: cada `t('...')` y `tn(n, '...', '...')`
 *    con texto literal en src/. Falla si alguna llamada a t()/tn() no usa
 *    texto literal (no se podría verificar).
 * 2. Junta todos los nombres de ítems y tareas que la app puede generar,
 *    recorriendo todas las combinaciones relevantes del formulario.
 * 3. Inglés, alemán y portugués (diccionarios completos): falla si alguna frase o
 *    ítem no tiene traducción, si hay traducciones que ya no se usan o si
 *    los {parámetros} no coinciden.
 * 4. Español "con tú" (Latinoamérica) y de España (diccionarios parciales):
 *    falla si tienen claves que no existen, si los {parámetros} no
 *    coinciden, o si el texto que efectivamente se va a mostrar (lo
 *    traducido, o el rioplatense cuando no hay traducción) todavía tiene
 *    voseo o palabras rioplatenses ("tenés", "acá", "remera", "valija"…).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildRawItems } from '../src/data/buildItems';
import { buildBoatChecklist, buildHomeChecklist } from '../src/data/homeTasks';
import { DEFAULT_FORM } from '../src/data/trip';
import { DE } from '../src/i18n/de';
import { DE_ITEMS } from '../src/i18n/deItems';
import { EN } from '../src/i18n/en';
import { EN_ITEMS } from '../src/i18n/enItems';
import { ES_ES, ES_ES_ITEMS } from '../src/i18n/esES';
import { ES_TU, ES_TU_ITEMS } from '../src/i18n/esTu';
import { PT } from '../src/i18n/pt';
import { PT_ITEMS } from '../src/i18n/ptItems';
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
  transporte: ['avion', 'barco', 'tren', 'bus', 'auto', 'moto'],
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
                    ...DEFAULT_FORM, dest: [...dest], clima: [clima], motivo, turismo: [turismo], aloj, transporte: [transporte], maletas: [...maletas], dias,
                    vestidos: flags, lavaRopa: flags, bebe: flags, mascota: flags, deporte: flags, equipoPropio: flags,
                  } as TripFormState;
                  for (const it of buildRawItems(f)) itemKeys.add(it.name);
                  for (const task of buildHomeChecklist(f)) itemKeys.add(task.label);
                  for (const task of buildBoatChecklist(f)) itemKeys.add(task.label);
                }

// Combinaciones múltiples de clima y turismo (por si alguna regla solo
// aparece al combinar).
for (const flags of [false, true]) {
  const f = {
    ...DEFAULT_FORM, dest: ['playa', 'montana', 'ciudad'], clima: [...opts.clima], turismo: [...opts.turismo], dias: 14,
    maletas: ['carry', 'bodega', 'mochila'], vestidos: flags, lavaRopa: flags, bebe: flags, mascota: flags, deporte: flags, equipoPropio: flags,
  } as TripFormState;
  for (const it of buildRawItems(f)) itemKeys.add(it.name);
  for (const task of buildBoatChecklist(f)) itemKeys.add(task.label);
}

// --- 3. Diccionarios completos (inglés, alemán y portugués)
const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
// El portugués también lleva tildes: ahí solo delatan al español ñ, ¿ y ¡.
for (const [name, ui, items, spanishMark] of [
  ['inglés', EN, EN_ITEMS, /[áéíóúñ¿¡]/i],
  ['alemán', DE, DE_ITEMS, /[áéíóúñ¿¡]/i],
  ['portugués', PT, PT_ITEMS, /[ñ¿¡]/i],
] as const) {
  for (const k of uiKeys) {
    if (!(k in ui)) errors.push(`Falta traducir al ${name} (interfaz): ${JSON.stringify(k)}`);
    else if (params(k) !== params(ui[k])) errors.push(`Parámetros distintos (${name}): ${JSON.stringify(k)} → ${JSON.stringify(ui[k])}`);
  }
  for (const k of itemKeys) if (!(k in items)) errors.push(`Falta traducir al ${name} (ítem): ${JSON.stringify(k)}`);
  for (const k of Object.keys(ui)) if (!uiKeys.has(k)) errors.push(`Traducción sin uso (${name}, interfaz): ${JSON.stringify(k)}`);
  for (const k of Object.keys(items)) if (!itemKeys.has(k)) errors.push(`Traducción sin uso (${name}, ítem): ${JSON.stringify(k)}`);
  for (const [k, v] of [...Object.entries(ui), ...Object.entries(items)]) {
    if (spanishMark.test(v)) errors.push(`La traducción al ${name} parece estar en español: ${JSON.stringify(k)} → ${JSON.stringify(v)}`);
  }
}

// --- 4. Españoles "con tú" (parciales)
// Voseo: formas puntuales que usa la app + la terminación -ás/-és/-ís de
// presente con vos ("tenés", "llevás"), salvo palabras que terminan así
// sin ser voseo.
const VOSEO = /\b(acá|vos|tocá|elegí|armá|sumá|tildá|probá|desbloqueá|creá|guardá|pegá|pegalo|mantené|contanos|recibí|seguí|arrancá|borrá|pausá|repetí|ponele|laburo|pronto)\b/i;
const VOSEO_ENDING = /\b[a-záéíóúñ]+[áéí]s\b/gi;
const NOT_VOSEO = new Set(['más', 'jamás', 'atrás', 'detrás', 'además', 'después', 'inglés', 'francés', 'país', 'portabebés', 'esquís', 'jerséis', 'quizás']);
// Futuro con tú ("lavarás", "perderás"): termina igual pero no es voseo.
const FUTURE = /[aei]rás$/i;
const RIOPLATENSE = /\b(valijas?|remeras?|camperas?|buzos?|pollera|ojotas|championes|heladera|finde|depto|micro|chico)\b/;
// Además, en España no se dice así:
const LATAM_ONLY = /\b(celular|lentes|auto|carpa|computadora|notebook|billetera|pasajes?|boleto|empacad[oa]|empacas|agregar|agrega|agregamos|agregó)\b/i;
const effective = (k: string, dicts: Record<string, string>[]) => {
  for (const d of dicts) if (k in d) return d[k];
  return k;
};
for (const [name, ui, items, extra] of [
  ['español con tú', [ES_TU], [ES_TU_ITEMS], null],
  ['español de España', [ES_ES, ES_TU], [ES_ES_ITEMS, ES_TU_ITEMS], LATAM_ONLY],
] as const) {
  for (const d of ui) for (const k of Object.keys(d)) {
    if (!uiKeys.has(k)) errors.push(`Traducción sin uso (${name}, interfaz): ${JSON.stringify(k)}`);
    else if (params(k) !== params(d[k])) errors.push(`Parámetros distintos (${name}): ${JSON.stringify(k)} → ${JSON.stringify(d[k])}`);
  }
  for (const d of items) for (const k of Object.keys(d)) if (!itemKeys.has(k)) errors.push(`Traducción sin uso (${name}, ítem): ${JSON.stringify(k)}`);
  const shown = [
    ...[...uiKeys].map((k) => [k, effective(k, [...ui])] as const),
    ...[...itemKeys].map((k) => [k, effective(k, [...items])] as const),
  ];
  for (const [k, v] of shown) {
    const endings = [...v.matchAll(VOSEO_ENDING)].map((m) => m[0]).filter((w) => !NOT_VOSEO.has(w.toLowerCase()) && !FUTURE.test(w));
    const bad = v.match(VOSEO)?.[0] ?? endings[0] ?? v.match(RIOPLATENSE)?.[0] ?? (extra ? v.match(extra)?.[0] : undefined);
    if (bad) errors.push(`Queda "${bad}" en ${name}: ${JSON.stringify(k)} → ${JSON.stringify(v)}`);
  }
}

console.log(`Frases de interfaz: ${uiKeys.size} · Ítems y tareas: ${itemKeys.size}`);
if (errors.length) {
  console.log(`\n${errors.length} problemas:\n` + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: inglés, alemán y portugués completos; los dos españoles "con tú" sin voseo ni palabras rioplatenses.');
}
