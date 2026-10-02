// QA de alemán, español de España y español "con tú", pantalla por
// pantalla (npm run qa:langs). Para inglés está qa/ui-en.mjs y para el
// rioplatense, qa/ui.mjs.
//
// Para cada idioma recorre bienvenida, formulario, varios tipos de viaje
// (bebé, mascota, esquí, navegar, buceo, camping, trabajo), reparto,
// editar opciones, plantillas, paywall, "Mis viajes", privacidad y soporte,
// y en cada pantalla chequea:
//   - alemán: que no quede texto en español ni frases sin traducir;
//   - españoles con tú: que no quede voseo ni palabras rioplatenses;
//   - todos: que nada se salga del ancho de la pantalla.
// Los botones se tocan por su texto traducido (sale de los mismos
// diccionarios de la app), así la prueba también confirma que existen.
//
// Además prueba la detección automática (es-UY, es-AR, es-ES, es-MX,
// es-419, de-DE, fr-FR) y el selector de idioma del pie de "Mis viajes".
import { chromium, type Browser, type Page } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DE } from '../src/i18n/de';
import { ES_ES } from '../src/i18n/esES';
import { ES_TU } from '../src/i18n/esTu';
import { LANGS, type Lang } from '../src/i18n/index';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4197;
const BASE = `http://localhost:${PORT}`;
const SHOTS = process.env.QA_SHOTS_DIR;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

type TestLang = 'de' | 'es-ES' | 'es-419';
const DICTS: Record<TestLang, Record<string, string>[]> = { de: [DE], 'es-ES': [ES_ES, ES_TU], 'es-419': [ES_TU] };
const LOCALE: Record<TestLang, string> = { de: 'de-DE', 'es-ES': 'es-ES', 'es-419': 'es-MX' };

