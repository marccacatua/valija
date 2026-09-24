// QA de la versión en inglés, pantalla por pantalla (npm run qa:en).
//
// Recorre todas las pantallas y estados de la app con el navegador en
// inglés y, en CADA uno, chequea:
//   1. que no quede texto en español visible (letras con tilde, ñ, ¿, ¡,
//      o palabras típicas del español),
//   2. que no haya frases sin traducir (window.__i18nMissing, lo llena t()),
//   3. que nada se salga del ancho de la pantalla (el inglés a veces es más
//      largo y puede romper un botón o una fila).
// Además guarda una captura de cada estado en QA_SHOTS_DIR (si está
// definido) para revisarlas a ojo.
//
// Complementa a qa/i18n-check.ts (que verifica el diccionario contra el
// código) y a qa/ui.mjs (que sigue probando la app en español).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4196;
const BASE = `http://localhost:${PORT}`;
const SHOTS = process.env.QA_SHOTS_DIR;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // todavía no levantó
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`El servidor de preview no respondió en ${url} — ¿corriste "npm run build" antes?`);
}

const results = [];
function assert(cond, label, detail = '') {
  results.push({ label, pass: Boolean(cond), detail });
}

// Palabras que no existen en inglés y sí aparecen en los textos de la app.
// "Valija"/"Valu" son la marca y la mascota: quedan igual en inglés.
const SPANISH_CHARS = /[áéíóúñ¿¡]/i;
const SPANISH_WORDS = /\b(de|del|la|las|el|los|y|con|para|tu|tus|mis|una|que|en|sin|por|viaje|viajes|ítems?|acá|más|valijas)\b/i;
// Texto que escribe el usuario en las pruebas (no es de la app), y el link
// "Español" del pie, que está en español a propósito (es para cambiar de
// idioma).
const USER_TEXT = ['Lucky socks', 'Beach kit', 'Lisbon'];
const ALLOWED_LINES = ['Español'];

