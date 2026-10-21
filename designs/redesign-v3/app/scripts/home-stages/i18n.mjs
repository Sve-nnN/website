/*
 * Etapa i18n de la home v4 (52-06, HOME-04, D-06, D-13): paridad ES/EN, metas y alternador de idioma
 * sobre el DOM renderizado de / y /en.
 *
 * Chequeos i1..i7. Los permisos de texto identico entre idiomas viven en la constante SAME_ALLOWED de
 * este archivo (el copy v4 no trae _sameAllowed) y se listan en el SUMMARY.
 */
import fs from 'node:fs';
import path from 'node:path';

const DESKTOP = { width: 1440, height: 900 };

// Nombres propios, siglas y cadenas de marca que son identicos a proposito en ES y EN. Se declaran aqui y
// se listan en el SUMMARY (T-52-09: ningun chequeo se elimina ni se baja un umbral; solo se permiten estos).
const SAME_ALLOWED = new Set([
  'JAJuan Carlos Angulo', // enlace de marca completo: monograma + nombre propio (cabecera)
  'Juan Carlos Angulo', // nombre propio de marca (cabecera y pie)
  'JA', // monograma de marca
  'ES', // sigla del idioma
  'EN', // sigla del idioma
  'Performance', // nombre de la metrica de Lighthouse
  'Websites', // seccion del menu movil (etiqueta de producto, igual en ES y EN)
  'P', // avatar de maqueta (aria-hidden)
  'Apturio', // nombre de cliente
  'Arianna Lupi', // nombre de cliente
  'Estylopia', // nombre de cliente
  'ariannalupi.com', // host de cliente
  'estylopia.com', // host de cliente
  'LCP', // sigla tecnica de Core Web Vitals
  'CLS', // sigla tecnica de Core Web Vitals
  'INP', // sigla tecnica de Core Web Vitals
  'TTFB', // sigla tecnica de Core Web Vitals
  'Stack', // etiqueta de producto en el directorio del pie
  'Sitemap XML', // recurso tecnico sin traduccion
  'LinkedIn', // nombre de red social
  'hello@juan-tech.com', // buzon de contacto (identico a proposito)
]);

const WORD = '\\p{L}\\p{N}_';
const wordRe = (words) => new RegExp(`(?<![${WORD}])(?:${words.join('|')})(?![${WORD}])`, 'giu');
const ES_STOP = ['el', 'la', 'los', 'las', 'del', 'para', 'con', 'una', 'por', 'que', 'sobre'];
const EN_STOP = ['the', 'and', 'with', 'for', 'your', 'from', 'that'];

/** Corre en el navegador: reune estructura, conteos, textos y metas de la ruta ya renderizada. */
function collect() {
  const txt = (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const count = (sel) => document.querySelectorAll(sel).length;
  // El texto visible excluye lo que no es copy de la pagina: script/style, decoracion aria-hidden, elementos con
  // su propio lang, bloques de codigo y los pendientes visibles.
  const visibleText = () => {
    const SKIP = 'script, style, noscript, pre, code, [aria-hidden="true"], [lang]:not(html)';
    const parts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest(SKIP) || !p.checkVisibility()) continue;
      parts.push(n.nodeValue);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };
  const sections = [...document.querySelectorAll('main > section')].map((s) => s.id || s.getAttribute('aria-label') || s.className.split(' ')[0]);
  const headText = (sel) => [...document.querySelectorAll(sel)].map(txt).filter(Boolean);
  return {
    htmlLang: document.documentElement.lang,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    sections,
    counts: {
      h1: count('h1'),
      h2: count('h2'),
      h3: count('h3'),
      a: count('a[href]'),
      li: count('li'),
      details: count('details'),
      summary: count('summary'),
      button: count('button'),
      input: count('input'),
      textarea: count('textarea'),
      pending: count('.stamp-warn'),
    },
    heads: {
      h1: headText('h1'),
      h2: headText('h2'),
      h3: headText('h3'),
      nav: headText('header.nav a, header.nav button'),
      footer: headText('footer a, footer h3'),
    },
    visible: visibleText(),
    langBtns: [...document.querySelectorAll('.lang button[lang]')].map((b) => ({ lang: b.getAttribute('lang'), pressed: b.getAttribute('aria-pressed'), text: txt(b) })),
  };
}

