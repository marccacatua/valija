import { t } from '../i18n';
import styles from './DurationStepper.module.css';

const PRESETS = [
  { label: t('Finde · 3'), value: 3 },
  { label: t('Semana · 7'), value: 7 },
  { label: t('Largo · 14'), value: 14 },
];

export function DurationStepper({ days, onChange }: { days: number; onChange: (next: number) => void }) {
  const clamp = (n: number) => Math.max(1, Math.min(30, n));

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <button type="button" className={`${styles.stepBtn} ${styles.dec}`} onClick={() => onChange(clamp(days - 1))}>
          –
        </button>
        <div className={styles.center}>
          <div className={styles.value}>{days}</div>
          <div className={styles.label}>{t('días de viaje')}</div>
        </div>
        <button type="button" className={`${styles.stepBtn} ${styles.inc}`} onClick={() => onChange(clamp(days + 1))}>
          +
        </button>
      </div>
      <div className={styles.presets}>
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`${styles.preset} ${days === preset.value ? styles.presetActive : ''}`}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
