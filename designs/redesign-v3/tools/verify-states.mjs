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
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAGE_ORDER = ['tracer', 'fonts', 'tokens', 'fallbacks', 'effects', 'components'];
/* Capturas de evidencia por etapa: fuera del repo. El conjunto final vive en reports/shots (ver finalShots). */
const STAGE_SHOTS = path.join(os.tmpdir(), 'redesign-v3-stage-shots');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
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
    const bg = await page.locator('.fx-grain[data-fx]').evaluate((el) => getComputedStyle(el).backgroundImage);
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
    fs.mkdirSync(STAGE_SHOTS, { recursive: true });
    const d = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 1440, height: 900 } }, wait: 3500 });
    await d.page.screenshot({ path: path.join(STAGE_SHOTS, 'tracer-desktop.jpg'), type: 'jpeg', quality: 60 });
    await d.context.close();
    const m = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, wait: 1500 });
    await m.page.screenshot({ path: path.join(STAGE_SHOTS, 'tracer-mobile.jpg'), type: 'jpeg', quality: 60 });
    await m.context.close();
    check('tracer: capturas guardadas fuera del repo (STAGE_SHOTS)', true);
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

STAGES.tokens = async (env) => {
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/contrast.json'), 'utf8'));
  const totalPairs = Object.values(report.groups).reduce((n, g) => n + g.results.length, 0);

  /* Referencias externas (CDN) en el codigo fuente del sistema. */
  const external = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel.startsWith('reports/') || !['.html', '.css', '.js'].includes(path.extname(file))) continue;
    const text = fs.readFileSync(file, 'utf8');
    /* Cargas de recursos externos. Los enlaces <a href> de documentacion (catalogo) no cargan nada y se excluyen. */
    const loadsExternal = path.extname(file) === '.html'
      ? /<(?:script|link|img|iframe|source|video|audio|embed|object)\b[^>]*\b(?:src|href|data)\s*=\s*["']https?:/i.test(text)
      : /(?:src|href)\s*=\s*["']https?:/i.test(text);
    if (loadsExternal || /url\(\s*["']?https?:/i.test(text) || /@import\s+["']?https?:/i.test(text)) {
      external.push(rel);
    }
  }
  check('tokens: sin script src, link href ni url() externos', external.length === 0, external.join(', '));

  const { context, page, log } = await visit(env, httpUrl(env, 'system.html'), { ctx: { viewport: { width: 1440, height: 900 } }, wait: 800 });
  check('tokens: cero errores de consola ni respuestas 4xx', log.console.length === 0 && log.bad.length === 0 && log.pageerrors.length === 0, [...log.console, ...log.bad, ...log.pageerrors].join(' ; '));

  const data = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const swatches = [...document.querySelectorAll('[data-token][data-hex]')].map((el) => {
      const token = el.getAttribute('data-token');
      const chip = el.querySelector('.swatch-chip');
      return {
        token,
        shown: el.getAttribute('data-hex'),
        actual: root.getPropertyValue(token).trim(),
        chipBg: chip ? getComputedStyle(chip).backgroundColor : null,
        chipImage: chip ? getComputedStyle(chip).backgroundImage : null,
        visibleHex: el.querySelector('.swatch-hex') ? el.querySelector('.swatch-hex').textContent.trim() : null,
      };
    });
    const values = [...document.querySelectorAll('[data-token][data-value]')].map((el) => ({
      token: el.getAttribute('data-token'),
      shown: el.getAttribute('data-value'),
      actual: root.getPropertyValue(el.getAttribute('data-token')).trim(),
    }));
    const body = getComputedStyle(document.body);
    const lineHeight = parseFloat(body.lineHeight) / parseFloat(body.fontSize);
    const heads = [...document.querySelectorAll('h1, h2, h3')].map((h) => ({ tag: h.tagName, weight: getComputedStyle(h).fontWeight, synth: getComputedStyle(h).fontSynthesis }));
    const pixel = [...document.querySelectorAll('.pixel-label')].map((el) => parseFloat(getComputedStyle(el).fontSize));
    const rows = [...document.querySelectorAll('#contraste tbody tr')].map((tr) => ({
      group: tr.getAttribute('data-group'),
      result: tr.getAttribute('data-result'),
      text: tr.lastElementChild.textContent.trim(),
    }));
    return {
      swatches,
      values,
      ids: ['paleta', 'tipografia', 'espaciado', 'contraste'].map((id) => [id, Boolean(document.getElementById(id))]),
      bodyFamily: body.fontFamily,
      lineHeight,
      heads,
      pixel,
      rows,
      table: {
        caption: Boolean(document.querySelector('#contraste table caption')),
        colHeaders: document.querySelectorAll('#contraste thead th[scope="col"]').length,
        rowHeaders: document.querySelectorAll('#contraste tbody th[scope="row"]').length,
      },
      nav: Boolean(document.querySelector('nav[aria-label="Secciones"]')),
      h1: document.querySelectorAll('h1').length,
      mono: getComputedStyle(document.querySelector('.sample-mono')).fontFamily,
    };
  });

  const bad = data.swatches.filter((s) => s.shown.toLowerCase() !== s.actual.toLowerCase());
  check(`tokens: ${data.swatches.length} muestras de color con data-hex igual al token real`, data.swatches.length >= 14 && bad.length === 0, bad.map((s) => `${s.token}: ${s.shown} vs ${s.actual}`).join(' ; '));
  const hexBad = data.swatches.filter((s) => s.visibleHex && s.visibleHex.toLowerCase() !== s.actual.toLowerCase());
  check('tokens: el valor escrito en cada muestra coincide con el token', hexBad.length === 0, hexBad.map((s) => s.token).join(', '));
  const chipBad = data.swatches.filter((s) => {
    const m = /^#([0-9a-f]{6})$/i.exec(s.actual);
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return s.chipBg !== `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  });
  check('tokens: el fondo real de cada swatch es el color del token', chipBad.length === 0, chipBad.map((s) => `${s.token}: ${s.chipBg}`).join(' ; '));
  const valBad = data.values.filter((v) => v.shown !== v.actual);
  check(`tokens: ${data.values.length} valores de escala (tipografia, espaciado, radios) coinciden con tokens.css`, data.values.length >= 20 && valBad.length === 0, valBad.map((v) => `${v.token}: ${v.shown} vs ${v.actual}`).join(' ; '));
  check('tokens: existen #paleta #tipografia #espaciado y #contraste', data.ids.every(([, ok]) => ok), data.ids.filter(([, ok]) => !ok).map(([id]) => id).join(', '));
  check('tokens: nav con aria-label "Secciones" y un solo h1', data.nav && data.h1 === 1, `h1=${data.h1}`);

  check(`tokens: la tabla tiene una fila por par de contrast.json (${totalPairs})`, data.rows.length === totalPairs, `filas=${data.rows.length}`);
  check('tokens: tabla con caption, th scope="col" y th scope="row"', data.table.caption && data.table.colHeaders === 6 && data.table.rowHeaders === totalPairs, JSON.stringify(data.table));
  const failing = data.rows.filter((r) => ['required', 'ui', 'scrim', 'reading'].includes(r.group) && (r.result !== 'ok' || !/^Cumple AA$/.test(r.text)));
  check('tokens: ninguna fila required, ui, scrim o reading marca fallo', failing.length === 0, failing.map((r) => r.group).join(', '));
  const proh = data.rows.filter((r) => r.group === 'prohibited');
  check('tokens: las combinaciones prohibidas aparecen marcadas como no usables', proh.length > 0 && proh.every((r) => r.text === 'No cumple: uso prohibido'), `prohibidas=${proh.length}`);
  check('tokens: contrast.json no tiene problemas', report.summary.problems === 0, `problemas=${report.summary.problems}`);

  check('tokens: el body usa Geist', /^"?Geist"?/.test(data.bodyFamily), data.bodyFamily);
  check('tokens: line-height del body de al menos 1.5', data.lineHeight >= 1.5, String(data.lineHeight));
  check('tokens: .pixel-label mide 12 px o mas', data.pixel.length > 0 && Math.min(...data.pixel) >= 12, `min=${Math.min(...data.pixel)}`);
  check('tokens: h1, h2 y h3 con font-weight 400 y font-synthesis none', data.heads.length >= 5 && data.heads.every((h) => h.weight === '400' && /none/.test(h.synth)), JSON.stringify(data.heads.slice(0, 2)));
  check('tokens: la muestra mono usa Geist Mono', /Geist Mono/.test(data.mono), data.mono);

  /* Sin desborde horizontal en la pagina larga. */
  await context.close();
  for (const [label, w, h] of [['1440', 1440, 900], ['390', 390, 844], ['320', 320, 640]]) {
    const v = await visit(env, httpUrl(env, 'system.html'), { ctx: { viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 }, wait: 500 });
    const { sw, iw } = await v.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    check(`tokens: ${label} px sin desborde horizontal en toda la pagina`, sw <= iw, `scrollWidth=${sw} innerWidth=${iw}`);
    if (env.shots && (w === 1440 || w === 390)) {
      fs.mkdirSync(STAGE_SHOTS, { recursive: true });
      await v.page.screenshot({ path: path.join(STAGE_SHOTS, `system-${w === 1440 ? 'desktop' : 'mobile'}.jpg`), type: 'jpeg', quality: 60, fullPage: true });
    }
    await v.context.close();
  }
};

/* ---------- stage: fallbacks ---------- */

const EFFECTS = ['grain', 'waves', 'crt', 'slats', 'pixel', 'ascii', 'noise', 'dither', 'blinds', 'reveal', 'transition', 'spotlight', 'star', 'dotgrid', 'reading'];
const DEMOS = [['grain', 'demo-grain', 'grain'], ['waves', 'demo-waves', 'halftone'], ['crt', 'demo-crt', 'crt'], ['slats', 'demo-slats', 'slats']];
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

/* Bytes de una captura del elemento -> fraccion de pixeles a mas de 40 de distancia RGB de la tinta. */
async function coverage(page, selector) {
  const buf = await page.locator(selector).first().screenshot({ type: 'png' });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const ink = [11, 11, 18];
    let far = 0;
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.hypot(d[i] - ink[0], d[i + 1] - ink[1], d[i + 2] - ink[2]);
      if (dist > 40) far += 1;
    }
    return far / (d.length / 4);
  }, buf.toString('base64'));
}

STAGES.fallbacks = async (env) => {
  const page0 = 'system.html';

  /* 1. Sin JavaScript, desktop: cada tarjeta existe y su vista previa se pinta con CSS. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { ...DESKTOP, javaScriptEnabled: false } });
    const info = await page.evaluate((effects) => {
      const paints = (el) => {
        for (const n of [el, ...el.querySelectorAll('*')]) {
          for (const ps of [null, '::before', '::after']) {
            const cs = getComputedStyle(n, ps);
            if (ps && (cs.content === 'none' || cs.content === 'normal')) continue;
            const mask = cs.maskImage || cs.webkitMaskImage || 'none';
            if (cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || mask !== 'none') return true;
          }
        }
        return false;
      };
      return effects.map((name) => {
        const card = document.querySelector(`[data-effect="${name}"]`);
        const prev = card && card.querySelector('[data-preview]');
        return {
          name,
          card: Boolean(card),
          prev: Boolean(prev),
          h: prev ? prev.getBoundingClientRect().height : 0,
          canvas: card ? card.querySelectorAll('canvas').length : -1,
          paints: prev ? paints(prev) : false,
          flag: card ? /Fallback CSS siempre visible/.test(card.textContent) : false,
          origin: card ? card.querySelectorAll('.fx-origin strong').length > 0 || card.querySelector('.fx-origin') !== null : false,
        };
      });
    }, EFFECTS);
    for (const r of info) {
      check(`fallbacks: ${r.name} existe, vista previa de 120 px o mas, sin canvas, pintada con CSS y con etiqueta`, r.card && r.prev && r.h >= 120 && r.canvas === 0 && r.paints && r.flag && r.origin, JSON.stringify(r));
    }
    const ascii = await page.evaluate(() => {
      const pre = document.querySelector('pre.fx-ascii');
      return pre ? { aria: pre.getAttribute('aria-hidden'), text: pre.textContent, font: getComputedStyle(pre).fontFamily, lines: pre.textContent.split('\n').length } : null;
    });
    check('fallbacks: pre.fx-ascii con aria-hidden="true"', ascii && ascii.aria === 'true');
    check('fallbacks: el ASCII solo usa .:-=+*#%@, espacios y saltos de linea, en varias lineas', ascii && /^[.:\-=+*#%@ \n]+$/.test(ascii.text) && ascii.lines > 1, ascii ? `lineas=${ascii.lines}` : 'sin pre');
    check('fallbacks: el ASCII usa Geist Mono', ascii && /^"?Geist Mono"?/.test(ascii.font), ascii && ascii.font);
    const pause = await page.locator('[data-fx-pause]').first().evaluate((b) => {
      const r = b.getBoundingClientRect();
      return { w: r.width, h: r.height, label: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') };
    });
    check('fallbacks: boton Pausar animaciones visible, etiqueta fija y aria-pressed="false"', pause.w > 0 && pause.h > 0 && pause.label === 'Pausar animaciones' && pause.pressed === 'false', JSON.stringify(pause));
    const reveal = await page.locator('[data-effect="reveal"] img').evaluate((img) => ({ vis: img.getBoundingClientRect().height > 0, alt: img.alt.length > 10, wh: img.width > 0 && img.height > 0, op: getComputedStyle(img.parentElement, '::after').opacity }));
    check('fallbacks: sin JS la imagen del reveal es visible con alt y sin trama encima', reveal.vis && reveal.alt && reveal.wh && reveal.op === '0', JSON.stringify(reveal));
    const buttons = await page.locator('[data-fx-demo-for]').evaluateAll((els) => els.map((b) => b.hidden));
    check('fallbacks: sin JS los botones de demo siguen ocultos', buttons.length === 4 && buttons.every(Boolean), `botones=${buttons.length}`);
    await context.close();
  }

  /* 2. Movimiento permitido: hay animaciones y ninguna en bucle dura menos de 1 s. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 2500 });
    const anim = await page.evaluate(() => {
      const all = document.getAnimations();
      const loops = all.filter((a) => a.effect && a.effect.getComputedTiming().iterations === Infinity);
      return {
        total: all.length,
        loops: loops.length,
        short: loops.filter((a) => a.effect.getComputedTiming().duration < 1000).map((a) => a.animationName || a.constructor.name),
      };
    });
    check('fallbacks: con movimiento permitido document.getAnimations() es mayor que 0', anim.total > 0, `total=${anim.total}`);
    check('fallbacks: toda animacion CSS infinita dura 1000 ms o mas', anim.loops > 0 && anim.short.length === 0, `bucles=${anim.loops} cortas=${anim.short.join(',')}`);
    const reading = await page.evaluate(() => {
      const card = document.querySelector('[data-effect="reading"]');
      const surf = card.querySelector('[data-surface="reading"]');
      const anims = document.getAnimations().filter((a) => a.effect && a.effect.target && surf.contains(a.effect.target));
      const classes = new Set();
      for (const n of [surf, ...surf.querySelectorAll('*')]) n.classList.forEach((c) => { if (c.startsWith('fx-')) classes.add(c); });
      return { anims: anims.length, canvas: surf.querySelectorAll('canvas').length, classes: [...classes].sort(), demo: surf.querySelectorAll('[data-fx-demo],[data-fx-ascii],[data-fx]').length };
    });
    check('fallbacks: la tarjeta de lectura no ejecuta animaciones aun con movimiento permitido', reading.anims === 0, `animaciones=${reading.anims}`);
    check('fallbacks: la tarjeta de lectura no tiene canvas ni demos', reading.canvas === 0 && reading.demo === 0);
    check('fallbacks: en lectura solo hay clases fx-noise y fx-dotgrid', JSON.stringify(reading.classes) === JSON.stringify(['fx-dotgrid', 'fx-noise']), reading.classes.join(','));

    /* Foco por teclado en la tarjeta transition. */
    await page.locator('[data-effect="transition"] a').scrollIntoViewIfNeeded();
    const before = await page.locator('[data-effect="transition"] .fx-transition__cover').evaluate((e) => getComputedStyle(e).opacity);
    await page.locator('[data-effect="transition"] a').focus();
    await page.waitForTimeout(600);
    const after = await page.locator('[data-effect="transition"] .fx-transition__cover').evaluate((e) => getComputedStyle(e).opacity);
    check('fallbacks: al enfocar el enlace de transition la portada baja de opacidad en 600 ms', before === '1' && Number(after) < 1, `antes=${before} despues=${after}`);
    await context.close();
  }

  /* 3. Movimiento reducido: por media query, por data-motion y por data-saver, cero animaciones. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { ...DESKTOP, reducedMotion: 'reduce' }, wait: 1500 });
    const n = await page.evaluate(() => document.getAnimations().length);
    check('fallbacks: con prefers-reduced-motion document.getAnimations() vale 0', n === 0, `animaciones=${n}`);
    const cov = await coverage(page, '.fx-slats');
    check('fallbacks: la cobertura de .fx-slats es de al menos 40 por ciento', cov >= 0.4, `cobertura=${(cov * 100).toFixed(1)}%`);
    await context.close();
  }
  for (const [attr, label] of [['data-motion', 'reduced'], ['data-saver', 'on']]) {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 1500 });
    await page.evaluate(([a, v]) => document.documentElement.setAttribute(a, v), [attr, label]);
    await page.waitForTimeout(600);
    const n = await page.evaluate(() => document.getAnimations().length);
    check(`fallbacks: con ${attr}="${label}" document.getAnimations() vale 0`, n === 0, `animaciones=${n}`);
    await context.close();
  }

  /* 4. Mobile 390: ninguna tarjeta desborda y el boton de pausa es visible. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: MOBILE, wait: 800 });
    const r = await page.evaluate(() => {
      const iw = window.innerWidth;
      const over = [...document.querySelectorAll('[data-effect]')].filter((c) => c.getBoundingClientRect().right > iw + 0.5 || c.scrollWidth > c.clientWidth + 1).map((c) => c.dataset.effect);
      const b = document.querySelector('[data-fx-pause]').getBoundingClientRect();
      return { over, pause: b.width > 0 && b.height > 0, sw: document.documentElement.scrollWidth, iw };
    });
    check('fallbacks: a 390 px ninguna tarjeta desborda horizontalmente', r.over.length === 0 && r.sw <= r.iw, `desbordan=${r.over.join(',')} scrollWidth=${r.sw}`);
    check('fallbacks: a 390 px el boton Pausar animaciones es visible', r.pause);
    await context.close();
  }

  /* Capturas del fallback puro (sin JavaScript). */
  if (env.shots) {
    fs.mkdirSync(STAGE_SHOTS, { recursive: true });
    for (const [name, ctx] of [['desktop', { ...DESKTOP, javaScriptEnabled: false }], ['mobile', { ...MOBILE, deviceScaleFactor: 1, javaScriptEnabled: false }]]) {
      const v = await visit(env, httpUrl(env, page0), { ctx, wait: 300 });
      await v.page.locator('#efectos').screenshot({ path: path.join(STAGE_SHOTS, `fallbacks-${name}.jpg`), type: 'jpeg', quality: 60 });
      await v.context.close();
    }
    check('fallbacks: capturas guardadas fuera del repo (STAGE_SHOTS)', true);
  }
};

/* ---------- stage: effects ---------- */

const poll = (page, fn, arg, timeout) => page.waitForFunction(fn, arg, { timeout, polling: 50 }).then(() => true, () => false);
const canvasInfo = (page) =>
  page.evaluate(() => ({
    n: document.querySelectorAll('canvas').length,
    parents: [...document.querySelectorAll('canvas')].map((c) => c.parentElement.id || c.parentElement.className),
    kind: window.FX.active() ? window.FX.active().kind : null,
  }));

STAGES.effects = async (env) => {
  const page0 = 'system.html';

  /* 1. Slot unico y demos por boton (desktop). */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    const hero = await canvasInfo(page);
    check('effects: el grain del hero monta un canvas', hero.n === 1 && hero.kind === 'grain', JSON.stringify(hero));

    await page.locator('#demo-waves').scrollIntoViewIfNeeded();
    await page.locator('[data-fx-demo-for="demo-waves"]').click();
    let samples = [];
    for (let i = 0; i < 15; i += 1) {
      samples.push((await canvasInfo(page)).n);
      await page.waitForTimeout(100);
    }
    const w = await canvasInfo(page);
    check('effects: pulsar la demo de waves deja exactamente un canvas, dentro de esa tarjeta, con kind halftone', w.n === 1 && w.parents[0] === 'demo-waves' && w.kind === 'halftone', JSON.stringify(w));
    check('effects: sondeando 100 ms durante 1500 ms el total de canvas nunca supera 1', Math.max(...samples) <= 1, `muestras=${samples.join(',')}`);
    const st = await page.locator('[data-effect="waves"] [role="status"]').textContent();
    check('effects: la region de estado informa la demo activa y 1 de 1 canvas', /activa/.test(st) && /1 de 1 canvas/.test(st), st);

    for (const [name, id, kind] of [['crt', 'demo-crt', 'crt'], ['slats', 'demo-slats', 'slats'], ['grain', 'demo-grain', 'grain']]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.locator(`[data-fx-demo-for="${id}"]`).click();
      await page.waitForTimeout(400);
      const r = await canvasInfo(page);
      check(`effects: pulsar ${name} deja un solo canvas y retira el anterior`, r.n === 1 && r.parents[0] === id && r.kind === kind, JSON.stringify(r));
    }
    await page.locator('[data-fx-demo-for="demo-grain"]').click();
    await page.waitForTimeout(400);
    const off = await canvasInfo(page);
    check('effects: pulsar de nuevo la demo activa deja 0 canvas', off.n === 0, JSON.stringify(off));
    const stOff = await page.locator('[data-effect="grain"] [role="status"]').textContent();
    check('effects: al apagar la demo la region de estado lo dice', /detenida/.test(stOff), stOff);

    const gl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
    check('effects: WebGL disponible en el navegador de prueba', gl);

    /* Capturas de cada demo con su shader activo (evidencia visual, solo con --shots). */
    if (env.shots) {
      fs.mkdirSync(STAGE_SHOTS, { recursive: true });
      for (const [name, id] of [['grain', 'demo-grain'], ['waves', 'demo-waves'], ['crt', 'demo-crt'], ['slats', 'demo-slats']]) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.locator(`[data-fx-demo-for="${id}"]`).click();
        await page.waitForTimeout(1200);
        await page.locator(`#${id}`).screenshot({ path: path.join(STAGE_SHOTS, `demo-${name}.jpg`), type: 'jpeg', quality: 70 });
      }
      check('effects: capturas de las cuatro demos guardadas fuera del repo (STAGE_SHOTS)', true);
    }
    await context.close();
  }

  /* 2. ASCII, estados bloqueados y region de estado. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    await page.locator('[data-effect="ascii"] pre.fx-ascii').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const t0 = await page.locator('[data-effect="ascii"] pre.fx-ascii').textContent();
    await page.waitForTimeout(1500);
    const t1 = await page.locator('[data-effect="ascii"] pre.fx-ascii').textContent();
    check('effects: el texto del ASCII cambia en 1500 ms con el elemento en el viewport', t0 !== t1, '');
    check('effects: el ASCII sigue dentro de .:-=+*#%@ y conserva filas y columnas', /^[.:\-=+*#%@\n]+$/.test(t1) && t1.split('\n').length === t0.split('\n').length && t1.split('\n')[0].length === t0.split('\n')[0].length, '');
    const aria = await page.locator('[data-effect="ascii"] pre.fx-ascii').getAttribute('aria-hidden');
    check('effects: el ticker no cambia aria-hidden ni agrega canvas', aria === 'true' && (await canvasCount(page)) <= 1);
    await context.close();
  }
  const blocked = [
    ['prefers-reduced-motion', { ctx: { ...DESKTOP, reducedMotion: 'reduce' }, setup: null, reason: /reduced-motion/ }],
    ['data-motion="reduced"', { ctx: DESKTOP, setup: (p) => p.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduced')), reason: /data-motion/ }],
    ['data-saver="on"', { ctx: DESKTOP, setup: (p) => p.evaluate(() => document.documentElement.setAttribute('data-saver', 'on')), reason: /data-saver/ }],
  ];
  for (const [label, cfg] of blocked) {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: cfg.ctx, wait: 2500 });
    if (cfg.setup) await cfg.setup(page);
    await page.locator('[data-effect="ascii"] pre.fx-ascii').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const a = await page.locator('[data-effect="ascii"] pre.fx-ascii').textContent();
    await page.waitForTimeout(1500);
    const b = await page.locator('[data-effect="ascii"] pre.fx-ascii').textContent();
    check(`effects: con ${label} el ASCII no cambia`, a === b);
    await page.locator('#demo-waves').scrollIntoViewIfNeeded();
    await page.locator('[data-fx-demo-for="demo-waves"]').click();
    await page.waitForTimeout(400);
    const n = await canvasCount(page);
    const st = await page.locator('[data-effect="waves"] [role="status"]').textContent();
    check(`effects: con ${label} pulsar una demo deja 0 canvas y el estado explica el motivo`, n === 0 && cfg.reason.test(st), `canvas=${n} estado="${st}"`);
    await context.close();
  }

  /* 3. Mobile 390: montaje automatico en 0, demo explicita si monta. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: MOBILE, wait: 3500 });
    const n = await canvasCount(page);
    check('effects: a 390 px de ancho el montaje automatico deja 0 canvas', n === 0, `canvas=${n}`);
    const a = await page.locator('[data-effect="ascii"] pre.fx-ascii').textContent();
    await page.locator('[data-effect="ascii"] pre.fx-ascii').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    check('effects: a 390 px el ASCII queda estatico', a === (await page.locator('[data-effect="ascii"] pre.fx-ascii').textContent()));
    await page.locator('[data-fx-demo-for="demo-crt"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelector('[data-fx-demo-for="demo-crt"]').click());
    await page.waitForTimeout(500);
    const d = await canvasInfo(page);
    check('effects: a 390 px una demo explicita monta un solo canvas', d.n === 1 && d.kind === 'crt', JSON.stringify(d));
    await context.close();
  }

  /* 4. Spotlight. */
  for (const [label, reduce] of [['con movimiento permitido', false], ['con reduced-motion', true]]) {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { ...DESKTOP, ...(reduce ? { reducedMotion: 'reduce' } : {}) }, wait: 2500 });
    const card = page.locator('[data-effect="spotlight"] .fx-spotlight');
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 30);
    await page.mouse.move(box.x + 120, box.y + 70, { steps: 4 });
    await page.waitForTimeout(250);
    const v = await card.evaluate((e) => ({ mx: e.style.getPropertyValue('--mx'), my: e.style.getPropertyValue('--my') }));
    if (!reduce) {
      check('effects: spotlight con puntero fija --mx y --my en px', /^[\d.]+px$/.test(v.mx) && /^[\d.]+px$/.test(v.my), JSON.stringify(v));
      await page.mouse.move(box.x - 60, box.y - 60);
      await page.waitForTimeout(250);
      const back = await card.evaluate((e) => e.style.getPropertyValue('--mx'));
      check('effects: al salir el spotlight vuelve a su posicion por defecto', back === '', back);
    } else {
      check('effects: spotlight con reduced-motion no cambia --mx ni --my', v.mx === '' && v.my === '', JSON.stringify(v));
    }
    await context.close();
  }

  /* 5. Reveal. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    const pending = await page.locator('.fx-reveal').evaluate((e) => e.classList.contains('is-pending'));
    check('effects: reveal pasa por .is-pending con movimiento permitido', pending);
    await page.locator('.fx-reveal').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const cls = await page.locator('.fx-reveal').evaluate((e) => [...e.classList]);
    check('effects: reveal termina en .is-in al entrar al viewport', cls.includes('is-in') && !cls.includes('is-pending'), cls.join(' '));
    await context.close();
  }
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { ...DESKTOP, reducedMotion: 'reduce' }, wait: 3000 });
    await page.locator('.fx-reveal').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const cls = await page.locator('.fx-reveal').evaluate((e) => [...e.classList]);
    check('effects: reveal con reduced-motion nunca queda pendiente', !cls.includes('is-pending'), cls.join(' '));
    await context.close();
  }

  /* 6. Superficie de lectura: inerte. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    const r = await page.evaluate(async () => {
      const surf = document.querySelector('[data-surface="reading"]');
      const mk = (parent) => {
        const demo = document.createElement('div');
        demo.id = `probe-demo-${parent === surf ? 'in' : 'out'}`;
        demo.setAttribute('data-fx-demo', 'grain');
        demo.style.minHeight = '120px';
        const pre = document.createElement('pre');
        pre.setAttribute('data-fx-ascii', '');
        pre.id = `probe-ascii-${parent === surf ? 'in' : 'out'}`;
        pre.textContent = '.:-=+*#%@\n@%#*+=-:.';
        parent.appendChild(demo);
        parent.appendChild(pre);
        return { demo, pre };
      };
      const inside = mk(surf);
      const outside = mk(document.querySelector('[data-effect="ascii"]'));
      window.FX.scan();
      const demoInside = window.FX.demo(inside.demo);
      outside.pre.scrollIntoView({ block: 'center' });
      await new Promise((res) => setTimeout(res, 1800));
      return {
        demoInside,
        canvasInside: inside.demo.querySelectorAll('canvas').length,
        asciiInside: inside.pre.textContent,
        asciiOutsideChanged: outside.pre.textContent !== '.:-=+*#%@\n@%#*+=-:.',
        reading: window.FX.demo(inside.demo),
      };
    });
    check('effects: FX.demo devuelve false dentro de una superficie de lectura', r.demoInside === false && r.reading === false);
    check('effects: en lectura un data-fx-demo inyectado nunca monta canvas', r.canvasInside === 0, `canvas=${r.canvasInside}`);
    check('effects: en lectura un data-fx-ascii inyectado nunca cambia', r.asciiInside === '.:-=+*#%@\n@%#*+=-:.');
    check('effects: control fuera de lectura, el mismo ASCII inyectado si cambia tras FX.scan()', r.asciiOutsideChanged);
    /* Un boton de demo apuntando al elemento inyectado en lectura: la region de estado explica el motivo. */
    const msg = await page.evaluate(() => {
      const card = document.querySelector('[data-effect="reading"]');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-fx-demo-for', 'probe-demo-in');
      btn.textContent = 'probe';
      const out = document.createElement('p');
      out.setAttribute('role', 'status');
      card.appendChild(btn);
      card.appendChild(out);
      btn.click();
      return out.textContent;
    });
    check('effects: en lectura la region de estado explica "superficie de lectura"', /superficie de lectura/.test(msg), msg);
    await context.close();
  }

  /* 7. Pausa. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    const heroOn = await canvasCount(page);
    await page.evaluate(() => document.querySelector('[data-fx-pause]').click());
    await page.waitForTimeout(300);
    const p = await page.evaluate(() => ({ pressed: document.querySelector('[data-fx-pause]').getAttribute('aria-pressed'), motion: document.documentElement.dataset.motion, count: window.FX.count(), label: document.querySelector('[data-fx-pause]').textContent.trim() }));
    check('effects: pausa deja aria-pressed="true", data-motion="reduced" y FX.count() en 0', heroOn === 1 && p.pressed === 'true' && p.motion === 'reduced' && p.count === 0 && p.label === 'Pausar animaciones', JSON.stringify(p));
    await page.evaluate(() => document.querySelector('[data-fx-pause]').click());
    const back = await poll(page, () => window.FX.count() === 1, null, 2000);
    const p2 = await page.evaluate(() => ({ pressed: document.querySelector('[data-fx-pause]').getAttribute('aria-pressed'), motion: document.documentElement.dataset.motion }));
    check('effects: al soltar la pausa vuelve el canvas del hero en 2000 ms', back && p2.pressed === 'false' && p2.motion === undefined, JSON.stringify(p2));

    /* Clic real desde la galeria y persistencia en sessionStorage. */
    await page.locator('[data-fx-pause]').first().scrollIntoViewIfNeeded();
    await page.locator('[data-fx-pause]').first().click();
    await page.waitForTimeout(300);
    const real = await page.evaluate(() => document.querySelector('[data-fx-pause]').getAttribute('aria-pressed'));
    check('effects: el clic real en Pausar animaciones deja aria-pressed="true"', real === 'true');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const kept = await page.evaluate(() => ({ pressed: document.querySelector('[data-fx-pause]').getAttribute('aria-pressed'), motion: document.documentElement.dataset.motion, count: window.FX.count() }));
    check('effects: la pausa se conserva al recargar (sessionStorage) y no monta canvas', kept.pressed === 'true' && kept.motion === 'reduced' && kept.count === 0, JSON.stringify(kept));
    await page.locator('[data-fx-pause]').first().click();
    await page.waitForTimeout(300);
    const freed = await page.evaluate(() => document.documentElement.dataset.motion);
    check('effects: soltar la pausa quita data-motion', freed === undefined);
    await context.close();
  }

  /* 8. Cambio externo de atributos (simulador del plan 03). */
  for (const [attr, value] of [['data-saver', 'on'], ['data-motion', 'reduced']]) {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    await page.evaluate(([a, v]) => document.documentElement.setAttribute(a, v), [attr, value]);
    const gone = await poll(page, () => window.FX.count() === 0, null, 500);
    check(`effects: poner ${attr}="${value}" deja 0 canvas en 500 ms`, gone);
    if (attr === 'data-motion') {
      const pressed = await page.evaluate(() => document.querySelector('[data-fx-pause]').getAttribute('aria-pressed'));
      check('effects: el boton de pausa refleja data-motion puesto desde fuera', pressed === 'true', pressed);
    }
    await page.evaluate((a) => document.documentElement.removeAttribute(a), attr);
    const back = await poll(page, () => window.FX.count() === 1, null, 2000);
    check(`effects: quitar ${attr} devuelve el canvas del hero en 2000 ms`, back);
    if (attr === 'data-motion') {
      const pressed = await page.evaluate(() => document.querySelector('[data-fx-pause]').getAttribute('aria-pressed'));
      check('effects: aria-pressed vuelve a "false" al quitar data-motion', pressed === 'false', pressed);
    }
    await context.close();
  }

  /* 9. Sin errores de consola en la interaccion completa, por http y file://. */
  for (const [label, url] of [['http', httpUrl(env, page0)], ['file', fileUrl(page0)]]) {
    const { context, page, log } = await visit(env, url, { ctx: DESKTOP, wait: 2500 });
    await page.locator('[data-fx-demo-for="demo-slats"]').scrollIntoViewIfNeeded();
    await page.locator('[data-fx-demo-for="demo-slats"]').click();
    await page.waitForTimeout(800);
    check(`effects: ${label} cero errores de consola, pageerror, 4xx ni origenes externos tras activar una demo`, log.console.length === 0 && log.pageerrors.length === 0 && log.bad.length === 0 && log.external.length === 0, [...log.console, ...log.pageerrors, ...log.bad, ...log.external].join(' ; '));
    await context.close();
  }
};

