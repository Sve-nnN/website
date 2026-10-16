#!/usr/bin/env node
/*
 * verify-app.mjs: harness Playwright de la app de mockups (fase 51.1).
 *
 * Uso:
 *   node scripts/verify-app.mjs --stage=tracer|gallery|report|readme|all [--shots]
 *
 * Cada stage es una funcion registrada en STAGES. Imprime una linea PASS o FAIL por chequeo.
 * Salida: 0 todo PASS, 1 algun FAIL, 2 stage inexistente, falta Playwright o falta dist/.
 * Los planes siguientes agregan stages y nunca debilitan un chequeo existente.
 *
 * Playwright se resuelve desde el node_modules del repositorio principal (ancestros); no se instala
 * en la app. El build se sirve con un servidor estatico propio en 127.0.0.1.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { sha256, splitOrigin } from './lib/origin-header.mjs';
import { buildSha256 } from './lib/manifest.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const SHOTS = path.join(APP, 'reports', 'shots');
const CHROMIUM_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

let failures = 0;
let passes = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` | ${detail}` : ''}`);
  if (ok) passes += 1;
  else failures += 1;
  return ok;
}

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

/* ---------- argumentos ---------- */

const argv = process.argv.slice(2);
const stageArg = (argv.find((a) => a.startsWith('--stage=')) ?? '--stage=all').slice('--stage='.length);
const wantShots = argv.includes('--shots');

/* ---------- utilidades ---------- */

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

async function waitFor200(url, timeoutMs = 30_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status === 200) return true;
    } catch {
      /* el servidor todavia no escucha */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    die(2, 'verify-app: no se resuelve Playwright desde los ancestros de la app. Instala playwright en el repo principal o ajusta NODE_PATH.');
  }
}

function requireDist() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    die(2, 'verify-app: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
  }
}

/** Registro acumulado de todas las paginas abiertas por el stage en curso (chequeo p del stage gallery). */
const RUN_LOG = { console: [], pageerrors: [], external: [], requests: 0 };

/** Abre una pagina registrando consola, errores de pagina y peticiones. */
async function openPage(browser, url, { viewport = { width: 1440, height: 900 }, contextOptions = {}, init } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const log = { console: [], pageerrors: [], requests: [], external: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') {
      log.console.push(m.text());
      RUN_LOG.console.push(m.text());
    }
  });
  page.on('pageerror', (e) => {
    log.pageerrors.push(String(e));
    RUN_LOG.pageerrors.push(String(e));
  });
  page.on('request', (r) => {
    const u = new URL(r.url());
    log.requests.push(r.url());
    RUN_LOG.requests += 1;
    if (!['data:', 'blob:', 'about:'].includes(u.protocol) && u.hostname !== '127.0.0.1') {
      log.external.push(r.url());
      RUN_LOG.external.push(r.url());
    }
  });
  await page.goto(url, { waitUntil: 'load' });
  return { context, page, log };
}

/* ---------- stage: tracer ---------- */

