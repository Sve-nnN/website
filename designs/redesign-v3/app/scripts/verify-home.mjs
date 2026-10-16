#!/usr/bin/env node
/*
 * verify-home.mjs: harness Playwright de la home (fase 52).
 *
 * Uso:
 *   node scripts/verify-home.mjs --stage=<nombre>|all [--shots]
 *
 * Cada stage vive en scripts/home-stages/<nombre>.mjs y exporta `async function run(ctx)`.
 * ctx trae: check(nombre, ok, detalle), chromium, browser, server (con server.url), openPage(url, opciones),
 * paths (REPO, APP, DIST, REPORTS_HOME), shots (booleano) y lang('es'|'en') para armar URLs.
 * Orden de `all`: STAGE_ORDER. Un stage sin archivo se omite con INFO en `all` y es error (codigo 2) si se pide explicito.
 * Salida: 0 todo PASS, 1 algun FAIL, 2 stage inexistente, sin Playwright o sin dist/.
 * Esta herramienta nunca corre verify-app.mjs --stage=report: ese compara el hash del build con los JSON medidos.
 *
 * Playwright se resuelve desde el node_modules del repositorio principal (ancestros); no se instala en la app.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(APP, '..', '..', '..');
const DIST = path.join(APP, 'dist');
const REPORTS_HOME = path.resolve(APP, '..', 'reports', 'home');
const STAGES_DIR = path.join(APP, 'scripts', 'home-stages');
const CHROMIUM_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const STAGE_ORDER = ['tracer', 'chrome', 'proof', 'method', 'conversion', 'i18n', 'a11y', 'budget', 'isolation'];

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

const argv = process.argv.slice(2);
const stageArg = (argv.find((a) => a.startsWith('--stage=')) ?? '--stage=all').slice('--stage='.length);
const shots = argv.includes('--shots');
const explicit = stageArg !== 'all';
const names = explicit ? [stageArg] : STAGE_ORDER;
const stageFile = (n) => path.join(STAGES_DIR, `${n}.mjs`);

if (explicit && !fs.existsSync(stageFile(stageArg))) {
  die(2, `verify-home: el stage ${stageArg} no existe. Stages: ${STAGE_ORDER.join(', ')}`);
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  die(2, 'verify-home: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
}

let playwright;
try {
  playwright = await import('playwright');
} catch {
  die(2, 'verify-home: no se resuelve Playwright desde los ancestros de la app. Instala playwright en el repo principal o ajusta NODE_PATH.');
}
const { chromium } = playwright;

fs.mkdirSync(REPORTS_HOME, { recursive: true });
const server = await startStaticServer({ root: DIST, compress: true });
const browser = await chromium.launch({ args: CHROMIUM_ARGS });
const contexts = [];

/** Abre una pagina registrando consola, errores de pagina y peticiones. */
async function openPage(url, { viewport = { width: 1440, height: 900 }, contextOptions = {}, init, waitUntil = 'load' } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  contexts.push(context);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const log = { console: [], pageerrors: [], requests: [], external: [] };
  page.on('console', (m) => m.type() === 'error' && log.console.push(m.text()));
  page.on('pageerror', (e) => log.pageerrors.push(String(e)));
  page.on('request', (r) => {
    const u = new URL(r.url());
    log.requests.push(r.url());
    if (!['data:', 'blob:', 'about:'].includes(u.protocol) && u.hostname !== '127.0.0.1') log.external.push(r.url());
  });
  await page.goto(url, { waitUntil });
  return { context, page, log };
}

const ctx = {
  check,
  chromium,
  browser,
  server,
  openPage,
  paths: { REPO, APP, DIST, REPORTS_HOME },
  shots,
  lang: (l) => `${server.url}${l === 'en' ? '/en' : '/'}`,
};

try {
  for (const n of names) {
    if (!fs.existsSync(stageFile(n))) {
      console.log(`INFO stage ${n}: sin archivo, se omite`);
      continue;
    }
    console.log(`--- stage ${n} ---`);
    const mod = await import(pathToFileURL(stageFile(n)).href);
    await mod.run(ctx);
    await Promise.all(contexts.splice(0).map((c) => c.close().catch(() => {})));
  }
} finally {
  await Promise.all(contexts.splice(0).map((c) => c.close().catch(() => {})));
  await browser.close();
  await server.close();
}

console.log(`\n${passes} PASS, ${failures} FAIL`);
process.exit(failures ? 1 : 0);
