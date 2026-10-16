/* Manual editorial: JS propio, sin librerias. La pagina esta completa sin este archivo. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var still = function () { return mq.matches || root.classList.contains('paused'); };

  /* Idioma */
  var titles = {
    es: 'SEO técnico e ingeniería de software | Juan Carlos Angulo',
    en: 'Technical SEO Consultant | Juan Carlos Angulo'
  };
  function setLang(l) {
    root.dataset.lang = l; root.lang = l; d.title = titles[l];
    d.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.setLang === l));
    });
  }
  d.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.setLang); });
  });
  setLang(root.dataset.lang || 'es');

  /* Pausa (en la barra superior, siempre alcanzable) */
  var pauseBtn = d.getElementById('pause');
  pauseBtn.addEventListener('click', function () {
    var on = root.classList.toggle('paused');
    pauseBtn.setAttribute('aria-pressed', String(on));
    d.querySelectorAll('.pause-txt span').forEach(function (s) {
      s.textContent = s.lang === 'es' ? (on ? 'Reanudar animaciones' : 'Pausar animaciones') : (on ? 'Resume animations' : 'Pause animations');
    });
    if (on) { finishCounters(); }
  });

  /* Menu movil: boton, foco atrapado, Escape y retorno del foco */
  var menuBtn = d.getElementById('menubtn'), menu = d.getElementById('mnav');
  function focusables() {
    return Array.prototype.slice.call(menu.querySelectorAll('a[href],button')).filter(function (e) { return e.offsetParent !== null; });
  }
  function openMenu() {
    menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
    root.style.overflow = 'hidden';
    var f = focusables(); if (f[0]) f[0].focus();
  }
  function closeMenu(back) {
    menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
    root.style.overflow = '';
    if (back) menuBtn.focus();
  }
  menuBtn.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(true); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
  d.addEventListener('keydown', function (e) {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
    if (e.key === 'Tab') {
      /* el foco circula entre el boton del menu, el idioma, la pausa y los enlaces del panel */
      var set = [menuBtn].concat(focusables());
      var i = set.indexOf(d.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); set[set.length - 1].focus(); }
      else if (!e.shiftKey && (i === set.length - 1 || i === -1)) { e.preventDefault(); set[0].focus(); }
    }
  });
  window.matchMedia('(min-width:1100px)').addEventListener('change', function (e) { if (e.matches && !menu.hidden) closeMenu(false); });

  /* Texto palabra por palabra en h2 */
  d.querySelectorAll('.sp').forEach(function (el) {
    var targets = el.querySelectorAll('[lang]');
    if (!targets.length) targets = [el];
    Array.prototype.forEach.call(targets, function (t) {
      var txt = t.textContent.trim().split(/\s+/);
      t.textContent = '';
      txt.forEach(function (w, i) {
        var o = d.createElement('span'); o.className = 'w';
        var s = d.createElement('span'); s.style.setProperty('--i', i); s.textContent = w;
        o.appendChild(s); t.appendChild(o); t.appendChild(d.createTextNode(' '));
      });
    });
  });

  /* Contadores */
  var counters = [];
  d.querySelectorAll('.cnt').forEach(function (c) { counters.push(c); });
  function fmt(v, dec) { return v.toFixed(dec); }
  function runCounter(c) {
    if (c._done) return; c._done = true;
    var end = parseFloat(c.dataset.count), dec = parseInt(c.dataset.dec || '0', 10);
    if (still()) { c.textContent = fmt(end, dec); return; }
    var t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      c.textContent = fmt(end * e, dec);
      if (p < 1 && !still()) requestAnimationFrame(step); else c.textContent = fmt(end, dec);
    })(t0);
  }
  function finishCounters() {
    counters.forEach(function (c) { c._done = true; c.textContent = fmt(parseFloat(c.dataset.count), parseInt(c.dataset.dec || '0', 10)); });
  }

  /* Reveals (IntersectionObserver). Con view() de CSS el estilo ya los controla. */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.classList.contains('cnt')) runCounter(e.target);
        if (e.target.classList.contains('tl-step')) {
          var steps = d.querySelectorAll('.tl-step'), idx = Array.prototype.indexOf.call(steps, e.target) + 1;
          var tl = e.target.closest('.tl'); if (tl) tl.style.setProperty('--p', idx / steps.length);
        }
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    d.querySelectorAll('.rv,.sp,.cnt,.tl-step').forEach(function (el) { io.observe(el); });
  } else {
    root.classList.remove('js'); finishCounters();
  }

  /* Spotlight en tarjetas */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    d.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--x', (e.clientX - r.left) + 'px');
        c.style.setProperty('--y', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* Progreso lateral y seccion activa en la barra (un solo listener pasivo con rAF) */
  var ticking = false;
  var navLinks = Array.prototype.slice.call(d.querySelectorAll('[data-nav]'));
  var secs = navLinks.map(function (a) { return d.getElementById(a.dataset.nav); });
  function update() {
    ticking = false;
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--sp', h > 0 ? Math.min(1, y / h).toFixed(4) : 0);
    var mid = window.innerHeight * 0.45, cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= mid) cur = i; });
    var sec = cur > -1 ? secs[cur] : null;
    if (sec && sec.getBoundingClientRect().bottom < mid) cur = -1;
    navLinks.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  /* Previsualizacion de testimonios: ?testimonios=1|3|8 o los botones */
  var tBtns = Array.prototype.slice.call(d.querySelectorAll('[data-tn]')).filter(function (b) { return b.tagName === 'BUTTON'; });
  function setTn(n) {
    root.dataset.tn = n;
    tBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tn === n)); });
    try { var u = new URL(location.href); u.searchParams.set('testimonios', n); history.replaceState(null, '', u); } catch (e) {}
  }
  tBtns.forEach(function (b) { b.addEventListener('click', function () { setTn(b.dataset.tn); }); });
  tBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tn === root.dataset.tn)); });

  /* Franja de clientes: el segundo conjunto del marquee se clona aqui (aria-hidden) y las mascaras se piden al acercarse */
  var strip = d.getElementById('clientes');
  if (strip) {
    strip.querySelectorAll('.ctrack').forEach(function (t) {
      var set = t.querySelector('.cset'); if (!set) return;
      var c = set.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.removeAttribute('role');
      c.querySelectorAll('[aria-label]').forEach(function (e) { e.removeAttribute('aria-label'); e.removeAttribute('role'); });
      t.appendChild(c);
    });
    var loadMasks = function () {
      strip.querySelectorAll('.lg[data-m]').forEach(function (e) {
        var u = 'url(' + e.getAttribute('data-m') + ')'; e.style.webkitMaskImage = u; e.style.maskImage = u; e.removeAttribute('data-m');
      });
    };
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { loadMasks(); mo.disconnect(); } }, { rootMargin: '0px' });
      mo.observe(strip);
    } else { loadMasks(); }
    /* el color real solo se pide al pasar el cursor o enfocar */
    var loadColor = function (e) {
      var cl = e.target.closest ? e.target.closest('.cl') : null; if (!cl) return;
      var im = cl.querySelector('.lc[data-src]'); if (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); }
    };
    strip.addEventListener('pointerover', loadColor); strip.addEventListener('focusin', loadColor);
  }

  /* Selector de paleta de prueba: tokens en CSS, ?paleta=<id>, recuerda la eleccion (localStorage en try/catch) */
  var pal = d.getElementById('pal'), palBtn = d.getElementById('palbtn'), palMenu = d.getElementById('palmenu'), palName = d.getElementById('palname');
  var palItems = Array.prototype.slice.call(palMenu.querySelectorAll('[data-pal]'));
  var palMin = d.getElementById('palmin'), palHide = d.getElementById('palhide');
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function applyPal(id, save) {
    if (id === 'papel-tomate') root.removeAttribute('data-palette'); else root.dataset.palette = id;
    palItems.forEach(function (b) {
      var on = b.dataset.pal === id;
      b.setAttribute('aria-pressed', String(on));
      if (on) palName.textContent = b.dataset.name;
    });
    if (save) {
      store('c-manual-paleta', id);
      try { var u = new URL(location.href); u.searchParams.set('paleta', id); history.replaceState(null, '', u); } catch (e) {}
    }
  }
  applyPal(root.dataset.palette || 'papel-tomate', false);
  palItems.forEach(function (b) { b.addEventListener('click', function () { applyPal(b.dataset.pal, true); }); });
  function palOpen(o) {
    palMenu.hidden = !o; palBtn.setAttribute('aria-expanded', String(o));
    if (o) { var cur = palItems.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || palItems[0]; cur.focus(); }
  }
  palBtn.addEventListener('click', function () { palOpen(palMenu.hidden); });
  pal.addEventListener('keydown', function (e) {
    if (palMenu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); palOpen(false); palBtn.focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var all = palItems.concat([palMin, palHide]), i = all.indexOf(d.activeElement);
      i = e.key === 'ArrowDown' ? (i + 1) % all.length : (i - 1 + all.length) % all.length;
      all[i].focus();
    }
  });
  d.addEventListener('click', function (e) { if (!palMenu.hidden && !pal.contains(e.target)) palOpen(false); });
  palMin.addEventListener('click', function () {
    var on = pal.toggleAttribute('data-min');
    store('c-manual-sel', on ? 'min' : '');
  });
  palHide.addEventListener('click', function () { root.dataset.selhide = '1'; palOpen(false); store('c-manual-sel', 'hide'); });
  try { if (localStorage.getItem('c-manual-sel') === 'min') pal.setAttribute('data-min', ''); } catch (e) {}

  /* Formulario de maqueta: no envia nada */
  var form = d.getElementById('form'), st = d.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var es = root.dataset.lang === 'es';
    var mail = form.elements.email;
    if (!form.elements.name.value.trim() || !mail.value.trim() || !form.elements.message.value.trim()) {
      st.textContent = es ? 'Faltan datos. Completa nombre, correo y mensaje para poder responderte.' : 'Some fields are empty. Fill in name, email and message so I can reply.';
      (form.elements.name.value.trim() ? (mail.value.trim() ? form.elements.message : mail) : form.elements.name).focus();
      return;
    }
    st.textContent = es ? 'Este formulario es un mockup, no envía nada.' : 'This form is a mockup, it sends nothing.';
  });
})();