async function stageTracer({ chromium }) {
  const manifestPath = path.join(DIST, '.vite', 'manifest.json');

  // (a)
  const hasIndex = fs.existsSync(path.join(DIST, 'index.html'));
  const hasManifest = fs.existsSync(manifestPath);
  check('a. dist/index.html y dist/.vite/manifest.json existen', hasIndex && hasManifest);
  if (!hasManifest) return;

  // (b)
  const vite = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const key = 'src/components/reactbits/Grainient/Grainient.tsx';
  const original = vite[key];
  const entryKey = Object.keys(vite).find((k) => vite[k].isEntry);
  const closure = new Set();
  const walk = (k) => {
    if (!k || closure.has(k) || !vite[k]) return;
    closure.add(k);
    for (const i of vite[k].imports ?? []) walk(i);
  };
  walk(entryKey);
  check(
    'b. el manifiesto de Vite tiene Grainient como entrada dinamica y fuera del cierre estatico del chunk de entrada',
    Boolean(original?.isDynamicEntry) && !closure.has(key) && Boolean(entryKey),
    `dinamica=${Boolean(original?.isDynamicEntry)} enCierreEstatico=${closure.has(key)}`,
  );

  // (c)
  const rbManifest = JSON.parse(fs.readFileSync(path.join(APP, 'reactbits.manifest.json'), 'utf8'));
  const entry = rbManifest.components.find((c) => c.name === 'Grainient');
  const tsxFile = entry?.files.find((f) => f.path.endsWith('.tsx'));
  let headerOk = false;
  let headerDetail = 'sin entrada en reactbits.manifest.json';
  if (tsxFile) {
    const disk = path.join(APP, 'src', 'components', 'reactbits', tsxFile.path);
    if (fs.existsSync(disk)) {
      const text = fs.readFileSync(disk, 'utf8');
      const { header, body } = splitOrigin(text);
      headerOk = Boolean(header) && header['sha256-body'] === tsxFile.sha256Body && sha256(body) === tsxFile.sha256Body;
      headerDetail = headerOk ? `sha256 ${tsxFile.sha256Body.slice(0, 12)}` : 'cabecera ausente o hash distinto';
    } else headerDetail = 'falta el archivo en disco';
  }
  check('c. Grainient.tsx abre con @reactbits-origin y el sha256 del cuerpo coincide con el manifiesto', headerOk, headerDetail);

  // (d)
  let devOk = false;
  let fsOk = false;
  let devDetail = '';
  const port = await freePort();
  const viteBin = path.join(APP, 'node_modules', '.bin', 'vite');
  const dev = spawn(process.execPath, [viteBin, '--port', String(port), '--host', '127.0.0.1', '--strictPort'], {
    cwd: APP,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let devLog = '';
  dev.stdout.on('data', (d) => (devLog += d));
  dev.stderr.on('data', (d) => (devLog += d));
  try {
    const base = `http://127.0.0.1:${port}`;
    devOk = await waitFor200(`${base}/system`);
    if (devOk) {
      const main = await (await fetch(`${base}/src/main.tsx`)).text();
      const m = /["'](\/@fs\/[^"']*assets\/css\/tokens\.css)["']/.exec(main);
      if (m) {
        const res = await fetch(`${base}${m[1]}`);
        fsOk = res.status === 200;
        devDetail = `${m[1]} -> ${res.status}`;
      } else devDetail = 'main.tsx no referencia tokens.css por /@fs/';
    } else devDetail = `vite dev no respondio 200 en /system: ${devLog.slice(-300)}`;
  } finally {
    dev.kill('SIGTERM');
  }
  check('d1. vite dev en puerto libre responde 200 a /system', devOk, `puerto ${port}`);
  check('d2. la URL /@fs/ de tokens.css que aparece en /src/main.tsx responde 200', fsOk, devDetail);

  // (e) a (h) sobre el build servido
  const server = await startStaticServer({ root: DIST, compress: true });
  const browser = await chromium.launch({ args: CHROMIUM_ARGS });
  try {
    const { context, page, log } = await openPage(browser, `${server.url}/system`);
    const card = page.locator('article[data-effect="grainient"]');
    await card.waitFor({ state: 'visible', timeout: 10_000 });

    const h1 = await page.locator('h1').count();
    const fx = await card.locator('.fx-grain').count();
    const canvasBefore = await page.locator('canvas').count();
    const chunkBefore = log.requests.filter((u) => u.includes('assets/Grainient-')).length;
    check(
      'e. 1440 px: un solo h1, existe .fx-grain, 0 canvas y 0 peticiones a assets/Grainient- antes del clic',
      h1 === 1 && fx >= 1 && canvasBefore === 0 && chunkBefore === 0,
      `h1=${h1} fx-grain=${fx} canvas=${canvasBefore} chunk=${chunkBefore}`,
    );

    await card.locator('button[data-toggle]').click();
    let mounted = false;
    try {
      await page.waitForSelector('article[data-effect="grainient"][data-mounted="true"]', { timeout: 6000 });
      mounted = true;
    } catch {
      /* se reporta abajo */
    }
    const canvasInStage = await card.locator('.stage canvas').count();
    const chunkAfter = log.requests.filter((u) => u.includes('assets/Grainient-')).length;
    check(
      'f. tras el clic: data-mounted=true en 6 s, 1 canvas en el escenario y peticion del chunk',
      mounted && canvasInStage === 1 && chunkAfter > 0,
      `mounted=${mounted} canvas=${canvasInStage} peticionesChunk=${chunkAfter}`,
    );

    // (g) los tres valores mostrados son los de tokens.css
    const shown = await card.locator('dd[data-prop="colors"] code').allTextContents();
    const expected = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ['--violet', '--coral', '--amber'].map((v) => s.getPropertyValue(v).trim());
    });
    const same =
      shown.length === 3 && expected.every((v, i) => v !== '' && v.toLowerCase() === (shown[i] ?? '').trim().toLowerCase());
    check('g. dd[data-prop="colors"] coincide con --violet, --coral y --amber', same, `mostrado=${shown.join(',')} esperado=${expected.join(',')}`);

    if (wantShots) {
      await page.waitForTimeout(2200);
      await page.evaluate(() => window.scrollTo(0, 0));
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, 'tracer-desktop.jpg'), type: 'jpeg', quality: 82, fullPage: true });
      console.log(`INFO captura ${path.relative(APP, path.join(SHOTS, 'tracer-desktop.jpg'))}`);
    }

    // (h)
    check(
      'h. cero errores de consola, cero pageerror y cero peticiones fuera de 127.0.0.1',
      log.console.length === 0 && log.pageerrors.length === 0 && log.external.length === 0,
      `consola=${log.console.length} pageerror=${log.pageerrors.length} externas=${log.external.length}` +
        (log.console[0] ? ` primero=${log.console[0].slice(0, 120)}` : ''),
    );
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

