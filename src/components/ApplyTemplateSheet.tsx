import type { ItemTemplate } from '../types';
import styles from './TemplateSheets.module.css';

interface ApplyTemplateSheetProps {
  templates: ItemTemplate[];
  onApply: (template: ItemTemplate) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
}

export function ApplyTemplateSheet({ templates, onApply, onRemove, onCancel }: ApplyTemplateSheetProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Mis plantillas</div>
        <div className={styles.subtitle}>Tocá una para sumar sus ítems a este viaje.</div>

        {templates.length === 0 ? (
          <div className={styles.empty}>Todavía no guardaste ninguna plantilla.</div>
        ) : (
          <div>
            {templates.map((t) => (
              <div key={t.id} className={styles.templateRow}>
                <button type="button" className={styles.templateMain} onClick={() => onApply(t)}>
                  <span className={styles.templateName}>{t.name}</span>
                  <span className={styles.templateCount}>{t.items.length + (t.homeTasks?.length ?? 0)} ítems</span>
                </button>
                <span
                  role="button"
                  className={styles.templateDelete}
                  onClick={() => onRemove(t.id)}
                  aria-label={`Borrar plantilla ${t.name}`}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
