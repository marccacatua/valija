import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Guardado durable para la app nativa.
 *
 * Toda la app lee y escribe en localStorage (sincrónico, simple), pero en
 * iOS el localStorage de un WKWebView NO es un lugar seguro: el sistema
 * lo puede liberar cuando el teléfono se queda sin espacio, y Capacitor
 * mismo recomienda no guardar ahí nada que no se pueda perder. Por eso,
 * en la app nativa, cada escritura se copia también a Preferences
 * (UserDefaults de iOS, que es durable y entra en el backup de iCloud y
 * en la migración a un iPhone nuevo), y al arrancar se restaura desde ahí
 * antes de mostrar la primera pantalla.
 *
 * Preferences es la fuente de verdad; localStorage queda como una caché
 * sincrónica para no tener que volver asíncrona toda la app. En la web no
 * cambia nada: sigue siendo solo localStorage.
 */
export const PERSISTED_KEYS = ['valija:trips', 'valija:templates', 'valija:isPro', 'valija:lastTripId'] as const;

const isNative = () => Capacitor.isNativePlatform();

/** Reemplazo de `localStorage.setItem` para las claves de la app. */
export function persistItem(key: string, raw: string) {
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // si localStorage falla, igual intentamos dejarlo en Preferences
  }
  if (isNative()) {
    Preferences.set({ key, value: raw }).catch(() => {});
  }
}

/**
 * Llamar una vez al arrancar, antes de renderizar. Por cada clave:
 * - si Preferences la tiene → se copia a localStorage (así se recupera
 *   un localStorage que iOS haya borrado);
 * - si solo está en localStorage → se copia a Preferences (migración de
 *   quienes vienen de una versión anterior a esta).
 * Tiene un tope de tiempo: si el puente nativo no responde, la app
 * arranca igual con lo que haya en localStorage.
 */
export async function hydrateStorage(timeoutMs = 1500): Promise<void> {
  if (!isNative()) return;
  const work = Promise.all(
    PERSISTED_KEYS.map(async (key) => {
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        window.localStorage.setItem(key, value);
        return;
      }
      const local = window.localStorage.getItem(key);
      if (local !== null) await Preferences.set({ key, value: local });
    }),
  ).then(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  try {
    await Promise.race([work, timeout]);
  } catch {
    // arrancamos con lo que haya en localStorage
  }
}
