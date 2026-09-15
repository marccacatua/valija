import styles from './UndoSnackbar.module.css';

interface UndoSnackbarProps {
  message: string;
  onUndo: () => void;
}

/** Feedback tras un borrado (ítem o tarea de casa): en vez de pedir
 * confirmación ANTES de borrar (fricción para algo que se hace seguido y
 * casi siempre a propósito), se borra al toque y se ofrece un rato corto
 * para deshacerlo por si fue sin querer — mismo criterio que Gmail/Trello. */
export function UndoSnackbar({ message, onUndo }: UndoSnackbarProps) {
  return (
    <div className={styles.snackbar} role="status">
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.undoBtn} onClick={onUndo}>
        Deshacer
      </button>
    </div>
  );
}
