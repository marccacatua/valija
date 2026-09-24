import { buildRawItems, ROPA_ORDER } from '../src/data/buildItems';
import { distributeItems } from '../src/data/distribute';
import { buildBoatChecklist, buildHomeChecklist } from '../src/data/homeTasks';
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
const MASCOTA = [false, true];
const DEPORTE = [false, true];
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

const ALWAYS_WITH_YOU = [
  'Lentes de sol',
  'Cepillo de dientes',
  'Pasta de dientes (mini, <100 ml)',
  'Shampoo (mini, <100 ml)',
  'Almohada de viaje',
  'Libro o e-reader',
];

const errors: string[] = [];
let combos = 0;
let distributionChecks = 0;

function fail(f: TripFormState, msg: string) {
  errors.push(`${msg} | form=${JSON.stringify(f)}`);
}

// lavaRopa, bebe y mascota quedan FUERA del gran cruce combinatorio a
// propósito: cruzarlos contra las ~11 dimensiones existentes multiplicaba
// el total varias veces para probar campos cuya lógica depende de muy
// pocos otros campos (bebe: dest/clima/transporte; mascota: dest/
// transporte; lavaRopa: solo dias) — ver los bloques dedicados más
// abajo, mucho más rápidos y con la misma cobertura real.
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
                    clima: [clima],
                    motivo,
                    turismo: [turismo],
                    aloj,
                    transporte,
                    maletas,
                    dias,
                    vestidos,
                    lavaRopa: false,
                    bebe: false,
                    mascota: false,
                    deporte: false,
                    equipoPropio: false,
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

                  // Invariante: "Repelente" (higiene) aparece si y solo si aventura,
                  // playa o camping; el nombre viejo "Repelente industrial" ya no
                  // debería existir en ningún lado.
                  const leisure = motivo !== 'trabajo';
                  const expectRepelente = (leisure && turismo === 'aventura') || dest.includes('playa') || aloj === 'camping';
                  const hasRepelente = raw.some((it) => it.cat === 'higiene' && it.name === 'Repelente');
                  if (hasRepelente !== expectRepelente) {
                    fail(form, `"Repelente" presente=${hasRepelente} pero turismo=${turismo} dest=${dest} aloj=${aloj}`);
                  }
                  if (raw.some((it) => it.name === 'Repelente industrial')) {
                    fail(form, '"Repelente industrial" ya no debería generarse (se unificó en "Repelente")');
                  }

                  // Invariante: zapatillas cómodas para caminar — ciudad siempre las
                  // suma; sin ciudad, solo si es playa y el viaje dura 7+ días.
                  const expectZapatillas = dest.includes('ciudad') ? true : dest.includes('playa') && dias >= 7;
                  const hasZapatillas = raw.some((it) => it.name === 'Zapatillas cómodas para caminar');
                  if (hasZapatillas !== expectZapatillas) {
                    fail(form, `"Zapatillas cómodas para caminar" presente=${hasZapatillas} pero dest=${dest} dias=${dias}`);
                  }

                  // Invariante: candados — con bodega+carry van 2 candados nombrados
                  // (y nunca el genérico); si no, el genérico solo con hostel/mochila.
                  const rawNames = raw.map((it) => it.name);
                  const hasBothLocks = rawNames.includes('Candado para la valija de bodega') && rawNames.includes('Candado para el carry-on');
                  const hasGenericLock = rawNames.includes('Candado');
                  if (maletas.includes('bodega') && maletas.includes('carry')) {
                    if (!hasBothLocks || hasGenericLock) {
                      fail(form, `Se esperaban 2 candados nombrados (bodega+carry) y ninguno genérico; maletas=${maletas}`);
                    }
                  } else if (aloj === 'hostel' || maletas.includes('mochila')) {
                    if (!hasGenericLock || hasBothLocks) {
                      fail(form, `Se esperaba 1 candado genérico (hostel/mochila); maletas=${maletas} aloj=${aloj}`);
                    }
                  } else if (hasGenericLock || hasBothLocks) {
                    fail(form, `No se esperaba ningún candado; maletas=${maletas} aloj=${aloj}`);
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
                    const { byBag, campingItems } = distributeItems(items, bags);

                    // Invariante: bolsas no seleccionadas quedan vacías
                    for (const bag of ALL_BAGS) {
                      if (!bags.includes(bag) && byBag[bag].length > 0) {
                        fail(form, `Valija "${bag}" no seleccionada (bags=${bags}) mantiene ítems`);
                      }
                    }

                    // Invariante: los ítems de "camping" nunca entran en ninguna valija;
                    // van aparte, completos, en campingItems.
                    for (const bag of ALL_BAGS) {
                      if (byBag[bag].some((d) => d.item.cat === 'camping')) {
                        fail(form, `Ítem de camping asignado a una valija (bags=${bags})`);
                      }
                    }
                    const campingExpected = items.filter((it) => it.cat === 'camping').map((it) => it.name).sort();
                    const campingGot = campingItems.map((it) => it.name).sort();
                    if (JSON.stringify(campingExpected) !== JSON.stringify(campingGot)) {
                      fail(form, `campingItems (${campingGot}) no coincide con la categoría camping (${campingExpected})`);
                    }

                    const packableItems = items.filter((it) => it.cat !== 'camping');

                    // Invariante: la suma de qty distribuida por ítem == qty original
                    // (solo ítems "empacables" — camping queda afuera del reparto)
                    const totalByItemId = new Map<string, number>();
                    for (const bag of ALL_BAGS) {
                      for (const d of byBag[bag]) {
                        totalByItemId.set(d.item.id, (totalByItemId.get(d.item.id) ?? 0) + d.qty);
                      }
                    }
                    for (const it of packableItems) {
                      const total = totalByItemId.get(it.id) ?? 0;
                      if (total !== it.qty) {
                        fail(form, `Distribución no cuadra para "${it.name}" (qty=${it.qty}, repartido=${total}, bags=${bags})`);
                      }
                    }

                    // Invariante: docs/tech/ALWAYS_WITH_YOU nunca se dividen (isSplit=false)
                    // y van enteros en una sola valija
                    for (const bag of ALL_BAGS) {
                      for (const d of byBag[bag]) {
                        const keepWithYou = d.item.cat === 'docs' || d.item.cat === 'tech' || ALWAYS_WITH_YOU.includes(d.item.name);
                        if (keepWithYou && d.isSplit) {
                          fail(form, `Ítem "with you" "${d.item.name}" aparece dividido (bags=${bags})`);
                        }
                      }
                    }

                    // Invariante: cada ítem empacable aparece en al menos 1 valija
                    for (const it of packableItems) {
                      const appears = ALL_BAGS.some((bag) => byBag[bag].some((d) => d.item.id === it.id));
                      if (!appears) fail(form, `Ítem "${it.name}" no aparece en ninguna valija (bags=${bags})`);
                    }

                    // Invariante: los candados nombrados van a su valija dueña cuando
                    // esa valija está entre las elegidas.
                    const lockOwners: [string, MaletaKey][] = [
                      ['Candado para la valija de bodega', 'bodega'],
                      ['Candado para el carry-on', 'carry'],
                    ];
                    for (const [lockName, ownerBag] of lockOwners) {
                      const existsInTrip = items.some((it) => it.name === lockName);
                      if (existsInTrip && bags.includes(ownerBag)) {
                        const inOwner = byBag[ownerBag].some((d) => d.item.name === lockName);
                        if (!inOwner) fail(form, `"${lockName}" no quedó en "${ownerBag}" (bags=${bags})`);
                      }
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
            clima: [clima],
            motivo: 'placer',
            turismo: ['relax'],
            aloj: 'depto',
            transporte,
            maletas: ['carry'],
            dias,
            vestidos: false,
            lavaRopa: false,
            bebe,
            mascota: false,
            deporte: false,
            equipoPropio: false,
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
            const trajeBebe = bebeItems.find((it) => it.name === 'Traje de baño de bebé');
            const expectTraje = dest.includes('playa') || clima === 'calor';
            if (!!trajeBebe !== expectTraje) {
              fail(form, `"Traje de baño de bebé" presente=${!!trajeBebe} pero dest=${dest} clima=${clima}`);
            }
            if (trajeBebe && trajeBebe.qty !== 2) {
              fail(form, `"Traje de baño de bebé" qty=${trajeBebe.qty}, esperado 2`);
            }
            const hasChaleco = names.includes('Chaleco salvavidas de bebé');
            if (hasChaleco !== dest.includes('playa')) {
              fail(form, `"Chaleco salvavidas de bebé" presente=${hasChaleco} pero dest=${dest}`);
            }
          }
        }

