import { buildItems } from './buildItems';
import { buildBoatChecklist, buildHomeChecklist } from './homeTasks';
import type { HomeTask, PackingItem, Trip, TripFormState } from '../types';

/**
 * Editar las opciones de un viaje ya creado SIN perder el progreso.
 *
 * La lista se genera una sola vez al crear el viaje (ver buildItems); si
 * al editar se regenerara desde cero se perderían los tildes, las
 * cantidades ajustadas y los ítems propios. En cambio, se compara la
 * lista que corresponde a las opciones nuevas con la que ya tiene el
 * viaje, usando el nombre de cada ítem como identificador:
 *
 * - Lo que está en las dos se mantiene tal cual (tilde incluido). Su
 *   cantidad se actualiza a la nueva SOLO si no está tildado y la persona
 *   no la había tocado (si es igual a la que generaban las opciones viejas); si la
 *   ajustó a mano o con "Ajustar para que entre", se respeta.
 * - Lo nuevo se suma, sin tildar.
 * - Lo que ya no corresponde se saca, salvo que esté tildado (ya está en
 *   la valija) o que lo haya agregado la persona (nunca se tocan).
 *
 * Mismo criterio para las listas de casa y del barco.
 */
export interface MergeResult {
  trip: Trip;
  added: number;
  removed: number;
  /** Ítems que siguen pero con una cantidad nueva. */
  requantified: number;
}

let idCounter = 0;
const newId = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${prefix}-${Date.now()}-${idCounter++}`;

function mergeItems(current: PackingItem[], oldForm: TripFormState, newForm: TripFormState) {
  const oldGenQty = new Map(buildItems(oldForm).map((i) => [i.name, i.qty]));
  const generated = buildItems(newForm);
  const byName = new Map(current.filter((i) => !i.isCustom).map((i) => [i.name, i]));
  // Si la persona ya había agregado a mano algo que ahora se genera (ej.
  // "Paraguas plegable"), no se duplica: queda el suyo.
  const customNames = new Set(current.filter((i) => i.isCustom).map((i) => i.name));
  let added = 0;
  let requantified = 0;
  const used = new Set<string>();

  const next: PackingItem[] = [];
  for (const gen of generated) {
    // (solo si no estaba ya en el viaje: editar sin cambios no tiene que tocar nada)
    if (customNames.has(gen.name) && !byName.has(gen.name)) continue;
    next.push(mergeOne(gen));
  }
  function mergeOne(gen: PackingItem): PackingItem {
    const existing = byName.get(gen.name);
    if (!existing) {
      added++;
      return { ...gen, id: newId('item') };
    }
    used.add(existing.id);
    const untouched = oldGenQty.get(gen.name) === existing.qty;
    // Lo tildado tampoco cambia: ya está empacado con esa cantidad.
    if (untouched && !existing.done && existing.qty !== gen.qty && !existing.noQty) {
      requantified++;
      return { ...existing, qty: gen.qty };
    }
    return existing;
  }

  // Lo que no está en la lista nueva: se queda si es propio o si ya está
  // tildado (va al final; la checklist lo agrupa igual por categoría).
  let removed = 0;
  for (const item of current) {
    if (used.has(item.id)) continue;
    if (item.isCustom || item.done) next.push(item);
    else removed++;
  }
  return { items: next, added, removed, requantified };
}

function mergeTasks(current: HomeTask[], generated: HomeTask[]) {
  const byLabel = new Map(current.filter((t) => !t.isCustom).map((t) => [t.label, t]));
  const customLabels = new Set(current.filter((t) => t.isCustom).map((t) => t.label));
  const used = new Set<string>();
  let added = 0;
  const next: HomeTask[] = generated.filter((gen) => !customLabels.has(gen.label) || byLabel.has(gen.label)).map((gen) => {
    const existing = byLabel.get(gen.label);
    if (!existing) {
      added++;
      return { ...gen, id: newId('task') };
    }
    used.add(existing.id);
    return existing;
  });
  let removed = 0;
  for (const task of current) {
    if (used.has(task.id)) continue;
    if (task.isCustom || task.done) next.push(task);
    else removed++;
  }
  return { tasks: next, added, removed };
}

export function mergeTripForm(trip: Trip, newForm: TripFormState): MergeResult {
  const items = mergeItems(trip.items, trip.form, newForm);
  const home = mergeTasks(trip.homeChecklist, buildHomeChecklist(newForm));
  const boat = mergeTasks(trip.boatChecklist, buildBoatChecklist(newForm));
  return {
    trip: { ...trip, form: newForm, items: items.items, homeChecklist: home.tasks, boatChecklist: boat.tasks },
    added: items.added + home.added + boat.added,
    removed: items.removed + home.removed + boat.removed,
    requantified: items.requantified,
  };
}
