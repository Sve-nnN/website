#!/usr/bin/env node
/*
 * verify-states.mjs: harness Playwright de estados del sistema visual v3.
 *
 * Uso:
 *   node designs/redesign-v3/tools/verify-states.mjs --stage=tracer|fonts|tokens|fallbacks|effects|components|all [--shots]
 *
 * Cada stage es una funcion registrada en STAGES. Imprime una linea PASS o FAIL por check
 * y termina con codigo 1 si algo falla. `all` corre los stages registrados en orden.
 * Los planes siguientes agregan stages y nunca eliminan ni debilitan un check existente.
 *
 * Playwright se resuelve desde el node_modules del repo (ya declarado en package.json).
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAGE_ORDER = ['tracer', 'fonts', 'tokens', 'fallbacks', 'effects', 'components'];
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
};

let failures = 0;
let passes = 0;

function check(name, ok, detail = '') {
  const tail = detail ? ` | ${detail}` : '';
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${tail}`);
  if (ok) passes += 1;
  else failures += 1;
  return ok;
}

/* ---------- servidor estatico propio ---------- */

function startServer() {
  const requests = [];
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    if (urlPath.endsWith('/')) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      requests.push({ url: urlPath, status: err ? 404 : 200 });
      if (err) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        requests,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

/* ---------- apertura de pagina con registro de errores ---------- */

async function visit(env, target, { ctx = {}, init = null, wait = 0 } = {}) {
  const context = await env.browser.newContext(ctx);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const log = { console: [], pageerrors: [], bad: [], failed: [], external: [], requests: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push(m.text());
  });
  page.on('pageerror', (e) => log.pageerrors.push(String(e)));
  log.responses = [];
  page.on('response', (r) => {
    log.responses.push({ url: r.url(), status: r.status() });
    if (r.status() >= 400) log.bad.push(`${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => log.failed.push(r.url()));
  page.on('request', (r) => {
    const u = new URL(r.url());
    log.requests.push(r.url());
    if (!['file:', 'data:', 'blob:', 'about:'].includes(u.protocol) && u.origin !== env.server.origin) {
      log.external.push(r.url());
    }
  });
  await page.goto(target, { waitUntil: 'load' });
  if (wait) await page.waitForTimeout(wait);
  return { context, page, log };
}

const httpUrl = (env, rel) => `${env.server.origin}/${rel}`;
const fileUrl = (rel) => pathToFileURL(path.join(ROOT, rel)).href;

const canvasCount = (page) => page.evaluate(() => document.querySelectorAll('canvas').length);

/* ---------- higiene: sin guiones largos ni cortos ---------- */

const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.md', '.txt', '.svg']);
const DASH = new RegExp('[\\u2013\\u2014]');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function hygiene() {
  const offenders = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel.startsWith('reports/') || rel === 'assets/fonts/LICENSES.txt') continue;
    if (!TEXT_EXT.has(path.extname(file))) continue;
    const text = fs.readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (DASH.test(line)) offenders.push(`${rel}:${i + 1}`);
    });
  }
  check('hygiene: sin guion largo ni corto en archivos de texto', offenders.length === 0, offenders.slice(0, 5).join(', '));
}

/* ---------- stages ---------- */

const STAGES = {};

STAGES.tracer = async (env) => {
  const page0 = 'system.html';

  /* 1. Carga por http y por file:// sin errores. */
  for (const [label, url] of [['http', httpUrl(env, page0)], ['file', fileUrl(page0)]]) {
    const { context, page, log } = await visit(env, url, { ctx: { viewport: { width: 1440, height: 900 } }, wait: 600 });
    check(`tracer: ${label} cero errores de consola`, log.console.length === 0, log.console.join(' ; '));
    check(`tracer: ${label} cero pageerror`, log.pageerrors.length === 0, log.pageerrors.join(' ; '));
    check(`tracer: ${label} cero respuestas 4xx/5xx ni peticiones fallidas`, log.bad.length === 0 && log.failed.length === 0, [...log.bad, ...log.failed].join(' ; '));
    check(`tracer: ${label} cero peticiones a origenes externos`, log.external.length === 0, log.external.join(' ; '));
    await context.close();
  }

  /* 2. Sin JavaScript: H1 visible, fallback CSS pintado, ningun canvas. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false } });
    const h1 = await page.locator('h1').isVisible();
    const bg = await page.locator('.fx-grain').evaluate((el) => getComputedStyle(el).backgroundImage);
    const canvases = await page.locator('canvas').count();
    check('tracer: sin JS el h1 es visible', h1);
    check('tracer: sin JS el fallback pinta radial-gradient', bg.includes('radial-gradient'), bg.slice(0, 60));
    check('tracer: sin JS no hay canvas', canvases === 0, `canvas=${canvases}`);
    await context.close();
  }

  /* 3. Desktop con JS: un solo canvas, montado despues de load, DPR limitado. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), {
      ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
      wait: 3500,
    });
    const info = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const nav = performance.getEntriesByType('navigation')[0];
      const a = window.FX && window.FX.active();
      return {
        canvases: document.querySelectorAll('canvas').length,
        aria: c ? c.getAttribute('aria-hidden') : null,
        count: window.FX ? window.FX.count() : -1,
        cw: c ? c.width : 0,
        ch: c ? c.height : 0,
        clientW: c ? c.clientWidth : 0,
        clientH: c ? c.clientHeight : 0,
        at: a ? a.at : null,
        loadStart: nav ? nav.loadEventStart : null,
        isOn: c ? c.classList.contains('is-on') : false,
      };
    });
    check('tracer: desktop exactamente un canvas en la pagina', info.canvases === 1, `canvas=${info.canvases}`);
    check('tracer: el canvas tiene aria-hidden="true"', info.aria === 'true', String(info.aria));
    check('tracer: FX.count() vale 1', info.count === 1, String(info.count));
    check('tracer: canvas montado despues del evento load', info.at !== null && info.loadStart !== null && info.at >= info.loadStart, `at=${info.at} loadStart=${info.loadStart}`);
    check('tracer: DPR limitado a 1.5 con deviceScaleFactor 2', info.cw > 0 && info.cw <= Math.ceil(info.clientW * 1.5) + 1 && info.ch <= Math.ceil(info.clientH * 1.5) + 1, `canvas=${info.cw}x${info.ch} css=${info.clientW}x${info.clientH}`);
    check('tracer: el canvas hace fade-in (is-on) tras el primer cuadro', info.isOn);
    await context.close();
  }

  /* 4. reduced-motion en desktop. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), {
      ctx: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
      wait: 3500,
    });
    const n = await canvasCount(page);
    const gates = await page.evaluate(() => window.FX.gates());
    check('tracer: reduced-motion deja cero canvas', n === 0, `canvas=${n}`);
    check('tracer: gates() informa el motivo de reduced-motion', !gates.ok && gates.reasons.some((r) => r.includes('reduced-motion')), JSON.stringify(gates));
    await context.close();
  }

  /* 5. Mobile y 320 px. */
  for (const [label, w, h] of [['390', 390, 844], ['320', 320, 640]]) {
    const { context, page } = await visit(env, httpUrl(env, page0), {
      ctx: { viewport: { width: w, height: h }, isMobile: true, hasTouch: true },
      wait: 3500,
    });
    const n = await canvasCount(page);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    check(`tracer: mobile ${label} cero canvas`, n === 0, `canvas=${n}`);
    check(`tracer: mobile ${label} sin desborde horizontal`, sw <= iw, `scrollWidth=${sw} innerWidth=${iw}`);
    await context.close();
  }

  /* 6. saveData. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), {
      ctx: { viewport: { width: 1440, height: 900 } },
      init: () => {
        Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
      },
      wait: 3500,
    });
    const n = await canvasCount(page);
    check('tracer: saveData deja cero canvas', n === 0, `canvas=${n}`);
    await context.close();
  }

  /* 7. Fuente Array y peso del h1. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 1440, height: 900 } }, wait: 300 });
    const font = await page.evaluate(async () => {
      await document.fonts.load('1em Array');
      const loaded = [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Array' && f.status === 'loaded');
      return {
        check: document.fonts.check('1em Array'),
        loaded,
        weight: getComputedStyle(document.querySelector('h1')).fontWeight,
      };
    });
    check("tracer: document.fonts.check('1em Array') es true", font.check);
    check('tracer: Array cargada (FontFace status loaded)', font.loaded);
    check('tracer: el h1 usa font-weight 400', font.weight === '400', font.weight);
    await context.close();
  }

  /* Capturas. */
  if (env.shots) {
    fs.mkdirSync(path.join(ROOT, 'reports/shots'), { recursive: true });
    const d = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 1440, height: 900 } }, wait: 3500 });
    await d.page.screenshot({ path: path.join(ROOT, 'reports/shots/tracer-desktop.jpg'), type: 'jpeg', quality: 60 });
    await d.context.close();
    const m = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, wait: 1500 });
    await m.page.screenshot({ path: path.join(ROOT, 'reports/shots/tracer-mobile.jpg'), type: 'jpeg', quality: 60 });
    await m.context.close();
    check('tracer: capturas guardadas en reports/shots', true);
  }
};

STAGES.fonts = async (env) => {
  const dir = path.join(ROOT, 'assets/fonts');
  const manifestPath = path.join(dir, 'fonts-manifest.json');
  check('fonts: existe fonts-manifest.json', fs.existsSync(manifestPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const LIMITS = {
    'Geist-latin-var.woff2': 31 * 1000,
    'GeistMono-400-latin.woff2': 9 * 1000,
    'GeistPixel-Square-upper.woff2': 3.5 * 1000,
  };
  for (const f of manifest.files) {
    const file = path.join(dir, f.file);
    const exists = fs.existsSync(file);
    check(`fonts: ${f.file} existe`, exists);
    if (!exists) continue;
    const buf = fs.readFileSync(file);
    check(`fonts: ${f.file} firma wOF2`, buf.subarray(0, 4).toString('latin1') === 'wOF2');
    check(`fonts: ${f.file} bytes coinciden con el manifiesto`, buf.length === f.bytes, `${buf.length} vs ${f.bytes}`);
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    check(`fonts: ${f.file} sha256 coincide con el manifiesto`, sha === f.sha256);
    check(`fonts: ${f.file} cobertura sin glifos faltantes`, Array.isArray(f.coverage.missing) && f.coverage.missing.length === 0, (f.coverage.missing || []).join(' '));
    if (LIMITS[f.file]) check(`fonts: ${f.file} pesa menos de ${LIMITS[f.file] / 1000} KB`, buf.length < LIMITS[f.file], `${buf.length} bytes`);
    check(`fonts: ${f.file} declara licencia y procedencia`, Boolean(f.license && f.source && f.sha256 && f.glyphs > 0));
  }
  const array = manifest.files.find((f) => f.file === 'Array-Regular.woff2');
  const srcArray = path.resolve(ROOT, '../../src/fonts/Array-Regular.woff2');
  if (array && fs.existsSync(srcArray)) {
    const same = crypto.createHash('sha256').update(fs.readFileSync(srcArray)).digest('hex') === array.sha256;
    check('fonts: Array es copia exacta de src/fonts/Array-Regular.woff2', same);
  }
  check('fonts: LICENSES.txt existe y cita OFL y Array', (() => {
    const p = path.join(dir, 'LICENSES.txt');
    if (!fs.existsSync(p)) return false;
    const t = fs.readFileSync(p, 'utf8');
    return t.includes('SIL OPEN FONT LICENSE') && t.includes('Array');
  })());
  const fm = manifest.fallbackMetrics;
  check('fonts: el manifiesto trae metricas de fallback medidas', Boolean(fm && fm.array && fm.geist && fm.array.sizeAdjustPct > 0 && fm.geist.sizeAdjustPct > 0));

  /* Carga real desde el navegador, por http y por file://, sin origenes externos. */
  const FAMILIES = [
    ['Array', 'Array-Regular.woff2'],
    ['Geist', 'Geist-latin-var.woff2'],
    ['Geist Mono', 'GeistMono-400-latin.woff2'],
    ['Pixel Label', 'GeistPixel-Square-upper.woff2'],
  ];
  for (const [label, url] of [['http', httpUrl(env, 'system.html')], ['file', fileUrl('system.html')]]) {
    const { context, page, log } = await visit(env, url, { ctx: { viewport: { width: 1440, height: 900 } } });
    const result = await page.evaluate(async (families) => {
      const out = {};
      for (const [family] of families) {
        const el = document.createElement('p');
        el.setAttribute('data-font-probe', family);
        el.style.fontFamily = `"${family}"`;
        el.textContent = 'ABC 123 ÁÉÍÑÓÚÜ';
        document.body.appendChild(el);
      }
      for (const [family] of families) {
        const faces = await document.fonts.load(`1em "${family}"`, 'ABC 123');
        out[family] = faces.length > 0 && faces.every((f) => f.status === 'loaded');
      }
      return out;
    }, FAMILIES);
    for (const [family, file] of FAMILIES) {
      check(`fonts: ${label} ${family} carga (FontFace loaded)`, result[family] === true);
      const hit = log.responses.find((r) => r.url.endsWith(`assets/fonts/${file}`));
      const okStatus = label === 'file' ? Boolean(hit) || log.requests.some((u) => u.endsWith(`assets/fonts/${file}`)) : hit && hit.status === 200;
      check(`fonts: ${label} ${file} se pide desde assets/fonts/`, Boolean(okStatus), hit ? String(hit.status) : 'sin respuesta');
    }
    check(`fonts: ${label} cero peticiones a origenes externos`, log.external.length === 0, log.external.join(' ; '));
    check(`fonts: ${label} cero errores de consola ni respuestas 4xx`, log.console.length === 0 && log.bad.length === 0, [...log.console, ...log.bad].join(' ; '));
    await context.close();
  }
};

/* ---------- main ---------- */

async function main() {
  const args = process.argv.slice(2);
  const stageArg = (args.find((a) => a.startsWith('--stage=')) || '--stage=all').split('=')[1];
  const shots = args.includes('--shots');
  const wanted = stageArg === 'all' ? STAGE_ORDER.filter((s) => STAGES[s]) : [stageArg];

  for (const s of wanted) {
    if (!STAGES[s]) {
      console.error(`FAIL stage "${s}" no esta registrado (registrados: ${Object.keys(STAGES).join(', ')})`);
      process.exit(2);
    }
  }

  const server = await startServer();
  const browser = await chromium.launch();
  const env = { browser, server, shots };
  try {
    for (const s of wanted) {
      console.log(`--- stage: ${s}`);
      hygiene();
      await STAGES[s](env);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`\n${passes} PASS, ${failures} FAIL`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
