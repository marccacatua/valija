import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '../features/motion';

// El ítem se queda quieto (ya tildado) este ratito antes de viajar a su
// nueva posición — si se mueve en el instante del tilde, el ojo pierde
// el feedback del check. Constantes acá arriba para poder calibrarlas
// mirando la app real en el celular, sin buscarlas en medio del hook.
const HOLD_MS = 220;
const TRAVEL_MS = 300;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * FLIP genérico para listas reordenadas por React (First/Last/Invert/Play):
 * cuando el orden visual de `orderedIds` cambia entre renders — ej. un
 * ítem tildado que baja al fondo de su categoría (ver Checklist.tsx) —
 * anima el desplazamiento en vez de dejar que el navegador lo corte en
 * seco. Devuelve un `registerNode(id)` para pasar como `ref` en cada
 * elemento de la lista.
 *
 * No anima ítems que recién aparecen (no hay "First" con qué comparar,
 * sería una posición inventada) ni nada si el usuario tiene activado
 * "reducir movimiento" en el sistema.
 */
// Posición "absoluta de página" (viewport + scroll actual) en vez de
// getBoundingClientRect() a secas: si el usuario scrollea entre un tilde y
// el siguiente sin que la lista se reordene (el caso normal: bajar hasta
// el próximo ítem), la posición relativa al viewport de TODOS los ítems
// cambia igual sin que ninguno se haya movido en el documento — comparar
// esas dos fotos relativas al viewport de lleno haría "saltar" a toda la
// lista con el delta del scroll. Sumar el scroll cancela ese ruido y dx/dy
// quedan reflejando solo el movimiento real dentro del documento.
interface PageRect {
  top: number;
  left: number;
}

function measurePageRect(node: HTMLElement): PageRect {
  const rect = node.getBoundingClientRect();
  return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
}

export function useFlipReorder(orderedIds: string[]) {
  const rectsRef = useRef<Map<string, PageRect>>(new Map());
  const nodesRef = useRef<Map<string, HTMLElement>>(new Map());
  // Animación en curso por id, si la hay — ver el cancel() de abajo.
  const animsRef = useRef<Map<string, Animation>>(new Map());

  const registerNode = (id: string) => (el: HTMLElement | null) => {
    if (el) nodesRef.current.set(id, el);
    else nodesRef.current.delete(id);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- se recalcula a propósito solo cuando cambia el orden real, no la identidad del array
  useLayoutEffect(() => {
    const prevRects = rectsRef.current;
    const nextRects = new Map<string, PageRect>();
    const reduceMotion = prefersReducedMotion();

    for (const id of orderedIds) {
      const node = nodesRef.current.get(id);
      if (!node) continue;

      // Si el elemento todavía estaba a mitad de camino de un reorder
      // anterior (ej. tildaste y enseguida deshiciste un borrado antes de
      // que la animación del hueco terminara), cancelarla ANTES de medir:
      // si no, getBoundingClientRect() lee la posición transformada de esa
      // animación vieja (un blanco en movimiento, no la posición real de
      // reposo), y el próximo dx/dy sale contaminado — el elemento queda
      // "pegado" en un offset que nunca se termina de resolver. Cancelar
      // le saca el transform y lo deja en su posición de layout real.
      const prevAnim = animsRef.current.get(id);
      if (prevAnim) {
        prevAnim.cancel();
        animsRef.current.delete(id);
      }

      const rect = measurePageRect(node);
      nextRects.set(id, rect);

      if (reduceMotion) continue;
      const prev = prevRects.get(id);
      if (!prev) continue;

      const dx = prev.left - rect.left;
      const dy = prev.top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

      const anim = node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: TRAVEL_MS,
        delay: HOLD_MS,
        easing: EASING,
        fill: 'backwards',
      });
      animsRef.current.set(id, anim);
      anim.addEventListener('finish', () => {
        if (animsRef.current.get(id) === anim) animsRef.current.delete(id);
      });
    }

    rectsRef.current = nextRects;
  }, [orderedIds.join('|')]);

  return registerNode;
}
