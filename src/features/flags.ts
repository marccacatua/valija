import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * Registro central de features "gateables". Para el MVP todo vive en `pro:
 * false` (todo gratis) — la idea es que cuando en una futura versión
 * decidamos qué va detrás de un pago, sea un cambio de un flag acá en vez
 * de una búsqueda de "dónde meto el paywall" por todo el código.
 *
 * Decidido (2026-09, no activado todavía): en la versión que se publique en
 * el App Store, `customItems` y `tripTemplates` van a ser el diferenciador
 * free/pro — agregar ítems propios y guardarlos como plantilla reusable.
 * Todo lo demás (el generador de checklist, las 5 pantallas, distribución
 * por valija) sigue gratis. Cuando exista compra real (StoreKit) y haya
 * dejado de importar que los que están probando gratis puedan seguir
 * usándolo, flipear `pro: true` en esos dos.
 */
export type FeatureKey = 'unlimitedTrips' | 'extraCategories' | 'customItems' | 'tripTemplates' | 'exportChecklist';

interface FeatureDef {
  label: string;
  pro: boolean;
}

export const FEATURE_FLAGS: Record<FeatureKey, FeatureDef> = {
  unlimitedTrips: { label: 'Viajes guardados ilimitados', pro: false },
  extraCategories: { label: 'Categorías extra (deportes, bebé, mascota)', pro: false },
  customItems: { label: 'Agregar ítems personalizados a la checklist', pro: false },
  tripTemplates: { label: 'Guardar ítems propios como plantilla reusable', pro: false },
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
