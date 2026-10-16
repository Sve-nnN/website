#!/usr/bin/env node
/*
 * measure-home.mjs: Lighthouse sobre la home (/ y /en) del build de produccion servido con brotli.
 *
 * Uso: node scripts/measure-home.mjs [--lang=es|en|all] [--factor=mobile|desktop|all] [--runs=N] [--label=hero|final]
 * Por defecto: --lang=all --factor=all --runs=3 --label=hero.
 * Lighthouse: variable LIGHTHOUSE_BIN o node_modules/.bin/lighthouse del primer ancestro que lo tenga.
 * Escribe en designs/redesign-v3/reports/home-v4/: lighthouse-<lang>-<factor>.report.html (corrida mediana)
 * y lighthouse-summary.json. Con filtros fusiona: reemplaza solo las combinaciones medidas, siempre que
 * el hash del build sea el mismo (si cambio, descarta las anteriores).
 * Compuertas (salida 1 si alguna falla): accesibilidad 100 en todas las corridas, CLS 0 en las corridas mobile,
 * mediana mobile de performance >= 90 y de LCP < 2000 ms, color-contrast aprobado y ningun chunk de React Bits pedido en mobile.
 * El TBT, el LCP de desktop y el peso de JS son informativos (WebGL por software exagera el TBT).
 * Salida 2 si falta dist/, Lighthouse o Chrome. El servidor estatico vive en este proceso: las corridas son asincronas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { buildSha256, median, originalChunkFiles, readManifest } from './lib/manifest.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const REPORTS = path.resolve(APP, '..', 'reports', 'home-v4');
const TMP = path.join(APP, 'reports', '.tmp');
const OUT = path.join(REPORTS, 'lighthouse-summary.json');
// Render por software: sin esto Chromium headless no crea contexto WebGL y el original no pinta.
const CHROME_FLAGS = '--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist';
const TARGETS = { es: '/', en: '/en' };
const THRESHOLDS = { accessibility: 100, cls: 0, performanceMobileMedian: 90, lcpMobileMedianMs: 2000 };

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).slice(name.length + 3);
const langArg = arg('lang', 'all');
const factorArg = arg('factor', 'all');
const label = arg('label', 'hero');
const RUNS = Number.parseInt(arg('runs', '3'), 10);
const langs = langArg === 'all' ? ['es', 'en'] : [langArg];
const factors = factorArg === 'all' ? ['mobile', 'desktop'] : [factorArg];
if (!langs.every((l) => TARGETS[l]) || !factors.every((f) => ['mobile', 'desktop'].includes(f)) || !(RUNS >= 1) || !['hero', 'final'].includes(label)) {
  console.error('measure-home: argumentos invalidos. Uso: --lang=es|en|all --factor=mobile|desktop|all --runs=N --label=hero|final');
  process.exit(2);
}

function findLighthouse() {
  if (process.env.LIGHTHOUSE_BIN) return fs.existsSync(process.env.LIGHTHOUSE_BIN) ? process.env.LIGHTHOUSE_BIN : null;
  let dir = APP;
  for (let i = 0; i < 10; i += 1) {
    const candidate = path.join(dir, 'node_modules', '.bin', 'lighthouse');
    if (fs.existsSync(candidate)) return candidate;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const manifest = readManifest(DIST);
if (!manifest || !fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('measure-home: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
  process.exit(2);
}
const bin = findLighthouse();
if (!bin) {
  console.error('measure-home: no encuentro Lighthouse. Define LIGHTHOUSE_BIN o instala lighthouse en el repositorio principal.');
  process.exit(2);
}
const lhVersion = spawnSync(bin, ['--version'], { encoding: 'utf8' }).stdout.trim();
const originals = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8'));
const chunkFiles = originalChunkFiles(manifest, originals.map((o) => o.name));

function runLighthouse(url, factor, base) {
  return new Promise((resolve, reject) => {
    const args = [
      url,
      '--only-categories=performance,accessibility,best-practices',
      '--output=json',
      '--output=html',
      `--output-path=${base}`,
      `--chrome-flags=${CHROME_FLAGS}`,
      '--quiet',
      factor === 'mobile' ? '--form-factor=mobile' : '--preset=desktop',
    ];
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 240_000);
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`lighthouse termino con ${code}: ${err.slice(0, 400)}`));
      resolve();
    });
  });
}

/** Primer node.selector que aparezca en los detalles de una auditoria (la forma cambia entre versiones de Lighthouse). */
function firstSelector(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.selector === 'string' && value.type === 'node') return value.selector;
  for (const child of Object.values(value)) {
    const found = firstSelector(child);
    if (found) return found;
  }
  return null;
}

function extract(base) {
  const json = JSON.parse(fs.readFileSync(`${base}.report.json`, 'utf8'));
  const a = json.audits;
  const requests = a['network-requests']?.details?.items ?? [];
  return {
    performance: Math.round(json.categories.performance.score * 100),
    accessibility: Math.round(json.categories.accessibility.score * 100),
    bestPractices: Math.round(json.categories['best-practices'].score * 100),
    lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
    cls: Math.round(a['cumulative-layout-shift'].numericValue * 1000) / 1000,
    tbtMs: Math.round(a['total-blocking-time'].numericValue),
    transferBytes: Math.round(a['total-byte-weight']?.numericValue ?? 0),
    jsBytes: requests.filter((r) => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize ?? 0), 0),
    cssBytes: requests.filter((r) => r.resourceType === 'Stylesheet').reduce((n, r) => n + (r.transferSize ?? 0), 0),
    chunksRequested: requests.map((r) => String(r.url).split('/').pop()).filter((f) => chunkFiles.some((c) => c.endsWith(f))),
    requests: requests.length,
    originalChunkRequested: requests.some((r) => chunkFiles.some((f) => String(r.url).endsWith(f))),
    colorContrast: a['color-contrast']?.score === 1 ? 'pass' : a['color-contrast']?.score === null ? 'n/a' : 'fail',
    // Lighthouse 13 trae el elemento LCP dentro del insight lcp-breakdown; las versiones anteriores tenian su propia auditoria.
    lcpElement: firstSelector(a['lcp-breakdown-insight']?.details) ?? firstSelector(a['largest-contentful-paint-element']?.details),
    chromium: json.environment?.hostUserAgent ?? null,
    html: `${base}.report.html`,
  };
}

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(REPORTS, { recursive: true });
const hash = buildSha256(DIST);
const server = await startStaticServer({ root: DIST, compress: true });
console.log(`Lighthouse: ${lhVersion}. Servidor en ${server.url} (brotli, loopback). Build ${hash.slice(0, 12)}. Etiqueta ${label}.`);

