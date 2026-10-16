#!/usr/bin/env node
/*
 * measure-lighthouse.mjs: Lighthouse sobre el build de produccion servido con brotli.
 * Objetivos: /system (baseline) y /system?mount=grainient (con un original montado).
 * Factores: mobile (--form-factor=mobile) y desktop (--preset=desktop). 3 corridas por combinacion y mediana.
 *
 * Uso: node scripts/measure-lighthouse.mjs
 * Lighthouse: variable LIGHTHOUSE_BIN o node_modules/.bin/lighthouse del primer ancestro que lo tenga.
 * Salida: 0 compuertas verdes, 1 alguna compuerta en rojo, 2 falta dist/, Lighthouse o Chrome.
 * Compuertas: accesibilidad >= 95 en las 12 corridas; CLS <= 0.01 en las 6 del baseline;
 * originalChunkRequested false en todo el baseline y true en las 6 con ?mount=grainient.
 * Informativo: performance >= 90 y LCP < 2000 ms en mobile.
 * Las corridas son asincronas: el servidor estatico vive en este mismo proceso y no puede bloquearse.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { buildSha256, median, originalChunkFiles, readManifest } from './lib/manifest.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const REPORTS = path.join(APP, 'reports');
const TMP = path.join(REPORTS, '.tmp');
const OUT = path.join(APP, 'public', 'measurements', 'lighthouse-summary.json');
const RUNS = 3;
// Render por software: sin esto Chromium headless no crea contexto WebGL y el original no pinta.
const CHROME_FLAGS = '--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist';

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
  console.error('measure-lighthouse: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
  process.exit(2);
}
const bin = findLighthouse();
if (!bin) {
  console.error('measure-lighthouse: no encuentro Lighthouse. Define LIGHTHOUSE_BIN o instala lighthouse en el repositorio principal.');
  process.exit(2);
}
console.log(`Lighthouse: ${bin}`);
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

function extract(base) {
  const json = JSON.parse(fs.readFileSync(`${base}.report.json`, 'utf8'));
  const a = json.audits;
  const requests = a['network-requests']?.details?.items ?? [];
  const summary = a['resource-summary']?.details?.items ?? [];
  const script = summary.find((i) => i.resourceType === 'script');
  return {
    performance: Math.round(json.categories.performance.score * 100),
    accessibility: Math.round(json.categories.accessibility.score * 100),
    bestPractices: Math.round(json.categories['best-practices'].score * 100),
    lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
    cls: Math.round(a['cumulative-layout-shift'].numericValue * 1000) / 1000,
    tbtMs: Math.round(a['total-blocking-time'].numericValue),
    transferBytes: Math.round(a['total-byte-weight']?.numericValue ?? 0),
    scriptBytes: Math.round(script?.transferSize ?? 0),
    requests: requests.length,
    originalChunkRequested: requests.some((r) => chunkFiles.some((f) => String(r.url).endsWith(f))),
    chromium: json.environment?.hostUserAgent ?? null,
    html: `${base}.report.html`,
  };
}

const TARGETS = [
  { id: 'baseline', label: 'Baseline /system', path: '/system' },
  { id: 'mounted', label: 'Con Grainient montado', path: '/system?mount=grainient' },
];
const FACTORS = ['mobile', 'desktop'];

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const hash = buildSha256(DIST);
const server = await startStaticServer({ root: DIST, compress: true });
console.log(`Servidor en ${server.url} (brotli, loopback). Build ${hash.slice(0, 12)}.`);

const combos = [];
let userAgent = null;
try {
  for (const target of TARGETS) {
    for (const factor of FACTORS) {
      const runs = [];
      for (let i = 1; i <= RUNS; i += 1) {
        const base = path.join(TMP, `${target.id}-${factor}-${i}`);
        await runLighthouse(`${server.url}${target.path}`, factor, base);
        const r = extract(base);
        userAgent ??= r.chromium;
        runs.push(r);
        console.log(
          `${target.id} ${factor} ${i}/${RUNS}: perf ${r.performance}, a11y ${r.accessibility}, bp ${r.bestPractices}, LCP ${r.lcpMs} ms, CLS ${r.cls}, TBT ${r.tbtMs} ms, ${(r.transferBytes / 1024).toFixed(0)} KB, chunk ${r.originalChunkRequested ? 'si' : 'no'}`,
        );
      }
      const ordered = [...runs].sort((a, b) => a.performance - b.performance || a.lcpMs - b.lcpMs);
      const rep = ordered[Math.floor(ordered.length / 2)];
      const m = (f) => median(runs.map((r) => r[f]));
      combos.push({
        target: target.id,
        label: target.label,
        path: target.path,
        factor,
        runs: runs.map(({ html, chromium, ...rest }) => rest),
        median: {
          performance: m('performance'),
          accessibility: m('accessibility'),
          bestPractices: m('bestPractices'),
          lcpMs: m('lcpMs'),
          cls: m('cls'),
          tbtMs: m('tbtMs'),
          transferBytes: m('transferBytes'),
          scriptBytes: m('scriptBytes'),
          requests: m('requests'),
        },
        representativeRun: { performance: rep.performance, lcpMs: rep.lcpMs },
        originalChunkRequestedInAllRuns: runs.every((r) => r.originalChunkRequested),
        originalChunkRequestedInAnyRun: runs.some((r) => r.originalChunkRequested),
        _repHtml: rep.html,
      });
    }
  }
} finally {
  await server.close();
}

// HTML de la corrida representativa del baseline.
for (const factor of FACTORS) {
  const c = combos.find((x) => x.target === 'baseline' && x.factor === factor);
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.copyFileSync(c._repHtml, path.join(REPORTS, `lighthouse-system-${factor}.report.html`));
}
for (const c of combos) delete c._repHtml;

const allRuns = combos.flatMap((c) => c.runs.map((r) => ({ ...r, target: c.target })));
const baselineRuns = allRuns.filter((r) => r.target === 'baseline');
const mountedRuns = allRuns.filter((r) => r.target === 'mounted');
const gates = {
  'accesibilidad >= 95 en las 12 corridas': allRuns.length === 12 && allRuns.every((r) => r.accessibility >= 95),
  'CLS <= 0.01 en las 6 corridas del baseline': baselineRuns.length === 6 && baselineRuns.every((r) => r.cls <= 0.01),
  'ningun chunk de original pedido en las 6 corridas del baseline': baselineRuns.every((r) => !r.originalChunkRequested),
  'chunk del original pedido en las 6 corridas con ?mount=grainient': mountedRuns.length === 6 && mountedRuns.every((r) => r.originalChunkRequested),
};
const mobileBaseline = combos.find((c) => c.target === 'baseline' && c.factor === 'mobile');
const verdicts = {
  'mobile baseline: performance mediana >= 90': {
    ok: mobileBaseline.median.performance >= 90,
    value: mobileBaseline.median.performance,
  },
  'mobile baseline: LCP mediano < 2000 ms': { ok: mobileBaseline.median.lcpMs < 2000, value: mobileBaseline.median.lcpMs },
};
const failedGates = Object.entries(gates).filter(([, ok]) => !ok).map(([k]) => k);

const summary = {
  generatedAt: new Date().toISOString(),
  lighthouseVersion: lhVersion,
  userAgent,
  chromeFlags: CHROME_FLAGS,
  server: 'servidor estatico propio con brotli calidad 11 en 127.0.0.1',
  buildSha256: hash,
  runsPerCombination: RUNS,
  combos,
  gates: Object.fromEntries(Object.entries(gates).map(([k, ok]) => [k, ok ? 'PASS' : 'FAIL'])),
  verdicts: Object.fromEntries(Object.entries(verdicts).map(([k, v]) => [k, { result: v.ok ? 'PASS' : 'NO CUMPLE', value: v.value }])),
  caveat:
    'Chromium headless renderiza WebGL por software (SwiftShader): el tiempo de hilo principal y el TBT salen exagerados. Hay que confirmarlo en una GPU real.',
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(summary, null, 2) + '\n');
fs.rmSync(TMP, { recursive: true, force: true });

for (const [k, ok] of Object.entries(gates)) console.log(`${ok ? 'PASS' : 'FAIL'} ${k}`);
for (const [k, v] of Object.entries(verdicts)) console.log(`${v.ok ? 'PASS' : 'INFO'} ${k} (${v.value})`);
console.log(`Escrito ${path.relative(APP, OUT)}`);
process.exit(failedGates.length ? 1 : 0);
