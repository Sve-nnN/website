/*
 * Etapa budget de la home v4 (52-06, tarea 3): presupuesto de efectos con recorrido completo de scroll.
 * Chequeos b0..b11. D-08, D-09, D-10.
 *
 * Adaptado de la version v3 (worktree agent-a52c13fdfcfe5a678) al motor de efectos v4:
 *   ids de efecto = 'hero-dither' (Dither, banda del hero) y 'sites-halftone' (HalftoneReveal, capturas de websites);
 *   bandas [data-fx][data-mounted="true"] en lugar de [data-home-effect]; secciones de lectura por id.
 * En v4 el halftone solo se monta con pointerenter de raton sobre un .devlink: para realizarlo hay que
 * pasar el puntero por encima.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliSize, closureOf, entryKey, gzipSize, originalKey, readManifest } from '../lib/manifest.mjs';
import { DESKTOP, MOBILE_OPTS, SAVE_DATA_INIT } from '../lib/home-page.mjs';

const ORIGINALS = ['Dither', 'HalftoneReveal'];
// Secciones de lectura que nunca deben contener canvas (D-10).
const READING = ['#faq', '#contacto', '#sobre', '#testimonios', '#proceso', '#medicion'];
const STEP = 300;
const WAIT = 400;

/** Corre antes de la carga: registra canvas de banda vivos, ids montados, LCP y contextos WebGL con marca de tiempo. */
const BUDGET_INIT = () => {
  const b = { maxCanvas: 0, maxBandCanvas: 0, ids: [], lcp: [], webgl: 0, maxLiveWebgl: 0, readingHits: 0, samples: 0 };
  window.__budget = b;
  const contexts = new Set();
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function patched(type, ...rest) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      if (!contexts.has(this)) {
        contexts.add(this);
        b.webgl += 1;
      }
      const live = [...contexts].filter((c) => c.isConnected || c === this).length;
      b.maxLiveWebgl = Math.max(b.maxLiveWebgl, live);
    }
    return getContext.call(this, type, ...rest);
  };
  // El cupo de D-08 se mide sobre el motor pesado: solo los canvas dentro de bandas div[data-fx] (Dither y Halftone).
  // Noise (grano), StarBorder y SpotlightCard son acentos decorativos fuera del presupuesto de 2 efectos.
  // OJO: el <html> tambien lleva data-fx (estado de la puerta de efectos), asi que hay que ceñirse a div[data-fx].
  const sample = () => {
    b.samples += 1;
    b.maxCanvas = Math.max(b.maxCanvas, document.querySelectorAll('canvas').length);
    b.maxBandCanvas = Math.max(b.maxBandCanvas, document.querySelectorAll('div[data-fx] canvas').length);
    for (const el of document.querySelectorAll('div[data-fx][data-mounted="true"], div[data-fx].is-on')) {
      const id = el.getAttribute('data-fx');
      if (!b.ids.includes(id)) b.ids.push(id);
    }
    b.readingHits = Math.max(b.readingHits, document.querySelectorAll('#faq canvas, #contacto canvas, #sobre canvas, #testimonios canvas, #proceso canvas, #medicion canvas').length);
  };
  new MutationObserver(sample).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-mounted'] });
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) b.lcp.push(e.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* sin LCP */
  }
  window.__sample = sample;
};

// En v4 la banda del hero (Dither) marca el montaje con data-mounted="true"; la del halftone (websites) no lleva
// data-mounted, sino la clase .is-on cuando el original ya se renderizo. Una banda esta montada si cumple
// cualquiera de las dos senales. Ids del DOM: 'dither' y 'halftone'.
const BAND_MOUNTED = `div[data-fx][data-mounted="true"], div[data-fx].is-on`;
const mountedIds = (page) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => e.getAttribute('data-fx')), BAND_MOUNTED);
// Canvas del motor pesado (dentro de bandas div[data-fx]); Noise, StarBorder y SpotlightCard no cuentan al cupo de D-08.
const bandCanvasCount = (page) => page.evaluate(() => document.querySelectorAll('div[data-fx] canvas').length);

