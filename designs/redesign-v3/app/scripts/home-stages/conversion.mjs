/*
 * Stage conversion de la home: contacto, banda de terminal (CRTWarp) y pie completo.
 * Chequeos k1 a k22 (ver 52-05-PLAN.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const MOBILE = { viewport: PHONE, contextOptions: { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } };
const SAVE_DATA_INIT = () => {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: true, addEventListener() {}, removeEventListener() {} },
  });
};
const TERMINAL = '[data-home-effect="terminal"]';
const HERO = '[data-home-effect="hero"]';
const DASH = /[–—]/;

const T = {
  es: {
    mailto: 'mailto:hello@juan-tech.com',
    mock: /mockup/i,
    prefix: '',
    articles: ['/blog/cs-fundamentals/tablas-hash', '/blog/cs-fundamentals/pilas-y-colas', '/blog/cs-fundamentals/recursividad', '/blog/development/hidratacion-web', '/blog/development/react-19'],
  },
  en: {
    mailto: 'mailto:hello@juan-tech.com',
    mock: /mockup/i,
    prefix: '/en',
    articles: ['/blog/cs-fundamentals/tablas-hash', '/blog/cs-fundamentals/pilas-y-colas', '/blog/cs-fundamentals/recursividad', '/blog/development/hidratacion-web', '/blog/development/react-19'],
  },
};
const CASES = [
  '/case-studies/pittsburgh-criminal-defense-legal-content-seo',
  '/case-studies/fabricante-baldosa-hidraulica-seo-espana',
  '/case-studies/immigration-law-atlanta-seo',
  '/case-studies/talleres-costura-miami-lanzamiento-seo-local',
  '/case-studies/urologo-seo-local-salud-santiago-rd',
];

/** Sondea desde Node: con SwiftShader ocupando el hilo principal, waitForFunction dentro de la pagina llega tarde. */
async function until(fn, timeout, step = 100) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return Date.now() - t0;
    await new Promise((r) => setTimeout(r, step));
  }
  return -1;
}

