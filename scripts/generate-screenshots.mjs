// Genera las capturas para App Store Connect a partir de la app real (no
// mockups): levanta un preview local, arma un viaje de ejemplo con algo de
// progreso para que se vea "viva", y saca una captura por pantalla clave en
// cada tamaño de iPhone que pide Apple.
//
// Correr con: node scripts/generate-screenshots.mjs (requiere `npm run
// build` antes, y un Chromium disponible — ver qa/README.md para el mismo
// mecanismo de QA_CHROMIUM_PATH si hace falta apuntar a uno puntual).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'store-assets', 'screenshots');
const PORT = 4197;
const BASE = `http://localhost:${PORT}`;

mkdirSync(OUT_DIR, { recursive: true });

// Puntos lógicos x escala = píxeles exactos que pide Apple para cada
// tamaño de pantalla (verificar contra App Store Connect al momento de
// subirlas — Apple suele agregar tamaños nuevos con cada iPhone).
const DEVICES = [
  { name: '6.9-1320x2868', width: 440, height: 956, scale: 3 },
  { name: '6.7-1290x2796', width: 430, height: 932, scale: 3 },
  { name: '6.5-1242x2688', width: 414, height: 896, scale: 3 },
];

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // todavía no levantó
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`El servidor de preview no respondió en ${url} — ¿corriste "npm run build" antes?`);
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });

let browser;
try {
  await waitForServer(BASE);
  browser = await chromium.launch(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : undefined);

  for (const device of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.scale,
    });
    // La fuente de Google Fonts puede no cargar en un entorno sin salida a
    // esa red — no es crítico para la captura (cae al fallback del stack).
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    const page = await ctx.newPage();

    // Armamos un viaje de ejemplo con progreso real (no vacío) para que la
    // captura se vea usada de verdad, no un formulario recién abierto.
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/nuevo`);
    await page.waitForSelector('text=Nuevo viaje');
    await page.click('button:has-text("Playa")');
    await page.click('button:has-text("Montaña")');
    await page.click('button:has-text("Calor")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Mochila")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    // tildar algunos ítems para que se vea progreso real, sin completar todo
    const rows = page.locator('.itemName, [class*="itemName"]');
    const count = await rows.count();
    for (let i = 0; i < Math.min(count, 6); i++) {
      await rows.nth(i).click();
    }
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT_DIR, `${device.name}-01-checklist.png`) });

    await page.click('text=Rápida');
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT_DIR, `${device.name}-02-vista-rapida.png`) });

    await page.goto(`${BASE}/nuevo`);
    await page.waitForSelector('text=Nuevo viaje');
    await page.click('button:has-text("Ciudad")');
    await page.click('button:has-text("Trabajo")');
    await page.click('button:has-text("Avión")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT_DIR, `${device.name}-03-mis-viajes.png`) });

    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT_DIR, `${device.name}-04-bienvenida.png`) });

    await ctx.close();
    console.log(`listo: ${device.name}`);
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
