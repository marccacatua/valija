import type { MaletaKey, PackingItem } from '../types';
import { BAG_CAPACITY_L, isSeparateItem, itemLiters, wornItemIds } from './volume';

export interface DistributedItem {
  item: PackingItem;
  qty: number;
  /** true si esta es una porción separada del ítem (el resto va en otra valija). */
  isSplit: boolean;
}

/**
 * Recomendación de en qué valija va cada ítem, cuando el viaje usa más de
 * una. No modifica los ítems reales de la checklist (que siguen siendo un
 * único renglón con una sola cantidad) — es una vista derivada, de solo
 * lectura, pensada para el momento de armar las valijas. Lo que no va
 * dentro de ninguna valija (camping, cochecito, butaca, transportadora,
 * esquís: ver `SEPARATE_ITEMS` en volume.ts) queda afuera del reparto, en
 * `separateItems`.
 *
 * Reglas:
 * - Documentos, electrónica y algunos ítems puntuales que siempre conviene
 *   tener a mano (ver ALWAYS_WITH_YOU) van en la mochila, o el carry-on si
 *   no hay mochila: es lo que llevás encima, no lo que va bajo el avión.
 *   Se mantiene liviana a propósito, no le mandamos ropa "de respaldo".
 * - Algunos ítems puntuales tienen una valija "dueña" fija (ver
 *   PREFERRED_BAG) en vez de seguir la regla general — hoy solo los
 *   candados nombrados por valija (uno para bodega, otro para el carry).
 * - Todo lo demás (ropa, higiene, extras) va a la valija "principal":
 *   bodega si hay, si no carry-on, si no mochila.
 * - Si hay bodega en la mezcla y además otra valija (carry-on o mochila,
 *   en ese orden) y algún ítem tiene más de 1 unidad, se separa ~20% como
 *   "respaldo" en el carry-on (nunca en la mochila) — es la valija
 *   pensada para una muda de repuesto por si se pierde o demora la
 *   bodega.
 * - Espacio (ver volume.ts): cada valija tiene una capacidad en litros.
 *   Si una se pasa y otra tiene lugar, se mueven ítems enteros, los más
 *   grandes primero, hasta que entre.
 */
// Ítems que van "con vos" sin importar su categoría (no son documentos ni
// electrónica, pero tampoco tiene sentido facturarlos): se usan en el
// momento, no querés depender de la bodega para tenerlos a mano.
const ALWAYS_WITH_YOU = [
  'Lentes de sol',
  'Cepillo de dientes',
  'Pasta de dientes (mini, <100 ml)',
  'Shampoo (mini, <100 ml)',
  'Almohada de viaje',
  'Libro o e-reader',
];

// Ítems con una valija "dueña" fija, sin importar la regla general de
// principal/respaldo: cada candado nombrado va a la valija que protege.
const PREFERRED_BAG: Partial<Record<string, MaletaKey>> = {
  'Candado para la valija de bodega': 'bodega',
  'Candado para el carry-on': 'carry',
};

export interface Distribution {
  byBag: Record<MaletaKey, DistributedItem[]>;
  /** Lo que no va dentro de ninguna valija (camping, cochecito, butaca,
   * transportadora, esquís) — ver `SEPARATE_ITEMS` en volume.ts. */
  separateItems: PackingItem[];
  /** Litros estimados que ocupa cada valija, ya descontando lo que se
   * lleva puesto. */
  loads: Record<MaletaKey, number>;
}

const BAG_ORDER: MaletaKey[] = ['carry', 'bodega', 'mochila'];

function computeLoads(byBag: Record<MaletaKey, DistributedItem[]>, worn: Set<string>): Record<MaletaKey, number> {
  const loads: Record<MaletaKey, number> = { carry: 0, bodega: 0, mochila: 0 };
  const deducted = new Set<string>();
  for (const bag of BAG_ORDER) {
    for (const d of byBag[bag]) {
      const unit = itemLiters(d.item);
      let qty = d.qty;
      if (worn.has(d.item.id) && !deducted.has(d.item.id) && qty > 0) {
        qty -= 1;
        deducted.add(d.item.id);
      }
      loads[bag] += unit * qty;
    }
  }
  return loads;
}

