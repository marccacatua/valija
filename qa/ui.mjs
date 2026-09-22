// QA de flujos de UI de punta a punta, con Playwright. Levanta su propio
// servidor de preview (asumiendo que ya corriste `npm run build`), corre
// todos los casos contra una app real en el navegador, y lo apaga al
// terminar. No reemplaza al QA combinatorio (qa/combinatorial.ts) — este
// cubre interacción real (clicks, inputs, navegación) que la lógica pura
// no puede probar.
//
// Correr con: npm run qa:ui  (requiere haber hecho `npm run build` antes,
// y una vez `npx playwright install chromium` para tener el navegador).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4195;
const BASE = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // todavía no levantó, reintentar
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`El servidor de preview no respondió en ${url} — ¿corriste "npm run build" antes?`);
}

const results = [];
const ok = (label) => results.push({ label, pass: true });
const fail = (label, detail) => results.push({ label, pass: false, detail });

function assert(cond, label, detail) {
  if (cond) ok(label);
  else fail(label, detail);
}

// `pro: true` simula tener Valija Pro desbloqueada (mismo mecanismo que
// describe el comentario de features/flags.ts para probar por web sin
// compra real) — hace falta para ejercitar ítems propios, plantillas y
// repetir viaje, que desde v0.16.0 están detrás del paywall.
async function freshPage(browser, { pro = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  // La app carga la tipografía desde Google Fonts en cada página (ver
  // index.html) — en un entorno sin salida a esa red (o con la red lenta)
  // esa request puede colgar el render entero. El QA no depende de tener
  // la fuente real, así que la cortamos para que la suite sea determinística
  // sin importar la red del entorno donde corra.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate((isPro) => {
    localStorage.clear();
    if (isPro) localStorage.setItem('valija:isPro', 'true');
  }, pro);
  return { ctx, page };
}

// Blindaje contra el zoom automático de Safari en iOS: pasó dos veces
// (v0.10.1 y el buscador de la checklist) porque un input nuevo se olvidó
// de respetar el piso de 16px. En vez de acordarse a mano cada vez,
// cualquier test puede llamar esto para chequear TODOS los inputs
// visibles en la pantalla actual de una sola vez.
async function assertNoTinyInputs(page, label) {
  const sizes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map((el) => parseFloat(getComputedStyle(el).fontSize)),
  );
  const tooSmall = sizes.filter((s) => s < 16);
  assert(tooSmall.length === 0, `Ningún input tiene menos de 16px de fuente (${label})`, `sizes=${JSON.stringify(sizes)}`);
}

async function goToNewTripForm(page) {
  await page.goto(`${BASE}/nuevo`);
  await page.waitForSelector('text=Nuevo viaje');
}

// el número y el "de N empacado" viven en spans hermanos separados, sin
// espacio entre ellos en el DOM — ubicamos el span exacto "de N
// empacado" y tomamos su hermano anterior (el contador de empacados)
function progressNumLocator(page) {
  return page.locator('span', { hasText: /^de \d+ empacado$/ }).locator('xpath=preceding-sibling::span[1]');
}

async function generateTrip(page, { maletas = ['Bodega'] } = {}) {
  await goToNewTripForm(page);
  for (const m of maletas) {
    await page.click(`button:has-text("${m}")`);
  }
  // por defecto arranca con "Carry-on" seleccionado (DEFAULT_FORM); si no
  // lo pedimos, lo destildamos para dejar exactamente el set pedido
  if (!maletas.includes('Carry-on')) {
    const carryBtn = page.locator('button:has-text("Carry-on")');
    if (await carryBtn.getAttribute('class').then((c) => c && c.includes('selected'))) {
      await carryBtn.click();
    }
  }
  await page.click('button:has-text("Armar mi valija")');
  await page.waitForURL(/\/viaje\//);
  await page.waitForSelector('text=Tu valija para');
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });

