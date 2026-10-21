#!/usr/bin/env node
/*
 * verify-home-checks.mjs: runner de etapas de la home (52-06).
 *
 * Uso:
 *   node scripts/verify-home-checks.mjs --stage=i18n|copy|a11y|budget|isolation|all [--json=<ruta>] [--final-shots]
 *
 * Cada etapa es scripts/home-stages/<nombre>.mjs con `export async function run(ctx)`. Imprime una linea
 * PASS o FAIL por chequeo. Salida: 0 todo PASS, 2 falta dist/ o la etapa no existe, 1 algun FAIL.
 *
 * Este runner SUMA a scripts/verify-home.mjs (la puerta de reglas de diseno, que no se toca): comparte el
 * servidor estatico propio, la resolucion de Playwright desde los ancestros de la app y el manifiesto de Vite.
 * Sin dependencias nuevas ni paquetes instalados aqui.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { launch, loadPlaywright } from './lib/browser.mjs';
import { buildSha256, originalChunkFiles, readManifest } from './lib/manifest.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const REPORTS_HOME = path.join(APP, '..', 'reports', 'home');
const REPO = path.resolve(APP, '..', '..', '..'); // raiz del repositorio (designs/redesign-v3/app -> repo)
const STAGE_DIR = path.join(APP, 'scripts', 'home-stages');
const STAGE_ORDER = ['i18n', 'copy', 'a11y', 'budget', 'isolation'];

let passes = 0;
let failures = 0;
const checks = [];
let currentStage = 'runner';

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
  checks.push({ etapa: currentStage, name, ok: Boolean(ok), detail: String(detail) });
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
const jsonArg = argv.find((a) => a.startsWith('--json='));
const jsonPath = jsonArg ? jsonArg.slice('--json='.length) : null;
const wantShots = argv.includes('--final-shots');

/* ---------- dist/ ---------- */

const manifest = readManifest(DIST);
if (!manifest) {
  console.error('verify-home-checks: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
  process.exit(2);
}
const originalNames = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8')).map((o) => o.name);
const chunkFiles = originalChunkFiles(manifest, originalNames);

/* ---------- etapas ---------- */

const names = stageArg === 'all' ? STAGE_ORDER : [stageArg];
for (const n of names) {
  if (!fs.existsSync(path.join(STAGE_DIR, `${n}.mjs`))) {
    die(2, `verify-home-checks: la etapa ${n} no existe. Etapas: ${STAGE_ORDER.join(', ')}`);
  }
}
fs.mkdirSync(REPORTS_HOME, { recursive: true });

const { chromium } = await loadPlaywright();
const browser = await launch(chromium);
const server = await startStaticServer({ root: DIST, compress: true });
const url = (p) => `${server.url}${p}`;

/** Abre una ruta: registra errores de pagina/consola y las peticiones de chunks de origianles. */
async function openPage(p, { viewport = { width: 1440, height: 900 }, contextOptions = {}, init, wait = true } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  const consoleErrors = [];
  const chunks = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      consoleErrors.push(m.text());
      errors.push(m.text());
    }
  });
  page.on('request', (r) => chunkFiles.some((f) => r.url().endsWith(f)) && chunks.push(r.url().split('/').pop()));
  await page.goto(url(p), { waitUntil: 'load' });
  if (wait) await page.waitForSelector('h1').catch(() => {});
  return { context, page, errors, consoleErrors, chunks };
}

const lang = (l) => (l === 'en' ? '/en' : '/');

const shots = {
  async jpeg({ page, name, quality = 75 }) {
    fs.mkdirSync(REPORTS_HOME, { recursive: true });
    const file = path.join(REPORTS_HOME, name);
    await page.screenshot({ path: file, type: 'jpeg', quality });
    return { file, size: fs.statSync(file).size };
  },
};

const ctx = {
  check,
  browser,
  server,
  url,
  lang,
  openPage,
  shots,
  wantShots,
  paths: { APP, DIST, REPORTS_HOME },
  originalNames,
  chunkFiles,
};

for (const n of names) {
  currentStage = n;
  console.log(`--- etapa ${n} ---`);
  const mod = await import(pathToFileURL(path.join(STAGE_DIR, `${n}.mjs`)).href);
  if (typeof mod.run !== 'function') die(2, `verify-home-checks: la etapa ${n} no exporta run(ctx).`);
  await mod.run(ctx);
}

await browser.close();
await server.close();

/* ---------- evidencia JSON ---------- */

let buildHash = '';
try {
  buildHash = buildSha256(DIST);
} catch {
  buildHash = '';
}
const etapas = {};
for (const c of checks) {
  etapas[c.etapa] = etapas[c.etapa] ?? { pass: 0, fail: 0 };
  if (c.ok) etapas[c.etapa].pass += 1;
  else etapas[c.etapa].fail += 1;
}
if (jsonPath) {
  // Ruta absoluta tal cual; relativa, desde la raiz del repositorio (donde se invoca el comando), no desde la app.
  const out = path.isAbsolute(jsonPath) ? jsonPath : path.join(REPO, jsonPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify({ fecha: new Date().toISOString(), buildSha256: buildHash, etapas, checks }, null, 2)}\n`);
}

console.log(`\n${passes} PASS, ${failures} FAIL`);
for (const [n, r] of Object.entries(etapas)) console.log(`  ${n}: ${r.pass} PASS, ${r.fail} FAIL`);
process.exit(failures ? 1 : 0);
