/*
 * manifest.mjs: lectura del manifiesto de Vite y utilidades compartidas por measure-weights.mjs,
 * measure-lighthouse.mjs y verify-app.mjs (stage report). Sin dependencias.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export function readManifest(dist) {
  const file = path.join(dist, '.vite', 'manifest.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** sha256 de dist/index.html mas dist/.vite/manifest.json: identifica el build medido. */
export function buildSha256(dist) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(path.join(dist, 'index.html')));
  h.update(fs.readFileSync(path.join(dist, '.vite', 'manifest.json')));
  return h.digest('hex');
}

/** Cierre de imports estaticos de una clave del manifiesto (incluye la propia). */
export function closureOf(manifest, key, into = new Set()) {
  if (!key || into.has(key) || !manifest[key]) return into;
  into.add(key);
  for (const i of manifest[key].imports ?? []) closureOf(manifest, i, into);
  return into;
}

export function entryKey(manifest) {
  return Object.keys(manifest).find((k) => manifest[k].isEntry);
}

/** Clave del manifiesto de un original: la entrada dinamica cuyo src termina en reactbits/N/N.tsx. */
export function originalKey(manifest, name) {
  const suffix = `reactbits/${name}/${name}.tsx`;
  return Object.keys(manifest).find((k) => k.endsWith(suffix));
}

/** Archivos (js y css) de todos los originales, sin los del cierre del chunk de entrada. */
export function originalChunkFiles(manifest, names) {
  const base = closureOf(manifest, entryKey(manifest));
  const files = new Set();
  for (const name of names) {
    const key = originalKey(manifest, name);
    if (!key) continue;
    for (const k of closureOf(manifest, key)) {
      if (base.has(k)) continue;
      files.add(manifest[k].file);
      for (const css of manifest[k].css ?? []) files.add(css);
    }
  }
  return [...files];
}

export function gzipSize(buf) {
  return zlib.gzipSync(buf, { level: 9 }).length;
}

export function brotliSize(buf) {
  return zlib.brotliCompressSync(buf, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
  }).length;
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
