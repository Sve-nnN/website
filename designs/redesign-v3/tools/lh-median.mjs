#!/usr/bin/env node
/*
 * lh-median.mjs: Lighthouse sobre system.html, 3 corridas por factor de forma y mediana.
 * Cero dependencias.
 *
 * Uso: node designs/redesign-v3/tools/lh-median.mjs
 *
 * - Busca node_modules/.bin/lighthouse subiendo desde esta carpeta.
 * - Levanta `npx -y serve@14` en loopback (127.0.0.1:4173), espera 200 en /system.html y lo
 *   mata al terminar. La configuracion (cleanUrls en false para que /system.html no redirija)
 *   vive en un archivo temporal, no en el repo.
 * - Corre mobile (--form-factor=mobile) y desktop (--preset=desktop), 3 veces cada uno, con
 *   performance, accesibilidad y mejores practicas.
 * - Copia el html de la corrida mediana (por performance) a reports/ y escribe
 *   reports/lighthouse-summary.json con las tres corridas, la mediana y los umbrales.
 *
 * Umbrales (termina con codigo 1 si alguno falla): accesibilidad >= 95 en todas las corridas,
 * CLS igual a 0 en todas las corridas y, en mobile, performance mediana >= 90 y LCP mediano < 2000 ms.
 * Una corrida atipica en frio no invalida la mediana. Si la mediana falla, se corrige el contenido,
 * no se relaja el umbral.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const URL_PAGE = `${ORIGIN}/system.html`;
const RUNS = 3;

function findLighthouse() {
  let dir = ROOT;
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, 'node_modules/.bin/lighthouse');
    if (fs.existsSync(candidate)) return candidate;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const median = (arr) => [...arr].sort((a, b) => a - b)[Math.floor(arr.length / 2)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor200(timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const r = await fetch(URL_PAGE);
      if (r.status === 200) return true;
    } catch {
      /* el servidor todavia no escucha */
    }
    await sleep(400);
  }
  return false;
}

function runLighthouse(bin, base, factor) {
  const args = [
    URL_PAGE,
    '--only-categories=performance,accessibility,best-practices',
    '--output=json',
    '--output=html',
    `--output-path=${base}`,
    '--chrome-flags=--headless=new',
    '--quiet',
    factor === 'mobile' ? '--form-factor=mobile' : '--preset=desktop',
  ];
  const r = spawnSync(bin, args, { encoding: 'utf8', timeout: 240000 });
  if (r.status !== 0) throw new Error(`lighthouse ${factor} termino con ${r.status}: ${(r.stderr || '').slice(0, 400)}`);
  const json = JSON.parse(fs.readFileSync(`${base}.report.json`, 'utf8'));
  const a = json.audits;
  const requests = (a['network-requests'] && a['network-requests'].details && a['network-requests'].details.items) || [];
  return {
    performance: Math.round(json.categories.performance.score * 100),
    accessibility: Math.round(json.categories.accessibility.score * 100),
    bestPractices: Math.round(json.categories['best-practices'].score * 100),
    lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
    cls: Math.round(a['cumulative-layout-shift'].numericValue * 1000) / 1000,
    tbtMs: Math.round(a['total-blocking-time'].numericValue),
    effectsJsRequested: requests.some((q) => /assets\/js\/effects\.js/.test(q.url)),
    html: `${base}.report.html`,
  };
}

