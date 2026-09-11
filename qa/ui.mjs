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

async function freshPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => localStorage.clear());
  return { ctx, page };
}

async function goToNewTripForm(page) {
  await page.goto(`${BASE}/nuevo`);
  await page.waitForSelector('text=Nuevo viaje');
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
    const { ctx, page } = await freshPage(browser);
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
    const { ctx, page } = await freshPage(browser);
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
    const { ctx, page } = await freshPage(browser);
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
    await page.click('text=Cerrar');
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

    const cardsBefore = await page.locator('[aria-label^="Borrar "]').count();
    assert(cardsBefore === 2, 'Hay 2 viajes guardados antes de borrar', `cards=${cardsBefore}`);

    await page.locator('[aria-label^="Borrar "]').first().click();
    await page.waitForSelector('text=No se puede deshacer.');
    await page.click('button:has-text("Sí, borrar")');
    await page.waitForTimeout(100);
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
    const totalItems = await page.locator('button[aria-label^="Borrar"]').count();

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
    // el número y el "de N empacado" viven en spans hermanos separados,
    // sin espacio entre ellos en el DOM — ubicamos el span exacto "de N
    // empacado" y tomamos su hermano anterior (el contador de empacados)
    const progressNum = () => page.locator('span', { hasText: /^de \d+ empacado$/ }).locator('xpath=preceding-sibling::span[1]');
    const packedAfterOn = await progressNum().textContent();
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
    const packedAfterOff = await progressNum().textContent();
    assert(packedAfterOff.trim() === '0', 'Volver a tocar un grupo ya completo lo desmarca entero', `packed=${packedAfterOff}`);
    await ctx.close();
  }

  // ============================================================
  // 13) Vista rápida: un ítem personalizado cae en el grupo de su categoría
  // ============================================================
  {
    const { ctx, page } = await freshPage(browser);
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
      docsCountText.startsWith('7'),
      'Ítem personalizado en Documentos se cuenta en el grupo rápido "Documentos" (6 base + 1)',
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
    for (const name of ['DNI y pasaporte', 'Pasajes / boarding pass', 'Reserva de alojamiento', 'Billetera', 'Tarjetas y efectivo', 'Seguro de viaje']) {
      await page.click(`button:has-text("${name}")`);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(100);
    const notaTrasDocs = await page.locator('text=Ahora seguí con la ropa').count();
    assert(notaTrasDocs === 1, 'Al completar documentos, la nota invita a seguir con la ropa', `count=${notaTrasDocs}`);
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
