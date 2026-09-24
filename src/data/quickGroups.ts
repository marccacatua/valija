import type { CategoryKey, PackingItem } from '../types';
import { t } from '../i18n';

export type QuickGroupKey =
  | 'documentos'
  | 'higiene'
  | 'ropa'
  | 'trabajo'
  | 'salir'
  | 'abrigo'
  | 'calzado'
  | 'electronica'
  | 'extras'
  | 'bebe'
  | 'mascota'
  | 'ski'
  | 'nautica'
  | 'buceo'
  | 'camping';

export const QUICK_GROUP_META: Record<QuickGroupKey, { title: string; color: string }> = {
  documentos: { title: t('Documentos'), color: 'var(--violet)' },
  higiene: { title: t('Higiene'), color: 'var(--teal)' },
  ropa: { title: t('Ropa'), color: 'var(--coral)' },
  trabajo: { title: t('Ropa de trabajo'), color: 'var(--coral-dark)' },
  salir: { title: t('Ropa para salir'), color: 'var(--coral-mid)' },
  abrigo: { title: t('Abrigo'), color: 'var(--sky)' },
  calzado: { title: t('Calzado'), color: 'var(--muted)' },
  electronica: { title: t('Electrónica'), color: 'var(--mustard-dark)' },
  extras: { title: t('Extras'), color: 'var(--sky)' },
  bebe: { title: t('Bebé'), color: 'var(--baby-pink)' },
  mascota: { title: t('Mascota'), color: 'var(--clay)' },
  ski: { title: t('Esquí'), color: 'var(--ice)' },
  nautica: { title: t('Náutica'), color: 'var(--navy)' },
  buceo: { title: t('Buceo'), color: 'var(--abyss)' },
  camping: { title: t('Camping'), color: 'var(--forest)' },
};

export const QUICK_GROUP_ORDER: QuickGroupKey[] = [
  'documentos',
  'higiene',
  'bebe',
  'ropa',
  'trabajo',
  'salir',
  'abrigo',
  'calzado',
  'electronica',
  'extras',
  'mascota',
  'ski',
  'nautica',
  'buceo',
  'camping',
];

/**
 * Vista rápida: agrupa los ~40 ítems generados en unos pocos temas
 * grandes en vez de la lista completa (pedido de un amigo que probó la
 * app: "demasiados ítems para revisar uno por uno"). Mapea por NOMBRE
 * (no por categoría) porque "ropa" hoy mezcla básicos, trabajo, salidas,
 * abrigo y calzado — separarlos es justamente el punto de esta vista.
 * Todo nombre que genera buildRawItems tiene que estar acá; si no está,
 * cae en el fallback por categoría (ver quickGroupFor), pensado sobre
 * todo para ítems personalizados con nombre libre.
 */
const NAME_TO_GROUP: Record<string, QuickGroupKey> = {
  // ropa: básicos
  'Ropa interior': 'ropa',
  Medias: 'ropa',
  Pijama: 'ropa',
  Remeras: 'ropa',
  'Remeras deportivas': 'ropa',
  Pantalones: 'ropa',
  'Vestido o pollera': 'ropa',
  'Short o pantalón de trekking': 'ropa',
  'Shorts o bermudas': 'ropa',
  'Traje de baño': 'ropa',
  Cinturón: 'ropa',
  'Gorra o sombrero': 'ropa',
  'Short deportivo': 'ropa',
  // ropa: abrigo
  'Buzo o campera liviana': 'abrigo',
  Buzos: 'abrigo',
  'Campera abrigada': 'abrigo',
  'Rompeviento impermeable': 'abrigo',
  Bufanda: 'abrigo',
  'Gorro y guantes': 'abrigo',
  'Campera liviana para correr': 'abrigo',
  // ropa: trabajo
  Camisas: 'trabajo',
  'Saco o blazer': 'trabajo',
  // ropa: salir
  'Outfit para salir': 'salir',
  // ropa: calzado (todo el calzado vive junto, sin importar el contexto)
  'Ojotas o sandalias': 'calzado',
  'Zapatillas de trekking': 'calzado',
  'Zapatillas cómodas para caminar': 'calzado',
  'Zapatos de vestir': 'calzado',
  'Calzado para salir': 'calzado',
  'Botas o calzado de abrigo': 'calzado',
  'Championes para correr': 'calzado',
};

const CATEGORY_FALLBACK: Record<CategoryKey, QuickGroupKey> = {
  ropa: 'ropa',
  higiene: 'higiene',
  docs: 'documentos',
  tech: 'electronica',
  extras: 'extras',
  bebe: 'bebe',
  mascota: 'mascota',
  ski: 'ski',
  nautica: 'nautica',
  buceo: 'buceo',
  camping: 'camping',
};

export function quickGroupFor(item: PackingItem): QuickGroupKey {
  return NAME_TO_GROUP[item.name] ?? CATEGORY_FALLBACK[item.cat];
}
