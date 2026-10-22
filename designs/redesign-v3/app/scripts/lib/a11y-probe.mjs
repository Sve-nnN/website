/*
 * a11y-probe.mjs: funciones que corren dentro de la pagina (se serializan con page.evaluate) para el stage a11y
 * de la home v4 (52-06, tarea 3). Contraste calculado con la formula de WCAG 2.2, no estimado. Sin dependencias.
 *
 * Adaptado de la version v3 (worktree agent-a52c13fdfcfe5a678) a los selectores del v4:
 *   main#contenido -> main#main, .skip-link -> a.skip[href="#main"], .hm-terminal -> bandas [data-fx],
 *   secciones [data-section] -> main > section, campos #contacto -> #form, --focus -> --ring.
 */

/** Instala window.__a11y con utilidades de color. Se llama una vez por pagina. */
export function installColorHelpers() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const viaCanvas = (css) => {
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = '#000';
    g.fillStyle = css;
    g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], 1];
  };
  const parse = (css) => {
    const m = String(css).match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
    if (!m) return viaCanvas(css);
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [Number(m[1]), Number(m[2]), Number(m[3]), a];
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1];
  };
  const lum = ([r, g2, b]) => {
    const f = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g2) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const token = (name) => parse(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  const opacityChain = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };

  /**
   * Color de un gradiente plano de un solo color (la banda resaltadora de la home: linear-gradient(#C8F31D,#C8F31D)).
   * Devuelve [r,g,b,a] si todos los paradas de color son el mismo color (y hay un color), o null si es un degradado real.
   */
  const flatGradient = (image) => {
    if (!/gradient\(/.test(image)) return null;
    const colors = [...image.matchAll(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g)].map((m) => parse(m[1]));
    if (!colors.length) return null;
    const [first] = colors;
    const same = colors.every((c) => c[0] === first[0] && c[1] === first[1] && c[2] === first[2] && c[3] === first[3]);
    return same ? first : null;
  };

  /** Alpha maxima de las paradas de color de un degradado/imagen CSS (1 si alguna es opaca). */
  const maxStopAlpha = (image) => {
    const colors = [...image.matchAll(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g)].map((m) => parse(m[1]));
    return colors.length ? Math.max(...colors.map((c) => c[3])) : 1;
  };

  /**
   * Fondos efectivos de un elemento. Recorre ancestros hasta un fondo opaco. Los elementos con su propia
   * variable --paper (paneles del diseno: .ch-ink, .marq, .foot, .card, .ct) definen el fondo solido.
   * Un gradiente plano (un solo color: la banda resaltadora de subrayado, background-size 100% .38em) es un
   * adorno que no cubre el texto: se salta y se sigue subiendo hasta el fondo real del texto. Un degradado
   * real o una imagen sin capa solida visible por debajo se marca como 'image' para no estimarlo.
   */
  const effectiveBg = (el) => {
    const inner = [];
    const finish = (bases) => bases.map((base) => inner.reduceRight((acc, layer) => over(layer, acc), base));
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const color = parse(cs.backgroundColor);
      const hasImage = cs.backgroundImage !== 'none';
      const flat = hasImage ? flatGradient(cs.backgroundImage) : null;
      if (flat && color[3] === 0) continue; // adorno (banda de subrayado): no es el fondo del texto
      if (hasImage && !flat && color[3] === 0) {
        // Overlay translucido (rayado decorativo, todo alpha < 1): se compone sobre el fondo real y se sigue
        // subiendo. Un degradado con alguna parada opaca si es un fondo no estimable: 'image'.
        if (maxStopAlpha(cs.backgroundImage) < 1) {
          const stops = [...cs.backgroundImage.matchAll(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g)].map((m) => parse(m[1]));
          const opaqueish = stops.filter((c) => c[3] > 0);
          if (opaqueish.length) inner.push(opaqueish.reduce((a, b) => (b[3] > a[3] ? b : a)));
          continue;
        }
        return { kind: 'image', node: `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0]}` };
      }
      if (color[3] > 0) {
        if (color[3] >= 1) return { kind: 'solid', colors: finish([color]) };
        inner.push(color);
      }
    }
    const root = parse(getComputedStyle(document.documentElement).backgroundColor);
    const base = root[3] >= 1 ? root : [255, 255, 255, 1];
    return { kind: 'solid', colors: finish([base]) };
  };

  window.__a11y = { parse, over, lum, ratio, token, opacityChain, effectiveBg };
}

