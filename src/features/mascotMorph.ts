import { prefersReducedMotion } from './motion';

interface PendingMorph {
  fromRect: DOMRect;
  html: string;
  bgHtml: string;
  travelMs?: number;
  fadeMs?: number;
}

interface ArmMorphOptions {
  /** Cuánto tarda la mascota en llegar a destino. */
  travelMs?: number;
  /** Cuánto tarda en desvanecerse la copia del fondo. Independiente del
   * viaje de la mascota — puede durar más, menos o lo mismo. */
  fadeMs?: number;
}

// Puente entre Welcome (que arma esto justo antes de desmontarse al
// navegar) y la pantalla de destino (Checklist/Intro), que lo recoge en
// su primer layout. Un solo pendiente a la vez alcanza: nunca hay dos
// navegaciones al mismo tiempo.
let pending: PendingMorph | null = null;

/** Llamar en Welcome, con el wrapper de la mascota y el del fondo, justo
 * antes de `navigate(...)`. Guarda una foto de los dos (posición + markup
 * de la mascota; solo markup del fondo) para que la pantalla de destino
 * pueda animar una copia de cada uno desde ahí — el vuelo de la mascota y
 * el desvanecido del naranja arrancan siempre juntos (ver
 * hooks/useMascotMorphTarget.ts), aunque duren distinto. `travelMs`/
 * `fadeMs` son opcionales — cada pantalla de destino trae sus propios
 * defaults si no se pisan acá. */
export function armMascotMorph(mascotEl: HTMLElement, bgEl: HTMLElement, opts?: ArmMorphOptions) {
  if (prefersReducedMotion()) return;
  pending = {
    fromRect: mascotEl.getBoundingClientRect(),
    html: mascotEl.outerHTML,
    bgHtml: bgEl.outerHTML,
    travelMs: opts?.travelMs,
    fadeMs: opts?.fadeMs,
  };
}

/** Llamar en la pantalla de destino al montar. Se consume una sola vez:
 * si nadie lo pide (ej. se navegó a una pantalla sin mascota), se pierde
 * solo, no queda colgado para la próxima navegación. */
export function takeMascotMorph(): PendingMorph | null {
  const p = pending;
  pending = null;
  return p;
}
