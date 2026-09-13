import { Capacitor } from '@capacitor/core';
import { useIsPro } from './flags';

export const PRO_PRICE_LABEL = 'USD 0,99';

/** Tienen que coincidir exactamente con lo que se cree en App Store Connect
 * y en el dashboard de RevenueCat (mismo identificador de producto, mismo
 * identificador de entitlement) — ver la Ficha de App Store Connect. */
const PRODUCT_ID = 'valija_pro_unlock';
const ENTITLEMENT_ID = 'pro';

/**
 * TODO antes de publicar: pegar acá la API key pública de RevenueCat (se
 * genera sola en su dashboard al crear el proyecto — es segura de embeber
 * en el cliente, no es un secreto como una API key de servidor).
 */
const REVENUECAT_API_KEY = 'TU-API-KEY-PUBLICA-DE-REVENUECAT';

let configuring: Promise<typeof import('@revenuecat/purchases-capacitor')> | null = null;

/** Carga el SDK y lo configura una sola vez, la primera vez que hace falta
 * (nunca en el bundle web: solo se importa cuando corre en la app nativa). */
function loadPurchases() {
  if (!configuring) {
    configuring = import('@revenuecat/purchases-capacitor').then(async (mod) => {
      await mod.Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      return mod;
    });
  }
  return configuring;
}

/**
 * Capa de compra, separada de la UI para que el proveedor real quede
 * contenido acá adentro. En la app nativa (Capacitor) usa RevenueCat de
 * verdad; en la web/PWA —donde no existe StoreKit— sigue siendo un
 * desbloqueo local sin cobro, igual que antes: es el único canal donde una
 * compra real nunca va a ser posible, así que no tiene sentido intentar
 * llamar al SDK ahí.
 */
export function usePurchase() {
  const [isPro, setIsPro] = useIsPro();

  const purchasePro = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      setIsPro(true);
      return true;
    }
    const { Purchases } = await loadPurchases();
    const { products } = await Purchases.getProducts({ productIdentifiers: [PRODUCT_ID] });
    const product = products[0];
    if (!product) return false;
    const { customerInfo } = await Purchases.purchaseStoreProduct({ product });
    const unlocked = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
    if (unlocked) setIsPro(true);
    return unlocked;
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return isPro;
    const { Purchases } = await loadPurchases();
    const { customerInfo } = await Purchases.restorePurchases();
    const unlocked = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
    if (unlocked) setIsPro(true);
    return unlocked;
  };

  return { isPro, purchasePro, restorePurchases };
}