export async function run(ctx) {
  const { check, openPage, paths } = ctx;
  const logs = [];

  /** Abre la home, espera las secciones y el pie, y registra las peticiones que no son de carga de recursos. */
  // Cada pagina deja un canvas corriendo con SwiftShader: antes de abrir otra se cierran las anteriores.
  const opened = [];
  const closeOpened = () => Promise.all(opened.splice(0).map((c) => c.close().catch(() => {})));
  const open = async (lang, opts = {}) => {
    await closeOpened();
    const res = await openPage(ctx.lang(lang), opts);
    opened.push(res.context);
    logs.push(res.log);
    res.net = [];
    res.page.on('request', (r) => {
      const type = r.resourceType();
      if (r.method() !== 'GET' || ['fetch', 'xhr', 'ping', 'eventsource', 'websocket'].includes(type)) res.net.push(`${r.method()} ${type} ${r.url()}`);
    });
    await res.page.waitForSelector('[data-sections-ready="true"]', { state: 'attached', timeout: 120_000 });
    await res.page.waitForSelector('footer.site-footer', { state: 'attached', timeout: 120_000 });
    return res;
  };
  const canvasCount = (page) => page.locator('canvas').count();
  const scrollToBand = (page) => page.evaluate(() => document.querySelector('.hm-terminal')?.scrollIntoView({ block: 'start' }));

  const linksSrc = await import(pathToFileURL(path.join(paths.APP, 'src', 'home', 'links.ts')).href);

  for (const lang of ['es', 'en']) {
    const t = T[lang];
    const { page, net } = await open(lang, { viewport: DESKTOP });

    // k1
    const k1 = await page.evaluate(() => {
      const s = document.querySelector('section[data-section="contacto"]');
      const labelled = s?.getAttribute('aria-labelledby');
      const h = labelled ? document.getElementById(labelled) : null;
      return { exists: Boolean(s), id: s?.id, h2: h?.tagName, text: h?.textContent?.trim() };
    });
    check(`k1. ${lang}: section[data-section="contacto"] con h2 enlazado por aria-labelledby`, k1.exists && k1.id === 'contacto' && k1.h2 === 'H2' && Boolean(k1.text), JSON.stringify(k1));

    // k2
    const k2 = await page.evaluate(() => {
      const form = document.querySelector('#contacto form');
      const fields = [...(form?.querySelectorAll('input, textarea') ?? [])].map((el) => ({
        id: el.id,
        auto: el.getAttribute('autocomplete'),
        required: el.required,
        label: Boolean(document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()),
      }));
      return { form: Boolean(form), action: form?.hasAttribute('action'), status: form?.querySelectorAll('[role="status"]').length, fields };
    });
    const autos = k2.fields.map((f) => f.auto);
    check(
      `k2. ${lang}: tres campos con label[for], autocomplete name/email y required; formulario sin action y con role="status"`,
      k2.form && !k2.action && k2.status === 1 && k2.fields.length === 3 && k2.fields.every((f) => f.label && f.required) && autos[0] === 'name' && autos[1] === 'email' && autos[2] === null,
      JSON.stringify(k2),
    );

    // k3: envio vacio
    const before = net.length;
    await page.locator('#contacto button[type="submit"]').click();
    const k3 = await page.evaluate(() => ({
      errors: document.querySelectorAll('#contacto .field-error').length,
      invalid: [...document.querySelectorAll('#contacto [aria-invalid="true"]')].map((e) => e.id),
      focus: document.activeElement?.id,
      described: [...document.querySelectorAll('#contacto [aria-invalid="true"]')].every((e) => e.getAttribute('aria-describedby')?.split(' ').every((id) => document.getElementById(id))),
    }));
    check(
      `k3. ${lang}: enviar vacio muestra 3 errores con aria-invalid, enfoca el primer campo y no hace peticiones de red`,
      k3.errors === 3 && k3.invalid.length === 3 && k3.focus === 'hm-c-name' && k3.described && net.length === before,
      `${JSON.stringify(k3)} red=${net.slice(before).join(' ; ') || '0'}`,
    );

    // k4: envio valido
    const url0 = page.url();
    const before2 = net.length;
    await page.fill('#hm-c-name', 'Persona de prueba');
    await page.fill('#hm-c-email', 'prueba@example.com');
    await page.fill('#hm-c-message', 'Mensaje de prueba para el mockup.');
    await page.locator('#contacto button[type="submit"]').click();
    const k4 = await page.evaluate(() => ({ status: document.querySelector('#contacto [role="status"]')?.textContent?.trim(), errors: document.querySelectorAll('#contacto .field-error').length }));
    check(
      `k4. ${lang}: enviar valido muestra el estado de mockup, la URL no cambia y no hay peticiones de red`,
      t.mock.test(k4.status ?? '') && k4.errors === 0 && page.url() === url0 && net.length === before2,
      `estado="${k4.status}" url=${page.url() === url0 ? 'igual' : 'cambio'} red=${net.slice(before2).join(' ; ') || '0'}`,
    );

    // k5
    const k5 = await page.evaluate(() => ({
      pending: document.querySelectorAll('#contacto .badge--pending').length,
      has48: /\b48\b/.test(document.body.innerText),
    }));
    check(`k5. ${lang}: el plazo de respuesta es exactamente un .badge--pending y la pagina no dice 48`, k5.pending === 1 && !k5.has48, JSON.stringify(k5));

    // k6
    const mail = await page.locator('#contacto a[href^="mailto:"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    check(`k6. ${lang}: el enlace de correo es ${t.mailto}`, mail.length === 1 && mail[0] === t.mailto, mail.join(','));

    // k7 (el literal y los guiones se miden en el contacto y el pie, que son de este plan)
    const mine = (await page.locator('#contacto, footer.site-footer').allInnerTexts()).join('\n');
    check(`k7. ${lang}: contacto y pie sin guiones largos o cortos y sin el literal [PENDIENTE`, !DASH.test(mine) && !mine.includes('[PENDIENTE'), `dash=${DASH.test(mine)} literal=${mine.includes('[PENDIENTE')}`);

    // k9
    const k9 = await page.evaluate(() => {
      const band = document.querySelector('#contacto .hm-terminal');
      const words = (band?.innerText ?? '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
      const extra = [...(band?.querySelectorAll('a, button, input, h1, h2, h3, p, li, img') ?? [])].length;
      return { aria: band?.getAttribute('aria-hidden'), words: words.length, extra };
    });
    check(`k9. ${lang}: la banda es aria-hidden, tiene 3 palabras o menos y ningun otro contenido con significado`, k9.aria === 'true' && k9.words <= 3 && k9.words > 0 && k9.extra === 0, JSON.stringify(k9));

    // k15 a k21 sobre el pie
    const foot = await page.evaluate(() => {
      const footers = [...document.querySelectorAll('footer')];
      const f = footers[0];
      const sections = [...document.querySelectorAll('section[data-section]')];
      const last = sections.at(-1);
      return {
        footers: footers.length,
        navs: [...(f?.querySelectorAll('nav[aria-label]') ?? [])].length,
        after: sections.every((s) => Boolean(s.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING)),
        lastSection: last?.dataset.section,
        articles: [...document.querySelectorAll('ul[aria-labelledby="hm-footer-articles"] a')].map((a) => a.getAttribute('href')),
        cases: [...document.querySelectorAll('ul[aria-labelledby="hm-footer-cases"] a')].map((a) => a.getAttribute('href')),
        hrefs: [...(f?.querySelectorAll('a[href]') ?? [])].map((a) => a.getAttribute('href')),
        pendings: f?.querySelectorAll('.badge--pending').length,
      };
    });
    check(`k15. ${lang}: un unico footer despues de todas las secciones con tres nav[aria-label] de columna`, foot.footers === 1 && foot.after && foot.navs === 3, JSON.stringify({ footers: foot.footers, navs: foot.navs, after: foot.after }));
    const live = (p) => `https://juan-tech.com${t.prefix}${p}`;
    check(
      `k16. ${lang}: las dos listas tienen 5 enlaces con las rutas del sitio vivo`,
      JSON.stringify(foot.articles) === JSON.stringify(t.articles.map(live)) && JSON.stringify(foot.cases) === JSON.stringify(CASES.map(live)),
      `articulos=${foot.articles.length} casos=${foot.cases.length}`,
    );
    const badHrefs = foot.hrefs.filter((h) => !linksSrc.isAllowedHref(h));
    check(`k17. ${lang}: los ${foot.hrefs.length} enlaces del pie cumplen la lista permitida`, foot.hrefs.length > 0 && badHrefs.length === 0, badHrefs.join(' ') || 'todos permitidos');

    // k18
    const k18 = await page.evaluate(() => {
      const a = [...document.querySelectorAll('ul[aria-labelledby="hm-footer-articles"] a')].find((x) => /Tablas hash/.test(x.textContent));
      const li = a?.closest('li');
      return { lang: a?.getAttribute('lang'), badge: li?.querySelectorAll('.badge--pending').length ?? 0, contiguous: Boolean(a?.nextElementSibling?.matches?.('[data-pending]')) };
    });
    if (lang === 'en') check('k18. en: "Tablas hash" lleva lang="es" y un .badge--pending contiguo', k18.lang === 'es' && k18.badge === 1 && k18.contiguous, JSON.stringify(k18));
    else check('k18. es: el pie no tiene .badge--pending y "Tablas hash" no lleva lang', foot.pendings === 0 && k18.lang === null, `pendientes=${foot.pendings} lang=${k18.lang}`);

    // k19
    const link = page.locator('footer.site-footer').getByRole('link', { name: 'LinkedIn', exact: true });
    const box = await link.boundingBox();
    check(
      `k19. ${lang}: enlace de LinkedIn con nombre accesible y objetivo de 44 px`,
      (await link.count()) === 1 && (await link.getAttribute('href')) === 'https://linkedin.com/in/juancangulo' && Boolean(box) && box.width >= 44 && box.height >= 44,
      box ? `${box.width.toFixed(0)}x${box.height.toFixed(0)}` : 'sin caja',
    );

    // k20
    check(`k20. ${lang}: contacto es la ultima seccion y el pie va despues`, foot.lastSection === 'contacto' && foot.after, `ultima=${foot.lastSection}`);

    // 44 px en cada enlace del pie
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('footer.site-footer a')].map((a) => ({ a, r: a.getBoundingClientRect() })).filter(({ r }) => r.height < 44 || r.width < 44).map(({ a, r }) => `${a.textContent.trim().slice(0, 20)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`),
    );
    check(`k19b. ${lang}: cada enlace del pie mide al menos 44x44`, small.length === 0, small.join(' | ') || 'todos');
  }

  // k8 y k21: linter de copy
  const lint = spawnSync('node', ['scripts/check-copy.mjs', 'src/home/copy/contacto.json'], { cwd: paths.APP, encoding: 'utf8' });
  check('k8. check-copy.mjs sobre contacto.json termina en 0', lint.status === 0, (lint.stdout.trim().split('\n').pop() ?? '') + (lint.stderr ? ` ${lint.stderr.trim()}` : ''));
  const lintFooter = spawnSync('node', ['scripts/check-copy.mjs', 'src/home/copy/footer.json'], { cwd: paths.APP, encoding: 'utf8' });
  const footerRaw = fs.readFileSync(path.join(paths.APP, 'src', 'home', 'copy', 'footer.json'), 'utf8');
  check('k21. check-copy.mjs sobre footer.json termina en 0, sin guiones largos o cortos ni el literal [PENDIENTE', lintFooter.status === 0 && !DASH.test(footerRaw) && !footerRaw.includes('[PENDIENTE'), lintFooter.stdout.trim().split('\n').pop() ?? '');

  // k10: CRTWarp solo con la banda a la vista, nunca junto a Grainient
  {
    const { page } = await open('es', { viewport: DESKTOP });
    const heroUp = await until(async () => (await page.getAttribute(HERO, 'data-mounted')) === 'true', 8000);
    // Si las demas secciones aun no estan integradas, la banda asoma bajo el hero: se separa para poder probar la salida.
    await page.evaluate(() => {
      const section = document.querySelector('#contacto');
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top < window.innerHeight * 2) {
        const spacer = document.createElement('div');
        spacer.style.height = '3000px';
        section.parentElement.insertBefore(spacer, section);
      }
    });
    await scrollToBand(page);
    const t0 = Date.now();
    const mounted = await until(async () => (await page.getAttribute(TERMINAL, 'data-mounted')) === 'true', 8000);
    const heroOff = (await page.getAttribute(HERO, 'data-mounted')) === 'false';
    const one = (await canvasCount(page)) === 1;
    check('k10a. desktop: con la banda a la vista CRTWarp monta en menos de 8000 ms, el hero queda sin montar y hay 1 canvas', heroUp >= 0 && mounted >= 0 && heroOff && one, `hero=${heroUp} ms banda=${mounted} ms (${Date.now() - t0}) canvas=${await canvasCount(page)}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    const gone = await until(async () => (await page.getAttribute(TERMINAL, 'data-mounted')) === 'false', 4000);
    const back = await until(async () => (await page.getAttribute(HERO, 'data-mounted')) === 'true', 8000);
    check('k10b. al volver al inicio el de la banda se desmonta y el del hero vuelve a montarse', gone >= 0 && back >= 0 && (await canvasCount(page)) === 1, `banda desmonta=${gone} ms hero vuelve=${back} ms canvas=${await canvasCount(page)}`);
  }

  // k11: mobile, reduced-motion y saveData dejan solo el fallback .fx-crt
  for (const [label, opts] of [
    ['viewport movil con hasTouch', MOBILE],
    ['prefers-reduced-motion: reduce', { viewport: DESKTOP, contextOptions: { reducedMotion: 'reduce' } }],
    ['navigator.connection.saveData', { viewport: DESKTOP, init: SAVE_DATA_INIT }],
  ]) {
    const { page } = await open('es', opts);
    await scrollToBand(page);
    await page.waitForTimeout(4200);
    const visible = await page.locator('.hm-terminal.fx-crt').isVisible();
    check(`k11. ${label}: 0 canvas y el fallback .fx-crt sigue visible`, (await canvasCount(page)) === 0 && visible, `canvas=${await canvasCount(page)} fallback=${visible}`);
  }

  // k12: pausa
  {
    const { page } = await open('es', { viewport: DESKTOP });
    await scrollToBand(page);
    const up = await until(async () => (await page.getAttribute(TERMINAL, 'data-mounted')) === 'true', 8000);
    const btn = page.locator('button[data-fx-pause]');
    await btn.click();
    const off = await until(async () => (await canvasCount(page)) === 0, 2500);
    await btn.click();
    const on = await until(async () => (await canvasCount(page)) === 1, 3000);
    check('k12. Pausar animaciones con la banda a la vista deja 0 canvas y al soltar vuelve en menos de 3000 ms', up >= 0 && off >= 0 && on >= 0, `monta=${up} ms pausa=${off} ms suelta=${on} ms`);
  }

  // k13: recorrido completo
  {
    const { page } = await open('es', { viewport: DESKTOP });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    let maxCanvas = 0;
    const mountedIds = new Set();
    for (let y = 0; y <= height; y += 300) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(250);
      maxCanvas = Math.max(maxCanvas, await canvasCount(page));
      for (const id of await page.locator('[data-home-effect][data-mounted="true"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-home-effect')))) mountedIds.add(id);
    }
    check('k13. recorrido a pasos de 300 px: nunca mas de 1 canvas ni mas de 2 efectos distintos montados', maxCanvas <= 1 && mountedIds.size <= 2, `maximo=${maxCanvas} ids=${[...mountedIds].join(',') || 'ninguno'} alto=${height}`);
  }

  // k14: estructural
  {
    const budget = fs.readFileSync(path.join(paths.APP, 'src', 'home', 'effect-budget.ts'), 'utf8');
    const engine = fs.readFileSync(path.join(paths.APP, 'src', 'home', 'home-effect.tsx'), 'utf8');
    const dir = path.join(paths.APP, 'src', 'home', 'sections');
    const used = new Set();
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.tsx'))) {
      for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/<HomeEffect[^>]*\bid=["']([^"']+)["']/g)) used.add(m[1]);
    }
    const ok = /MAX_EFFECTS_PER_PAGE\s*=\s*2\b/.test(budget) && engine.includes('MAX_EFFECTS_PER_PAGE') && engine.includes('claimEffectId') && [...used].every((id) => id === 'hero' || id === 'terminal');
    check('k14. el motor fija MAX_EFFECTS_PER_PAGE en 2 y sections/ solo usa los ids hero y terminal', ok, `ids en sections=${[...used].join(',') || 'ninguno'}`);
  }

  // k7 (red y consola de todas las paginas abiertas)
  const consoleErrors = logs.flatMap((l) => l.console);
  const pageErrors = logs.flatMap((l) => l.pageerrors);
  const external = logs.flatMap((l) => l.external);
  check('k7b. 0 errores de consola, 0 pageerror y 0 peticiones fuera de 127.0.0.1', consoleErrors.length + pageErrors.length + external.length === 0, `consola=${consoleErrors.length} pageerror=${pageErrors.length} externas=${external.length}${consoleErrors[0] ? ` | ${consoleErrors[0]}` : ''}`);

  // k22: capturas
  if (ctx.shots) {
    const dir = paths.REPORTS_HOME;
    for (const [name, opts, quality] of [
      ['conversion-desktop.jpg', { viewport: DESKTOP }, 62],
      ['conversion-mobile.jpg', { ...MOBILE, viewport: PHONE }, 55],
    ]) {
      const { page } = await open('es', opts);
      await scrollToBand(page);
      if (name.includes('desktop')) await until(async () => (await page.getAttribute(TERMINAL, 'data-mounted')) === 'true', 8000);
      else await page.waitForTimeout(800);
      const clip = await page.evaluate(() => {
        const top = document.querySelector('#contacto').getBoundingClientRect().top + window.scrollY;
        const foot = document.querySelector('footer.site-footer').getBoundingClientRect();
        return { x: 0, y: top, width: document.documentElement.clientWidth, height: foot.bottom + window.scrollY - top };
      });
      await page.screenshot({ path: path.join(dir, name), type: 'jpeg', quality, fullPage: true, clip });
      const size = fs.statSync(path.join(dir, name)).size;
      check(`k22. captura ${name} pesa menos de 400 KB`, size < 400 * 1024, `${(size / 1024).toFixed(0)} KB, alto=${clip.height.toFixed(0)}`);
    }
  }
}