/* ---------- stage: components ---------- */

const FAMILIES = ['button', 'card', 'badge', 'nav', 'footer', 'form', 'crt', 'ascii', 'pause'];
const STATE_KEYS = ['normal', 'hover', 'focus', 'disabled', 'reduced'];

STAGES.components = async (env) => {
  const page0 = 'system.html';

  /* 1. Estructura: familias, matriz de estados, ejemplos en vivo, etiquetas, formulario y scrim. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 2500 });
    const info = await page.evaluate(({ fams, states }) => {
      const out = { fams: [], inputsNoLabel: [], invalid: [], formsWithAction: [], scrimBad: [], h1: document.querySelectorAll('h1').length };
      for (const f of fams) {
        const box = document.querySelector(`[data-component="${f}"]`);
        const keys = box ? new Set([...box.querySelectorAll('.state-cell')].map((c) => c.getAttribute('data-state'))) : new Set();
        out.fams.push({
          f,
          exists: Boolean(box),
          h3: box ? box.querySelectorAll('h3').length : 0,
          states: states.filter((s) => keys.has(s)).length,
          live: box ? box.querySelectorAll('.live').length : 0,
          samples: box ? box.querySelectorAll('.state-cell:not([data-applies="false"]) .state-sample').length : 0,
        });
      }
      for (const el of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
        if (!el.labels || el.labels.length === 0) out.inputsNoLabel.push(el.id || el.name || el.tagName);
      }
      for (const el of document.querySelectorAll('[aria-invalid="true"]')) {
        const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        const ok = ids.length > 0 && ids.every((id) => {
          const t = document.getElementById(id);
          return t && t.textContent.trim().length > 0;
        });
        out.invalid.push({ id: el.id, ok });
      }
      for (const f of document.forms) {
        if (f.hasAttribute('action') || /post/i.test(f.getAttribute('method') || '')) out.formsWithAction.push(f.id || 'form');
      }
      for (const card of document.querySelectorAll('.card--gradient, .card--pixel')) {
        for (const t of card.querySelectorAll('h4, p, a')) {
          if (!t.closest('.fx-content')) out.scrimBad.push(t.textContent.trim().slice(0, 20));
        }
        const c = card.querySelector('.fx-content');
        const bg = c ? getComputedStyle(c).backgroundColor : '';
        const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(bg);
        if (!m || Number(m[1]) < 0.5) out.scrimBad.push(`scrim ${bg}`);
      }
      out.disabledBtn = document.querySelectorAll('button[disabled]').length;
      out.ariaDisabled = document.querySelectorAll('[aria-disabled="true"]').length;
      out.sims = document.querySelectorAll('[data-sim]').length;
      out.simGroup = Boolean(document.querySelector('#titulo-simulador'));
      out.headerPause = document.querySelectorAll('body > header [data-fx-pause]').length;
      out.pauseLabels = [...document.querySelectorAll('[data-fx-pause]')].map((b) => b.textContent.trim());
      out.componentsH2 = Boolean(document.querySelector('#componentes h2'));
      out.canvasKinds = document.querySelectorAll('.card [data-fx], .crt [data-fx]').length;
      return out;
    }, { fams: FAMILIES, states: STATE_KEYS });

    check('components: existen los nueve data-component con un h3 cada uno', info.fams.every((x) => x.exists && x.h3 === 1), info.fams.filter((x) => !x.exists || x.h3 !== 1).map((x) => x.f).join(','));
    check('components: cada familia tiene la matriz Normal, Hover, Foco, Deshabilitado y Movimiento reducido', info.fams.every((x) => x.states === 5), info.fams.map((x) => `${x.f}=${x.states}`).join(' '));
    check('components: cada familia tiene una muestra en vivo y al menos una muestra de estado en la matriz', info.fams.every((x) => x.live === 1 && x.samples >= 1), info.fams.map((x) => `${x.f}:${x.live}/${x.samples}`).join(' '));
    check('components: hay un solo h1 en toda la pagina y un h2 Componentes', info.h1 === 1 && info.componentsH2, `h1=${info.h1}`);
    check('components: hay al menos un button[disabled] y un [aria-disabled="true"]', info.disabledBtn >= 1 && info.ariaDisabled >= 1, `disabled=${info.disabledBtn} aria=${info.ariaDisabled}`);
    check('components: el simulador tiene sus dos interruptores', info.sims === 2 && info.simGroup, `sims=${info.sims}`);
    check('components: la cabecera tiene un unico boton de pausa y todas las etiquetas son "Pausar animaciones"', info.headerPause === 1 && info.pauseLabels.length >= 3 && info.pauseLabels.every((l) => l === 'Pausar animaciones'), JSON.stringify(info.pauseLabels));
    check('components: todo input, select y textarea tiene al menos una etiqueta asociada', info.inputsNoLabel.length === 0, info.inputsNoLabel.join(','));
    check('components: cada campo invalido tiene aria-describedby hacia un id existente con texto', info.invalid.length >= 1 && info.invalid.every((x) => x.ok), JSON.stringify(info.invalid));
    check('components: ningun form tiene action ni method post', info.formsWithAction.length === 0, info.formsWithAction.join(','));
    check('components: el texto de las cards sobre gradiente vive dentro de .fx-content con scrim de 50 por ciento o mas', info.scrimBad.length === 0, info.scrimBad.join(' ; '));
    check('components: ningun componente registra un efecto automatico (sin data-fx en cards ni CRT)', info.canvasKinds === 0, `data-fx=${info.canvasKinds}`);

    /* Objetivos tactiles: 44 px (24 px para .link-inline). Los elementos ocultos miden 0 y se omiten. */
    const sizes = await page.evaluate(() => {
      const bad = [];
      let seen = 0;
      const test = (sel, min) =>
        document.querySelectorAll(sel).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          seen += 1;
          if (r.width < min - 0.5 || r.height < min - 0.5) bad.push(`${sel} "${el.textContent.trim().slice(0, 18)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        });
      test('.btn', 44);
      test('.input', 44);
      test('select', 44);
      test('textarea', 44);
      test('summary', 44);
      test('.nav a', 44);
      test('.link-inline', 24);
      return { bad, seen };
    });
    check(`components: ${sizes.seen} objetivos visibles miden 44 px (24 px los enlaces en linea) o mas`, sizes.bad.length === 0 && sizes.seen > 40, sizes.bad.slice(0, 5).join(' ; '));

    /* Recorrido con la tecla Tab: cada elemento enfocado muestra un contorno de 2 px o mas. */
    const walk = [];
    for (let i = 0; i < 150; i += 1) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          label: (el.textContent || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 22),
          style: cs.outlineStyle,
          width: parseFloat(cs.outlineWidth),
          comp: Boolean(el.closest('#componentes')),
        };
      });
      if (r) walk.push(r);
    }
    const noRing = walk.filter((w) => w.style === 'none' || w.width < 2);
    const inComp = walk.filter((w) => w.comp).length;
    check(`components: ${walk.length} elementos enfocados con Tab (${inComp} en #componentes) con outline de 2 px o mas`, walk.length >= 100 && inComp >= 30 && noRing.length === 0, noRing.slice(0, 5).map((w) => `${w.tag} "${w.label}" ${w.style} ${w.width}px`).join(' ; ') || `visitados=${walk.length}`);
    await context.close();
  }

  /* 2. Pausa de cabecera, simuladores y movimiento permitido. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: DESKTOP, wait: 3000 });
    const durations = await page.evaluate(() => {
      const a = document.getAnimations().filter((x) => x.animationName === 'crt-blink');
      return a.map((x) => ({ d: x.effect.getComputedTiming().duration, it: x.effect.getComputedTiming().iterations }));
    });
    check('components: con movimiento permitido el cursor CRT anima con 1000 ms o mas', durations.length >= 1 && durations.every((x) => x.d >= 1000 && x.it === Infinity), JSON.stringify(durations));
    const forced = await page.evaluate(() => {
      const name = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).animationName : 'sin-elemento';
      };
      return {
        cursor: name('[data-component="crt"] [data-state="normal"] .crt-cursor'),
        cursorReduced: name('[data-component="crt"] [data-state="reduced"] .crt-cursor'),
        star: name('[data-component="button"] [data-state="normal"] .fx-star-border'),
        starReduced: name('[data-component="button"] [data-state="reduced"] .fx-star-border'),
      };
    });
    check('components: la clase .is-reduced apaga el cursor CRT y el borde estrella que animan en Normal', forced.cursor === 'crt-blink' && forced.cursorReduced === 'none' && forced.star !== 'none' && forced.starReduced === 'none', JSON.stringify(forced));

    const hero = await canvasCount(page);
    await page.locator('body > header [data-fx-pause]').click();
    await page.waitForTimeout(400);
    const p = await page.evaluate(() => ({
      pressed: document.querySelector('body > header [data-fx-pause]').getAttribute('aria-pressed'),
      motion: document.documentElement.dataset.motion,
      count: window.FX.count(),
      cursor: getComputedStyle(document.querySelector('.crt-cursor')).animationName,
      anims: document.getAnimations().length,
    }));
    check('components: Pausar animaciones de la cabecera deja aria-pressed true, data-motion reduced, FX.count() 0, cursor sin animacion y cero animaciones', hero === 1 && p.pressed === 'true' && p.motion === 'reduced' && p.count === 0 && p.cursor === 'none' && p.anims === 0, JSON.stringify({ hero, ...p }));
    await page.locator('body > header [data-fx-pause]').click();
    const back = await poll(page, () => window.FX.count() === 1, null, 2000);
    const p2 = await page.evaluate(() => ({ pressed: document.querySelector('body > header [data-fx-pause]').getAttribute('aria-pressed'), motion: document.documentElement.dataset.motion, cursor: getComputedStyle(document.querySelector('.crt-cursor')).animationName }));
    check('components: al soltar la pausa de la cabecera vuelve el canvas del hero en 2000 ms y el cursor anima', back && p2.pressed === 'false' && p2.motion === undefined && p2.cursor === 'crt-blink', JSON.stringify(p2));

    for (const [sim, attr, value, label] of [['motion', 'data-motion', 'reduced', 'prefers-reduced-motion'], ['saver', 'data-saver', 'on', 'saveData']]) {
      const btn = page.locator(`[data-sim="${sim}"]`);
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      const gone = await poll(page, () => window.FX.count() === 0, null, 1000);
      const s = await page.evaluate(([a, sm]) => ({
        pressed: document.querySelector(`[data-sim="${sm}"]`).getAttribute('aria-pressed'),
        attr: document.documentElement.getAttribute(a),
        cursor: getComputedStyle(document.querySelector('.crt-cursor')).animationName,
        pause: document.querySelector('body > header [data-fx-pause]').getAttribute('aria-pressed'),
      }), [attr, sim]);
      check(`components: el simulador de ${label} deja ${attr}="${value}", 0 canvas y el cursor sin animacion`, gone && s.attr === value && s.pressed === 'true' && s.cursor === 'none', JSON.stringify(s));
      if (sim === 'motion') check('components: el simulador de movimiento mantiene sincronizado el boton de pausa de la cabecera', s.pause === 'true', s.pause);
      await btn.click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const returned = await poll(page, () => window.FX.count() === 1, null, 2000);
      const off = await page.evaluate(([a, sm]) => ({ attr: document.documentElement.getAttribute(a), pressed: document.querySelector(`[data-sim="${sm}"]`).getAttribute('aria-pressed') }), [attr, sim]);
      check(`components: al apagar el simulador de ${label} regresa el canvas del hero en 2000 ms`, returned && off.attr === null && off.pressed === 'false', JSON.stringify(off));
    }

    /* Formulario de ejemplo: enviarlo no cambia la URL ni sale a ninguna parte. */
    const before = page.url();
    const posts = [];
    page.on('request', (r) => r.method() !== 'GET' && posts.push(r.method() + ' ' + r.url()));
    await page.locator('#form-ejemplo button[type="submit"]').scrollIntoViewIfNeeded();
    await page.locator('#form-ejemplo button[type="submit"]').click();
    await page.waitForTimeout(200);
    const status = await page.locator('#form-ejemplo [role="status"]').textContent();
    check('components: enviar el formulario no cambia la URL, no hace peticiones y escribe el estado', page.url() === before && posts.length === 0 && /no se env/.test(status), `url=${page.url() === before} posts=${posts.length} estado="${status}"`);
    await context.close();
  }

  /* 3. prefers-reduced-motion real: el boton de pausa nace pulsado y apagado. */
  {
    const { context, page } = await visit(env, httpUrl(env, page0), { ctx: { ...DESKTOP, reducedMotion: 'reduce' }, wait: 1500 });
    const r = await page.evaluate(() => {
      const b = document.querySelector('body > header [data-fx-pause]');
      return {
        pressed: b.getAttribute('aria-pressed'),
        disabled: b.disabled,
        cursor: getComputedStyle(document.querySelector('.crt-cursor')).animationName,
        anims: document.getAnimations().length,
        canvas: window.FX.count(),
      };
    });
    check('components: con prefers-reduced-motion la pausa arranca aria-pressed true y disabled, sin animaciones ni canvas', r.pressed === 'true' && r.disabled === true && r.cursor === 'none' && r.anims === 0 && r.canvas === 0, JSON.stringify(r));
    await context.close();
  }

  /* 4. Mobile: menu details, pausa visible y sin desborde. */
  for (const [label, w, h] of [['390', 390, 844], ['320', 320, 640]]) {
    const v = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: w, height: h }, isMobile: true, hasTouch: true }, wait: 800 });
    const r = await v.page.evaluate(() => {
      const vis = (el) => {
        if (!el) return false;
        const rc = el.getBoundingClientRect();
        return rc.width > 0 && rc.height > 0;
      };
      const header = document.querySelector('body > header');
      const pause = header.querySelector('[data-fx-pause]');
      const pr = pause.getBoundingClientRect();
      return {
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
        menu: vis(header.querySelector('.nav__menu summary')),
        bar: vis(header.querySelector('.nav__list--bar')),
        pause: vis(pause) && pr.right <= window.innerWidth + 0.5 && !pause.closest('.nav__menu'),
      };
    });
    check(`components: a ${label} px sin desborde horizontal`, r.sw <= r.iw, `scrollWidth=${r.sw} innerWidth=${r.iw}`);
    check(`components: a ${label} px la cabecera muestra el menu colapsado, oculta la barra y deja Pausar animaciones visible fuera del menu`, r.menu && !r.bar && r.pause, JSON.stringify(r));
    if (w === 390) {
      await v.page.locator('body > header .nav__menu summary').click();
      const open = await v.page.evaluate(() => {
        const d = document.querySelector('body > header .nav__menu');
        const links = [...d.querySelectorAll('a')].filter((a) => a.getBoundingClientRect().height > 0);
        return { open: d.open, links: links.length };
      });
      check('components: el menu colapsado abre con summary y muestra los enlaces', open.open && open.links === 8, JSON.stringify(open));
    }
    await v.context.close();
  }

  /* 5. Sin JavaScript el menu colapsado funciona (details nativo). */
  {
    const v = await visit(env, httpUrl(env, page0), { ctx: { viewport: { width: 390, height: 844 }, isMobile: true, javaScriptEnabled: false }, wait: 300 });
    await v.page.locator('body > header .nav__menu summary').click();
    const open = await v.page.evaluate(() => document.querySelector('body > header .nav__menu').open);
    check('components: sin JavaScript el menu details se abre', open === true);
    await v.context.close();
  }
};

