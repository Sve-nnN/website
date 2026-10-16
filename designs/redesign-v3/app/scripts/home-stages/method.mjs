/*
 * Stage method de la home: servicios, auditor, about, oferta y FAQ.
 * Chequeos m1 a m16 (ver 52-04-PLAN.md, tareas 1 a 3). Los ids se comparan en orden relativo:
 * entre ellos pueden vivir secciones de otros planes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const MINE = ['servicios', 'auditor', 'about', 'oferta', 'faq'];
const COPY_FILES = ['servicios', 'auditor', 'about', 'oferta', 'faq'];
const SLUGS = ['seo-technical-audit', 'seo-consulting', 'fullstack-development', 'ai-seo-geo'];
const DASH = /[–—]/;
const HEADING_PUNCT = /[.,:;!]/;
const PENDING_RE = /\[PENDIENTE:[ \t]*([^\]\n]*[^\]\s][^\]\n]*)\]/g;

const sectionSel = (id) => `section[data-section="${id}"]`;

async function ready(page) {
  await page.waitForSelector('[data-sections-ready="true"]', { state: 'attached', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
}

export async function run(ctx) {
  const { check, openPage, paths } = ctx;
  const copyDir = path.join(paths.APP, 'src', 'home', 'copy');
  const readCopy = (name) => JSON.parse(fs.readFileSync(path.join(copyDir, `${name}.json`), 'utf8'));
  const copy = Object.fromEntries(COPY_FILES.map((n) => [n, readCopy(n)]));
  const logs = [];

  const open = async (lang, viewport = { width: 1440, height: 900 }) => {
    const res = await openPage(ctx.lang(lang), { viewport });
    logs.push(res.log);
    await ready(res.page);
    return res;
  };

  for (const lang of ['es', 'en']) {
    const { page } = await open(lang);
    const tag = lang.toUpperCase();

    // m1, m7, m14: presencia, h2 referenciado y orden relativo de las cinco secciones
    const info = await page.evaluate((ids) => {
      const all = [...document.querySelectorAll('section[data-section]')].map((s) => s.getAttribute('data-section'));
      const rows = ids.map((id) => {
        const s = document.querySelector(`section[data-section="${id}"]`);
        if (!s) return { id, present: false };
        const labelledby = s.getAttribute('aria-labelledby');
        const h2 = labelledby ? document.getElementById(labelledby) : null;
        return { id, present: true, h2: h2 ? h2.tagName : null, h2inside: !!h2 && s.contains(h2), h2count: s.querySelectorAll(':scope > h2').length };
      });
      return { all, rows };
    }, MINE);
    const order = info.all.filter((id) => MINE.includes(id));
    check(
      `m1. ${tag}: cinco secciones presentes, cada una con su h2 referenciado por aria-labelledby`,
      info.rows.every((r) => r.present && r.h2 === 'H2' && r.h2inside && r.h2count === 1),
      JSON.stringify(info.rows.filter((r) => !(r.present && r.h2 === 'H2'))) || 'ok',
    );
    check(`m14. ${tag}: orden servicios, auditor, about, oferta, faq`, order.join(',') === MINE.join(','), order.join(','));

    // m2 servicios
    const svc = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      const cards = [...s.querySelectorAll('article.card--link')];
      return {
        n: cards.length,
        links: cards.map((c) => c.querySelectorAll('a').length),
        hrefs: cards.map((c) => c.querySelector('h3.card__title a')?.getAttribute('href') ?? ''),
        titles: cards.map((c) => c.querySelector('h3.card__title a')?.textContent?.trim() ?? ''),
      };
    }, sectionSel('servicios'));
    const prefix = lang === 'es' ? 'https://juan-tech.com/servicios/' : 'https://juan-tech.com/en/services/';
    check(
      `m2. ${tag}: cuatro tarjetas, un solo enlace cada una hacia los cuatro slugs`,
      svc.n === 4 && svc.links.every((n) => n === 1) && SLUGS.every((s, i) => svc.hrefs[i] === `${prefix}${s}`),
      JSON.stringify(svc.hrefs),
    );
    check(
      `m2b. ${tag}: titulos de servicios sin . , : ; ! y con mayuscula inicial`,
      svc.titles.length === 4 && svc.titles.every((t) => !HEADING_PUNCT.test(t) && /^\p{Lu}/u.test(t)),
      svc.titles.join(' | '),
    );

    // m3 auditor
    const aud = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      const values = [...s.querySelectorAll('.hm-stats dd')].map((d) => d.textContent.trim());
      const cwv = s.querySelector('.hm-stats dd abbr');
      const a = s.querySelector('a[href^="https://auditor.juan-tech.com"]');
      return {
        values,
        cwvTitle: cwv?.getAttribute('title') ?? null,
        cwvText: cwv?.textContent ?? null,
        target: a?.getAttribute('target') ?? null,
        rel: a?.getAttribute('rel') ?? '',
        name: a?.textContent?.trim() ?? '',
      };
    }, sectionSel('auditor'));
    const note = copy.auditor[lang].newTabNote;
    check(
      `m3. ${tag}: auditor con 29, 5, 500 y CWV con abbr, enlace con noopener noreferrer y aviso de pestana nueva`,
      ['29', '5', '500', 'CWV'].every((v, i) => aud.values[i] === v) &&
        aud.cwvTitle === 'Core Web Vitals' &&
        aud.cwvText === 'CWV' &&
        aud.target === '_blank' &&
        /\bnoopener\b/.test(aud.rel) &&
        /\bnoreferrer\b/.test(aud.rel) &&
        aud.name.includes(note),
      JSON.stringify(aud),
    );

    // m4 y m9 texto dentro de .fx-content
    for (const [id, m] of [['auditor', 'm4'], ['oferta', 'm9b']]) {
      const stray = await page.evaluate((sel) => {
        const card = document.querySelector(`${sel} article.card--gradient`);
        const out = [];
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (n.textContent.trim() && !n.parentElement.closest('.fx-content')) out.push(n.textContent.trim().slice(0, 40));
        }
        return { stray: out, gradient: card.classList.contains('fx-grain'), canvas: card.querySelectorAll('canvas').length };
      }, sectionSel(id));
      check(`${m}. ${tag}: todo el texto de la tarjeta de ${id} vive dentro de .fx-content, gradiente CSS sin canvas`, stray.stray.length === 0 && stray.gradient && stray.canvas === 0, JSON.stringify(stray));
    }

    // m8 about
    const about = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      return {
        h3: s.querySelectorAll('h3').length,
        badges: s.querySelectorAll('.badge--pending').length,
        img: s.querySelectorAll('img, picture, svg, canvas').length,
        text: s.innerText,
        abbrs: [...s.querySelectorAll('abbr')].map((a) => a.textContent),
      };
    }, sectionSel('about'));
    const aboutJson = JSON.stringify(copy.about[lang]);
    const markers = [...aboutJson.matchAll(PENDING_RE)].map((m) => m[1]);
    const measured = markers.filter((m) => /dato medido/.test(m)).length;
    check(
      `m8. ${tag}: about con cuatro h3, ${markers.length} pendientes (2 de media + ${measured} de dato medido), sin imagenes ni folleto`,
      about.h3 === 4 &&
        markers.length - measured === 2 &&
        about.badges === markers.length &&
        about.img === 0 &&
        !/100\/100|metodolog|motor principal|obsesi/i.test(about.text),
      `h3=${about.h3} badges=${about.badges} marcadores=${markers.length} img=${about.img}`,
    );
    check(`m8b. ${tag}: about marca la primera aparicion de las siglas con abbr`, about.abbrs.length >= 5 && new Set(about.abbrs).size === about.abbrs.length, about.abbrs.join(','));

    // m9 oferta
    const offer = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      const cta = s.querySelector('a.btn--primary[href="#contacto"]');
      return { text: s.innerText, items: s.querySelectorAll('ul li').length, cta: !!cta };
    }, sectionSel('oferta'));
    check(
      `m9. ${tag}: oferta con 600 USD, 10 dias, cinco items y CTA a #contacto${lang === 'en' ? ', sin "We"' : ''}`,
      offer.text.includes('600 USD') && /\b10\b/.test(offer.text) && offer.items === 5 && offer.cta && (lang === 'es' || !/\bWe\b/.test(offer.text)),
      `items=${offer.items} cta=${offer.cta}`,
    );

    // m11 y m12 FAQ
    const faq = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      return {
        surface: s.getAttribute('data-surface'),
        details: s.querySelectorAll('details').length,
        canvas: s.querySelectorAll('canvas').length,
        grain: s.querySelectorAll('.fx-grain').length + (s.classList.contains('fx-grain') ? 1 : 0),
        questions: [...s.querySelectorAll('summary')].map((x) => x.textContent.trim()),
        heights: [...s.querySelectorAll('summary')].map((x) => x.getBoundingClientRect().height),
      };
    }, sectionSel('faq'));
    check(`m11. ${tag}: FAQ en superficie de lectura con cinco details, 0 canvas y 0 fx-grain`, faq.surface === 'reading' && faq.details === 5 && faq.canvas === 0 && faq.grain === 0, JSON.stringify({ ...faq, questions: undefined, heights: undefined }));
    check(`m12a. ${tag}: cada summary mide 44px o mas`, faq.heights.length === 5 && faq.heights.every((h) => h >= 44), faq.heights.map((h) => Math.round(h)).join(','));
    check(`m13. ${tag}: preguntas sin . , : ; !`, faq.questions.every((q) => !/[.,:;!]/.test(q)), faq.questions.join(' | '));

    const summary = page.locator(`${sectionSel('faq')} details > summary`).first();
    await summary.focus();
    await page.keyboard.press('Enter');
    const afterEnter = await page.evaluate((sel) => document.querySelector(`${sel} details`).open, sectionSel('faq'));
    await page.keyboard.press('Space');
    const afterSpace = await page.evaluate((sel) => document.querySelector(`${sel} details`).open, sectionSel('faq'));
    check(`m12b. ${tag}: Enter abre y Espacio cierra el details`, afterEnter === true && afterSpace === false, `enter=${afterEnter} space=${afterSpace}`);

    // m5, m10, m15: guiones, literal [PENDIENTE, texto de otros idiomas en EN
    const text = await page.evaluate((ids) => ids.map((id) => document.querySelector(`section[data-section="${id}"]`)?.innerText ?? '').join('\n'), MINE);
    check(`m5. ${tag}: sin guiones largos o cortos ni literal [PENDIENTE en el texto visible`, !DASH.test(text) && !text.includes('[PENDIENTE'), '');
    if (lang === 'en') {
      // Los pendientes son anotaciones de revision en espanol (lang="es"); se quitan antes de buscar espanol.
      const outsidePending = await page.evaluate((ids) => {
        return ids
          .map((id) => {
            const clone = document.querySelector(`section[data-section="${id}"]`).cloneNode(true);
            clone.querySelectorAll('[data-pending]').forEach((n) => n.remove());
            return clone.textContent;
          })
          .join('\n');
      }, MINE);
      const spanish = outsidePending.match(/\b(el|los|las|del|para|con|una|sobre)\b/g) ?? [];
      check('m10. EN: sin bloques en espanol fuera de los pendientes', spanish.length === 0, spanish.join(',') || 'ninguno');
    }
  }

  // m5 red y consola
  const external = logs.flatMap((l) => l.external);
  const errors = logs.flatMap((l) => [...l.console, ...l.pageerrors]);
  check('m5b. 0 peticiones fuera de 127.0.0.1', external.length === 0, external.join(' ') || 'ninguna');
  check('m5c. 0 errores de consola o de pagina', errors.length === 0, errors.slice(0, 3).join(' | ') || 'ninguno');

  // m6, m10, m15: lint como proceso hijo
  const files = COPY_FILES.map((n) => path.join(copyDir, `${n}.json`));
  const lint = spawnSync(process.execPath, [path.join(paths.APP, 'scripts', 'check-copy.mjs'), ...files], { encoding: 'utf8' });
  const fails = (lint.stdout || '').split('\n').filter((l) => l.startsWith('FAIL'));
  check('m6. check-copy.mjs sobre los cinco JSON termina en 0', lint.status === 0, fails.slice(0, 3).join(' / ') || (lint.stdout || '').split('\n').filter(Boolean).pop());

  // m16 capturas
  if (ctx.shots) {
    fs.mkdirSync(paths.REPORTS_HOME, { recursive: true });
    for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      const { page } = await open('es', vp);
      await page.waitForTimeout(500);
      const box = await page.evaluate(() => {
        const a = document.querySelector('section[data-section="servicios"]').getBoundingClientRect();
        const b = document.querySelector('section[data-section="faq"]').getBoundingClientRect();
        return { x: 0, y: Math.max(0, a.top + scrollY), width: innerWidth, height: b.bottom + scrollY - (a.top + scrollY) };
      });
      const file = path.join(paths.REPORTS_HOME, `method-${name}.jpg`);
      let quality = 72;
      let size = Infinity;
      while (quality >= 30) {
        await page.screenshot({ path: file, type: 'jpeg', quality, fullPage: true, clip: box });
        size = fs.statSync(file).size;
        if (size < 400 * 1024) break;
        quality -= 12;
      }
      check(`m16. captura ${name} de #servicios a #faq menor de 400 KB`, size < 400 * 1024, `${Math.round(size / 1024)} KB q${quality} ${Math.round(box.height)}px`);
    }
  }
}
