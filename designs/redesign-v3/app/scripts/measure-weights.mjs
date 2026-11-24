#!/usr/bin/env node
/*
 * measure-weights.mjs: peso gzip (nivel 9) y brotli (calidad 11) de cada original sobre el build de
 * produccion, comparado con su porte vanilla de la fase 51 (reports/weights.json).
 *
 * Uso: node scripts/measure-weights.mjs
 * Salida: 0 ok, 1 falta un original o un valor no es numerico, 2 falta dist/.
 * Escribe public/measurements/original-vs-vanilla.json y no usa dependencias.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliSize, buildSha256, closureOf, entryKey, gzipSize, originalKey, readManifest } from './lib/manifest.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const OUT = path.join(APP, 'public', 'measurements', 'original-vs-vanilla.json');

const manifest = readManifest(DIST);
if (!manifest || !fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('measure-weights: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
  process.exit(2);
}

const originals = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8'));
const weights = JSON.parse(fs.readFileSync(path.join(APP, '..', 'reports', 'weights.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(APP, '..', 'tools', 'catalog.json'), 'utf8'));
const perEffect = catalog.budgets.perEffect;

const sizeCache = new Map();
function sizes(file) {
  if (!sizeCache.has(file)) {
    const buf = fs.readFileSync(path.join(DIST, file));
    sizeCache.set(file, { file, raw: buf.length, gzip: gzipSize(buf), brotli: brotliSize(buf) });
  }
  return sizeCache.get(file);
}

const pkgVersion = (name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(APP, 'node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
};

// Base: chunk de entrada y su cierre de imports estaticos, mas el CSS de la app.
const entry = entryKey(manifest);
const baseKeys = closureOf(manifest, entry);
const baseFiles = new Set();
for (const k of baseKeys) {
  baseFiles.add(manifest[k].file);
  for (const css of manifest[k].css ?? []) baseFiles.add(css);
}
const baseParts = [...baseFiles].map(sizes);
const base = {
  entryFile: manifest[entry].file,
  gzip: baseParts.reduce((s, p) => s + p.gzip, 0),
  brotli: baseParts.reduce((s, p) => s + p.brotli, 0),
  files: baseParts.map((p) => ({ file: p.file, gzip: p.gzip, brotli: p.brotli })),
  react: pkgVersion('react'),
  reactDom: pkgVersion('react-dom'),
  note: 'Cascaron de la app: React, la galeria y el CSS de la fase 51. El porte vanilla no necesita React.',
};

// Cierre propio de cada original y chunks compartidos.
const perOriginal = [];
const usedBy = new Map();
for (const o of originals) {
  const key = originalKey(manifest, o.name);
  if (!key) continue;
  const closure = closureOf(manifest, key);
  const ownJs = [manifest[key].file];
  const ownCss = [...(manifest[key].css ?? [])];
  const sharedJs = [];
  const sharedCss = [];
  for (const k of closure) {
    if (k === key || baseKeys.has(k)) continue;
    sharedJs.push(manifest[k].file);
    sharedCss.push(...(manifest[k].css ?? []));
    usedBy.set(manifest[k].file, [...(usedBy.get(manifest[k].file) ?? []), o.name]);
  }
  perOriginal.push({ o, ownJs, ownCss, sharedJs, sharedCss });
}

const sum = (files, field) => files.reduce((s, f) => s + sizes(f)[field], 0);

const FALLBACK_NOTES = {
  'pixel-blast': 'Comparte el CSS del fallback con pixel-card.',
  'pixel-card': 'Comparte el CSS del fallback con pixel-blast.',
  'gradient-ascii': 'Comparte el pre y el ticker del fallback con ascii-text.',
  'ascii-text': 'Comparte el pre y el ticker del fallback con gradient-ascii.',
  'faulty-terminal': 'Comparte el fallback CSS con crt.',
  crt: 'Faulty Terminal comparte este fallback.',
};

const rows = perOriginal.map(({ o, ownJs, ownCss, sharedJs, sharedCss }) => {
  const vanilla = weights.effects.find((e) => e.id === o.catalogId);
  const row = catalog.rows.find((r) => r.id === o.catalogId);
  const shared = [...new Set([...sharedJs, ...sharedCss])];
  const ownJsGzip = sum(ownJs, 'gzip');
  const ownCssGzip = sum(ownCss, 'gzip');
  const sharedGzip = sum(shared, 'gzip');
  const totalGzip = ownJsGzip + ownCssGzip + sharedGzip;
  const vanillaGzip = vanilla ? vanilla.total : null;
  return {
    original: o.name,
    catalogId: o.catalogId,
    group: o.group,
    ownJsGzip,
    ownCssGzip,
    sharedGzip,
    totalGzip,
    ownJsBrotli: sum(ownJs, 'brotli'),
    ownCssBrotli: sum(ownCss, 'brotli'),
    sharedBrotli: sum(shared, 'brotli'),
    totalBrotli: sum(ownJs, 'brotli') + sum(ownCss, 'brotli') + sum(shared, 'brotli'),
    shared,
    ownFiles: [...ownJs, ...ownCss],
    vanillaGzip,
    ratio: vanillaGzip ? Math.round((totalGzip / vanillaGzip) * 100) / 100 : null,
    ratioOwn: vanillaGzip ? Math.round(((ownJsGzip + ownCssGzip) / vanillaGzip) * 100) / 100 : null,
    exceedsCap: totalGzip > perEffect,
    registryGzipKB: row?.originalWeight?.gzip ?? null,
    note: FALLBACK_NOTES[o.catalogId] ?? '',
  };
});

const sharedChunks = [...usedBy.entries()].map(([file, names]) => ({
  file,
  gzip: sizes(file).gzip,
  brotli: sizes(file).brotli,
  usedBy: names,
}));

const result = {
  generatedAt: new Date().toISOString(),
  buildSha256: buildSha256(DIST),
  method: 'gzip nivel 9 y brotli calidad 11 con node:zlib sobre los archivos de dist/ (build de produccion de Vite)',
  base,
  shared: sharedChunks,
  rows,
  budgets: { perEffect, source: 'tools/catalog.json budgets.perEffect', vanillaSource: 'reports/weights.json effects[].total' },
};

// Validacion: 16 originales y valores numericos.
const problems = [];
for (const o of originals) if (!rows.find((r) => r.original === o.name)) problems.push(`falta ${o.name} en el manifiesto de Vite`);
for (const r of rows) {
  for (const f of ['ownJsGzip', 'ownCssGzip', 'sharedGzip', 'totalGzip', 'totalBrotli', 'vanillaGzip', 'ratio']) {
    if (typeof r[f] !== 'number' || !Number.isFinite(r[f])) problems.push(`${r.original}.${f} no es numerico`);
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n');

const kb = (n) => (n / 1024).toFixed(1).padStart(6);
console.log(`Base (React y cascaron): ${kb(base.gzip)} KB gzip, ${kb(base.brotli)} KB brotli`);
console.log('Original         | propio | compart | total  | brotli | vanilla | relacion | tope');
for (const r of rows) {
  console.log(
    `${r.original.padEnd(16)} | ${kb(r.ownJsGzip + r.ownCssGzip)} | ${kb(r.sharedGzip)} | ${kb(r.totalGzip)} | ${kb(r.totalBrotli)} | ${kb(r.vanillaGzip ?? 0)} | ${String(r.ratio).padStart(7)}x | ${r.exceedsCap ? 'supera' : 'dentro'}`,
  );
}
console.log(`Escrito ${path.relative(APP, OUT)}`);
if (problems.length) {
  console.error(`FAIL ${problems.join('; ')}`);
  process.exit(1);
}
