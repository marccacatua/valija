import { useMemo, useState } from 'react';
import { tripChanges } from '../data/tripTemplate';
import { tripMetaLine, tripTitle } from '../data/trip';
import type { Trip } from '../types';
import { itemLabel, t, tn } from '../i18n';
import styles from './TemplateSheets.module.css';

interface SaveTripTemplateSheetProps {
  trip: Trip;
  onSave: (name: string, withCustom: boolean, withChanges: boolean) => void;
  onCancel: () => void;
}

/** Guarda el viaje entero como plantilla para repetirlo desde "Mis
 * viajes". Las opciones van siempre; lo propio y los cambios, si los hay,
 * se pueden destildar. */
export function SaveTripTemplateSheet({ trip, onSave, onCancel }: SaveTripTemplateSheetProps) {
  const changes = useMemo(() => tripChanges(trip), [trip]);
  const [name, setName] = useState(trip.form.name.trim() || tripTitle(trip.form));
  const [withCustom, setWithCustom] = useState(true);
  const [withChanges, setWithChanges] = useState(true);

  const customNames = [...changes.customItems.map((i) => i.name), ...changes.customHomeTasks, ...changes.customBoatTasks];
  const changeLabels = [
    ...Object.entries(changes.qtyChanges).map(([n, q]) => `${itemLabel(n)}: ${q}`),
    ...changes.removedItems.map((n) => t('sin {item}', { item: itemLabel(n) })),
  ];
  const canSave = name.trim().length > 0;
  const preview = (list: string[]) => list.slice(0, 3).join(', ') + (list.length > 3 ? '…' : '');

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{t('Guardar como plantilla de viaje')}</div>
        <div className={styles.subtitle}>{t('Para repetir este viaje cuando quieras, de un toque desde "Mis viajes".')}</div>

        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('Ej. {example}', { example: t('Trabajo en Buenos Aires') })}
          aria-label={t('Nombre de la plantilla')}
        />

        <div className={styles.list}>
          <div className={styles.row} aria-disabled="true">
            <span className={`${styles.checkbox} ${styles.checkboxOn}`}>✓</span>
            <span className={styles.name}>
              {t('Opciones del viaje')}
              <span className={styles.detail}>{tripMetaLine(trip.form)}</span>
            </span>
          </div>
          {customNames.length > 0 && (
            <button type="button" className={styles.row} onClick={() => setWithCustom((v) => !v)}>
              <span className={`${styles.checkbox} ${withCustom ? styles.checkboxOn : ''}`}>✓</span>
              <span className={styles.name}>
                {tn(customNames.length, 'Tu ítem propio', 'Tus {n} ítems propios')}
                <span className={styles.detail}>{preview(customNames.map(itemLabel))}</span>
              </span>
            </button>
          )}
          {changeLabels.length > 0 && (
            <button type="button" className={styles.row} onClick={() => setWithChanges((v) => !v)}>
              <span className={`${styles.checkbox} ${withChanges ? styles.checkboxOn : ''}`}>✓</span>
              <span className={styles.name}>
                {t('Los cambios que le hiciste a la lista')}
                <span className={styles.detail}>{preview(changeLabels)}</span>
              </span>
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.primary} ${!canSave ? styles.primaryDisabled : ''}`}
            onClick={() => canSave && onSave(name, withCustom, withChanges)}
          >
            {t('Guardar plantilla')}
          </button>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {t('Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
}
