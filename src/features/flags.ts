import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * Registro central de features "gateables". Para el MVP todo vive en `pro:
 * false` (todo gratis) — la idea es que cuando en una futura versión
 * decidamos qué va detrás de una suscripción, sea un cambio de un flag acá
 * en vez de una búsqueda de "dónde meto el paywall" por todo el código.
 *
 * Ejemplos pensados a futuro: límite de viajes guardados, categorías extra
 * (bebé, mascota, deportes específicos), ítems personalizados, exportar/
 * compartir la checklist.
 */
export type FeatureKey = 'unlimitedTrips' | 'extraCategories' | 'customItems' | 'exportChecklist';

interface FeatureDef {
  label: string;
  pro: boolean;
}

export const FEATURE_FLAGS: Record<FeatureKey, FeatureDef> = {
  unlimitedTrips: { label: 'Viajes guardados ilimitados', pro: false },
  extraCategories: { label: 'Categorías extra (deportes, bebé, mascota)', pro: false },
  customItems: { label: 'Agregar ítems personalizados a la checklist', pro: false },
  exportChecklist: { label: 'Exportar o compartir la checklist', pro: false },
};

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
