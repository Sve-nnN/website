/*
 * system-demo.js: solo documentacion de system.html, no es parte del kit.
 * Muestra los botones de demo, los conecta con FX.demo (delegacion de eventos) y escribe en
 * la region de estado de cada tarjeta el estado real: demo activa y canvas contados, o el
 * motivo del bloqueo. Solo textContent y setAttribute.
 */
(function () {
  'use strict';

  var FX = window.FX;
  if (!FX) { return; }

  var SEL = '[data-fx-demo-for]';

  function all() { return Array.prototype.slice.call(document.querySelectorAll(SEL)); }

  function targetOf(btn) { return document.getElementById(btn.getAttribute('data-fx-demo-for')); }

  function say(btn, text) {
    var card = btn.closest('article');
    var out = card && card.querySelector('[role="status"]');
    if (out) { out.textContent = text; }
  }

  function blockedBy(el) {
    if (el.closest('[data-surface="reading"]')) {
      return 'superficie de lectura, solo admite grano estático o dot grid estático';
    }
    var r = FX.motionGates().reasons;
    return r.length ? r.join(', ') : 'este navegador no ofrece WebGL';
  }

  function refresh() {
    var a = FX.active();
    all().forEach(function (btn) {
      var on = !!(a && a.el === targetOf(btn));
      var was = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        say(btn, 'Demo activa (' + a.kind + '). ' + FX.count() + ' de 1 canvas permitido.');
      } else if (was) {
        say(btn, 'Demo detenida. Se ve el fallback CSS. ' + FX.count() + ' de 1 canvas permitido.');
      }
    });
  }

  all().forEach(function (btn) { btn.hidden = false; });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest(SEL);
    var el = btn && targetOf(btn);
    if (!el) { return; }
    var a = FX.active();
    var toggledOff = !!(a && a.el === el);
    var ok = FX.demo(el);
    if (!ok && !toggledOff) {
      btn.setAttribute('aria-pressed', 'false');
      say(btn, 'Demo bloqueada: ' + blockedBy(el) + '. Se queda el fallback CSS.');
    }
    refresh();
  });

  document.addEventListener('fx:change', refresh);

  /*
   * Simulador de estados (componentes). El de movimiento llama FX.setPaused, asi los botones de
   * pausa siguen sincronizados; el de saveData pone y quita data-saver. Un MutationObserver
   * mantiene aria-pressed de los dos interruptores aunque el atributo cambie desde otro lado
   * (por ejemplo, el boton Pausar animaciones de la cabecera).
   */
  var root = document.documentElement;
  var sims = Array.prototype.slice.call(document.querySelectorAll('[data-sim]'));

  function syncSims() {
    sims.forEach(function (b) {
      var on = b.getAttribute('data-sim') === 'motion'
        ? root.getAttribute('data-motion') === 'reduced'
        : root.getAttribute('data-saver') === 'on';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  sims.forEach(function (b) {
    b.addEventListener('click', function () {
      var next = b.getAttribute('aria-pressed') !== 'true';
      if (b.getAttribute('data-sim') === 'motion') {
        FX.setPaused(next);
      } else if (next) {
        root.setAttribute('data-saver', 'on');
      } else {
        root.removeAttribute('data-saver');
      }
      syncSims();
    });
  });

  new window.MutationObserver(syncSims).observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-saver'] });
  syncSims();

  /*
   * Formulario de ejemplo: no tiene action, el envio se intercepta y no sale ningun dato.
   * Solo textContent.
   */
  var demoForm = document.getElementById('form-ejemplo');
  if (demoForm) {
    demoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = demoForm.querySelector('[role="status"]');
      if (out) { out.textContent = 'Formulario de ejemplo: no se envía ningún dato.'; }
    });
  }
})();
