import { DE } from './de';
import { DE_ITEMS } from './deItems';
import { EN } from './en';
import { EN_ITEMS } from './enItems';
import { ES_ES, ES_ES_ITEMS } from './esES';
import { ES_TU, ES_TU_ITEMS } from './esTu';
import { PT } from './pt';
import { PT_ITEMS } from './ptItems';

/**
 * Traducción estilo "gettext": el texto en español rioplatense ES la
 * clave. El código sigue leyéndose en español (`t('Mis viajes')`) y los
 * otros idiomas viven en diccionarios aparte. Si a inglés, alemán o
 * portugués le
 * falta una traducción, se muestra el español y queda anotada en
 * `window.__i18nMissing`: el QA falla si esa lista no está vacía.
 *
 * Los dos españoles "con tú" (España y Latinoamérica) son diccionarios
 * parciales: solo tienen las frases que cambian (voseo → tú, "valija" →
 * "maleta", "remera" → "camiseta"…). Lo que no está se muestra igual que
 * en rioplatense. España se apoya además en el de Latinoamérica: primero
 * busca en ES_ES, después en ES_TU.
 *
 * Los ítems generados (y las tareas de casa/barco) usan su nombre en
 * español como identificador fijo — ya está guardado así en los viajes de
 * cada usuario, lo usan el orden de la ropa y el cálculo de espacio. Por
 * eso NO se traducen al generarse, sino recién al mostrarse
 * (`itemLabel`). Los ítems que escribió el usuario no están en el
 * diccionario y se muestran tal cual.
 */
export type Lang = 'es' | 'es-ES' | 'es-419' | 'en' | 'de' | 'pt';

/** Para el selector de idioma del pie de "Mis viajes": cada uno en su propio idioma. */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'Español (Uruguay y Argentina)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'es-419', label: 'Español (Latinoamérica)' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
];

const LANG_KEY = 'valija:lang';
const isLang = (x: string | null): x is Lang => LANGS.some((l) => l.code === x);

/**
 * Idioma según la etiqueta del dispositivo ("es-UY", "es-MX", "de-DE"…):
 * - Uruguay y Argentina (o español sin país) → rioplatense, como siempre.
 * - España → español de España.
 * - Cualquier otro país de habla hispana → español "con tú".
 * - Alemán → alemán. Portugués (Brasil o Portugal) → portugués de Brasil.
 * - Todo lo demás → inglés.
 */
export function langFromDeviceTag(tag: string): Lang {
  const [language, ...rest] = tag.toLowerCase().replace(/_/g, '-').split('-');
  if (language === 'es') {
    // La región es la parte de 2 letras o 3 dígitos ("es-419"), salteando
    // un posible script ("es-Latn-MX").
    const region = rest.find((p) => /^([a-z]{2}|\d{3})$/.test(p));
    if (!region || region === 'uy' || region === 'ar') return 'es';
    if (region === 'es') return 'es-ES';
    return 'es-419';
  }
  if (language === 'de') return 'de';
  if (language === 'pt') return 'pt';
  return 'en';
}

declare global {
  interface Window {
    __i18nMissing?: string[];
    /** Idioma del iPhone, leído con @capacitor/device antes de arrancar (ver main.tsx). */
    __deviceLangTag?: string;
  }
}

function detectLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isLang(fromUrl)) {
      window.localStorage.setItem(LANG_KEY, fromUrl);
      return fromUrl;
    }
    const saved = window.localStorage.getItem(LANG_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // sin storage: se decide por el idioma del dispositivo
  }
  const device = window.__deviceLangTag ?? navigator.languages?.[0] ?? navigator.language ?? 'es';
  return langFromDeviceTag(device);
}

export const lang: Lang = typeof window === 'undefined' ? 'es' : detectLang();

/** Cualquiera de los tres españoles. */
export const isSpanish = lang === 'es' || lang === 'es-ES' || lang === 'es-419';

const HTML_LANG: Record<Lang, string> = { es: 'es-AR', 'es-ES': 'es-ES', 'es-419': 'es-419', en: 'en', de: 'de', pt: 'pt-BR' };
const TITLE: Record<Lang, string> = {
  es: 'Valija · Checklist de viaje',
  'es-ES': 'Valija · Checklist de viaje',
  'es-419': 'Valija · Checklist de viaje',
  en: 'Valija · Packing checklist',
  de: 'Valija · Packliste',
  pt: 'Valija · Lista de viagem',
};
if (typeof document !== 'undefined') {
  document.documentElement.lang = HTML_LANG[lang];
  document.title = TITLE[lang];
}

/** Locale para fechas (`toLocaleDateString`). */
export const dateLocale = ({ es: 'es-AR', 'es-ES': 'es-ES', 'es-419': 'es-MX', en: 'en-US', de: 'de-DE', pt: 'pt-BR' } as const)[lang];

/** Cambia el idioma a mano (selector del pie de "Mis viajes") y recarga. */
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

function reportMissing(key: string) {
  if (typeof window === 'undefined') return;
  const list = (window.__i18nMissing ??= []);
  if (!list.includes(key)) list.push(key);
}

function interpolate(text: string, params?: Record<string, string | number>) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Frase en el idioma activo, o undefined si falta en un diccionario completo. */
function lookup(es: string, full: Record<string, string> | null, ...partial: Record<string, string>[]): string | undefined {
  if (full) return full[es];
  for (const dict of partial) if (es in dict) return dict[es];
  return es;
}

const UI: Record<Lang, [Record<string, string> | null, ...Record<string, string>[]]> = {
  es: [null],
  'es-419': [null, ES_TU],
  'es-ES': [null, ES_ES, ES_TU],
  en: [EN],
  de: [DE],
  pt: [PT],
};
const ITEMS: Record<Lang, [Record<string, string> | null, ...Record<string, string>[]]> = {
  es: [null],
  'es-419': [null, ES_TU_ITEMS],
  'es-ES': [null, ES_ES_ITEMS, ES_TU_ITEMS],
  en: [EN_ITEMS],
  de: [DE_ITEMS],
  pt: [PT_ITEMS],
};

/** Texto de la interfaz. `params` reemplaza `{nombre}` en la frase. */
export function t(es: string, params?: Record<string, string | number>): string {
  const found = lookup(es, ...UI[lang]);
  if (found === undefined) {
    reportMissing(es);
    return interpolate(es, params);
  }
  return interpolate(found, params);
}

/** Singular/plural: `tn(n, '{n} día', '{n} días')`. */
export function tn(n: number, one: string, other: string): string {
  return t(n === 1 ? one : other, { n });
}

/** Nombre visible de un ítem o tarea. Los generados se traducen; los que
 * escribió el usuario se muestran tal cual. */
export function itemLabel(name: string): string {
  return lookup(name, ...ITEMS[lang]) ?? name;
}

/** Litros con un decimal si son pocos: "9,6" en español, alemán y portugués; "9.6" en inglés. */
export function fmtLiters(l: number): string {
  if (l >= 10) return String(Math.round(l));
  const fixed = l.toFixed(1);
  return lang === 'en' ? fixed : fixed.replace('.', ',');
}
