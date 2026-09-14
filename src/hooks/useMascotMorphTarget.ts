import { useLayoutEffect, useRef } from 'react';
import { takeMascotMorph } from '../features/mascotMorph';

// Mismo tipo de curva que el FLIP del checklist, para que toda la app
// "viaje" con la misma sensación. Se puede pisar por viaje (ver
// armMascotMorph) — Welcome usa una más lenta para el usuario nuevo.
const DEFAULT_TRAVEL_MS = 420;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * Si Welcome dejó armado un morph (ver features/mascotMorph.ts), anima una
 * copia de esa mascota grande desde su posición original hasta acá encima
 * de todo, e interpola tamaño y posición directamente (sin depender de la
 * View Transitions API del navegador, que no anduvo confiable). Mientras
 * dura, oculta la mascota real de esta pantalla para que no se vean las
 * dos superpuestas.
 *
 * El ocultar/mostrar la mascota real se hace escribiendo `style.visibility`
 * directo sobre el nodo (no con estado de React): tiene que pasar en el
 * mismo instante exacto en que se agrega/saca la copia, o queda un frame
 * en el que no se ve ninguna de las dos — el glitch que se vio al probar
 * en el celular.
 *
 * Si no hay nada pendiente (se entró a esta pantalla sin pasar por
 * Welcome, o el usuario tiene reducir movimiento activado), no hace nada.
 */
export function useMascotMorphTarget<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const morph = takeMascotMorph();
    if (!morph) return;

    const toRect = el.getBoundingClientRect();
    el.style.visibility = 'hidden';

    const wrap = document.createElement('div');
    wrap.innerHTML = morph.html;
    const clone = wrap.firstElementChild as HTMLElement | null;
    if (!clone) {
      el.style.visibility = '';
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
      { duration: morph.durationMs ?? DEFAULT_TRAVEL_MS, easing: EASING, fill: 'forwards' },
    );

    let cancelled = false;
    const reveal = () => {
      if (cancelled) return;
      // Swap en el mismo tick: sacar la copia y mostrar la real a la vez,
      // sin pasar por un render de React en el medio.
      clone.remove();
      el.style.visibility = '';
    };
    anim.finished.then(reveal).catch(reveal);

    return () => {
      cancelled = true;
      clone.remove();
      el.style.visibility = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez, al montar
  }, []);

  return ref;
}
