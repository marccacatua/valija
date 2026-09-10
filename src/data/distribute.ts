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
 * lectura, pensada para el momento de armar las valijas.
 *
 * Reglas:
 * - Documentos, electrónica y algunos ítems puntuales que siempre conviene
 *   tener a mano (ver ALWAYS_WITH_YOU) van en la mochila, o el carry-on si
 *   no hay mochila: es lo que llevás encima, no lo que va bajo el avión.
 *   Se mantiene liviana a propósito, no le mandamos ropa "de respaldo".
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
const ALWAYS_WITH_YOU = ['Lentes de sol'];

export function distributeItems(items: PackingItem[], bags: MaletaKey[]): Record<MaletaKey, DistributedItem[]> {
  const result: Record<MaletaKey, DistributedItem[]> = { carry: [], bodega: [], mochila: [] };
  if (bags.length === 0) return result;

  const withYouOrder: MaletaKey[] = (['mochila', 'carry', 'bodega'] as MaletaKey[]).filter((b) => bags.includes(b));
  const primaryOrder: MaletaKey[] = (['bodega', 'carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const backupOrder: MaletaKey[] = (['carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const withYou = withYouOrder[0] ?? bags[0];
  const primary = primaryOrder[0] ?? bags[0];
  const backupBag = backupOrder.find((b) => b !== primary) ?? withYou;

  for (const item of items) {
    const keepWithYou = item.cat === 'docs' || item.cat === 'tech' || ALWAYS_WITH_YOU.includes(item.name);
    if (keepWithYou) {
      result[withYou].push({ item, qty: item.qty, isSplit: false });
      continue;
    }

    const canSplit = item.qty > 1 && bags.includes('bodega') && bags.length > 1 && primary === 'bodega';
    if (canSplit) {
      const backupQty = Math.max(1, Math.round(item.qty * 0.2));
      const mainQty = item.qty - backupQty;
      result[primary].push({ item, qty: mainQty, isSplit: true });
      result[backupBag].push({ item, qty: backupQty, isSplit: true });
      continue;
    }

    result[primary].push({ item, qty: item.qty, isSplit: false });
  }

  return result;
}
