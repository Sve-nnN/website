/*
 * Stage chrome de la home: cabecera, navegacion, selector de idioma y pie.
 * Chequeos c1 a c9 (ver 52-01-PLAN.md, tarea 2).
 */

import fs from 'node:fs';
import path from 'node:path';

const ALLOWED =(href) => href.startsWith('#') || href === '/' || href === '/en' || href.startsWith('https://juan-tech.com/');

export async function run(ctx) {
  const { check, openPage } = ctx;
  const open = (lang, viewport) => openPage(ctx.lang(lang), { viewport });

  for (const lang of ['es', 'en']) {
    // c1
    const { page } = await open(lang);
    const counts = await page.evaluate(() => ({
      header: document.querySelectorAll('header').length,
      nav: document.querySelectorAll('nav[aria-label]').length,
      navAll: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main#contenido').length,
      footer: document.querySelectorAll('footer').length,
    }));
    check(
      `c1. ${lang}: un header, un nav con aria-label, un main#contenido y un footer`,
      counts.header === 1 && counts.nav === 1 && counts.navAll === 1 && counts.main === 1 && counts.footer === 1,
      JSON.stringify(counts),
    );

    // c2
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => document.activeElement?.className ?? '');
    await page.keyboard.press('Enter');
    const after = await page.evaluate(() => ({ hash: location.hash, id: document.activeElement?.id ?? '' }));
    check(
      `c2. ${lang}: el enlace de salto es el primer foco y al activarlo el foco queda en #contenido`,
      first.includes('skip-link') && after.hash === '#contenido' && after.id === 'contenido',
      `primer foco=${first} hash=${after.hash} foco=${after.id}`,
    );

    // c3
    const mobile = await open(lang, { width: 390, height: 844 });
    const summary = mobile.page.locator('details.nav__menu > summary');
    await summary.focus();
    await mobile.page.keyboard.press('Enter');
    const menuLinks = await mobile.page.locator('details.nav__menu a').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0).length);
    const barHidden = await mobile.page.locator('ul.nav__list--bar').isHidden();
    const wide = await open(lang, { width: 1440, height: 900 });
    const barLinks = await wide.page.locator('ul.nav__list--bar a').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0).length);
    const menuHidden = await wide.page.locator('details.nav__menu').isHidden();
    check(
      `c3. ${lang}: a 390 px el menu abre con Enter y muestra 5 enlaces; a 1440 px la barra muestra 5 sin menu`,
      menuLinks === 5 && barHidden && barLinks === 5 && menuHidden,
      `menu=${menuLinks} barraOculta390=${barHidden} barra=${barLinks} menuOculto1440=${menuHidden}`,
    );

    // c4
    const overflow = [];
    for (const width of [320, 390, 1440]) {
      const { page: p } = await open(lang, { width, height: 844 });
      const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      if (o.sw > o.cw) overflow.push(`${width}:${o.sw}>${o.cw}`);
    }
    check(`c4. ${lang}: sin desborde horizontal a 320, 390 y 1440 px`, overflow.length === 0, overflow.join(' ') || 'sin desborde');

    // c5
    for (const target of ['es', 'en']) {
      const { page: p } = await open(target);
      const info = await p.evaluate(() => {
        const links = [...document.querySelectorAll('ul.lang a')];
        return {
          n: links.length,
          hreflang: links.map((a) => a.getAttribute('hreflang')),
          current: links.filter((a) => a.getAttribute('aria-current') === 'true').map((a) => a.getAttribute('hreflang')),
        };
      });
      if (lang === 'es') {
        check(
          `c5. ${target === 'es' ? '/' : '/en'}: ul.lang con dos enlaces es y en y aria-current en ${target}`,
          info.n === 2 && info.hreflang.join() === 'es,en' && info.current.join() === target,
          JSON.stringify(info),
        );
      }
    }

    // c6
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('header a[href], footer a[href]')].map((a) => a.getAttribute('href')));
    const bad = hrefs.filter((h) => !ALLOWED(h));
    check(`c6. ${lang}: ${hrefs.length} enlaces de cabecera y pie dentro de la lista de destinos permitidos`, hrefs.length > 0 && bad.length === 0, bad.join(' ') || 'todos permitidos');
  }

  // c7 y c8 en desktop y movil
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { page } = await openPage(ctx.lang('es'), { viewport });
    const seen = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        return {
          tag: `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`,
          zone: el.closest('header') ? 'header' : el.closest('footer') ? 'footer' : 'otro',
          outline: Number.parseFloat(s.outlineWidth),
          style: s.outlineStyle,
        };
      });
      if (!info) break;
      seen.push(info);
    }
    const chrome = seen.filter((s) => s.zone !== 'otro');
    const weak = chrome.filter((s) => !(s.outline >= 2 && s.style !== 'none'));
    check(
      `c7. ${viewport.width} px: Tab recorre ${chrome.length} elementos de cabecera y pie y todos muestran contorno de 2 px o mas`,
      chrome.length >= 8 && weak.length === 0,
      weak.map((w) => `${w.tag}:${w.outline}${w.style}`).join(' ') || 'todos con contorno',
    );

    const small = await page.evaluate(() =>
      [...document.querySelectorAll('header a, header button, header summary, footer a, footer button')]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height > 0)
        .filter(({ r }) => r.width < 44 || r.height < 44)
        .map(({ el, r }) => `${el.tagName.toLowerCase()}"${(el.textContent ?? '').trim().slice(0, 18)}" ${r.width.toFixed(0)}x${r.height.toFixed(0)}`),
    );
    check(`c8. ${viewport.width} px: cada enlace y boton visible de cabecera y pie mide al menos 44x44`, small.length === 0, small.join(' | ') || 'todos de 44x44 o mas');
  }

  // c10: favicon declarado (D-13) con los colores de tokens.css
  {
    const res = await fetch(`${ctx.server.url}/favicon.svg`);
    const svg = res.status === 200 ? await res.text() : '';
    const tokens = fs.readFileSync(path.join(ctx.paths.APP, '..', 'assets', 'css', 'tokens.css'), 'utf8');
    const hex = (text) => new Set((text.match(/#[0-9a-f]{6}\b/gi) ?? []).map((h) => h.toLowerCase()));
    const tokenHex = hex(tokens);
    const svgHex = hex(svg);
    const stray = [...svgHex].filter((h) => !tokenHex.has(h));
    const { page } = await open('es');
    const declared = await page.evaluate(() => document.querySelector('link[rel="icon"]')?.getAttribute('href'));
    check(
      'c10. /favicon.svg responde 200 como image/svg+xml, esta declarado y sus colores salen de tokens.css',
      res.status === 200 && (res.headers.get('content-type') ?? '').startsWith('image/svg+xml') && declared === '/favicon.svg' && svgHex.size > 0 && stray.length === 0,
      `estado=${res.status} tipo=${res.headers.get('content-type')} declarado=${declared} colores=${[...svgHex].join(',')} ajenos=${stray.join(',') || 'ninguno'}`,
    );
  }

  // c9
  {
    const { page } = await open('en');
    const btn = page.locator('button[data-fx-pause]');
    const labels = [(await btn.textContent())?.trim()];
    await btn.click();
    labels.push((await btn.textContent())?.trim());
    await btn.click();
    labels.push((await btn.textContent())?.trim());
    check('c9. el boton de pausa conserva su texto al alternar', labels.every((l) => l === 'Pause animations'), labels.join(' / '));
  }
}
