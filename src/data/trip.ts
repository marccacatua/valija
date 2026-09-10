import {
  ALOJ_OPTIONS,
  CLIMA_OPTIONS,
  DEST_OPTIONS,
  MALETA_OPTIONS,
  MOTIVO_OPTIONS,
  TRANSPORTE_OPTIONS,
  TURISMO_OPTIONS,
  labelFor,
} from './catalog';
import type { PackingItem, Trip, TripFormState } from '../types';

export const DEFAULT_FORM: TripFormState = {
  name: '',
  dest: 'playa',
  clima: 'calor',
  motivo: 'placer',
  turismo: 'relax',
  aloj: 'depto',
  transporte: 'avion',
  maleta: 'carry',
  dias: 5,
  vestidos: false,
};

export function tripTitle(form: TripFormState): string {
  return form.name.trim() || `${labelFor(DEST_OPTIONS, form.dest)} en ${form.dias} días`;
}

export function tripMetaLine(form: TripFormState): string {
  return [
    labelFor(DEST_OPTIONS, form.dest),
    labelFor(MOTIVO_OPTIONS, form.motivo),
    `${form.dias} días`,
    labelFor(MALETA_OPTIONS, form.maleta),
  ].join(' · ');
}

export function tripMetaChips(form: TripFormState): string[] {
  return [
    labelFor(DEST_OPTIONS, form.dest),
    labelFor(CLIMA_OPTIONS, form.clima),
    labelFor(MOTIVO_OPTIONS, form.motivo),
    `${form.dias} días`,
    labelFor(MALETA_OPTIONS, form.maleta),
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

export function progressNote(items: PackingItem[]): string {
  const packed = packedCount(items);
  if (packed === 0) return 'Arrancá por los documentos';
  if (packed === items.length) return '¡Valija lista! Buen viaje.';
  return `Te faltan ${items.length - packed} ítems`;
}

export function tripListMeta(trip: Trip): string {
  const when = new Date(trip.createdAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
  return `${tripMetaLine(trip.form)} · ${when}`;
}