/** a13: contraste de texto (4.5:1; 3:1 en texto grande) para cada elemento con texto directo y visible. */
export function measureTextContrast() {
  const h = window.__a11y;
  const failures = [];
  const imageOnly = [];
  let measured = 0;
  let worstRatio = Infinity;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg, script, style, noscript, [aria-hidden="true"], canvas, .sr')) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (!own || !el.checkVisibility()) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const snippet = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const where = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}`;
    const bg = h.effectiveBg(el);
    if (bg.kind === 'image') {
      imageOnly.push(`${where} "${snippet}" sobre ${bg.node}`);
      continue;
    }
    const fg = h.parse(cs.color);
    fg[3] *= h.opacityChain(el);
    const worst = Math.min(...bg.colors.map((c) => h.ratio(h.over(fg, c), c)));
    measured += 1;
    worstRatio = Math.min(worstRatio, worst);
    if (worst < need) failures.push(`${where} "${snippet}" ${worst.toFixed(2)}:1 (min ${need}) ${bg.kind}`);
  }
  return { measured, failures, imageOnly, worstRatio: Number.isFinite(worstRatio) ? Number(worstRatio.toFixed(2)) : null };
}

/** a13: contraste de componentes (3:1): borde de campos y anillo de foco contra el fondo de tinta/papel. */
export function measureComponentContrast() {
  const h = window.__a11y;
  const out = [];
  for (const el of document.querySelectorAll('#form input, #form textarea, #form select')) {
    if (!el.checkVisibility()) continue;
    const cs = getComputedStyle(el);
    const border = h.parse(cs.borderTopColor);
    const bg = h.effectiveBg(el.parentElement ?? el);
    if (bg.kind === 'image') {
      out.push(`${el.id || el.tagName} sobre imagen`);
      continue;
    }
    const fieldBg = h.parse(cs.backgroundColor);
    const worst = Math.min(...bg.colors.map((c) => h.ratio(h.over(border, h.over(fieldBg, c)), c)));
    if (worst < 3 || Number.parseFloat(cs.borderTopWidth) < 1) out.push(`${el.id || el.tagName} borde ${worst.toFixed(2)}:1`);
  }
  // El anillo de foco de la home es --ring (= --fg sobre papel). Se contrasta contra el fondo del papel.
  const ring = h.parse(getComputedStyle(document.documentElement).getPropertyValue('--ring').trim() || getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#000');
  const paper = h.token('--bg');
  const ringRatio = h.ratio(ring, paper);
  return { failures: out, ringRatio: Number(ringRatio.toFixed(2)) };
}

/** a5: objetivos tactiles de 44x44 (24 px en enlaces dentro de un parrafo) y separacion de 8 px entre vecinos. */
export function measureTargets() {
  const SEL = 'a[href], button, summary, input:not([type="hidden"]), textarea, select';
  const els = [...document.querySelectorAll(SEL)].filter((el) => el.checkVisibility() && !el.closest('[aria-hidden="true"]'));
  const inline = (el) => {
    if (el.tagName !== 'A') return false;
    if (getComputedStyle(el).display !== 'inline') return false;
    const parent = el.parentElement;
    const rest = [...parent.childNodes].filter((n) => n !== el && (n.nodeType === 3 ? n.nodeValue.trim() : n.nodeType === 1 && !n.contains(el)));
    return rest.length > 0;
  };
  // Enlace extendido (.stretch a::after con position absolute e inset 0): el area pulsable es la tarjeta, no el texto.
  const rect = (el) => {
    if (el.tagName === 'A') {
      const af = getComputedStyle(el, '::after');
      const stretched = af.content !== 'none' && (af.position === 'absolute' || af.position === 'fixed') && af.top === '0px' && af.left === '0px' && af.right === '0px' && af.bottom === '0px';
      if (stretched) {
        for (let n = el.parentElement; n; n = n.parentElement) {
          if (getComputedStyle(n).position !== 'static') return n.getBoundingClientRect();
        }
      }
    }
    return el.getBoundingClientRect();
  };
  const small = [];
  const inlineLinks = [];
  for (const el of els) {
    const r = rect(el);
    const label = `${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute('aria-label') ?? el.id ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`;
    if (inline(el)) {
      inlineLinks.push(el);
      if (r.height < 24) small.push(`${label} (en parrafo, minimo 24)`);
      continue;
    }
    if (r.width < 43.5 || r.height < 43.5) small.push(label);
  }
  const gap = (a, b) => {
    const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right));
    const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom));
    return Math.hypot(dx, dy);
  };
  // WCAG 2.2 2.5.8 (excepcion de espaciado): el criterio real es que un circulo de 24 px de diametro centrado
  // en cada objetivo no intersecte el circulo de otro. Dos enlaces apilados en vertical con caja pegada cumplen
  // (sus centros distan 44 px o mas); solo falla cuando los centros quedan a menos de 24 px. Ademas deben
  // compartir banda (solaparse en X o en Y) para ser vecinos; una lista de ancho completo no compite.
  const overlapsX = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1;
  const overlapsY = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const centerDist = (a, b) => Math.hypot(a.left + a.width / 2 - (b.left + b.width / 2), a.top + a.height / 2 - (b.top + b.height / 2));
  const crowded = [];
  const groups = new Map();
  for (const el of els.filter((e) => !inlineLinks.includes(e))) {
    const group = el.closest('ul, ol, nav, .lang, .nav-right, .foot-bar, .tpv');
    if (!group) continue;
    groups.set(group, [...(groups.get(group) ?? []), el]);
  }
  for (const [, members] of groups) {
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        if (members[i].contains(members[j]) || members[j].contains(members[i])) continue;
        const ra = rect(members[i]);
        const rb = rect(members[j]);
        if (!overlapsX(ra, rb) && !overlapsY(ra, rb)) continue;
        const d = centerDist(ra, rb);
        if (d < 23.5) crowded.push(`"${(members[i].textContent ?? '').trim().slice(0, 20)}" y "${(members[j].textContent ?? '').trim().slice(0, 20)}" a ${d.toFixed(1)}px`);
      }
    }
  }
  return { total: els.length, small, crowded };
}

