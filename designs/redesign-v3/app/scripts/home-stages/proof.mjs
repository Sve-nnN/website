/*
 * Stage proof de la home: secciones de prueba (clientes, errores reales, casos, websites, testimonio).
 * Chequeos p1 a p17 (ver 52-03-PLAN.md). Cada tarea del plan agrega los suyos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** Secciones propias de este plan, en el orden que debe verse en la pagina. */
const OWN = ['clientes', 'errores-reales', 'casos', 'websites'];
const COPY_FILES = ['clientes', 'errores-reales', 'casos', 'websites'];

const CASE_SLUGS = ['urologo-seo-local-salud-santiago-rd', 'immigration-law-atlanta-seo', 'pittsburgh-criminal-defense-legal-content-seo'];
const SITES = [
  { name: 'Apturio', score: '83' },
  { name: 'Arianna Lupi', score: '73' },
  { name: 'Estylopia', score: '67' },
];

const CLIENTS_SEO = ['money.com', 'Miami Herald', 'Holafly', 'Souma Hotel Lima', 'TheSmokyRolling', 'DSLX', 'Vallas Venezuela', 'TheSmokyBox', 'Florida Health Care Academy', 'Delta Cloudz', 'Tursi Digital Nomads', 'The Sosa Team', 'Florida Top Roofs', 'Felipe Vergara', 'Storybook app'];
const CLIENTS_DEV = ['Luxembourg Philharmonie', 'Arianna Lupi', 'Apturio', 'Childrenchic', 'TuMundoSalud', 'Crédito USS', 'Wiñaypaq', 'Dr. Manuel A. Vargas Hidalgo', 'Puntada con Amor', 'Aprendoclub', 'Pro Torque Diesel', 'Cresory', 'Estylopia'];
const FIXES = [
  { sha: '23646a1', constant: 'HREFLANG_CODE' },
  { sha: '6849e95', constant: 'SITEMAP_CODE' },
  { sha: '4f8942e', constant: 'AVIF_CODE' },
];
const COMMIT_BASE = 'https://github.com/Sve-nnN/website/commit/';

const DASHES = /[–—]/;
const HEADING_PUNCT = /[.,:;!]/;

