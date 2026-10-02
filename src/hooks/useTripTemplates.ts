import { useCallback } from 'react';
import { templateFromTrip } from '../data/tripTemplate';
import type { Trip, TripTemplate } from '../types';
import { useLocalStorage } from './useLocalStorage';

export const TRIP_TEMPLATES_KEY = 'valija:tripTemplates';

/** Plantillas de viaje (ver data/tripTemplate.ts). Las más nuevas primero. */
export function useTripTemplates() {
  const [tripTemplates, setTripTemplates] = useLocalStorage<TripTemplate[]>(TRIP_TEMPLATES_KEY, []);

  const saveTripTemplate = useCallback(
    (trip: Trip, name: string, withCustom: boolean, withChanges: boolean): TripTemplate | undefined => {
      if (!name.trim()) return undefined;
      const template = templateFromTrip(trip, name, withCustom, withChanges);
      setTripTemplates((prev) => [template, ...prev]);
      return template;
    },
    [setTripTemplates],
  );

  const removeTripTemplate = useCallback(
    (id: string) => setTripTemplates((prev) => prev.filter((t) => t.id !== id)),
    [setTripTemplates],
  );

  return { tripTemplates, saveTripTemplate, removeTripTemplate };
}
