import { useLocalStorage } from '../hooks/useLocalStorage';

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
 * no hay compra real todavía. En la PWA (sin StoreKit) no hay forma de
 * desbloquear desde la propia UI — es una limitación conocida del canal
 * web, no un bug: el desbloqueo real solo va a existir en la app nativa.
 * Si alguien probando por web necesita ver la versión Pro mientras tanto,
 * `localStorage.setItem('valija:isPro', 'true')` en la consola del
 * navegador lo simula sin tocar código.
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

/** Fuente de verdad de si el usuario tiene la suscripción pro. Placeholder
 * hasta que exista compra real (StoreKit/RevenueCat): por ahora es un toggle
 * local para poder probar la UI condicionada sin pagar nada. */
export function useIsPro() {
  const [isPro, setIsPro] = useLocalStorage<boolean>(IS_PRO_KEY, false);
  return [isPro, setIsPro] as const;
}

export function useFeatureFlag(key: FeatureKey) {
  const [isPro] = useIsPro();
  return isFeatureEnabled(key, isPro);
}