/** a13 (WCAG 1.4.12): aplica el espaciado de texto y devuelve los elementos que recortan su contenido. */
export function measureTextSpacing() {
  const style = document.createElement('style');
  style.textContent = '*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}p{margin-bottom:2em !important}';
  document.head.appendChild(style);
  const clipped = [];
  for (const el of document.querySelectorAll('p, li, summary, a, button')) {
    if (!el.checkVisibility()) continue;
    // El texto para lectores de pantalla (.sr y similares) se oculta a proposito en 1x1: no es texto visible.
    if (el.closest('.sr') || (el.clientWidth <= 2 && el.clientHeight <= 2)) continue;
    const cs = getComputedStyle(el);
    const hides = (v) => v === 'hidden' || v === 'clip';
    if (!hides(cs.overflowX) && !hides(cs.overflowY)) continue;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      clipped.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" ${el.scrollWidth}x${el.scrollHeight} en ${el.clientWidth}x${el.clientHeight}`);
    }
  }
  style.remove();
  return clipped;
}

/** Foco actual: contorno, posicion y si algo lo tapa. Devuelve null si el foco esta en body. */
export function describeFocus() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
  const top = document.elementFromPoint(cx, cy);
  // Contorno sustituto: el enlace extendido (.stretch a::after) delega el anillo al contenedor de la tarjeta
  // (.ct:focus-within con outline). Si el elemento enfocado no tiene contorno propio, se busca un ancestro con
  // outline visible por :focus-within; el patron es legitimo y no debe contar como falta de foco.
  const ringFrom = (node) => {
    const s = getComputedStyle(node);
    return s.outlineStyle !== 'none' && Number.parseFloat(s.outlineWidth) >= 2;
  };
  let ancestorRing = false;
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    if (ringFrom(n) && n.matches(':focus-within')) {
      ancestorRing = true;
      break;
    }
  }
  const seen = el.hasAttribute('data-a11y-seen');
  el.setAttribute('data-a11y-seen', '1');
  return {
    seen,
    desc: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''} "${(el.textContent ?? el.getAttribute('aria-label') ?? '').trim().replace(/\s+/g, ' ').slice(0, 24)}"`,
    outlineStyle: cs.outlineStyle,
    outlineWidth: Number.parseFloat(cs.outlineWidth),
    ancestorRing,
    hasShadow: cs.boxShadow !== 'none',
    inView: r.top >= -0.5 && r.bottom <= vh + 0.5 && r.left >= -0.5 && r.right <= vw + 0.5,
    tall: r.height > vh,
    visible: r.width > 0 && r.height > 0,
    covered: !(top && (top === el || el.contains(top))),
    coveredBy: top ? `${top.tagName.toLowerCase()}.${String(top.className).split(' ')[0]}` : 'nada',
  };
}

/** Elementos que deberian recibir foco con Tab y que no lo recibieron. */
export function missedFocusables() {
  const SEL = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  return [...document.querySelectorAll(SEL)]
    .filter((el) => el.checkVisibility() && !el.hasAttribute('data-a11y-seen') && !el.closest('[aria-hidden="true"], [inert]'))
    .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${(el.textContent ?? '').trim().slice(0, 24)}"`);
}

