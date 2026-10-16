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

  /* Pausa */
  var pauseBtn = d.getElementById('pause');
  pauseBtn.addEventListener('click', function () {
    var on = root.classList.toggle('paused');
    pauseBtn.setAttribute('aria-pressed', String(on));
    d.querySelectorAll('.pause-txt span').forEach(function (s) {
      s.textContent = s.lang === 'es' ? (on ? 'Reanudar animaciones' : 'Pausar animaciones') : (on ? 'Resume animations' : 'Pause animations');
    });
    if (on) { finishCounters(); }
  });

  /* Texto palabra por palabra */
  d.querySelectorAll('.sp').forEach(function (el) {
    var targets = el.querySelectorAll('[lang]');
    if (!targets.length) targets = [el];
    var n = 0;
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

  /* Nav que se oculta al bajar, progreso lateral y capitulo activo (un solo listener pasivo con rAF) */
  var nav = d.getElementById('nav'), lastY = window.scrollY, ticking = false;
  var chNum = d.getElementById('chNum');
  var chs = Array.prototype.slice.call(d.querySelectorAll('[data-ch]'));
  function update() {
    ticking = false;
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--sp', h > 0 ? Math.min(1, y / h).toFixed(4) : 0);
    if (y > 120 && y > lastY + 4) nav.classList.add('hide');
    else if (y < lastY - 4 || y <= 120) nav.classList.remove('hide');
    lastY = y;
    var cur = '00', mid = window.innerHeight * 0.45;
    chs.forEach(function (s) { if (s.getBoundingClientRect().top <= mid) cur = s.dataset.ch; });
    if (chNum.textContent !== cur) chNum.textContent = cur;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('hide'); });
  update();

  /* Formulario de maqueta: no envia nada */
  var form = d.getElementById('form'), st = d.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var es = root.dataset.lang === 'es';
    var first = form.querySelector(':invalid');
    var mail = form.elements.email;
    if (!form.elements.name.value.trim() || !mail.value.trim() || !form.elements.message.value.trim()) {
      st.textContent = es ? 'Faltan datos. Completa nombre, correo y mensaje para poder responderte.' : 'Some fields are empty. Fill in name, email and message so I can reply.';
      (form.elements.name.value.trim() ? (mail.value.trim() ? form.elements.message : mail) : form.elements.name).focus();
      return;
    }
    st.textContent = es ? 'Este formulario es un mockup, no envía nada.' : 'This form is a mockup, it sends nothing.';
  });
})();
