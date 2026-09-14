import { prefersReducedMotion } from './motion';

interface PendingMorph {
  fromRect: DOMRect;
  html: string;
}

// Puente entre Welcome (que arma esto justo antes de desmontarse al
// navegar) y la pantalla de destino (Checklist/Intro), que lo recoge en
// su primer layout. Un solo pendiente a la vez alcanza: nunca hay dos
// navegaciones al mismo tiempo.
let pending: PendingMorph | null = null;

/** Llamar en Welcome, con el wrapper de la mascota, justo antes de
 * `navigate(...)`. Guarda una foto (posición + markup) para que la
 * pantalla de destino pueda animar una copia desde ahí hasta la suya. */
export function armMascotMorph(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  pending = { fromRect: el.getBoundingClientRect(), html: el.outerHTML };
}

/** Llamar en la pantalla de destino al montar. Se consume una sola vez:
 * si nadie lo pide (ej. se navegó a una pantalla sin mascota), se pierde
 * solo, no queda colgado para la próxima navegación. */
export function takeMascotMorph(): PendingMorph | null {
  const p = pending;
  pending = null;
  return p;
}