let shotN = 0;
async function checkScreen(page, label) {
  await page.waitForTimeout(250);
  const { text, missing, overflow } = await page.evaluate(() => ({
    text: document.body.innerText,
    missing: window.__i18nMissing ?? [],
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  const spanishLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !USER_TEXT.some((u) => l.includes(u)) && !ALLOWED_LINES.includes(l))
    .filter((l) => SPANISH_CHARS.test(l) || SPANISH_WORDS.test(l));
  assert(spanishLines.length === 0, `[${label}] sin texto en español`, spanishLines.slice(0, 4).join(' | '));
  assert(missing.length === 0, `[${label}] sin frases sin traducir`, missing.slice(0, 4).join(' | '));
  assert(overflow <= 1, `[${label}] nada se sale del ancho`, `sobran ${overflow}px`);
  if (SHOTS) {
    shotN += 1;
    await page.screenshot({ path: join(SHOTS, `${String(shotN).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-')}.png`), fullPage: true });
  }
}

async function freshPage(browser, { pro = true, seed } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  // Capturamos lo que se compartiría (share sheet) para revisar el texto.
  await ctx.addInitScript(() => {
    navigator.share = async (data) => {
      window.__shared = data;
    };
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/viajes`);
  await page.evaluate(
    ({ pro, seed }) => {
      localStorage.clear();
      if (pro) localStorage.setItem('valija:isPro', 'true');
      if (seed) for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
    },
    { pro, seed },
  );
  return { ctx, page };
}

const click = (page, text) => page.getByRole('button', { name: text, exact: true }).first().click();

/** Arma un viaje desde el formulario, tocando las opciones por su texto en inglés. */
async function createTrip(page, picks, { name } = {}) {
  await page.goto(`${BASE}/nuevo`);
  await page.waitForSelector('text=New trip');
  if (name) await page.fill('input', name);
  for (const p of picks) await click(page, p);
  await page.getByRole('button', { name: /^Pack my bag/ }).click();
  await page.waitForURL(/\/viaje\//);
  await page.waitForSelector('text=Your bag for');
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
let browser;
try {
  await waitForServer(BASE);
  browser = await chromium.launch(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : undefined);

  // --- 1. Primera vez: bienvenida, intro, formulario
  {
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASE}/`);
    await page.waitForSelector('text=From now on');
    await checkScreen(page, 'Bienvenida');
    await page.click('[role=button]');
    await page.waitForSelector('text=Three taps');
    await checkScreen(page, 'Intro');
    await click(page, 'Plan my first trip');
    await page.waitForSelector('text=New trip');
    await checkScreen(page, 'Formulario');
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    assert(htmlLang === 'en', 'El documento se marca como inglés (lang="en")', htmlLang);

    // Esquí: aviso de clima + texto de equipo alquilado/propio
    await click(page, 'Ski');
    await checkScreen(page, 'Formulario - esquí alquilado + aviso de calor');
    await click(page, "I'm bringing my own gear");
    await checkScreen(page, 'Formulario - esquí equipo propio');
    await click(page, 'Switch to Cold');
    assert((await page.locator('text=Skiing in hot weather?').count()) === 0, '"Switch to Cold" saca el aviso');
    await click(page, 'Diving');
    await checkScreen(page, 'Formulario - buceo equipo propio');
    await click(page, "I'm bringing my own gear");
    await checkScreen(page, 'Formulario - buceo alquilado');
    await click(page, 'Work');
    assert((await page.locator('text=Type of trip').count()) === 0, 'Con "Work" no aparece "Type of trip"');
    await ctx.close();
  }

  // --- 2. Sin Pro: candados, paywall y límite de viajes gratis
  {
    const { ctx, page } = await freshPage(browser, { pro: false });
    await page.goto(`${BASE}/nuevo`);
    await page.waitForSelector('text=New trip');
    await click(page, 'Ski');
    await page.waitForSelector('text=Unlock everything, forever');
    await checkScreen(page, 'Paywall');
    const price = await page.locator('text=USD 0.99').count();
    assert(price === 1, 'El precio se muestra con punto decimal (USD 0.99)', `count=${price}`);
    await click(page, 'Not now');
    const fakeTrip = (i) => ({
      id: `t${i}`,
      createdAt: '2026-09-01T00:00:00.000Z',
      form: { name: '', dest: ['playa'], clima: 'calor', motivo: 'placer', turismo: 'relax', aloj: 'hotel', transporte: 'avion', maletas: ['carry'], dias: 1, vestidos: false, lavaRopa: false, bebe: false, mascota: false, deporte: false, equipoPropio: false },
      items: [{ id: 'i1', cat: 'docs', name: 'DNI y pasaporte', qty: 1, done: false }],
      homeChecklist: [],
      boatChecklist: [],
    });
    await page.evaluate((trips) => localStorage.setItem('valija:trips', JSON.stringify(trips)), [fakeTrip(1), fakeTrip(2), fakeTrip(3)]);
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=My trips');
    await checkScreen(page, 'Mis viajes (viajes viejos guardados en español, 1 día)');
    const oneDay = await page.locator('text=/Beach · 1 day$/').count();
    assert(oneDay >= 1, 'Título automático en singular: "Beach · 1 day"', `count=${oneDay}`);
    await page.goto(`${BASE}/nuevo`);
    await page.waitForSelector("text=You've reached the limit");
    await checkScreen(page, 'Límite de viajes gratis');
    await page.goto(`${BASE}/viaje/t1`);
    await page.waitForSelector('text=Your bag for');
    await checkScreen(page, 'Checklist sin Pro (ítem guardado en español se ve en inglés)');
    assert((await page.locator('text=ID and passport').count()) === 1, 'Un ítem guardado en español se muestra traducido');
    await ctx.close();
  }

  // --- 3. Viajes con todas las categorías y opciones
  const configs = [
    {
      label: 'Playa+montaña+ciudad, bebé, mascota, camping, 3 valijas',
      picks: ['Mountains', 'City', 'Relax', 'Add dresses / skirts', "I'll be working out", 'Little one', 'Pet', 'Camping', "I'll do laundry on the trip", 'Checked bag', 'Backpack', 'Week · 7'],
    },
    { label: 'Esquí con equipo propio, frío, solo carry-on', picks: ['Mountains', 'Ski', "I'm bringing my own gear", 'Cold', 'Car', 'Weekend · 3'] },
    { label: 'Navegar (lista del barco)', picks: ['Sailing', 'Rainy', 'Bus', "Friends' place"] },
    { label: 'Buceo con equipo propio, templado', picks: ['Diving', "I'm bringing my own gear", 'Mild', 'Checked bag', 'Long · 14'] },
    { label: 'Trabajo en ciudad con frío, hostel', picks: ['City', 'Beach', 'Work', 'Cold', 'Hostel', 'Train'] },
    { label: 'Salidas con lluvia', picks: ['City', 'Beach', 'Nightlife', 'Rainy', 'Apartment / Airbnb'] },
    { label: 'Cultural', picks: ['City', 'Beach', 'Culture', 'Mild'] },
    { label: 'Aventura', picks: ['Mountains', 'Beach', 'Adventure'] },
  ];
  for (const cfg of configs) {
    const { ctx, page } = await freshPage(browser);
    await createTrip(page, cfg.picks, { name: 'Lisbon' });
    await checkScreen(page, `Checklist detallada - ${cfg.label}`);
    await click(page, 'Quick');
    await checkScreen(page, `Checklist rápida - ${cfg.label}`);
    await click(page, 'Detailed');
    await page.getByRole('button', { name: 'Share checklist', exact: true }).click();
    const shared = await page.evaluate(() => window.__shared?.text ?? '');
    const spanishShared = shared
      .split('\n')
      .filter((l) => !l.includes('Lisbon'))
      .filter((l) => SPANISH_CHARS.test(l) || SPANISH_WORDS.test(l));
    assert(shared.length > 0 && spanishShared.length === 0, `[${cfg.label}] texto para compartir sin español`, spanishShared.slice(0, 3).join(' | '));
    if (cfg.label.startsWith('Navegar')) {
      assert((await page.locator('text=Is everything ready to set sail?').count()) === 1, 'Navegar muestra la lista del barco en inglés');
    }
    if (cfg.label.startsWith('Esquí')) {
      assert((await page.locator('text=Change bags').count()) >= 1, 'Esquí en carry-on muestra el aviso de espacio');
      await click(page, 'Change bags');
      await checkScreen(page, 'Hoja "Change bags"');
      await click(page, 'Cancel');
    }
    if (cfg.label.startsWith('Playa+montaña')) {
      await page.getByRole('button', { name: 'See how to split across your bags', exact: true }).click();
      await page.waitForSelector('text=How to split your luggage');
      await checkScreen(page, 'Distribución en valijas');
    }
    await ctx.close();
  }

  // --- 4. Interacciones de la checklist: progreso, búsqueda, borrar/deshacer, plantillas, renombrar
  {
    const { ctx, page } = await freshPage(browser);
    await createTrip(page, ['Checked bag']);
    const note = async () => (await page.locator('text=/Start with your documents|Next up|items? left|All packed/').first().textContent()) ?? '';
    assert((await note()) === 'Start with your documents', 'Progreso inicial: "Start with your documents"', await note());
    const docItems = ['ID and passport', "Driver's license", 'Tickets / boarding pass', 'Accommodation booking', 'Wallet', 'Cards and cash', 'Travel insurance'];
    for (const it of docItems) await page.locator('button', { hasText: it }).first().click();
    assert((await note()) === 'Next up: toiletries', 'Al completar documentos: "Next up: toiletries"', await note());
    await checkScreen(page, 'Checklist con documentos completos');

    await page.fill('input[placeholder="Search items…"]', 'zzz');
    await checkScreen(page, 'Búsqueda sin resultados');
    await page.fill('input[placeholder="Search items…"]', '');
    await click(page, 'Not packed');
    await checkScreen(page, 'Filtro "Not packed"');
    await click(page, 'Not packed');

    await page.getByRole('button', { name: 'Delete Sunglasses', exact: true }).click();
    await page.waitForSelector('text="Sunglasses" deleted');
    await checkScreen(page, 'Deshacer borrado');
    await click(page, 'Undo');

    await page.fill('input[placeholder="Add item…"]', 'Lucky socks');
    await click(page, 'Add');
    await click(page, 'Save items as a template');
    await page.waitForSelector('text=Save as template');
    await checkScreen(page, 'Hoja "Save as template"');
    await page.fill('input[placeholder^="E.g."]', 'Beach kit');
    await click(page, 'Save template');
    await click(page, 'Apply a template');
    await page.waitForSelector('text=My templates');
    await checkScreen(page, 'Hoja "My templates"');
    await page.getByRole('button', { name: 'Delete template Beach kit', exact: true }).click();
    await checkScreen(page, 'Confirmar borrar plantilla');
    await click(page, 'Cancel');
    await click(page, 'Close');

    await page.getByRole('button', { name: 'Rename trip', exact: true }).click();
    await checkScreen(page, 'Renombrar viaje');
    await page.keyboard.press('Escape');

    // Tildar todo desde la vista rápida
    await click(page, 'Quick');
    const groups = page.locator('button', { hasText: /\d+ items?$/ });
    const n = await groups.count();
    for (let i = 0; i < n; i++) await groups.nth(i).click();
    await click(page, 'Detailed');
    const left = await note();
    assert(/items? left|All packed/.test(left), 'Progreso en inglés después de tildar todo en la vista rápida', left);
    await ctx.close();
  }

  // --- 5. "Mis viajes": finalizados, borrar, backup, pie
  {
    const { ctx, page } = await freshPage(browser);
    await createTrip(page, []);
    await createTrip(page, ['Mountains', 'Beach']);
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=My trips');
    await checkScreen(page, 'Mis viajes');
    await page.getByRole('button', { name: /^Mark .* as finished$/ }).first().click();
    await checkScreen(page, 'Mis viajes con uno finalizado');
    await page.getByRole('button', { name: /^Delete Beach/ }).first().click();
    await checkScreen(page, 'Confirmar borrar viaje');
    await click(page, 'Cancel');
    await click(page, 'Delete all trips');
    await checkScreen(page, 'Confirmar borrar todos');
    await click(page, 'Yes, delete');
    await checkScreen(page, 'Confirmación final');
    await click(page, 'Cancel');
    await click(page, 'Move my data between Safari and Home Screen');
    await page.waitForSelector('text=Move my data');
    await checkScreen(page, 'Hoja de backup');
    await page.fill('textarea', 'esto no es un backup');
    await click(page, 'Restore');
    await checkScreen(page, 'Backup con texto inválido');
    await click(page, 'Close');
    await page.goto(`${BASE}/privacidad`);
    await page.waitForSelector('text=Privacy policy');
    await checkScreen(page, 'Política de privacidad');
    await page.goto(`${BASE}/soporte`);
    await page.waitForSelector('text=How do I get started?');
    await checkScreen(page, 'Soporte');
    await ctx.close();
  }

  // --- 6. Cambio de idioma manual desde el pie de "Mis viajes"
  {
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=My trips');
    await click(page, 'Español');
    await page.waitForSelector('text=Mis viajes');
    assert(true, 'El link "Español" pasa la app a español');
    await page.goto(`${BASE}/viajes`);
    assert((await page.locator('text=Mis viajes').count()) === 1, 'La elección de idioma queda guardada');
    await click(page, 'English');
    await page.waitForSelector('text=My trips');
    assert(true, 'El link "English" vuelve a inglés');
    await ctx.close();
  }
} catch (err) {
  results.push({ label: 'EXCEPCION NO MANEJADA', pass: false, detail: err.stack || String(err) });
} finally {
  if (browser) await browser.close();
  server.kill();
}

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== RESULTADOS (inglés): ${passed}/${results.length} OK ===\n`);
for (const r of results) console.log(`${r.pass ? '✓' : '✗ FALLA'} ${r.label}${!r.pass && r.detail ? ' — ' + r.detail : ''}`);
if (passed !== results.length) process.exitCode = 1;
