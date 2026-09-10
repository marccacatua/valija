import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'sheet' (default): hoja que sube desde abajo, para confirmaciones normales.
   * 'center': modal centrada con borde de alerta, para el paso más grave de una
   * confirmación en cadena (ej. el último paso de "borrar todo"). */
  variant?: 'sheet' | 'center';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reemplaza window.confirm(): esa API siempre dispara el diálogo nativo
 * del sistema (pasa igual dentro de un WebView de Capacitor), no algo
 * que se pueda estilar. Para que se vea como parte de la app hace falta
 * un componente propio.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Sí, borrar',
  cancelLabel = 'Cancelar',
  variant = 'sheet',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const centered = variant === 'center';
  return (
    <div className={`${styles.overlay} ${centered ? styles.overlayCenter : ''}`} onClick={onCancel}>
      <div className={`${styles.card} ${centered ? styles.cardCenter : ''}`} onClick={(e) => e.stopPropagation()}>
        {centered && <div className={styles.warningIcon}>⚠️</div>}
        <div className={`${styles.title} ${centered ? styles.titleCenter : ''}`}>{title}</div>
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
