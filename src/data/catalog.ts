import type {
  AlojKey,
  CategoryKey,
  ClimaKey,
  DestKey,
  MaletaKey,
  MotivoKey,
  TransporteKey,
  TurismoKey,
} from '../types';
import { t } from '../i18n';

/**
 * `pro` queda en false en todas las opciones del MVP. Está acá para que el día
 * que sumemos una opción premium (p. ej. un tipo de maleta o categoría extra)
 * alcance con flipear el flag: la UI ya sabe leerlo (ver features/flags.ts).
 */
export interface CatalogOption<K extends string> {
  key: K;
  label: string;
  pro?: boolean;
}

export const DEST_OPTIONS: CatalogOption<DestKey>[] = [
  { key: 'playa', label: t('Playa') },
  { key: 'montana', label: t('Montaña') },
  { key: 'ciudad', label: t('Ciudad') },
];

export const CLIMA_OPTIONS: CatalogOption<ClimaKey>[] = [
  { key: 'calor', label: t('Calor') },
  { key: 'templado', label: t('Templado') },
  { key: 'frio', label: t('Frío') },
  { key: 'lluvia', label: t('Lluvia') },
];

export const MOTIVO_OPTIONS: CatalogOption<MotivoKey>[] = [
  { key: 'placer', label: t('Placer') },
  { key: 'trabajo', label: t('Trabajo') },
];

export const TURISMO_OPTIONS: CatalogOption<TurismoKey>[] = [
  { key: 'relax', label: t('Relax') },
  { key: 'aventura', label: t('Aventura') },
  { key: 'cultura', label: t('Cultural') },
  { key: 'fiesta', label: t('Salidas') },
  { key: 'ski', label: t('Esquí') },
  { key: 'navegar', label: t('Navegar') },
  { key: 'buceo', label: t('Buceo') },
];

export const ALOJ_OPTIONS: CatalogOption<AlojKey>[] = [
  { key: 'hotel', label: t('Hotel') },
  { key: 'depto', label: t('Depto / Airbnb') },
  { key: 'hostel', label: t('Hostel') },
  { key: 'amigos', label: t('Casa de amigos') },
  { key: 'camping', label: t('Camping') },
];

export const TRANSPORTE_OPTIONS: CatalogOption<TransporteKey>[] = [
  { key: 'avion', label: t('Avión') },
  { key: 'auto', label: t('Auto') },
  { key: 'bus', label: t('Micro') },
  { key: 'tren', label: t('Tren') },
];

export const MALETA_OPTIONS: CatalogOption<MaletaKey>[] = [
  { key: 'carry', label: t('Carry-on') },
  { key: 'bodega', label: t('Bodega') },
  { key: 'mochila', label: t('Mochila') },
];

// Colores como var(--token) en vez de hex: son strings que terminan en un
// style inline (background/fill), el navegador los resuelve igual que si
// vinieran de una clase — así quedan preparados para modo oscuro.
export const CATEGORY_META: Record<CategoryKey, { title: string; color: string; pro?: boolean }> = {
  ropa: { title: t('Ropa'), color: 'var(--coral)' },
  higiene: { title: t('Higiene'), color: 'var(--teal)' },
  docs: { title: t('Documentos'), color: 'var(--violet)' },
  tech: { title: t('Electrónica'), color: 'var(--mustard-dark)' },
  extras: { title: t('Extras'), color: 'var(--sky)' },
  bebe: { title: t('Bebé'), color: 'var(--baby-pink)' },
  mascota: { title: t('Mascota'), color: 'var(--clay)' },
  ski: { title: t('Esquí'), color: 'var(--ice)' },
  nautica: { title: t('Náutica'), color: 'var(--navy)' },
  buceo: { title: t('Buceo'), color: 'var(--abyss)' },
  camping: { title: t('Camping'), color: 'var(--forest)' },
};

// Documentos primero: coincide con el mensaje de progreso ("Arrancá por
// los documentos") y es lo más importante de no olvidar. Higiene antes
// que ropa para que coincida con el orden de QUICK_GROUP_ORDER (vista
// rápida) — mismo orden en las dos vistas, y con el mensaje de progreso
// que invita a seguir con la próxima categoría. "Bebé" cerca de higiene
// (misma rutina de cuidado personal, y la misma pregunta del form las
// junta visualmente). "Mascota", "Esquí", "Náutica", "Buceo" y
// "Camping", en cambio, no tienen nada que ver con higiene/vestuario —
// son logística situacional (equipo específico de una actividad
// puntual), así que van todas juntas al final (y de paso, antes de la
// sección de casa/barco, que siempre cierra la pantalla). "Buceo" pegado
// a "Náutica" porque las dos son actividades de agua.
export const CATEGORY_ORDER: CategoryKey[] = [
  'docs',
  'higiene',
  'bebe',
  'ropa',
  'tech',
  'extras',
  'mascota',
  'ski',
  'nautica',
  'buceo',
  'camping',
];

export function labelFor<K extends string>(options: CatalogOption<K>[], key: K): string {
  return options.find((o) => o.key === key)?.label ?? '—';
}

export function labelForMany<K extends string>(options: CatalogOption<K>[], keys: K[]): string {
  return keys.map((k) => labelFor(options, k)).join(' + ');
}
