/*
 * effects.js: gestor de slot unico, gates de movimiento y shaders minimos.
 * Codigo original, escrito desde cero para este proyecto. Nombre de origen
 * documentado del efecto grain: Grainient de React Bits. No se copio GLSL ni JS.
 *
 * Reglas:
 *  - Script clasico (sin type="module"): abre con doble clic sobre file://.
 *  - Nada se monta antes del evento load ni antes de un idle.
 *  - Un solo canvas en toda la pagina (slot unico). DPR limitado a 1.5, 30 fps.
 *  - Sin fetch, sin HTML como cadena: solo textContent y setAttribute.
 *  - El fallback CSS (effects.css) sigue visible si algun gate falla o no hay WebGL.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var DPR_MAX = 1.5;
  var FRAME_MS = 1000 / 30;

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqNarrow = window.matchMedia('(max-width: 767px)');
  var mqCoarse = window.matchMedia('(pointer: coarse)');

  /* ---------- Shaders: cada tipo aporta su fragment shader ---------- */

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var HEAD = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',
    'uniform float u_t;',
    'uniform vec3 u_ink;',
    'uniform vec3 u_a;',
    'uniform vec3 u_b;',
    'uniform vec3 u_c;'
  ].join('\n');

  /*
   * grain: campo diagonal deformado por dos octavas de ruido de valor que se
   * desplazan despacio. Tres paradas violeta, coral y ambar sobre tinta, con la
   * tinta dominante abajo a la izquierda (zona calmada para el panel de texto).
   * Grano por pixel con hash de gl_FragCoord que cambia por cuadro (+/- .06).
   */
  var GRAIN = [
    HEAD,
    'float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}',
    'float vn(vec2 p){',
    '  vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);',
    '  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);',
    '}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/u_res;',
    '  float asp=u_res.x/u_res.y;',
    '  vec2 q=vec2(uv.x*asp,uv.y);',
    '  float t=u_t*.04;',
    '  float n=vn(q*1.5+vec2(t,-t*.6))*.65+vn(q*3.1+vec2(-t*1.2,t*.8)+7.3)*.35;',
    '  float s=clamp(uv.x*.62+(1.-uv.y)*.38+(n-.5)*.7,0.,1.);',
    '  vec3 col=mix(u_a,u_b,smoothstep(.12,.55,s));',
    '  col=mix(col,u_c,smoothstep(.5,.95,s));',
    '  float d=length((uv-vec2(0.,.05))*vec2(.9,1.25));',
    '  float calm=1.-smoothstep(.2,1.,d+(n-.5)*.35);',
    '  col=mix(col,u_ink,calm*.92);',
    '  float g=h(gl_FragCoord.xy+fract(u_t*60.)*vec2(137.,291.))-.5;',
    '  col=clamp(col+g*.12,0.,1.);',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  var KINDS = {
    grain: { frag: GRAIN }
  };

  /* ---------- Utilidades ---------- */

  function hexToVec3(value, fallback) {
    var m = /^#([0-9a-f]{6})$/i.exec((value || '').trim());
    if (!m) { return fallback; }
    var n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function readColors() {
    var cs = window.getComputedStyle(root);
    return {
      ink: hexToVec3(cs.getPropertyValue('--ink'), [0.04, 0.04, 0.07]),
      a: hexToVec3(cs.getPropertyValue('--violet'), [0.36, 0.24, 0.96]),
      b: hexToVec3(cs.getPropertyValue('--coral'), [1, 0.3, 0.43]),
      c: hexToVec3(cs.getPropertyValue('--amber'), [1, 0.69, 0.13])
    };
  }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function program(gl, frag) {
    var v = compile(gl, gl.VERTEX_SHADER, VERT);
    var f = compile(gl, gl.FRAGMENT_SHADER, frag);
    if (!v || !f) { return null; }
    var pr = gl.createProgram();
    gl.attachShader(pr, v);
    gl.attachShader(pr, f);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { return null; }
    return pr;
  }

  /* ---------- Montaje de un canvas ---------- */

  function mount(el, kind) {
    var def = KINDS[kind];
    if (!def) { return null; }

    var canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.insertBefore(canvas, el.firstChild);

    var gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    } catch (e) {
      gl = null;
    }
    if (!gl) {
      canvas.remove();
      return null;
    }

    var pr = program(gl, def.frag);
    if (!pr) {
      var lose0 = gl.getExtension('WEBGL_lose_context');
      if (lose0) { lose0.loseContext(); }
      canvas.remove();
      return null;
    }

    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(pr, 'u_res');
    var uT = gl.getUniformLocation(pr, 'u_t');
    var colors = readColors();
    gl.uniform3fv(gl.getUniformLocation(pr, 'u_ink'), colors.ink);
    gl.uniform3fv(gl.getUniformLocation(pr, 'u_a'), colors.a);
    gl.uniform3fv(gl.getUniformLocation(pr, 'u_b'), colors.b);
    gl.uniform3fv(gl.getUniformLocation(pr, 'u_c'), colors.c);

    var raf = 0;
    var last = 0;
    var t0 = performance.now();
    var drawn = false;
    var dead = false;
    var dirty = true;
    var ro = null;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
      var w = Math.max(1, Math.round(el.clientWidth * dpr));
      var h = Math.max(1, Math.round(el.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      dirty = false;
    }

    function frame() {
      raf = window.requestAnimationFrame(frame);
      var now = performance.now();
      if (now - last < FRAME_MS - 1) { return; }
      last = now;
      if (dirty) { resize(); }
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!drawn) {
        drawn = true;
        canvas.classList.add('is-on');
      }
    }

    if (typeof window.ResizeObserver === 'function') {
      ro = new window.ResizeObserver(function () { dirty = true; });
      ro.observe(el);
    } else {
      window.addEventListener('resize', markDirty);
    }
    function markDirty() { dirty = true; }

    function play() {
      if (dead || raf) { return; }
      raf = window.requestAnimationFrame(frame);
    }

    function pause() {
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function destroy() {
      if (dead) { return; }
      dead = true;
      pause();
      if (ro) { ro.disconnect(); } else { window.removeEventListener('resize', markDirty); }
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) { lose.loseContext(); }
      canvas.remove();
    }

    resize();
    play();
    return { play: play, pause: pause, destroy: destroy };
  }

  /* ---------- Gates ---------- */

  function motionReasons() {
    var r = [];
    if (mqReduce.matches) { r.push('prefers-reduced-motion: reduce'); }
    if (root.dataset.motion === 'reduced') { r.push('data-motion="reduced"'); }
    if (navigator.connection && navigator.connection.saveData === true) { r.push('saveData activo'); }
    if (root.dataset.saver === 'on') { r.push('data-saver="on"'); }
    return r;
  }

  function gates() {
    var r = motionReasons();
    if (mqNarrow.matches) { r.push('ancho menor a 768 px'); }
    if (mqCoarse.matches) { r.push('pointer coarse'); }
    return { ok: r.length === 0, reasons: r };
  }

  /* ---------- Slot unico ---------- */

  var active = null; /* {el, kind, handle, at, demo} */
  var visible = [];
  var io = null;
  var started = false;
  var userPaused = false;

  function emit(kind, state) {
    document.dispatchEvent(new window.CustomEvent('fx:change', { detail: { kind: kind, state: state } }));
  }

  function destroyActive(skipRefill) {
    if (!active) { return; }
    var a = active;
    active = null;
    a.handle.destroy();
    emit(a.kind, 'destroyed');
    if (!skipRefill) { refill(); }
  }

  function mountOn(el, kind, isDemo) {
    if (active && active.el === el) { return true; }
    destroyActive(true);
    var handle = mount(el, kind);
    if (!handle) { return false; }
    active = { el: el, kind: kind, handle: handle, at: performance.now(), demo: !!isDemo };
    emit(kind, 'mounted');
    return true;
  }

  function refill() {
    if (active || !started || !gates().ok) { return; }
    for (var i = 0; i < visible.length; i++) {
      var el = visible[i];
      var kind = el.getAttribute('data-fx');
      if (kind && KINDS[kind]) {
        mountOn(el, kind, false);
        return;
      }
    }
  }

  function reevaluate() {
    if (active) {
      var ok = active.demo ? motionReasons().length === 0 : gates().ok;
      if (!ok) { destroyActive(true); return; }
    }
    refill();
  }

  function onIntersect(entries) {
    entries.forEach(function (e) {
      var el = e.target;
      var idx = visible.indexOf(el);
      if (e.isIntersecting) {
        if (idx === -1) { visible.push(el); }
        var kind = el.getAttribute('data-fx');
        if (kind && KINDS[kind] && gates().ok) { mountOn(el, kind, false); }
      } else {
        if (idx !== -1) { visible.splice(idx, 1); }
        if (active && active.el === el) { destroyActive(false); }
      }
    });
  }

  function start() {
    if (started) { return; }
    started = true;
    if (typeof window.IntersectionObserver !== 'function') { return; }
    io = new window.IntersectionObserver(onIntersect, { threshold: 0.15 });
    var nodes = document.querySelectorAll('[data-fx]');
    for (var i = 0; i < nodes.length; i++) { io.observe(nodes[i]); }
  }

  function schedule() {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      window.setTimeout(start, 200);
    }
  }

  /* ---------- Reevaluacion y pausa por visibilidad ---------- */

  function onChange() { reevaluate(); }
  [mqReduce, mqNarrow, mqCoarse].forEach(function (mq) {
    if (typeof mq.addEventListener === 'function') { mq.addEventListener('change', onChange); }
    else if (typeof mq.addListener === 'function') { mq.addListener(onChange); }
  });

  if (typeof window.MutationObserver === 'function') {
    new window.MutationObserver(onChange).observe(root, {
      attributes: true,
      attributeFilter: ['data-motion', 'data-saver']
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (!active) { return; }
    if (document.hidden) { active.handle.pause(); emit(active.kind, 'paused'); }
    else { active.handle.play(); emit(active.kind, 'resumed'); }
  });

  /* ---------- API publica ---------- */

  window.FX = {
    gates: gates,
    count: function () { return document.querySelectorAll('canvas.fx-canvas').length; },
    active: function () {
      return active ? { kind: active.kind, el: active.el, at: active.at } : null;
    },
    isPaused: function () { return userPaused; },
    setPaused: function (state) {
      userPaused = !!state;
      if (userPaused) { root.setAttribute('data-motion', 'reduced'); }
      else { root.removeAttribute('data-motion'); }
      emit(active ? active.kind : null, userPaused ? 'user-paused' : 'user-resumed');
      reevaluate();
    },
    destroy: function () { destroyActive(true); },
    /* Montaje por boton: respeta los gates de movimiento, no el de ancho. */
    demo: function (el) {
      var kind = el && el.getAttribute('data-fx-demo');
      if (!kind || !KINDS[kind]) { return false; }
      if (motionReasons().length) { return false; }
      start();
      var ok = mountOn(el, kind, true);
      if (ok && io && visible.indexOf(el) === -1) { io.observe(el); }
      return ok;
    }
  };

  if (document.readyState === 'complete') { schedule(); }
  else { window.addEventListener('load', schedule); }
})();
