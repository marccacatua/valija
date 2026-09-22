import { useCallback, useMemo } from 'react';
import { buildItems } from '../data/buildItems';
import { buildBoatChecklist, buildHomeChecklist } from '../data/homeTasks';
import { hapticTap, hapticMedium } from '../features/haptics';
import type { CategoryKey, HomeTask, PackingItem, Trip, TripFormState } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'valija:trips';

/** Los dos campos de `Trip` que son listas de tareas (no de ítems para
 * empacar) — casa y barco comparten exactamente el mismo mecanismo
 * (tildar, agregar a mano, borrar, deshacer), así que en vez de escribir
 * cada función dos veces se arma una sola vez por campo. */
type ChecklistField = 'homeChecklist' | 'boatChecklist';

function createChecklistActions(
  field: ChecklistField,
  updateTrip: (id: string, updater: (t: Trip) => Trip) => void,
) {
  const toggleTask = (tripId: string, taskId: string) => {
    hapticTap();
    updateTrip(tripId, (t) => ({
      ...t,
      [field]: t[field].map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    }));
  };

  const addTask = (tripId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    updateTrip(tripId, (t) => ({
      ...t,
      [field]: [...t[field], { id: crypto.randomUUID(), label: trimmed, done: false, isCustom: true }],
    }));
  };

  const removeTask = (tripId: string, taskId: string) => {
    updateTrip(tripId, (t) => ({ ...t, [field]: t[field].filter((task) => task.id !== taskId) }));
  };

  const restoreTask = (tripId: string, task: HomeTask, index: number) => {
    updateTrip(tripId, (t) => {
      const list = [...t[field]];
      list.splice(Math.min(index, list.length), 0, task);
      return { ...t, [field]: list };
    });
  };

  return { toggleTask, addTask, removeTask, restoreTask };
}

/**
 * Viajes guardados antes de la v0.7.0 tienen `form.maleta` (una sola)
 * en vez de `form.maletas` (array); antes de la v0.12.0 pasa lo mismo
 * con `form.dest` (un solo valor en vez de array, ver combinar destinos
 * en BACKLOG.md); antes de la v0.13.0 no existía `homeChecklist`; antes
 * de sumar "navegar" no existía `boatChecklist`. Se migra en lectura,
 * sin tocar lo que ya está en localStorage — así no hace falta un paso
 * de migración explícito ni arriesgarse a corromper datos viejos.
 */
