import { useState } from 'react';
import { t } from '../i18n';
import styles from './AddItemRow.module.css';

export function AddItemRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue('');
  };

  return (
    <div className={styles.row}>
      <span className={styles.plus}>+</span>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t('Agregar ítem…')}
      />
      {value.trim() && (
        <button type="button" className={styles.confirm} onClick={submit}>
          {t('Agregar')}
        </button>
      )}
    </div>
  );
}
