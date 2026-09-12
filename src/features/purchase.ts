import { useIsPro } from './flags';

export const PRO_PRICE_LABEL = 'USD 0,99';

/**
 * Capa de compra, separada de la UI para que conectar el proveedor real
 * sea un cambio contenido acá adentro y no una búsqueda por todo el
 * código. Hoy no hay compra real (eso espera a que exista la cuenta de
 * Apple Developer activa + el producto creado en App Store Connect, ver
 * el roadmap de publicación): purchasePro() prende el flag `isPro` local,
 * el mismo mecanismo que ya se usaba para probar la UI condicionada.
 *
 * Para conectar RevenueCat (recomendado — dashboard propio, maneja
 * restaurar compra y validación de recibo sin que tengamos que
 * implementarlo a mano):
 * 1. npm install @revenuecat/purchases-capacitor
 * 2. Crear el producto "valija_pro_unlock" (no-consumible) en App Store
 *    Connect, y el mismo identificador en el dashboard de RevenueCat.
 * 3. Reemplazar el cuerpo de purchasePro()/restorePurchases() de acá
 *    abajo por las llamadas reales al SDK. La firma no cambia, así que
 *    ningún componente que use este hook necesita tocarse.
 */
export function usePurchase() {
  const [isPro, setIsPro] = useIsPro();

  const purchasePro = async (): Promise<boolean> => {
    // TODO(RevenueCat): Purchases.purchaseProduct({ productIdentifier: 'valija_pro_unlock' })
    setIsPro(true);
    return true;
  };

  const restorePurchases = async (): Promise<boolean> => {
    // TODO(RevenueCat): Purchases.restorePurchases() y leer el entitlement "pro"
    return isPro;
  };

  return { isPro, purchasePro, restorePurchases };
}