/** Sondea desde Node: con SwiftShader ocupando el hilo principal, waitForFunction dentro de la pagina llega tarde. */
async function waitReady(page, timeout = 20000) {
  const t0 = Date.now();
  const ready = page.locator('[data-sections-ready="true"]');
  while (Date.now() - t0 < timeout) {
    if ((await ready.count()) > 0) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

/** Extrae el texto literal de una constante de plantilla de scripts/seed-home.ts. */
function seedConstant(source, name) {
  const m = source.replace(/\r\n/g, '\n').match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`\\n`));
  return m ? m[1].replace(/\\([\\`$])/g, '$1') : null;
}

export async function run(ctx) {
  const { check, openPage, paths } = ctx;
  const logs = [];
  const open = async (lang, viewport = { width: 1440, height: 900 }) => {
    const res = await openPage(ctx.lang(lang), { viewport });
    logs.push(res.log);
    const ready = await waitReady(res.page);
    return { ...res, ready };
  };
  const sel = (id) => `section[data-section="${id}"]`;

  let seed = null;
  try {
    seed = fs.readFileSync(path.join(paths.REPO, 'scripts', 'seed-home.ts'), 'utf8');
  } catch {
    seed = null;
  }

  for (const lang of ['es', 'en']) {
    const { page, ready } = await open(lang);
    check(`p0. ${lang}: las secciones montan (data-sections-ready)`, ready);

    // p1
    const structure = await page.evaluate((own) => {
      const all = [...document.querySelectorAll('section[data-section]')].map((s) => s.getAttribute('data-section'));
      const order = all.filter((id) => own.includes(id));
      const labelled = own.map((id) => {
        const s = document.querySelector(`section[data-section="${id}"]`);
        if (!s) return `${id}:falta`;
        const ref = s.getAttribute('aria-labelledby');
        const h2 = ref ? document.getElementById(ref) : null;
        return h2 && h2.tagName === 'H2' && s.contains(h2) && h2.textContent.trim() ? null : `${id}:sin h2 referenciado`;
      });
      return { order, problems: labelled.filter(Boolean) };
    }, OWN);
    check(
      `p1. ${lang}: ${OWN.join(', ')} existen en ese orden, cada una con un h2 referenciado por aria-labelledby`,
      JSON.stringify(structure.order) === JSON.stringify(OWN) && structure.problems.length === 0,
      `orden=${structure.order.join(',')} problemas=${structure.problems.join(' ') || 'ninguno'}`,
    );

    // p2
    const clients = await page.evaluate((s) => {
      const root = document.querySelector(s);
      if (!root) return null;
      const groups = [...root.querySelectorAll('.hm-group')].map((g) => ({
        names: [...g.querySelectorAll('ul > li')].map((li) => li.textContent.trim()),
        count: (g.querySelector('p.card__meta')?.textContent ?? '').trim(),
      }));
      return { groups, images: root.querySelectorAll('img, picture, svg image').length, text: root.textContent };
    }, sel('clientes'));
    const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
    check(
      `p2. ${lang}: clientes son 28 li en dos grupos de 15 y 13 con los nombres del mapa en orden, 0 img y el conteo visible`,
      !!clients &&
        clients.groups.length === 2 &&
        sameList(clients.groups[0].names, CLIENTS_SEO) &&
        sameList(clients.groups[1].names, CLIENTS_DEV) &&
        clients.images === 0 &&
        /^15\b/.test(clients.groups[0].count) &&
        /^13\b/.test(clients.groups[1].count),
      clients ? `grupos=${clients.groups.map((g) => g.names.length).join('+')} conteos=${clients.groups.map((g) => g.count).join(' | ')} img=${clients.images}` : 'sin seccion',
    );

    // p3
    const fixes = await page.evaluate((s) => {
      const root = document.querySelector(s);
      if (!root) return null;
      return {
        surface: root.getAttribute('data-surface'),
        canvas: root.querySelectorAll('canvas').length,
        articles: [...root.querySelectorAll('article')].map((a) => {
          const pre = a.querySelector('pre');
          const link = a.querySelector('figcaption a');
          return {
            preLang: pre?.getAttribute('lang') ?? null,
            code: pre?.querySelector('code')?.textContent ?? null,
            commit: link?.getAttribute('href') ?? null,
            linkText: link?.textContent ?? '',
          };
        }),
      };
    }, sel('errores-reales'));
    let codeOk = false;
    let codeDetail = 'sin seed-home.ts';
    if (fixes && seed) {
      const results = FIXES.map((f, i) => {
        const expected = seedConstant(seed, f.constant);
        const got = fixes.articles[i];
        if (expected === null) return `${f.constant}:no se encontro en el seed`;
        if (!got) return `${f.constant}:falta el articulo`;
        if (got.preLang !== 'en') return `${f.constant}:pre sin lang=en`;
        if (got.code !== expected) return `${f.constant}:el codigo difiere del seed (${got.code?.length} vs ${expected.length} caracteres)`;
        if (got.commit !== COMMIT_BASE + f.sha) return `${f.constant}:enlace ${got.commit}`;
        if (!got.linkText.includes(f.sha)) return `${f.constant}:el texto del enlace no trae el hash`;
        return null;
      }).filter(Boolean);
      codeOk = results.length === 0;
      codeDetail = results.join(' ') || 'tres fixes identicos al seed';
    }
    check(
      `p3. ${lang}: tres articulos con pre[lang=en] identico al seed, enlace exacto al commit, data-surface=reading y 0 canvas`,
      !!fixes && fixes.articles.length === 3 && codeOk && fixes.surface === 'reading' && fixes.canvas === 0,
      fixes ? `articulos=${fixes.articles.length} surface=${fixes.surface} canvas=${fixes.canvas} ${codeDetail}` : 'sin seccion',
    );

    // p9
    const prefix = lang === 'en' ? 'https://juan-tech.com/en/case-studies/' : 'https://juan-tech.com/case-studies/';
    const casos = await page.evaluate((s) => {
      const root = document.querySelector(s);
      if (!root) return null;
      return {
        text: root.textContent,
        cards: [...root.querySelectorAll('article')].map((a) => ({
          title: a.querySelector('h3')?.textContent ?? '',
          links: [...a.querySelectorAll('a')].map((l) => l.getAttribute('href')),
          titleLink: a.querySelector('h3 a')?.getAttribute('href') ?? null,
          metric: a.querySelector('.badge')?.textContent ?? '',
        })),
      };
    }, sel('casos'));
    const expectedMetrics = ['+406', '+309', '+83'];
    const casosOk =
      !!casos &&
      casos.cards.length === 3 &&
      casos.cards.every((c, i) => c.titleLink === prefix + CASE_SLUGS[i] && c.links.length === 1 && c.metric.includes(expectedMetrics[i]) && !/[.,]/.test(c.title)) &&
      !/(?<!\d)(68|143|104)(?!\d)/.test(casos.text);
    check(
      `p9. ${lang}: casos tiene 3 tarjetas con enlace de slug permitido, metricas +406, +309 y +83, titulos sin . ni , y sin 68, 143 ni 104`,
      casosOk,
      casos ? casos.cards.map((c) => `${c.metric.trim()} -> ${c.titleLink}`).join(' | ') : 'sin seccion',
    );

    // p10
    const websites = await page.evaluate((s) => {
      const root = document.querySelector(s);
      if (!root) return null;
      return {
        pending: root.querySelectorAll('.badge--pending').length,
        cards: [...root.querySelectorAll('article')].map((a) => ({
          name: a.querySelector('h3')?.textContent.trim() ?? '',
          score: a.querySelector('.hm-site__value')?.textContent.trim() ?? '',
        })),
      };
    }, sel('websites'));
    check(
      `p10. ${lang}: websites tiene 3 tarjetas (Apturio 83, Arianna Lupi 73, Estylopia 67) y exactamente un .badge--pending`,
      !!websites && websites.pending === 1 && websites.cards.length === 3 && websites.cards.every((c, i) => c.name === SITES[i].name && c.score === SITES[i].score),
      websites ? `pendientes=${websites.pending} ${websites.cards.map((c) => `${c.name} ${c.score}`).join(' | ')}` : 'sin seccion',
    );

    // p11
    const order = structure.order;
    check(
      `p11. ${lang}: casos y websites van despues de errores-reales, en ese orden`,
      order.indexOf('errores-reales') < order.indexOf('casos') && order.indexOf('casos') < order.indexOf('websites') && order.indexOf('casos') > -1,
      order.join(','),
    );

    // p5 y p6
    const texts = await page.evaluate((ids) => {
      return ids.map((id) => {
        const s = document.querySelector(`section[data-section="${id}"]`);
        return {
          id,
          headings: s ? [...s.querySelectorAll('h2, h3')].map((h) => h.textContent.trim()) : [],
          text: s ? s.textContent : '',
        };
      });
    }, OWN);
    const badHeadings = texts.flatMap((t) => t.headings.filter((h) => HEADING_PUNCT.test(h)).map((h) => `${t.id}:${h}`));
    check(`p5. ${lang}: ningun h2 ni h3 lleva . , : ; !`, badHeadings.length === 0, badHeadings.join(' | ') || 'limpio');
    const badText = texts.filter((t) => DASHES.test(t.text) || t.text.includes('[PENDIENTE')).map((t) => t.id);
    check(`p6. ${lang}: sin U+2013, U+2014 ni el literal [PENDIENTE en el texto`, badText.length === 0, badText.join(' ') || 'limpio');
  }

  // p4: reflow a 320 px
  for (const lang of ['es', 'en']) {
    const { page } = await open(lang, { width: 320, height: 700 });
    const o = await page.evaluate((ids) => {
      const doc = document.documentElement;
      return {
        doc: doc.scrollWidth - doc.clientWidth,
        sections: ids.map((id) => {
          const s = document.querySelector(`section[data-section="${id}"]`);
          return s ? `${id}:${s.scrollWidth - s.clientWidth}` : `${id}:falta`;
        }),
        pre: [...document.querySelectorAll('section[data-section] pre')].filter((p) => p.scrollWidth > p.clientWidth).length,
      };
    }, OWN);
    check(
      `p4. ${lang}: a 320 px no hay desborde horizontal en la pagina ni en las secciones propias`,
      o.doc <= 0 && o.sections.every((s) => s.endsWith(':0')) && o.pre === 0,
      `pagina=${o.doc} ${o.sections.join(' ')} pre=${o.pre}`,
    );
  }

  // p7: lint de copy como proceso hijo
  const files = COPY_FILES.map((n) => path.join(paths.APP, 'src', 'home', 'copy', `${n}.json`));
  const lint = spawnSync(process.execPath, [path.join(paths.APP, 'scripts', 'check-copy.mjs'), ...files], { encoding: 'utf8' });
  check('p7. check-copy.mjs sobre los JSON de este plan termina en 0', lint.status === 0, `codigo=${lint.status} ${(lint.stdout.split('\n').filter((l) => /^(FAIL|RESULT)/.test(l)).join(' | ')).slice(0, 300)}`);

  // p8
  const errors = logs.flatMap((l) => [...l.console, ...l.pageerrors]);
  const external = logs.flatMap((l) => l.external);
  check('p8. 0 errores de consola y 0 peticiones fuera de 127.0.0.1', errors.length === 0 && external.length === 0, `errores=${errors.length} externas=${external.length} ${errors.concat(external).slice(0, 3).join(' | ')}`);
}
