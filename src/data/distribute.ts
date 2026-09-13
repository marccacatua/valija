import type { MaletaKey, PackingItem } from '../types';

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
 * lectura, pensada para el momento de armar las valijas. Los ítems de la
 * categoría "camping" quedan afuera de este reparto por completo: son su
 * propia lista, no tiene sentido meterlos "dentro" de una valija (ver
 * `campingItems` más abajo y la pantalla de Distribución).
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

export function distributeItems(
  items: PackingItem[],
  bags: MaletaKey[],
): { byBag: Record<MaletaKey, DistributedItem[]>; campingItems: PackingItem[] } {
  const byBag: Record<MaletaKey, DistributedItem[]> = { carry: [], bodega: [], mochila: [] };
  const campingItems = items.filter((i) => i.cat === 'camping');
  const packable = items.filter((i) => i.cat !== 'camping');
  if (bags.length === 0) return { byBag, campingItems };

  const withYouOrder: MaletaKey[] = (['mochila', 'carry', 'bodega'] as MaletaKey[]).filter((b) => bags.includes(b));
  const primaryOrder: MaletaKey[] = (['bodega', 'carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const backupOrder: MaletaKey[] = (['carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const withYou = withYouOrder[0] ?? bags[0];
  const primary = primaryOrder[0] ?? bags[0];
  const backupBag = backupOrder.find((b) => b !== primary) ?? withYou;

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

  return { byBag, campingItems };
}

// Algunos ítems ocupan mucho más lugar del que su cantidad sugiere (una
// campera abrigada o una butaca para auto no son "una unidad más", son un
// cuarto de valija). No es una cuenta real de volumen — es una heurística
// orientativa, con el mismo espíritu que el resto de las recomendaciones
// de esta pantalla.
const BULK_WEIGHTS: Partial<Record<string, number>> = {
  'Campera abrigada': 2,
  'Botas o calzado de abrigo': 2,
  'Rompeviento impermeable': 1,
  'Zapatillas de trekking': 1,
  'Zapatos de vestir': 1,
  'Cochecito o mochila portabebé': 3,
  'Butaca para auto': 3,
  'Mantita o saco de dormir': 1,
  'Toallón de playa': 1,
};

/** true si el "bulto" total pesa bastante para la cantidad de valijas
 * elegidas — señal de que puede convenir sumar lugar (otra valija o una
 * más grande), no una certeza matemática. */
export function isPackingTight(items: PackingItem[], bags: MaletaKey[]): boolean {
  if (bags.length === 0) return false;
  const bulk = items.reduce((sum, i) => sum + (BULK_WEIGHTS[i.name] ?? 0), 0);
  return bulk >= bags.length * 4;
}
