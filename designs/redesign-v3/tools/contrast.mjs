#!/usr/bin/env node
/*
 * contrast.mjs: calcula los ratios WCAG 2.2 de cada par de tools/pairs.json contra los
 * tokens reales de assets/css/tokens.css, escribe reports/contrast.json e inyecta la tabla
 * en system.html entre los marcadores contrast:start y contrast:end.
 *
 * Cero dependencias. Idempotente: una segunda corrida no cambia ningun byte.
 * Formula: luminancia relativa sRGB de WCAG, ratio (L1 + 0.05) / (L2 + 0.05), truncado a
 * dos decimales hacia abajo antes de comparar con el umbral (nunca se redondea hacia arriba).
 *
 * Codigo de salida 1 si falla un par required, ui, scrim o reading, o si un par prohibited pasa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = path.join(ROOT, 'assets/css/tokens.css');
const PAIRS = path.join(ROOT, 'tools/pairs.json');
const REPORT = path.join(ROOT, 'reports/contrast.json');
const HTML = path.join(ROOT, 'system.html');

/* ---------- tokens ---------- */

function parseTokens(css) {
  const raw = {};
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) raw[m[1]] = m[2].trim();
  const out = {};
  const resolve = (name, seen = []) => {
    if (out[name]) return out[name];
    const v = raw[name];
    if (v === undefined || seen.includes(name)) return null;
    let color = null;
    let m;
    if ((m = /^#([0-9a-f]{6})$/i.exec(v))) {
      const n = parseInt(m[1], 16);
      color = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    } else if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v))) {
      color = { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    } else if ((m = /^var\(--([a-z0-9-]+)\)$/.exec(v))) {
      color = resolve(m[1], [...seen, name]);
    }
    if (color) out[name] = color;
    return color;
  };
  for (const name of Object.keys(raw)) resolve(name);
  return out;
}

/* ---------- color ---------- */

const clamp255 = (v) => Math.max(0, Math.min(255, v));
const over = (top, base) => ({
  r: top.r * top.a + base.r * (1 - top.a),
  g: top.g * top.a + base.g * (1 - top.a),
  b: top.b * top.a + base.b * (1 - top.a),
  a: 1,
});
const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return Math.floor(((hi + 0.05) / (lo + 0.05)) * 100 + 1e-9) / 100;
};
const hex = (c) =>
  '#' + [c.r, c.g, c.b].map((v) => Math.round(clamp255(v)).toString(16).padStart(2, '0')).join('').toUpperCase();

function bgOf(spec, tokens) {
  if (typeof spec === 'string') {
    const t = tokens[spec];
    if (!t) throw new Error(`token desconocido: ${spec}`);
    if (t.a < 1) throw new Error(`el token ${spec} es translucido; usa {over, layer}`);
    return { ...t };
  }
  if (spec.mix) {
    const [a, b] = spec.mix.map((n) => bgOf(n, tokens));
    return {
      r: a.r + (b.r - a.r) * spec.t,
      g: a.g + (b.g - a.g) * spec.t,
      b: a.b + (b.b - a.b) * spec.t,
      a: 1,
    };
  }
  if (spec.grain !== undefined) {
    const base = bgOf(spec.of, tokens);
    const add = spec.grain * 255;
    return { r: clamp255(base.r + add), g: clamp255(base.g + add), b: clamp255(base.b + add), a: 1 };
  }
  if (spec.layer) {
    const layer = tokens[spec.layer];
    if (!layer) throw new Error(`token desconocido: ${spec.layer}`);
    return over(layer, bgOf(spec.over, tokens));
  }
  throw new Error(`fondo no valido: ${JSON.stringify(spec)}`);
}

function describeBg(spec) {
  if (typeof spec === 'string') return spec;
  if (spec.mix) return `mezcla ${spec.mix.join(' y ')} al ${Math.round(spec.t * 100)}%`;
  if (spec.grain !== undefined) return `${describeBg(spec.of)} con grano de ${Math.round(spec.grain * 100)}%`;
  if (spec.layer) return `${describeBg(spec.over)} bajo ${spec.layer}`;
  return '?';
}

function describeFg(spec) {
  return typeof spec === 'string' ? spec : `${spec.token} al ${Math.round(spec.alpha * 100)}%`;
}

/* ---------- calculo ---------- */

const tokens = parseTokens(fs.readFileSync(TOKENS, 'utf8'));
const config = JSON.parse(fs.readFileSync(PAIRS, 'utf8'));
const groups = {};
let problems = 0;

