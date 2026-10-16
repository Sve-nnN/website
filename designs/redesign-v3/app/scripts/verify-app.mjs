#!/usr/bin/env node
/*
 * verify-app.mjs: harness Playwright de la app de mockups (fase 51.1).
 *
 * Uso:
 *   node scripts/verify-app.mjs --stage=tracer|all [--shots]
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

/** Abre una pagina registrando consola, errores de pagina y peticiones. */
async function openPage(browser, url, { viewport = { width: 1440, height: 900 } } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const log = { console: [], pageerrors: [], requests: [], external: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push(m.text());
  });
  page.on('pageerror', (e) => log.pageerrors.push(String(e)));
  page.on('request', (r) => {
    const u = new URL(r.url());
    log.requests.push(r.url());
    if (!['data:', 'blob:', 'about:'].includes(u.protocol) && u.hostname !== '127.0.0.1') log.external.push(r.url());
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

/* ---------- registro de stages ---------- */

const STAGES = {
  tracer: stageTracer,
};
const STAGE_ORDER = ['tracer'];

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
