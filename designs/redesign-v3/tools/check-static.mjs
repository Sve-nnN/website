#!/usr/bin/env node
/*
 * check-static.mjs: chequeo estatico de HTML, CSS y JS del sistema visual v3. Cero dependencias.
 *
 * Uso: node designs/redesign-v3/tools/check-static.mjs
 *
 * Imprime una linea PASS o FAIL por regla, lista cada incumplimiento y termina con codigo 1
 * si alguna regla falla. Sobre system.html revisa landmarks, encabezados, ids y referencias,
 * nombres accesibles, ASCII y formularios. Sobre todo el arbol revisa recursos externos, patrones
 * de JS peligrosos, CSS prohibido, hex sueltos, bucles de animacion, efectos excluidos por el
 * scout, guiones largos o cortos y que package.json y los lockfiles no cambien.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
let failures = 0;
let passes = 0;

function rule(name, offenders) {
  const ok = offenders.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (ok) passes += 1;
  else {
    failures += 1;
    for (const o of offenders.slice(0, 25)) console.log(`     - ${o}`);
    if (offenders.length > 25) console.log(`     ... y ${offenders.length - 25} mas`);
  }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else out.push(f);
  }
  return out;
}

const files = walk(ROOT).filter((f) => !/_tmp-/.test(f));
const read = (f) => fs.readFileSync(f, 'utf8');
const ext = (f) => path.extname(f);
const cssFiles = files.filter((f) => ext(f) === '.css');
const jsFiles = files.filter((f) => ext(f) === '.js' && rel(f).startsWith('assets/js/'));
const htmlFiles = files.filter((f) => ext(f) === '.html' && !rel(f).startsWith('reports/'));

/* ---------- system.html ---------- */

const raw = read(path.join(ROOT, 'system.html'));
const html = raw.replace(/<!--[\s\S]*?-->/g, '');

