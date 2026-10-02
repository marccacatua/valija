import { buildItems } from './buildItems';
import { buildBoatChecklist, buildHomeChecklist } from './homeTasks';
import type { HomeTask, PackingItem, Trip, TripTemplate } from '../types';

/**
 * Plantillas de viaje: guardar un viaje para repetirlo de un toque
 * (ej. "Trabajo BsAs" cada dos meses).
 *
 * Se guardan las opciones del formulario, no la lista: al usarla, la
 * lista se vuelve a generar (con las mejoras que la app haya tenido desde
 * entonces) y encima se aplica lo que la persona había cambiado a mano:
 * sus ítems y tareas propios, las cantidades que ajustó y los ítems que
 * borró.
 */

export interface TripChanges {
  customItems: TripTemplate['customItems'];
  customHomeTasks: string[];
  customBoatTasks: string[];
  qtyChanges: Record<string, number>;
  removedItems: string[];
}

/** Lo que este viaje tiene distinto de lo que generan sus opciones. */
export function tripChanges(trip: Trip): TripChanges {
  const generated = buildItems(trip.form);
  const current = new Map(trip.items.filter((i) => !i.isCustom).map((i) => [i.name, i]));
  const qtyChanges: Record<string, number> = {};
  const removedItems: string[] = [];
  for (const gen of generated) {
    const mine = current.get(gen.name);
    if (!mine) removedItems.push(gen.name);
    else if (!gen.noQty && mine.qty !== gen.qty) qtyChanges[gen.name] = mine.qty;
  }
  return {
    customItems: trip.items.filter((i) => i.isCustom).map((i) => ({ cat: i.cat, name: i.name, qty: i.qty })),
    customHomeTasks: trip.homeChecklist.filter((t) => t.isCustom).map((t) => t.label),
    customBoatTasks: trip.boatChecklist.filter((t) => t.isCustom).map((t) => t.label),
    qtyChanges,
    removedItems,
  };
}

/** Arma la plantilla. `withCustom` / `withChanges` vienen de los tildes
 * de la hoja "Guardar como plantilla de viaje". */
export function templateFromTrip(trip: Trip, name: string, withCustom: boolean, withChanges: boolean): TripTemplate {
  const changes = tripChanges(trip);
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    form: { ...trip.form, name: name.trim() },
    customItems: withCustom ? changes.customItems : [],
    customHomeTasks: withCustom ? changes.customHomeTasks : [],
    customBoatTasks: withCustom ? changes.customBoatTasks : [],
    qtyChanges: withChanges ? changes.qtyChanges : {},
    removedItems: withChanges ? changes.removedItems : [],
  };
}

const newId = () => crypto.randomUUID();

function withCustomTasks(generated: HomeTask[], custom: string[]): HomeTask[] {
  const labels = new Set(generated.map((t) => t.label));
  return [
    ...generated,
    ...custom.filter((l) => !labels.has(l)).map((label) => ({ id: newId(), label, done: false, isCustom: true })),
  ];
}

/** Viaje nuevo, sin tildar, a partir de una plantilla. */
export function tripFromTemplate(tpl: TripTemplate): Trip {
  const form = { ...tpl.form, name: tpl.name };
  const removed = new Set(tpl.removedItems);
  const generated: PackingItem[] = buildItems(form)
    .filter((i) => !removed.has(i.name))
    .map((i) => (i.name in tpl.qtyChanges ? { ...i, qty: tpl.qtyChanges[i.name] } : i));
  const names = new Set(generated.map((i) => i.name));
  const custom: PackingItem[] = tpl.customItems
    .filter((c) => !names.has(c.name))
    .map((c) => ({ id: newId(), cat: c.cat, name: c.name, qty: c.qty, done: false, isCustom: true }));
  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    form,
    items: [...generated, ...custom],
    homeChecklist: withCustomTasks(buildHomeChecklist(form), tpl.customHomeTasks),
    boatChecklist: withCustomTasks(buildBoatChecklist(form), tpl.customBoatTasks),
  };
}
