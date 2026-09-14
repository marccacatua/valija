import { useLayoutEffect, useRef } from 'react';
import { takeMascotMorph } from '../features/mascotMorph';

// Mismo tipo de curva que el FLIP del checklist, para que toda la app
// "viaje" con la misma sensación. Se puede pisar por viaje (ver
// armMascotMorph) — Welcome usa una más lenta para el usuario nuevo.
const DEFAULT_TRAVEL_MS = 840;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * Si Welcome dejó armado un morph (ver features/mascotMorph.ts), arranca
 * DOS animaciones al mismo tiempo, apenas monta esta pantalla:
 *
 * 1. Una copia de la mascota grande viaja desde su posición original
 *    hasta acá (sin depender de la View Transitions API del navegador,
 *    que no anduvo confiable). Mientras dura, oculta la mascota real de
 *    esta pantalla para que no se vean las dos superpuestas.
 * 2. Una copia del fondo anaranjado de Welcome se desvanece encima de
 *    esta pantalla (por detrás de la mascota, que siempre queda visible
 *    por delante). Arranca en el mismo instante que el viaje de la
 *    mascota y dura exactamente lo mismo, para que el fade termine
 *    justo cuando la mascota llega a destino — ni antes ni después.
 *
 * La copia queda parada en su tamaño y posición finales (los de acá) y
 * se le aplica el transform inverso para que arranque pareciendo estar en
 * el origen (la técnica clásica de FLIP) — así el último cuadro de la
 * animación es, por construcción, idéntico a como se ve la mascota real
 * debajo, sin saltos de sub-píxel por animar left/top/width/height.
 *
 * El ocultar/mostrar la mascota real se hace escribiendo `style.visibility`
 * directo sobre el nodo (no con estado de React): tiene que pasar en el
 * mismo instante exacto en que se agrega/saca la copia, o queda un frame
 * en el que no se ve ninguna de las dos.
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

    // Misma duración para el fade del fondo y el viaje de la mascota —
    // así el fade termina justo cuando la mascota llega, no antes.
    const duration = morph.durationMs ?? DEFAULT_TRAVEL_MS;

    // --- Fondo anaranjado: copia fija, arriba de todo menos de la
    // mascota, que se desvanece sola sin afectar el layout de esta
    // pantalla (no ocupa espacio real, solo se ve encima).
    const bgWrap = document.createElement('div');
    bgWrap.innerHTML = morph.bgHtml;
    const bgClone = bgWrap.firstElementChild as HTMLElement | null;
    if (bgClone) {
      Object.assign(bgClone.style, {
        position: 'fixed',
        inset: '0',
        margin: '0',
        zIndex: '9998',
        pointerEvents: 'none',
      });
      document.body.appendChild(bgClone);
      const bgAnim = bgClone.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'ease', fill: 'forwards' });
      bgAnim.finished.catch(() => {}).then(() => bgClone.remove());
    }

    // --- Mascota: la técnica FLIP de siempre.
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
      // sin esto, no se achica junto con el div que lo envuelve.
      svg.style.width = '100%';
      svg.style.height = '100%';
    });

    // La copia queda parada exactamente donde y como se ve la mascota
    // real de esta pantalla (mismo tamaño y posición finales)...
    Object.assign(clone.style, {
      position: 'fixed',
      margin: '0',
      left: `${toRect.left}px`,
      top: `${toRect.top}px`,
      width: `${toRect.width}px`,
      height: `${toRect.height}px`,
      zIndex: '9999',
      pointerEvents: 'none',
      transformOrigin: 'top left',
    });
    document.body.appendChild(clone);

    // ...y el transform inverso la hace VERSE como si estuviera en el
    // origen (posición y tamaño de la mascota grande de Welcome).
    const dx = morph.fromRect.left - toRect.left;
    const dy = morph.fromRect.top - toRect.top;
    const scaleX = morph.fromRect.width / toRect.width;
    const scaleY = morph.fromRect.height / toRect.height;

    const anim = clone.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})` },
        { transform: 'translate(0, 0) scale(1, 1)' },
      ],
      { duration, easing: EASING, fill: 'forwards' },
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
      bgClone?.remove();
      el.style.visibility = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez, al montar
  }, []);

  return ref;
}