let browser;
try {
  await waitForServer(BASE);
  // QA_CHROMIUM_PATH es un escape hatch para entornos con un Chromium ya
  // instalado en una ruta no estándar (ej. sandboxes de CI); en un uso
  // normal (`npx playwright install chromium` una vez) no hace falta.
  browser = await chromium.launch(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : undefined);

  // ============================================================
  // 1) Quantity stepper: no puede bajar de 1
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    // "Cinturón" siempre qty=1 y tiene stepper (no es noQty)
    const row = page.locator('button', { hasText: 'Cinturón' });
    const minusBtn = row.locator(`[aria-label="Restar Cinturón"]`);
    await minusBtn.click();
    await minusBtn.click();
    await minusBtn.click();
    const qtyText = await row.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
    assert(qtyText?.trim() === '1', 'Stepper no baja de 1', `qty mostrado: ${qtyText}`);

    const plusBtn = row.locator(`[aria-label="Sumar Cinturón"]`);
    await plusBtn.click();
    await plusBtn.click();
    const qtyText2 = await row.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
    assert(qtyText2?.trim() === '3', 'Stepper incrementa correctamente', `qty mostrado: ${qtyText2}`);
    await ctx.close();
  }

  // ============================================================
  // 2) noQty items no muestran stepper +/-, solo el botón de borrar
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    const row = page.locator('button', { hasText: 'Cargador del celular' });
    const hasMinus = await row.locator('[aria-label="Restar Cargador del celular"]').count();
    const hasPlus = await row.locator('[aria-label="Sumar Cargador del celular"]').count();
    const hasRemove = await row.locator('[aria-label="Borrar Cargador del celular"]').count();
    assert(hasMinus === 0 && hasPlus === 0, 'Ítem noQty no muestra stepper +/-', `minus=${hasMinus} plus=${hasPlus}`);
    assert(hasRemove === 1, 'Ítem noQty sí muestra botón de borrar', `remove=${hasRemove}`);
    await ctx.close();
  }

  // ============================================================
  // 3) Borrar un ítem generado (con stepper) lo saca de la lista
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('[aria-label="Borrar Cinturón"]');
    await page.waitForTimeout(100);
    const afterCount = await page.locator('button', { hasText: 'Cinturón' }).count();
    assert(afterCount === 0, 'Borrar ítem lo quita de la checklist', `quedan ${afterCount} filas "Cinturón"`);
    await ctx.close();
  }

  // ============================================================
  // 4) Agregar ítem personalizado en cada categoría
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    const categories = [
      { title: 'Documentos', item: 'Visa impresa' },
      { title: 'Ropa', item: 'Mameluco' },
      { title: 'Higiene', item: 'Lentillas' },
      { title: 'Electrónica', item: 'Drone' },
      { title: 'Extras', item: 'Casco' },
    ];
    for (const { title, item } of categories) {
      const input = page
        .locator('div')
        .filter({ hasText: new RegExp(`^${title}`) })
        .locator('input[placeholder="Agregar ítem…"]')
        .last();
      await input.fill(item);
      await input.press('Enter');
      await page.waitForTimeout(80);
      const count = await page.locator('button', { hasText: item }).count();
      assert(count === 1, `Ítem personalizado "${item}" agregado en ${title}`, `count=${count}`);
    }
    await ctx.close();
  }

  // ============================================================
  // 5) Ítem personalizado nace con qty=1 y SÍ tiene stepper (no es noQty)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    const input = page.locator('input[placeholder="Agregar ítem…"]').first();
    await input.fill('Item Custom Test');
    await input.press('Enter');
    await page.waitForTimeout(80);
    const row = page.locator('button', { hasText: 'Item Custom Test' });
    const hasStepper = await row.locator('[aria-label="Sumar Item Custom Test"]').count();
    assert(hasStepper === 1, 'Ítem personalizado tiene stepper +/-', `hasStepper=${hasStepper}`);
    await ctx.close();
  }

  // ============================================================
  // 6) Templates: guardar con selección parcial (checkboxes), aplicar y borrar
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    // agregar 3 ítems custom (para poder elegir un subconjunto)
    const input = page.locator('input[placeholder="Agregar ítem…"]').first();
    for (const name of ['Mameluco', 'Casco EPP', 'Botas EPP']) {
      await input.fill(name);
      await input.press('Enter');
      await page.waitForTimeout(60);
    }

    await page.click('text=Guardar ítems como plantilla');
    await page.waitForSelector('text=Guardar como plantilla');
    // destildar "Botas EPP" para probar selección parcial (hay un botón
    // homónimo en la checklist detrás del overlay: nos quedamos con el
    // último en el DOM, que es el de la hoja de "Guardar como plantilla")
    await page.locator('button:has-text("Botas EPP")').last().click();
    await page.fill('input[placeholder^="Ej."]', 'Kit EPP');
    await page.click('button:has-text("Guardar plantilla")');
    await page.waitForTimeout(100);

    // abrir "Aplicar plantilla" y verificar que diga 2 ítems (no 3)
    await page.click('text=Aplicar una plantilla');
    await page.waitForSelector('text=Mis plantillas');
    const countText = await page.locator('text=Kit EPP').locator('..').locator('span').last().textContent();
    assert(countText?.includes('2'), 'Plantilla guardada respeta selección parcial (2/3 ítems)', `texto: ${countText}`);

    // cerrar, borrar los 3 custom items originales para verificar que
    // aplicar la plantilla los vuelve a crear
    // comilla = match exacto: evita matchear las tareas de casa que
    // contienen "Cerrar" como substring ("Cerrar la llave de gas", etc.)
    await page.click('text="Cerrar"');
    for (const name of ['Mameluco', 'Casco EPP', 'Botas EPP']) {
      const btn = page.locator(`[aria-label="Borrar ${name}"]`);
      if (await btn.count()) await btn.click();
      await page.waitForTimeout(60);
    }
    await page.click('text=Aplicar una plantilla');
    await page.waitForSelector('text=Kit EPP');
    await page.click('button:has-text("Kit EPP")');
    await page.waitForTimeout(150);
    const mamelucoCount = await page.locator('button', { hasText: 'Mameluco' }).count();
    const cascoCount = await page.locator('button', { hasText: 'Casco EPP' }).count();
    const botasCount = await page.locator('button', { hasText: 'Botas EPP' }).count();
    assert(
      mamelucoCount === 1 && cascoCount === 1 && botasCount === 0,
      'Aplicar plantilla agrega solo los ítems seleccionados (sin duplicar, sin la excluida)',
      `mameluco=${mamelucoCount} casco=${cascoCount} botas=${botasCount}`,
    );

    // borrar la plantilla con confirmación
    await page.click('text=Aplicar una plantilla');
    await page.waitForSelector('text=Kit EPP');
    await page.click('[aria-label="Borrar plantilla Kit EPP"]');
    await page.waitForSelector('text=No se puede deshacer');
    await page.click('button:has-text("Sí, borrar")');
    await page.waitForTimeout(150);
    // la hoja de "Aplicar plantilla" se mantiene abierta después de borrar
    // (a propósito, para poder seguir aplicando otras) — no hace falta reabrirla
    const emptyMsg = await page.locator('text=Todavía no guardaste ninguna plantilla.').count();
    assert(emptyMsg === 1, 'Borrar plantilla con confirmación la elimina de la lista', `emptyMsg=${emptyMsg}`);
    await ctx.close();
  }

  // ============================================================
  // 7) Distribution screen: 2 valijas y 3 valijas
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega', 'Mochila'] });
    const hasDistribBtn = await page.locator('text=Ver cómo repartir en tus valijas').count();
    assert(hasDistribBtn === 1, 'Botón de distribución aparece con 2+ valijas', `count=${hasDistribBtn}`);
    await page.click('text=Ver cómo repartir en tus valijas');
    await page.waitForURL(/distribucion/);
    const hasBodegaCard = await page.locator('text=Bodega').count();
    const hasMochilaCard = await page.locator('text=Mochila').count();
    assert(
      hasBodegaCard > 0 && hasMochilaCard > 0,
      'Distribución muestra las 2 valijas elegidas',
      `bodega=${hasBodegaCard} mochila=${hasMochilaCard}`,
    );
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Carry-on', 'Bodega', 'Mochila'] });
    await page.click('text=Ver cómo repartir en tus valijas');
    await page.waitForURL(/distribucion/);
    const cardTitles = await page.locator('h3').allTextContents();
    ok(`Distribución con 3 valijas renderiza tarjetas: ${JSON.stringify(cardTitles)}`);
    await ctx.close();
  }

  // ============================================================
  // 8) Con una sola valija NO aparece el botón de distribución
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    const hasDistribBtn = await page.locator('text=Ver cómo repartir en tus valijas').count();
    assert(hasDistribBtn === 0, 'Botón de distribución NO aparece con 1 sola valija', `count=${hasDistribBtn}`);
    await ctx.close();
  }

  // ============================================================
  // 9) Duración: no baja de 1 ni sube de 30
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page);
    const stepperMinus = page.locator('text=días de viaje').locator('..').locator('..').locator('button').first();
    const stepperPlus = page.locator('text=días de viaje').locator('..').locator('..').locator('button').last();
    for (let i = 0; i < 10; i++) await stepperMinus.click();
    const valAfterMin = await page.locator('text=días de viaje').locator('..').locator('div').first().textContent();
    assert(valAfterMin?.trim() === '1', 'Duración no baja de 1 día', `valor=${valAfterMin}`);

    for (let i = 0; i < 40; i++) await stepperPlus.click();
    const valAfterMax = await page.locator('text=días de viaje').locator('..').locator('div').first().textContent();
    assert(valAfterMax?.trim() === '30', 'Duración no sube de 30 días', `valor=${valAfterMax}`);
    await ctx.close();
  }

  // ============================================================
  // 10) Borrar un solo viaje (con confirmación) y borrar todos (doble confirmación)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('text=Ver mis viajes');
    await page.waitForSelector('text=Mis viajes');

    // crear un 2do viaje para probar borrado individual sin vaciar la lista
    await page.click('text=Nuevo viaje');
    await page.waitForSelector('text=Nuevo viaje');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.click('text=Ver mis viajes');
    await page.waitForSelector('text=Mis viajes');
    // .count() no reintenta como waitForSelector — sin esto, a veces corre
    // antes de que la 2da tarjeta termine de montarse (flaky).
    await page.waitForFunction(() => document.querySelectorAll('[aria-label^="Borrar "]').length >= 2);

    const cardsBefore = await page.locator('[aria-label^="Borrar "]').count();
    assert(cardsBefore === 2, 'Hay 2 viajes guardados antes de borrar', `cards=${cardsBefore}`);

    await page.locator('[aria-label^="Borrar "]').first().click();
    await page.waitForSelector('text=No se puede deshacer.');
    await page.click('button:has-text("Sí, borrar")');
    // El borrado ahora anima la salida (fade) antes de sacarlo de verdad
    // — hay que esperar más que antes de medir el estado final.
    await page.waitForTimeout(400);
    const cardsAfterOne = await page.locator('[aria-label^="Borrar "]').count();
    assert(cardsAfterOne === 1, 'Borrar un viaje individual deja 1 (con confirmación)', `cards=${cardsAfterOne}`);

    await page.click('text=Borrar todos los viajes');
    await page.waitForSelector('text=Vas a perder todo el progreso');
    await page.click('button:has-text("Sí, borrar")');
    await page.waitForSelector('text=Última confirmación');
    await page.click('button:has-text("Sí, borrar")');
    await page.waitForTimeout(100);
    const emptyState = await page.locator('text=Todavía no armaste ninguna valija').count();
    assert(emptyState === 1, 'Borrar todos los viajes requiere doble confirmación y vacía la lista', `emptyState=${emptyState}`);
    await ctx.close();
  }

  // ============================================================
  // 11) Trips: siempre puede ver/crear un viaje aunque ya tenga otros
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('text=Ver mis viajes');
    await page.waitForSelector('text=Mis viajes');
    // esperar el botón puntual (no solo el título de la pantalla) evita una
    // carrera con el render: .count() no reintenta como waitForSelector
    await page.waitForSelector('text=Nuevo viaje');
    const hasNewTripBtn = await page.locator('text=Nuevo viaje').count();
    const hasEmptyState = await page.locator('text=Todavía no armaste ninguna valija').count();
    assert(hasNewTripBtn > 0, '"Nuevo viaje" sigue disponible con viajes existentes', `count=${hasNewTripBtn}`);
    assert(hasEmptyState === 0, 'No muestra el estado vacío si hay viajes', `count=${hasEmptyState}`);
    await ctx.close();
  }

  // ============================================================
  // 12) Vista rápida: cubre todos los ítems, marca/desmarca por grupo,
  // y queda consistente con la vista detallada (mismo dato de fondo)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    // el total real de ítems de la valija (no de la lista de casa, que
    // reusa el mismo patrón de aria-label "Borrar X") sale del propio
    // texto de la barra de progreso: "de N empacado"
    const progressLabel = await page.locator('span', { hasText: /^de \d+ empacado$/ }).textContent();
    const totalItems = parseInt(progressLabel.match(/\d+/)[0], 10);

    await page.click('text=Rápida');
    await page.waitForTimeout(100);
    const groupCountTexts = await page.locator('text=/^\\d+ ítems$/').allTextContents();
    const sumGroupItems = groupCountTexts.reduce((acc, t) => acc + parseInt(t, 10), 0);
    assert(
      sumGroupItems === totalItems,
      'Vista rápida cubre el 100% de los ítems (suma de grupos == total)',
      `suma=${sumGroupItems} total=${totalItems}`,
    );

    // marcar el grupo "Higiene" entero
    const higieneRow = page.locator('button', { hasText: 'Higiene' });
    const higieneCountText = await higieneRow.locator('text=/^\\d+ ítems$/').textContent();
    const higieneSize = parseInt(higieneCountText, 10);
    await higieneRow.click();
    await page.waitForTimeout(100);
    const packedAfterOn = await progressNumLocator(page).textContent();
    assert(
      packedAfterOn.trim() === String(higieneSize),
      'Marcar un grupo de la vista rápida empaca todos sus ítems reales',
      `packed=${packedAfterOn} esperado=${higieneSize}`,
    );

    // volver a detallada: los N ítems de higiene deben figurar tildados
    await page.click('text=Detallada');
    await page.waitForTimeout(100);
    const doneCheckboxes = await page.locator('[class*="checkboxDone"]').count();
    assert(
      doneCheckboxes === higieneSize,
      'Vista detallada refleja el bulk-check hecho desde la vista rápida',
      `checkboxDone=${doneCheckboxes} esperado=${higieneSize}`,
    );

    // volver a rápida y destildar el mismo grupo (toggle inverso)
    await page.click('text=Rápida');
    await page.waitForTimeout(100);
    await page.locator('button', { hasText: 'Higiene' }).click();
    await page.waitForTimeout(100);
    const packedAfterOff = await progressNumLocator(page).textContent();
    assert(packedAfterOff.trim() === '0', 'Volver a tocar un grupo ya completo lo desmarca entero', `packed=${packedAfterOff}`);
    await ctx.close();
  }

  // ============================================================
  // 13) Vista rápida: un ítem personalizado cae en el grupo de su categoría
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    const input = page.locator('input[placeholder="Agregar ítem…"]').first(); // primera categoría: Documentos
    await input.fill('Visa impresa');
    await input.press('Enter');
    await page.waitForTimeout(80);
    await page.click('text=Rápida');
    await page.waitForTimeout(100);
    const docsRow = page.locator('button', { hasText: 'Documentos' });
    const docsCountText = await docsRow.locator('text=/^\\d+ ítems$/').textContent();
    assert(
      docsCountText.startsWith('8'),
      'Ítem personalizado en Documentos se cuenta en el grupo rápido "Documentos" (7 base + 1)',
      `texto=${docsCountText}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 14) Vista rápida: un grupo parcialmente tildado se completa entero
  // (no se "des-tilda") al tocarlo
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    // tildar un solo ítem de "Ropa" a mano, en detallada
    await page.click('button:has-text("Cinturón")');
    await page.waitForTimeout(80);

    await page.click('text=Rápida');
    await page.waitForTimeout(100);
    // el texto acumulado del botón arranca con el "✓" del checkbox
    // (oculto por color, pero sigue siendo texto), seguido de "Ropa" +
    // "N ítems" + "X/Y" sin separador — pedimos "Ropa" seguido directo
    // de un dígito para no matchear "Ropa de trabajo" / "Ropa para salir"
    const ropaRow = page.locator('button', { hasText: /Ropa\d/ });
    const ropaCountBefore = await ropaRow.locator('text=/^\\d+\\/\\d+$/').textContent();
    const [doneBefore, totalRopa] = ropaCountBefore.split('/').map(Number);
    assert(
      doneBefore === 1 && doneBefore < totalRopa,
      'Grupo "Ropa" muestra progreso parcial cuando solo 1 ítem está tildado',
      `contador=${ropaCountBefore}`,
    );

    await ropaRow.click();
    await page.waitForTimeout(100);
    const ropaCountAfter = await ropaRow.locator('text=/^\\d+\\/\\d+$/').textContent();
    assert(
      ropaCountAfter === `${totalRopa}/${totalRopa}`,
      'Tocar un grupo parcial lo completa entero (no lo des-tilda)',
      `contador=${ropaCountAfter}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 15) Vista rápida: los grupos sin ítems para este viaje no se muestran
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page);
    await page.click('button:has-text("Ciudad")');
    await page.click('button:has-text("Templado")');
    await page.click('button:has-text("Placer")');
    await page.click('button:has-text("Relax")');
    await page.click('button:has-text("Hotel")');
    await page.click('button:has-text("Tren")');
    // dejar solo Carry-on (ya viene seleccionado por default)
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    await page.click('text=Rápida');
    await page.waitForTimeout(100);
    const hasTrabajo = await page.locator('button', { hasText: 'Ropa de trabajo' }).count();
    const hasSalir = await page.locator('button', { hasText: 'Ropa para salir' }).count();
    const hasCalzado = await page.locator('button', { hasText: 'Calzado' }).count();
    const hasAbrigo = await page.locator('button', { hasText: 'Abrigo' }).count();
    assert(
      hasTrabajo === 0 && hasSalir === 0,
      'Grupos sin ítems (trabajo/salir en un viaje placer+relax) no se muestran',
      `trabajo=${hasTrabajo} salir=${hasSalir}`,
    );
    assert(
      hasCalzado === 1 && hasAbrigo === 1,
      'Grupos que sí tienen ítems (calzado por ciudad, abrigo por templado) se muestran',
      `calzado=${hasCalzado} abrigo=${hasAbrigo}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 16) Destino combinado: se pueden elegir varios a la vez, se ven
  // ítems de ambos, no se puede deseleccionar el último
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page);
    await page.click('button:has-text("Playa")');
    await page.click('button:has-text("Montaña")');
    // ambos quedan tildados a la vez (selección múltiple, no radio)
    const playaSelected = await page.locator('button:has-text("Playa")').getAttribute('class');
    const montanaSelected = await page.locator('button:has-text("Montaña")').getAttribute('class');
    assert(
      playaSelected?.includes('selected') && montanaSelected?.includes('selected'),
      'Playa y Montaña quedan seleccionadas juntas (no es radio)',
      `playaClass=${playaSelected} montanaClass=${montanaSelected}`,
    );

    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const titleText = await page
      .locator('div', { hasText: /Playa \+ Montaña/ })
      .first()
      .textContent();
    assert(titleText?.includes('Playa + Montaña'), 'Título combina ambos destinos', `texto=${titleText}`);

    const hasOjotas = await page.locator('button', { hasText: 'Ojotas o sandalias' }).count(); // de playa
    const hasTrekking = await page.locator('button', { hasText: 'Zapatillas de trekking' }).count(); // de montaña
    assert(
      hasOjotas === 1 && hasTrekking === 1,
      'Checklist combinada trae ítems de ambos destinos (playa y montaña)',
      `ojotas=${hasOjotas} trekking=${hasTrekking}`,
    );

    // no se puede deseleccionar hasta dejar cero destinos: volver al form
    // y destildar Playa (la única activa por default)
    await goToNewTripForm(page);
    const soloPlaya = page.locator('button:has-text("Playa")');
    await soloPlaya.click();
    await page.waitForTimeout(80);
    const stillSelected = await soloPlaya.getAttribute('class');
    assert(
      stillSelected?.includes('selected'),
      'No se puede deseleccionar el último destino (regla "al menos uno")',
      `class=${stillSelected}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 17) Renombrar un viaje después de creado
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.waitForTimeout(80);
    const input = page.locator('input[class*="heroTitleInput"]');
    await input.fill('Viaje de prueba QA');
    await input.press('Enter');
    await page.waitForTimeout(100);
    const heroHasName = await page.locator('text=Viaje de prueba QA').count();
    assert(heroHasName === 1, 'El nombre nuevo aparece en el título del viaje', `count=${heroHasName}`);

    // persiste en la lista de viajes
    await page.click('text=Ver mis viajes');
    await page.waitForSelector('text=Mis viajes');
    const listHasName = await page.locator('text=Viaje de prueba QA').count();
    assert(listHasName === 1, 'El nombre nuevo se ve también en "Mis viajes"', `count=${listHasName}`);

    // vaciar el nombre vuelve al título automático
    await page.click('text=Viaje de prueba QA');
    await page.waitForSelector('text=Tu valija para');
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.waitForTimeout(80);
    const input2 = page.locator('input[class*="heroTitleInput"]');
    await input2.fill('');
    await input2.press('Enter');
    await page.waitForTimeout(100);
    const backToAuto = await page.locator('text=/Playa en \\d+ días/').count();
    assert(backToAuto === 1, 'Vaciar el nombre vuelve a mostrar el título automático', `count=${backToAuto}`);
    await ctx.close();
  }

  // ============================================================
  // 18) Progreso: mensaje distinto al completar una categoría entera
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    assert((await page.locator('text=Arrancá por los documentos').count()) === 1, 'Nota inicial invita a arrancar por documentos');
    for (const name of ['DNI y pasaporte', 'Pasajes / boarding pass', 'Reserva de alojamiento', 'Billetera', 'Tarjetas y efectivo', 'Libreta de conducir', 'Seguro de viaje']) {
      await page.click(`button:has-text("${name}")`);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(100);
    const notaTrasDocs = await page.locator('text=Ahora seguí con la higiene').count();
    assert(notaTrasDocs === 1, 'Al completar documentos, la nota invita a seguir con la higiene', `count=${notaTrasDocs}`);
    await ctx.close();
  }

  // ============================================================
  // 19) Home checklist ("¿Quedó todo pronto en casa?"): agua/gas
  // separados, no suma al progreso de empaque, se puede tildar, borrar
  // un ítem y agregar uno propio
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] }); // DEFAULT_FORM: dias=5 -> incluye heladera
    // varios divs anidados matchean el mismo texto: el contenedor entero
    // (con todas las filas y el input de agregar) y su header interno
    // (solo título + contador) — el contenedor completo es el PRIMERO en
    // orden de documento, el header interno el ÚLTIMO.
    const homeSection = () => page.locator('div', { hasText: /^¿Quedó todo pronto en casa\?/ }).first();
    const homeSectionHeader = () => page.locator('div', { hasText: /^¿Quedó todo pronto en casa\?/ }).last();

    const hasAgua = await page.locator('button', { hasText: 'Cerrar la llave de paso de agua' }).count();
    const hasGas = await page.locator('button', { hasText: 'Cerrar la llave de gas' }).count();
    assert(hasAgua === 1 && hasGas === 1, 'Agua y gas son tareas separadas', `agua=${hasAgua} gas=${hasGas}`);

    const packedBefore = await progressNumLocator(page).textContent();
    await page.click('button:has-text("Apagar las luces")');
    await page.waitForTimeout(100);
    const packedAfter = await progressNumLocator(page).textContent();
    assert(
      packedBefore.trim() === packedAfter.trim(),
      'Tildar una tarea de casa NO afecta el contador de empacado de la valija',
      `antes=${packedBefore} después=${packedAfter}`,
    );
    const homeCountAfterCheck = await homeSectionHeader().locator('span').last().textContent();
    assert(homeCountAfterCheck.startsWith('1/'), 'El contador propio de la sección de casa sí refleja el tilde', `texto=${homeCountAfterCheck}`);

    // borrar una tarea (ej. alguien sin plantas)
    await page.click('[aria-label="Borrar Regar o encargar las plantas"]');
    await page.waitForTimeout(100);
    const plantasCount = await page.locator('button', { hasText: 'Regar o encargar las plantas' }).count();
    assert(plantasCount === 0, 'Se puede borrar una tarea de casa (ej. "Regar las plantas")', `count=${plantasCount}`);

    // agregar una propia, sin contador de cantidad (como los noQty de la valija)
    const homeInput = homeSection().locator('input[placeholder="Agregar ítem…"]');
    await homeInput.fill('Bajar térmica de la pileta');
    await homeInput.press('Enter');
    await page.waitForTimeout(100);
    const customTaskRow = page.locator('button', { hasText: 'Bajar térmica de la pileta' });
    const customTaskCount = await customTaskRow.count();
    const customTaskHasStepper = await customTaskRow.locator('[aria-label^="Sumar"]').count();
    assert(
      customTaskCount === 1 && customTaskHasStepper === 0,
      'Se puede agregar una tarea propia y no tiene stepper de cantidad',
      `count=${customTaskCount} stepper=${customTaskHasStepper}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 19b) Tildar una tarea de casa la manda al fondo de esa sección, mismo
  // criterio (y misma animación FLIP) que los ítems de la valija
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] }); // DEFAULT_FORM: dias=5 -> incluye heladera
    const luces = page.locator('button', { hasText: 'Apagar las luces' }).first();
    const agua = page.locator('button', { hasText: 'Cerrar la llave de paso de agua' }).first();

    const beforeLuces = (await luces.boundingBox()).y;
    const beforeAgua = (await agua.boundingBox()).y;
    assert(beforeLuces < beforeAgua, 'Antes de tildar, "Apagar las luces" va antes que "Cerrar la llave de paso de agua"', `luces=${beforeLuces} agua=${beforeAgua}`);

    await luces.click();
    // Mismo FLIP que los ítems de la valija (useFlipReorder) — mismo tiempo de espera.
    await page.waitForTimeout(650);

    const afterLuces = (await luces.boundingBox()).y;
    const afterAgua = (await agua.boundingBox()).y;
    assert(
      afterLuces > afterAgua,
      'Tildar "Apagar las luces" la manda debajo de "Cerrar la llave de paso de agua" en la sección de casa',
      `luces=${afterLuces} agua=${afterAgua}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 20) Home checklist: un viaje guardado antes de esta versión (sin el
  // campo homeChecklist) genera la lista sola al leerlo
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await page.evaluate(() => {
      const oldTrip = {
        id: 'old-trip-1',
        createdAt: new Date().toISOString(),
        form: {
          name: '',
          dest: ['playa'],
          clima: 'calor',
          motivo: 'placer',
          turismo: 'relax',
          aloj: 'depto',
          transporte: 'avion',
          maletas: ['carry'],
          dias: 5,
          vestidos: false,
        },
        items: [{ id: '0-docs', cat: 'docs', name: 'DNI y pasaporte', qty: 1, done: false }],
        // sin homeChecklist a propósito: simula un viaje guardado antes de esta versión
      };
      localStorage.setItem('valija:trips', JSON.stringify([oldTrip]));
    });
    await page.goto(`${BASE}/viaje/old-trip-1`);
    await page.waitForSelector('text=Tu valija para');
    const hasHomeSection = await page.locator('text=¿Quedó todo pronto en casa?').count();
    const hasHeladera = await page.locator('button', { hasText: 'Vaciar la heladera' }).count();
    assert(
      hasHomeSection === 1 && hasHeladera === 1,
      'Un viaje viejo sin homeChecklist lo genera solo al abrirlo (con heladera, porque dias=5)',
      `hasHomeSection=${hasHomeSection} hasHeladera=${hasHeladera}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 21) Plantillas: incluyen tareas de casa propias, no solo ítems de
  // la valija (ej. "llevar al perro a guardería")
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    const homeSection = page.locator('div', { hasText: /^¿Quedó todo pronto en casa\?/ }).first();
    const homeInput = homeSection.locator('input[placeholder="Agregar ítem…"]');
    await homeInput.fill('Llevar al perro a guardería');
    await homeInput.press('Enter');
    await page.waitForTimeout(100);
    const packInput = page.locator('input[placeholder="Agregar ítem…"]').first();
    await packInput.fill('Cargador de laptop extra');
    await packInput.press('Enter');
    await page.waitForTimeout(100);

    await page.click('text=Guardar ítems como plantilla');
    await page.waitForSelector('text=Guardar como plantilla');
    // ">0" en vez de "===1": el div contenedor de cada grupo también
    // matchea el mismo texto que su propio label hijo (texto acumulado)
    const hasGroupLabels =
      (await page.locator('text=De la valija').count()) > 0 && (await page.locator('text=De casa').count()) > 0;
    assert(hasGroupLabels, 'La hoja de guardar separa "De la valija" de "De casa" cuando hay de los dos', `ok=${hasGroupLabels}`);
    await page.fill('input[placeholder^="Ej."]', 'Kit viaje con perro');
    await page.click('button:has-text("Guardar plantilla")');
    await page.waitForTimeout(100);

    // el contador de la plantilla en "Aplicar" suma valija + casa (1 + 1 = 2)
    await page.click('text=Aplicar una plantilla');
    await page.waitForSelector('text=Kit viaje con perro');
    const countText = await page.locator('text=Kit viaje con perro').locator('..').locator('span').last().textContent();
    assert(countText?.includes('2'), 'El contador de la plantilla suma ítems de valija + tareas de casa', `texto=${countText}`);

    // borrar ambos originales, reaplicar la plantilla y confirmar que vuelven los dos
    await page.click('text="Cerrar"');
    await page.click('[aria-label="Borrar Cargador de laptop extra"]');
    await page.click('[aria-label="Borrar Llevar al perro a guardería"]');
    await page.waitForTimeout(100);
    await page.click('text=Aplicar una plantilla');
    await page.waitForSelector('text=Kit viaje con perro');
    await page.click('button:has-text("Kit viaje con perro")');
    await page.waitForTimeout(150);
    const packBack = await page.locator('button', { hasText: 'Cargador de laptop extra' }).count();
    const homeBack = await page.locator('button', { hasText: 'Llevar al perro a guardería' }).count();
    assert(
      packBack === 1 && homeBack === 1,
      'Aplicar la plantilla reagrega tanto el ítem de valija como la tarea de casa',
      `pack=${packBack} home=${homeBack}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 22) Marcar un viaje como finalizado: baja al final de la lista,
  // muestra "Viaje finalizado", se puede revertir, y sigue siendo
  // posible entrar a verlo
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje A');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    await goToNewTripForm(page);
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje B');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    const namesBefore = await page.locator('[class*="tripName"]').allTextContents();
    assert(
      namesBefore[0] === 'Viaje B' && namesBefore[1] === 'Viaje A',
      'Viaje B (creado después) aparece arriba de Viaje A antes de finalizar nada',
      `orden=${JSON.stringify(namesBefore)}`,
    );

    // finalizar "Viaje B" (el de arriba) y confirmar que baja al final
    await page.click('[aria-label="Marcar Viaje B como finalizado"]');
    await page.waitForTimeout(100);
    const namesAfterFinish = await page.locator('[class*="tripName"]').allTextContents();
    const finishedLabelCount = await page.locator('text=Viaje finalizado').count();
    assert(
      namesAfterFinish[0] === 'Viaje A' && namesAfterFinish[1] === 'Viaje B' && finishedLabelCount === 1,
      'Finalizar "Viaje B" lo manda al final de la lista y muestra la etiqueta',
      `orden=${JSON.stringify(namesAfterFinish)} etiqueta=${finishedLabelCount}`,
    );

    // sigue siendo posible entrar a un viaje finalizado
    await page.click('text=Viaje B');
    await page.waitForSelector('text=Tu valija para');
    const heroShowsB = await page.locator('text=Viaje B').count();
    assert(heroShowsB > 0, 'Un viaje finalizado se sigue pudiendo abrir normalmente', `count=${heroShowsB}`);

    // revertir: vuelve a subir a su posición original
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.click('[aria-label="Reactivar Viaje B"]');
    await page.waitForTimeout(100);
    const namesAfterRevert = await page.locator('[class*="tripName"]').allTextContents();
    assert(
      namesAfterRevert[0] === 'Viaje B' && namesAfterRevert[1] === 'Viaje A',
      'Reactivar un viaje finalizado lo devuelve a su posición (más nuevo primero)',
      `orden=${JSON.stringify(namesAfterRevert)}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 23) Repetir un viaje: arranca sin nada tildado pero conserva los
  // ítems y tareas agregados a mano, y aparece como un viaje nuevo
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('button:has-text("Cinturón")');
    const input = page.locator('input[placeholder="Agregar ítem…"]').first();
    await input.fill('Mameluco EPP');
    await input.press('Enter');
    await page.waitForTimeout(100);
    const packedBefore = await progressNumLocator(page).textContent();
    assert(packedBefore.trim() !== '0', 'El viaje original tiene progreso antes de repetirlo', `packed=${packedBefore}`);

    await page.click('text=Repetir este viaje');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    await page.waitForTimeout(100);

    const packedAfter = await progressNumLocator(page).textContent();
    const hasMameluco = await page.locator('button', { hasText: 'Mameluco EPP' }).count();
    const cinturonStillChecked = await page.locator('button', { hasText: 'Cinturón' }).locator('[class*="checkboxDone"]').count();
    assert(
      packedAfter.trim() === '0' && hasMameluco === 1 && cinturonStillChecked === 0,
      'Repetir un viaje arranca en 0 empacado pero conserva el ítem agregado a mano',
      `packed=${packedAfter} mameluco=${hasMameluco} cinturonChecked=${cinturonStillChecked}`,
    );

    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    const tripCount = await page.locator('[class*="tripCard"]').count();
    assert(tripCount === 2, 'Repetir un viaje crea uno nuevo (no reemplaza el original)', `count=${tripCount}`);
    await ctx.close();
  }

  // ============================================================
  // 24) Compartir checklist: sin navigator.share (caso desktop/headless)
  // cae a copiar al portapapeles el texto agrupado por categoría, con la
  // sección de casa aparte, y muestra el feedback "Copiado ✓"
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await page.addInitScript(() => {
      // fuerza el camino de fallback (Web Share API no existe en Chromium headless,
      // pero lo dejamos explícito por si algún entorno sí la trae)
      // @ts-ignore
      window.navigator.share = undefined;
      Object.defineProperty(window.navigator, 'clipboard', {
        value: {
          writeText: (text) => {
            // @ts-ignore
            window.__copiedText = text;
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('button:has-text("Cinturón")');
    await page.click('text=Compartir checklist');
    await page.waitForTimeout(150);
    const copiedText = await page.evaluate(() => window.__copiedText);
    assert(
      typeof copiedText === 'string' && copiedText.includes('Cinturón') && copiedText.includes('¿Quedó todo pronto en casa?'),
      'Compartir sin navigator.share copia al portapapeles el texto agrupado (ítems + sección de casa)',
      `texto=${JSON.stringify(copiedText?.slice(0, 120))}`,
    );
    const feedbackCount = await page.locator('button', { hasText: 'Copiado' }).count();
    assert(feedbackCount === 1, 'El botón muestra "Copiado ✓" como feedback tras copiar', `count=${feedbackCount}`);
    await ctx.close();
  }

  // ============================================================
  // 25) Tope de la versión gratis: al llegar a FREE_TRIP_LIMIT (3) viajes
  // guardados, "Nuevo viaje" muestra el aviso de límite en vez del
  // formulario; con Pro no hay tope
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser); // gratis (default)
    for (let i = 0; i < 3; i++) {
      await generateTrip(page, { maletas: ['Bodega'] });
      await page.click('text=Ver mis viajes');
      await page.waitForSelector('text=Mis viajes');
    }
    await page.click('text=Nuevo viaje');
    await page.waitForTimeout(150);
    const hasLimitMsg = await page.locator('text=Llegaste al límite de 3 viajes gratis').count();
    const hasForm = await page.locator('text=¿A dónde?').count();
    assert(
      hasLimitMsg === 1 && hasForm === 0,
      'Al llegar a 3 viajes gratis, "Nuevo viaje" muestra el aviso de límite en vez del formulario',
      `limitMsg=${hasLimitMsg} form=${hasForm}`,
    );
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    for (let i = 0; i < 3; i++) {
      await generateTrip(page, { maletas: ['Bodega'] });
      await page.click('text=Ver mis viajes');
      await page.waitForSelector('text=Mis viajes');
    }
    await page.click('text=Nuevo viaje');
    await page.waitForTimeout(150);
    const hasForm = await page.locator('text=¿A dónde?').count();
    assert(hasForm === 1, 'Con Pro no hay tope de viajes: el formulario se sigue mostrando después de 3', `form=${hasForm}`);
    await ctx.close();
  }

  // ============================================================
  // 26) Free vs Pro: en la versión gratis no se ven "Agregar ítem",
  // "Aplicar plantilla" ni "Repetir este viaje" (pero sí "Compartir
  // checklist", que es gratis siempre); con Pro los tres aparecen
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser); // gratis
    await generateTrip(page, { maletas: ['Bodega'] });
    const hasAddItemInput = await page.locator('input[placeholder="Agregar ítem…"]').count();
    const hasApplyTemplate = await page.locator('text=Aplicar una plantilla').count();
    const hasClone = await page.locator('text=Repetir este viaje').count();
    assert(
      hasAddItemInput === 0 && hasApplyTemplate === 0 && hasClone === 0,
      'Versión gratis: no se ven "Agregar ítem", "Aplicar plantilla" ni "Repetir este viaje"',
      `addItem=${hasAddItemInput} template=${hasApplyTemplate} clone=${hasClone}`,
    );
    const hasShare = await page.locator('text=Compartir checklist').count();
    assert(hasShare === 1, 'Compartir checklist sigue disponible en la versión gratis', `share=${hasShare}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    const hasAddItemInput = await page.locator('input[placeholder="Agregar ítem…"]').count();
    const hasApplyTemplate = await page.locator('text=Aplicar una plantilla').count();
    const hasClone = await page.locator('text=Repetir este viaje').count();
    assert(
      hasAddItemInput > 0 && hasApplyTemplate === 1 && hasClone === 1,
      'Con Pro: "Agregar ítem", "Aplicar plantilla" y "Repetir este viaje" están disponibles',
      `addItem=${hasAddItemInput} template=${hasApplyTemplate} clone=${hasClone}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 27) Backup manual (Safari <-> pantalla de inicio): exportar copia un
  // JSON con los datos actuales; importarlo en otro contexto sin Pro y
  // sin viajes suma el viaje y desbloquea Pro; reimportar no duplica
  // ============================================================
  let backupText;
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'clipboard', {
        value: {
          writeText: (text) => {
            // @ts-ignore
            window.__copiedText = text;
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('text=Ver mis viajes');
    await page.waitForSelector('text=Mis viajes');
    await page.click('text=Llevar mis datos a otro acceso');
    await page.waitForSelector('text=Copiar mis datos');
    await page.click('text=Copiar mis datos');
    await page.waitForTimeout(150);
    backupText = await page.evaluate(() => window.__copiedText);
    assert(
      typeof backupText === 'string' && backupText.includes('"trips"') && backupText.includes('"isPro":true'),
      'Exportar copia un backup en JSON con los viajes actuales y el estado de Pro',
      `preview=${JSON.stringify(backupText?.slice(0, 80))}`,
    );
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // gratis, sin viajes
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.click('text=Llevar mis datos a otro acceso');
    await page.waitForSelector('text=Copiar mis datos');
    await page.fill('textarea[placeholder^="Pegá acá"]', backupText);
    await page.click('text="Restaurar"');
    await page.waitForTimeout(150);
    const resultCount = await page.locator('text=/Listo: se sumó/').count();
    assert(resultCount === 1, 'Importar un backup muestra confirmación de lo agregado', `count=${resultCount}`);

    await page.click('text="Cerrar"');
    await page.waitForTimeout(400); // el cierre recarga la página porque hubo un import
    await page.waitForSelector('text=Mis viajes');
    const tripCount = await page.locator('[class*="tripCard"]').count();
    assert(tripCount === 1, 'El viaje importado aparece en "Mis viajes" tras recargar', `count=${tripCount}`);

    await page.click('[class*="tripCard"]');
    await page.waitForSelector('text=Tu valija para');
    const hasAddItem = await page.locator('input[placeholder="Agregar ítem…"]').count();
    assert(hasAddItem > 0, 'Importar un backup con Pro desbloquea Pro también en este contexto', `count=${hasAddItem}`);

    // reimportar el mismo backup no debería duplicar el viaje
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.click('text=Llevar mis datos a otro acceso');
    await page.waitForSelector('text=Copiar mis datos');
    await page.fill('textarea[placeholder^="Pegá acá"]', backupText);
    await page.click('text="Restaurar"');
    await page.waitForTimeout(150);
    const noNewMsg = await page.locator('text=Ya tenías todo esto').count();
    assert(noNewMsg === 1, 'Reimportar el mismo backup no duplica nada (dedup por id)', `count=${noNewMsg}`);
    await page.click('text="Cerrar"');
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    const tripCountAfter = await page.locator('[class*="tripCard"]').count();
    assert(tripCountAfter === 1, 'El viaje sigue siendo 1 después de reimportar el mismo backup', `count=${tripCountAfter}`);
    await ctx.close();
  }

  // ============================================================
  // 28) Privacidad y Soporte: enlazadas desde "Mis viajes" (la bienvenida
  // ahora es un splash que transiciona solo, sin links — ver Welcome.tsx)
  // y accesibles por URL directa (Apple entra directo, sin pasar por la app)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    const hasPrivacyLink = await page.locator('a[href="/privacidad"]').count();
    const hasSupportLink = await page.locator('a[href="/soporte"]').count();
    assert(
      hasPrivacyLink === 1 && hasSupportLink === 1,
      '"Mis viajes" enlaza a Privacidad y Soporte',
      `privacy=${hasPrivacyLink} support=${hasSupportLink}`,
    );

    await page.goto(`${BASE}/privacidad`);
    const hasPrivacyTitle = await page.locator('text=Política de privacidad').count();
    assert(hasPrivacyTitle > 0, 'La URL directa /privacidad muestra la política', `count=${hasPrivacyTitle}`);

    await page.goto(`${BASE}/soporte`);
    const hasSupportTitle = await page.locator('h2', { hasText: '¿Cómo empiezo?' }).count();
    assert(hasSupportTitle > 0, 'La URL directa /soporte muestra la página de ayuda', `count=${hasSupportTitle}`);
    await ctx.close();
  }

  // ============================================================
  // 29) Paywall real (stub sin cobro todavía): tocar "Desbloquear" en el
  // sheet de Pro prende isPro de verdad y las features bloqueadas
  // aparecen al toque, sin recargar la página
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser); // gratis
    await generateTrip(page, { maletas: ['Bodega'] });
    const hasApplyBefore = await page.locator('text=Aplicar una plantilla').count();
    assert(hasApplyBefore === 0, 'Antes de comprar, no se ve "Aplicar una plantilla"', `count=${hasApplyBefore}`);

    await page.click('text=Desbloquear ítems propios, plantillas y repetir viaje');
    await page.waitForSelector('text=Valija Pro');
    await page.click('button:has-text("Desbloquear —")');
    await page.waitForTimeout(150);

    const hasApplyAfter = await page.locator('text=Aplicar una plantilla').count();
    const hasClone = await page.locator('text=Repetir este viaje').count();
    assert(
      hasApplyAfter === 1 && hasClone === 1,
      'Tras "Desbloquear" en el paywall, las features Pro aparecen sin recargar la página',
      `apply=${hasApplyAfter} clone=${hasClone}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 30) Buscar/filtrar en la vista detallada: por nombre y por "sin
  // empacar", sin que el filtro afecte el progreso real
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });

    await page.fill('input[placeholder="Buscar ítem…"]', 'cinturón');
    await page.waitForTimeout(100);
    const hasCinturon = await page.locator('button', { hasText: 'Cinturón' }).count();
    const hasDni = await page.locator('button', { hasText: 'DNI y pasaporte' }).count();
    assert(
      hasCinturon === 1 && hasDni === 0,
      'Buscar por nombre deja ver solo los ítems que coinciden',
      `cinturon=${hasCinturon} dni=${hasDni}`,
    );

    await page.fill('input[placeholder="Buscar ítem…"]', '');
    await page.waitForTimeout(100);
    const hasDniAfterClear = await page.locator('button', { hasText: 'DNI y pasaporte' }).count();
    assert(hasDniAfterClear === 1, 'Vaciar la búsqueda vuelve a mostrar todos los ítems', `count=${hasDniAfterClear}`);

    await page.fill('input[placeholder="Buscar ítem…"]', 'zzz-no-existe');
    await page.waitForTimeout(100);
    const noResultsMsg = await page.locator('text=No hay ítems que coincidan').count();
    assert(noResultsMsg === 1, 'Sin coincidencias, muestra el mensaje de "sin resultados"', `count=${noResultsMsg}`);

    await page.fill('input[placeholder="Buscar ítem…"]', '');
    await page.waitForTimeout(80);
    await page.click('button:has-text("Cinturón")');
    await page.waitForTimeout(100);
    await page.click('text=Sin empacar');
    await page.waitForTimeout(100);
    const hasCinturonAfterPendingFilter = await page.locator('button', { hasText: 'Cinturón' }).count();
    const packedLabel = await progressNumLocator(page).textContent();
    assert(
      hasCinturonAfterPendingFilter === 0 && packedLabel.trim() !== '0',
      '"Sin empacar" oculta los ítems tildados sin afectar el progreso real',
      `cinturonVisible=${hasCinturonAfterPendingFilter} packed=${packedLabel}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 31) Ningún input queda por debajo de 16px de fuente, en ninguna
  // pantalla — evita el zoom automático de Safari en iOS (ya pasó dos
  // veces: v0.10.1 y el buscador de la checklist)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await assertNoTinyInputs(page, 'Nuevo viaje');

    await generateTrip(page, { maletas: ['Bodega'] });
    await assertNoTinyInputs(page, 'Checklist');

    await page.fill('input[placeholder="Agregar ítem…"]', 'Mameluco');
    await page.press('input[placeholder="Agregar ítem…"]', 'Enter');
    await page.waitForTimeout(80);
    await page.click('text=Guardar ítems como plantilla');
    await page.waitForSelector('text=Guardar como plantilla');
    await assertNoTinyInputs(page, 'Guardar como plantilla');
    await ctx.close();
  }

  // ============================================================
  // 32) Alojamiento "Camping": agrega su propia categoría con ítems
  // distintos al resto; sin elegirlo, esos ítems no aparecen
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Camping")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasCarpa = await page.locator('button', { hasText: 'Carpa' }).count();
    assert(hasCarpa === 1, 'Elegir alojamiento "Camping" agrega la categoría con sus ítems (ej. Carpa)', `carpa=${hasCarpa}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] }); // aloj por defecto: depto
    const hasCarpa = await page.locator('button', { hasText: 'Carpa' }).count();
    assert(hasCarpa === 0, 'Sin elegir "Camping", no aparecen sus ítems', `carpa=${hasCarpa}`);
    await ctx.close();
  }

  // ============================================================
  // 33) "¿Viajás con bebé o niño chico?": agrega la categoría Bebé,
  // separada del resto; sin tildarlo, no aparece
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Niño chico")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasPanales = await page.locator('button', { hasText: 'Pañales' }).count();
    assert(hasPanales === 1, 'Tildar "Niño chico" agrega la categoría Bebé con sus ítems (ej. Pañales)', `panales=${hasPanales}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] }); // sin bebé
    const hasPanales = await page.locator('button', { hasText: 'Pañales' }).count();
    assert(hasPanales === 0, 'Sin tildar "Niño chico", no aparecen sus ítems', `panales=${hasPanales}`);
    await ctx.close();
  }

  // ============================================================
  // 33b) "¿Viajás con niño chico y/o mascota?": la parte de mascota agrega
  // su propia categoría, independiente de bebé — se pueden combinar las
  // dos (multi-select, como Destino) sin un botón "Ambos" aparte.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Mascota")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasCorrea = await page.locator('button', { hasText: 'Correa' }).count();
    assert(hasCorrea === 1, 'Tildar "Mascota" agrega la categoría Mascota con sus ítems (ej. Correa)', `correa=${hasCorrea}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] }); // sin mascota
    const hasCorrea = await page.locator('button', { hasText: 'Correa' }).count();
    assert(hasCorrea === 0, 'Sin tildar "Mascota", no aparecen sus ítems', `correa=${hasCorrea}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Niño chico")');
    await page.click('button:has-text("Mascota")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasPanales = await page.locator('button', { hasText: 'Pañales' }).count();
    const hasCorrea = await page.locator('button', { hasText: 'Correa' }).count();
    assert(
      hasPanales === 1 && hasCorrea === 1,
      'Se puede tildar "Niño chico" y "Mascota" a la vez (multi-select, sin botón "Ambos")',
      `panales=${hasPanales} correa=${hasCorrea}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 33c) "Voy a hacer deporte": gratis (no Pro), agrega Championes para
  // correr y compañía; sin tildarlo (y sin turismo aventura) no aparecen.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page);
    await page.click('button:has-text("Voy a hacer deporte")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasChampiones = await page.locator('button', { hasText: 'Championes para correr' }).count();
    assert(hasChampiones === 1, 'Tildar "Voy a hacer deporte" agrega "Championes para correr" (sin ser Pro)', `championes=${hasChampiones}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] }); // turismo por defecto: relax, sin deporte
    const hasChampiones = await page.locator('button', { hasText: 'Championes para correr' }).count();
    assert(hasChampiones === 0, 'Sin tildar "Voy a hacer deporte" (y sin turismo aventura), no aparecen sus ítems', `championes=${hasChampiones}`);
    await ctx.close();
  }

  // ============================================================
  // 34) "Pienso lavar ropa en el viaje": baja la cantidad de mudas
  // calculadas respecto del mismo viaje sin marcarlo (las remeras tienen
  // tope propio más alto — ver test 41 — así que acá se chequea con
  // "Medias", que sí usa el tope general de mudas)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page);
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const mediasRow = page.locator('button', { hasText: 'Medias' }).first();
    const qtyBefore = await mediasRow.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
    await ctx.close();

    const { ctx: ctx2, page: page2 } = await freshPage(browser);
    await goToNewTripForm(page2);
    await page2.click('button:has-text("Pienso lavar ropa en el viaje")');
    await page2.click('button:has-text("Bodega")');
    await page2.click('button:has-text("Armar mi valija")');
    await page2.waitForURL(/\/viaje\//);
    await page2.waitForSelector('text=Tu valija para');
    const mediasRow2 = page2.locator('button', { hasText: 'Medias' }).first();
    const qtyAfter = await mediasRow2.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
    assert(
      parseInt(qtyAfter, 10) < parseInt(qtyBefore, 10),
      'Con "lavar ropa", la cantidad de medias baja respecto del mismo viaje sin marcarlo',
      `antes=${qtyBefore} después=${qtyAfter}`,
    );
    await ctx2.close();
  }

  // ============================================================
  // 35) Camping: "Repelente" queda unificado en Higiene (ya no existe
  // "Repelente industrial" por separado)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Camping")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasRepelenteIndustrial = await page.locator('button', { hasText: 'Repelente industrial' }).count();
    const hasRepelente = await page.locator('button', { hasText: 'Repelente' }).count();
    assert(hasRepelenteIndustrial === 0, 'Camping ya no genera "Repelente industrial"', `count=${hasRepelenteIndustrial}`);
    assert(hasRepelente === 1, 'Camping suma "Repelente" una sola vez (unificado en Higiene)', `count=${hasRepelente}`);
    await ctx.close();
  }

  // ============================================================
  // 36) Distribución: Camping aparece en su propia sección aparte
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Camping")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Mochila")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    await page.click('text=Ver cómo repartir en tus valijas');
    await page.waitForURL(/distribucion/);
    const hasCampingSection = await page.locator('text=Camping').count();
    const hasCarpa = await page.locator('text=Carpa').count();
    assert(
      hasCampingSection > 0 && hasCarpa > 0,
      'Distribución muestra una sección aparte de Camping',
      `seccion=${hasCampingSection} carpa=${hasCarpa}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 37) Playa sola + 7 días o más: suma "Zapatillas cómodas para caminar"
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page); // destino por defecto: playa
    const stepperPlus = page.locator('text=días de viaje').locator('..').locator('..').locator('button').last();
    await stepperPlus.click();
    await stepperPlus.click(); // 5 -> 7 días
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasZapatillas = await page.locator('button', { hasText: 'Zapatillas cómodas para caminar' }).count();
    assert(hasZapatillas === 1, 'Playa sola de 7+ días suma "Zapatillas cómodas para caminar"', `count=${hasZapatillas}`);
    await ctx.close();
  }

  // ============================================================
  // 38) Bebé + playa: 2 trajes de baño de bebé + chaleco salvavidas
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page); // destino por defecto: playa
    await page.click('button:has-text("Niño chico")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasChaleco = await page.locator('button', { hasText: 'Chaleco salvavidas de bebé' }).count();
    const trajeRow = page.locator('button', { hasText: 'Traje de baño de bebé' }).first();
    const trajeQty = await trajeRow.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
    assert(hasChaleco === 1, 'Bebé + playa suma "Chaleco salvavidas de bebé"', `count=${hasChaleco}`);
    assert(trajeQty === '2', 'Traje de baño de bebé arranca en cantidad 2', `qty=${trajeQty}`);
    await ctx.close();
  }

  // ============================================================
  // 39) Bodega + carry-on: 2 candados nombrados (uno por valija)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page); // Carry-on ya viene tildado por defecto
    await page.click('button:has-text("Bodega")'); // ahora carry + bodega
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const lockButtons = await page.locator('button', { hasText: 'Candado' }).count();
    const hasBodegaLock = await page.locator('button', { hasText: 'Candado para la valija de bodega' }).count();
    const hasCarryLock = await page.locator('button', { hasText: 'Candado para el carry-on' }).count();
    assert(
      lockButtons === 2 && hasBodegaLock === 1 && hasCarryLock === 1,
      'Bodega + carry-on suman 2 candados nombrados, uno por valija',
      `total=${lockButtons} bodega=${hasBodegaLock} carry=${hasCarryLock}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 40) Botón de volver en "Tu valija para..." lleva a Mis viajes
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] });
    await page.click('[aria-label="Volver a mis viajes"]');
    await page.waitForURL(/\/viajes/);
    const hasMisViajes = await page.locator('text=Mis viajes').count();
    assert(hasMisViajes > 0, 'El botón de volver en la checklist lleva a "Mis viajes"', `count=${hasMisViajes}`);
    await ctx.close();
  }

  // ============================================================
  // 41) Tildar un ítem lo manda al fondo de su categoría (mismo criterio
  // que los viajes finalizados en "Mis viajes"), arriba de "Agregar ítem"
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await generateTrip(page, { maletas: ['Bodega'] });
    const dni = page.locator('button', { hasText: 'DNI y pasaporte' }).first();
    const pasajes = page.locator('button', { hasText: 'Pasajes / boarding pass' }).first();
    const addRow = page.locator('input[placeholder="Agregar ítem…"]').first();

    const beforeDni = (await dni.boundingBox()).y;
    const beforePasajes = (await pasajes.boundingBox()).y;
    assert(
      beforeDni < beforePasajes,
      'Antes de tildar, "DNI y pasaporte" va antes que "Pasajes / boarding pass"',
      `dni=${beforeDni} pasajes=${beforePasajes}`,
    );

    await dni.click();
    // El FLIP al tildar (useFlipReorder) sostiene el ítem en su lugar
    // ~220ms y recién ahí lo desplaza en ~300ms — hay que esperar a que
    // termine del todo antes de medir la posición final, si no se mide
    // un frame a mitad de la animación.
    await page.waitForTimeout(650);

    const afterDni = (await dni.boundingBox()).y;
    const afterPasajes = (await pasajes.boundingBox()).y;
    const afterAddRow = (await addRow.boundingBox()).y;
    assert(
      afterDni > afterPasajes,
      'Tildar "DNI y pasaporte" lo manda debajo de "Pasajes / boarding pass" dentro de Documentos',
      `dni=${afterDni} pasajes=${afterPasajes}`,
    );
    assert(
      afterDni < afterAddRow,
      'El ítem tildado queda arriba de "Agregar ítem" de su propia categoría',
      `dni=${afterDni} addRow=${afterAddRow}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 42) Bebé, mascota y Camping son categorías Pro: sin desbloquear,
  // tocarlas abre el paywall en vez de seleccionarlas; con Pro, se
  // seleccionan normal
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser); // sin pro
    await goToNewTripForm(page);
    await page.click('button:has-text("Niño chico")');
    const paywallAfterBebe = await page.locator('text=Desbloqueá todo, para siempre').count();
    assert(paywallAfterBebe === 1, 'Sin Pro, tocar "Niño chico" abre el paywall', `count=${paywallAfterBebe}`);
    await page.click('text=Ahora no');
    await page.waitForTimeout(100);
    const bebeSelected = await page
      .locator('button', { hasText: 'Niño chico' })
      .getAttribute('class')
      .then((c) => c && c.includes('selected'));
    assert(!bebeSelected, 'Sin Pro, "Niño chico" no queda seleccionado tras cerrar el paywall', `selected=${bebeSelected}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // sin pro
    await goToNewTripForm(page);
    await page.click('button:has-text("Mascota")');
    const paywallAfterMascota = await page.locator('text=Desbloqueá todo, para siempre').count();
    assert(paywallAfterMascota === 1, 'Sin Pro, tocar "Mascota" abre el paywall', `count=${paywallAfterMascota}`);
    await page.click('text=Ahora no');
    await page.waitForTimeout(100);
    const mascotaSelected = await page
      .locator('button', { hasText: 'Mascota' })
      .getAttribute('class')
      .then((c) => c && c.includes('selected'));
    assert(!mascotaSelected, 'Sin Pro, "Mascota" no queda seleccionada tras cerrar el paywall', `selected=${mascotaSelected}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // sin pro
    await goToNewTripForm(page);
    await page.click('button:has-text("Camping")');
    const paywallAfterCamping = await page.locator('text=Desbloqueá todo, para siempre').count();
    assert(paywallAfterCamping === 1, 'Sin Pro, tocar "Camping" abre el paywall', `count=${paywallAfterCamping}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Camping")');
    const campingSelected = await page
      .locator('button', { hasText: 'Camping' })
      .getAttribute('class')
      .then((c) => c && c.includes('selected'));
    assert(campingSelected, 'Con Pro, "Camping" se selecciona normalmente', `selected=${campingSelected}`);
    await ctx.close();
  }

  // ============================================================
  // 43) Aviso de espacio (⚠️) también en la Checklist, no solo en
  // Distribución — funciona incluso con 1 sola valija (donde no existe
  // pantalla de distribución para mostrarlo)
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Niño chico")'); // bebé
    await page.click('button:has-text("Frío")');
    await page.click('button:has-text("Auto")');
    // 1 sola valija (Carry-on, el default) — sin botón de distribución
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasWarning = await page.locator('text=Tenés bastantes ítems que ocupan lugar').count();
    assert(hasWarning === 1, 'Aviso de espacio aparece en la Checklist incluso con 1 sola valija', `count=${hasWarning}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // viaje liviano por defecto
    await generateTrip(page, { maletas: ['Bodega'] });
    const hasWarning = await page.locator('text=Tenés bastantes ítems que ocupan lugar').count();
    assert(hasWarning === 0, 'Sin bulto real, no aparece el aviso de espacio en la Checklist', `count=${hasWarning}`);
    await ctx.close();
  }

  // ============================================================
  // 44) Bienvenida como splash que transiciona sola (estilo Headspace):
  // usuario nuevo ve un mensaje corto y pasa a Intro; usuario que vuelve
  // ve solo la mascota e, idealmente, va directo a su viaje sin terminar
  // ============================================================
  function seedTrip(overrides = {}) {
    return {
      id: 'seed-trip-1',
      createdAt: new Date().toISOString(),
      form: {
        name: '',
        dest: ['playa'],
        clima: 'calor',
        motivo: 'placer',
        turismo: 'relax',
        aloj: 'depto',
        transporte: 'avion',
        maletas: ['carry'],
        dias: 5,
        vestidos: false,
      },
      items: [{ id: '0-docs', cat: 'docs', name: 'DNI y pasaporte', qty: 1, done: false }],
      homeChecklist: [],
      ...overrides,
    };
  }

  {
    const { ctx, page } = await freshPage(browser); // sin viajes guardados
    // Usuario nuevo espera 3600ms antes de pasar solo (tiempo para leer).
    await page.waitForURL(/\/intro$/, { timeout: 4200 });
    const hasIntroTitle = await page.locator('text=Tres toques y tu valija está lista').count();
    assert(hasIntroTitle > 0, 'Usuario nuevo: la bienvenida transiciona sola a Intro sin tocar nada', `count=${hasIntroTitle}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // sin viajes guardados
    await page.click('[aria-label="Continuar"]');
    await page.waitForURL(/\/intro$/, { timeout: 1000 });
    assert(true, 'Tocar la pantalla de bienvenida saltea la espera en vez de forzar a mirarla entera');
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await page.evaluate((trip) => {
      localStorage.setItem('valija:trips', JSON.stringify([trip]));
      localStorage.setItem('valija:lastTripId', JSON.stringify(trip.id));
    }, seedTrip());
    await page.goto(`${BASE}/`);
    await page.waitForURL(/\/viaje\/seed-trip-1$/, { timeout: 3500 });
    const hasTitle = await page.locator('text=Tu valija para').count();
    assert(hasTitle > 0, 'Usuario que vuelve con un viaje sin terminar va directo a su checklist', `url=${page.url()}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await page.evaluate((trip) => {
      localStorage.setItem('valija:trips', JSON.stringify([trip]));
    }, seedTrip({ finishedAt: new Date().toISOString() }));
    await page.goto(`${BASE}/`);
    await page.waitForURL(/\/viajes$/, { timeout: 3500 });
    const hasMisViajesTitle = await page.locator('text=Mis viajes').count();
    assert(hasMisViajesTitle > 0, 'Usuario que vuelve con todo finalizado va a "Mis viajes", no a un viaje al azar', `url=${page.url()}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // sin viajes guardados
    await page.click('[aria-label="Continuar"]');
    await page.waitForURL(/\/intro$/, { timeout: 1000 });
    // A mitad de camino tiene que existir una copia de la mascota en pleno
    // viaje (tamaño intermedio entre los 150px de Welcome y los 44px de
    // Intro) — si esto falla, el morph se rompió y quedó un salto seco.
    await page.waitForTimeout(180);
    const midSizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('svg[aria-label="Valu, la valija mascota"]')).map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    const midFlight = midSizes.some((w) => w > 50 && w < 140);
    assert(midFlight, 'El morph de la mascota se ve en pleno viaje (no un salto seco)', `sizes=${JSON.stringify(midSizes)}`);
    // Usuario nuevo viaja a media velocidad (1680ms) — hay que esperar más
    // que en el caso general para que termine de verdad.
    await page.waitForTimeout(1650);
    const finalSizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('svg[aria-label="Valu, la valija mascota"]')).map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    assert(
      finalSizes.length === 1 && finalSizes[0] === 44,
      'Terminado el morph, queda una sola mascota visible en su tamaño final',
      `finalSizes=${JSON.stringify(finalSizes)}`,
    );
    await ctx.close();
  }
  {
    // El fade del fondo y el viaje de la mascota tienen que arrancar
    // juntos, no uno después del otro — se chequea bien temprano (30ms)
    // que las dos cosas ya estén en marcha a la vez.
    const { ctx, page } = await freshPage(browser); // sin viajes guardados
    await page.click('[aria-label="Continuar"]');
    await page.waitForURL(/\/intro$/, { timeout: 1000 });
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => {
      const bg = Array.from(document.querySelectorAll('div')).find((d) => getComputedStyle(d).zIndex === '9998');
      const mascotSizes = Array.from(document.querySelectorAll('svg[aria-label="Valu, la valija mascota"]')).map((el) =>
        Math.round(el.getBoundingClientRect().width),
      );
      return { bgOpacity: bg ? Number(getComputedStyle(bg).opacity) : null, mascotSizes };
    });
    // El fade dura ahora lo mismo que el viaje de la mascota (1680ms para
    // usuario nuevo), así que a los 100ms avanzó poco — alcanza con que
    // ya no esté en 1 para confirmar que arrancó, no que esté avanzado.
    const bgAlreadyFading = state.bgOpacity !== null && state.bgOpacity < 0.99;
    // No hace falta que ya esté "a mitad de camino" — con que se haya
    // despegado un poco del tamaño de arranque (150px) alcanza para
    // confirmar que el viaje ya empezó, no que esté esperando.
    const mascotAlreadyMoving = state.mascotSizes.some((w) => w < 148);
    assert(
      bgAlreadyFading && mascotAlreadyMoving,
      'El fade del fondo y el viaje de la mascota arrancan al mismo tiempo',
      `state=${JSON.stringify(state)}`,
    );
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${BASE}/`); // sin viajes guardados
    await page.waitForURL(/\/intro$/, { timeout: 800 });
    const count = await page.locator('svg[aria-label="Valu, la valija mascota"]').count();
    assert(count === 1, 'Con "reducir movimiento" activado, no se arma ninguna copia de la mascota (salto directo)', `count=${count}`);
    await ctx.close();
  }

  // ============================================================
  // 45) Fix: el FLIP de reorder (useFlipReorder) medía la posición de los
  // ítems relativa al viewport. Si el usuario scrolleaba (sin tildar nada)
  // entre un tilde y el siguiente, esa foto vieja quedaba desactualizada:
  // al tildar de nuevo, TODOS los ítems de la lista (no solo el tildado)
  // se veían "saltar" desde un offset falso igual al scroll de por medio —
  // más notorio cuanto más se había scrolleado para llegar al ítem
  // (típicamente, ítems cerca del borde superior tras bajar bastante).
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page); // trae "DNI y pasaporte" (docs) y "Cepillo de dientes" (higiene)

    // Tilde inicial para que useFlipReorder registre una primera "foto".
    await page.locator('button', { hasText: 'DNI y pasaporte' }).first().click();
    await page.waitForTimeout(650);

    // Scrollear bastante SIN tildar nada — el bug aparecía acá: la foto
    // guardada queda vieja respecto del scroll actual.
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(150);

    // Tildar otro ítem de Documentos dispara el reorder de nuevo.
    await page.locator('button', { hasText: 'Pasajes / boarding pass' }).first().click();

    // Un ítem de Higiene (categoría totalmente distinta, mucho más abajo)
    // nunca debería animarse por esto: no cambió su lugar en el documento.
    const higieneAnims = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Cepillo de dientes'));
      return el ? el.getAnimations().length : -1;
    });
    assert(
      higieneAnims === 0,
      'Tildar en Documentos tras scrollear no anima ítems de otra categoría (Higiene) que no se movieron',
      `higieneAnims=${higieneAnims}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 46) Deshacer un ítem/tarea borrada por error (UndoSnackbar): borrar no
  // pide confirmación (es una acción frecuente), pero deja un rato corto
  // para deshacer antes de que se pierda de verdad.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);

    await page.click('[aria-label="Borrar DNI y pasaporte"]');
    const dniGone = await page.locator('button', { hasText: 'DNI y pasaporte' }).count();
    assert(dniGone === 0, 'Borrar un ítem lo saca de la lista al toque, sin pedir confirmación', `count=${dniGone}`);

    const snackbarText = await page.locator('text=borrado').first().textContent();
    assert(snackbarText?.includes('DNI y pasaporte'), 'Aparece el snackbar de "Deshacer" nombrando el ítem borrado', `text=${snackbarText}`);

    await page.click('text=Deshacer');
    const dniBack = await page.locator('button', { hasText: 'DNI y pasaporte' }).count();
    assert(dniBack === 1, 'Tocar "Deshacer" repone el ítem borrado', `count=${dniBack}`);

    const snackbarGoneAfterUndo = await page.locator('text=Deshacer').count();
    assert(snackbarGoneAfterUndo === 0, 'El snackbar desaparece después de deshacer', `count=${snackbarGoneAfterUndo}`);
    await ctx.close();
  }
  {
    // Pasado el tiempo de espera, el borrado queda firme: "Deshacer" ya no
    // hace nada porque el snackbar mismo desapareció.
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Borrar DNI y pasaporte"]');
    await page.waitForTimeout(5300);
    const snackbarStillThere = await page.locator('text=Deshacer').count();
    assert(snackbarStillThere === 0, 'El snackbar desaparece solo pasado el tiempo de espera', `count=${snackbarStillThere}`);
    await ctx.close();
  }
  {
    // El snackbar no debe quedar tapado por el BottomNav (sticky, abajo de
    // todo) — verificamos que su borde inferior quede por encima del nav.
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Borrar DNI y pasaporte"]');
    // Esperar a que termine la animación de entrada del snackbar (0.22s)
    // antes de medir su posición final en reposo.
    await page.waitForTimeout(300);
    const overlap = await page.evaluate(() => {
      const nav = document.querySelector('nav, [class*="nav"]');
      const snackbar = document.querySelector('[role="status"]');
      if (!nav || !snackbar) return null;
      const navRect = nav.getBoundingClientRect();
      const snackRect = snackbar.getBoundingClientRect();
      return { navTop: navRect.top, snackBottom: snackRect.bottom };
    });
    assert(
      overlap !== null && overlap.snackBottom <= overlap.navTop,
      'El snackbar de "Deshacer" queda por encima del BottomNav, sin taparlo',
      `overlap=${JSON.stringify(overlap)}`,
    );
    await ctx.close();
  }
  {
    // Borrar una tarea de casa/barco también ofrece deshacer, con su
    // propio mensaje (no confundido con el de un ítem de la valija).
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Borrar Apagar las luces"]');
    const taskGone = await page.locator('button', { hasText: 'Apagar las luces' }).count();
    assert(taskGone === 0, 'Borrar una tarea de casa la saca de la lista al toque', `count=${taskGone}`);
    await page.click('text=Deshacer');
    const taskBack = await page.locator('button', { hasText: 'Apagar las luces' }).count();
    assert(taskBack === 1, 'Deshacer repone también una tarea de casa borrada', `count=${taskBack}`);
    await ctx.close();
  }

  // ============================================================
  // 47) Fix: deshacer un borrado MIENTRAS la animación de reorder anterior
  // (el cierre del hueco) todavía está en curso dejaba ítems "pegados" con
  // un transform que nunca se resolvía — useFlipReorder medía la posición
  // de un elemento a mitad de una animación vieja en vez de su posición
  // real de reposo. El fix cancela cualquier animación en curso de un
  // ítem antes de volver a medirlo/animarlo.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Borrar Pasajes / boarding pass"]');
    // Deshacer bien rápido, con el cierre del hueco (HOLD 220ms + TRAVEL
    // 300ms) todavía a mitad de camino — el escenario exacto del bug.
    await page.waitForTimeout(80);
    await page.click('text=Deshacer');
    // Esperar a que termine cualquier animación en danza (bien por encima
    // de HOLD+TRAVEL) y recién ahí medir el estado de reposo final.
    await page.waitForTimeout(700);
    const stuck = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .filter((b) => b.className.includes('item') && !b.className.includes('qty'))
        .some((el) => getComputedStyle(el).transform !== 'none'),
    );
    assert(!stuck, 'Deshacer a mitad de la animación de reorder no deja ningún ítem con un transform pegado', `stuck=${stuck}`);
    const dniStillThere = await page.locator('button', { hasText: 'DNI y pasaporte' }).count();
    const pasajesBack = await page.locator('button', { hasText: 'Pasajes / boarding pass' }).count();
    assert(
      dniStillThere === 1 && pasajesBack === 1,
      'Deshacer a mitad de la animación de todos modos repone el ítem correctamente',
      `dni=${dniStillThere} pasajes=${pasajesBack}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 48) Fix: deshacer un borrado repone el ítem en su posición original,
  // no al fondo de la categoría. Antes restoreItem lo agregaba al final
  // del array — como el sort por tildado es estable, entre pendientes
  // eso lo mandaba al fondo de Documentos en vez de devolverlo a donde
  // estaba.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    // Orden real de Documentos (sin auto/trabajo): DNI y pasaporte,
    // Libreta de conducir, Pasajes / boarding pass, Reserva de
    // alojamiento, Billetera, Tarjetas y efectivo, Seguro de viaje.
    // Borramos "Reserva de alojamiento", que va en el medio.
    await page.click('[aria-label="Borrar Reserva de alojamiento"]');
    await page.click('text=Deshacer');
    await page.waitForTimeout(650); // esperar a que termine cualquier animación

    const order = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .filter((b) => b.className.includes('item') && !b.className.includes('qty'))
        .map((b) => b.textContent)
        .filter((t) => /Pasajes|Reserva|Billetera/.test(t))
        .map((t) => (t.includes('Pasajes') ? 'Pasajes' : t.includes('Reserva') ? 'Reserva' : 'Billetera')),
    );
    assert(
      order.join(',') === 'Pasajes,Reserva,Billetera',
      'Deshacer repone el ítem en su posición original (entre Pasajes y Billetera), no al fondo',
      `order=${order.join(',')}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 48b) Fix: un ítem recién restaurado con "Deshacer" (aparece en el
  // medio de la lista) se pisaba visualmente con el vecino que tenía que
  // correrse para hacerle lugar — el vecino se queda "sostenido" en su
  // posición vieja durante el hold del FLIP, y esa posición vieja es
  // justo donde el ítem nuevo ya está parado (sin animación propia, por
  // ser "recién aparecido"). Se lo mantiene invisible durante ese mismo
  // hold y recién aparece con un fade corto, sincronizado con que el
  // vecino ya empezó a moverse.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    // Higiene: Enjuague bucal -> Desodorante -> Shampoo y acondicionador.
    // Borramos "Desodorante" (queda en el medio) y deshacemos.
    await page.click('[aria-label="Borrar Desodorante"]');
    await page.click('text=Deshacer');
    await page.waitForTimeout(90); // bien adentro del hold (220ms)

    const midHold = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button')).filter((b) => b.className.includes('item') && !b.className.includes('qty'));
      const desodorante = items.find((b) => b.textContent?.includes('Desodorante'));
      const shampoo = items.find((b) => b.textContent?.includes('Shampoo'));
      if (!desodorante || !shampoo) return null;
      const dRect = desodorante.getBoundingClientRect();
      const sRect = shampoo.getBoundingClientRect();
      const overlap = dRect.top < sRect.bottom && sRect.top < dRect.bottom;
      return { desodoranteOpacity: Number(getComputedStyle(desodorante).opacity), overlap };
    });
    assert(
      midHold !== null && (!midHold.overlap || midHold.desodoranteOpacity < 0.5),
      'Un ítem restaurado con Deshacer no se pisa visualmente con el vecino que se corre para hacerle lugar',
      `midHold=${JSON.stringify(midHold)}`,
    );

    await page.waitForTimeout(600);
    const settledVisible = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Desodorante'));
      return el ? Number(getComputedStyle(el).opacity) : null;
    });
    assert(settledVisible === 1, 'Terminada la animación, el ítem restaurado queda completamente visible', `opacity=${settledVisible}`);
    await ctx.close();
  }

  // ============================================================
  // 49) "Mis viajes": finalizar/reactivar anima el desplazamiento (mismo
  // FLIP que la checklist) en vez de saltar en seco a su nueva posición.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje A');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    await goToNewTripForm(page);
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje B');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.click('[aria-label="Marcar Viaje B como finalizado"]');
    // A mitad de camino, "Viaje A" (que sube para ocupar el lugar de B)
    // tiene que estar en pleno vuelo — no ya asentado en su posición.
    await page.waitForTimeout(60);
    const midFlight = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Viaje A'));
      return btn ? getComputedStyle(btn).transform : null;
    });
    assert(midFlight !== null && midFlight !== 'none', 'Finalizar un viaje anima el reacomodo del resto (FLIP), no un salto seco', `transform=${midFlight}`);
    await ctx.close();
  }

  // ============================================================
  // 50) "Mis viajes": borrar anima la salida (fade + deslizamiento) antes
  // de sacar el viaje de la lista, en vez de que desaparezca en seco.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje A');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.click('[aria-label="Borrar Viaje A"]');
    await page.click('text=Sí, borrar');
    await page.waitForTimeout(60);
    const midFade = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Viaje A'));
      return btn ? { stillThere: true, opacity: Number(getComputedStyle(btn).opacity) } : { stillThere: false };
    });
    assert(
      midFade.stillThere && midFade.opacity < 1,
      'Borrar un viaje lo desvanece antes de sacarlo (no desaparece en seco)',
      `midFade=${JSON.stringify(midFade)}`,
    );
    await page.waitForTimeout(400);
    const goneAfter = await page.locator('text=Viaje A').count();
    assert(goneAfter === 0, 'Terminada la animación, el viaje borrado ya no está en la lista', `count=${goneAfter}`);
    await ctx.close();
  }

  // ============================================================
  // 51) "Mis viajes": la tarjeta que sube para ocupar el lugar del viaje
  // borrado no se pisa con el "Tip de Valu", ni el tip con el botón de
  // backup de abajo — todo el bloque de después de las tarjetas viaja
  // junto como una sola unidad (mismo FLIP), no reflowa en seco.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page);
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje A');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    // Viaje B se crea después, así que queda arriba de A (más nuevo primero).
    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    await page.click('button:has-text("Nuevo viaje")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    await page.click('[aria-label="Cambiar nombre del viaje"]');
    await page.locator('input[class*="heroTitleInput"]').fill('Viaje B');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);

    await page.goto(`${BASE}/viajes`);
    await page.waitForSelector('text=Mis viajes');
    // Borramos B: A (el último, pegado al tip) tiene que subir un lugar.
    await page.click('[aria-label="Borrar Viaje B"]');
    await page.click('text=Sí, borrar');

    // Mitad de la animación de reacomodo (después del exit-fade de B y
    // ya entrada la fase de viaje del FLIP) — el punto exacto donde el
    // bug se veía antes del fix.
    await page.waitForTimeout(350);
    const overlap = await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Viaje A'));
      const tip = document.querySelector('[class*="tip"]');
      const backup = document.querySelector('[class*="backupBtn"]');
      if (!card || !tip || !backup) return null;
      return {
        cardToTipGap: tip.getBoundingClientRect().top - card.getBoundingClientRect().bottom,
        tipToBackupGap: backup.getBoundingClientRect().top - tip.getBoundingClientRect().bottom,
      };
    });
    assert(
      overlap !== null && overlap.cardToTipGap > -1,
      'Al borrar un viaje, la tarjeta que sube no se pisa con el "Tip de Valu"',
      `overlap=${JSON.stringify(overlap)}`,
    );
    assert(
      overlap !== null && overlap.tipToBackupGap > -1,
      'Al borrar un viaje, el "Tip de Valu" no se pisa con el botón de backup de abajo',
      `overlap=${JSON.stringify(overlap)}`,
    );
    await ctx.close();
  }

  // ============================================================
  // 52) "Esquí" y "Navegar" son categorías Pro (mismo criterio que
  // bebé/mascota/camping): sin desbloquear, tocarlas abre el paywall;
  // con Pro, generan su propia categoría de ítems.
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser); // sin pro
    await goToNewTripForm(page);
    await page.click('button:has-text("Esquí")');
    const paywallAfterSki = await page.locator('text=Desbloqueá todo, para siempre').count();
    assert(paywallAfterSki === 1, 'Sin Pro, tocar "Esquí" abre el paywall', `count=${paywallAfterSki}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser); // sin pro
    await goToNewTripForm(page);
    await page.click('button:has-text("Navegar")');
    const paywallAfterNavegar = await page.locator('text=Desbloqueá todo, para siempre').count();
    assert(paywallAfterNavegar === 1, 'Sin Pro, tocar "Navegar" abre el paywall', `count=${paywallAfterNavegar}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Esquí")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasCampera = await page.locator('button', { hasText: 'Campera de nieve' }).count();
    assert(hasCampera === 1, 'Tildar "Esquí" agrega la categoría con sus ítems (ej. Campera de nieve)', `campera=${hasCampera}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] }); // turismo por defecto: relax
    const hasCampera = await page.locator('button', { hasText: 'Campera de nieve' }).count();
    assert(hasCampera === 0, 'Sin tildar "Esquí", no aparecen sus ítems', `campera=${hasCampera}`);
    await ctx.close();
  }

  // ============================================================
  // 53) "Navegar" suma su categoría de ítems personales Y REEMPLAZA la
  // lista de casa por la del barco ("¿Está todo listo para zarpar?").
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Navegar")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasCalzado = await page.locator('button', { hasText: 'Calzado náutico antideslizante' }).count();
    assert(hasCalzado === 1, 'Tildar "Navegar" agrega la categoría con sus ítems (ej. Calzado náutico)', `calzado=${hasCalzado}`);
    const hasBoatSection = await page.locator('text=¿Está todo listo para zarpar?').count();
    assert(hasBoatSection === 1, 'Con "Navegar" aparece la sección "¿Está todo listo para zarpar?"', `count=${hasBoatSection}`);
    const hasChaleco = await page.locator('button', { hasText: 'Chalecos salvavidas' }).count();
    assert(hasChaleco === 1, 'La lista del barco tiene sus tareas (ej. Chalecos salvavidas)', `chaleco=${hasChaleco}`);
    const hasHomeSection = await page.locator('text=¿Quedó todo pronto en casa?').count();
    assert(hasHomeSection === 0, 'Navegar REEMPLAZA la lista de casa por la del barco (no aparecen las dos)', `count=${hasHomeSection}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await generateTrip(page, { maletas: ['Bodega'] }); // turismo por defecto: relax
    const hasCalzado = await page.locator('button', { hasText: 'Calzado náutico antideslizante' }).count();
    assert(hasCalzado === 0, 'Sin tildar "Navegar", no aparecen sus ítems', `calzado=${hasCalzado}`);
    const hasBoatSection = await page.locator('text=¿Está todo listo para zarpar?').count();
    assert(hasBoatSection === 0, 'Sin "Navegar", no aparece la sección del barco', `count=${hasBoatSection}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Navegar")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    // Tildar una tarea del barco no debería afectar el contador de
    // empacado de la valija — mismo criterio que ya vale para casa.
    const packedBefore = await page.locator('span', { hasText: /^de \d+ empacado$/ }).locator('xpath=preceding-sibling::span[1]').textContent();
    await page.click('button:has-text("Chalecos salvavidas")');
    await page.waitForTimeout(100);
    const packedAfter = await page.locator('span', { hasText: /^de \d+ empacado$/ }).locator('xpath=preceding-sibling::span[1]').textContent();
    assert(packedBefore === packedAfter, 'Tildar una tarea del barco NO afecta el contador de empacado de la valija', `antes=${packedBefore} despues=${packedAfter}`);
    await ctx.close();
  }

  // ============================================================
  // 54) El tipo de turismo aparece en la fila de chips de la checklist
  // (reportado por el usuario: eligió "Esquí" y no se veía en ningún
  // lado) — importante con esquí/navegar porque cambia toda una
  // categoría de ítems, no es un detalle cosmético como con el resto
  // de las opciones de turismo. No aparece con motivo "trabajo" (no se
  // pregunta en ese caso).
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser, { pro: true });
    await goToNewTripForm(page);
    await page.click('button:has-text("Esquí")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasSkiChip = await page.locator('[class*="chip"]', { hasText: 'Esquí' }).count();
    assert(hasSkiChip >= 1, 'El tipo de turismo (Esquí) aparece en la fila de chips', `count=${hasSkiChip}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await freshPage(browser);
    await goToNewTripForm(page);
    await page.click('button:has-text("Trabajo")');
    await page.click('button:has-text("Bodega")');
    await page.click('button:has-text("Armar mi valija")');
    await page.waitForURL(/\/viaje\//);
    await page.waitForSelector('text=Tu valija para');
    const hasTurismoChip = await page.locator('[class*="chip"]', { hasText: 'Relax' }).count();
    assert(hasTurismoChip === 0, 'Con motivo "Trabajo", no aparece un chip de turismo (no se pregunta)', `count=${hasTurismoChip}`);
    await ctx.close();
  }
} catch (err) {
  fail('EXCEPCION NO MANEJADA', err.stack || String(err));
} finally {
  if (browser) await browser.close();
  server.kill();
}

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
console.log(`\n=== RESULTADOS: ${passed}/${results.length} OK ===\n`);
for (const r of results) {
  console.log(`${r.pass ? '✓' : '✗ FALLA'} ${r.label}${r.detail ? ' — ' + r.detail : ''}`);
}
if (failed.length > 0) process.exitCode = 1;
