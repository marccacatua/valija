import { Capacitor } from '@capacitor/core'
import { hydrateStorage } from './data/storage'

// Atajo para desbloquear Pro por link, sin devtools (solo web, donde no hay
// compra real): abrir la app una vez con ?pro=1 al final de la URL alcanza,
// queda guardado en localStorage.
try {
  if (new URLSearchParams(window.location.search).get('pro') === '1') {
    localStorage.setItem('valija:isPro', 'true')
    window.history.replaceState(null, '', window.location.pathname)
  }
} catch {
  // localStorage puede fallar (modo privado, cuota llena) — no es crítico
}

/**
 * En el iPhone, el idioma se lee del sistema con @capacitor/device: el
 * navegador interno de la app (WKWebView) no siempre informa el país
 * ("es-MX" vs "es-UY"), y el país decide qué español se muestra (ver
 * i18n/index.ts). Con un tope de tiempo: si el puente nativo no responde,
 * se usa lo que diga el navegador.
 */
async function readDeviceLanguage(timeoutMs = 800) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Device } = await import('@capacitor/device')
    const tag = await Promise.race([
      Device.getLanguageTag().then((r) => r.value),
      new Promise<undefined>((resolve) => setTimeout(resolve, timeoutMs)),
    ])
    if (tag) window.__deviceLangTag = tag
  } catch {
    // seguimos con el idioma del navegador
  }
}

// Primero se restauran los datos guardados de forma durable (ver
// data/storage.ts) y se lee el idioma; recién después se carga el resto
// de la app. Tiene que ser en ese orden porque varios textos se traducen
// al cargar cada módulo, y para eso el idioma ya tiene que estar decidido.
Promise.all([hydrateStorage(), readDeviceLanguage()])
  .catch(() => undefined)
  .then(() => import('./bootstrap'))
  .then(({ start }) => start())
