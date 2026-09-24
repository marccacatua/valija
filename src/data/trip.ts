import {
  ALOJ_OPTIONS,
  CATEGORY_META,
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
import { dateLocale, itemLabel, t, tn } from '../i18n';

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
  lavaRopa: false,
  bebe: false,
  mascota: false,
  deporte: false,
  equipoPropio: false,
};

/** "1 día" / "5 días": la duración mínima del stepper es 1. */
export const diasLabel = (n: number) => tn(n, '{n} día', '{n} días');

export function tripTitle(form: TripFormState): string {
  return form.name.trim() || t('{dest} en {dias}', { dest: labelForMany(DEST_OPTIONS, form.dest), dias: diasLabel(form.dias) });
}

export function tripMetaLine(form: TripFormState): string {
  return [
    labelForMany(DEST_OPTIONS, form.dest),
    labelFor(MOTIVO_OPTIONS, form.motivo),
    diasLabel(form.dias),
    labelForMany(MALETA_OPTIONS, form.maletas),
  ].join(' · ');
}

export function tripMetaChips(form: TripFormState): string[] {
  return [
    labelForMany(DEST_OPTIONS, form.dest),
    labelFor(CLIMA_OPTIONS, form.clima),
    labelFor(MOTIVO_OPTIONS, form.motivo),
    // No se pregunta con motivo "trabajo" (ver TripForm.tsx) — mostrarlo
    // igual sería el valor por defecto sin que el usuario lo haya
    // elegido nunca. Importante que aparezca acá: con esquí/navegar
    // cambia toda la categoría de ítems, no es un detalle cosmético.
    ...(form.motivo !== 'trabajo' ? [labelFor(TURISMO_OPTIONS, form.turismo)] : []),
    diasLabel(form.dias),
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
// Frases completas (no "Ahora seguí con" + fragmento) para que cada idioma
// pueda armar la oración a su manera.
const NEXT_CATEGORY_PHRASE: Record<CategoryKey, string> = {
  docs: t('Ahora seguí con los documentos'),
  ropa: t('Ahora seguí con la ropa'),
  higiene: t('Ahora seguí con la higiene'),
  tech: t('Ahora seguí con la electrónica'),
  extras: t('Ahora seguí con los extras'),
  bebe: t('Ahora seguí con lo del bebé'),
  mascota: t('Ahora seguí con lo de la mascota'),
  ski: t('Ahora seguí con lo de esquí'),
  nautica: t('Ahora seguí con lo náutico'),
  buceo: t('Ahora seguí con lo de buceo'),
  camping: t('Ahora seguí con lo de camping'),
};

export function progressNote(items: PackingItem[]): string {
  const packed = packedCount(items);
  if (packed === 0) return t('Arrancá por los documentos');
  if (packed === items.length) return t('¡Valija lista! Buen viaje.');

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
      return NEXT_CATEGORY_PHRASE[next];
    }
  }

  return tn(items.length - packed, 'Te falta {n} ítem', 'Te faltan {n} ítems');
}

/** Ejemplo de nombre de plantilla, sugerido según el viaje actual — para
 * que el placeholder inspire algo relevante en vez de un genérico fijo. */
export function templatePlaceholder(form: TripFormState): string {
  if (form.dest.includes('playa')) return t('Kit snorkel');
  if (form.dest.includes('montana')) return t('Kit escalada');
  // ciudad
  if (form.turismo === 'fiesta') return t('Kit noche de salida');
  if (form.motivo === 'trabajo') return t('Kit oficina');
  return t('Kit museos');
}

/** Texto plano para compartir por WhatsApp/notas/mail — agrupado igual que
 * la vista detallada, con la lista de casa al final como sección aparte
 * (mismo criterio que en la UI: no es parte de "lo que se empaca"). */
export function shareText(trip: Trip): string {
  const lines: string[] = [`🧳 ${tripTitle(trip.form)}`, ''];

  for (const key of CATEGORY_ORDER) {
    const list = trip.items.filter((i) => i.cat === key);
    if (!list.length) continue;
    lines.push(CATEGORY_META[key].title);
    for (const item of list) {
      const qty = item.noQty || item.qty <= 1 ? '' : ` (x${item.qty})`;
      lines.push(`${item.done ? '✅' : '☐'} ${itemLabel(item.name)}${qty}`);
    }
    lines.push('');
  }

  // El barco reemplaza a la casa (no se suman), mismo criterio que en
  // la UI — ver el comentario en Checklist.tsx.
  if (trip.boatChecklist.length) {
    lines.push(t('¿Está todo listo para zarpar?'));
    for (const task of trip.boatChecklist) {
      lines.push(`${task.done ? '✅' : '☐'} ${itemLabel(task.label)}`);
    }
  } else if (trip.homeChecklist.length) {
    lines.push(t('¿Quedó todo pronto en casa?'));
    for (const task of trip.homeChecklist) {
      lines.push(`${task.done ? '✅' : '☐'} ${itemLabel(task.label)}`);
    }
  }

  return lines.join('\n').trim();
}

export function tripListMeta(trip: Trip): string {
  const when = new Date(trip.createdAt).toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' });
  return `${tripMetaLine(trip.form)} · ${when}`;
}
