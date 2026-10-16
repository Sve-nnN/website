#!/usr/bin/env node
/*
 * verify-home.mjs: comprueba las reglas del diseno aprobado (v4 manual editorial) y el uso de React Bits sobre el build de produccion.
 *
 * Uso: node scripts/verify-home.mjs        (necesita dist/: npm run build)
 * Sirve dist/ con el servidor estatico propio, abre / y /en con Playwright y falla (salida 1) si alguna regla no se cumple.
 * Reglas: un solo H1 y landmarks; sin em dash ni en dash; sin Lima ni Madrid ni precio; sin bloques de codigo; Array solo en H1 y H2;
 * encabezados sin numerar y sin puntos ni comas; una sola cita real; 28 clientes con logo <img> visible y sin mask-image;
 * footer directorio completo; alternador ES/EN; 6 paletas con ?paleta= y localStorage; boton Pausar; menu movil accesible;
 * prefers-reduced-motion y mobile sin chunks de React Bits; cupo de un shader WebGL a la vez y dos por pagina.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { launch, loadPlaywright } from './lib/browser.mjs';
import { originalChunkFiles, readManifest } from './lib/manifest.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const manifest = readManifest(DIST);
if (!manifest) {
  console.error('verify-home: falta dist/. Ejecuta npm run build dentro de designs/redesign-v3/app.');
  process.exit(2);
}
const originalNames = JSON.parse(fs.readFileSync(path.join(APP, 'scripts', 'originals.json'), 'utf8')).map((o) => o.name);
const chunkFiles = originalChunkFiles(manifest, originalNames);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
};

const { chromium } = await loadPlaywright();
const browser = await launch(chromium);
const server = await startStaticServer({ root: DIST, compress: true });
const url = (p) => `${server.url}${p}`;

async function open(ctxOpts, p, { wait = true } = {}) {
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  const errors = [];
  const chunks = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => chunkFiles.some((f) => r.url().endsWith(f)) && chunks.push(r.url().split('/').pop()));
  await page.goto(url(p), { waitUntil: 'load' });
  if (wait) await page.waitForSelector('h1');
  return { context, page, errors, chunks };
}

const DESKTOP = { viewport: { width: 1440, height: 900 } };

// ---------- Desktop ES: contenido y reglas del diseno ----------
{
  const { context, page, errors } = await open(DESKTOP, '/');
  await page.waitForFunction(() => document.documentElement.dataset.fx === 'on', null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const dom = await page.evaluate(() => {
    const text = document.body.innerText;
    const fontsBad = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const ff = getComputedStyle(el).fontFamily;
      const inHeading = !!el.closest('h1,h2');
      if (ff.includes('Array') && !inHeading) fontsBad.push(el.tagName + ':' + el.textContent.trim().slice(0, 20));
    });
    const heads = [...document.querySelectorAll('h1,h2,h3')].map((h) => h.textContent.trim().replace(/\s+/g, ' '));
    const logos = [...document.querySelectorAll('.cl img')];
    return {
      h1: document.querySelectorAll('h1').length,
      h1Text: document.querySelector('h1')?.textContent.trim().replace(/\s+/g, ' '),
      landmarks: ['header', 'nav[aria-label]', 'main', 'footer'].map((s) => !!document.querySelector(s)),
      lang: document.documentElement.lang,
      text,
      html: document.documentElement.outerHTML,
      fontsBad,
      heads,
      title: document.title,
      pre: document.querySelectorAll('pre, code').length,
      clientItems: document.querySelectorAll('.cl').length,
      logosLoaded: logos.filter((i) => i.complete && i.naturalWidth > 0).length,
      logosTotal: logos.length,
      logoMask: logos.filter((i) => getComputedStyle(i).maskImage !== 'none' && getComputedStyle(i).maskImage !== '').length,
      logoVisible: logos.every((i) => Number(getComputedStyle(i).opacity) > 0.3 && getComputedStyle(i).visibility === 'visible'),
      quotes: document.querySelectorAll('blockquote').length,
      realName: [...document.querySelectorAll('.who b')].filter((b) => !b.textContent.includes('PENDIENTE')).map((b) => b.textContent),
      dirCols: document.querySelectorAll('.dir .dc').length,
      dirLinks: document.querySelectorAll('.dir a').length,
      pauseBtn: !!document.querySelector('.pausebtn[aria-pressed]'),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toUpperCase(),
      paletteAttr: document.documentElement.getAttribute('data-palette'),
      noscript: false,
    };
  });
  check('H1 unico con el titular aprobado', dom.h1 === 1 && dom.h1Text === 'Arreglo el SEO desde el código', dom.h1Text);
  check('landmarks header, nav, main y footer', dom.landmarks.every(Boolean));
  check('sin em dash ni en dash en el texto ni en el HTML', !/[–—]/.test(dom.text) && !/[–—]/.test(dom.html));
  check('sin Lima ni Madrid', !/\b(Lima|Madrid)\b/.test(dom.text));
  check('sin precio (Auditoria 360, sin cifras de dinero)', !/(USD|US\$|\$\s?\d|\d\s?\$|€|\bprecio\b|\bprice\b)/i.test(dom.text));
  check('sin bloques de codigo', dom.pre === 0);
  check('Array solo en H1 y H2', dom.fontsBad.length === 0, dom.fontsBad.join(', '));
  check('encabezados sin numerar, sin puntos ni comas', dom.heads.every((h) => !/^\d+[.)\s]/.test(h) && !/[,;:]|\.(\s|$)/.test(h)) && !/[,;:]|\.(\s|$)/.test(dom.title.replace(/\|.*$/, '')), dom.heads.filter((h) => /[,;:]|\.(\s|$)/.test(h)).join(' | '));
  check('una sola cita real (Patricia Ibarra, CEO de Estylopia)', dom.quotes === 1 && dom.realName.length === 1 && dom.realName[0] === 'Patricia Ibarra', dom.realName.join());
  check('franja de 28 clientes', dom.clientItems === 56, `${dom.clientItems / 2} clientes (duplicados para el carrusel: ${dom.clientItems})`);
  check('26 logos reales <img> cargados y visibles, sin mask-image', dom.logosLoaded === dom.logosTotal && dom.logosTotal === 52 && dom.logoMask === 0 && dom.logoVisible, `${dom.logosLoaded}/${dom.logosTotal}, mask ${dom.logoMask}`);
  check('footer directorio completo (6 columnas, 30 o mas enlaces)', dom.dirCols === 6 && dom.dirLinks >= 30, `${dom.dirCols} columnas, ${dom.dirLinks} enlaces`);
  check('boton Pausar animaciones', dom.pauseBtn);
  check('paleta por defecto papel-bosque (#0E3B2C), sin data-palette', dom.accent === '#0E3B2C' && dom.paletteAttr === null, dom.accent);
  check('html lang es', dom.lang === 'es');

  const raw = await (await fetch(url('/'))).text();
  check('noscript con aviso de CSR y sin H1 en el HTML crudo', /<noscript>/.test(raw) && /CSR|client-side/i.test(raw) && !/<h1[^>]*id="h1"/.test(raw.replace(/<noscript>[\s\S]*?<\/noscript>/, '')));

  // ---------- React Bits en desktop ----------
  const fx = await page.evaluate(() => ({
    state: document.documentElement.dataset.fx,
    spotlight: document.querySelectorAll('.spotlight-card').length,
    star: document.querySelectorAll('.star-border').length,
    noise: document.documentElement.dataset.noise,
    dither: document.querySelector('[data-fx="dither"]')?.dataset.mounted,
    heavy: document.querySelectorAll('.fx-band canvas, .fx-halftone canvas').length,
  }));
  check('desktop: efectos activos tras load y LCP', fx.state === 'on', fx.state);
  check('desktop: SpotlightCard en 2 tarjetas de servicios y 3 de casos', fx.spotlight === 5, String(fx.spotlight));
  check('desktop: StarBorder en el CTA del hero y del footer', fx.star === 2, String(fx.star));
  check('desktop: Noise estatico activo', fx.noise === 'on');
  check('desktop: Dither montado en la banda del hero, un solo shader a la vez', fx.dither === 'true' && fx.heavy === 1, `heavy ${fx.heavy}`);

  // Cupo: al pasar a Websites el Dither sale del viewport y entra HalftoneReveal bajo el puntero, nunca dos shaders.
  await page.locator('#websites').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const box = await page.locator('.site:nth-child(2) .dev').boundingBox();
  await page.mouse.move(box.x + 30, box.y + 60);
  for (let i = 0; i < 12; i += 1) await page.mouse.move(box.x + 40 + i * 20, box.y + 80 + (i % 3) * 30);
  await page.waitForTimeout(2500);
  const heavy2 = await page.evaluate(() => ({
    band: document.querySelectorAll('.fx-band canvas').length,
    halftone: document.querySelectorAll('.fx-halftone canvas').length,
  }));
  check('cupo: HalftoneReveal bajo el puntero y Dither desmontado (1 shader activo)', heavy2.halftone === 1 && heavy2.band === 0, JSON.stringify(heavy2));

  // Pausa
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.pausebtn');
  await page.waitForTimeout(700);
  const paused = await page.evaluate(() => ({
    cls: document.documentElement.classList.contains('paused'),
    pressed: document.querySelector('.pausebtn').getAttribute('aria-pressed'),
    canv: document.querySelectorAll('.fx-band canvas, .fx-halftone canvas, .star-border canvas').length,
    spot: document.querySelectorAll('.spotlight-card').length,
    state: document.documentElement.dataset.fx,
  }));
  check('Pausar animaciones: clase paused, aria-pressed y originales desmontados', paused.cls && paused.pressed === 'true' && paused.canv === 0 && paused.spot === 0 && paused.state === 'paused', JSON.stringify(paused));
  await page.click('.pausebtn');

  // Alternador de idioma
  await page.click('.lang button[lang="en"]');
  await page.waitForTimeout(300);
  const en = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1').textContent.trim().replace(/\s+/g, ' '), path: location.pathname, text: document.body.innerText }));
  check('alternador ES/EN: html lang, H1 y URL /en', en.lang === 'en' && en.h1 === 'I fix SEO from the code' && en.path === '/en', `${en.lang} ${en.h1} ${en.path}`);
  check('EN sin em dash ni en dash', !/[–—]/.test(en.text));
  await page.click('.lang button[lang="es"]');
  check('sin errores de consola en desktop', errors.length === 0, errors.join(' | ').slice(0, 300));
  await context.close();
}

// ---------- Paletas ----------
{
  const expected = { 'papel-tomate': '#FF5B3A', 'tinta-fosforo': '#B6FF3B', 'noche-menta': '#64FFDA', 'papel-cobalto': '#2A3BFF', 'tinta-ambar': '#FFB020', 'papel-bosque': '#0E3B2C' };
  const { context, page } = await open(DESKTOP, '/');
  let ok = true;
  const seen = [];
  for (const [id, accent] of Object.entries(expected)) {
    await page.goto(url(`/?paleta=${id}`), { waitUntil: 'load' });
    await page.waitForSelector('h1');
    const got = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toUpperCase());
    seen.push(`${id}=${got}`);
    if (got !== accent) ok = false;
  }
  check('?paleta= aplica las 6 paletas', ok, seen.join(' '));
  await page.goto(url('/'), { waitUntil: 'load' });
  await page.waitForSelector('h1');
  await page.click('#pal .pal-btn');
  await page.click('.pal-menu button:has-text("Tinta y fósforo")');
  const stored = await page.evaluate(() => localStorage.getItem('home-v4-paleta'));
  await page.goto(url('/'), { waitUntil: 'load' });
  await page.waitForSelector('h1');
  const persisted = await page.evaluate(() => document.documentElement.getAttribute('data-palette'));
  check('selector de paletas persiste en localStorage', stored === 'tinta-fosforo' && persisted === 'tinta-fosforo', `${stored} -> ${persisted}`);
  await page.click('#pal .pal-btn');
  await page.click('.pal-menu button:has-text("Noche y menta")');
  const changed = await page.evaluate(() => ({ attr: document.documentElement.getAttribute('data-palette'), q: location.search }));
  check('selector flotante cambia la paleta y la URL', changed.attr === 'noche-menta' && changed.q.includes('paleta='), JSON.stringify(changed));
  await context.close();
}

// ---------- prefers-reduced-motion ----------
{
  const { context, page, chunks } = await open({ ...DESKTOP, reducedMotion: 'reduce' }, '/');
  await page.waitForTimeout(5500);
  const r = await page.evaluate(() => ({ state: document.documentElement.dataset.fx, canv: document.querySelectorAll('.fx-band canvas, .fx-halftone canvas, .star-border canvas').length, spot: document.querySelectorAll('.spotlight-card').length, anim: getComputedStyle(document.querySelector('.ctrack')).animationName, noise: document.documentElement.dataset.noise }));
  const heavyChunks = chunks.filter((c) => /Dither|HalftoneReveal|SpotlightCard|StarBorder/.test(c));
  check('reduced motion: sin shaders, spotlight ni star, sin chunks pesados', r.state === 'reduced' && r.canv === 0 && r.spot === 0 && heavyChunks.length === 0, JSON.stringify(r) + ' ' + heavyChunks.join());
  check('reduced motion: carrusel y marquee detenidos', r.anim === 'none', r.anim);
  await context.close();
}

// ---------- Mobile ----------
{
  const { context, page, chunks, errors } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, '/');
  await page.waitForTimeout(5500);
  const m = await page.evaluate(() => ({ state: document.documentElement.dataset.fx, canv: document.querySelectorAll('canvas').length, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 }));
  check('mobile: sin chunks de React Bits ni canvas, fallbacks CSS', m.state === 'small' && m.canv === 0 && chunks.length === 0, `${m.state} canvas ${m.canv} chunks ${chunks.join()}`);
  check('mobile: sin scroll horizontal', !m.overflow);

  // Menu movil accesible
  await page.click('#menubtn');
  const open1 = await page.evaluate(() => ({ expanded: document.getElementById('menubtn').getAttribute('aria-expanded'), hidden: document.getElementById('mnav').hidden, inside: !!document.activeElement.closest('#mnav'), modal: document.getElementById('mnav').getAttribute('aria-modal') }));
  check('menu movil: abre con aria-expanded, role dialog y foco dentro', open1.expanded === 'true' && !open1.hidden && open1.inside && open1.modal === 'true', JSON.stringify(open1));
  for (let i = 0; i < 14; i += 1) await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => !!document.activeElement.closest('#mnav') || document.activeElement.id === 'menubtn');
  check('menu movil: el foco queda atrapado', trapped);
  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => ({ expanded: document.getElementById('menubtn').getAttribute('aria-expanded'), focus: document.activeElement.id, hidden: document.getElementById('mnav').hidden }));
  check('menu movil: Escape cierra y devuelve el foco al boton', closed.expanded === 'false' && closed.hidden && closed.focus === 'menubtn', JSON.stringify(closed));
  check('sin errores de consola en mobile', errors.length === 0, errors.join(' | ').slice(0, 300));
  await context.close();
}

await browser.close();
await server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones en verde.`);
process.exit(failed.length ? 1 : 0);
