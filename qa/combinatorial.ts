import { buildRawItems, ROPA_ORDER } from '../src/data/buildItems';
import { distributeItems } from '../src/data/distribute';
import { buildHomeChecklist } from '../src/data/homeTasks';
import { QUICK_GROUP_META, quickGroupFor } from '../src/data/quickGroups';
import type { AlojKey, ClimaKey, DestKey, MaletaKey, MotivoKey, TransporteKey, TripFormState, TurismoKey } from '../src/types';

/**
 * QA de la lógica pura (buildItems.ts + distribute.ts + quickGroups.ts):
 * recorre el producto cartesiano de TODAS las opciones del formulario y
 * verifica un puñado de invariantes que tienen que cumplirse siempre, sin
 * importar la combinación. No reemplaza al QA manual/Playwright — está
 * pensado para cachear reglas rotas al tocar buildItems.ts (ítem
 * duplicado, cantidad inválida, algo que no cierra al repartir entre
 * valijas), algo mucho más difícil de notar a mano dado el volumen de
 * combinaciones posibles.
 *
 * Correr con: npm run qa:logic
 */

const ALL_DEST: DestKey[] = ['playa', 'montana', 'ciudad'];
const CLIMA: ClimaKey[] = ['calor', 'templado', 'frio', 'lluvia'];
const MOTIVO: MotivoKey[] = ['placer', 'trabajo'];
const TURISMO: TurismoKey[] = ['relax', 'aventura', 'cultura', 'fiesta'];
const ALOJ: AlojKey[] = ['hotel', 'depto', 'hostel', 'amigos', 'camping'];
const TRANSPORTE: TransporteKey[] = ['avion', 'auto', 'bus', 'tren'];
const DIAS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 14, 20, 30];
const VESTIDOS = [false, true];
const LAVA_ROPA = [false, true];
const BEBE = [false, true];
const ALL_BAGS: MaletaKey[] = ['carry', 'bodega', 'mochila'];

function nonEmptySubsets<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 1; mask < 1 << arr.length; mask++) {
    out.push(arr.filter((_, i) => mask & (1 << i)));
  }
  return out;
}
const MALETA_SUBSETS = nonEmptySubsets(ALL_BAGS);
// Se puede combinar más de un destino (playa + montaña, etc.) — se
// prueban los 7 subconjuntos no vacíos de los 3 destinos, no solo el
// valor individual.
const DEST_SUBSETS = nonEmptySubsets(ALL_DEST);

const ALWAYS_WITH_YOU = ['Lentes de sol', 'Cepillo de dientes', 'Pasta de dientes (mini, <100 ml)', 'Shampoo (mini, <100 ml)'];

const errors: string[] = [];
let combos = 0;
let distributionChecks = 0;

function fail(f: TripFormState, msg: string) {
  errors.push(`${msg} | form=${JSON.stringify(f)}`);
}

