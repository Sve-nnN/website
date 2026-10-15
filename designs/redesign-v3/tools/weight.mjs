#!/usr/bin/env node
/*
 * weight.mjs: mide el peso del kit del sistema visual v3 y arma las tablas de catalogo y pesos.
 *
 * Uso:
 *   node designs/redesign-v3/tools/weight.mjs            mide, escribe reports/weights.json e inyecta las tablas
 *   node designs/redesign-v3/tools/weight.mjs --online   ademas verifica el catalogo contra reactbits.dev
 *
 * Cero dependencias (node:zlib). Mide cada archivo en bytes crudos, gzip nivel 9 y brotli calidad 11,
 * y cada tramo entre marcadores fx:NOMBRE:start y fx:NOMBRE:end de effects.css y effects.js.
 * Codigo de salida 1 si se excede un presupuesto o un tope por efecto, o si falla la verificacion en linea.
 * El peso es el del archivo tal como se sirve (sin minificar): un tope superior de produccion.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);
const ONLINE = process.argv.includes('--online');
const CATALOG = JSON.parse(fs.readFileSync(rel('tools/catalog.json'), 'utf8'));
const HTML = rel('system.html');
const REPORT = rel('reports/weights.json');

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
const br = (buf) => zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const read = (p) => fs.readFileSync(rel(p));
const measure = (buf) => ({ raw: buf.length, gzip: gz(buf), brotli: br(buf) });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kb = (n) => `${(n / 1000).toFixed(1)} KB`;

/* ---------- online: verificacion contra reactbits.dev ---------- */

async function verifyOnline() {
  const problems = [];
  const norm = (s) => s.toLowerCase().replace(/\s+/g, '');
  let index = '';
  try {
    const r = await fetch('https://reactbits.dev/llms.txt');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    index = await r.text();
  } catch (e) {
    problems.push(`no se pudo leer https://reactbits.dev/llms.txt: ${e.message}`);
    return { problems, registryGzip: {} };
  }
  const flat = norm(index);
  const registryGzip = {};
  for (const row of CATALOG.rows) {
    const listed = flat.includes(`[${norm(row.indexName)}](`) || flat.includes(`cli:\`${norm(row.name)}\``);
    if (!listed) problems.push(`${row.name}: no aparece en llms.txt`);
    const pathName = new URL(row.url).pathname;
    if (!index.includes(pathName)) problems.push(`${row.name}: la ruta ${pathName} no aparece en llms.txt`);
    try {
      const r = await fetch(row.registry);
      if (r.status !== 200) {
        problems.push(`${row.name}: registro ${row.registry} respondio ${r.status}`);
        continue;
      }
      const json = await r.json();
      const deps = [...(json.dependencies || [])].sort().join(',');
      const want = [...row.dependencies].sort().join(',');
      if (deps !== want) problems.push(`${row.name}: dependencias del registro [${deps}] distintas de [${want}]`);
      const files = (json.files || []).map((f) => Buffer.from(f.content || '', 'utf8'));
      registryGzip[row.id] = gz(Buffer.concat(files));
    } catch (e) {
      problems.push(`${row.name}: fallo al leer el registro: ${e.message}`);
    }
  }
  return { problems, registryGzip };
}

/* ---------- tramos ---------- */

