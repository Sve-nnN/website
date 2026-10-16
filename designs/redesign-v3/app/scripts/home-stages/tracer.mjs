/*
 * Stage tracer de la home: el hero de punta a punta en ES y EN.
 * Chequeos t1 a t13 (ver 52-01-PLAN.md, tarea 1).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 412, height: 823 },
  { width: 390, height: 844 },
];
const MOBILE = { viewport: { width: 412, height: 823 }, contextOptions: { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const GRAIN_CANVAS = '[data-home-effect="hero"] canvas';
const CHUNK_RE = /assets\/Grainient-/;

/** Observa LCP desde el inicio para comparar bases de tiempo con el pedido del chunk. */
const LCP_INIT = () => {
  window.__lcp = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__lcp.push(e.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* sin LCP */
  }
};

const SAVE_DATA_INIT = () => {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: true, addEventListener() {}, removeEventListener() {} },
  });
};

const canvasCount = (page) => page.locator(GRAIN_CANVAS).count();

/** Sondea desde Node: con SwiftShader ocupando el hilo principal, waitForFunction dentro de la pagina llega tarde. */
async function waitCanvas(page, expected, timeout) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await canvasCount(page)) === expected) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

export async function run(ctx) {
  const { check, openPage, server, paths } = ctx;
  const logs = [];
  const open = async (url, opts = {}) => {
    const res = await openPage(url, opts);
    logs.push(res.log);
    return res;
  };

  // t1
  const statuses = await Promise.all(['/', '/en'].map(async (p) => (await fetch(`${server.url}${p}`)).status));
  check('t1. / y /en responden 200 con el build servido', statuses.every((s) => s === 200), `estados=${statuses.join(',')}`);

  // t2 y t4
  for (const lang of ['es', 'en']) {
    const { page } = await open(ctx.lang(lang));
    const info = await page.evaluate(() => ({
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      lang: document.documentElement.lang,
      title: document.title,
      inScrim: Boolean(document.querySelector('h1')?.closest('.fx-content')),
      heroGrain: Boolean(document.querySelector('h1')?.closest('section')?.classList.contains('fx-grain')),
    }));
    const titleOk = info.title.length <= 60 && !/[.,]/.test(info.title) && info.title.endsWith(' | Juan Carlos Angulo');
    check(
      `t2. ${lang}: un solo h1 con texto, html[lang]="${lang}" y titulo segun la guia 4.1 regla 10`,
      info.h1.length === 1 && info.h1[0].length > 0 && info.lang === lang && titleOk,
      `h1=${info.h1.length} lang=${info.lang} titulo="${info.title}" (${info.title.length})`,
    );
    check(`t4. ${lang}: el h1 vive dentro de .fx-content y el hero tiene la clase fx-grain`, info.inScrim && info.heroGrain, `scrim=${info.inScrim} grain=${info.heroGrain}`);
  }

  // t3
  for (const lang of ['es', 'en']) {
    for (const viewport of VIEWPORTS) {
      const { page } = await open(ctx.lang(lang), { viewport });
      await page.evaluate(() => document.fonts.ready);
      const boxes = await page.evaluate(() => {
        const rect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        };
        return {
          h1: rect(document.querySelector('h1')),
          pre: rect(document.querySelector('pre[aria-hidden="true"]')),
          cta: rect(document.querySelector('a.btn--primary')),
          vw: window.innerWidth,
          vh: window.innerHeight,
          scrollY: window.scrollY,
        };
      });
      const inside = (b) => b && b.top >= 0 && b.left >= 0 && b.bottom <= boxes.vh && b.right <= boxes.vw;
      check(
        `t3. ${lang} ${viewport.width}x${viewport.height}: h1, ASCII y CTA enteros en el primer viewport`,
        inside(boxes.h1) && inside(boxes.pre) && inside(boxes.cta) && boxes.scrollY === 0,
        `h1.bottom=${boxes.h1?.bottom.toFixed(0)} pre.bottom=${boxes.pre?.bottom.toFixed(0)} cta.bottom=${boxes.cta?.bottom.toFixed(0)} vh=${boxes.vh}`,
      );
    }
  }

  // t5
  {
    const { page } = await open(ctx.lang('es'), { init: LCP_INIT });
    const mounted = await waitCanvas(page, 1, 6000);
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const chunk = performance.getEntriesByType('resource').filter((e) => /assets\/Grainient-/.test(e.name));
      return { loadEnd: nav?.loadEventEnd ?? 0, lcp: Math.max(0, ...window.__lcp), chunkStarts: chunk.map((e) => e.startTime) };
    });
    const firstChunk = Math.min(...timing.chunkStarts);
    check('t5a. desktop: exactamente un canvas dentro de [data-home-effect="hero"] antes de 6000 ms', mounted && (await canvasCount(page)) === 1, `canvas=${await canvasCount(page)}`);
    check(
      't5b. el chunk de Grainient se pide despues de load y despues de la ultima entrada de LCP',
      timing.chunkStarts.length > 0 && firstChunk >= timing.loadEnd && firstChunk >= timing.lcp && timing.lcp > 0,
      `chunk=${firstChunk.toFixed(0)} ms, loadEventEnd=${timing.loadEnd.toFixed(0)} ms, ultimoLCP=${timing.lcp.toFixed(0)} ms`,
    );
    check('t5c. data-mounted="true" en el hero montado', (await page.getAttribute('[data-home-effect="hero"]', 'data-mounted')) === 'true');
  }

  // t6
  const blocked = [
    ['viewport movil con isMobile y hasTouch', MOBILE],
    ['prefers-reduced-motion: reduce', { contextOptions: { reducedMotion: 'reduce' } }],
    ['navigator.connection.saveData', { init: SAVE_DATA_INIT }],
  ];
  for (const [label, opts] of blocked) {
    const { page, log } = await open(ctx.lang('es'), opts);
    await page.waitForTimeout(4200);
    const visible = await page.locator('.fx-grain').first().isVisible();
    const chunk = log.requests.filter((u) => CHUNK_RE.test(u)).length;
    check(`t6. ${label}: 0 canvas, 0 peticiones del chunk y .fx-grain visible`, (await canvasCount(page)) === 0 && chunk === 0 && visible, `canvas=${await canvasCount(page)} chunk=${chunk} grain=${visible}`);
  }

  // t7
  {
    const { page } = await open(ctx.lang('es'));
    await waitCanvas(page, 1, 6000);
    const btn = page.locator('button[data-fx-pause]');
    const label = (await btn.textContent())?.trim();
    await btn.click();
    const gone = await waitCanvas(page, 0, 2500);
    const pressed = await btn.getAttribute('aria-pressed');
    const motion = await page.evaluate(() => document.documentElement.getAttribute('data-motion'));
    const labelAfter = (await btn.textContent())?.trim();
    check('t7a. Pausar animaciones: aria-pressed="true", 0 canvas, data-motion="reduced" y el texto no cambia', gone && pressed === 'true' && motion === 'reduced' && label === labelAfter, `pressed=${pressed} motion=${motion} texto="${labelAfter}"`);
    await btn.click();
    const back = await waitCanvas(page, 1, 3000);
    check('t7b. al soltar la pausa el canvas vuelve en menos de 3000 ms', back && (await btn.getAttribute('aria-pressed')) === 'false');
  }

  // t8
  {
    const { page } = await open(ctx.lang('es'));
    await waitCanvas(page, 1, 6000);
    // Alarga la pagina para poder sacar el hero del viewport (la home aun no tiene secciones).
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '4000px';
      document.body.appendChild(spacer);
    });
    await page.evaluate(() => window.scrollTo(0, 2500));
    const left = await waitCanvas(page, 0, 3000);
    check('t8a. al sacar el hero del viewport el canvas se desmonta', left);
    await page.evaluate(() => window.scrollTo(0, 0));
    const returned = await waitCanvas(page, 1, 4000);
    check('t8b. al volver al hero el canvas se monta otra vez', returned);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    check('t8c. con la pestana oculta el canvas se desmonta', await waitCanvas(page, 0, 2500));
  }

  // t9
  const consoleErrors = logs.flatMap((l) => l.console);
  const pageErrors = logs.flatMap((l) => l.pageerrors);
  const external = logs.flatMap((l) => l.external);
  check('t9. 0 errores de consola, 0 pageerror y 0 peticiones fuera de 127.0.0.1', consoleErrors.length + pageErrors.length + external.length === 0, `consola=${consoleErrors.length} pageerror=${pageErrors.length} externas=${external.length}${consoleErrors[0] ? ` | ${consoleErrors[0]}` : ''}${pageErrors[0] ? ` | ${pageErrors[0]}` : ''}`);

  // t10
  {
    const status = (await fetch(`${server.url}/system`)).status;
    const { page } = await open(`${server.url}/system`);
    await page.waitForSelector('article[data-effect]', { timeout: 10_000 });
    const h1 = await page.locator('h1').count();
    const cards = await page.locator('article[data-effect]').count();
    check('t10. /system responde 200 con un h1 y 16 article[data-effect]', status === 200 && h1 === 1 && cards === 16, `estado=${status} h1=${h1} tarjetas=${cards}`);
  }

  // t11
  {
    const git = spawnSync('git', ['status', '--short', '--', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'src'], { cwd: paths.REPO, encoding: 'utf8' });
    check('t11. la raiz del repo no cambia package.json, lockfiles ni src/', git.status === 0 && git.stdout.trim() === '', git.stdout.trim() || 'limpio');
  }

  // t12: el tercer id distinto lanza un Error que lo nombra (D-08). El modulo es puro y Node 24 le quita los tipos.
  {
    let detail = '';
    let ok = false;
    try {
      const mod = await import(pathToFileURL(path.join(paths.APP, 'src', 'home', 'effect-budget.ts')).href);
      const ids = new Set();
      mod.claimEffectId(ids, 'hero');
      mod.claimEffectId(ids, 'hero');
      mod.claimEffectId(ids, 'terminal');
      let thrown = null;
      try {
        mod.claimEffectId(ids, 'extra');
      } catch (e) {
        thrown = e;
      }
      ok = mod.MAX_EFFECTS_PER_PAGE === 2 && ids.size === 2 && thrown instanceof Error && thrown.message.includes('"extra"');
      detail = thrown ? thrown.message.slice(0, 90) : 'no lanzo';
    } catch (e) {
      detail = `no se pudo cargar effect-budget.ts: ${e.message}`;
    }
    check('t12. el motor acepta 2 ids y el tercero lanza un Error que lo nombra', ok, detail);
  }

  // t13
  {
    const base = spawnSync('git', ['merge-base', 'HEAD', 'master'], { cwd: paths.REPO, encoding: 'utf8' }).stdout.trim();
    const diff = base
      ? spawnSync('git', ['diff', '--name-only', base, '--', 'designs/redesign-v3/app/src/gallery', 'designs/redesign-v3/assets', 'designs/redesign-v3/system.html', 'designs/redesign-v3/tools'], { cwd: paths.REPO, encoding: 'utf8' }).stdout.trim()
      : '';
    check('t13. ningun archivo de src/gallery ni del kit (assets, system.html, tools) cambia', Boolean(base) && diff === '', diff || 'sin cambios');
  }

  // Capturas
  if (ctx.shots) {
    const dir = paths.REPORTS_HOME;
    const desktop = await open(ctx.lang('es'));
    await waitCanvas(desktop.page, 1, 6000);
    await desktop.page.waitForTimeout(1200);
    await desktop.page.screenshot({ path: path.join(dir, 'tracer-desktop.jpg'), type: 'jpeg', quality: 70 });
    const mobile = await open(ctx.lang('es'), { viewport: { width: 390, height: 844 }, contextOptions: { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } });
    await mobile.page.waitForTimeout(800);
    await mobile.page.screenshot({ path: path.join(dir, 'tracer-mobile.jpg'), type: 'jpeg', quality: 70 });
    for (const f of ['tracer-desktop.jpg', 'tracer-mobile.jpg']) {
      const size = fs.statSync(path.join(dir, f)).size;
      check(`capturas. ${f} pesa menos de 400 KB`, size < 400 * 1024, `${(size / 1024).toFixed(0)} KB`);
    }
  }
}