// lavaRopa y bebe quedan FUERA del gran cruce combinatorio a propósito:
// cruzarlos contra las ~11 dimensiones existentes multiplicaba el total
// x4 (a ~3M combos / 21M chequeos de distribución) para probar dos
// campos cuya lógica depende de muy pocos otros campos (bebe: dest/
// clima/transporte; lavaRopa: solo dias) — ver los bloques dedicados
// más abajo, mucho más rápidos y con la misma cobertura real.
for (const dest of DEST_SUBSETS)
  for (const clima of CLIMA)
    for (const motivo of MOTIVO)
      for (const turismo of TURISMO)
        for (const aloj of ALOJ)
          for (const transporte of TRANSPORTE)
            for (const maletas of MALETA_SUBSETS)
              for (const vestidos of VESTIDOS)
                for (const dias of DIAS) {
                  combos++;
                  const form: TripFormState = {
                    name: 'QA',
                    dest,
                    clima,
                    motivo,
                    turismo,
                    aloj,
                    transporte,
                    maletas,
                    dias,
                    vestidos,
                    lavaRopa: false,
                    bebe: false,
                  };

                  const raw = buildRawItems(form);

                  // Invariante: la categoría "camping" aparece si y solo si el
                  // alojamiento es camping.
                  const hasCampingItems = raw.some((it) => it.cat === 'camping');
                  if (hasCampingItems !== (aloj === 'camping')) {
                    fail(form, `Categoría "camping": presente=${hasCampingItems} pero aloj=${aloj}`);
                  }

                  // Invariante: sin duplicados de nombre dentro de la misma categoría
                  const seenByCat = new Map<string, Set<string>>();
                  for (const it of raw) {
                    const set = seenByCat.get(it.cat) ?? new Set<string>();
                    if (set.has(it.name)) fail(form, `Nombre duplicado "${it.name}" en categoría "${it.cat}"`);
                    set.add(it.name);
                    seenByCat.set(it.cat, set);
                  }

                  // Invariante: toda cantidad >= 1
                  for (const it of raw) {
                    if (!(it.qty >= 1) || !Number.isInteger(it.qty)) {
                      fail(form, `Cantidad inválida (${it.qty}) para "${it.name}"`);
                    }
                  }

                  // Invariante: noQty siempre implica qty === 1
                  for (const it of raw) {
                    if (it.noQty && it.qty !== 1) {
                      fail(form, `Ítem noQty "${it.name}" con qty=${it.qty} (debería ser 1)`);
                    }
                  }

                  // Invariante: todo ítem de "ropa" está en ROPA_ORDER (si no, el sort
                  // lo manda al final silenciosamente y probablemente sea un typo nuevo)
                  for (const it of raw) {
                    if (it.cat === 'ropa' && !ROPA_ORDER.includes(it.name)) {
                      fail(form, `Ítem de ropa "${it.name}" no está en ROPA_ORDER`);
                    }
                  }

                  // Invariante: el orden de ropa respeta ROPA_ORDER (estable, ascendente)
                  const ropaNames = raw.filter((it) => it.cat === 'ropa').map((it) => it.name);
                  const ropaRanks = ropaNames.map((n) => ROPA_ORDER.indexOf(n));
                  for (let i = 1; i < ropaRanks.length; i++) {
                    if (ropaRanks[i] < ropaRanks[i - 1]) {
                      fail(form, `Orden de ropa incorrecto: "${ropaNames[i - 1]}" antes que "${ropaNames[i]}"`);
                      break;
                    }
                  }

                  // Invariante: buildHomeChecklist (tareas de "antes de salir de
                  // casa") siempre tiene ids únicos, labels no vacíos, y la tarea
                  // de la heladera aparece si y solo si el viaje dura 5+ días.
                  const homeChecklist = buildHomeChecklist(form);
                  const homeIds = new Set<string>();
                  for (const task of homeChecklist) {
                    if (homeIds.has(task.id)) fail(form, `Home checklist: id duplicado "${task.id}"`);
                    homeIds.add(task.id);
                    if (!task.label.trim()) fail(form, `Home checklist: label vacío (id=${task.id})`);
                  }
                  const hasHeladera = homeChecklist.some((t) => t.label.includes('heladera'));
                  if (hasHeladera !== dias >= 5) {
                    fail(form, `Home checklist: "heladera" presente=${hasHeladera} pero dias=${dias} (se espera solo con 5+)`);
                  }

                  // Ahora distribute.ts: contra CADA subconjunto de valijas (no solo el
                  // del form), reconstruyendo PackingItem-like objects.
                  const items = raw.map((it, i) => ({
                    id: `${i}-${it.cat}`,
                    cat: it.cat,
                    name: it.name,
                    qty: it.qty,
                    done: false,
                    noQty: it.noQty,
                  }));

                  // Invariante: quickGroupFor nunca devuelve un grupo inválido y la
                  // suma de ítems agrupados siempre cierra con el total (vista rápida)
                  const groupCounts = new Map<string, number>();
                  for (const it of items) {
                    const g = quickGroupFor(it);
                    if (!QUICK_GROUP_META[g]) {
                      fail(form, `quickGroupFor("${it.name}") devolvió un grupo inválido: ${g}`);
                    }
                    groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1);
                  }
                  const sumGrouped = [...groupCounts.values()].reduce((a, b) => a + b, 0);
                  if (sumGrouped !== items.length) {
                    fail(form, `Vista rápida: suma de grupos (${sumGrouped}) != total de ítems (${items.length})`);
                  }

                  for (const bags of MALETA_SUBSETS) {
                    distributionChecks++;
                    const dist = distributeItems(items, bags);

                    // Invariante: bolsas no seleccionadas quedan vacías
                    for (const bag of ALL_BAGS) {
                      if (!bags.includes(bag) && dist[bag].length > 0) {
                        fail(form, `Valija "${bag}" no seleccionada (bags=${bags}) mantiene ítems`);
                      }
                    }

                    // Invariante: la suma de qty distribuida por ítem == qty original
                    const totalByItemId = new Map<string, number>();
                    for (const bag of ALL_BAGS) {
                      for (const d of dist[bag]) {
                        totalByItemId.set(d.item.id, (totalByItemId.get(d.item.id) ?? 0) + d.qty);
                      }
                    }
                    for (const it of items) {
                      const total = totalByItemId.get(it.id) ?? 0;
                      if (total !== it.qty) {
                        fail(form, `Distribución no cuadra para "${it.name}" (qty=${it.qty}, repartido=${total}, bags=${bags})`);
                      }
                    }

                    // Invariante: docs/tech/ALWAYS_WITH_YOU nunca se dividen (isSplit=false)
                    // y van enteros en una sola valija
                    for (const bag of ALL_BAGS) {
                      for (const d of dist[bag]) {
                        const keepWithYou = d.item.cat === 'docs' || d.item.cat === 'tech' || ALWAYS_WITH_YOU.includes(d.item.name);
                        if (keepWithYou && d.isSplit) {
                          fail(form, `Ítem "with you" "${d.item.name}" aparece dividido (bags=${bags})`);
                        }
                      }
                    }

                    // Invariante: cada ítem aparece en al menos 1 valija (nunca se pierde)
                    for (const it of items) {
                      const appears = ALL_BAGS.some((bag) => dist[bag].some((d) => d.item.id === it.id));
                      if (!appears) fail(form, `Ítem "${it.name}" no aparece en ninguna valija (bags=${bags})`);
                    }
                  }
                }

