import { useState } from 'react';
import { PRO_PRICE_LABEL, usePurchase } from '../features/purchase';
import { Button } from './Button';
import { UnlockIcon } from './icons';
import { t } from '../i18n';
import styles from './PaywallSheet.module.css';

interface PaywallSheetProps {
  onClose: () => void;
  /** Se llama después de un desbloqueo exitoso, además de cerrarse solo. */
  onUnlocked?: () => void;
}

// RevenueCat rechaza la promesa con { userCancelled: true } cuando el
// usuario cierra el cartel nativo de compra sin elegir nada — no es un
// error real, no hace falta mostrar ningún mensaje en ese caso.
function isUserCancelled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'userCancelled' in error && (error as { userCancelled?: boolean }).userCancelled === true;
}

const BENEFITS = [
  t('Viajes guardados ilimitados'),
  t('Agregar tus propios ítems y tareas'),
  t('Guardar y aplicar plantillas'),
  t('Repetir un viaje anterior con un toque'),
  t('Categorías extra: bebé/niño chico, mascota, esquí, navegar, buceo y camping'),
];

export function PaywallSheet({ onClose, onUnlocked }: PaywallSheetProps) {
  const { purchasePro, restorePurchases } = usePurchase();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    setBusy(true);
    setError('');
    try {
      const ok = await purchasePro();
      if (ok) {
        onUnlocked?.();
        onClose();
      } else {
        setError(t('No se pudo completar la compra. Probá de nuevo.'));
      }
    } catch (e) {
      // RevenueCat rechaza la promesa (no la resuelve en false) ante un
      // error real o una compra cancelada — lo segundo no es un error,
      // el usuario simplemente cerró el cartel nativo de Apple.
      if (!isUserCancelled(e)) setError(t('No se pudo completar la compra. Probá de nuevo.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    setError('');
    try {
      const ok = await restorePurchases();
      if (ok) {
        onUnlocked?.();
        onClose();
      } else {
        setError(t('No encontramos ninguna compra anterior para restaurar.'));
      }
    } catch {
      setError(t('No se pudo restaurar la compra. Probá de nuevo.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.badge}>{UnlockIcon} Valija Pro</div>
        <div className={styles.title}>{t('Desbloqueá todo, para siempre')}</div>
        <ul className={styles.benefits}>
          {BENEFITS.map((b) => (
            <li key={b}>
              <span className={styles.check}>✓</span> {b}
            </li>
          ))}
        </ul>
        <Button onClick={handlePurchase} disabled={busy}>
          {t('Desbloquear — {price} (pago único)', { price: PRO_PRICE_LABEL })}
        </Button>
        <button type="button" className={styles.restoreBtn} onClick={handleRestore} disabled={busy}>
          {t('Ya compré antes — restaurar')}
        </button>
        {error && <div className={styles.error}>{error}</div>}
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          {t('Ahora no')}
        </button>
      </div>
    </div>
  );
}
