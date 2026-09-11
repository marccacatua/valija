import { useCallback, useMemo } from 'react';
import { buildItems } from '../data/buildItems';
import type { CategoryKey, Trip, TripFormState } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'valija:trips';

/**
 * Viajes guardados antes de la v0.7.0 tienen `form.maleta` (una sola)
 * en vez de `form.maletas` (array); antes de la v0.12.0 pasa lo mismo
 * con `form.dest` (un solo valor en vez de array, ver combinar destinos
 * en BACKLOG.md). Se migra en lectura, sin tocar lo que ya está en
 * localStorage — así no hace falta un paso de migración explícito ni
 * arriesgarse a corromper datos viejos.
 */
function migrateTrip(t: Trip): Trip {
  const form = t.form as TripFormState & { maleta?: string; dest: TripFormState['dest'] | TripFormState['dest'][number] };
  const needsMaletas = !Array.isArray(form.maletas);
  const needsDest = !Array.isArray(form.dest);
  if (!needsMaletas && !needsDest) return t;
  return {
    ...t,
    form: {
      ...form,
      maletas: needsMaletas ? (form.maleta ? [form.maleta as TripFormState['maletas'][number]] : ['carry']) : form.maletas,
      dest: needsDest ? [form.dest as TripFormState['dest'][number]] : form.dest,
    },
  };
}

/**
 * Única fuente de verdad de los viajes guardados. Reemplaza el array SEED
 * hardcodeado del prototipo: arranca vacío y todo lo que aparece en "Mis
 * viajes" es un viaje que el usuario armó de verdad, persistido en
 * localStorage.
 */
export function useTrips() {
  const [rawTrips, setTrips] = useLocalStorage<Trip[]>(STORAGE_KEY, []);
  const trips = useMemo(() => rawTrips.map(migrateTrip), [rawTrips]);

  const addTrip = useCallback(
    (form: TripFormState): Trip => {
      const trip: Trip = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        form,
        items: buildItems(form),
      };
      setTrips((prev) => [trip, ...prev]);
      return trip;
    },
    [setTrips],
  );

  const updateTrip = useCallback(
    (id: string, updater: (t: Trip) => Trip) => {
      // Usa la forma funcional de setTrips (parte de `prev`, no del `trips`
      // externo) para que varias llamadas seguidas dentro del mismo evento
      // (ej. aplicar una plantilla con 3 ítems, uno por llamada) se
      // encadenen en vez de pisarse entre sí. Migra sobre la marcha para
      // "curar" un viaje con forma vieja de paso.
      setTrips((prev) => prev.map(migrateTrip).map((t) => (t.id === id ? updater(t) : t)));
    },
    [setTrips],
  );

  const toggleItem = useCallback(
    (tripId: string, itemId: string) => {
      updateTrip(tripId, (t) => ({
        ...t,
        items: t.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
      }));
    },
    [updateTrip],
  );

  const bumpItem = useCallback(
    (tripId: string, itemId: string, delta: number) => {
      updateTrip(tripId, (t) => ({
        ...t,
        items: t.items.map((i) => (i.id === itemId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)),
      }));
    },
    [updateTrip],
  );

  /** Marca/desmarca varios ítems de una — usado por la vista rápida para
   * tildar un grupo temático entero con un solo toque, en una sola
   * actualización (no una por ítem, para no perder cambios si el usuario
   * toca dos grupos seguido). */
  const setItemsDone = useCallback(
    (tripId: string, itemIds: string[], done: boolean) => {
      const ids = new Set(itemIds);
      updateTrip(tripId, (t) => ({
        ...t,
        items: t.items.map((i) => (ids.has(i.id) ? { ...i, done } : i)),
      }));
    },
    [updateTrip],
  );

  /** Cambia el nombre de un viaje ya creado. Vacío es válido: vuelve a
   * mostrar el título automático (destino + días), igual que al armarlo. */
  const renameTrip = useCallback(
    (tripId: string, name: string) => {
      updateTrip(tripId, (t) => ({ ...t, form: { ...t.form, name: name.trim() } }));
    },
    [updateTrip],
  );

  const addCustomItem = useCallback(
    (tripId: string, cat: CategoryKey, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateTrip(tripId, (t) => ({
        ...t,
        items: [...t.items, { id: crypto.randomUUID(), cat, name: trimmed, qty: 1, done: false, isCustom: true }],
      }));
    },
    [updateTrip],
  );

  const removeItem = useCallback(
    (tripId: string, itemId: string) => {
      updateTrip(tripId, (t) => ({ ...t, items: t.items.filter((i) => i.id !== itemId) }));
    },
    [updateTrip],
  );

  const removeTrip = useCallback(
    (id: string) => {
      setTrips((prev) => prev.filter((t) => t.id !== id));
    },
    [setTrips],
  );

  const removeAllTrips = useCallback(() => {
    setTrips(() => []);
  }, [setTrips]);

  const getTrip = useCallback((id: string | undefined) => trips.find((t) => t.id === id), [trips]);

  return {
    trips,
    addTrip,
    updateTrip,
    toggleItem,
    bumpItem,
    setItemsDone,
    renameTrip,
    addCustomItem,
    removeItem,
    removeTrip,
    removeAllTrips,
    getTrip,
  };
}
