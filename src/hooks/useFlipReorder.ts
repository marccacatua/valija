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
export function useFlipReorder(orderedIds: string[]) {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());
  const nodesRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerNode = (id: string) => (el: HTMLElement | null) => {
    if (el) nodesRef.current.set(id, el);
    else nodesRef.current.delete(id);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- se recalcula a propósito solo cuando cambia el orden real, no la identidad del array
  useLayoutEffect(() => {
    const prevRects = rectsRef.current;
    const nextRects = new Map<string, DOMRect>();
    const reduceMotion = prefersReducedMotion();

    for (const id of orderedIds) {
      const node = nodesRef.current.get(id);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      nextRects.set(id, rect);

      if (reduceMotion) continue;
      const prev = prevRects.get(id);
      if (!prev) continue;

      const dx = prev.left - rect.left;
      const dy = prev.top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

      node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: TRAVEL_MS,
        delay: HOLD_MS,
        easing: EASING,
        fill: 'backwards',
      });
    }

    rectsRef.current = nextRects;
  }, [orderedIds.join('|')]);

  return registerNode;
}