function migrateTrip(t: Trip): Trip {
  const form = t.form as TripFormState & { maleta?: string; dest: TripFormState['dest'] | TripFormState['dest'][number] };
  const needsMaletas = !Array.isArray(form.maletas);
  const needsDest = !Array.isArray(form.dest);
  const needsHomeChecklist = !Array.isArray(t.homeChecklist);
  const needsBoatChecklist = !Array.isArray(t.boatChecklist);
  if (!needsMaletas && !needsDest && !needsHomeChecklist && !needsBoatChecklist) return t;
  const migratedForm: TripFormState = {
    ...form,
    maletas: needsMaletas ? (form.maleta ? [form.maleta as TripFormState['maletas'][number]] : ['carry']) : form.maletas,
    dest: needsDest ? [form.dest as TripFormState['dest'][number]] : form.dest,
  };
  return {
    ...t,
    form: migratedForm,
    homeChecklist: needsHomeChecklist ? buildHomeChecklist(migratedForm) : t.homeChecklist,
    boatChecklist: needsBoatChecklist ? buildBoatChecklist(migratedForm) : t.boatChecklist,
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
        homeChecklist: buildHomeChecklist(form),
        boatChecklist: buildBoatChecklist(form),
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
      hapticTap();
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
      hapticTap();
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

  /** Cambia las valijas de un viaje ya creado (a prueba — ver
   * ChangeMaletasSheet). A propósito NO recalcula `items`: eso
   * borraría lo tildado, las cantidades ajustadas y los ítems propios
   * para arreglar apenas un par de ítems que dependen de las valijas
   * (candados, líquidos mini). El aviso de espacio y la pantalla de
   * Distribución ya leen `trip.form.maletas` en vivo. */
  const updateMaletas = useCallback(
    (tripId: string, maletas: TripFormState['maletas']) => {
      updateTrip(tripId, (t) => ({ ...t, form: { ...t.form, maletas } }));
    },
    [updateTrip],
  );

  // Casa y barco comparten el mismo mecanismo de tildar/agregar/borrar/
  // deshacer (ver createChecklistActions arriba) — una instancia por
  // campo en vez de duplicar cada función.
  const homeActions = useMemo(() => createChecklistActions('homeChecklist', updateTrip), [updateTrip]);
  const boatActions = useMemo(() => createChecklistActions('boatChecklist', updateTrip), [updateTrip]);

  /** Tilda/destilda una tarea de "antes de salir de casa" — independiente
   * de los ítems de la valija, no afecta el progreso de empaque. */
  const toggleHomeTask = useCallback((tripId: string, taskId: string) => homeActions.toggleTask(tripId, taskId), [homeActions]);

  /** Agrega una tarea de casa a mano (sin cantidad, como el resto de la
   * lista — no tiene sentido "contar" una tarea). */
  const addHomeTask = useCallback((tripId: string, label: string) => homeActions.addTask(tripId, label), [homeActions]);

  /** Saca una tarea de casa de la lista — cualquiera, generada o
   * agregada a mano (ej. alguien sin plantas saca "Regar las plantas"). */
  const removeHomeTask = useCallback((tripId: string, taskId: string) => homeActions.removeTask(tripId, taskId), [homeActions]);

  /** Mismas 4 operaciones que arriba, para "¿Está todo listo para
   * zarpar?" — solo tiene tareas cuando `turismo === 'navegar'` (ver
   * `buildBoatChecklist`), pero la mecánica es idéntica. */
  const toggleBoatTask = useCallback((tripId: string, taskId: string) => boatActions.toggleTask(tripId, taskId), [boatActions]);
  const addBoatTask = useCallback((tripId: string, label: string) => boatActions.addTask(tripId, label), [boatActions]);
  const removeBoatTask = useCallback((tripId: string, taskId: string) => boatActions.removeTask(tripId, taskId), [boatActions]);

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

  /** Repone un ítem borrado por error (ver UndoSnackbar en Checklist) en
   * su posición original del array — el sort por tildado (Checklist.tsx)
   * es estable, así que entre ítems con el mismo estado (pendiente vs
   * pendiente) el orden visual sale del orden del array: agregarlo al
   * final en vez de en su índice original lo mandaría al fondo de su
   * categoría en vez de devolverlo a donde estaba. */
  const restoreItem = useCallback(
    (tripId: string, item: PackingItem, index: number) => {
      updateTrip(tripId, (t) => {
        const items = [...t.items];
        items.splice(Math.min(index, items.length), 0, item);
        return { ...t, items };
      });
    },
    [updateTrip],
  );

  /** Misma idea que restoreItem, para una tarea de casa. */
  const restoreHomeTask = useCallback(
    (tripId: string, task: HomeTask, index: number) => homeActions.restoreTask(tripId, task, index),
    [homeActions],
  );

  /** Misma idea, para una tarea de barco. */
  const restoreBoatTask = useCallback(
    (tripId: string, task: HomeTask, index: number) => boatActions.restoreTask(tripId, task, index),
    [boatActions],
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

  /** Marca/desmarca un viaje como finalizado — reversible, por si fue
   * sin querer. No borra nada: sigue disponible para volver a mirarlo. */
  const toggleTripFinished = useCallback(
    (id: string) => {
      hapticMedium();
      updateTrip(id, (t) => ({ ...t, finishedAt: t.finishedAt ? undefined : new Date().toISOString() }));
    },
    [updateTrip],
  );

  /** Duplica un viaje: mismo form, mismos ítems y tareas de casa (con sus
   * cantidades y los agregados a mano — es "el mismo viaje de nuevo", no
   * un formulario en blanco), pero recién armado: todo sin tildar, sin
   * finalizar, y con id/fecha propios. Pensado para "quiero ir al mismo
   * lugar otra vez" sin tener que rehacer el formulario ni los ítems
   * puntuales que agregó la vez pasada. */
  const cloneTrip = useCallback(
    (id: string): Trip | undefined => {
      const original = trips.find((t) => t.id === id);
      if (!original) return undefined;
      const clone: Trip = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        form: original.form,
        items: original.items.map((item) => ({ ...item, done: false })),
        homeChecklist: original.homeChecklist.map((task) => ({ ...task, done: false })),
        boatChecklist: original.boatChecklist.map((task) => ({ ...task, done: false })),
      };
      setTrips((prev) => [clone, ...prev]);
      return clone;
    },
    [trips, setTrips],
  );

  const getTrip = useCallback((id: string | undefined) => trips.find((t) => t.id === id), [trips]);

  return {
    trips,
    addTrip,
    updateTrip,
    toggleItem,
    bumpItem,
    setItemsDone,
    renameTrip,
    updateMaletas,
    toggleHomeTask,
    addHomeTask,
    removeHomeTask,
    toggleBoatTask,
    addBoatTask,
    removeBoatTask,
    addCustomItem,
    removeItem,
    restoreItem,
    restoreHomeTask,
    restoreBoatTask,
    removeTrip,
    removeAllTrips,
    toggleTripFinished,
    cloneTrip,
    getTrip,
  };
}
