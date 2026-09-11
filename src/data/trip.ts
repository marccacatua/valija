import {
  ALOJ_OPTIONS,
  CATEGORY_ORDER,
  CLIMA_OPTIONS,
  DEST_OPTIONS,
  MALETA_OPTIONS,
  MOTIVO_OPTIONS,
  TRANSPORTE_OPTIONS,
  TURISMO_OPTIONS,
  labelFor,
  labelForMany,
} from './catalog';
import type { CategoryKey, PackingItem, Trip, TripFormState } from '../types';

export const DEFAULT_FORM: TripFormState = {
  name: '',
  dest: ['playa'],
  clima: 'calor',
  motivo: 'placer',
  turismo: 'relax',
  aloj: 'depto',
  transporte: 'avion',
  maletas: ['carry'],
  dias: 5,
  vestidos: false,
};

export function tripTitle(form: TripFormState): string {
  return form.name.trim() || `${labelForMany(DEST_OPTIONS, form.dest)} en ${form.dias} días`;
}

export function tripMetaLine(form: TripFormState): string {
  return [
    labelForMany(DEST_OPTIONS, form.dest),
    labelFor(MOTIVO_OPTIONS, form.motivo),
    `${form.dias} días`,
    labelForMany(MALETA_OPTIONS, form.maletas),
  ].join(' · ');
}

export function tripMetaChips(form: TripFormState): string[] {
  return [
    labelForMany(DEST_OPTIONS, form.dest),
    labelFor(CLIMA_OPTIONS, form.clima),
    labelFor(MOTIVO_OPTIONS, form.motivo),
    `${form.dias} días`,
    labelFor(TRANSPORTE_OPTIONS, form.transporte),
    labelForMany(MALETA_OPTIONS, form.maletas),
  ];
}

// Se usan en el resumen de "Nuevo viaje" para mostrar el resto de las
// elecciones sin repetir lo que ya aparece en los chips principales.
export function tripExtraSummary(form: TripFormState): string {
  return [labelFor(TURISMO_OPTIONS, form.turismo), labelFor(ALOJ_OPTIONS, form.aloj), labelFor(TRANSPORTE_OPTIONS, form.transporte)].join(
    ' · ',
  );
}

export function packedCount(items: PackingItem[]): number {
  return items.filter((i) => i.done).length;
}

export function progressPct(items: PackingItem[]): number {
  if (!items.length) return 0;
  return Math.round((packedCount(items) / items.length) * 100);
}

// Frase natural para invitar a seguir con la próxima categoría (con
// artículo, no el título tal cual de CATEGORY_META) una vez que la
// anterior queda completa.
const NEXT_CATEGORY_PHRASE: Record<CategoryKey, string> = {
  docs: 'los documentos',
  ropa: 'la ropa',
  higiene: 'la higiene',
  tech: 'la electrónica',
  extras: 'los extras',
};

export function progressNote(items: PackingItem[]): string {
  const packed = packedCount(items);
  if (packed === 0) return 'Arrancá por los documentos';
  if (packed === items.length) return '¡Valija lista! Buen viaje.';

  // Si una categoría quedó recién completa, invitamos a seguir con la
  // próxima en el orden de la checklist en vez de repetir siempre "te
  // faltan N ítems" — ayuda más a saber por dónde seguir.
  for (let i = 0; i < CATEGORY_ORDER.length - 1; i++) {
    const cat = CATEGORY_ORDER[i];
    const next = CATEGORY_ORDER[i + 1];
    const catItems = items.filter((it) => it.cat === cat);
    const nextItems = items.filter((it) => it.cat === next);
    const catDone = catItems.length > 0 && catItems.every((it) => it.done);
    const nextPending = nextItems.some((it) => !it.done);
    if (catDone && nextPending) {
      return `Ahora seguí con ${NEXT_CATEGORY_PHRASE[next]}`;
    }
  }

  return `Te faltan ${items.length - packed} ítems`;
}

/** Ejemplo de nombre de plantilla, sugerido según el viaje actual — para
 * que el placeholder inspire algo relevante en vez de un genérico fijo. */
export function templatePlaceholder(form: TripFormState): string {
  if (form.dest.includes('playa')) return 'Kit snorkel';
  if (form.dest.includes('montana')) return 'Kit escalada';
  // ciudad
  if (form.turismo === 'fiesta') return 'Kit noche de salida';
  if (form.motivo === 'trabajo') return 'Kit oficina';
  return 'Kit museos';
}

export function tripListMeta(trip: Trip): string {
  const when = new Date(trip.createdAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
  return `${tripMetaLine(trip.form)} · ${when}`;
}