const attrsOf = (s) => {
  const out = {};
  for (const m of s.matchAll(/([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
};
const tags = [...html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)].map((m) => ({ tag: m[1].toLowerCase(), attrs: attrsOf(m[2]), at: m.index }));
const count = (t) => tags.filter((x) => x.tag === t).length;

rule('html: lang, title unico y meta viewport', [
  ...(/<html[^>]*\blang="[a-z-]+"/.test(html) ? [] : ['falta html lang']),
  ...(count('title') === 1 ? [] : [`title=${count('title')}`]),
  ...(tags.some((t) => t.tag === 'meta' && t.attrs.name === 'viewport') ? [] : ['falta meta viewport']),
]);
rule('landmarks: un h1, un main, header, footer y todo nav con aria-label', [
  ...(count('h1') === 1 ? [] : [`h1=${count('h1')}`]),
  ...(count('main') === 1 ? [] : [`main=${count('main')}`]),
  ...(count('header') >= 1 ? [] : ['falta header']),
  ...(count('footer') >= 1 ? [] : ['falta footer']),
  ...tags.filter((t) => t.tag === 'nav' && !t.attrs['aria-label']).map((t) => `nav sin aria-label en ${t.at}`),
]);

{
  const heads = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  const off = [];
  heads.forEach((l, i) => {
    if (i === 0 && l !== 1) off.push('el primer encabezado no es h1');
    if (i > 0 && l > heads[i - 1] + 1) off.push(`salto h${heads[i - 1]} a h${l} en el encabezado ${i + 1}`);
  });
  rule(`encabezados: jerarquia sin saltos (${heads.length} encabezados)`, off);
}

{
  const ids = tags.filter((t) => t.attrs.id !== undefined).map((t) => t.attrs.id);
  const seen = new Set();
  const dup = [];
  for (const id of ids) {
    if (seen.has(id)) dup.push(id);
    seen.add(id);
  }
  rule(`ids: ${ids.length} ids unicos`, dup);

  const off = [];
  for (const t of tags) {
    const a = t.attrs;
    if (a.href && a.href.startsWith('#') && a.href.length > 1 && !seen.has(a.href.slice(1))) off.push(`href="${a.href}"`);
    if (a.for && !seen.has(a.for)) off.push(`for="${a.for}"`);
    for (const k of ['aria-controls', 'aria-describedby', 'aria-labelledby']) {
      if (a[k]) for (const id of a[k].split(/\s+/)) if (!seen.has(id)) off.push(`${k}="${id}"`);
    }
  }
  rule('referencias: href #, for, aria-controls, aria-describedby y aria-labelledby apuntan a un id', off);
}

rule('imagenes: todo img tiene alt', tags.filter((t) => t.tag === 'img' && t.attrs.alt === undefined).map((t) => `img en ${t.at}`));

{
  const off = [];
  const idText = {};
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) idText[m[2]] = m[3].replace(/<[^>]+>/g, '').trim();
  for (const m of html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const a = attrsOf(m[2]);
    const text = m[3].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, 'x').trim();
    const byRef = a['aria-labelledby'] && a['aria-labelledby'].split(/\s+/).some((id) => idText[id]);
    if (!text && !a['aria-label'] && !a.title && !byRef) off.push(`${m[1]} sin nombre accesible en ${m.index}`);
  }
  rule('nombres: todo button y a tiene nombre accesible', off);
}

{
  const off = [];
  for (const m of html.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/g)) {
    const a = attrsOf(m[1]);
    if (a['aria-hidden'] === 'true') {
      const body = m[2].replace(/<[^>]+>/g, '');
      if (!/^[.:\-=+*#%@ \n]+$/.test(body)) off.push(`pre aria-hidden con caracteres fuera de .:-=+*#%@ en ${m.index}`);
    }
  }
  rule('ASCII: todo pre aria-hidden solo usa .:-=+*#%@, espacios y saltos de linea', off);
}

rule('formularios: ningun form con action ni method post', tags.filter((t) => t.tag === 'form' && (t.attrs.action !== undefined || /post/i.test(t.attrs.method || ''))).map((t) => `form ${t.attrs.id || ''}`));

/* ---------- arbol completo ---------- */

{
  const off = [];
  const local = (u) => !/^(https?:)?\/\//i.test(u);
  for (const f of htmlFiles) {
    const t = read(f).replace(/<!--[\s\S]*?-->/g, '');
    for (const m of t.matchAll(/<(script|link|img|iframe|source|video|audio|embed|object)\b([^>]*)>/gi)) {
      const a = attrsOf(m[2]);
      const u = a.src || a.href || a.data;
      if (u && !local(u)) off.push(`${rel(f)}: <${m[1]}> externo ${u}`);
      if (m[1].toLowerCase() === 'script' && (a.type || '').toLowerCase() === 'module') off.push(`${rel(f)}: script type=module`);
    }
  }
  for (const f of [...cssFiles, ...jsFiles]) {
    const t = read(f);
    if (/@import\s+(url\()?["']?(https?:)?\/\//i.test(t)) off.push(`${rel(f)}: @import externo`);
    if (/url\(\s*["']?(https?:)?\/\//i.test(t)) off.push(`${rel(f)}: url() externo`);
  }
  rule('recursos: cero script src, link href, @import ni url() de otro origen y cero type="module"', off);
}

{
  const off = [];
  for (const f of jsFiles) {
    const t = read(f);
    const pats = [
      [/\.(innerHTML|outerHTML)\s*=/, 'asignacion de HTML como cadena'],
      [/insertAdjacentHTML\s*\(/, 'insertAdjacentHTML'],
      [/\beval\s*\(/, 'eval'],
      [/new\s+Function\s*\(/, 'new Function'],
      [/document\.write\s*\(/, 'document.write'],
      [/\bfetch\s*\(/, 'fetch'],
      [/XMLHttpRequest/, 'XMLHttpRequest'],
    ];
    for (const [re, name] of pats) if (re.test(t)) off.push(`${rel(f)}: ${name}`);
  }
  rule('JS: sin innerHTML, insertAdjacentHTML, eval, new Function, document.write ni peticiones en assets/js', off);
}

{
  const off = [];
  for (const f of [...cssFiles, ...htmlFiles]) {
    const t = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
    if (/backdrop-filter/.test(t)) off.push(`${rel(f)}: backdrop-filter`);
    if (/filter\s*:\s*[^;]*blur\(/.test(t)) off.push(`${rel(f)}: filter blur`);
    if (/feDisplacementMap/.test(t)) off.push(`${rel(f)}: feDisplacementMap`);
  }
  for (const f of cssFiles) {
    const stripped = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of stripped.matchAll(/outline\s*:\s*(none|0)\b[^;]*;/g)) off.push(`${rel(f)}: ${m[0].trim()}`);
  }
  rule('CSS: sin backdrop-filter, filter blur, feDisplacementMap ni outline none', off);
}

{
  const off = [];
  for (const name of ['components.css', 'effects.css', 'base.css']) {
    const f = path.join(ROOT, 'assets/css', name);
    const t = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\(\s*(["'])data:[\s\S]*?\1\s*\)/g, 'url()');
    for (const m of t.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) off.push(`assets/css/${name}: ${m[0]}`);
  }
  rule('tokens: ningun hex suelto en components.css, effects.css ni base.css fuera de data URI', off);
}

{
  const off = [];
  let loops = 0;
  for (const f of cssFiles) {
    const t = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of t.matchAll(/animation\s*:\s*([^;]+);/g)) {
      if (!/\binfinite\b/.test(m[1])) continue;
      loops += 1;
      const d = /(?:^|\s)(\d*\.?\d+)(ms|s)\b/.exec(m[1].replace(/\([^)]*\)/g, ''));
      const ms = d ? Number(d[1]) * (d[2] === 's' ? 1000 : 1) : 0;
      if (ms < 1000) off.push(`${rel(f)}: ${m[0].trim()} (${ms} ms)`);
    }
  }
  rule(`animaciones: los ${loops} bucles infinitos duran 1 s o mas`, off);
}

{
  const catalog = JSON.parse(read(path.join(ROOT, 'tools/catalog.json')));
  const slugs = catalog.excluded.map((e) => e.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const tokens = new Set();
  for (const f of htmlFiles) {
    const t = read(f).replace(/<!--[\s\S]*?-->/g, '');
    for (const m of t.matchAll(/\bclass="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => c && tokens.add(c));
    for (const m of t.matchAll(/\bdata-(?:fx|fx-demo|effect|component)="([^"]*)"/g)) tokens.add(m[1]);
  }
  for (const f of cssFiles) {
    const t = read(f);
    for (const m of t.matchAll(/\.([a-zA-Z_][\w-]*)/g)) tokens.add(m[1]);
    for (const m of t.matchAll(/fx:([\w-]+):(?:start|end)/g)) tokens.add(m[1]);
  }
  for (const f of jsFiles) {
    const t = read(f);
    for (const m of t.matchAll(/fx:([\w-]+):(?:start|end)/g)) tokens.add(m[1]);
    const k = /var KINDS = \{([^}]*)\}/.exec(t);
    if (k) for (const m of k[1].matchAll(/(\w+)\s*:/g)) tokens.add(m[1]);
  }
  const off = [];
  for (const tok of tokens) {
    const n = tok.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const s of slugs) if (n === s || (n.length > s.length && n.includes(s) && /^(fx|is|card)?/.test(n))) off.push(`"${tok}" coincide con el excluido "${s}"`);
  }
  rule(`excluidos: ninguna clase, tipo de KINDS ni marcador usa los ${slugs.length} efectos excluidos por el scout`, off);
}

{
  const DASH = new RegExp('[\\u2013\\u2014]');
  const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.md', '.txt', '.svg']);
  const off = [];
  for (const f of files) {
    const r = rel(f);
    if (r.startsWith('reports/') || r === 'assets/fonts/LICENSES.txt' || !TEXT.has(ext(f))) continue;
    read(f).split('\n').forEach((line, i) => {
      if (DASH.test(line)) off.push(`${r}:${i + 1}`);
    });
  }
  rule('texto: ni guion largo ni guion corto fuera de reports/ y LICENSES.txt', off);
}

{
  const off = [];
  let top = '';
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT }).toString().trim();
    const out = execFileSync('git', ['status', '--porcelain', '--', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'src'], { cwd: top }).toString().trim();
    if (out) off.push(...out.split('\n'));
  } catch (e) {
    off.push(`no se pudo consultar git: ${e.message}`);
  }
  rule('repo: package.json, lockfiles y src sin cambios respecto de HEAD', off);
}

console.log(`\n${passes} PASS, ${failures} FAIL`);
console.log(`RESULT: ${failures ? 'FAIL (exit 1)' : 'PASS (exit 0)'}`);
process.exit(failures ? 1 : 0);
