#!/usr/bin/env node
/*
 * verify-originals.mjs: verifica los 16 originales de React Bits y el aislamiento de la app.
 *
 * Uso:
 *   node scripts/verify-originals.mjs [--stage=files|headers|license|deps|lazy|isolation|online|all] [--online]
 *
 * Stages: files, headers, license, deps, lazy, isolation y online (solo con --online o --stage=online).
 * Sin dependencias. Salida: 0 todo PASS, 1 algun FAIL, 2 uso incorrecto o falta dist/ para lazy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { registryUrl, sha256, splitOrigin } from './lib/origin-header.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIR = path.join(APP, 'src', 'components', 'reactbits');
const APP_REL = 'designs/redesign-v3/app';

const ORIGINALS = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8'));
const NAMES = ORIGINALS.map((o) => o.name);

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
const withOnline = argv.includes('--online');
const stageArg = (argv.find((a) => a.startsWith('--stage=')) ?? '--stage=all').slice('--stage='.length);
for (const a of argv) {
  if (!a.startsWith('--stage=') && a !== '--online') die(2, `verify-originals: argumento desconocido ${a}`);
}

function loadManifest() {
  const file = path.join(APP, 'reactbits.manifest.json');
  if (!fs.existsSync(file)) die(1, 'verify-originals: falta reactbits.manifest.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const read = (p) => fs.readFileSync(p, 'utf8');

/* ---------- files ---------- */

function stageFiles() {
  const manifest = loadManifest();
  const inManifest = manifest.components.map((c) => c.name);
  check(
    'files.1 el manifiesto trae los 16 originales de originals.json',
    NAMES.length === 16 && NAMES.every((n) => inManifest.includes(n)) && inManifest.length === 16,
    `manifiesto=${inManifest.length}`,
  );
  let total = 0;
  const missing = [];
  const unresolved = [];
  for (const c of manifest.components) {
    for (const f of c.files) {
      const file = path.join(TARGET_DIR, f.path);
      total += 1;
      if (!fs.existsSync(file)) {
        missing.push(f.path);
        continue;
      }
      if (file.endsWith('.tsx')) {
        for (const m of read(file).matchAll(/import\s+['"](\.\/[^'"]+\.css)['"]/g)) {
          if (!fs.existsSync(path.resolve(path.dirname(file), m[1]))) unresolved.push(`${f.path} -> ${m[1]}`);
        }
      }
    }
  }
  check('files.2 todos los archivos del manifiesto existen en disco', missing.length === 0, `archivos=${total} faltan=${missing.join(',') || 'ninguno'}`);
  check('files.3 cada import de CSS de un TSX resuelve', unresolved.length === 0, unresolved.join(',') || 'todos resuelven');
}

/* ---------- headers ---------- */

function stageHeaders() {
  const manifest = loadManifest();
  const bad = [];
  let total = 0;
  for (const c of manifest.components) {
    const expectedUrl = registryUrl(c.name);
    if (c.registryUrl !== expectedUrl) bad.push(`${c.name}: registryUrl del manifiesto`);
    for (const f of c.files) {
      total += 1;
      const file = path.join(TARGET_DIR, f.path);
      if (!fs.existsSync(file)) {
        bad.push(`${f.path}: falta`);
        continue;
      }
      const { header, body } = splitOrigin(read(file));
      if (!header) {
        bad.push(`${f.path}: sin cabecera @reactbits-origin`);
        continue;
      }
      if (header.registro !== expectedUrl) bad.push(`${f.path}: registro ${header.registro}`);
      if (header.componente !== c.name) bad.push(`${f.path}: componente ${header.componente}`);
      if (header.archivo !== path.posix.basename(f.path)) bad.push(`${f.path}: archivo ${header.archivo}`);
      if (header['sha256-body'] !== f.sha256Body) bad.push(`${f.path}: sha256 de la cabecera distinto del manifiesto`);
      if (sha256(body) !== f.sha256Body) bad.push(`${f.path}: el cuerpo no coincide con el manifiesto`);
    }
  }
  check('headers.1 cada archivo abre con @reactbits-origin, URL de registro correcta y sha256 del cuerpo igual al manifiesto', bad.length === 0, bad.length ? bad.slice(0, 4).join('; ') : `archivos=${total}`);
}

/* ---------- license ---------- */