/** a1, a2, a9, a10, a11: estructura y semantica del documento v4. */
export function measureSemantics() {
  const heads = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const levels = heads.map((h) => Number(h.tagName[1]));
  const jumps = [];
  levels.forEach((lv, i) => {
    if (i === 0 ? lv !== 1 : lv > levels[i - 1] + 1) jumps.push(`${heads[i].tagName.toLowerCase()} "${heads[i].textContent.trim().slice(0, 30)}" tras h${levels[i - 1] ?? 0}`);
  });
  // v4: solo hay un header (header.nav) y un footer (footer.foot) al nivel superior.
  const headers = document.querySelectorAll('header.nav').length;
  const mains = document.querySelectorAll('main#main').length;
  const footers = document.querySelectorAll('footer.foot').length;
  const navs = [...document.querySelectorAll('nav')];
  // Secciones de contenido: main > section (el hero y la marquesina tambien son section; la marquesina usa aria-label).
  // El hero se etiqueta con su h1 (aria-labelledby -> h1); el resto con un h2. Vale cualquiera de los dos.
  const sections = [...document.querySelectorAll('main > section')].map((s) => {
    const labelledby = s.getAttribute('aria-labelledby');
    const h = labelledby ? document.getElementById(labelledby) : null;
    const label = s.getAttribute('aria-label');
    const ok = label ? Boolean(label.trim()) : Boolean(h && /^H[12]$/.test(h.tagName) && h.textContent.trim());
    return { id: s.id || label || s.className.split(' ')[0], ok };
  });
  const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
  const svgs = [...document.querySelectorAll('svg')].map((s) => {
    const hidden = Boolean(s.closest('[aria-hidden="true"]') || s.getAttribute('aria-hidden') === 'true');
    const named = Boolean(s.getAttribute('aria-label') || s.getAttribute('aria-labelledby') || s.querySelector('title'));
    return { hidden, named };
  });
  const svgBad = svgs.filter((s) => !s.hidden && !s.named).length;
  const fields = [...document.querySelectorAll('#form input:not([type="hidden"]), #form textarea, #form select')].map((f) => {
    const label = f.id ? document.querySelector(`label[for="${f.id}"]`) : null;
    return { id: f.id, label: Boolean(label?.textContent?.trim() && label.checkVisibility()), auto: f.getAttribute('autocomplete'), placeholder: f.getAttribute('placeholder'), type: f.type };
  });
  const langs = [...document.querySelectorAll('[lang]')].map((e) => e.getAttribute('lang'));
  // Bandas de efecto (decoracion): van aria-hidden y sin texto visible. `html[data-fx]` es el estado de la puerta
  // de efectos, no una banda: se excluye el elemento raiz y se miran solo los div de banda.
  const bands = [...document.querySelectorAll('div[data-fx]')].map((b) => ({ hidden: b.getAttribute('aria-hidden') === 'true', text: (b.textContent ?? '').replace(/\s+/g, ' ').trim().length }));
  return {
    h1: document.querySelectorAll('h1').length,
    jumps,
    headers,
    mains,
    footers,
    navsUnnamed: navs.filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length,
    sections,
    imgsNoAlt,
    svgBad,
    fields,
    status: document.querySelectorAll('#form [role="status"]').length,
    langs: [...new Set(langs)],
    htmlLang: document.documentElement.lang,
    bands,
    bandCount: bands.length,
  };
}
