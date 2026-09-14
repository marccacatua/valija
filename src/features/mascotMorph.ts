import { prefersReducedMotion } from './motion';

interface PendingMorph {
  fromRect: DOMRect;
  html: string;
  bgHtml: string;
  durationMs?: number;
}

// Puente entre Welcome (que arma esto justo antes de desmontarse al
// navegar) y la pantalla de destino (Checklist/Intro), que lo recoge en
// su primer layout. Un solo pendiente a la vez alcanza: nunca hay dos
// navegaciones al mismo tiempo.
let pending: PendingMorph | null = null;

// Cuánto tarda en desvanecerse la copia del fondo anaranjado, del lado
// de la pantalla de destino — arranca al mismo tiempo que el viaje de
// la mascota (ver hooks/useMascotMorphTarget.ts), no antes.
export const FADE_MS = 624;

/** Llamar en Welcome, con el wrapper de la mascota y el del fondo, justo
 * antes de `navigate(...)`. Guarda una foto de los dos (posición + markup
 * de la mascota; solo markup del fondo) para que la pantalla de destino
 * pueda animar una copia de cada uno desde ahí — el vuelo de la mascota y
 * el desvanecido del naranja arrancan juntos, en vez de que el fade
 * termine primero y recién ahí empiece a moverse la mascota.
 * `durationMs` es opcional — cada pantalla de destino trae su propio
 * default si no se pisa acá. */
export function armMascotMorph(mascotEl: HTMLElement, bgEl: HTMLElement, durationMs?: number) {
  if (prefersReducedMotion()) return;
  pending = { fromRect: mascotEl.getBoundingClientRect(), html: mascotEl.outerHTML, bgHtml: bgEl.outerHTML, durationMs };
}

/** Llamar en la pantalla de destino al montar. Se consume una sola vez:
 * si nadie lo pide (ej. se navegó a una pantalla sin mascota), se pierde
 * solo, no queda colgado para la próxima navegación. */
export function takeMascotMorph(): PendingMorph | null {
  const p = pending;
  pending = null;
  return p;
}
