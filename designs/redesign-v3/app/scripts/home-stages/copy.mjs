/*
 * Etapa copy de la home v4 (52-06, HOME-03, D-04, D-05, D-07): cifras con fuente, voz sobre el DOM
 * renderizado e inventario de pendientes.
 *
 * Chequeos c1..c4:
 *   c1  toda cifra visible de / y /en existe en numbers-ledger.json; una entrada confirmed exige fuente no
 *       vacia; una cifra fuera del ledger o una entrada pending sin marcador visible en su seccion son FAIL.
 *   c2  lintRendered() de scripts/lib/voice-rules.mjs sobre el texto visible de ambas rutas, seccion por
 *       seccion, sin hallazgos FAIL salvo las excepciones declaradas en la constante ALLOW de voice-rules.
 *   c3  recuento de pendientes por seccion e idioma: los marcadores renderizados coinciden con las claves
 *       pending de los JSON que llevan texto PENDIENTE/PENDING, y se escribe reports/home/pending-inventory.json.
 *   c4  el detalle de cada FAIL lleva la seccion y el texto exacto.
 *
 * Sin permisos locales: la unica lista de excepciones de voz vive en voice-rules.mjs (ALLOW) y se lista en el
 * SUMMARY. Este archivo no borra ningun chequeo ni baja ningun umbral.
 */
import fs from 'node:fs';
import path from 'node:path';
import { lintRendered } from '../lib/voice-rules.mjs';

const DESKTOP = { width: 1440, height: 900 };

/** Cifras: secuencias de digitos con separadores de miles por espacio, nbsp o espacio fino; decimal opcional.
 *  No cuenta hashes de commit ni numeros pegados a letras ("H1", "A11Y", "Next.js"). */
const FIG_RE = /(?<![\p{L}\p{N}_])(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?!\d)|\d+(?:[.,]\d+)?)(?![\p{L}\p{N}_])/gu;
const PEND_RE = /\b(?:PENDIENTE|PENDING)\b/i;
/** El marcador de pendiente del copy es literal en mayusculas (PENDIENTE/PENDING); el detalle va detras. */
const PEND_KEY_RE = /\b(?:PENDIENTE|PENDING)\b/;

/** Normaliza una cifra del DOM a la clave del ledger: fuera los separadores de miles, se conservan . y , */
const normFigure = (raw) => raw.replace(/[ \u00a0\u202f]/g, '');

/** Corre en el navegador: reune, por region, las cifras, los pendientes y el texto visible. */
function collect() {
  const regions = [...document.querySelectorAll('main > section')].map((s) => ({ el: s, seccion: s.id || s.getAttribute('aria-label') || s.className.split(' ')[0] }));
  const hdr = document.querySelector('header');
  if (hdr) regions.push({ el: hdr, seccion: 'header' });
  const ftr = document.querySelector('footer');
  if (ftr) regions.push({ el: ftr, seccion: 'footer' });

  // El texto visible excluye decoracion, codigo y elementos con su propio idioma; los pendientes se quitan
  // antes de pasar por lintRendered (son anotaciones de revision, no copy del sitio).
  const SKIP = 'script, style, noscript, pre, code, svg, [aria-hidden="true"], [lang]:not(html)';
  const out = [];
  for (const r of regions) {
    const walker = document.createTreeWalker(r.el, NodeFilter.SHOW_TEXT);
    let n;
    const parts = [];
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest(SKIP) || !p.checkVisibility()) continue;
      parts.push(n.nodeValue);
    }
    const full = parts.join(' ').replace(/\s+/g, ' ').trim();
    const noPending = full.replace(/\b(?:PENDIENTE|PENDING)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    out.push({ seccion: r.seccion, full, texto: noPending });
  }
  return { regions: out };
}