async function main() {
  const bin = findLighthouse();
  if (!bin) {
    console.error('FAIL no se encontro node_modules/.bin/lighthouse subiendo desde tools/');
    process.exit(2);
  }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-redesign-v3-'));
  const configPath = path.join(work, 'serve.json');
  fs.writeFileSync(configPath, JSON.stringify({ cleanUrls: false, directoryListing: false }));

  const server = spawn('npx', ['-y', 'serve@14', '-l', `tcp://127.0.0.1:${PORT}`, '-c', configPath, ROOT], { cwd: work, stdio: 'ignore' });
  const stopServer = () => {
    try {
      server.kill('SIGTERM');
    } catch {
      /* ya termino */
    }
  };
  process.on('exit', stopServer);

  const summary = { generatedAt: new Date().toISOString(), url: URL_PAGE, lighthouse: spawnSync(bin, ['--version'], { encoding: 'utf8' }).stdout.trim(), runs: RUNS, thresholds: {}, factors: {} };
  let failed = [];
  try {
    if (!(await waitFor200(60000))) {
      console.error('FAIL serve@14 no respondio 200 en /system.html');
      process.exit(2);
    }
    console.log(`serve@14 escuchando en ${ORIGIN} (loopback)`);

    for (const factor of ['mobile', 'desktop']) {
      const runs = [];
      for (let i = 1; i <= RUNS; i += 1) {
        const r = runLighthouse(bin, path.join(work, `${factor}-${i}`), factor);
        runs.push(r);
        console.log(`${factor} corrida ${i}: performance ${r.performance}, accesibilidad ${r.accessibility}, mejores practicas ${r.bestPractices}, LCP ${r.lcpMs} ms, CLS ${r.cls}, TBT ${r.tbtMs} ms, effects.js ${r.effectsJsRequested ? 'si' : 'no'}`);
      }
      const ordered = [...runs].sort((a, b) => a.performance - b.performance || a.lcpMs - b.lcpMs);
      const mid = ordered[Math.floor(ordered.length / 2)];
      const dest = path.join(ROOT, `reports/lighthouse-system-${factor}.report.html`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(mid.html, dest);
      const clean = (r) => ({ performance: r.performance, accessibility: r.accessibility, bestPractices: r.bestPractices, lcpMs: r.lcpMs, cls: r.cls, tbtMs: r.tbtMs, effectsJsRequested: r.effectsJsRequested });
      summary.factors[factor] = {
        runs: runs.map(clean),
        median: {
          performance: median(runs.map((r) => r.performance)),
          accessibility: median(runs.map((r) => r.accessibility)),
          bestPractices: median(runs.map((r) => r.bestPractices)),
          lcpMs: median(runs.map((r) => r.lcpMs)),
          cls: median(runs.map((r) => r.cls)),
          tbtMs: median(runs.map((r) => r.tbtMs)),
        },
        reportHtml: `reports/lighthouse-system-${factor}.report.html`,
        reportRun: `corrida de performance ${mid.performance} y LCP ${mid.lcpMs} ms`,
        effectsJsRequestedInAnyRun: runs.some((r) => r.effectsJsRequested),
        note: factor === 'mobile'
          ? 'El viewport emulado de 412 px cae bajo el gate de 767 px: mobile mide el fallback CSS, no el shader.'
          : 'Con el preset desktop el shader corre: effects.js aparece en las peticiones de red.',
      };
    }

    const m = summary.factors.mobile;
    const d = summary.factors.desktop;
    const checks = [
      ['accesibilidad >= 95 en las 6 corridas', [...m.runs, ...d.runs].every((r) => r.accessibility >= 95)],
      ['CLS igual a 0 en las 6 corridas', [...m.runs, ...d.runs].every((r) => r.cls === 0)],
      ['mobile: performance mediana >= 90', m.median.performance >= 90],
      ['mobile: LCP mediano < 2000 ms', m.median.lcpMs < 2000],
    ];
    summary.thresholds = Object.fromEntries(checks.map(([k, ok]) => [k, ok ? 'PASS' : 'FAIL']));
    failed = checks.filter(([, ok]) => !ok).map(([k]) => k);
    summary.result = failed.length ? 'FAIL' : 'PASS';

    fs.writeFileSync(path.join(ROOT, 'reports/lighthouse-summary.json'), JSON.stringify(summary, null, 2) + '\n');
    for (const [k, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${k}`);
    console.log(`mediana mobile: performance ${m.median.performance}, accesibilidad ${m.median.accessibility}, LCP ${m.median.lcpMs} ms, CLS ${m.median.cls}`);
    console.log(`mediana desktop: performance ${d.median.performance}, accesibilidad ${d.median.accessibility}, LCP ${d.median.lcpMs} ms, CLS ${d.median.cls}`);
    console.log(`RESULT: ${failed.length ? 'FAIL (exit 1)' : 'PASS (exit 0)'}`);
  } finally {
    stopServer();
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
