import { useLayoutEffect, useRef, useState } from 'react';
import { takeMascotMorph } from '../features/mascotMorph';

// Mismo tipo de curva que el FLIP del checklist, para que toda la app
// "viaje" con la misma sensación.
const TRAVEL_MS = 420;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * Si Welcome dejó armado un morph (ver features/mascotMorph.ts), anima una
 * copia de esa mascota grande desde su posición original hasta acá encima
 * de todo, e interpola tamaño y posición directamente (sin depender de la
 * View Transitions API del navegador, que no anduvo confiable). Mientras
 * dura, oculta la mascota real de esta pantalla para que no se vean las
 * dos superpuestas.
 *
 * Si no hay nada pendiente (se entró a esta pantalla sin pasar por
 * Welcome, o el usuario tiene reducir movimiento activado), no hace nada.
 */
export function useMascotMorphTarget<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hidden, setHidden] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const morph = takeMascotMorph();
    if (!morph) return;

    const toRect = el.getBoundingClientRect();
    setHidden(true);

    const wrap = document.createElement('div');
    wrap.innerHTML = morph.html;
    const clone = wrap.firstElementChild as HTMLElement | null;
    if (!clone) {
      setHidden(false);
      return;
    }

    clone.querySelectorAll<HTMLElement>('svg').forEach((svg) => {
      // La animación de "flotar" de la mascota grande no aporta acá — el
      // viaje ya es su propio movimiento.
      svg.style.animation = 'none';
      // El <svg> trae width/height fijos como atributos (ver Mascot.tsx) —
      // sin esto, no se achica junto con el div que lo envuelve, que es lo
      // que estamos animando abajo.
      svg.style.width = '100%';
      svg.style.height = '100%';
    });

    Object.assign(clone.style, {
      position: 'fixed',
      margin: '0',
      left: `${morph.fromRect.left}px`,
      top: `${morph.fromRect.top}px`,
      width: `${morph.fromRect.width}px`,
      height: `${morph.fromRect.height}px`,
      zIndex: '9999',
      pointerEvents: 'none',
    });
    document.body.appendChild(clone);

    const anim = clone.animate(
      [
        { left: `${morph.fromRect.left}px`, top: `${morph.fromRect.top}px`, width: `${morph.fromRect.width}px`, height: `${morph.fromRect.height}px` },
        { left: `${toRect.left}px`, top: `${toRect.top}px`, width: `${toRect.width}px`, height: `${toRect.height}px` },
      ],
      { duration: TRAVEL_MS, easing: EASING, fill: 'forwards' },
    );

    let cancelled = false;
    anim.finished
      .catch(() => {})
      .then(() => {
        clone.remove();
        if (!cancelled) setHidden(false);
      });

    return () => {
      cancelled = true;
      clone.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez, al montar
  }, []);

  return { ref, hidden };
}