// ============================================================
// Bloque dedicado: "bebe" — cruza solo contra los campos de los que
// depende su lógica (dest, clima, transporte), no contra todo.
// ============================================================
const BEBE_DIAS = [1, 5, 10, 30];
for (const dest of DEST_SUBSETS)
  for (const clima of CLIMA)
    for (const transporte of TRANSPORTE)
      for (const bebe of BEBE)
        for (const dias of BEBE_DIAS) {
          const form: TripFormState = {
            name: 'QA-bebe',
            dest,
            clima,
            motivo: 'placer',
            turismo: 'relax',
            aloj: 'depto',
            transporte,
            maletas: ['carry'],
            dias,
            vestidos: false,
            lavaRopa: false,
            bebe,
          };
          const raw = buildRawItems(form);
          const bebeItems = raw.filter((it) => it.cat === 'bebe');
          if (bebeItems.length > 0 !== bebe) {
            fail(form, `Categoría "bebe": presente=${bebeItems.length > 0} pero bebe=${bebe}`);
          }
          if (bebe) {
            const names = bebeItems.map((it) => it.name);
            if (new Set(names).size !== names.length) fail(form, `Categoría "bebe" tiene ítems duplicados: ${names}`);
            const hasButaca = names.includes('Butaca para auto');
            if (hasButaca !== (transporte === 'auto')) {
              fail(form, `"Butaca para auto" presente=${hasButaca} pero transporte=${transporte}`);
            }
            const hasTrajeBaño = names.includes('Traje de baño de bebé');
            if (hasTrajeBaño !== (dest.includes('playa') || clima === 'calor')) {
              fail(form, `"Traje de baño de bebé" presente=${hasTrajeBaño} pero dest=${dest} clima=${clima}`);
            }
          }
        }

// ============================================================
// Bloque dedicado: "lavaRopa" — su lógica depende solo de `dias`,
// así que alcanza con cruzarla contra eso.
// ============================================================
for (const dias of DIAS)
  for (const lavaRopa of LAVA_ROPA) {
    const form: TripFormState = {
      name: 'QA-lavaRopa',
      dest: ['ciudad'],
      clima: 'templado',
      motivo: 'placer',
      turismo: 'relax',
      aloj: 'depto',
      transporte: 'avion',
      maletas: ['carry'],
      dias,
      vestidos: false,
      lavaRopa,
      bebe: false,
    };
    const raw = buildRawItems(form);
    const tope = lavaRopa ? Math.min(dias, 4) : dias;
    for (const nombre of ['Remeras', 'Medias']) {
      const it = raw.find((r) => r.cat === 'ropa' && r.name === nombre);
      const esperado = Math.min(tope, 8);
      if (it && it.qty !== esperado) {
        fail(form, `lavaRopa=${lavaRopa}: "${nombre}" qty=${it.qty}, esperado ${esperado}`);
      }
    }
    const interior = raw.find((r) => r.cat === 'ropa' && r.name === 'Ropa interior');
    const esperadoInterior = Math.min(tope + 1, 10);
    if (interior && interior.qty !== esperadoInterior) {
      fail(form, `lavaRopa=${lavaRopa}: "Ropa interior" qty=${interior.qty}, esperado ${esperadoInterior}`);
    }
  }

console.log(`Combinaciones de formulario probadas: ${combos}`);
console.log(`Chequeos de distribución (combo x subconjunto de valijas): ${distributionChecks}`);
console.log(`Errores encontrados: ${errors.length}`);
if (errors.length > 0) {
  console.log('\n--- Primeros 40 errores ---');
  for (const e of errors.slice(0, 40)) console.log(e);
  process.exitCode = 1;
} else {
  console.log('OK: todas las invariantes se cumplieron en todas las combinaciones.');
}
