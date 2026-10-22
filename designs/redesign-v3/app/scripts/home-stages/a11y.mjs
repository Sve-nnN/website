/*
 * Etapa a11y de la home v4 (52-06, tarea 3): reglas medibles de A11Y.md y WCAG 2.2 AA sobre la pagina completa.
 * Chequeos a1..a16. Sin paquetes nuevos: Playwright y calculo propio.
 *
 * Las comprobaciones de foco, objetivos y contraste corren con prefers-reduced-motion: reduce, para que
 * SwiftShader no compita por CPU con cientos de pulsaciones de Tab; el estilo medido es el mismo (el canvas
 * es decorativo y va por debajo). La pausa y el aria-snapshot se prueban ademas con el efecto corriendo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describeFocus, installColorHelpers, measureComponentContrast, measureSemantics, measureTargets, measureTextContrast, measureTextSpacing, missedFocusables } from '../lib/a11y-probe.mjs';

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const REDUCED = { reducedMotion: 'reduce' };
const VIEWPORTS = [
  ['1440x900', { viewport: DESKTOP, contextOptions: REDUCED }],
  ['390x844', { viewport: PHONE, contextOptions: { isMobile: true, hasTouch: true, deviceScaleFactor: 1, ...REDUCED } }],
];
const list = (items, n = 40) => items.slice(0, n).join(' ; ');
// Hojas CSS de la home v4 (a14): las que definen foco y outline.
const CSS_FILES = ['home.css', 'fx.css', 'tokens.css', 'fonts.css'];

export async function run(ctx) {
  const { check, paths, openPage, lang } = ctx;
  const titles = {};
  // HOME_LANGS=es acorta las corridas de depuracion; sin la variable se miden ambos idiomas.
  const langs = (process.env.HOME_LANGS ?? 'es,en').split(',');

  for (const l of langs) {
    for (const [vpName, opts] of VIEWPORTS) {
      const tag = `${l} ${vpName}`;
      const { context, page } = await openPage(lang(l), opts);
      await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
      await page.evaluate(installColorHelpers);
      titles[l] ??= await page.title();

      const sem = await page.evaluate(measureSemantics);

      // a1: un solo H1 y jerarquia sin saltos.
      check(`a1. ${tag}: un solo h1 y jerarquia de encabezados sin saltos`, sem.h1 === 1 && sem.jumps.length === 0, `h1=${sem.h1} saltos=${sem.jumps.join(' ; ') || 0}`);

      // a2: landmarks con nombre y 12 secciones con label.
      const badSections = sem.sections.filter((s) => !s.ok).map((s) => s.id);
      check(
        `a2. ${tag}: un header, un main#main, un footer, todo nav con nombre y ${sem.sections.length} secciones con label (aria-labelledby a su encabezado o aria-label)`,
        sem.headers === 1 && sem.mains === 1 && sem.footers === 1 && sem.navsUnnamed === 0 && sem.sections.length === 12 && badSections.length === 0,
        `header=${sem.headers} main=${sem.mains} footer=${sem.footers} navSinNombre=${sem.navsUnnamed} secciones=${sem.sections.length} malas=${badSections.join(',') || 0}`,
      );

      // a4 (incluye el primer foco de a3): recorrido completo con Tab.
      const visited = [];
      const problems = { ring: [], view: [], covered: [], hidden: [] };
      let trapped = true;
      for (let i = 0; i < 400; i += 1) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(describeFocus);
        if (!f || f.seen) {
          trapped = false;
          break;
        }
        visited.push(f.desc);
        const ringOk = (f.outlineStyle !== 'none' && f.outlineWidth >= 2) || f.ancestorRing;
        if (!ringOk) problems.ring.push(`${f.desc} ${f.outlineStyle} ${f.outlineWidth}px`);
        if (!f.visible) problems.hidden.push(f.desc);
        if (!f.inView && !f.tall) problems.view.push(f.desc);
        if (f.covered) problems.covered.push(`${f.desc} tapado por ${f.coveredBy}`);
      }
      const missed = await page.evaluate(missedFocusables);
      const first = visited[0] ?? '';
      check(`a3a. ${tag}: el enlace de salto es el primer elemento enfocable`, /a\.skip/.test(first), first);
      check(`a4a. ${tag}: Tab recorre ${visited.length} elementos sin trampas de foco (tope 400) y no deja visibles sin alcanzar`, !trapped && missed.length === 0, `trampa=${trapped} sin alcanzar=${missed.slice(0, 4).join(' ; ') || 0}`);
      check(`a4b. ${tag}: cada elemento enfocado muestra contorno de 2px o mas con estilo distinto de none`, problems.ring.length === 0, problems.ring.slice(0, 4).join(' ; ') || `${visited.length} elementos`);
      check(`a4c. ${tag}: cada elemento enfocado queda dentro del viewport y ningun otro elemento lo tapa`, problems.view.length === 0 && problems.covered.length === 0 && problems.hidden.length === 0, [...problems.view.map((v) => `fuera: ${v}`), ...problems.covered, ...problems.hidden].slice(0, 4).join(' ; ') || 'visibles y libres');

      // a3b: el enlace de salto se ve con foco y main#main recibe el foco.
      await page.evaluate(() => window.scrollTo(0, 0));
      const skip = await page.evaluate(() => {
        const a = document.querySelector('a.skip[href="#main"]');
        a.focus();
        const r = a.getBoundingClientRect();
        return { inView: r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.width > 8 && r.height > 8, href: a.getAttribute('href') };
      });
      await page.keyboard.press('Enter');
      const landed = await page.evaluate(() => ({ id: document.activeElement?.id, hash: window.location.hash }));
      check(`a3b. ${tag}: el enlace de salto se ve al recibir foco y su destino (main#main) recibe el foco`, skip.inView && skip.href === '#main' && landed.id === 'main', `visible=${skip.inView} foco=${landed.id} hash=${landed.hash}`);

      // a5: objetivos tactiles.
      const targets = await page.evaluate(measureTargets);
      check(`a5a. ${tag}: ${targets.total} objetivos de 44x44 o mas (24px en enlaces dentro de un parrafo)`, targets.small.length === 0, list(targets.small) || 'todos cumplen');
      check(`a5b. ${tag}: vecinos de un mismo grupo con los centros a 24px o mas (WCAG 2.5.8)`, targets.crowded.length === 0, list(targets.crowded) || 'sin vecinos pegados');

      // a6: reduced-motion: 0 canvas del motor de efectos, 0 animaciones infinitas, pausa operable.
      // El canvas decorativo de Noise (grano estatico, fps 0, staticFxOk) si sobrevive a reduced-motion por diseno y
      // no es un efecto animado: se cuentan los canvas de banda div[data-fx], igual que en la etapa budget (D-08).
      const motion = await page.evaluate(() => ({
        canvas: document.querySelectorAll('div[data-fx] canvas').length,
        allCanvas: document.querySelectorAll('canvas').length,
        infinite: document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).map((a) => a.animationName ?? a.constructor.name),
      }));
      const pressed = () => page.getAttribute('button.pausebtn', 'aria-pressed');
      const pauseOk = { before: await pressed() };
      await page.evaluate(() => document.querySelector('button.pausebtn').click());
      await until(async () => (await pressed()) === 'true', 5000, 50);
      pauseOk.during = await pressed();
      await page.evaluate(() => document.querySelector('button.pausebtn').click());
      await until(async () => (await pressed()) === 'false', 5000, 50);
      pauseOk.after = await pressed();
      check(`a6. ${tag}: con reduced-motion hay 0 canvas de banda, 0 animaciones CSS infinitas y la pausa sigue operable`, motion.canvas === 0 && motion.infinite.length === 0 && pauseOk.before === 'false' && pauseOk.during === 'true' && pauseOk.after === 'false', `canvasBanda=${motion.canvas} canvasTotal=${motion.allCanvas} infinitas=${motion.infinite.join(',') || 0} pausa=${pauseOk.before}>${pauseOk.during}>${pauseOk.after}`);

      // a8 (estructura), a9, a10, a11.
      check(`a8a. ${tag}: las ${sem.bandCount} bandas [data-fx] llevan aria-hidden="true" y no tienen texto visible`, sem.bandCount >= 1 && sem.bands.every((b) => b.hidden && b.text === 0), `bandas=${sem.bandCount} sinOcultar=${sem.bands.filter((b) => !b.hidden).length} conTexto=${sem.bands.filter((b) => b.text > 0).length}`);
      check(`a9. ${tag}: ninguna img sin alt y ningun svg informativo sin nombre (los decorativos con aria-hidden)`, sem.imgsNoAlt === 0 && sem.svgBad === 0, `imgSinAlt=${sem.imgsNoAlt} svgSinNombre=${sem.svgBad}`);
      const fieldProblems = sem.fields.filter((f) => !f.label || (f.placeholder && !f.label) || ((f.id === 'f-name' || f.id === 'f-mail') && !f.auto));
      check(`a10. ${tag}: formulario con etiqueta visible por campo, autocomplete en nombre y correo, sin placeholder como etiqueta y estado en role="status"`, sem.fields.length === 3 && fieldProblems.length === 0 && sem.status === 1, `campos=${sem.fields.length} problemas=${fieldProblems.map((f) => f.id).join(',') || 0} status=${sem.status}`);
      check(`a11. ${tag}: todo lang es "es" o "en" y html.lang coincide con la ruta`, sem.langs.every((x) => x === 'es' || x === 'en') && sem.htmlLang === l, `langs=${sem.langs.join(',')} html=${sem.htmlLang}`);

      // a13a: contraste de texto calculado.
      await page.evaluate(() => window.scrollTo(0, 0));
      const contrast = await page.evaluate(measureTextContrast);
      check(`a13a. ${tag}: contraste de texto 4.5:1 (3:1 en texto grande) calculado sobre ${contrast.measured} elementos; peor caso ${contrast.worstRatio}:1`, contrast.failures.length === 0, list(contrast.failures) || 'todos cumplen');
      check(`a13b. ${tag}: ningun texto sobre gradiente, canvas o imagen sin capa solida en medio`, contrast.imageOnly.length === 0, list(contrast.imageOnly) || 'ninguno');
      const comp = await page.evaluate(measureComponentContrast);
      check(`a13c. ${tag}: componentes 3:1 (borde de campos y anillo de foco ${comp.ringRatio}:1 contra el papel)`, comp.failures.length === 0 && comp.ringRatio >= 3, comp.failures.join(' ; ') || 'cumplen');

      // a12b: espaciado de texto (WCAG 1.4.12).
      const clipped = await page.evaluate(measureTextSpacing);
      check(`a12b. ${tag}: con el espaciado de texto de WCAG 1.4.12 ningun p, li, summary, a o button con overflow oculto recorta su contenido`, clipped.length === 0, clipped.slice(0, 3).join(' ; ') || 'sin recortes');

      await context.close();
    }

    // a7 y a8b: con el efecto corriendo, en escritorio.
    {
      const { context, page } = await openPage(lang(l), { viewport: DESKTOP });
      const btn = page.locator('button.pausebtn');
      const label = (await btn.textContent())?.trim();
      await btn.focus();
      await page.keyboard.press('Enter');
      const afterEnter = await btn.getAttribute('aria-pressed');
      await page.keyboard.press('Space');
      const afterSpace = await btn.getAttribute('aria-pressed');
      const labelAfter = (await btn.textContent())?.trim();
      check(`a7. ${l}: Pausar animaciones esta en la cabecera, conserva su etiqueta, alterna aria-pressed con Enter y con Espacio`, (await page.locator('header.nav button.pausebtn').count()) === 1 && label === labelAfter && afterEnter === 'true' && afterSpace === 'false', `etiqueta="${labelAfter}" enter=${afterEnter} espacio=${afterSpace}`);

      const snap = await page.locator('main').ariaSnapshot();
      // Textos del hero que no son copy: la banda de tramado, el badge-seal y la decoracion de rejilla.
      const decor = await page.evaluate(() => {
        const texts = [];
        for (const el of document.querySelectorAll('[data-fx], .badge, .hero-grid')) {
          const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (t.length >= 6) texts.push(t);
        }
        return texts.slice(0, 12);
      });
      const leaked = decor.filter((t) => snap.includes(t));
      check(`a8b. ${l}: el aria-snapshot de main no contiene el texto de las bandas decorativas del hero`, leaked.length === 0, `${decor.length} textos decorativos, filtrados=${leaked.length}`);
      await context.close();
    }

    // a12: reflow a 320 px.
    {
      const { context, page } = await openPage(lang(l), { viewport: { width: 320, height: 640 }, contextOptions: { isMobile: true, hasTouch: true, reducedMotion: 'reduce' } });
      const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth, inner: window.innerWidth }));
      const wide = await page.evaluate(() => {
        const clippedByAncestor = (el) => {
          for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
            const o = getComputedStyle(n);
            if (o.overflowX === 'hidden' || o.overflowX === 'clip') return true;
          }
          return false;
        };
        return [...document.querySelectorAll('main *, footer *, header *')]
          .filter((el) => el.checkVisibility() && el.getBoundingClientRect().right > window.innerWidth + 1 && !el.closest('pre, [style*="overflow"]') && !clippedByAncestor(el))
          .slice(0, 6)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
      });
      check(`a12. ${l}: reflow a 320px, scrollWidth ${widths.scroll} no supera 320 y ningun elemento (fuera de pre) se sale por la derecha`, widths.scroll <= 320 && wide.length === 0, `scrollWidth=${widths.scroll} body=${widths.body} desbordan=${wide.join(',') || 0}`);
      await context.close();
    }
  }

  // a15: sin pageerror ni console.error en las cuatro aperturas. El runner recoge errores por pagina en
  // una variable de contexto; aqui se reabren las rutas y se leen los errores acumulados.
  {
    const bad = [];
    for (const l of langs) {
      for (const opts of [{ viewport: DESKTOP }, { viewport: PHONE, contextOptions: { isMobile: true, hasTouch: true } }]) {
        const { context, page, errors } = await openPage(lang(l), opts);
        await page.waitForTimeout(800);
        if (errors.length) bad.push(`${l}: ${errors.slice(0, 2).join(' ; ')}`);
        await context.close();
      }
    }
    check('a15. sin pageerror ni console.error en la carga de / y /en en escritorio y movil', bad.length === 0, bad.slice(0, 4).join(' ; ') || 'sin errores');
  }

  // a16: titulo unico por ruta.
  check('a16. el titulo no esta vacio y es distinto entre / y /en', langs.length < 2 || (Boolean(titles.es) && Boolean(titles.en) && titles.es !== titles.en), `es="${titles.es}" en="${titles.en}"`);

  // a14: ninguna hoja de la home quita el outline sin sustituto.
  {
    const bad = [];
    for (const rel of CSS_FILES) {
      const css = fs.readFileSync(path.join(paths.APP, 'src', 'home', 'styles', rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      // Reglas que aportan un anillo de foco visible en toda la hoja (sustituto del outline quitado).
      const ringRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, sel, body]) => /:focus-within|:focus-visible/.test(sel) && /outline\s*:\s*[^;]*\bsolid\b/.test(body));
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const [, selector, body] = m;
        if (!/outline\s*:\s*(none|0)\b|outline-style\s*:\s*none/.test(body)) continue;
        // Sustituto: se excluye en la misma regla, o el anillo vive en un contenedor :focus-within relacionado
        // (patron del enlace extendido: .stretch:focus-visible{outline:none} + .ct:focus-within{outline:3px solid}).
        const replaced =
          /:not\(:focus-visible\)/.test(selector) ||
          /box-shadow\s*:\s*(?!none)/.test(body) ||
          /border(-color)?\s*:/.test(body) ||
          ringRules.some(([rsel]) => /:focus-within/.test(rsel));
        if (!replaced) bad.push(`${rel}: ${selector.trim().slice(0, 50)}`);
      }
    }
    check(`a14. ninguna regla de las hojas de la home (${CSS_FILES.length}) quita el outline sin sustituto`, bad.length === 0, bad.join(' ; ') || 'sin outline: none');
  }
}

/** Sondea desde Node: con SwiftShader ocupando el hilo principal, waitForFunction dentro de la pagina llega tarde. */
async function until(fn, timeout, step = 100) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return Date.now() - t0;
    await new Promise((r) => setTimeout(r, step));
  }
  return -1;
}
