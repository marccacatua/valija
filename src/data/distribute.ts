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
 * - Documentos y electrónica van en la valija que llevás "con vos"
 *   (mochila si hay, si no carry-on, si no bodega): son lo que menos
 *   conviene perder o dejar en la bodega del avión.
 * - Si hay bodega en la mezcla y algún ítem tiene más de 1 unidad, se
 *   separa una unidad de "respaldo" en otra valija — para no quedarte sin
 *   nada de eso si la bodega se pierde o se demora.
 * - Todo lo demás va a la valija "principal" (bodega si hay, si no
 *   carry-on, si no mochila).
 */
export function distributeItems(items: PackingItem[], bags: MaletaKey[]): Record<MaletaKey, DistributedItem[]> {
  const result: Record<MaletaKey, DistributedItem[]> = { carry: [], bodega: [], mochila: [] };
  if (bags.length === 0) return result;

  const withYouOrder: MaletaKey[] = (['mochila', 'carry', 'bodega'] as MaletaKey[]).filter((b) => bags.includes(b));
  const primaryOrder: MaletaKey[] = (['bodega', 'carry', 'mochila'] as MaletaKey[]).filter((b) => bags.includes(b));
  const withYou = withYouOrder[0] ?? bags[0];
  const primary = primaryOrder[0] ?? bags[0];
  const backupBag = withYouOrder.find((b) => b !== primary) ?? withYou;

  for (const item of items) {
    const isValuable = item.cat === 'docs' || item.cat === 'tech';
    if (isValuable) {
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