const fresh = [];
let userAgent = null;
try {
  for (const lang of langs) {
    for (const factor of factors) {
      const runs = [];
      for (let i = 1; i <= RUNS; i += 1) {
        const base = path.join(TMP, `${lang}-${factor}-${i}`);
        await runLighthouse(`${server.url}${TARGETS[lang]}`, factor, base);
        const r = extract(base);
        userAgent ??= r.chromium;
        runs.push(r);
        console.log(
          `${lang} ${factor} ${i}/${RUNS}: perf ${r.performance}, a11y ${r.accessibility}, bp ${r.bestPractices}, LCP ${r.lcpMs} ms, CLS ${r.cls}, TBT ${r.tbtMs} ms, ${(r.transferBytes / 1024).toFixed(0)} KB (JS ${(r.jsBytes / 1024).toFixed(1)}), ${r.requests} peticiones, contraste ${r.colorContrast}, chunk ${r.originalChunkRequested ? 'si' : 'no'}, LCP en ${r.lcpElement ?? '?'}`,
        );
      }
      const ordered = [...runs].sort((a, b) => a.performance - b.performance || a.lcpMs - b.lcpMs);
      const rep = ordered[Math.floor(ordered.length / 2)];
      const m = (f) => median(runs.map((r) => r[f]));
      fs.copyFileSync(rep.html, path.join(REPORTS, `lighthouse-${lang}-${factor}.report.html`));
      fresh.push({
        lang,
        factor,
        path: TARGETS[lang],
        runs: runs.map(({ html, chromium, ...rest }) => rest),
        median: {
          performance: m('performance'),
          accessibility: m('accessibility'),
          bestPractices: m('bestPractices'),
          lcpMs: m('lcpMs'),
          cls: m('cls'),
          tbtMs: m('tbtMs'),
          transferBytes: m('transferBytes'),
          jsBytes: m('jsBytes'),
          cssBytes: m('cssBytes'),
          requests: m('requests'),
        },
        representativeRun: { performance: rep.performance, lcpMs: rep.lcpMs },
        report: `lighthouse-${lang}-${factor}.report.html`,
      });
    }
  }
} finally {
  await server.close();
}

// Fusion con el resumen existente, solo si es del mismo build.
let kept = [];
if (fs.existsSync(OUT)) {
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (old.buildSha256 === hash) kept = old.combos.filter((c) => !fresh.some((f) => f.lang === c.lang && f.factor === c.factor));
  else console.log('El resumen anterior es de otro build: se descarta.');
}
const combos = [...kept, ...fresh].sort((a, b) => a.lang.localeCompare(b.lang) || a.factor.localeCompare(b.factor));

const mobile = combos.filter((c) => c.factor === 'mobile');
const runsOf = (list) => list.flatMap((c) => c.runs);
const gates = {
  'accesibilidad 100 en todas las corridas': runsOf(combos).every((r) => r.accessibility >= THRESHOLDS.accessibility),
  'CLS 0 en todas las corridas mobile': runsOf(mobile).every((r) => r.cls === THRESHOLDS.cls),
  'performance mobile, mediana >= 90': mobile.every((c) => c.median.performance >= THRESHOLDS.performanceMobileMedian),
  'LCP mobile, mediana < 2000 ms': mobile.every((c) => c.median.lcpMs < THRESHOLDS.lcpMobileMedianMs),
  'color-contrast aprobado en todas las corridas': runsOf(combos).every((r) => r.colorContrast !== 'fail'),
  'ningun chunk de React Bits pedido en mobile': runsOf(mobile).every((r) => !r.originalChunkRequested),
};
const failed = Object.entries(gates).filter(([, ok]) => !ok).map(([k]) => k);

const summary = {
  generatedAt: new Date().toISOString(),
  lighthouseVersion: lhVersion,
  userAgent,
  chromeFlags: CHROME_FLAGS,
  server: 'servidor estatico propio con brotli calidad 11 en 127.0.0.1',
  buildSha256: hash,
  label,
  runsPerCombination: RUNS,
  thresholds: THRESHOLDS,
  combos,
  gates: Object.fromEntries(Object.entries(gates).map(([k, ok]) => [k, ok ? 'PASS' : 'FAIL'])),
  tbtNote:
    'Chromium headless renderiza WebGL por software (SwiftShader): el TBT y el LCP de desktop salen exagerados. Se confirman en una GPU real. Son informativos, no compuertas (D-11).',
};
fs.writeFileSync(OUT, JSON.stringify(summary, null, 2) + '\n');
fs.rmSync(TMP, { recursive: true, force: true });

for (const [k, ok] of Object.entries(gates)) console.log(`${ok ? 'PASS' : 'FAIL'} ${k}`);
console.log(`Escrito ${path.relative(path.resolve(APP, '..', '..', '..'), OUT)}`);
process.exit(failed.length ? 1 : 0);
