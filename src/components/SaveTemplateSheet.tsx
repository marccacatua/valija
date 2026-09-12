import { useState } from 'react';
import type { HomeTask, PackingItem } from '../types';
import styles from './TemplateSheets.module.css';

interface SaveTemplateSheetProps {
  items: PackingItem[];
  homeTasks: HomeTask[];
  placeholderExample: string;
  onSave: (name: string, items: PackingItem[], homeTasks: HomeTask[]) => void;
  onCancel: () => void;
}

/** Elegís con checkboxes cuáles de tus ítems y tareas a mano entran en
 * la plantilla nueva — no todo lo que agregaste tiene por qué repetirse
 * en el próximo viaje (ej. "llevar al perro a guardería" sí, pero un
 * ítem puntual de ese viaje puntual quizás no). */
export function SaveTemplateSheet({ items, homeTasks, placeholderExample, onSave, onCancel }: SaveTemplateSheetProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set(homeTasks.map((t) => t.id)));
  const [name, setName] = useState('');

  const toggleItem = (id: string) =>
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleTask = (id: string) =>
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosenItems = items.filter((i) => selectedItems.has(i.id));
  const chosenTasks = homeTasks.filter((t) => selectedTasks.has(t.id));
  const canSave = name.trim().length > 0 && (chosenItems.length > 0 || chosenTasks.length > 0);
  // solo mostramos los subtítulos "De la valija" / "De casa" cuando hay
  // de los dos tipos — si es solo uno, aclarar de más estorba
  const showGroupLabels = items.length > 0 && homeTasks.length > 0;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Guardar como plantilla</div>
        <div className={styles.subtitle}>Elegí qué entra y ponele un nombre.</div>

        {items.length > 0 && (
          <div className={styles.list}>
            {showGroupLabels && <div className={styles.groupLabel}>De la valija</div>}
            {items.map((item) => {
              const on = selectedItems.has(item.id);
              return (
                <button type="button" key={item.id} className={styles.row} onClick={() => toggleItem(item.id)}>
                  <span className={`${styles.checkbox} ${on ? styles.checkboxOn : ''}`}>✓</span>
                  <span className={styles.name}>{item.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {homeTasks.length > 0 && (
          <div className={styles.list}>
            {showGroupLabels && <div className={styles.groupLabel}>De casa</div>}
            {homeTasks.map((task) => {
              const on = selectedTasks.has(task.id);
              return (
                <button type="button" key={task.id} className={styles.row} onClick={() => toggleTask(task.id)}>
                  <span className={`${styles.checkbox} ${on ? styles.checkboxOn : ''}`}>✓</span>
                  <span className={styles.name}>{task.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Ej. ${placeholderExample}`}
        />

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.primary} ${!canSave ? styles.primaryDisabled : ''}`}
            onClick={() => canSave && onSave(name, chosenItems, chosenTasks)}
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
