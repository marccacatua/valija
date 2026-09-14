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