/* ---------- stage: gallery ---------- */

const ORIGINALS = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8'));
const TOOLS_CATALOG = JSON.parse(fs.readFileSync(path.join(APP, '..', 'tools', 'catalog.json'), 'utf8'));
// Originales cuya interfaz de props incluye dpr (regla comun de DPR de la fase 51).
const DPR_ORIGINALS = ['Grainient', 'CRTWarp', 'Dither', 'FaultyTerminal', 'GradientASCII', 'GradientBlinds', 'PixelBlast'];
const BLOCKED_TEXT = {
  paused: 'Animaciones en pausa: muestro solo el fallback.',
  reduced: 'Tu sistema pide menos movimiento: muestro solo el fallback.',
  saver: 'Ahorro de datos activo: muestro solo el fallback.',
};

/** Archivos de chunk de los originales segun el manifiesto de Vite (js, css y chunks compartidos de su cierre). */
function originalChunkFiles() {
  const vite = JSON.parse(fs.readFileSync(path.join(DIST, '.vite', 'manifest.json'), 'utf8'));
  const entryKey = Object.keys(vite).find((k) => vite[k].isEntry);
  const base = new Set();
  const walk = (k, into) => {
    if (!k || into.has(k) || !vite[k]) return;
    into.add(k);
    for (const i of vite[k].imports ?? []) walk(i, into);
  };
  walk(entryKey, base);
  const files = new Set();
  for (const k of Object.keys(vite)) {
    if (!/^src\/components\/reactbits\//.test(k)) continue;
    const closure = new Set();
    walk(k, closure);
    for (const c of closure) {
      if (base.has(c)) continue;
      files.add(vite[c].file);
      for (const css of vite[c].css ?? []) files.add(css);
    }
  }
  return [...files];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cardSel = (name) => `article[data-effect="${name.toLowerCase()}"]`;

async function mountedNames(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('article[data-effect][data-mounted="true"]')].map((a) => a.getAttribute('data-effect')),
  );
}

