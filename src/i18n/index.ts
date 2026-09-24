import { EN } from './en';
import { EN_ITEMS } from './enItems';

/**
 * Traducción estilo "gettext": el texto en español ES la clave. El código
 * sigue leyéndose en español (`t('Mis viajes')`) y el inglés vive en un
 * diccionario aparte (en.ts / enItems.ts). Si falta una traducción, se
 * muestra el español y queda anotada en `window.__i18nMissing`: el QA en
 * inglés falla si esa lista no está vacía.
 *
 * Los ítems generados (y las tareas de casa/barco) usan su nombre en
 * español como identificador fijo — ya está guardado así en los viajes de
 * cada usuario, lo usan el orden de la ropa y el cálculo de espacio. Por
 * eso NO se traducen al generarse, sino recién al mostrarse
 * (`itemLabel`). Los ítems que escribió el usuario no están en el
 * diccionario y se muestran tal cual.
 */
export type Lang = 'es' | 'en';

const LANG_KEY = 'valija:lang';

function detectLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'es' || fromUrl === 'en') {
      window.localStorage.setItem(LANG_KEY, fromUrl);
      return fromUrl;
    }
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // sin storage: se decide por el idioma del dispositivo
  }
  const device = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
  return device.startsWith('es') ? 'es' : 'en';
}

export const lang: Lang = typeof window === 'undefined' ? 'es' : detectLang();

if (typeof document !== 'undefined' && lang === 'en') {
  document.documentElement.lang = 'en';
  document.title = 'Valija · Packing checklist';
}

/** Locale para fechas (`toLocaleDateString`). */
export const dateLocale = lang === 'en' ? 'en-US' : 'es-AR';

/** Cambia el idioma a mano (link del pie de "Mis viajes") y recarga. */
export function switchLang(next: Lang) {
  try {
    window.localStorage.setItem(LANG_KEY, next);
  } catch {
    // si no se puede guardar, igual recargamos con el parámetro
  }
  const url = new URL(window.location.href);
  url.searchParams.set('lang', next);
  window.location.replace(url.toString());
}

declare global {
  interface Window {
    __i18nMissing?: string[];
  }
}

function reportMissing(key: string) {
  if (typeof window === 'undefined') return;
  const list = (window.__i18nMissing ??= []);
  if (!list.includes(key)) list.push(key);
}

function interpolate(text: string, params?: Record<string, string | number>) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Texto de la interfaz. `params` reemplaza `{nombre}` en la frase. */
export function t(es: string, params?: Record<string, string | number>): string {
  if (lang === 'es') return interpolate(es, params);
  const en = EN[es];
  if (en === undefined) {
    reportMissing(es);
    return interpolate(es, params);
  }
  return interpolate(en, params);
}

/** Singular/plural: `tn(n, '{n} día', '{n} días')`. */
export function tn(n: number, one: string, other: string): string {
  return t(n === 1 ? one : other, { n });
}

/** Nombre visible de un ítem o tarea. Los generados se traducen; los que
 * escribió el usuario se muestran tal cual. */
export function itemLabel(name: string): string {
  if (lang === 'es') return name;
  return EN_ITEMS[name] ?? name;
}

/** Litros con un decimal si son pocos: "9,6" en español, "9.6" en inglés. */
export function fmtLiters(l: number): string {
  if (l >= 10) return String(Math.round(l));
  const fixed = l.toFixed(1);
  return lang === 'es' ? fixed.replace('.', ',') : fixed;
}