function segments(file) {
  const text = read(file).toString('utf8');
  const out = {};
  for (const m of text.matchAll(/\/\* fx:([a-z0-9]+):start \*\/([\s\S]*?)\/\* fx:\1:end \*\//g)) {
    out[m[1]] = gz(Buffer.from(m[2], 'utf8'));
  }
  return out;
}

/* ---------- medicion ---------- */

function measureAll(htmlSelf) {
  const files = {};
  const cssKit = ['assets/css/tokens.css', 'assets/css/base.css', 'assets/css/components.css', 'assets/css/effects.css'].filter((f) => fs.existsSync(rel(f)));
  for (const f of ['assets/js/effects.js', ...cssKit]) files[f] = measure(read(f));
  const fonts = fs.readdirSync(rel('assets/fonts')).filter((f) => f.endsWith('.woff2')).sort();
  const fontFiles = {};
  for (const f of fonts) fontFiles[`assets/fonts/${f}`] = measure(read(`assets/fonts/${f}`));
  const docs = {};
  for (const f of ['assets/css/system-doc.css', 'assets/js/system-demo.js']) docs[f] = measure(read(f));
  docs['system.html'] = htmlSelf;

  const cssConcat = Buffer.concat(cssKit.map((f) => read(f)));
  const kitCss = measure(cssConcat);
  const jsPlusCss = files['assets/js/effects.js'].gzip + kitCss.gzip;
  const fontsRaw = Object.values(fontFiles).reduce((n, f) => n + f.raw, 0);

  const css = segments('assets/css/effects.css');
  const js = segments('assets/js/effects.js');
  const B = CATALOG.budgets;
  const budgets = [
    { name: 'assets/js/effects.js (gzip)', value: files['assets/js/effects.js'].gzip, limit: B.effectsJs },
    { name: 'assets/css/effects.css (gzip)', value: files['assets/css/effects.css'].gzip, limit: B.effectsCss },
    { name: 'CSS del kit concatenado (gzip)', value: kitCss.gzip, limit: B.kitCss },
    { name: 'JS de producción más CSS del kit (gzip)', value: jsPlusCss, limit: B.kitJsCss },
    { name: 'Fuentes (bytes crudos)', value: fontsRaw, limit: B.fontsRaw },
  ].map((b) => ({ ...b, ok: b.value <= b.limit }));

  const effects = CATALOG.rows.map((row) => {
    const cssB = row.cssMarkers.reduce((n, k) => n + (css[k] || 0), 0);
    const jsB = row.jsMarkers.reduce((n, k) => n + (js[k] || 0), 0);
    return {
      id: row.id,
      name: row.name,
      css: cssB,
      js: jsB,
      total: cssB + jsB,
      cap: B.perEffect,
      ok: cssB + jsB <= B.perEffect,
      missing: [...row.cssMarkers.filter((k) => css[k] === undefined).map((k) => `css:${k}`), ...row.jsMarkers.filter((k) => js[k] === undefined).map((k) => `js:${k}`)],
    };
  });
  return { files, fontFiles, docs, kitCss, jsPlusCss, fontsRaw, css, js, budgets, effects };
}

/* ---------- tablas HTML ---------- */

function tableHtml({ caption, label, head, rows }) {
  const ths = head.map((h) => `              <th scope="col">${esc(h)}</th>`).join('\n');
  const trs = rows
    .map(
      (r) =>
        `            <tr>\n              <th scope="row">${r[0]}</th>\n${r
          .slice(1)
          .map((c) => `              <td>${c}</td>`)
          .join('\n')}\n            </tr>`,
    )
    .join('\n');
  return [
    `        <div class="table-scroll" role="region" aria-label="${esc(label)}" tabindex="0">`,
    '          <table class="doc-table">',
    `            <caption>${esc(caption)}</caption>`,
    '            <thead>',
    '            <tr>',
    ths,
    '            </tr>',
    '            </thead>',
    '            <tbody>',
    trs,
    '            </tbody>',
    '          </table>',
    '        </div>',
  ].join('\n');
}

function catalogHtml(m, verifiedAt) {
  const rows = CATALOG.rows;
  const identity = tableHtml({
    caption: 'Identidad de cada efecto contra el catálogo real de React Bits',
    label: 'Tabla de identidad del catálogo',
    head: ['Efecto pedido o motivo', 'Componente de origen', 'Categoría', 'URL', 'Dependencias del original', 'Clase de costo', 'Peso original min', 'Peso original gzip', 'Fuente de la medida'],
    rows: rows.map((r) => [
      esc(r.effect) + (r.mention ? ' (mencion)' : ''),
      `<strong>${esc(r.name)}</strong>`,
      esc(r.category),
      `<a href="${esc(r.url)}">${esc(new URL(r.url).pathname)}</a>`,
      r.dependencies.length ? esc(r.dependencies.join(', ')) : 'ninguna',
      esc(r.cost),
      r.originalWeight.min ? `<span class="num">${r.originalWeight.min.toFixed(1)} KB</span>` : 'sin medir',
      `<span class="num">${r.originalWeight.gzip.toFixed(1)} KB</span>`,
      esc(r.originalWeight.source),
    ]),
  });
  const byId = Object.fromEntries(m.effects.map((e) => [e.id, e]));
  const cost = tableHtml({
    caption: `Costo medido de nuestro fallback y de nuestra mejora contra el tope de ${CATALOG.budgets.perEffect} B por efecto`,
    label: 'Tabla de costo medido por efecto',
    head: ['Componente de origen', 'Fallback CSS gzip', 'Mejora JS gzip', 'Total contra el tope', 'Estado', 'Cuenta como canvas', 'Decisión en producción', 'En system.html'],
    rows: rows.map((r) => {
      const e = byId[r.id];
      return [
        `<strong>${esc(r.name)}</strong>`,
        `<span class="num">${e.css} B</span>`,
        `<span class="num">${e.js} B</span>`,
        `<span class="num">${e.total} de ${e.cap} B</span>`,
        e.ok ? 'Dentro del tope' : 'Excede el tope',
        esc(r.canvas),
        esc(r.decision),
        r.component ? 'Componente visible' : 'Solo catálogo',
      ];
    }),
  });
  const notes = [
    `        <p class="doc-note">Catálogo verificado en línea contra <a href="https://reactbits.dev/llms.txt">reactbits.dev/llms.txt</a> y los registros JSON el ${esc(verifiedAt || 'sin verificar')}. Los ocho primeros pesos son el código del componente medido con esbuild, sin React ni <code>ogl</code>. Los ocho adicionales y Dot Grid son el gzip del archivo del registro, una cota superior que incluye props y demo. Cada tramo medido incluye unos 20 B de cabecera gzip.</p>`,
    `        <p class="doc-note">Los pesos de nuestro fallback y de nuestra mejora son los de <code>effects.css</code> y <code>effects.js</code> tal como se sirven, sin minificar. Los tramos compartidos (el pixel de PixelBlast y PixelCard, el ASCII de GradientASCII y ASCIIText, el CRT de CRTWarp y Faulty Terminal) se cuentan completos en cada fila.</p>`,
    `        <p class="doc-note">Licencia de React Bits: ${esc(CATALOG.license.name)} (<a href="${esc(CATALOG.license.url)}">LICENSE.md</a>). ${esc(CATALOG.license.note)}</p>`,
    `        <p class="doc-note">Fuentes: ${CATALOG.sources.map((s) => (s.startsWith('http') ? `<a href="${esc(s)}">${esc(s)}</a>` : esc(s))).join(', ')}. Vecinos útiles que no se implementan: ${esc(CATALOG.neighbors.join(', '))}.</p>`,
    `        <p class="doc-note">Excluidos por el scout, sin clase, tipo ni tarjeta: ${CATALOG.excluded.map((x) => `${esc(x.name)} (${esc(x.reason)})`).join('; ')}.</p>`,
  ].join('\n');
  return [
    `        <p class="doc-intro">Cada efecto de este sistema nombra el componente de React Bits del que parte la idea. El código es propio: los shaders y el CSS están escritos desde cero. Las dos tablas muestran la identidad verificada y el costo medido de nuestro fallback y de nuestra mejora.</p>`,
    identity,
    cost,
    notes,
  ].join('\n');
}

function weightsHtml(m) {
  const status = (ok) => (ok ? 'Cumple' : 'Excede');
  const budgetRows = m.budgets.map((b) => [esc(b.name), `<span class="num">${b.value} B</span>`, `<span class="num">${b.limit} B</span>`, status(b.ok)]);
  const budgets = tableHtml({ caption: 'Presupuestos del kit', label: 'Tabla de presupuestos del kit', head: ['Medida', 'Valor', 'Presupuesto', 'Estado'], rows: budgetRows });
  const fileRows = [];
  for (const [f, v] of Object.entries({ ...m.files, ...m.fontFiles })) fileRows.push([`<code>${esc(f)}</code>`, `<span class="num">${v.raw} B</span>`, `<span class="num">${v.gzip} B</span>`, `<span class="num">${v.brotli} B</span>`, 'Kit']);
  for (const [f, v] of Object.entries(m.docs)) {
    const approx = f === 'system.html';
    fileRows.push([`<code>${esc(f)}</code>`, `<span class="num">${approx ? kb(v.raw) : `${v.raw} B`}</span>`, `<span class="num">${approx ? kb(v.gzip) : `${v.gzip} B`}</span>`, `<span class="num">${approx ? kb(v.brotli) : `${v.brotli} B`}</span>`, 'Solo documentación, sin tope']);
  }
  const files = tableHtml({ caption: 'Peso por archivo, crudo, gzip nivel 9 y brotli calidad 11', label: 'Tabla de pesos por archivo', head: ['Archivo', 'Crudo', 'Gzip', 'Brotli', 'Pertenece a'], rows: fileRows });
  const segRows = [
    ...Object.entries(m.css).map(([k, v]) => [`<code>effects.css</code> fx:${esc(k)}`, `<span class="num">${v} B</span>`]),
    ...Object.entries(m.js).map(([k, v]) => [`<code>effects.js</code> fx:${esc(k)}`, `<span class="num">${v} B</span>`]),
  ];
  const segs = tableHtml({ caption: 'Gzip de cada tramo entre marcadores, con unos 20 B de cabecera cada uno', label: 'Tabla de tramos medidos', head: ['Tramo', 'Gzip'], rows: segRows });
  return [
    '        <p class="doc-intro">El peso medido es el del archivo tal como se sirve, sin minificar, por lo tanto es un tope superior de producción. El motor compartido (montaje, gates, slot único) no pertenece a ningún efecto y se cuenta solo en el total de <code>effects.js</code>.</p>',
    budgets,
    files,
    segs,
    '        <p class="doc-note">Los topes son valores de diseño derivados de la investigación; Juan puede revisarlos. <code>system.html</code>, <code>system-doc.css</code> y <code>system-demo.js</code> se reportan aparte y no tienen tope.</p>',
  ].join('\n');
}

/* ---------- inyeccion idempotente ---------- */

function inject(html, start, end, body) {
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1 || j < i) throw new Error(`system.html no tiene los marcadores ${start} y ${end}`);
  return html.slice(0, i + start.length) + '\n' + body + '\n        ' + html.slice(j);
}

