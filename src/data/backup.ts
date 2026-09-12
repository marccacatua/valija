import type { ItemTemplate, Trip } from '../types';

const TRIPS_KEY = 'valija:trips';
const TEMPLATES_KEY = 'valija:templates';
const IS_PRO_KEY = 'valija:isPro';

/**
 * iOS le da a la web abierta en Safari y a la misma web instalada como
 * ícono en la pantalla de inicio dos almacenamientos totalmente separados
 * (no es un bug de la app, es así como Safari particiona el storage entre
 * "pestaña" y "app standalone"). Sin un backend no hay forma de
 * sincronizarlos automáticamente — este es el puente manual: exportar
 * arma un texto con todo, importar lo vuelve a cargar del otro lado. El
 * portapapeles del sistema es el único canal que sí cruza esa frontera.
 */
interface BackupPayload {
  v: 1;
  exportedAt: string;
  trips: Trip[];
  templates: ItemTemplate[];
  isPro: boolean;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function exportBackup(): string {
  const payload: BackupPayload = {
    v: 1,
    exportedAt: new Date().toISOString(),
    trips: readJSON<Trip[]>(TRIPS_KEY, []),
    templates: readJSON<ItemTemplate[]>(TEMPLATES_KEY, []),
    isPro: readJSON<boolean>(IS_PRO_KEY, false),
  };
  return JSON.stringify(payload);
}

export interface ImportResult {
  addedTrips: number;
  addedTemplates: number;
  unlockedPro: boolean;
}

/** Suma lo que venga en el texto a lo que ya hay (no reemplaza nada): un
 * viaje/plantilla ya presente por id se ignora, así se puede repetir el
 * import sin duplicar. Pro se prende si estaba prendido en cualquiera de
 * los dos lados, nunca se apaga. */
export function importBackup(raw: string): ImportResult {
  let payload: BackupPayload;
  try {
    payload = JSON.parse(raw.trim());
  } catch {
    throw new Error('Ese texto no se pudo leer — ¿lo pegaste completo?');
  }
  if (!payload || payload.v !== 1 || !Array.isArray(payload.trips)) {
    throw new Error('Ese texto no tiene el formato esperado de un backup de Valija.');
  }

  const currentTrips = readJSON<Trip[]>(TRIPS_KEY, []);
  const currentTripIds = new Set(currentTrips.map((t) => t.id));
  const newTrips = payload.trips.filter((t) => !currentTripIds.has(t.id));
  localStorage.setItem(TRIPS_KEY, JSON.stringify([...currentTrips, ...newTrips]));

  const currentTemplates = readJSON<ItemTemplate[]>(TEMPLATES_KEY, []);
  const currentTemplateIds = new Set(currentTemplates.map((t) => t.id));
  const newTemplates = (payload.templates ?? []).filter((t) => !currentTemplateIds.has(t.id));
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify([...currentTemplates, ...newTemplates]));

  const wasAlreadyPro = readJSON<boolean>(IS_PRO_KEY, false);
  const unlockedPro = !wasAlreadyPro && Boolean(payload.isPro);
  if (payload.isPro) localStorage.setItem(IS_PRO_KEY, 'true');

  return { addedTrips: newTrips.length, addedTemplates: newTemplates.length, unlockedPro };
}