export async function run(ctx) {
  const { check, paths, openPage, lang, shots } = ctx;

  const data = {};
  for (const l of ['es', 'en']) {
    const { context, page } = await openPage(lang(l), { viewport: DESKTOP });
    await page.waitForFunction(() => document.documentElement.dataset.fx && document.documentElement.dataset.fx !== 'wait', null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(400);
    data[l] = await page.evaluate(collect);
    await context.close();
  }
  const { es, en } = data;

  // i1: mismas secciones en el mismo orden.
  const sectionsMatch = es.sections.join(',') === en.sections.join(',');
  check('i1. / y /en tienen las mismas secciones en el mismo orden', sectionsMatch, `es=${es.sections.join(',')} | en=${en.sections.join(',')}`);

  // i2: mismos conteos (la franja de clientes duplica la lista aria-hidden en ambos idiomas, asi que el
  // numero de li, a y pendientes es simetrico; el marcador de pendientes es .stamp-warn, renderizado igual en ES y EN).
  const countKeys = Object.keys(es.counts);
  const diffs = countKeys.filter((k) => es.counts[k] !== en.counts[k]).map((k) => `${k}: es=${es.counts[k]} en=${en.counts[k]}`);
  check('i2. mismos conteos de h1, h2, h3, a, li, details, summary, button, input, textarea y pendientes', diffs.length === 0, diffs.join(' ; ') || JSON.stringify(es.counts));

  // i3: ningun texto de encabezado, navegacion o pie es identico entre idiomas salvo SAME_ALLOWED.
  for (const [kind, label] of [['h1', 'h1'], ['h2', 'h2'], ['h3', 'h3'], ['nav', 'cabecera'], ['footer', 'pie']]) {
    const a = es.heads[kind];
    const b = en.heads[kind];
    const same = [];
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) if (a[i] === b[i] && !SAME_ALLOWED.has(a[i])) same.push(`#${i} "${a[i]}"`);
    check(`i3${kind}. ${label}: ningun texto igual entre ES y EN salvo SAME_ALLOWED`, a.length === b.length && same.length === 0, same.slice(0, 6).join(' ; ') || `${a.length} textos`);
  }

  // i4: mezcla de idiomas (maximo 2 palabras vacias del otro idioma).
  const hits = (text, words) => [...text.matchAll(wordRe(words))].map((m) => m[0].toLowerCase());
  const esInEn = hits(en.visible, ES_STOP);
  const enInEs = hits(es.visible, EN_STOP);
  check('i4a. /en: como maximo 2 palabras vacias del espanol', esInEn.length <= 2, `hallazgos=${esInEn.length} ${[...new Set(esInEn)].join(',')}`);
  check('i4b. /: como maximo 2 palabras vacias del ingles', enInEs.length <= 2, `hallazgos=${enInEs.length} ${[...new Set(enInEs)].join(',')}`);

  // i5: metas.
  const lenOf = (s) => [...s].length;
  const titleOk = (s) => lenOf(s) <= 60 && !/[.,]$/.test(s) && s.endsWith(' | Juan Carlos Angulo');
  check('i5a. html[lang] es "es" en / y "en" en /en', es.htmlLang === 'es' && en.htmlLang === 'en', `es=${es.htmlLang} en=${en.htmlLang}`);
  check('i5b. los titulos difieren, miden 60 o menos, terminan en " | Juan Carlos Angulo" y no llevan punto ni coma final', es.title !== en.title && titleOk(es.title) && titleOk(en.title), `es="${es.title}" (${lenOf(es.title)}) en="${en.title}" (${lenOf(en.title)})`);
  const descOk = (s) => lenOf(s) >= 110 && lenOf(s) <= 160;
  check('i5c. la meta description mide entre 110 y 160 caracteres y difiere entre idiomas', descOk(es.description) && descOk(en.description) && es.description !== en.description, `es=${lenOf(es.description)} en=${lenOf(en.description)}`);

  // i6: alternador de idioma (en v4 son botones con pushState, no enlaces).
  {
    const { context, page } = await openPage('/', { viewport: DESKTOP });
    await page.waitForSelector('h1');
    await page.click('.lang button[lang="en"]');
    await page.waitForTimeout(300);
    const afterEn = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      path: location.pathname,
      pressed: document.querySelector('.lang button[lang="en"]')?.getAttribute('aria-pressed'),
    }));
    check('i6a. clic en EN cambia html lang, H1, titulo, descripcion, URL /en y aria-pressed', afterEn.lang === 'en' && afterEn.path === '/en' && afterEn.title === en.title && afterEn.desc === en.description && afterEn.h1 !== es.heads.h1[0] && afterEn.pressed === 'true', JSON.stringify(afterEn).slice(0, 240));
    await page.click('.lang button[lang="es"]');
    await page.waitForTimeout(300);
    const afterEs = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      path: location.pathname,
      pressed: document.querySelector('.lang button[lang="es"]')?.getAttribute('aria-pressed'),
    }));
    check('i6b. clic en ES devuelve lang, titulo, URL / y aria-pressed', afterEs.lang === 'es' && afterEs.path === '/' && afterEs.title === es.title && afterEs.pressed === 'true', JSON.stringify(afterEs));
    await context.close();

    const direct = await openPage('/en', { viewport: DESKTOP });
    await direct.page.waitForSelector('h1');
    const enDirect = await direct.page.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim() }));
    check('i6c. la carga directa de /en rinde lang="en" con el H1 y titulo de EN', enDirect.lang === 'en' && enDirect.title === en.title && enDirect.h1 === en.heads.h1[0], JSON.stringify(enDirect).slice(0, 200));
    await direct.context.close();
  }

  // i7: capturas i18n por debajo de 400 KB.
  {
    for (const l of ['es', 'en']) {
      const { context, page } = await openPage(lang(l), { viewport: DESKTOP });
      await page.waitForTimeout(1200);
      const { file, size } = await shots.jpeg({ page, name: `i18n-${l}-desktop.jpg`, quality: 75 });
      check(`i7. i18n-${l}-desktop.jpg pesa menos de 400 KB`, size < 400 * 1024, `${(size / 1024).toFixed(0)} KB (${path.basename(file)})`);
      await context.close();
    }
  }
}