async function main() {
  let prior = {};
  try {
    prior = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  } catch {
    prior = {};
  }
  let verifiedAt = prior.verifiedAt || null;
  let registryGzip = prior.registryGzip || {};
  const failures = [];

  if (ONLINE) {
    const v = await verifyOnline();
    if (v.problems.length) {
      for (const p of v.problems) console.error(`FAIL en linea: ${p}`);
      failures.push(...v.problems);
    } else {
      verifiedAt = new Date().toISOString().slice(0, 10);
      registryGzip = v.registryGzip;
      console.log(`OK en linea: ${CATALOG.rows.length} nombres, rutas, registros 200 y dependencias coinciden (${verifiedAt})`);
    }
  }

  let html = fs.readFileSync(HTML, 'utf8');
  let m = null;
  let passes = 0;
  for (; passes < 4; passes += 1) {
    const self = measure(Buffer.from(html, 'utf8'));
    /* system.html se reporta en KB con un decimal para que la inyeccion converja. */
    const approx = { raw: Math.round(self.raw / 100) * 100, gzip: Math.round(self.gzip / 100) * 100, brotli: Math.round(self.brotli / 100) * 100 };
    m = measureAll(approx);
    let next = inject(html, '<!-- catalog:start -->', '<!-- catalog:end -->', catalogHtml(m, verifiedAt));
    next = inject(next, '<!-- weights:start -->', '<!-- weights:end -->', weightsHtml(m));
    if (next === html) break;
    html = next;
  }
  if (passes >= 4) console.error('AVISO: la inyeccion no convergio en 4 pasadas');
  fs.writeFileSync(HTML, html);

  const report = {
    method: 'Bytes crudos, gzip nivel 9 y brotli calidad 11 de node:zlib sobre los archivos tal como se sirven (sin minificar). Tramos entre marcadores fx:NOMBRE.',
    verifiedAt,
    registryGzip,
    files: m.files,
    fonts: m.fontFiles,
    kitCss: m.kitCss,
    jsPlusCssGzip: m.jsPlusCss,
    fontsRaw: m.fontsRaw,
    segments: { css: m.css, js: m.js },
    budgets: m.budgets,
    effects: m.effects,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');

  for (const b of m.budgets) {
    console.log(`${b.ok ? 'OK  ' : 'FAIL'} ${b.name}: ${b.value} de ${b.limit}`);
    if (!b.ok) failures.push(`presupuesto excedido: ${b.name}`);
  }
  for (const e of m.effects) {
    console.log(`${e.ok ? 'OK  ' : 'FAIL'} ${e.name}: css ${e.css} B + js ${e.js} B = ${e.total} de ${e.cap} B`);
    if (!e.ok) failures.push(`tope por efecto excedido: ${e.name}`);
    if (e.missing.length) failures.push(`${e.name}: faltan marcadores ${e.missing.join(', ')}`);
  }
  if (failures.length) {
    console.error(`\n${failures.length} problema(s)`);
    process.exit(1);
  }
  console.log('\nTodo dentro de presupuesto');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
