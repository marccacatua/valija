import { useState } from 'react';
import { MALETA_OPTIONS } from '../data/catalog';
import type { TripFormState } from '../types';
import { Button } from './Button';
import { MaletaIcons } from './icons';
import { OptionCard } from './OptionCard';
import { t } from '../i18n';
import styles from './ChangeMaletasSheet.module.css';

interface ChangeMaletasSheetProps {
  current: TripFormState['maletas'];
  onSave: (maletas: TripFormState['maletas']) => void;
  onCancel: () => void;
}

/**
 * Cambia las valijas de un viaje YA CREADO — a propósito no toca
 * `items` (no vuelve a correr `buildItems()`): eso borraría lo tildado,
 * las cantidades ajustadas a mano y los ítems propios, para arreglar
 * apenas un par de ítems que dependen de las valijas (candados, líquidos
 * mini). El aviso de espacio y la pantalla de Distribución ya leen
 * `trip.form.maletas` en vivo, así que alcanza con actualizar ese dato.
 */
export function ChangeMaletasSheet({ current, onSave, onCancel }: ChangeMaletasSheetProps) {
  const [maletas, setMaletas] = useState<TripFormState['maletas']>(current);

  const toggle = (key: TripFormState['maletas'][number]) =>
    setMaletas((prev) => {
      const has = prev.includes(key);
      if (has && prev.length === 1) return prev; // siempre al menos una
      return has ? prev.filter((m) => m !== key) : [...prev, key];
    });

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{t('Cambiar valijas')}</div>
        <div className={styles.hint}>{t('elegí una o varias')}</div>
        <div className={styles.grid3}>
          {MALETA_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.key}
              label={opt.label}
              icon={MaletaIcons[opt.key]}
              selected={maletas.includes(opt.key)}
              onSelect={() => toggle(opt.key)}
            />
          ))}
        </div>
        <Button onClick={() => onSave(maletas)} style={{ marginTop: 18, width: '100%' }}>
          {t('Guardar')}
        </Button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          {t('Cancelar')}
        </button>
      </div>
    </div>
  );
}
