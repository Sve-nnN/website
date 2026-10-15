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
  page.on('response', (r) => {
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