/* ---------- capturas finales (--shots) ---------- */

const FINAL_SHOT_DIR = path.join(ROOT, 'reports/shots');
const FINAL_SHOT_LIMIT = 400 * 1024;

async function finalShots(env) {
  fs.mkdirSync(FINAL_SHOT_DIR, { recursive: true });
  const target = (name) => path.join(FINAL_SHOT_DIR, name);
  const jobs = [
    { name: 'system-desktop-hero.jpg', ctx: DESKTOP, hero: true },
    { name: 'system-mobile-hero.jpg', ctx: MOBILE, hero: true },
    { name: 'system-desktop-componentes.jpg', ctx: DESKTOP, section: '#componentes' },
    { name: 'system-mobile-componentes.jpg', ctx: MOBILE, section: '#componentes' },
    { name: 'system-desktop-efectos.jpg', ctx: DESKTOP, section: '#efectos' },
    { name: 'system-mobile-efectos.jpg', ctx: MOBILE, section: '#efectos' },
    { name: 'system-desktop-efectos-sinjs.jpg', ctx: { ...DESKTOP, javaScriptEnabled: false }, section: '#efectos' },
    { name: 'system-mobile-efectos-reducido.jpg', ctx: { ...MOBILE, reducedMotion: 'reduce' }, section: '#efectos' },
  ];
  for (const job of jobs) {
    const v = await visit(env, httpUrl(env, 'system.html'), { ctx: { ...job.ctx, deviceScaleFactor: 1 }, wait: 2800 });
    const vp = job.ctx.viewport;
    let size = 0;
    let used = '';
    if (job.hero) {
      await v.page.screenshot({ path: target(job.name), type: 'jpeg', quality: 60, clip: { x: 0, y: 0, width: vp.width, height: vp.height } });
      size = fs.statSync(target(job.name)).size;
      used = `${vp.width}x${vp.height}`;
    } else {
      const box = await v.page.evaluate((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height };
      }, job.section);
      for (const maxH of [2600, 2200, 1800, 1400, 1000]) {
        const height = Math.min(box.height, maxH);
        await v.page.screenshot({ path: target(job.name), type: 'jpeg', quality: 60, fullPage: true, clip: { x: 0, y: box.top, width: vp.width, height } });
        size = fs.statSync(target(job.name)).size;
        used = `${vp.width}x${Math.round(height)}`;
        if (size < FINAL_SHOT_LIMIT) break;
      }
    }
    check(`shots: ${job.name} (${used}, ${(size / 1024).toFixed(0)} KB) pesa menos de 400 KB`, size > 0 && size < FINAL_SHOT_LIMIT);
    await v.context.close();
  }
}

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
      if (s === 'components' && shots) {
        console.log('--- capturas finales');
        await finalShots(env);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`\n${passes} PASS, ${failures} FAIL`);
  console.log(`RESULT: ${failures ? 'FAIL (exit 1: al menos un check fallo)' : 'PASS (exit 0: ningun check fallo)'}`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
