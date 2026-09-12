import { useCallback, useSyncExternalStore } from 'react';

/**
 * Registro central de features "gateables" — un cambio de flag acá en vez
 * de una búsqueda de "dónde meto el paywall" por todo el código.
 *
 * Decidido (2026-09): modelo de pago único (no suscripción, StoreKit
 * "non-consumable") a USD 0,99 para desbloquear todo lo que está en
 * `pro: true` acá abajo. Gratis: el generador de checklist completo, las
 * 5 pantallas, distribución por valija, y compartir/exportar (a propósito
 * gratis siempre — cada checklist compartida es publicidad gratis de la
 * app para quien la recibe, no tiene sentido trabarlo).
 *
 * Importante: esto vive en un simple booleano de localStorage (`isPro`),
 * todavía no hay compra real. El botón "Desbloquear Valija Pro" (ver
 * `features/purchase.ts` y `PaywallSheet`) ya funciona de punta a punta,
 * pero hoy solo prende el flag sin cobrar nada — placeholder hasta
 * conectar StoreKit/RevenueCat (ver el roadmap de publicación).
 */
export type FeatureKey =
  | 'unlimitedTrips'
  | 'extraCategories'
  | 'customItems'
  | 'tripTemplates'
  | 'exportChecklist'
  | 'cloneTrip';

interface FeatureDef {
  label: string;
  pro: boolean;
}

export const FEATURE_FLAGS: Record<FeatureKey, FeatureDef> = {
  unlimitedTrips: { label: 'Viajes guardados ilimitados', pro: true },
  extraCategories: { label: 'Categorías extra (deportes, bebé, mascota)', pro: false },
  customItems: { label: 'Agregar ítems personalizados a la checklist', pro: true },
  tripTemplates: { label: 'Guardar ítems propios como plantilla reusable', pro: true },
  exportChecklist: { label: 'Exportar o compartir la checklist', pro: false },
  cloneTrip: { label: 'Repetir un viaje anterior con un toque', pro: true },
};

/** Tope de viajes guardados en la versión gratis — cuenta todos (activos y
 * finalizados), no solo los activos: son "viajes guardados", no "en curso". */
export const FREE_TRIP_LIMIT = 3;

const IS_PRO_KEY = 'valija:isPro';

export function isFeatureEnabled(key: FeatureKey, isPro: boolean): boolean {
  const def = FEATURE_FLAGS[key];
  return !def.pro || isPro;
}

// `useLocalStorage` normal no alcanza acá: cada instancia mantiene su
// propio estado en memoria, así que si el paywall (montado en un sheet)
// prendiera isPro con ese hook, otro componente ya montado (la checklist
// detrás) no se enteraría hasta un remount. isPro sí necesita que TODOS
// los que lo leen en la misma página se enteren al toque de un cambio
// (comprar Pro y ver las features desbloquearse ahí mismo, sin recargar)
// — por eso usa un store externo mínimo con useSyncExternalStore en vez
// del hook genérico.
type Listener = () => void;
const listeners = new Set<Listener>();

function readIsPro(): boolean {
  try {
    const raw = window.localStorage.getItem(IS_PRO_KEY);
    return raw !== null ? (JSON.parse(raw) as boolean) : false;
  } catch {
    return false;
  }
}

function writeIsPro(value: boolean) {
  try {
    window.localStorage.setItem(IS_PRO_KEY, JSON.stringify(value));
  } catch {
    // si no se puede persistir, esta pestaña sigue funcionando en memoria
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fuente de verdad de si el usuario tiene Valija Pro. Placeholder hasta que
 * exista compra real (ver features/purchase.ts): por ahora es un booleano de
 * localStorage, pero ya reactivo entre todos los componentes montados. */
export function useIsPro() {
  const isPro = useSyncExternalStore(subscribe, readIsPro, () => false);
  const setIsPro = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? (next as (prev: boolean) => boolean)(readIsPro()) : next;
    writeIsPro(resolved);
  }, []);
  return [isPro, setIsPro] as const;
}

export function useFeatureFlag(key: FeatureKey) {
  const [isPro] = useIsPro();
  return isFeatureEnabled(key, isPro);
}
