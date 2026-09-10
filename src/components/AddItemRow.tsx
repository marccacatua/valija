import { useState } from 'react';
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
        placeholder="Agregar ítem…"
      />
      {value.trim() && (
        <button type="button" className={styles.confirm} onClick={submit}>
          Agregar
        </button>
      )}
    </div>
  );
}