async function waitMounted(page, name, timeout) {
  try {
    await page.waitForSelector(`${cardSel(name)}[data-mounted="true"]`, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function stageGallery({ chromium }) {
  const chunkFiles = originalChunkFiles();
  const isChunkUrl = (u) => chunkFiles.some((f) => u.endsWith(f));
  const server = await startStaticServer({ root: DIST, compress: true });
  const browser = await chromium.launch({ args: CHROMIUM_ARGS });
  const url = `${server.url}/system`;
  const expectedNames = ORIGINALS.map((o) => o.name);
  try {
    /* (a), (b), (c), (d), (n) y (m) sobre la carga inicial */
    {
      const { context, page, log } = await openPage(browser, url);
      await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      await sleep(2500);

      const names = await page.evaluate(() => [...document.querySelectorAll('article[data-effect]')].map((a) => a.getAttribute('data-effect')));
      const expectedSlugs = expectedNames.map((n) => n.toLowerCase());
      check('a. 16 article[data-effect] con los nombres de scripts/originals.json', names.length === 16 && expectedSlugs.every((n) => names.includes(n)) && new Set(names).size === 16, `n=${names.length}`);

      const meta = await page.evaluate(() =>
        [...document.querySelectorAll('article[data-effect]')].map((a) => ({
          slug: a.getAttribute('data-effect'),
          title: a.querySelector('h3')?.textContent ?? '',
          origin: a.querySelector('[data-origin]')?.textContent ?? '',
          docs: a.querySelector('a[data-docs]')?.getAttribute('href') ?? '',
          fallbacks: a.querySelectorAll('[data-fallback]').length,
          dts: a.querySelectorAll('dl[data-props] dt').length,
          pressed: a.querySelector('button[data-toggle]')?.getAttribute('aria-pressed') ?? null,
        })),
      );
      const bad = [];
      for (const m of meta) {
        const o = ORIGINALS.find((x) => x.name.toLowerCase() === m.slug);
        const row = TOOLS_CATALOG.rows.find((r) => r.id === o?.catalogId);
        if (/[.,:;]/.test(m.title)) bad.push(`${m.slug}: titulo con puntuacion`);
        if (!row) bad.push(`${m.slug}: sin fila en tools/catalog.json`);
        else {
          if (m.origin !== `Origen: ${row.name}, React Bits, ${row.category}.`) bad.push(`${m.slug}: origen "${m.origin}"`);
          if (m.docs !== row.url) bad.push(`${m.slug}: url ${m.docs}`);
        }
      }
      check('b. titulos sin . , : ;, y origen, categoria y URL iguales a tools/catalog.json', bad.length === 0 && meta.length === 16, bad.slice(0, 3).join(' | '));
      const badC = meta.filter((m) => m.fallbacks !== 1 || m.dts < 2 || m.pressed !== 'false').map((m) => m.slug);
      check('c. cada tarjeta tiene un [data-fallback], al menos 2 dt y button[data-toggle] aria-pressed=false', badC.length === 0, badC.join(','));

      const canvases = await page.locator('canvas').count();
      const mounted = (await mountedNames(page)).length;
      const early = log.requests.filter(isChunkUrl).length;
      check('d. tras load y 2.5 s: 0 canvas, 0 montadas y 0 peticiones a chunks de originales', canvases === 0 && mounted === 0 && early === 0, `canvas=${canvases} montadas=${mounted} chunks=${early}`);

      // (n) accesibilidad estructural
      const a11y = await page.evaluate(() => {
        const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
        let skips = 0;
        for (let i = 1; i < levels.length; i += 1) if (levels[i] > levels[i - 1] + 1) skips += 1;
        const unnamed = [...document.querySelectorAll('button')].filter((b) => !(b.getAttribute('aria-label') || b.textContent || '').trim()).length;
        return {
          h1: document.querySelectorAll('h1').length,
          header: document.querySelectorAll('header').length,
          main: document.querySelectorAll('main').length,
          footer: document.querySelectorAll('footer').length,
          status: document.querySelectorAll('[role="status"]').length,
          skips,
          unnamed,
          firstLevel: levels[0],
        };
      });
      check(
        'n. un h1, header, main, footer, region role=status, botones con nombre accesible y encabezados sin saltos',
        a11y.h1 === 1 && a11y.header >= 1 && a11y.main === 1 && a11y.footer >= 1 && a11y.status >= 1 && a11y.skips === 0 && a11y.unnamed === 0 && a11y.firstLevel === 1,
        JSON.stringify(a11y),
      );

      // (m) tokens y DPR
      const tokens = await page.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        return ['--violet', '--coral', '--amber'].map((v) => s.getPropertyValue(v).trim());
      });
      const shownColors = await page.locator(`${cardSel('Grainient')} dd[data-prop="colors"] code`).allTextContents();
      const colorsOk = shownColors.length === 3 && tokens.every((t, i) => t && t.toLowerCase() === shownColors[i].trim().toLowerCase());
      const dprs = await page.evaluate(() =>
        [...document.querySelectorAll('article[data-effect]')].map((a) => ({
          slug: a.getAttribute('data-effect'),
          dpr: a.querySelector('dd[data-prop="dpr"]')?.textContent?.trim() ?? null,
        })),
      );
      const dprBad = dprs.filter((d) => {
        const has = DPR_ORIGINALS.some((n) => n.toLowerCase() === d.slug);
        return has ? d.dpr !== '1.5' : d.dpr !== null;
      });
      const galleryDir = path.join(APP, 'src', 'gallery');
      const hexRe = /#[0-9a-fA-F]{3,8}\b/;
      const hexFiles = fs
        .readdirSync(galleryDir)
        .filter((f) => /\.(ts|tsx)$/.test(f))
        .filter((f) => hexRe.test(fs.readFileSync(path.join(galleryDir, f), 'utf8')));
      check(
        'm. colors de Grainient = --violet, --coral, --amber; dpr 1.5 solo en los 7 que lo aceptan; sin literales hexadecimales en src/gallery',
        colorsOk && dprBad.length === 0 && hexFiles.length === 0,
        `colores=${colorsOk} dprMal=${dprBad.map((d) => d.slug).join(',')} hex=${hexFiles.join(',')}`,
      );
      await context.close();
    }

    /* (e) matriz de montaje, (f) cupo unico, (o) superficie de lectura, (g) salida del viewport */
    {
      const { context, page } = await openPage(browser, url);
      await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      const matrix = [];
      let allOk = true;
      const failing = [];
      for (const o of ORIGINALS) {
        const sel = cardSel(o.name);
        const card = page.locator(sel);
        const stage = card.locator('[data-stage]');
        await card.scrollIntoViewIfNeeded();
        await sleep(150);
        const errorsBefore = RUN_LOG.console.length + RUN_LOG.pageerrors.length;
        const heightBefore = (await stage.boundingBox())?.height ?? 0;
        const t0 = Date.now();
        await card.locator('button[data-toggle]').click();
        const mounted = await waitMounted(page, o.name, 8000);
        const durationMs = Date.now() - t0;
        await sleep(500);
        const count = (await mountedNames(page)).length;
        const canvases = await stage.locator('canvas').count();
        const heightAfter = (await stage.boundingBox())?.height ?? 0;
        const consoleErrors = RUN_LOG.console.length + RUN_LOG.pageerrors.length - errorsBefore;
        const expectCanvas = o.name === 'SpotlightCard' ? 0 : 1;
        // Desmontaje al volver a pulsar.
        await card.locator('button[data-toggle]').click();
        let unmounted = false;
        try {
          await page.waitForSelector(`${sel}[data-mounted="false"]`, { timeout: 3000 });
          unmounted = true;
        } catch {
          /* se reporta */
        }
        const canvasesAfterOff = await stage.locator('canvas').count();
        const row = { original: o.name, mounted, durationMs, mountedCount: count, canvases, expectCanvas, heightBefore, heightAfter, consoleErrors, unmounted, canvasesAfterOff };
        matrix.push(row);
        const ok =
          mounted && count === 1 && canvases === expectCanvas && Math.abs(heightAfter - heightBefore) <= 1 && consoleErrors === 0 && unmounted && canvasesAfterOff === 0;
        if (!ok) {
          allOk = false;
          failing.push(`${o.name}(${JSON.stringify(row)})`);
        }
      }
      fs.mkdirSync(path.join(APP, 'reports'), { recursive: true });
      fs.writeFileSync(
        path.join(APP, 'reports', 'mount-matrix.json'),
        JSON.stringify({ generatedAt: new Date().toISOString(), chromiumArgs: CHROMIUM_ARGS, rows: matrix }, null, 2) + '\n',
      );
      check('e. matriz de montaje: los 16 montan en 8 s, 1 sola montada, canvas esperado, escenario estable, 0 errores, desmontan', allOk, failing.slice(0, 2).join(' | '));

      // (f) cupo unico: A y luego B con ambas visibles.
      const A = 'Grainient';
      const B = 'PatternWaves';
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(200);
      await page.locator(`${cardSel(A)} button[data-toggle]`).click();
      await waitMounted(page, A, 8000);
      await page.locator(`${cardSel(B)} button[data-toggle]`).click();
      let maxMounted = 0;
      for (let i = 0; i < 15; i += 1) {
        maxMounted = Math.max(maxMounted, (await mountedNames(page)).length);
        await sleep(100);
      }
      const finalNames = await mountedNames(page);
      check('f. cupo unico: A y luego B deja una sola tarjeta montada durante 1.5 s', maxMounted <= 1 && finalNames.length === 1 && finalNames[0] === B.toLowerCase(), `max=${maxMounted} final=${finalNames.join(',')}`);

      // (o) superficie de lectura con un original montado
      const reading = await page.evaluate(() => {
        const s = document.querySelector('section[data-surface="reading"]');
        return s ? { canvas: s.querySelectorAll('canvas').length, buttons: s.querySelectorAll('button').length } : null;
      });
      const mountedNow = (await mountedNames(page)).length;
      check('o. section[data-surface="reading"] tiene 0 canvas y 0 botones con un original montado', reading !== null && reading.canvas === 0 && reading.buttons === 0 && mountedNow === 1, JSON.stringify(reading) + ` montadas=${mountedNow}`);

      // (g) salir del viewport libera el cupo
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(2000);
      const afterScroll = { mounted: (await mountedNames(page)).length, canvas: await page.locator('canvas').count() };
      check('g. al salir del viewport el activo se desmonta en 2 s (0 montadas, 0 canvas)', afterScroll.mounted === 0 && afterScroll.canvas === 0, JSON.stringify(afterScroll));
      await context.close();
    }

    /* (h) Pausar animaciones */
    {
      const { context, page } = await openPage(browser, url);
      await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      await page.locator(`${cardSel('Grainient')} button[data-toggle]`).click();
      await waitMounted(page, 'Grainient', 8000);
      await page.locator('button[data-pause]').click();
      await sleep(1200);
      const snap = async () =>
        page.evaluate(() => ({
          mounted: document.querySelectorAll('article[data-mounted="true"]').length,
          canvas: document.querySelectorAll('canvas').length,
          motion: document.documentElement.getAttribute('data-motion'),
          pressed: document.querySelector('button[data-pause]')?.getAttribute('aria-pressed'),
          disabled: [...document.querySelectorAll('button[data-toggle]')].every((b) => b.getAttribute('aria-disabled') === 'true'),
          anyDisabled: [...document.querySelectorAll('button[data-toggle]')].some((b) => b.getAttribute('aria-disabled') === 'true'),
          notice: document.querySelector('[data-blocked-reason]')?.textContent?.trim() ?? null,
        }));
      const paused = await snap();
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector('article[data-effect]');
      const afterReload = await snap();
      await page.locator('button[data-pause]').click();
      await sleep(300);
      const resumed = await snap();
      const hOk =
        paused.mounted === 0 && paused.canvas === 0 && paused.motion === 'reduced' && paused.pressed === 'true' && paused.disabled &&
        paused.notice === BLOCKED_TEXT.paused &&
        afterReload.motion === 'reduced' && afterReload.pressed === 'true' && afterReload.disabled &&
        resumed.motion === null && resumed.pressed === 'false' && !resumed.anyDisabled && resumed.notice === null;
      check('h. Pausar desmonta, pone data-motion=reduced, aria-pressed, aria-disabled, persiste al recargar y se revierte', hOk, JSON.stringify({ paused, afterReload, resumed }));
      await context.close();
    }

    /* (i) prefers-reduced-motion del sistema */
    {
      const { context, page } = await openPage(browser, url, { contextOptions: { reducedMotion: 'reduce' } });
      await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      const notice = (await page.locator('[data-blocked-reason]').first().textContent())?.trim();
      const visible = await page.locator('[data-blocked-reason]').first().isVisible();
      await page.locator(`${cardSel('Grainient')} button[data-toggle]`).click({ force: true });
      await sleep(1500);
      const mounted = (await mountedNames(page)).length;
      check('i. reducedMotion=reduce: aviso exacto visible y el clic no monta nada en 1.5 s', visible && notice === BLOCKED_TEXT.reduced && mounted === 0, `aviso="${notice}" montadas=${mounted}`);
      await context.close();
    }

    /* (j) saveData */
    {
      const init = () => {
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          value: { saveData: true, addEventListener() {}, removeEventListener() {} },
        });
      };
      const { context, page } = await openPage(browser, url, { init });
      await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      const notice = (await page.locator('[data-blocked-reason]').first().textContent())?.trim();
      await page.locator(`${cardSel('Grainient')} button[data-toggle]`).click({ force: true });
      await sleep(1500);
      const mounted = (await mountedNames(page)).length;
      check('j. saveData simulado: aviso exacto y el clic no monta nada en 1.5 s', notice === BLOCKED_TEXT.saver && mounted === 0, `aviso="${notice}" montadas=${mounted}`);
      await context.close();
    }

    /* (k) deep link con lista blanca */
    {
      const t0 = Date.now();
      const good = await openPage(browser, `${url}?mount=grainient`);
      const ok = await waitMounted(good.page, 'Grainient', 5000);
      const dt = Date.now() - t0;
      await good.context.close();
      const bad = await openPage(browser, `${url}?mount=inexistente`);
      await sleep(3000);
      const badMounted = (await mountedNames(bad.page)).length;
      const badErrors = bad.log.console.length + bad.log.pageerrors.length;
      await bad.context.close();
      const evil = await openPage(browser, `${url}?mount=${encodeURIComponent('"]><img src=x onerror=alert(1)>')}`);
      await sleep(1500);
      const evilMounted = (await mountedNames(evil.page)).length;
      const evilErrors = evil.log.console.length + evil.log.pageerrors.length;
      await evil.context.close();
      check(
        'k. ?mount=grainient monta en 5 s; ?mount=inexistente y un valor hostil no montan ni lanzan errores',
        ok && badMounted === 0 && badErrors === 0 && evilMounted === 0 && evilErrors === 0,
        `grainient=${ok} (${dt} ms) inexistente=${badMounted}/${badErrors} hostil=${evilMounted}/${evilErrors}`,
      );
    }

    /* (l) movil */
    {
      const { context, page } = await openPage(browser, url, { viewport: { width: 390, height: 844 } });
      await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      const m = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        small: [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height < 43.5).map((b) => b.textContent?.trim()),
      }));
      await context.close();
      const mob = await openPage(browser, url, { viewport: { width: 412, height: 823 } });
      await mob.page.waitForSelector('article[data-effect]', { timeout: 10_000 });
      const frac = await mob.page.evaluate((sel) => {
        const r = document.querySelector(`${sel} [data-stage]`).getBoundingClientRect();
        const visible = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
        return { top: Math.round(r.top), height: Math.round(r.height), fraction: visible / r.height };
      }, cardSel('Grainient'));
      if (wantShots) {
        fs.mkdirSync(SHOTS, { recursive: true });
        // La pagina completa en movil supera el limite de textura del captor: se guardan los primeros 6000 px.
        await mob.page.screenshot({
          path: path.join(SHOTS, 'gallery-mobile.jpg'),
          type: 'jpeg',
          quality: 70,
          fullPage: true,
          clip: { x: 0, y: 0, width: 412, height: 6000 },
        });
      }
      await mob.context.close();
      check('l. 390 px sin desborde y botones de 44 px o mas; en 412 x 823 el escenario de Grainient se ve al menos 15%', !m.overflow && m.small.length === 0 && frac.fraction >= 0.15, `desborde=${m.overflow} chicos=${m.small.join('|')} fraccion=${frac.fraction.toFixed(2)} top=${frac.top}`);
    }

    /* capturas de escritorio */
    if (wantShots) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const { context, page } = await openPage(browser, url);
      await page.waitForSelector('article[data-effect]');
      await sleep(500);
      await page.screenshot({ path: path.join(SHOTS, 'gallery-desktop.jpg'), type: 'jpeg', quality: 70, fullPage: true });
      for (const [name, file] of [['Grainient', 'mounted-grainient.jpg'], ['PixelBlast', 'mounted-pixelblast.jpg']]) {
        const card = page.locator(cardSel(name));
        await card.scrollIntoViewIfNeeded();
        await card.locator('button[data-toggle]').click();
        await waitMounted(page, name, 8000);
        await sleep(1800);
        await card.screenshot({ path: path.join(SHOTS, file), type: 'jpeg', quality: 70 });
        await card.locator('button[data-toggle]').click();
        await sleep(300);
      }
      await context.close();
      console.log('INFO capturas escritas en reports/shots/');
    }

    /* (p) consola limpia y sin trafico externo en toda la corrida */
    check(
      'p. 0 errores de consola, 0 pageerror y 0 peticiones fuera de 127.0.0.1 en toda la corrida',
      RUN_LOG.console.length === 0 && RUN_LOG.pageerrors.length === 0 && RUN_LOG.external.length === 0,
      `consola=${RUN_LOG.console.length} pageerror=${RUN_LOG.pageerrors.length} externas=${RUN_LOG.external.length}` +
        (RUN_LOG.console[0] ? ` primero=${RUN_LOG.console[0].slice(0, 140)}` : '') +
        (RUN_LOG.pageerrors[0] ? ` pageerror=${RUN_LOG.pageerrors[0].slice(0, 140)}` : ''),
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

/* ---------- stage: report ---------- */

async function stageReport({ chromium }) {
  const mDir = path.join(APP, 'public', 'measurements');
  const weightsPath = path.join(mDir, 'original-vs-vanilla.json');
  const lhPath = path.join(mDir, 'lighthouse-summary.json');
  const names = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8')).map((o) => o.name);

  const exist = fs.existsSync(weightsPath) && fs.existsSync(lhPath);
  check('r1. existen original-vs-vanilla.json y lighthouse-summary.json en public/measurements', exist);
  if (!exist) return;
  const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
  const lh = JSON.parse(fs.readFileSync(lhPath, 'utf8'));

  // buildSha256 igual al recalculado desde el dist/ vigente.
  const hash = buildSha256(DIST);
  check('r2. buildSha256 de ambos JSON coincide con el dist/ vigente', weights.buildSha256 === hash && lh.buildSha256 === hash, `dist=${hash.slice(0, 12)} pesos=${String(weights.buildSha256).slice(0, 12)} lighthouse=${String(lh.buildSha256).slice(0, 12)}`);

  // original-vs-vanilla.json
  const numericFields = ['ownJsGzip', 'ownCssGzip', 'sharedGzip', 'totalGzip', 'totalBrotli', 'vanillaGzip', 'ratio'];
  const rowsOk =
    Array.isArray(weights.rows) &&
    weights.rows.length === 16 &&
    names.every((n) => weights.rows.some((r) => r.original === n)) &&
    weights.rows.every((r) => numericFields.every((f) => typeof r[f] === 'number' && Number.isFinite(r[f])));
  const baseOk = typeof weights.base?.gzip === 'number' && Array.isArray(weights.shared) && typeof weights.budgets?.perEffect === 'number';
  check('r3. original-vs-vanilla.json trae 16 filas con los nombres de originals.json, valores numericos, base, shared y budgets', rowsOk && baseOk);

  // lighthouse-summary.json
  const combos = lh.combos ?? [];
  const shape =
    combos.length === 4 &&
    combos.every((c) => c.runs?.length === 3 && typeof c.median?.performance === 'number') &&
    ['baseline', 'mounted'].every((t) => ['mobile', 'desktop'].every((f) => combos.some((c) => c.target === t && c.factor === f)));
  const runs = combos.flatMap((c) => c.runs.map((r) => ({ ...r, target: c.target })));
  const gatesOk =
    runs.length === 12 &&
    runs.every((r) => r.accessibility >= 95) &&
    runs.filter((r) => r.target === 'baseline').every((r) => r.cls <= 0.01 && r.originalChunkRequested === false) &&
    runs.filter((r) => r.target === 'mounted').every((r) => r.originalChunkRequested === true);
  check('r4. lighthouse-summary.json: 4 objetivos por 3 corridas y las compuertas se cumplen', shape && gatesOk, `combos=${combos.length} corridas=${runs.length}`);

  // HTML de Lighthouse
  const htmlDetail = [];
  for (const f of ['lighthouse-system-mobile.report.html', 'lighthouse-system-desktop.report.html']) {
    const p = path.join(APP, 'reports', f);
    htmlDetail.push(`${f}=${fs.existsSync(p) ? fs.statSync(p).size : 'falta'}`);
  }
  const htmlOk = ['mobile', 'desktop'].every((f) => {
    const p = path.join(APP, 'reports', `lighthouse-system-${f}.report.html`);
    return fs.existsSync(p) && fs.statSync(p).size > 100 * 1024;
  });
  check('r5. los dos informes HTML de Lighthouse existen y pesan mas de 100 KB', htmlOk, htmlDetail.join(' '));

  // /rendimiento en el build servido
  const served = fs.existsSync(path.join(DIST, 'measurements', 'original-vs-vanilla.json'));
  if (!served) {
    check('r6. dist/ incluye measurements/ (ejecuta npm run build despues de medir)', false);
    return;
  }
  const server = await startStaticServer({ root: DIST, compress: true });
  const browser = await chromium.launch({ args: CHROMIUM_ARGS });
  try {
    const { context, page, log } = await openPage(browser, `${server.url}/rendimiento`);
    await page.waitForSelector('table.data-table tbody tr', { timeout: 10_000 });
    const info = await page.evaluate(() => {
      const tables = [...document.querySelectorAll('table.data-table')];
      return {
        h1: document.querySelectorAll('h1').length,
        weightRows: tables[0]?.querySelectorAll('tbody tr').length ?? 0,
        lhRows: tables[1]?.querySelectorAll('tbody tr').length ?? 0,
        mediana: document.body.textContent?.includes('Mediana') ?? false,
        captions: tables.map((t) => t.querySelector('caption')?.textContent ?? ''),
      };
    });
    check(
      'r6. /rendimiento: 1 h1, 16 filas de pesos, 4 filas de Lighthouse y la palabra Mediana',
      info.h1 === 1 && info.weightRows === 16 && info.lhRows === 4 && info.mediana,
      JSON.stringify({ h1: info.h1, weightRows: info.weightRows, lhRows: info.lhRows, mediana: info.mediana }),
    );
    check('r7. /rendimiento sin errores de consola ni pageerror', log.console.length === 0 && log.pageerrors.length === 0 && log.external.length === 0, `consola=${log.console.length} pageerror=${log.pageerrors.length}`);
    if (wantShots) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, 'rendimiento-desktop.jpg'), type: 'jpeg', quality: 80, fullPage: true });
      console.log('INFO captura reports/shots/rendimiento-desktop.jpg');
    }
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

