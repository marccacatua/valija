import { flushSync } from 'react-dom';
import type { NavigateFunction } from 'react-router-dom';

/** Único punto de lectura de la preferencia de movimiento reducido para
 * el código que anima por JS (Web Animations API, timers de auto-avance)
 * — el CSS global en index.css ya cubre transiciones/animaciones por
 * CSS, pero no le llega a esto. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Navega usando la View Transitions API nativa del browser en vez de un
 * corte seco: si el elemento de origen y el de destino comparten
 * `view-transition-name` (ver Mascot en Welcome/Checklist), el browser
 * hace un morph real de uno al otro; si no comparten nombre, igual queda
 * un fade de pantalla completa. Sin soporte (Safari viejo) o con
 * reduced-motion, navega directo — exactamente el comportamiento de antes. */
export function navigateWithMorph(navigate: NavigateFunction, to: string) {
  if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    navigate(to);
    return;
  }
  document.startViewTransition(() => {
    flushSync(() => navigate(to));
  });
}
