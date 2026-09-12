import { useCallback } from 'react';
import type { CategoryKey, ItemTemplate } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'valija:templates';

/**
 * Plantillas personales del usuario (ver ItemTemplate en types.ts).
 * Totalmente independiente de useTrips: una plantilla no es un viaje,
 * es un grupo de ítems a mano guardado para aplicar en cualquier viaje
 * futuro.
 */
export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<ItemTemplate[]>(STORAGE_KEY, []);

  const saveTemplate = useCallback(
    (name: string, items: { cat: CategoryKey; name: string }[], homeTasks: string[] = []) => {
      const trimmed = name.trim();
      if (!trimmed || (items.length === 0 && homeTasks.length === 0)) return;
      const template: ItemTemplate = {
        id: crypto.randomUUID(),
        name: trimmed,
        items,
        homeTasks,
        createdAt: new Date().toISOString(),
      };
      setTemplates((prev) => [template, ...prev]);
    },
    [setTemplates],
  );

  const removeTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    },
    [setTemplates],
  );

  return { templates, saveTemplate, removeTemplate };
}
