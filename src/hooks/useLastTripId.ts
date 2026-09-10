import { useLocalStorage } from './useLocalStorage';

const KEY = 'valija:lastTripId';

/** Recuerda qué viaje se vio último para que la pestaña "Valija" del bottom
 * nav pueda volver directo a esa checklist en vez de perderse. */
export function useLastTripId() {
  return useLocalStorage<string | null>(KEY, null);
}