/** Texto que la app muestra para una frase (clave en rioplatense) en un idioma. */
function T(lang: TestLang, es: string, params: Record<string, string | number> = {}) {
  let text = es;
  for (const d of DICTS[lang]) {
    if (es in d) {
      text = d[es];
      break;
    }
  }
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const results: { label: string; pass: boolean; detail: string }[] = [];
function assert(cond: unknown, label: string, detail = '') {
  results.push({ label, pass: Boolean(cond), detail });
}

// Español que no debería aparecer en alemán (mismo criterio que en inglés).
const SPANISH_CHARS = /[áéíóúñ¿¡]/i;
// Bordes de palabra que entienden letras como ß, ö o ñ (\b solo conoce a-z).
const SPANISH_WORDS = /(?<!\p{L})(de|del|la|las|el|los|y|con|para|tu|tus|mis|una|que|en|sin|por|viaje|viajes|ítems?|acá|más|valijas)(?!\p{L})/iu;
// Voseo y rioplatense que no deberían aparecer en los españoles con tú.
const VOSEO = /(?<!\p{L})(acá|vos|tenés|podés|querés|tocá|elegí|armá|sumá|tildá|probá|desbloqueá|creá|guardá|pegá|pegalo|mantené|contanos|recibí|seguí|arrancá|borrá|pausá|repetí|ponele|viajás|alquilás|llevás|sumás|empacás|olvidás|mojás|laburo|valijas?|remeras?|camperas?|buzos?|pollera|ojotas|championes|heladera)(?!\p{L})/u;
// Las etiquetas del selector de idioma están cada una en su idioma a propósito.
const LANG_LABELS = LANGS.map((l) => l.label);
const USER_TEXT = ['Calcetines de la suerte', 'Glückssocken'];

let shotN = 0;
async function checkScreen(page: Page, lang: TestLang, label: string) {
  await page.waitForTimeout(250);
  const { text, missing, overflow } = await page.evaluate(() => ({
    text: document.body.innerText,
    missing: window.__i18nMissing ?? [],
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !USER_TEXT.some((u) => l.includes(u)))
    .map((l) => LANG_LABELS.reduce((acc, ll) => acc.replace(ll, ''), l).replace('▾', '').trim())
    .filter(Boolean);
  if (lang === 'de') {
    const spanish = lines.filter((l) => SPANISH_CHARS.test(l) || SPANISH_WORDS.test(l));
    assert(spanish.length === 0, `[${lang}] [${label}] sin texto en español`, spanish.slice(0, 4).join(' | '));
    assert(missing.length === 0, `[${lang}] [${label}] sin frases sin traducir`, missing.slice(0, 4).join(' | '));
  } else {
    const vos = lines.filter((l) => VOSEO.test(l));
    assert(vos.length === 0, `[${lang}] [${label}] sin voseo ni rioplatense`, vos.slice(0, 4).join(' | '));
  }
  assert(overflow <= 1, `[${lang}] [${label}] nada se sale del ancho`, `sobran ${overflow}px`);
  if (SHOTS) {
    shotN += 1;
    await page.screenshot({ path: join(SHOTS, `${String(shotN).padStart(3, '0')}-${lang}-${label.replace(/[^a-z0-9]+/gi, '-')}.png`), fullPage: true });
  }
}

async function freshPage(browser: Browser, lang: TestLang, { pro = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: LOCALE[lang] });
  await ctx.addInitScript(() => {
    navigator.share = async () => {};
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/viajes`);
  await page.evaluate(
    ({ pro, lang }) => {
      localStorage.clear();
      localStorage.setItem('valija:lang', lang);
      if (pro) localStorage.setItem('valija:isPro', 'true');
    },
    { pro, lang },
  );
  return { ctx, page };
}

const click = (page: Page, text: string) => page.getByRole('button', { name: text, exact: true }).first().click();

async function createTrip(page: Page, lang: TestLang, picks: string[]) {
  await page.goto(`${BASE}/nuevo`);
  await page.waitForSelector(`text=${T(lang, 'Nuevo viaje')}`);
  for (const p of picks) await click(page, T(lang, p));
  const packLabel = T(lang, 'Armar mi valija · {n} ítems').split('·')[0].trim();
  await page.getByRole('button', { name: new RegExp('^' + escapeRe(packLabel)) }).click();
  await page.waitForURL(/\/viaje\//);
  await page.waitForSelector(`text=${T(lang, 'Tu valija para')}`);
}

async function expandAll(page: Page, lang: TestLang) {
  const btn = page.getByRole('button', { name: T(lang, 'Desplegar todo'), exact: true });
  if (await btn.count()) await btn.first().click();
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
let browser: Browser | undefined;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      // todavía no levantó
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  browser = await chromium.launch(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : undefined);

  for (const lang of ['de', 'es-ES', 'es-419'] as TestLang[]) {
    // --- Primera vez y formulario
    {
      const { ctx, page } = await freshPage(browser, lang);
      await page.goto(`${BASE}/`);
      await page.waitForTimeout(600);
      await checkScreen(page, lang, 'bienvenida');
      await page.goto(`${BASE}/intro`);
      await checkScreen(page, lang, 'intro');
      await page.goto(`${BASE}/nuevo`);
      await page.waitForSelector(`text=${T(lang, 'Nuevo viaje')}`);
      await checkScreen(page, lang, 'formulario');
      // aviso de esquí con calor
      await click(page, T(lang, 'Esquí'));
      await checkScreen(page, lang, 'formulario esquí con calor');
      await ctx.close();
    }

    // --- Viajes de distintos tipos
    {
      const { ctx, page } = await freshPage(browser, lang);
      await createTrip(page, lang, ['Playa', 'Niño chico', 'Mascota', 'Mochila']);
      await expandAll(page, lang);
      await checkScreen(page, lang, 'playa con bebé y mascota');
      await click(page, T(lang, 'Ver cómo repartir en tus valijas'));
      await page.waitForSelector(`text=${T(lang, 'Cómo repartir tu equipaje')}`);
      await checkScreen(page, lang, 'reparto');

      await createTrip(page, lang, ['Montaña', 'Frío', 'Calor', 'Esquí', 'Llevo mi propio equipo', 'Bodega']);
      await expandAll(page, lang);
      await checkScreen(page, lang, 'esquí con equipo propio');

      await createTrip(page, lang, ['Playa', 'Navegar', 'Buceo', 'Camping', 'Bodega']);
      await expandAll(page, lang);
      await checkScreen(page, lang, 'navegar, buceo y camping');
      await click(page, T(lang, 'Ver cómo repartir en tus valijas'));
      await page.waitForSelector(`text=${T(lang, 'Cómo repartir tu equipaje')}`);
      await checkScreen(page, lang, 'reparto con va aparte');

      await createTrip(page, lang, ['Ciudad', 'Templado', 'Trabajo', 'Largo · 14']);
      await expandAll(page, lang);
      await checkScreen(page, lang, 'trabajo 14 días');

      // Editar opciones del viaje
      await click(page, T(lang, 'Editar opciones'));
      await page.waitForSelector(`text=${T(lang, 'Editar viaje')}`);
      await click(page, T(lang, 'Lluvia'));
      await checkScreen(page, lang, 'editar opciones');
      await click(page, T(lang, 'Guardar cambios'));
      await page.waitForSelector(`text=${T(lang, 'Tu valija para')}`);
      await checkScreen(page, lang, 'después de editar');

      // Ítem propio y plantilla
      await page.fill(`input[placeholder="${T(lang, 'Agregar ítem…')}"]`, lang === 'de' ? 'Glückssocken' : 'Calcetines de la suerte');
      await click(page, T(lang, 'Agregar'));
      await click(page, T(lang, 'Guardar ítems como plantilla'));
      await page.waitForSelector(`text=${T(lang, 'Elegí qué entra y ponele un nombre.')}`);
      await checkScreen(page, lang, 'guardar plantilla');
      await click(page, T(lang, 'Cancelar'));

      // Tildar todo: mensaje de valija completa
      for (let i = 0; i < 15; i++) {
        const tickAll = page.getByRole('button', { name: new RegExp('^' + escapeRe(T(lang, 'Tildar todo {title}')).replace('\\{title\\}', '.+') + '$') });
        if (!(await tickAll.count())) break;
        await tickAll.first().click();
        await page.waitForTimeout(150);
      }
      await checkScreen(page, lang, 'viaje completo');

      await page.goto(`${BASE}/viajes`);
      await page.waitForSelector(`text=${T(lang, 'Mis viajes')}`);
      await checkScreen(page, lang, 'mis viajes');
      await page.goto(`${BASE}/privacidad`);
      await checkScreen(page, lang, 'privacidad');
      await page.goto(`${BASE}/soporte`);
      await checkScreen(page, lang, 'soporte');
      await ctx.close();
    }

    // --- Sin Pro: paywall y límite de viajes gratis
    {
      const { ctx, page } = await freshPage(browser, lang, { pro: false });
      await page.goto(`${BASE}/nuevo`);
      await page.waitForSelector(`text=${T(lang, 'Nuevo viaje')}`);
      await click(page, T(lang, 'Niño chico'));
      await page.waitForSelector(`text=${T(lang, 'Desbloqueá todo, para siempre')}`);
      await checkScreen(page, lang, 'paywall');
      await click(page, T(lang, 'Ahora no'));
      for (let i = 0; i < 3; i++) await createTrip(page, lang, []);
      await page.goto(`${BASE}/nuevo`);
      await page.waitForSelector(`text=${T(lang, 'Llegaste al límite de {n} viajes gratis', { n: 3 })}`);
      await checkScreen(page, lang, 'límite gratis');
      await ctx.close();
    }
  }

  // --- Detección automática del idioma según el dispositivo
  const expected: [string, string][] = [
    ['es-UY', 'es-AR'],
    ['es-AR', 'es-AR'],
    ['es-ES', 'es-ES'],
    ['es-MX', 'es-419'],
    ['es-419', 'es-419'],
    ['es-CL', 'es-419'],
    ['de-DE', 'de'],
    ['de-AT', 'de'],
    ['fr-FR', 'en'],
    ['en-US', 'en'],
  ];
  for (const [locale, htmlLang] of expected) {
    const ctx = await browser.newContext({ locale });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/viajes`);
    await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
    const got = await page.evaluate(() => document.documentElement.lang);
    assert(got === htmlLang, `Dispositivo en ${locale} → idioma ${htmlLang}`, `quedó ${got}`);
    await ctx.close();
  }

  // --- Selector de idioma del pie de "Mis viajes"
  {
    const ctx = await browser.newContext({ locale: 'es-UY', viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/viajes`);
    const codes: Lang[] = ['de', 'es-ES', 'es-419', 'en', 'es'];
    const htmlOf: Record<Lang, string> = { de: 'de', 'es-ES': 'es-ES', 'es-419': 'es-419', en: 'en', es: 'es-AR' };
    for (const code of codes) {
      await page.selectOption('select', code);
      await page.waitForLoadState('load');
      await page.waitForTimeout(300);
      const got = await page.evaluate(() => document.documentElement.lang);
      assert(got === htmlOf[code], `Selector de idioma → ${code}`, `quedó ${got}`);
    }
    // y se recuerda al volver a abrir (sin el ?lang= de la URL)
    await page.selectOption('select', 'de');
    await page.waitForTimeout(300);
    await page.goto(`${BASE}/viajes`);
    await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
    const kept = await page.evaluate(() => document.documentElement.lang);
    assert(kept === 'de', 'El idioma elegido a mano se recuerda', `quedó ${kept}`);
    await ctx.close();
  }
} catch (e) {
  assert(false, 'La prueba terminó sin errores inesperados', String(e).split('\n').slice(0, 6).join(' / '));
} finally {
  await browser?.close();
  server.kill();
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.label}${r.pass || !r.detail ? '' : ` — ${r.detail}`}`);
console.log(`\n=== RESULTADOS (alemán y españoles con tú): ${results.length - failed.length}/${results.length} OK ===`);
if (failed.length) process.exitCode = 1;
