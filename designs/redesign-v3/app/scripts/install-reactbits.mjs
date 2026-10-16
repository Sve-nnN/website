#!/usr/bin/env node
/*
 * install-reactbits.mjs: instala los originales de React Bits desde su registro JSON (variante TS-CSS).
 *
 * Uso:
 *   node scripts/install-reactbits.mjs [--only=A,B] [--update] [--check]
 *
 *   sin banderas  instala los 16 en modo locked: si los bytes del registro ya no coinciden con el
 *                 sha256 del manifiesto, termina con 1 y pide revisar el diff.
 *   --only=A,B    instala solo esos nombres y fusiona con el manifiesto existente.
 *   --update      acepta los bytes nuevos del registro y reescribe el manifiesto.
 *   --check       sin red: valida cabecera y sha256 de lo que hay en disco contra el manifiesto.
 *
 * Salida: 0 correcto, 1 fallo, 2 uso incorrecto.
 * Escribe solo bajo src/components/reactbits/ y en reactbits.manifest.json. Nunca ejecuta ni evalua
 * el contenido descargado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHeader, registryUrl, sha256, splitOrigin, VARIANT, REGISTRY_BASE } from './lib/origin-header.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIR = path.join(APP, 'src', 'components', 'reactbits');
const MANIFEST = path.join(APP, 'reactbits.manifest.json');
const ORIGINALS = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8'));
const TIMEOUT_MS = 30_000;
const SAFE_PATH = /^[A-Za-z0-9_./-]+$/;

const LICENSE_INFO = {
  name: 'MIT + Commons Clause License Condition v1.0',
  holder: 'David Haz',
  url: 'https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md',
};

/* ---------- argumentos ---------- */

const args = process.argv.slice(2);
const flags = { only: null, update: false, check: false };
for (const arg of args) {
  if (arg === '--update') flags.update = true;
  else if (arg === '--check') flags.check = true;
  else if (arg.startsWith('--only=')) flags.only = arg.slice('--only='.length).split(',').filter(Boolean);
  else usage(`argumento desconocido: ${arg}`);
}
if (flags.only && flags.only.length === 0) usage('--only necesita al menos un nombre');
if (flags.check && flags.update) usage('--check y --update no se combinan');

function usage(msg) {
  console.error(`install-reactbits: ${msg}`);
  console.error('Uso: node scripts/install-reactbits.mjs [--only=A,B] [--update] [--check]');
  process.exit(2);
}

const known = new Map(ORIGINALS.map((o) => [o.name, o]));
if (flags.only) {
  for (const n of flags.only) if (!known.has(n)) usage(`nombre fuera de originals.json: ${n}`);
}
const selected = flags.only ? ORIGINALS.filter((o) => flags.only.includes(o.name)) : ORIGINALS;

/* ---------- utilidades ---------- */

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeys(value[k])]),
    );
  }
  return value;
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function writeManifest(manifest) {
  fs.writeFileSync(MANIFEST, JSON.stringify(sortKeys(manifest), null, 2) + '\n');
}

/** T-51.1-02: ruta del registro a ruta de destino, con validacion estricta. */
function destinationFor(name, registryPath) {
  if (typeof registryPath !== 'string' || !SAFE_PATH.test(registryPath)) {
    throw new Error(`${name}: ruta de registro no permitida: ${JSON.stringify(registryPath)}`);
  }
  if (path.isAbsolute(registryPath) || registryPath.startsWith('/')) {
    throw new Error(`${name}: ruta absoluta rechazada: ${registryPath}`);
  }
  const segments = registryPath.split('/');
  if (segments.some((s) => s === '..' || s === '.' || s === '')) {
    throw new Error(`${name}: segmento no permitido en la ruta: ${registryPath}`);
  }
  const rel = segments.length > 1 ? registryPath : `${name}/${registryPath}`;
  const dest = path.resolve(TARGET_DIR, rel);
  if (dest !== TARGET_DIR && !dest.startsWith(TARGET_DIR + path.sep)) {
    throw new Error(`${name}: el destino sale de src/components/reactbits: ${registryPath}`);
  }
  return { rel, dest };
}

function packageNameOf(spec) {
  // "ogl@^1.0.11" -> "ogl"; "@scope/pkg@1" -> "@scope/pkg"
  const at = spec.lastIndexOf('@');
  return at > 0 ? spec.slice(0, at) : spec;
}

async function fetchRegistry(name) {
  const url = registryUrl(name);
  if (!url.startsWith('https://')) throw new Error(`${name}: solo se admite HTTPS`);
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status !== 200) {
    const err = new Error(`${name}: el registro respondio HTTP ${res.status} en ${url}`);
    err.httpStatus = res.status;
    throw err;
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`${name}: el registro no devolvio JSON valido en ${url}`);
  }
  if (json.name !== `${name}-${VARIANT}`) {
    throw new Error(`${name}: el campo name del registro es ${JSON.stringify(json.name)}, se esperaba ${name}-${VARIANT}`);
  }
  if (!Array.isArray(json.files) || json.files.length === 0) {
    throw new Error(`${name}: el registro no trae archivos`);
  }
  return { url, json };
}

