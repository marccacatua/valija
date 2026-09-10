import { useCallback } from 'react';
import { buildItems } from '../data/buildItems';
import type { CategoryKey, Trip, TripFormState } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'valija:trips';

/**
 * Única fuente de verdad de los viajes guardados. Reemplaza el array SEED
 * hardcodeado del prototipo: arranca vacío y todo lo que aparece en "Mis
 * viajes" es un viaje que el usuario armó de verdad, persistido en
 * localStorage.
 */
export function useTrips() {
  const [trips, setTrips] = useLocalStorage<Trip[]>(STORAGE_KEY, []);

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
      setTrips((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));
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

  const getTrip = useCallback((id: string | undefined) => trips.find((t) => t.id === id), [trips]);

  return { trips, addTrip, updateTrip, toggleItem, bumpItem, addCustomItem, removeItem, removeTrip, getTrip };
}