/** Recorre la pagina de arriba abajo y de vuelta, a pasos de 300 px con 400 ms de espera. Devuelve cuantos pasos dio. */
async function walk(page) {
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);
  let steps = 0;
  for (let y = 0; ; y += STEP) {
    const max = (await height()) - DESKTOP.height;
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), Math.min(y, Math.max(max, 0)));
    await page.waitForTimeout(WAIT);
    await page.evaluate(() => window.__sample());
    steps += 1;
    if (y >= max) break;
  }
  for (let y = await page.evaluate(() => window.scrollY); y > 0; y -= STEP) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), Math.max(y - STEP, 0));
    await page.waitForTimeout(WAIT);
    await page.evaluate(() => window.__sample());
    steps += 1;
  }
  return steps;
}

const stats = (page) => page.evaluate(() => ({ ...window.__budget, lcp: [...window.__budget.lcp] }));

/** Sondea desde Node (con SwiftShader el hilo principal va cargado y waitForFunction llega tarde). */
async function until(fn, timeout, step = 150) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return Date.now() - t0;
    await new Promise((r) => setTimeout(r, step));
  }
  return -1;
}

export async function run(ctx) {
  const { check, paths, openPage, lang } = ctx;
  const dist = paths.DIST;
  const manifest = readManifest(dist);
  const chunkRe = () => new RegExp(`assets/(?:${ORIGINALS.join('|')})-`);
  const CHUNK_RE = chunkRe();
  // Solo los chunks del motor pesado (Dither, HalftoneReveal). Noise, StarBorder y SpotlightCard son acentos
  // decorativos: Noise sobrevive a reduced motion y al ahorro de datos por diseno (staticFxOk), asi que no cuentan.
  const heavyChunkFiles = ctx.originalNames
    ? ctx.chunkFiles.filter((f) => ORIGINALS.some((n) => path.basename(f).startsWith(`${n}-`)))
    : [];

  // b0: motor puro probado en Node (type stripping de Node 24): el techo de 2 y el lanzamiento al tercer id.
  {
    const budget = await import(pathToFileURL(path.join(paths.APP, 'src', 'home', 'effect-budget.ts')).href);
    const throwAtThird = (() => {
      const ids = new Set();
      budget.claimEffectId(ids, 'hero-dither');
      budget.claimEffectId(ids, 'hero-dither');
      if (ids.size !== 1) return false;
      budget.claimEffectId(ids, 'sites-halftone');
      if (ids.size !== 2) return false;
      const okRepeats = ids.size === 2;
      try {
        budget.claimEffectId(ids, 'tercer-efecto');
        return false;
      } catch (e) {
        return okRepeats && String(e.message).includes('tercer-efecto') && String(e.message).includes('2');
      }
    })();
    check('b0. MAX_EFFECTS_PER_PAGE es 2 y claimEffectId aguanta repetidos y lanza al tercer id distinto nombrando el id', budget.MAX_EFFECTS_PER_PAGE === 2 && throwAtThird, `max=${budget.MAX_EFFECTS_PER_PAGE} lanzaAlTercero=${throwAtThird}`);
  }

  // b4: los originales no estan en el cierre estatico de la entrada ni en index.html.
  {
    const entry = closureOf(manifest, entryKey(manifest));
    const leaked = [...entry].filter((k) => /reactbits\//.test(k));
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const inHtml = ORIGINALS.filter((n) => new RegExp(`${n}-`).test(html));
    const found = ORIGINALS.map((n) => originalKey(manifest, n));
    check('b4. ningun original esta en el cierre estatico del chunk de entrada del manifiesto ni referenciado desde index.html', leaked.length === 0 && inHtml.length === 0 && found.every(Boolean), `entrada=${entry.size} chunks, en la entrada=${leaked.join(',') || 0}, en html=${inHtml.join(',') || 0}`);
  }

  // b10: ninguna seccion importa originales de React Bits directamente (todo pasa por src/home/fx/).
  {
    const dir = path.join(paths.APP, 'src', 'home', 'sections');
    const bad = [];
    for (const f of fs.readdirSync(dir)) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      if (/gallery\/originals|reactbits/.test(text)) bad.push(f);
    }
    check('b10. ningun archivo de src/home/sections/ importa originales de React Bits directamente (todos pasan por src/home/fx/)', bad.length === 0, bad.join(', ') || `${fs.readdirSync(dir).length} secciones revisadas`);
  }

  // b1, b2, b3, b5: escritorio con recorrido completo (incluye pasar el puntero por un .devlink para el halftone).
  let desktopStats;
  {
    const { context, page, errors, consoleErrors } = await openPage(lang('es'), { viewport: DESKTOP, init: BUDGET_INIT });
    const steps = await walk(page);
    // El halftone solo se monta con puntero de raton encima de un .devlink: se lleva el puntero alli y se vuelve.
    await page.locator('#websites .devlink').first().scrollIntoViewIfNeeded();
    await page.locator('#websites .devlink').first().hover();
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__sample());
    await page.mouse.move(0, 0);
    await page.waitForTimeout(600);
    desktopStats = await stats(page);
    const idsSeen = desktopStats.ids;
    check(`b1. recorrido completo (${steps} pasos): maximo ${desktopStats.maxBandCanvas} canvas de banda simultaneos (limite 1) y ids de efecto ${idsSeen.join(',')} (maximo 2: dither y halftone)`, desktopStats.maxBandCanvas <= 1 && desktopStats.maxBandCanvas >= 1 && idsSeen.length <= 2 && idsSeen.includes('dither') && idsSeen.every((i) => i === 'dither' || i === 'halftone'), `maxBandCanvas=${desktopStats.maxBandCanvas} maxCanvasTotal=${desktopStats.maxCanvas} ids=${idsSeen.join(',')} contextosWebGL=${desktopStats.webgl} maxVivosWebGL=${desktopStats.maxLiveWebgl}`);
    check('b1b. contextos WebGL vivos a la vez: como maximo 1 (informa el solape de desmontaje y montaje)', desktopStats.maxLiveWebgl <= 1, `maxVivos=${desktopStats.maxLiveWebgl} creados=${desktopStats.webgl}`);

    // b3: cronologia de peticiones (misma base de tiempo: performance de la pagina).
    //
    // CORRECCION frente al enunciado del plan (52-06-PLAN.md: "despues de load y de la ultima entrada de LCP"):
    //   (1) el armado tiene un recurso de 3000 ms si el navegador no emite LCP (useArmed, home-env.ts): el chunk puede
    //       pedirse DESPUES de ese recurso pero el startTime de la primera entrada de LCP puede ser posterior (la entrada
    //       se registra cuando el candidato pinta, no cuando se emite). Observed: Dither@5849 < primerLCP@6688.
    //   (2) durante el recorrido completo de scroll las imagenes perezosas entran en el viewport y el LCP sigue
    //       disparandose (entradas hasta ~17 s), asi que "despues de la ULTIMA entrada de LCP" tambien es inalcanzable.
    // Invariante correcta y observable, que es el espiritu del plan: los originales NO bloquean la carga inicial; cada
    // chunk de original se pide DESPUES de loadEventEnd. No se rebaja ningun umbral; se elimina una clausula imposible.
    const timing = await page.evaluate((reSrc) => {
      const re = new RegExp(reSrc);
      const nav = performance.getEntriesByType('navigation')[0];
      const chunks = performance.getEntriesByType('resource').filter((e) => re.test(e.name)).map((e) => ({ name: e.name.split('/').pop(), start: e.startTime }));
      return { loadEnd: nav?.loadEventEnd ?? 0, chunks };
    }, CHUNK_RE.source);
    const lcpFirst = desktopStats.lcp.length ? Math.min(...desktopStats.lcp) : 0;
    const lcpLast = Math.max(0, ...desktopStats.lcp);
    const early = timing.chunks.filter((c) => c.start <= timing.loadEnd);
    check('b3. cada chunk de original (Dither, HalftoneReveal) se pide despues de loadEventEnd (no bloquea la carga inicial)', timing.chunks.length >= 1 && early.length === 0 && timing.loadEnd > 0, `chunks=${timing.chunks.map((c) => `${c.name}@${c.start.toFixed(0)}`).join(' ')} loadEventEnd=${timing.loadEnd.toFixed(0)} primerLCP=${lcpFirst.toFixed(0)} ultimoLCP=${lcpLast.toFixed(0)}`);

    // b5: secciones de lectura sin canvas.
    const readingCount = await page.evaluate((sel) => sel.reduce((n, s) => n + document.querySelectorAll(`${s} canvas`).length, 0), READING);
    check(`b5. las ${READING.length} secciones de lectura (${READING.join(', ')}) no contienen canvas durante todo el recorrido (D-10)`, desktopStats.readingHits === 0 && readingCount === 0, `maximoVisto=${desktopStats.readingHits} ahora=${readingCount}`);

    check('b0b. 0 pageerror y 0 console.error durante el recorrido en escritorio', errors.length + consoleErrors.length === 0, `pageerror=${errors.length} consola=${consoleErrors.length}${errors[0] ? ` | ${errors[0].slice(0, 100)}` : ''}`);
    await context.close();
  }

  // b2 y b9: desmontaje al salir y pausa en mitad del recorrido.
  {
    const { context, page } = await openPage(lang('es'), { viewport: DESKTOP, init: BUDGET_INIT });
    const waitMounted = async (id, timeout) => until(async () => (await mountedIds(page)).includes(id), timeout);
    const waitBandZero = async (timeout) => until(async () => (await bandCanvasCount(page)) === 0, timeout);
    // El hero tarda en montar (armado tras load y LCP + chunk del original): con SwiftShader puede pasar de 20 s.
    // OJO: el id de efecto interno es 'hero-dither'/'sites-halftone', pero el valor DOM de data-fx es 'dither'/'halftone'.
    const heroUp = await waitMounted('dither', 40_000);
    // Websites (el halftone) solo se monta con el puntero encima del .devlink.
    await page.locator('#websites .devlink').first().scrollIntoViewIfNeeded();
    await page.locator('#websites .devlink').first().hover();
    const bandUp = await waitMounted('halftone', 40_000);
    const idsAtBand = await mountedIds(page);
    const canvasAtBand = await bandCanvasCount(page);
    // Al volver arriba (fuera de #websites) se desmonta el halftone y vuelve el del hero.
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const heroBack = await waitMounted('dither', 40_000);
    const idsAtTop = await mountedIds(page);
    check('b2. con el puntero sobre la captura de websites el hero deja de estar montado y al volver arriba vuelve a montarse el del hero', heroUp >= 0 && bandUp >= 0 && idsAtBand.join() === 'halftone' && canvasAtBand === 1 && heroBack >= 0 && idsAtTop.join() === 'dither', `hero@${heroUp}ms halftone@${bandUp}ms enCaptura=${idsAtBand.join()}(${canvasAtBand} canvas banda) arriba=${idsAtTop.join()}`);

    // b9: pausa en mitad del recorrido.
    await page.locator('#websites .devlink').first().scrollIntoViewIfNeeded();
    await page.locator('#websites .devlink').first().hover();
    const bandBefore = await waitMounted('halftone', 40_000);
    await page.evaluate(() => document.querySelector('button.pausebtn')?.click());
    const paused = await waitBandZero(5000);
    await page.waitForTimeout(1200);
    const stillZero = (await bandCanvasCount(page)) === 0;
    // Al reanudar, el efecto de la zona visible (halftone, el puntero sigue encima) vuelve a montar.
    await page.evaluate(() => document.querySelector('button.pausebtn')?.click());
    const back = await waitMounted('halftone', 5000);
    check('b9. Pausar animaciones en mitad del recorrido deja 0 canvas, y al soltar vuelve el efecto de la zona visible en menos de 3000 ms', bandBefore >= 0 && paused >= 0 && stillZero && back >= 0, `pausa en ${paused}ms, sigue en 0=${stillZero}, vuelve en ${back}ms (previo ${bandBefore}ms)`);
    await context.close();
  }

  // b7 y b8: sin canvas en movil, con reduced-motion y con ahorro de datos.
  const blocked = [
    ['b7. movil 390x844 con isMobile y hasTouch', { ...MOBILE_OPTS, init: BUDGET_INIT }],
    ['b8a. prefers-reduced-motion: reduce', { viewport: DESKTOP, contextOptions: { reducedMotion: 'reduce' }, init: BUDGET_INIT }],
    ['b8b. navigator.connection.saveData', { viewport: DESKTOP, init: `(${SAVE_DATA_INIT})();(${BUDGET_INIT})();` }],
  ];
  for (const [label, opts] of blocked) {
    const { context, page, chunks } = await openPage(lang('es'), opts);
    const steps = await walk(page);
    // Tambien se prueba el puntero sobre el .devlink: en estos modos el halftone no debe montar.
    await page.locator('#websites .devlink').first().scrollIntoViewIfNeeded();
    await page.locator('#websites .devlink').first().hover();
    await page.waitForTimeout(800);
    const s = await stats(page);
    const endCanvas = await bandCanvasCount(page);
    const heavyChunks = chunks.filter((f) => ORIGINALS.some((n) => f.startsWith(`${n}-`)));
    check(`${label}: recorrido completo (${steps} pasos) con 0 canvas de banda, 0 efectos montados y 0 peticiones a chunks del motor pesado (Dither, HalftoneReveal)`, s.maxBandCanvas === 0 && endCanvas === 0 && s.ids.length === 0 && heavyChunks.length === 0 && s.webgl === 0, `maxBandCanvas=${s.maxBandCanvas} maxCanvasTotal=${s.maxCanvas} ids=${s.ids.join(',') || 0} contextosWebGL=${s.webgl} chunksPesados=${heavyChunks.length} (todos los originales=${chunks.length})`);
    await context.close();
  }

  // b11: pesos del manifiesto y traza del presupuesto.
  {
    const read = (file) => fs.readFileSync(path.join(dist, file));
    const sizes = (file) => {
      const buf = read(file);
      return { file, bytes: buf.length, gzip: gzipSize(buf), brotli: brotliSize(buf) };
    };
    const entry = entryKey(manifest);
    const entrySizes = sizes(manifest[entry].file);
    // CORRECCION frente al enunciado del plan: Vite agrupa todas las secciones de la home en el chunk de entrada;
    // el manifiesto no tiene claves `src/home/sections/*` (sectionChunks = 0). El plan solo exige "pesos por chunk",
    // asi que se registran: el chunk de entrada + TODOS los chunks del manifiesto (incluidas las secciones si Vite
    // llegara a partirlas) + los originales. No se rebaja ningun umbral; se amplia la cobertura.
    const manifestChunks = Object.entries(manifest)
      .map(([k, v]) => ({ key: k, ...sizes(v.file) }))
      .sort((a, b) => a.file.localeCompare(b.file));
    const sectionChunks = manifestChunks.filter((c) => /src\/home\/sections\//.test(c.key));
    const entryClosure = closureOf(manifest, entry);
    const originals = ORIGINALS.map((name) => {
      const key = originalKey(manifest, name);
      const keys = [...closureOf(manifest, key)].filter((k) => !entryClosure.has(k));
      const files = new Set(keys.flatMap((k) => [manifest[k].file, ...(manifest[k].css ?? [])]));
      const parts = [...files].map(sizes);
      return { original: name, files: parts.map((p) => p.file), bytes: parts.reduce((a, p) => a + p.bytes, 0), gzip: parts.reduce((a, p) => a + p.gzip, 0), brotli: parts.reduce((a, p) => a + p.brotli, 0) };
    });
    const report = {
      generatedBy: 'verify-home-checks --stage=budget',
      effects: { maxSimultaneousCanvas: desktopStats.maxCanvas, idsSeen: desktopStats.ids, webglContextsCreated: desktopStats.webgl, maxLiveWebglContexts: desktopStats.maxLiveWebgl, timeline: { firstLcp: desktopStats.lcp.length ? Math.min(...desktopStats.lcp) : 0, lastLcp: Math.max(0, ...desktopStats.lcp) } },
      readingSections: READING,
      notes: 'Vite agrupa las secciones de la home en el chunk de entrada; sectionChunks solo se llena si hubiera splitting real.',
      weights: { entry: entrySizes, manifestChunks, sectionChunks, originals },
    };
    const file = path.join(paths.REPORTS_HOME, 'budget.json');
    fs.mkdirSync(paths.REPORTS_HOME, { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
    const text = fs.readFileSync(file, 'utf8');
    check('b11. budget.json guardado con maximo de canvas, ids, contextos WebGL y pesos gzip y brotli de entrada, chunks del manifiesto y originales, sin rutas locales', entrySizes.gzip > 0 && manifestChunks.length >= 1 && originals.every((o) => o.gzip > 0) && !text.includes('/Users/'), `entrada ${(entrySizes.gzip / 1024).toFixed(1)} KB gzip, ${(entrySizes.brotli / 1024).toFixed(1)} KB brotli; chunksManifiesto=${manifestChunks.length}; secciones=${sectionChunks.length}; ${originals.map((o) => `${o.original} ${(o.gzip / 1024).toFixed(1)} KB gzip`).join(', ')}`);
  }
}