/** Archivos del registro que se instalan (el registro mezcla componente y CSS; el target se ignora). */
function plannedFiles(name, json) {
  return json.files.map((f) => {
    if (typeof f.content !== 'string') throw new Error(`${name}: archivo sin contenido: ${f.path}`);
    const { rel, dest } = destinationFor(name, f.path);
    const body = f.content;
    return { rel, dest, body, bytes: Buffer.byteLength(body, 'utf8'), sha256Body: sha256(body) };
  });
}

function diskMatches(entry) {
  // true si todos los archivos del manifiesto existen en disco con cabecera valida y cuerpo con el hash del manifiesto
  for (const f of entry.files) {
    const dest = path.resolve(TARGET_DIR, f.path);
    if (!dest.startsWith(TARGET_DIR + path.sep) || !fs.existsSync(dest)) return false;
    const { header, body } = splitOrigin(fs.readFileSync(dest, 'utf8'));
    if (!header || header['sha256-body'] !== f.sha256Body || sha256(body) !== f.sha256Body) return false;
  }
  return true;
}

/* ---------- modo --check ---------- */

function runCheck() {
  const manifest = readManifest();
  if (!manifest) {
    console.error('install-reactbits --check: no existe reactbits.manifest.json');
    return 1;
  }
  let bad = 0;
  for (const o of selected) {
    const entry = manifest.components.find((c) => c.name === o.name);
    if (!entry) {
      console.error(`FALTA en el manifiesto: ${o.name}`);
      bad += 1;
      continue;
    }
    if (diskMatches(entry)) console.log(`ok ${o.name} (${entry.files.length} archivos)`);
    else {
      console.error(`FALLA ${o.name}: faltan archivos o el hash del cuerpo no coincide con el manifiesto`);
      bad += 1;
    }
  }
  return bad ? 1 : 0;
}

/* ---------- instalacion ---------- */

async function runInstall() {
  const pkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'));
  const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const manifest = readManifest() ?? {
    components: [],
    license: LICENSE_INFO,
    source: REGISTRY_BASE,
    variant: VARIANT,
  };
  manifest.license = LICENSE_INFO;
  manifest.source = REGISTRY_BASE;
  manifest.variant = VARIANT;

  let failures = 0;
  const neededDeps = new Map(); // nombre -> especificacion completa

  for (const o of selected) {
    const previous = manifest.components.find((c) => c.name === o.name) ?? null;
    let fetched;
    try {
      fetched = await fetchRegistry(o.name);
    } catch (err) {
      if (err.httpStatus) {
        console.error(`FALLA ${err.message}`);
        failures += 1;
        continue;
      }
      // Sin red: se conserva lo que ya esta en disco si cabecera y hash son validos.
      if (previous && diskMatches(previous)) {
        console.warn(`aviso ${o.name}: sin red (${err.message}); se conservan los archivos locales validos`);
        for (const d of previous.dependencies) neededDeps.set(packageNameOf(d), d);
        continue;
      }
      console.error(`FALLA ${o.name}: sin red y sin archivos locales validos (${err.message})`);
      failures += 1;
      continue;
    }

    let files;
    try {
      files = plannedFiles(o.name, fetched.json);
    } catch (err) {
      console.error(`FALLA ${err.message}`);
      failures += 1;
      continue;
    }

    if (previous && !flags.update) {
      const prevHashes = new Map(previous.files.map((f) => [f.path, f.sha256Body]));
      const same = files.length === prevHashes.size && files.every((f) => prevHashes.get(f.rel) === f.sha256Body);
      if (!same) {
        console.error(
          `FALLA ${o.name}: los bytes del registro cambiaron respecto de reactbits.manifest.json. ` +
            'Revisa el diff del registro y repite con --update si aceptas el cambio.',
        );
        failures += 1;
        continue;
      }
    }

    for (const f of files) {
      fs.mkdirSync(path.dirname(f.dest), { recursive: true });
      const header = buildHeader({
        component: o.name,
        file: path.posix.basename(f.rel),
        url: fetched.url,
        sha256Body: f.sha256Body,
      });
      fs.writeFileSync(f.dest, header + f.body);
    }

    const dependencies = [...(fetched.json.dependencies ?? [])].map(String).sort();
    for (const d of dependencies) neededDeps.set(packageNameOf(d), d);

    const entry = {
      catalogId: o.catalogId,
      dependencies,
      files: files.map((f) => ({ bytes: f.bytes, path: f.rel, sha256Body: f.sha256Body })),
      http: 200,
      name: o.name,
      registryUrl: fetched.url,
    };
    const at = manifest.components.findIndex((c) => c.name === o.name);
    if (at === -1) manifest.components.push(entry);
    else manifest.components[at] = entry;
    console.log(`ok ${o.name} (${files.length} archivos)`);
  }

  // El manifiesto sigue el orden de originals.json.
  const order = new Map(ORIGINALS.map((o, i) => [o.name, i]));
  manifest.components.sort((a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99));
  writeManifest(manifest);

  const missing = [...neededDeps].filter(([name]) => !declared.has(name)).map(([, spec]) => spec);
  if (missing.length) {
    console.error(`FALLA dependencias sin declarar en package.json: ${missing.join(', ')}`);
    console.error(`Ejecuta: npm install --save ${missing.join(' ')}`);
    failures += 1;
  }

  return failures ? 1 : 0;
}

const code = flags.check ? runCheck() : await runInstall();
process.exit(code);
