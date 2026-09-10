import { useState } from 'react';
import type { PackingItem } from '../types';
import styles from './TemplateSheets.module.css';

interface SaveTemplateSheetProps {
  items: PackingItem[];
  onSave: (name: string, items: PackingItem[]) => void;
  onCancel: () => void;
}

/** Elegís con checkboxes cuáles de tus ítems a mano entran en la
 * plantilla nueva — no todos los que agregaste tienen por qué repetirse
 * en el próximo viaje. */
export function SaveTemplateSheet({ items, onSave, onCancel }: SaveTemplateSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const [name, setName] = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = items.filter((i) => selected.has(i.id));
  const canSave = name.trim().length > 0 && chosen.length > 0;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Guardar como plantilla</div>
        <div className={styles.subtitle}>Elegí qué ítems entran y ponele un nombre.</div>

        <div className={styles.list}>
          {items.map((item) => {
            const on = selected.has(item.id);
            return (
              <button type="button" key={item.id} className={styles.row} onClick={() => toggle(item.id)}>
                <span className={`${styles.checkbox} ${on ? styles.checkboxOn : ''}`}>✓</span>
                <span className={styles.name}>{item.name}</span>
              </button>
            );
          })}
        </div>

        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Kit yacimiento"
        />

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.primary} ${!canSave ? styles.primaryDisabled : ''}`}
            onClick={() => canSave && onSave(name, chosen)}
          >
            Guardar plantilla
          </button>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