// ============================================================
// Bloque dedicado: "mascota" — cruza solo contra los campos de los que
// depende su lógica (dest, transporte), no contra todo.
// ============================================================
for (const dest of DEST_SUBSETS)
  for (const transporte of TRANSPORTE)
    for (const mascota of MASCOTA)
      for (const dias of BEBE_DIAS) {
        const form: TripFormState = {
          name: 'QA-mascota',
          dest,
          clima: ['templado'],
          motivo: 'placer',
          turismo: ['relax'],
          aloj: 'depto',
          transporte,
          maletas: ['carry'],
          dias,
          vestidos: false,
          lavaRopa: false,
          bebe: false,
          mascota,
          deporte: false,
          equipoPropio: false,
        };
        const raw = buildRawItems(form);
        const mascotaItems = raw.filter((it) => it.cat === 'mascota');
        if (mascotaItems.length > 0 !== mascota) {
          fail(form, `Categoría "mascota": presente=${mascotaItems.length > 0} pero mascota=${mascota}`);
        }
        if (mascota) {
          const names = mascotaItems.map((it) => it.name);
          if (new Set(names).size !== names.length) fail(form, `Categoría "mascota" tiene ítems duplicados: ${names}`);
          const hasTransportadora = names.includes('Transportadora');
          if (hasTransportadora !== (transporte === 'avion')) {
            fail(form, `"Transportadora" presente=${hasTransportadora} pero transporte=${transporte}`);
          }
          const hasChaleco = names.includes('Chaleco salvavidas para mascota');
          if (hasChaleco !== dest.includes('playa')) {
            fail(form, `"Chaleco salvavidas para mascota" presente=${hasChaleco} pero dest=${dest}`);
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
      clima: ['templado'],
      motivo: 'placer',
      turismo: ['relax'],
      aloj: 'depto',
      transporte: 'avion',
      maletas: ['carry'],
      dias,
      vestidos: false,
      lavaRopa,
      bebe: false,
      mascota: false,
      deporte: false,
      equipoPropio: false,
    };
    const raw = buildRawItems(form);
    const mudaDias = lavaRopa ? Math.min(dias, 4) : dias;
    // Las remeras usan un tope propio, más alto que el resto de las mudas.
    const remerasDias = lavaRopa ? Math.min(dias, 6) : dias;

    const remeras = raw.find((r) => r.cat === 'ropa' && r.name === 'Remeras');
    const esperadoRemeras = Math.min(remerasDias, 8);
    if (remeras && remeras.qty !== esperadoRemeras) {
      fail(form, `lavaRopa=${lavaRopa}: "Remeras" qty=${remeras.qty}, esperado ${esperadoRemeras}`);
    }

    const medias = raw.find((r) => r.cat === 'ropa' && r.name === 'Medias');
    const esperadoMedias = Math.min(mudaDias, 8);
    if (medias && medias.qty !== esperadoMedias) {
      fail(form, `lavaRopa=${lavaRopa}: "Medias" qty=${medias.qty}, esperado ${esperadoMedias}`);
    }

    const interior = raw.find((r) => r.cat === 'ropa' && r.name === 'Ropa interior');
    const esperadoInterior = Math.min(mudaDias + 1, 10);
    if (interior && interior.qty !== esperadoInterior) {
      fail(form, `lavaRopa=${lavaRopa}: "Ropa interior" qty=${interior.qty}, esperado ${esperadoInterior}`);
    }

    // Lavando ropa, los pantalones no escalan con la duración (se reusan);
    // sin lavar, siguen el tope general de siempre.
    const pantalones = raw.find((r) => r.cat === 'ropa' && r.name === 'Pantalones');
    // Lavar ropa solo baja (tope 2), nunca sube: en 2-3 días sigue en 1.
    const sinLavar = Math.min(Math.max(1, Math.ceil(dias / 4)), 4);
    const esperadoPantalones = lavaRopa ? Math.min(sinLavar, 2) : sinLavar;
    if (lavaRopa) {
      const sinLavarQty = buildRawItems({ ...form, lavaRopa: false }).find((r) => r.name === 'Pantalones')?.qty ?? 0;
      if (pantalones && pantalones.qty > sinLavarQty) {
        fail(form, `Marcar "lavar ropa" SUBE los pantalones (${sinLavarQty} → ${pantalones.qty})`);
      }
    }
    if (pantalones && pantalones.qty !== esperadoPantalones) {
      fail(form, `lavaRopa=${lavaRopa}: "Pantalones" qty=${pantalones.qty}, esperado ${esperadoPantalones}`);
    }
  }

// ============================================================
// Bloque dedicado: "deporte" — cruza motivo/turismo (definen si ya
// aplica por "aventura"), clima (define la campera) y días (define
// cantidades), además del propio flag.
// ============================================================
const DEPORTE_DIAS = [1, 2, 3, 4, 5, 6, 10, 14];
for (const motivo of MOTIVO)
  for (const turismo of TURISMO)
    for (const clima of CLIMA)
      for (const deporte of DEPORTE)
        for (const dias of DEPORTE_DIAS) {
          const form: TripFormState = {
            name: 'QA-deporte',
            dest: ['ciudad'],
            clima: [clima],
            motivo,
            turismo: [turismo],
            aloj: 'depto',
            transporte: 'avion',
            maletas: ['carry'],
            dias,
            vestidos: false,
            lavaRopa: false,
            bebe: false,
            mascota: false,
            deporte,
            equipoPropio: false,
          };
          const raw = buildRawItems(form);
          const leisure = motivo !== 'trabajo';
          const haceDeporte = deporte || (leisure && turismo === 'aventura');
          const names = raw.filter((it) => it.cat === 'ropa').map((it) => it.name);

          const remeras = raw.find((it) => it.name === 'Remeras deportivas');
          if (!!remeras !== haceDeporte) {
            fail(form, `"Remeras deportivas" presente=${!!remeras} pero haceDeporte=${haceDeporte}`);
          }
          if (remeras) {
            const esperado = Math.min(Math.max(2, Math.ceil(dias / 2)), 5);
            if (remeras.qty !== esperado) fail(form, `"Remeras deportivas" qty=${remeras.qty}, esperado ${esperado}`);
          }

          const short = raw.find((it) => it.name === 'Short deportivo');
          if (!!short !== haceDeporte) {
            fail(form, `"Short deportivo" presente=${!!short} pero haceDeporte=${haceDeporte}`);
          }
          if (short) {
            const esperado = Math.min(Math.ceil(dias / 3), 3);
            if (short.qty !== esperado) fail(form, `"Short deportivo" qty=${short.qty}, esperado ${esperado}`);
          }

          const hasChampiones = names.includes('Championes para correr');
          if (hasChampiones !== haceDeporte) {
            fail(form, `"Championes para correr" presente=${hasChampiones} pero haceDeporte=${haceDeporte}`);
          }

          const hasCampera = names.includes('Campera liviana para correr');
          const expectCampera = haceDeporte && (clima === 'frio' || clima === 'lluvia');
          if (hasCampera !== expectCampera) {
            fail(form, `"Campera liviana para correr" presente=${hasCampera} pero haceDeporte=${haceDeporte} clima=${clima}`);
          }

          // Sin duplicados aunque se solape deporte=true con turismo=aventura.
          if (new Set(names).size !== names.length) {
            fail(form, `Categoría "ropa" tiene ítems duplicados (deporte+aventura solapados): ${names}`);
          }
        }

// ============================================================
// Bloque dedicado: "ski" — turismo === 'ski' no va al cruce grande (mismo
// criterio que "deporte": efecto acotado, no interactúa con las otras
// ~11 dimensiones). Cruza motivo (define `leisure`), turismo (ski vs
// baseline), lavaRopa (compite con la reducción propia de ski por la
// ropa "más restrictiva"), clima (el protector solar tiene que sumar
// pase lo que pase) y días.
// ============================================================
const SKI_DIAS = [1, 2, 3, 4, 5, 6, 8, 10, 14];
for (const motivo of MOTIVO)
  for (const turismo of ['relax', 'ski'] as TurismoKey[])
    for (const lavaRopa of LAVA_ROPA)
      for (const clima of ['frio', 'calor', 'lluvia'] as ClimaKey[])
        for (const dias of SKI_DIAS)
          for (const equipoPropio of [false, true]) {
          const form: TripFormState = {
            name: 'QA-ski',
            dest: ['montana'],
            clima: [clima],
            motivo,
            turismo: [turismo],
            aloj: 'depto',
            transporte: 'avion',
            maletas: ['carry'],
            dias,
            vestidos: false,
            lavaRopa,
            bebe: false,
            mascota: false,
            deporte: false,
            equipoPropio,
          };
          const raw = buildRawItems(form);
          const isSki = motivo !== 'trabajo' && turismo === 'ski';
          // Esquís/botas/casco solo con equipo propio (por defecto se alquilan).
          const skiGear = ['Casco', 'Botas de esquí', 'Esquís y bastones (o tabla de snowboard)'];
          for (const g of skiGear) {
            const has = raw.some((it) => it.cat === 'ski' && it.name === g);
            if (has !== (isSki && equipoPropio)) fail(form, `"${g}" presente=${has} pero isSki=${isSki} equipoPropio=${equipoPropio}`);
          }
          const skiItems = raw.filter((it) => it.cat === 'ski');
          if (skiItems.length > 0 !== isSki) {
            fail(form, `Categoría "ski": presente=${skiItems.length > 0} pero isSki=${isSki}`);
          }
          if (isSki) {
            const names = skiItems.map((it) => it.name);
            if (new Set(names).size !== names.length) fail(form, `Categoría "ski" tiene ítems duplicados: ${names}`);

            const piel = skiItems.find((it) => it.name === 'Primera piel térmica (parte de arriba)');
            const esperadoPiel = Math.min(Math.max(2, Math.ceil(dias / 3)), 4);
            if (piel && piel.qty !== esperadoPiel) fail(form, `"Primera piel térmica" qty=${piel.qty}, esperado ${esperadoPiel}`);

            const medias = skiItems.find((it) => it.name === 'Medias de ski');
            const esperadoMedias = Math.min(Math.max(2, dias), 6);
            if (medias && medias.qty !== esperadoMedias) fail(form, `"Medias de ski" qty=${medias.qty}, esperado ${esperadoMedias}`);

            // La ropa de calle baja de tope con ski, sin importar lavaRopa
            // (gana la más restrictiva) — nunca por encima de 4/2.
            const remeras = raw.find((it) => it.cat === 'ropa' && it.name === 'Remeras');
            const pantalones = raw.find((it) => it.cat === 'ropa' && it.name === 'Pantalones');
            if (remeras && remeras.qty > 4) fail(form, `Con ski, "Remeras" no debería superar 4 (qty=${remeras.qty})`);
            if (pantalones && pantalones.qty > 2) fail(form, `Con ski, "Pantalones" no debería superar 2 (qty=${pantalones.qty})`);

            // Con esquí, las medias comunes quedan en 3 como máximo (las de
            // pista son "Medias de ski").
            const mediasComunes = raw.find((it) => it.cat === 'ropa' && it.name === 'Medias');
            if (mediasComunes && mediasComunes.qty > 3) fail(form, `Con ski, "Medias" comunes no debería superar 3 (qty=${mediasComunes.qty})`);

            // Sin duplicados de abrigo: lo que el equipo de ski ya cubre no
            // se repite en la ropa de calle. Lo que se usa fuera de la pista
            // (campera abrigada, gorro y guantes) sí se mantiene con frío.
            for (const dup of ['Bufanda', 'Botas o calzado de abrigo', 'Rompeviento impermeable', 'Zapatillas de trekking']) {
              if (raw.some((it) => it.name === dup)) fail(form, `Con ski no debería aparecer "${dup}" (lo cubre el equipo de ski)`);
            }
            if (clima === 'frio') {
              for (const keep of ['Campera abrigada', 'Gorro y guantes']) {
                if (!raw.some((it) => it.name === keep)) fail(form, `Con ski y frío se esperaba "${keep}" para fuera de la pista`);
              }
              const buzos = raw.find((it) => it.name === 'Buzos');
              if (buzos?.qty !== 1) fail(form, `Con ski y frío, "Buzos" debería ser 1 (qty=${buzos?.qty})`);
            }

            // El protector solar suma pase lo que pase el clima elegido.
            const hasSolar = raw.some((it) => it.cat === 'higiene' && it.name === 'Protector solar');
            if (!hasSolar) fail(form, `Con ski (clima=${clima}) se esperaba "Protector solar" en higiene`);
          }
        }

// ============================================================
// Bloque dedicado: "navegar" — mismo criterio que "ski": cruza motivo,
// turismo (navegar vs baseline), clima y días. También valida que
// `buildHomeChecklist` siga generando datos IGUAL con navegar (a nivel
// de datos no cambia nada — lo único que cambia es que la UI prioriza
// mostrar el barco por encima de la casa cuando hay boatChecklist, ver
// Checklist.tsx) y que `boatChecklist` aparezca solo con navegar.
// ============================================================
const NAVEGAR_DIAS = [1, 3, 5, 10];
for (const motivo of MOTIVO)
  for (const turismo of ['relax', 'navegar'] as TurismoKey[])
    for (const clima of ['frio', 'calor'] as ClimaKey[])
      for (const dias of NAVEGAR_DIAS) {
        const form: TripFormState = {
          name: 'QA-navegar',
          dest: ['playa'],
          clima: [clima],
          motivo,
          turismo: [turismo],
          aloj: 'depto',
          transporte: 'avion',
          maletas: ['carry'],
          dias,
          vestidos: false,
          lavaRopa: false,
          bebe: false,
          mascota: false,
          deporte: false,
          equipoPropio: false,
        };
        const raw = buildRawItems(form);
        const isNavegar = motivo !== 'trabajo' && turismo === 'navegar';
        const nauticaItems = raw.filter((it) => it.cat === 'nautica');
        if (nauticaItems.length > 0 !== isNavegar) {
          fail(form, `Categoría "nautica": presente=${nauticaItems.length > 0} pero isNavegar=${isNavegar}`);
        }
        if (isNavegar) {
          const names = nauticaItems.map((it) => it.name);
          if (new Set(names).size !== names.length) fail(form, `Categoría "nautica" tiene ítems duplicados: ${names}`);

          // Reusa "Rompeviento impermeable" y "Protector solar" en vez de
          // crear versiones propias — tienen que sumar pase lo que pase
          // clima/dest (acá clima=calor, dest=playa, ninguno los gatilla
          // por su cuenta).
          const hasRompeviento = raw.some((it) => it.cat === 'ropa' && it.name === 'Rompeviento impermeable');
          if (!hasRompeviento) fail(form, `Con navegar (clima=${clima}) se esperaba "Rompeviento impermeable"`);
          const hasSolar = raw.some((it) => it.cat === 'higiene' && it.name === 'Protector solar');
          if (!hasSolar) fail(form, `Con navegar (clima=${clima}) se esperaba "Protector solar" en higiene`);
        }

        // homeChecklist sigue existiendo igual, navegar no la reemplaza.
        const homeChecklist = buildHomeChecklist(form);
        if (homeChecklist.length === 0) fail(form, 'homeChecklist no debería quedar vacía con navegar');

        const boatChecklist = buildBoatChecklist(form);
        if (boatChecklist.length > 0 !== isNavegar) {
          fail(form, `boatChecklist: presente=${boatChecklist.length > 0} pero isNavegar=${isNavegar}`);
        }
        if (isNavegar) {
          const ids = boatChecklist.map((t) => t.id);
          if (new Set(ids).size !== ids.length) fail(form, `boatChecklist tiene ids duplicados: ${ids}`);
          if (boatChecklist.some((t) => !t.label.trim())) fail(form, 'boatChecklist tiene un label vacío');
        }
      }

// ============================================================
// Bloque dedicado: "buceo" — mismo criterio que ski/navegar. Cruza
// motivo, turismo (buceo vs baseline) y los 4 climas (el traje de
// neopreno depende de la temperatura, a diferencia de ski/navegar que
// no varían por clima) y días.
// ============================================================
const BUCEO_DIAS = [1, 3, 7];
for (const motivo of MOTIVO)
  for (const turismo of ['relax', 'buceo'] as TurismoKey[])
    for (const clima of CLIMA)
      for (const dias of BUCEO_DIAS)
        for (const equipoPropio of [false, true]) {
        const form: TripFormState = {
          name: 'QA-buceo',
          dest: ['playa'],
          clima: [clima],
          motivo,
          turismo: [turismo],
          aloj: 'depto',
          transporte: 'avion',
          maletas: ['carry'],
          dias,
          vestidos: false,
          lavaRopa: false,
          bebe: false,
          mascota: false,
          deporte: false,
          equipoPropio,
        };
        const raw = buildRawItems(form);
        const isBuceo = motivo !== 'trabajo' && turismo === 'buceo';
        const buceoItems = raw.filter((it) => it.cat === 'buceo');
        if (buceoItems.length > 0 !== isBuceo) {
          fail(form, `Categoría "buceo": presente=${buceoItems.length > 0} pero isBuceo=${isBuceo}`);
        }
        if (isBuceo) {
          const names = buceoItems.map((it) => it.name);
          if (new Set(names).size !== names.length) fail(form, `Categoría "buceo" tiene ítems duplicados: ${names}`);
          // 6 de uso personal siempre + 4 de equipo pesado (traje, BCD,
          // regulador, aletas) solo si lleva equipo propio.
          const esperados = equipoPropio ? 10 : 6;
          if (buceoItems.length !== esperados) fail(form, `Categoría "buceo" esperaba ${esperados} ítems, tiene ${buceoItems.length}: ${names}`);
          for (const g of ['Chaleco compensador (BCD)', 'Regulador y octopus', 'Aletas de buceo']) {
            if (names.includes(g) !== equipoPropio) fail(form, `"${g}" presente=${names.includes(g)} pero equipoPropio=${equipoPropio}`);
          }
          if (names.some((n) => /tubo|lastre|plomo/i.test(n))) fail(form, 'Tubo y lastre se alquilan siempre, no deberían listarse');

          // El traje de neopreno depende del clima — exactamente uno de
          // los 3 con equipo propio, ninguno si se alquila.
          const trajes = names.filter((n) => n.startsWith('Traje de neopreno'));
          if (trajes.length !== (equipoPropio ? 1 : 0)) fail(form, `Se esperaban ${equipoPropio ? 1 : 0} trajes de neopreno, hay ${trajes.length}: ${trajes}`);
          const esperado =
            clima === 'frio'
              ? 'Traje de neopreno grueso (7mm) o semiseco'
              : clima === 'calor'
                ? 'Traje de neopreno fino (3mm) o shorty'
                : 'Traje de neopreno intermedio (5mm)';
          if (equipoPropio && trajes[0] !== esperado) fail(form, `Con clima=${clima} se esperaba "${esperado}", vino "${trajes[0]}"`);

          const hasSolar = raw.some((it) => it.cat === 'higiene' && it.name === 'Protector solar');
          if (!hasSolar) fail(form, `Con buceo (clima=${clima}) se esperaba "Protector solar" en higiene`);
          const hasVaselina = raw.some((it) => it.cat === 'higiene' && it.name.startsWith('Vaselina'));
          if (!hasVaselina) fail(form, 'Con buceo se esperaba "Vaselina" en higiene');
          const hasCert = raw.some((it) => it.cat === 'docs' && it.name.startsWith('Certificación de buceo'));
          if (!hasCert) fail(form, 'Con buceo se esperaba la certificación en docs');
        } else {
          const hasVaselina = raw.some((it) => it.name.startsWith('Vaselina'));
          if (hasVaselina) fail(form, 'Sin buceo, no debería aparecer "Vaselina"');
        }
      }

// ============================================================
// Bloque dedicado: clima y turismo múltiples. Propiedad central: un viaje
// con varias opciones incluye todo lo que tendría cada opción por
// separado (la lista SUMA), salvo los reemplazos documentados:
// - con frío, el buzo liviano de "templado" sobra (ya hay buzos);
// - con esquí, lo que cubre su equipo (bufanda, botas de abrigo, trekking
//   por montaña, rompeviento salvo navegando);
// - en buceo va un solo traje: el del clima más frío.
// ============================================================
{
  const subsets = <T,>(xs: T[], maxSize: number): T[][] => {
    const out: T[][] = [];
    const rec = (start: number, acc: T[]) => {
      if (acc.length > 0) out.push([...acc]);
      if (acc.length === maxSize) return;
      for (let i = start; i < xs.length; i++) rec(i + 1, [...acc, xs[i]]);
    };
    rec(0, []);
    return out;
  };
  const TURISMOS: TurismoKey[] = ['relax', 'aventura', 'cultura', 'fiesta', 'ski', 'navegar', 'buceo'];
  const WETSUITS = ['Traje de neopreno grueso (7mm) o semiseco', 'Traje de neopreno intermedio (5mm)', 'Traje de neopreno fino (3mm) o shorty'];
  for (const climas of subsets(CLIMA, 4))
    for (const turismos of subsets(TURISMOS, 2))
      for (const equipoPropio of [false, true]) {
        const base: TripFormState = {
          name: 'QA-multi', dest: ['playa', 'montana'], clima: climas, motivo: 'placer', turismo: turismos, aloj: 'hotel',
          transporte: 'avion', maletas: ['carry'], dias: 7, vestidos: false, lavaRopa: false, bebe: false, mascota: false,
          deporte: false, equipoPropio,
        };
        combos++;
        const multi = new Set(buildRawItems(base).map((r) => r.name));
        const isSki = turismos.includes('ski');
        const excluded = new Set<string>(WETSUITS);
        if (climas.includes('frio')) excluded.add('Buzo o campera liviana');
        if (isSki) {
          for (const n of ['Bufanda', 'Botas o calzado de abrigo', 'Zapatillas de trekking']) excluded.add(n);
          if (!turismos.includes('navegar')) excluded.add('Rompeviento impermeable');
        }
        if (turismos.includes('aventura')) excluded.delete('Zapatillas de trekking');
        for (const c of climas)
          for (const t of turismos) {
            const single = buildRawItems({ ...base, clima: [c], turismo: [t] });
            for (const r of single) {
              if (!multi.has(r.name) && !excluded.has(r.name)) {
                fail(base, `Con clima=[${climas}] turismo=[${turismos}] falta "${r.name}" (aparece con clima=${c}, turismo=${t})`);
              }
            }
          }
        // Buceo con equipo propio: un solo traje, el del clima más frío.
        const suits = WETSUITS.filter((w) => multi.has(w));
        if (turismos.includes('buceo') && equipoPropio) {
          const expected = climas.includes('frio') ? WETSUITS[0] : climas.includes('templado') || climas.includes('lluvia') ? WETSUITS[1] : WETSUITS[2];
          if (suits.length !== 1 || suits[0] !== expected) fail(base, `Buceo con clima=[${climas}]: trajes=${suits}, esperado ${expected}`);
        } else if (suits.length > 0) {
          fail(base, `Sin buceo con equipo propio no debería haber traje de neopreno (${suits})`);
        }
        // Esquí + otra actividad: la ropa de calle NO baja (los otros días se usa).
        if (isSki && turismos.length > 1) {
          const other = turismos.find((t) => t !== 'ski')!;
          const remerasMulti = buildRawItems(base).find((r) => r.name === 'Remeras')?.qty;
          const remerasOther = buildRawItems({ ...base, turismo: [other] }).find((r) => r.name === 'Remeras')?.qty;
          if (remerasMulti !== remerasOther) fail(base, `Esquí + ${other}: Remeras=${remerasMulti}, esperado ${remerasOther} (sin el tope de solo-esquí)`);
        }
        // La lista del barco aparece si y solo si navegar está entre los elegidos.
        const boat = buildBoatChecklist(base);
        if ((boat.length > 0) !== turismos.includes('navegar')) fail(base, `boatChecklist=${boat.length} con turismo=[${turismos}]`);
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
