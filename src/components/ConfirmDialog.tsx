import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reemplaza window.confirm(): esa API siempre dispara el diálogo nativo
 * del sistema (pasa igual dentro de un WebView de Capacitor), no algo
 * que se pueda estilar. Para que se vea como parte de la app hace falta
 * un componente propio.
 */
export function ConfirmDialog({ title, message, confirmLabel = 'Sí, borrar', cancelLabel = 'Cancelar', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{title}</div>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