function stageLicense() {
  const file = path.join(APP, 'LICENSES.md');
  if (!fs.existsSync(file)) {
    check('license.1 LICENSES.md existe', false);
    return;
  }
  const text = read(file);
  const required = ['MIT', 'Commons Clause', 'David Haz', 'Copyright (c) 2026', 'Esto no es asesoría legal'];
  const absent = required.filter((s) => !text.includes(s));
  check('license.1 LICENSES.md nombra MIT, Commons Clause, titular, copyright y la frase de asesoría legal', absent.length === 0, absent.length ? `faltan: ${absent.join(', ')}` : '');

  const block = /```text\n([\s\S]*?)\n```/.exec(text);
  const shaListed = /sha256 del texto descargado: `([0-9a-f]{64})`/.exec(text);
  const verbatim = block ? `${block[1]}\n` : '';
  check(
    'license.2 el texto verbatim hashea al sha256 declarado',
    Boolean(block && shaListed) && sha256(verbatim) === shaListed[1],
    shaListed ? `declarado=${shaListed[1].slice(0, 12)} calculado=${sha256(verbatim).slice(0, 12)}` : 'sin sha256 declarado',
  );

  const missingNames = NAMES.filter((n) => !text.includes(n));
  check('license.3 LICENSES.md nombra los 16 componentes', missingNames.length === 0, missingNames.join(',') || '16 nombres');
  check('license.4 LICENSES.md no usa guiones largos ni medios', !/[–—]/.test(text));
}

/* ---------- deps ---------- */

function stageDeps() {
  const pkg = JSON.parse(read(path.join(APP, 'package.json')));
  const runtime = Object.keys(pkg.dependencies ?? {}).sort();
  check('deps.1 dependencias de runtime exactamente react, react-dom y ogl', JSON.stringify(runtime) === JSON.stringify(['ogl', 'react', 'react-dom']), runtime.join(','));

  const all = new Set([...runtime, ...Object.keys(pkg.devDependencies ?? {})]);
  const banned = ['three', 'gsap', 'motion', 'framer-motion'].filter((b) => all.has(b));
  check('deps.2 package.json no declara three, gsap ni motion', banned.length === 0, banned.join(',') || 'limpio');

  const lockFile = path.join(APP, 'package-lock.json');
  const lock = fs.existsSync(lockFile) ? JSON.parse(read(lockFile)) : { packages: {} };
  const lockBanned = Object.keys(lock.packages ?? {}).filter((k) => /node_modules\/(three|gsap|motion|framer-motion)$/.test(k));
  check('deps.3 package-lock.json no resuelve three, gsap ni motion', lockBanned.length === 0, lockBanned.join(',') || 'limpio');

  const manifest = loadManifest();
  const need = new Set();
  for (const c of manifest.components) for (const d of c.dependencies) need.add(d.lastIndexOf('@') > 0 ? d.slice(0, d.lastIndexOf('@')) : d);
  const undeclared = [...need].filter((n) => !all.has(n));
  check('deps.4 las dependencias del manifiesto estan todas declaradas', undeclared.length === 0, `requeridas=${[...need].join(',') || 'ninguna'} sinDeclarar=${undeclared.join(',') || 'ninguna'}`);
}

/* ---------- lazy ---------- */

function stageLazy() {
  const manifestPath = path.join(APP, 'dist', '.vite', 'manifest.json');
  if (!fs.existsSync(manifestPath)) die(2, 'verify-originals: falta dist/.vite/manifest.json. Ejecuta npm run build antes del stage lazy.');
  const vite = JSON.parse(read(manifestPath));
  const keyOf = (n) => `src/components/reactbits/${n}/${n}.tsx`;
  const notDynamic = NAMES.filter((n) => !vite[keyOf(n)]?.isDynamicEntry);
  check('lazy.1 los 16 originales son entradas dinamicas en el manifiesto de Vite', notDynamic.length === 0, notDynamic.length ? `no dinamicos: ${notDynamic.join(',')}` : '16 entradas');

  const entryKey = Object.keys(vite).find((k) => vite[k].isEntry);
  const closure = new Set();
  const walk = (k) => {
    if (!k || closure.has(k) || !vite[k]) return;
    closure.add(k);
    for (const i of vite[k].imports ?? []) walk(i);
  };
  walk(entryKey);
  const leaked = NAMES.filter((n) => closure.has(keyOf(n)));
  check('lazy.2 ningun original esta en el cierre estatico del chunk de entrada', Boolean(entryKey) && leaked.length === 0, leaked.join(',') || `cierre=${closure.size} chunks`);
}

/* ---------- isolation ---------- */

