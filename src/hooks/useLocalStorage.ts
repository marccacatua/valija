import { useCallback, useState } from 'react';

type SetValue<T> = T | ((prev: T) => T);

/**
 * localStorage puede fallar (modo privado, cuota llena, SSR). Ante cualquier
 * error devolvemos el default y seguimos: persistir es un "nice to have",
 * nunca debería tirar abajo la pantalla.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback(
    (next: SetValue<T>) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // idem: si no se puede persistir, la sesión sigue funcionando en memoria
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}
