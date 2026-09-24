import type { ItemTemplate } from '../types';
import { t, tn } from '../i18n';
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
        <div className={styles.title}>{t('Mis plantillas')}</div>
        <div className={styles.subtitle}>{t('Tocá una para sumar sus ítems a este viaje.')}</div>

        {templates.length === 0 ? (
          <div className={styles.empty}>{t('Todavía no guardaste ninguna plantilla.')}</div>
        ) : (
          <div>
            {templates.map((tpl) => (
              <div key={tpl.id} className={styles.templateRow}>
                <button type="button" className={styles.templateMain} onClick={() => onApply(tpl)}>
                  <span className={styles.templateName}>{tpl.name}</span>
                  <span className={styles.templateCount}>{tn(tpl.items.length + (tpl.homeTasks?.length ?? 0), '{n} ítem', '{n} ítems')}</span>
                </button>
                <span
                  role="button"
                  className={styles.templateDelete}
                  onClick={() => onRemove(tpl.id)}
                  aria-label={t('Borrar plantilla {name}', { name: tpl.name })}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {t('Cerrar')}
          </button>
        </div>
      </div>
    </div>
  );
}