/* ---------- stage: readme ---------- */

async function stageReadme() {
  const file = path.join(APP, 'README.md');
  const exists = fs.existsSync(file);
  check('d1. README.md existe', exists);
  if (!exists) return;
  const text = fs.readFileSync(file, 'utf8');
  const required = [
    'npm install',
    'npm run dev',
    'npm run build',
    'npm run preview',
    'http://127.0.0.1:5173/system',
    'http://127.0.0.1:5173/rendimiento',
    'http://127.0.0.1:4173/system',
    'http://127.0.0.1:4173/system?mount=grainient',
    'http://127.0.0.1:4173/rendimiento',
    'Pausar animaciones',
    'LICENSES.md',
    '/rendimiento',
  ];
  const missing = required.filter((s) => !text.includes(s));
  check('d2. el README contiene comandos, direcciones, Pausar animaciones, LICENSES.md y /rendimiento', missing.length === 0, missing.join(' | '));

  const m = /##\s+Qu[eé] abrir\s*\n([\s\S]*?)(?:\n##\s|$)/.exec(text);
  const items = m ? (m[1].match(/^\s*\d+\.\s+\S/gm) ?? []).length : 0;
  check('d3. la seccion "Que abrir" tiene al menos 8 elementos numerados', items >= 8, `elementos=${items}`);

  const dashes = (text.match(/[–—]/g) ?? []).length;
  check('d4. el README no contiene guiones largos ni medios (U+2013, U+2014)', dashes === 0, `encontrados=${dashes}`);
}

/* ---------- registro de stages ---------- */

const STAGES = {
  tracer: stageTracer,
  gallery: stageGallery,
  report: stageReport,
  readme: stageReadme,
};
const STAGE_ORDER = ['tracer', 'gallery', 'report', 'readme'];

/* ---------- main ---------- */

const names = stageArg === 'all' ? STAGE_ORDER : [stageArg];
for (const n of names) if (!STAGES[n]) die(2, `verify-app: el stage ${n} no existe. Stages: ${Object.keys(STAGES).join(', ')}`);
requireDist();
const pw = await loadPlaywright();

for (const n of names) {
  console.log(`--- stage ${n} ---`);
  await STAGES[n](pw);
}

console.log(`\n${passes} PASS, ${failures} FAIL`);
process.exit(failures ? 1 : 0);
