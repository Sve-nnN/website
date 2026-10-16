/* Sala de control v4. JS propio, sin librerias. La pagina esta completa sin este archivo.
   Un unico listener de scroll (pasivo, con rAF) para direccion del nav y progreso fallback. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lang = 'es';
  var paused = reduceMQ.matches;
  var auditToken = 0;

  /* ---------- Idioma ---------- */
  var statusLabels = {
    es: { ok: 'OK', fixed: 'Corregido', warn: 'Alerta', scan: 'Revisando', pend: 'Pendiente' },
    en: { ok: 'OK', fixed: 'Fixed', warn: 'Alert', scan: 'Scanning', pend: 'Waiting' }
  };
  var formMsg = {
    es: 'Este formulario es un mockup y no envía nada.',
    en: 'This form is a mockup and sends nothing.'
  };
  var meta = {
    es: {
      title: 'SEO técnico e ingeniería de software | Juan Carlos Angulo',
      desc: 'Soy ingeniero de software y consultor de SEO técnico: auditorías, rendimiento web y arquitectura Next.js y Payload para posicionar tu sitio en Google.'
    },
    en: {
      title: 'Technical SEO and software engineering | Juan Carlos Angulo',
      desc: 'I am a software engineer and technical SEO consultant: audits, web performance and Next.js and Payload architecture to get your site ranking on Google.'
    }
  };

  function fmt(n, dec) {
    return n.toLocaleString(lang === 'en' ? 'en-US' : 'es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function renderCounters() {
    $$('[data-count]').forEach(function (el) {
      el.textContent = fmt(parseFloat(el.dataset.count), parseInt(el.dataset.dec || '0', 10)) + (el.dataset.suf || '');
    });
  }
  function renderStatuses() {
    $$('.checks li').forEach(function (li) {
      var s = li.dataset.s, st = $('.st', li);
      var key = s === 'ok' && li.dataset.fix ? 'fixed' : s;
      if (s === 'ok' && !li.dataset.fix) key = 'ok';
      st.textContent = statusLabels[lang][key];
    });
  }
  function renderStatus() {
    var el = $('#status');
    if (el.dataset.on === 'true') el.textContent = formMsg[lang];
  }
  function setLang(l) {
    lang = l;
    root.lang = l;
    $$('[data-en]').forEach(function (el) {
      if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
      el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.es;
    });
    $$('[data-en-label]').forEach(function (el) {
      if (el.dataset.esLabel === undefined) el.dataset.esLabel = el.getAttribute('aria-label');
      el.setAttribute('aria-label', l === 'en' ? el.dataset.enLabel : el.dataset.esLabel);
    });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    document.title = meta[l].title;
    $('meta[name="description"]').setAttribute('content', meta[l].desc);
    renderCounters();
    renderStatuses();
    renderStatus();
  }
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  /* ---------- Pausa ---------- */
  function setPaused(p) {
    paused = p;
    if (p) root.setAttribute('data-paused', ''); else root.removeAttribute('data-paused');
    $('#pause').setAttribute('aria-pressed', String(p));
    if (p) { auditToken++; auditFinal(); revealAll(); } else if (!reduceMQ.matches) { runAudit(); }
  }
  $('#pause').addEventListener('click', function () {
    if (reduceMQ.matches) return;
    setPaused(!paused);
  });
  reduceMQ.addEventListener('change', function () { setPaused(reduceMQ.matches); });

  /* ---------- Contadores ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    if (paused) { return; }
    var t0 = null, dur = 1400;
    function tick(t) {
      if (paused) { el.textContent = fmt(target, dec) + (el.dataset.suf || ''); return; }
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, dec) + (el.dataset.suf || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Reveals y disparadores (IntersectionObserver) ---------- */
  var io = null;
  function activate(el) {
    el.classList.add('in');
    $$('[data-count]', el).forEach(countUp);
    if (el.matches('[data-count]')) countUp(el);
  }
  function revealAll() {
    $$('.reveal,[data-io]').forEach(function (el) { el.classList.add('in'); });
  }
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.22, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal,[data-io]').forEach(function (el) { io.observe(el); });
  } else { revealAll(); }

  /* ---------- Spotlight y orbita ---------- */
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- Scroll: nav y progreso ---------- */
  var nav = $('#nav'), last = window.scrollY, ticking = false, menuOpen = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, max = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      if (!menuOpen) {
        if (y > last + 6 && y > 180) nav.setAttribute('data-hide', 'true');
        else if (y < last - 6 || y < 180) nav.setAttribute('data-hide', 'false');
      }
      last = y; ticking = false;
    });
  }, { passive: true });

  /* Seccion activa en el nav */
  if ('IntersectionObserver' in window) {
    var links = $$('.links a[href^="#"]');
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) secIO.observe(s); });
  }

  /* ---------- Menu movil ---------- */
  var menuBtn = $('#menuBtn'), list = $('#links');
  function setMenu(o) {
    menuOpen = o;
    list.classList.toggle('open', o);
    menuBtn.setAttribute('aria-expanded', String(o));
    if (o) nav.setAttribute('data-hide', 'false');
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  list.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });

  /* ---------- Auditoria viva del hero ---------- */
  var items = $$('.checks li'), scoreEl = $('#score'), needle = $('#auditGauge .needle');
  function setScore(v) {
    scoreEl.textContent = String(Math.round(v));
    needle.style.setProperty('--ang', (v / 100 * 180 - 90).toFixed(1) + 'deg');
  }
  function setItem(li, s) { li.dataset.s = s; $('.st', li).textContent = statusLabels[lang][s === 'ok' && li.dataset.fix ? 'fixed' : s]; }
  function auditFinal() {
    items.forEach(function (li) { li.dataset.s = 'ok'; });
    renderStatuses();
    setScore(94);
  }
  function runAudit() {
    var token = ++auditToken, score = 40, i = 0;
    items.forEach(function (li) { setItem(li, 'pend'); });
    setScore(score);
    function wait(ms, fn) { setTimeout(function () { if (token === auditToken && !paused) fn(); }, ms); }
    function scanNext() {
      if (i >= items.length) { return fixPhase(0); }
      var li = items[i];
      li.dataset.s = 'scan'; $('.st', li).textContent = statusLabels[lang].scan;
      wait(620, function () {
        if (li.dataset.fix) { li.dataset.s = 'warn'; $('.st', li).textContent = statusLabels[lang].warn; score += 4; }
        else { setItem(li, 'ok'); score += 9; }
        setScore(score); i++;
        wait(180, scanNext);
      });
    }
    function fixPhase(k) {
      var fixes = items.filter(function (li) { return li.dataset.fix; });
      if (k >= fixes.length) { return wait(3600, runAudit); }
      wait(900, function () {
        li = fixes[k]; li.dataset.s = 'scan'; $('.st', li).textContent = statusLabels[lang].scan;
        wait(650, function () { setItem(li, 'ok'); score += 5; setScore(score); fixPhase(k + 1); });
      });
    }
    var li;
    wait(1700, scanNext);
  }

  /* ---------- Formulario sin envio ---------- */
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = $('#status');
    s.dataset.on = 'true';
    s.textContent = formMsg[lang];
  });

  /* ---------- Arranque ---------- */
  renderCounters();
  if (paused) { root.setAttribute('data-paused', ''); $('#pause').setAttribute('aria-pressed', 'true'); $('#pause').setAttribute('aria-disabled', 'true'); revealAll(); auditFinal(); }
  else { runAudit(); }
  if (/^en\b/i.test(navigator.language) && location.hash === '#en') setLang('en');
})();