const FORBIDDEN = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'tsconfig.json',
  'src',
  'scripts',
  'public',
  'next.config.mjs',
  'next.config.ts',
  'payload.config.ts',
];

function git(top, ...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: top, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function stageIsolation() {
  const top = git(APP, 'rev-parse', '--show-toplevel').trim();

  // (i) arbol de trabajo: sin cambios en rutas prohibidas (los archivos ajenos sin versionar no cuentan)
  const dirty = git(top, 'status', '--porcelain', '--untracked-files=no', '--', ...FORBIDDEN).trim();
  check('isolation.1 sin cambios pendientes en las rutas prohibidas de la raiz', dirty === '', dirty || 'limpio');

  // (ii) commits de la app desde el padre del primer commit que agrego package.json
  const added = git(top, 'log', '--diff-filter=A', '--format=%H', '--', `${APP_REL}/package.json`).trim().split('\n').filter(Boolean);
  if (added.length === 0) {
    check('isolation.2 la app tiene un primer commit con package.json', false, 'sin commits todavia');
  } else {
    const first = added[added.length - 1];
    const base = `${first}^`;
    const commits = git(top, 'log', '--no-merges', '--format=%H', `${base}..HEAD`, '--', APP_REL).trim().split('\n').filter(Boolean);
    const touching = [];
    for (const sha of commits) {
      const files = git(top, 'diff-tree', '--no-commit-id', '--name-only', '-r', sha, '--', ...FORBIDDEN).trim();
      if (files) touching.push(`${sha.slice(0, 7)}: ${files.split('\n').join(',')}`);
    }
    check('isolation.2 ningun commit de la app toca rutas prohibidas de la raiz', touching.length === 0, touching.join('; ') || `commits revisados=${commits.length} desde ${first.slice(0, 7)}^`);
  }

  // (iii) los originales estan ignorados por git
  let ignored = false;
  try {
    git(top, 'check-ignore', '-q', `${APP_REL}/src/components/reactbits/Grainient/Grainient.tsx`);
    ignored = true;
  } catch {
    ignored = false;
  }
  check('isolation.3 git check-ignore marca src/components/reactbits como ignorado', ignored);

  // (iv) ningun original versionado
  const tracked = git(top, 'ls-files', `${APP_REL}/src/components`).trim();
  check('isolation.4 git ls-files no devuelve ningun original versionado', tracked === '', tracked || 'ninguno');
}

/* ---------- online ---------- */

async function stageOnline() {
  const manifest = loadManifest();
  const bad = [];
  let compared = 0;
  for (const c of manifest.components) {
    let json;
    try {
      const res = await fetch(registryUrl(c.name), { signal: AbortSignal.timeout(30_000) });
      if (res.status !== 200) {
        bad.push(`${c.name}: HTTP ${res.status}`);
        continue;
      }
      json = await res.json();
    } catch (err) {
      bad.push(`${c.name}: ${err.message}`);
      continue;
    }
    for (const f of json.files ?? []) {
      const rel = f.path.includes('/') ? f.path : `${c.name}/${f.path}`;
      const file = path.join(TARGET_DIR, rel);
      compared += 1;
      if (!fs.existsSync(file)) {
        bad.push(`${rel}: falta en disco`);
        continue;
      }
      const { body } = splitOrigin(read(file));
      if (body !== f.content) bad.push(`${rel}: el cuerpo difiere del registro vivo`);
    }
  }
  check('online.1 cada cuerpo en disco es identico al del registro vivo', bad.length === 0 && compared > 0, bad.length ? bad.slice(0, 4).join('; ') : `archivos comparados=${compared}`);
}

/* ---------- registro de stages ---------- */

const STAGES = {
  files: stageFiles,
  headers: stageHeaders,
  license: stageLicense,
  deps: stageDeps,
  lazy: stageLazy,
  isolation: stageIsolation,
  online: stageOnline,
};
const ALL_ORDER = ['files', 'headers', 'license', 'deps', 'lazy', 'isolation'];

let names;
if (stageArg === 'all') names = withOnline ? [...ALL_ORDER, 'online'] : ALL_ORDER;
else names = [stageArg];
for (const n of names) if (!STAGES[n]) die(2, `verify-originals: el stage ${n} no existe. Stages: ${Object.keys(STAGES).join(', ')}`);

for (const n of names) {
  console.log(`--- stage ${n} ---`);
  await STAGES[n]();
}

console.log(`\n${passes} PASS, ${failures} FAIL`);
process.exit(failures ? 1 : 0);