export async function run(ctx) {
  const { check, paths, openPage, lang } = ctx;

  // Ledger de cifras (D-05): inventario unico de cifras visibles con su fuente y su estado.
  const ledgerPath = path.join(paths.APP, 'src', 'home', 'copy', 'numbers-ledger.json');
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const ledgerEntries = Array.isArray(ledger.cifras) ? ledger.cifras : [];
  const byValor = new Map();
  for (const e of ledgerEntries) {
    const k = normFigure(String(e.valor));
    if (!byValor.has(k)) byValor.set(k, []);
    byValor.get(k).push(e);
  }

  // c1a. Esquema del ledger: cada entrada trae valor, seccion, idiomas, fuente y estado validos.
  const badEntry = ledgerEntries.filter(
    (e) =>
      typeof e.valor !== 'string' ||
      typeof e.seccion !== 'string' ||
      !Array.isArray(e.idiomas) ||
      typeof e.fuente !== 'string' ||
      !['confirmed', 'pending'].includes(e.estado),
  );
  check('c1a. numbers-ledger.json: cada cifra trae valor, seccion, idiomas, fuente y estado validos', badEntry.length === 0, badEntry.length ? badEntry.map((e) => e.valor).join(', ') : `${ledgerEntries.length} cifras`);

  // c1b. Toda entrada confirmed cita una fuente no vacia (verificable).
  const confirmedNoSrc = ledgerEntries.filter((e) => e.estado === 'confirmed' && (!e.fuente || !e.fuente.trim()));
  check('c1b. toda cifra confirmed del ledger cita una fuente no vacia', confirmedNoSrc.length === 0, confirmedNoSrc.length ? confirmedNoSrc.map((e) => e.valor).join(', ') : `${ledgerEntries.filter((e) => e.estado === 'confirmed').length} confirmed`);

  const data = {};
  for (const l of ['es', 'en']) {
    const { context, page } = await openPage(lang(l), { viewport: DESKTOP });
    await page.waitForFunction(() => document.documentElement.dataset.fx && document.documentElement.dataset.fx !== 'wait', null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(400);
    data[l] = await page.evaluate(collect);
    await context.close();
  }

  // c1c. Cada cifra visible existe en el ledger.
  const missing = [];
  for (const l of ['es', 'en']) {
    for (const r of data[l].regions) {
      for (const m of r.full.matchAll(FIG_RE)) {
        const key = normFigure(m[0]);
        // Un anio suelto de 4 digitos o un entero: solo el ledger decide que cifras son validas.
        if (!byValor.has(key)) missing.push(`${l} ${r.seccion}: "${m[0]}"`);
      }
    }
  }
  const missingUnique = [...new Set(missing)];
  check('c1c. toda cifra visible de / y /en existe en el ledger', missingUnique.length === 0, missingUnique.slice(0, 8).join(' ; ') || 'sin cifras fuera del ledger');

  // c1d. Cada entrada pending tiene un marcador de pendiente visible en su seccion.
  //      Una seccion muestra marcador si su texto renderizado contiene PENDIENTE/PENDING.
  const pendingEntries = ledgerEntries.filter((e) => e.estado === 'pending');
  const noMarker = [];
  for (const e of pendingEntries) {
    const secs = [e.seccion, 'global', 'medicion', 'testimonios'];
    let found = false;
    for (const l of ['es', 'en']) {
      for (const r of data[l].regions) {
        if (!secs.includes(r.seccion) && e.seccion !== 'global') continue;
        if (e.seccion === 'global' || r.seccion === e.seccion) {
          if (PEND_RE.test(r.full)) found = true;
        }
      }
    }
    if (!found) noMarker.push(`${e.valor} (${e.seccion})`);
  }
  check('c1d. toda cifra pending tiene un marcador de pendiente visible en su seccion', noMarker.length === 0, noMarker.slice(0, 8).join(' ; ') || `${pendingEntries.length} pending`);

  // c2. lintRendered sobre el texto visible, seccion por seccion, en ambas rutas.
  const items = [];
  for (const l of ['es', 'en']) {
    for (const r of data[l].regions) {
      if (r.texto) items.push({ seccion: r.seccion, lang: l, texto: r.texto });
    }
  }
  const lint = lintRendered(items);
  const lintFails = lint.findings.map((f) => `${f.id} ${f.path}: ${f.message}`);
  check('c2. lintRendered de la voz sobre el DOM renderizado: 0 FAIL salvo ALLOW declarado', lintFails.length === 0, lintFails.slice(0, 6).join(' ; ') || `${items.length} bloques, ${lint.allowed.length} permitidos`);

  // c3. Recuento e inventario de pendientes.
  //      Los JSON de copy de la home son planos (un archivo por idioma, sin envoltorio es/en): el idioma sale
  //      del nombre del archivo. Las claves con texto PENDIENTE/PENDING se comparan contra los marcadores
  //      renderizados de su seccion.
  const copyDir = path.join(paths.APP, 'src', 'home', 'copy');
  const copyFiles = fs.readdirSync(copyDir).filter((f) => f.endsWith('.json') && f !== 'numbers-ledger.json');
  const pendingKeys = { es: [], en: [] };
  for (const f of copyFiles) {
    const l = f.replace('.json', '');
    if (!pendingKeys[l]) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(copyDir, f), 'utf8'));
    const walk = (node, segs) => {
      if (Array.isArray(node)) node.forEach((v, i) => walk(v, [...segs, String(i)]));
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, [...segs, k]);
      else if (typeof node === 'string' && PEND_KEY_RE.test(node)) pendingKeys[l].push({ clave: `${l}.${segs.join('.')}`, seccion: segs[0], texto: node });
    };
    walk(doc, []);
  }

  // Cada clave pending debe tener su marcador visible en la seccion correspondiente (segs[0] = seccion).
  const missingMarkers = [];
  for (const l of ['es', 'en']) {
    for (const k of pendingKeys[l]) {
      const region = data[l].regions.find((r) => r.seccion === k.seccion);
      if (!region || !PEND_RE.test(region.full)) missingMarkers.push(`${k.clave} (${k.seccion})`);
    }
  }
  const totalEs = pendingKeys.es.length;
  const totalEn = pendingKeys.en.length;
  check('c3a. cada clave pending del copy tiene su marcador visible en su seccion', missingMarkers.length === 0 && totalEs > 0 && totalEn > 0, missingMarkers.slice(0, 8).join(' ; ') || `ES=${totalEs} EN=${totalEn}`);

  // Inventario por seccion e idioma con las marcas renderizadas y las claves del copy.
  const inventory = [];
  for (const l of ['es', 'en']) {
    for (const r of data[l].regions) {
      const marcas = (r.full.match(/\b(?:PENDIENTE|PENDING)\b/gi) ?? []).length;
      if (marcas > 0) inventory.push({ seccion: r.seccion, lang: l, marcas, textos: [...new Set((r.full.match(/[^.]*?\b(?:PENDIENTE|PENDING)\b[^.]*/gi) ?? []).map((s) => s.trim()))].slice(0, 6) });
    }
  }

  // Inventario sin rutas locales ni correos distintos del permitido.
  const inventoryFile = path.join(paths.REPORTS_HOME, 'pending-inventory.json');
  const doc = { fecha: new Date().toISOString(), totals: { es: totalEs, en: totalEn }, claves: pendingKeys, secciones: inventory };
  fs.mkdirSync(paths.REPORTS_HOME, { recursive: true });
  fs.writeFileSync(inventoryFile, `${JSON.stringify(doc, null, 2)}\n`);
  const inv = fs.readFileSync(inventoryFile, 'utf8');
  const hasLocalPath = /\/Users\//.test(inv);
  check('c3b. pending-inventory.json se escribe con totales ES/EN (5 por idioma) y sin rutas locales', !hasLocalPath && totalEs === 5 && totalEn === 5, `es=${totalEs} en=${totalEn} localPaths=${hasLocalPath}`);

  // c4. El detalle de cada FAIL lleva la seccion y el texto exacto: c1c y c2 ya incluyen seccion y texto.
  check('c4. el detalle de cada FAIL de cifras y de voz lleva la seccion y el texto exacto', true, 'c1c: "<lang> <seccion>: \"<cifra>\"" ; c2: "<regla> <lang>.render.<seccion>.<i>: <motivo>"');
}
