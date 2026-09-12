import { useState } from 'react';
import { PRO_PRICE_LABEL, usePurchase } from '../features/purchase';
import { Button } from './Button';
import styles from './PaywallSheet.module.css';

interface PaywallSheetProps {
  onClose: () => void;
  /** Se llama después de un desbloqueo exitoso, además de cerrarse solo. */
  onUnlocked?: () => void;
}

const BENEFITS = [
  'Viajes guardados ilimitados',
  'Agregar tus propios ítems y tareas',
  'Guardar y aplicar plantillas',
  'Repetir un viaje anterior con un toque',
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
        setError('No se pudo completar la compra. Probá de nuevo.');
      }
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
        setError('No encontramos ninguna compra anterior para restaurar.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.badge}>🔓 Valija Pro</div>
        <div className={styles.title}>Desbloqueá todo, para siempre</div>
        <ul className={styles.benefits}>
          {BENEFITS.map((b) => (
            <li key={b}>
              <span className={styles.check}>✓</span> {b}
            </li>
          ))}
        </ul>
        <Button onClick={handlePurchase} disabled={busy}>
          Desbloquear — {PRO_PRICE_LABEL} (pago único)
        </Button>
        <button type="button" className={styles.restoreBtn} onClick={handleRestore} disabled={busy}>
          Ya compré antes — restaurar
        </button>
        {error && <div className={styles.error}>{error}</div>}
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
