import { Capacitor } from '@capacitor/core';
import { t } from '../i18n';
import { useIsPro, writeIsPro } from './flags';

export const PRO_PRICE_LABEL = t('USD 0,99');

/** Tienen que coincidir exactamente con lo que se cree en App Store Connect
 * y en el dashboard de RevenueCat (mismo identificador de producto, mismo
 * identificador de entitlement) — ver la Ficha de App Store Connect. */
const PRODUCT_ID = 'valija_pro_unlock';
const ENTITLEMENT_ID = 'valija_pro';

const REVENUECAT_API_KEY = 'appl_asPDlNRUsWojPQrRVrYANasmfdI';

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
 * Se llama una vez al abrir la app nativa (ver main.tsx), sin bloquear
 * la primera pantalla. Le pregunta a RevenueCat si la compra de Pro sigue
 * vigente y actualiza el flag local:
 * - si el storage se perdió pero la compra existe → vuelve Pro solo, sin
 *   tener que tocar "Restaurar compras";
 * - si Apple reembolsó la compra → se apaga Pro.
 * Si la consulta falla (sin internet, error del SDK) no se toca nada:
 * nunca le sacamos Pro a alguien por un error de red.
 */
export async function syncProEntitlement(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Purchases } = await loadPurchases();
    const { customerInfo } = await Purchases.getCustomerInfo();
    writeIsPro(Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]));
  } catch {
    // sin cambios
  }
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
