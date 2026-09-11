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
  { key: 'playa', label: 'Playa' },
  { key: 'montana', label: 'Montaña' },
  { key: 'ciudad', label: 'Ciudad' },
];

export const CLIMA_OPTIONS: CatalogOption<ClimaKey>[] = [
  { key: 'calor', label: 'Calor' },
  { key: 'templado', label: 'Templado' },
  { key: 'frio', label: 'Frío' },
  { key: 'lluvia', label: 'Lluvia' },
];

export const MOTIVO_OPTIONS: CatalogOption<MotivoKey>[] = [
  { key: 'placer', label: 'Placer' },
  { key: 'trabajo', label: 'Trabajo' },
];

export const TURISMO_OPTIONS: CatalogOption<TurismoKey>[] = [
  { key: 'relax', label: 'Relax' },
  { key: 'aventura', label: 'Aventura' },
  { key: 'cultura', label: 'Cultural' },
  { key: 'fiesta', label: 'Salidas' },
];

export const ALOJ_OPTIONS: CatalogOption<AlojKey>[] = [
  { key: 'hotel', label: 'Hotel' },
  { key: 'depto', label: 'Depto / Airbnb' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'amigos', label: 'Casa de amigos' },
];

export const TRANSPORTE_OPTIONS: CatalogOption<TransporteKey>[] = [
  { key: 'avion', label: 'Avión' },
  { key: 'auto', label: 'Auto' },
  { key: 'bus', label: 'Micro' },
  { key: 'tren', label: 'Tren' },
];

export const MALETA_OPTIONS: CatalogOption<MaletaKey>[] = [
  { key: 'carry', label: 'Carry-on' },
  { key: 'bodega', label: 'Bodega' },
  { key: 'mochila', label: 'Mochila' },
];

// Colores como var(--token) en vez de hex: son strings que terminan en un
// style inline (background/fill), el navegador los resuelve igual que si
// vinieran de una clase — así quedan preparados para modo oscuro.
export const CATEGORY_META: Record<CategoryKey, { title: string; color: string; pro?: boolean }> = {
  ropa: { title: 'Ropa', color: 'var(--coral)' },
  higiene: { title: 'Higiene', color: 'var(--teal)' },
  docs: { title: 'Documentos', color: 'var(--violet)' },
  tech: { title: 'Electrónica', color: 'var(--mustard-dark)' },
  extras: { title: 'Extras', color: 'var(--sky)' },
};

// Documentos primero: coincide con el mensaje de progreso ("Arrancá por
// los documentos") y es lo más importante de no olvidar.
export const CATEGORY_ORDER: CategoryKey[] = ['docs', 'ropa', 'higiene', 'tech', 'extras'];

export function labelFor<K extends string>(options: CatalogOption<K>[], key: K): string {
  return options.find((o) => o.key === key)?.label ?? '—';
}

export function labelForMany<K extends string>(options: CatalogOption<K>[], keys: K[]): string {
  return keys.map((k) => labelFor(options, k)).join(' + ');
}