for (const [name, g] of Object.entries(config.groups)) {
  const results = g.pairs.map((p) => {
    const bg = bgOf(p.bg, tokens);
    let fg;
    if (typeof p.fg === 'string') fg = tokens[p.fg];
    else fg = over({ ...tokens[p.fg.token], a: p.fg.alpha }, bg);
    if (!fg) throw new Error(`token desconocido: ${JSON.stringify(p.fg)}`);
    const r = ratio(fg, bg);
    const meets = r >= g.threshold;
    const ok = g.expect === 'pass' ? meets : !meets;
    if (!ok) problems += 1;
    return {
      fg: describeFg(p.fg),
      bg: describeBg(p.bg),
      fgHex: hex(fg),
      bgHex: hex(bg),
      fgToken: typeof p.fg === 'string' ? p.fg : null,
      bgToken: typeof p.bg === 'string' ? p.bg : null,
      ratio: r,
      threshold: g.threshold,
      meetsThreshold: meets,
      expected: g.expect,
      ok,
      note: p.note || null,
    };
  });
  groups[name] = { label: g.label, threshold: g.threshold, expect: g.expect, results };
}

/* ---------- reporte JSON ---------- */

const total = Object.values(groups).reduce((n, g) => n + g.results.length, 0);
const report = {
  method: 'WCAG 2.2: luminancia relativa sRGB, ratio truncado a dos decimales hacia abajo. Pares leidos de tools/pairs.json, colores de assets/css/tokens.css.',
  summary: { totalPairs: total, problems },
  groups,
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');

/* ---------- tabla HTML ---------- */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function rowFor(groupName, g, r) {
  const fgCss = r.fgToken ? `var(--${r.fgToken})` : r.fgHex;
  const bgCss = r.bgToken ? `var(--${r.bgToken})` : r.bgHex;
  const label = `${r.fg} sobre ${r.bg}${r.note ? ` (${r.note})` : ''}`;
  let result;
  if (g.expect === 'pass') result = r.ok ? 'Cumple AA' : 'No cumple AA';
  else result = r.ok ? 'No cumple: uso prohibido' : 'Pasa: revisar la regla';
  return [
    `          <tr data-group="${groupName}" data-result="${r.ok ? 'ok' : 'problem'}">`,
    `            <th scope="row">${esc(label)}</th>`,
    `            <td>${esc(g.label)}</td>`,
    `            <td><span class="contrast-sample" aria-hidden="true" style="color: ${fgCss}; background: ${bgCss};">Aa</span></td>`,
    `            <td>${r.ratio.toFixed(2)}:1</td>`,
    `            <td>${r.threshold.toFixed(1)}:1</td>`,
    `            <td>${result}</td>`,
    `          </tr>`,
  ].join('\n');
}

const rows = [];
for (const [name, g] of Object.entries(groups)) for (const r of g.results) rows.push(rowFor(name, g, r));

const table = [
  '        <table class="contrast-table">',
  '          <caption>Ratios de contraste calculados por tools/contrast.mjs a partir de tokens.css</caption>',
  '          <thead>',
  '            <tr>',
  '              <th scope="col">Par texto y fondo</th>',
  '              <th scope="col">Grupo</th>',
  '              <th scope="col">Muestra</th>',
  '              <th scope="col">Ratio</th>',
  '              <th scope="col">Umbral</th>',
  '              <th scope="col">Resultado</th>',
  '            </tr>',
  '          </thead>',
  '          <tbody>',
  rows.join('\n'),
  '          </tbody>',
  '        </table>',
].join('\n');

const html = fs.readFileSync(HTML, 'utf8');
const START = '<!-- contrast:start -->';
const END = '<!-- contrast:end -->';
const i = html.indexOf(START);
const j = html.indexOf(END);
if (i === -1 || j === -1 || j < i) {
  console.error('FAIL system.html no tiene los marcadores contrast:start y contrast:end');
  process.exit(1);
}
const next = html.slice(0, i + START.length) + '\n' + table + '\n        ' + html.slice(j);
if (next !== html) fs.writeFileSync(HTML, next);

/* ---------- salida ---------- */

for (const [name, g] of Object.entries(groups)) {
  for (const r of g.results) {
    console.log(`${r.ok ? 'OK  ' : 'FAIL'} [${name}] ${r.fg} sobre ${r.bg}: ${r.ratio.toFixed(2)}:1 (umbral ${r.threshold}, esperado ${g.expect})`);
  }
}
console.log(`\n${total} pares, ${problems} con problema`);
process.exit(problems ? 1 : 0);