export function distributeItems(items: PackingItem[], bags: MaletaKey[]): Distribution {
  const byBag: Record<MaletaKey, DistributedItem[]> = { carry: [], bodega: [], mochila: [] };
  const separateItems = items.filter(isSeparateItem);
  const packable = items.filter((i) => !isSeparateItem(i));
  const worn = wornItemIds(packable);
  if (bags.length === 0) return { byBag, separateItems, loads: computeLoads(byBag, worn) };

  const withYouOrder: MaletaKey[] = (['mochila', 'carry', 'bodega'] as MaletaKey[]).filter((b) => bags.includes(b));
  const primaryOrder: MaletaKey[] = (['bodega', 'carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const backupOrder: MaletaKey[] = (['carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const withYou = withYouOrder[0] ?? bags[0];
  const primary = primaryOrder[0] ?? bags[0];
  const backupBag = backupOrder.find((b) => b !== primary) ?? withYou;

  const isPinned = (item: PackingItem) =>
    (PREFERRED_BAG[item.name] !== undefined && bags.includes(PREFERRED_BAG[item.name]!)) ||
    item.cat === 'docs' ||
    item.cat === 'tech' ||
    ALWAYS_WITH_YOU.includes(item.name);

  for (const item of packable) {
    const preferred = PREFERRED_BAG[item.name];
    if (preferred && bags.includes(preferred)) {
      byBag[preferred].push({ item, qty: item.qty, isSplit: false });
      continue;
    }

    const keepWithYou = item.cat === 'docs' || item.cat === 'tech' || ALWAYS_WITH_YOU.includes(item.name);
    if (keepWithYou) {
      byBag[withYou].push({ item, qty: item.qty, isSplit: false });
      continue;
    }

    const canSplit = item.qty > 1 && bags.includes('bodega') && bags.length > 1 && primary === 'bodega';
    if (canSplit) {
      const backupQty = Math.max(1, Math.round(item.qty * 0.2));
      const mainQty = item.qty - backupQty;
      byBag[primary].push({ item, qty: mainQty, isSplit: true });
      byBag[backupBag].push({ item, qty: backupQty, isSplit: true });
      continue;
    }

    byBag[primary].push({ item, qty: item.qty, isSplit: false });
  }

  // Si una valija se pasa de su capacidad y otra tiene lugar, se mueven
  // ítems enteros (los más grandes primero) hasta que entre. No se mueve
  // lo que tiene un lugar fijo (documentos, electrónica, lo que va "con
  // vos", candados) ni lo que ya está repartido entre dos valijas.
  let loads = computeLoads(byBag, worn);
  for (const source of bags) {
    const movable = byBag[source]
      .filter((d) => !d.isSplit && !isPinned(d.item))
      .sort((a, b) => itemLiters(b.item) * b.qty - itemLiters(a.item) * a.qty);
    for (const d of movable) {
      if (loads[source] <= BAG_CAPACITY_L[source]) break;
      const size = itemLiters(d.item) * d.qty;
      const target = BAG_ORDER.find((b) => b !== source && bags.includes(b) && loads[b] + size <= BAG_CAPACITY_L[b]);
      if (!target) continue;
      byBag[source] = byBag[source].filter((x) => x !== d);
      byBag[target].push(d);
      loads = computeLoads(byBag, worn);
    }
  }

  return { byBag, separateItems, loads };
}

export interface SpaceSummary {
  usedL: number;
  capacityL: number;
  /** Porcentaje total (puede pasar de 100). */
  pct: number;
  perBag: { bag: MaletaKey; usedL: number; capacityL: number; pct: number }[];
  /** true si alguna valija no alcanza, aun después de repartir. */
  overflow: boolean;
}

/** Cuánto ocupa el viaje en las valijas elegidas. */
export function spaceSummary(items: PackingItem[], bags: MaletaKey[]): SpaceSummary {
  const { loads } = distributeItems(items, bags);
  const perBag = bags.map((bag) => ({
    bag,
    usedL: loads[bag],
    capacityL: BAG_CAPACITY_L[bag],
    pct: Math.round((100 * loads[bag]) / BAG_CAPACITY_L[bag]),
  }));
  const usedL = perBag.reduce((s, b) => s + b.usedL, 0);
  const capacityL = perBag.reduce((s, b) => s + b.capacityL, 0);
  return {
    usedL,
    capacityL,
    pct: capacityL > 0 ? Math.round((100 * usedL) / capacityL) : 0,
    perBag,
    overflow: perBag.some((b) => b.usedL > b.capacityL + 0.01),
  };
}

/**
 * Prendas que se pueden llevar en menos cantidad si no entra todo (se lavan
 * y se repiten), con el mínimo razonable de cada una. Lo que no está acá
 * (documentos, abrigo, calzado, equipo) no se toca: bajarlo no tiene
 * sentido o no se puede.
 */
const REDUCIBLE_MIN: Record<string, number> = {
  Remeras: 3,
  'Ropa interior': 4,
  Medias: 3,
  Pantalones: 1,
  'Shorts o bermudas': 1,
  'Remeras deportivas': 2,
  'Short deportivo': 1,
  Buzos: 1,
  Camisas: 1,
  'Outfit para salir': 1,
  'Vestido o pollera': 1,
  Pijama: 1,
  'Traje de baño': 1,
  'Mudas de ropa de bebé': 4,
  'Pijamas de bebé': 1,
  'Traje de baño de bebé': 1,
  'Medias de ski': 3,
  'Primera piel térmica (parte de arriba)': 2,
  'Primera piel térmica (parte de abajo)': 2,
  'Segunda capa de polar': 1,
};

export interface FitPlan {
  /** Cantidad nueva por id de ítem (solo los que cambian). */
  qtys: Record<string, number>;
  /** Cuántas prendas en total se sacan. */
  removed: number;
  /** true si con esos cambios todo entra en las valijas elegidas. */
  fits: boolean;
}

/**
 * "Ajustar cantidades para que entre": baja de a una unidad la prenda
 * reducible más voluminosa (así se sacan las menos piezas posibles) hasta
 * que todo entra o todas llegan a su mínimo. Nunca toca lo que ya está
 * tildado (ya está en la valija). Función pura: no cambia nada, devuelve
 * el plan para aplicarlo (y poder deshacerlo).
 */
export function fitToBags(items: PackingItem[], bags: MaletaKey[]): FitPlan {
  const working = items.map((i) => ({ ...i }));
  let removed = 0;
  let summary = spaceSummary(working, bags);
  while (summary.overflow) {
    const candidates = working.filter((i) => !i.done && i.name in REDUCIBLE_MIN && i.qty > REDUCIBLE_MIN[i.name]);
    if (candidates.length === 0) break;
    candidates.sort((a, b) => itemLiters(b) - itemLiters(a));
    candidates[0].qty -= 1;
    removed += 1;
    summary = spaceSummary(working, bags);
  }
  const qtys: Record<string, number> = {};
  for (const w of working) {
    const orig = items.find((i) => i.id === w.id)!;
    if (orig.qty !== w.qty) qtys[w.id] = w.qty;
  }
  return { qtys, removed, fits: !summary.overflow };
}
