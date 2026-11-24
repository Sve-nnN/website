/* effects.js: slot unico de canvas, gates, shaders originales (origenes: Grainient, PatternWaves, CRTWarp, MicroSlats), ticker ASCII, pausa, spotlight, reveal. Script clasico, sin fetch ni HTML como cadena. */
(function () {
  'use strict';

  var root = document.documentElement;
  var READ = '[data-surface="reading"]';
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqNarrow = window.matchMedia('(max-width: 767px)');
  var mqCoarse = window.matchMedia('(pointer: coarse)');

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var HEAD = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 u_res;uniform float u_t;uniform float u_dpr;',
    'uniform vec3 u_ink;uniform vec3 u_a;uniform vec3 u_b;uniform vec3 u_c;uniform vec3 u_p;'
  ].join('\n');
  var NOISE = [
    'float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}',
    'float vn(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);',
    'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}'
  ].join('\n');

  /* fx:grain:start */
  var GRAIN = [HEAD, NOISE,
    'void main(){',
    'vec2 uv=gl_FragCoord.xy/u_res;vec2 q=vec2(uv.x*u_res.x/u_res.y,uv.y);float t=u_t*.04;',
    'float n=vn(q*1.5+vec2(t,-t*.6))*.65+vn(q*3.1+vec2(-t*1.2,t*.8)+7.3)*.35;',
    'float s=clamp(uv.x*.62+(1.-uv.y)*.38+(n-.5)*.7,0.,1.);',
    'vec3 col=mix(u_a,u_b,smoothstep(.12,.55,s));col=mix(col,u_c,smoothstep(.5,.95,s));',
    'float d=length((uv-vec2(0.,.05))*vec2(.9,1.25));',
    'col=mix(col,u_ink,(1.-smoothstep(.2,1.,d+(n-.5)*.35))*.92);',
    'col+=(h(gl_FragCoord.xy+fract(u_t*60.)*vec2(137.,291.))-.5)*.12;',
    'gl_FragColor=vec4(clamp(col,0.,1.),1.);}'
  ].join('\n');
  /* fx:grain:end */

  /* fx:halftone:start */
  var HALFTONE = [HEAD,
    'void main(){',
    'float cell=8.*u_dpr;vec2 fc=gl_FragCoord.xy;vec2 cp=(floor(fc/cell)+.5)*cell;',
    'vec2 uv=cp/u_res;vec2 q=vec2(uv.x*u_res.x/u_res.y,uv.y);',
    'float w=.5+.5*sin(dot(q,vec2(.82,.57))*6.-u_t*.7+sin(q.y*4.+u_t*.4)*.9);',
    'float r=cell*(.08+.42*w*(1.-smoothstep(.25,.75,length(uv-.5))));',
    'gl_FragColor=vec4(mix(u_ink,u_p,1.-smoothstep(r-.6,r+.6,length(fc-cp))),1.);}'
  ].join('\n');
  /* fx:halftone:end */

  /* fx:crt:start */
  var CRT = [HEAD, NOISE,
    'void main(){',
    'vec2 uv=gl_FragCoord.xy/u_res;vec2 c=uv*2.-1.;c*=1.+.08*dot(c,c);vec2 q=c*.5+.5;',
    'float ins=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);',
    'vec2 g=floor(q*u_res/(10.*u_dpr));',
    'float v=floor((vn(g*.32+vec2(u_t*.3,-u_t*.2))*.6+vn(g*.7-vec2(u_t*.2,u_t*.15)+9.1)*.4)*5.)/5.;',
    'vec3 col=mix(u_ink,u_p,v*.4)+u_a*.12*v;',
    'col*=.78+.22*sin(gl_FragCoord.y*3.14159);',
    'float k=mod(floor(gl_FragCoord.x),3.);',
    'col*=vec3(.72)+vec3(.28)*vec3(float(k<.5),float(abs(k-1.)<.5),float(k>1.5));',
    'col*=1.-.6*dot(uv-.5,uv-.5);',
    'gl_FragColor=vec4(col*ins,1.);}'
  ].join('\n');
  /* fx:crt:end */

  /* fx:slats:start */
  var SLATS = [HEAD,
    'void main(){',
    'float cw=10.*u_dpr;float col=floor(gl_FragCoord.x/cw);float fx=fract(gl_FragCoord.x/cw);',
    'float y=gl_FragCoord.y/u_res.y;',
    'float top=.5+.16*sin(col*.21+u_t*.55)+.1*sin(col*.09-u_t*.4+1.7);',
    'float in_=step(.14,fx)*step(fx,.86);',
    'vec3 o=mix(u_ink,mix(u_a*.35,u_a*.9,smoothstep(0.,top,y)),step(y,top)*in_);',
    'gl_FragColor=vec4(mix(o,u_c,smoothstep(.05,0.,abs(y-top))*in_*.85),1.);}'
  ].join('\n');
  /* fx:slats:end */

  var KINDS = { grain: GRAIN, halftone: HALFTONE, crt: CRT, slats: SLATS };

  function hex3(v, d) {
    var m = /^#([0-9a-f]{6})$/i.exec((v || '').trim());
    var n = m ? parseInt(m[1], 16) : 0;
    return m ? [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] : d;
  }

  function inReading(el) { return !!(el.closest && el.closest(READ)); }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }

  function mount(el, kind) {
    var canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.insertBefore(canvas, el.firstChild);

    var gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    } catch (e) { gl = null; }
    var v = gl && compile(gl, gl.VERTEX_SHADER, VERT);
    var f = gl && compile(gl, gl.FRAGMENT_SHADER, KINDS[kind]);
    var pr = v && f && gl.createProgram();
    if (pr) {
      gl.attachShader(pr, v);
      gl.attachShader(pr, f);
      gl.linkProgram(pr);
    }
    if (!pr || !gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      var l0 = gl && gl.getExtension('WEBGL_lose_context');
      if (l0) { l0.loseContext(); }
      canvas.remove();
      return null;
    }

    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var u = function (n) { return gl.getUniformLocation(pr, n); };
    var uRes = u('u_res');
    var uT = u('u_t');
    var uDpr = u('u_dpr');
    var cs = window.getComputedStyle(root);
    [['u_ink', '--ink', [.04, .04, .07]], ['u_a', '--violet', [.36, .24, .96]],
      ['u_b', '--coral', [1, .3, .43]], ['u_c', '--amber', [1, .69, .13]],
      ['u_p', '--phosphor', [.71, 1, .23]]].forEach(function (c) {
      gl.uniform3fv(u(c[0]), hex3(cs.getPropertyValue(c[1]), c[2]));
    });

    var raf = 0;
    var last = 0;
    var t0 = performance.now();
    var drawn = false;
    var dead = false;
    var dirty = true;
    var ro = new window.ResizeObserver(function () { dirty = true; });

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(el.clientWidth * dpr));
      var h = Math.max(1, Math.round(el.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uDpr, w / Math.max(1, el.clientWidth));
      dirty = false;
    }

    function frame() {
      raf = window.requestAnimationFrame(frame);
      var now = performance.now();
      if (now - last < 32) { return; }
      last = now;
      if (dirty) { resize(); }
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!drawn) {
        drawn = true;
        canvas.classList.add('is-on');
      }
    }

    function play() {
      if (!dead && !raf) { raf = window.requestAnimationFrame(frame); }
    }

    function pause() {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }

    ro.observe(el);
    resize();
    play();
    return {
      play: play,
      pause: pause,
      destroy: function () {
        dead = true;
        pause();
        ro.disconnect();
        var l = gl.getExtension('WEBGL_lose_context');
        if (l) { l.loseContext(); }
        canvas.remove();
      }
    };
  }

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

  var active = null; /* {el, kind, handle, at, demo} */
  var visible = [];
  var io = null;
  var started = false;

  function emit(kind, state) {
    document.dispatchEvent(new window.CustomEvent('fx:change', { detail: { kind: kind, state: state } }));
  }

  function destroyActive(skipRefill) {
    var a = active;
    if (!a) { return; }
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
      var kind = visible[i].getAttribute('data-fx');
      if (KINDS[kind]) {
        mountOn(visible[i], kind, false);
        return;
      }
    }
  }

  function reevaluate() {
    if (active && !(active.demo ? motionReasons().length === 0 : gates().ok)) { destroyActive(true); }
    refill();
    asciiSync();
    syncPause();
  }

  /* fx:ascii:start */
  var CH = '.:-=+*#%@';
  var asciiVis = [];
  var asciiTimer = 0;
  var asciiT0 = performance.now();

  function asciiFrame() {
    var t = (performance.now() - asciiT0) / 1000;
    asciiVis.forEach(function (el) {
      var out = [];
      for (var y = 0; y < el._cols.length; y++) {
        var row = '';
        for (var x = 0; x < el._cols[y]; x++) {
          var v = (Math.sin(x * .35 + t) + Math.sin(y * .6 - t * .7)) / 4 + .5;
          row += CH.charAt(Math.max(0, Math.min(8, Math.floor(v * 9))));
        }
        out.push(row);
      }
      el.textContent = out.join('\n');
    });
  }

  function asciiSync() {
    var on = asciiVis.length > 0 && !document.hidden && gates().ok;
    if (on && !asciiTimer) { asciiTimer = window.setInterval(asciiFrame, 100); }
    if (!on && asciiTimer) {
      window.clearInterval(asciiTimer);
      asciiTimer = 0;
    }
  }
  /* fx:ascii:end */

  /* fx:spotlight:start */
  function bindSpot(el) {
    var raf = 0;
    var x = 0;
    var y = 0;
    el.addEventListener('pointermove', function (e) {
      if ((e.pointerType !== 'mouse' && e.pointerType !== 'pen') || motionReasons().length) { return; }
      var r = el.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      raf = raf || window.requestAnimationFrame(function () {
        raf = 0;
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
      });
    });
    el.addEventListener('pointerleave', function () {
      window.cancelAnimationFrame(raf);
      raf = 0;
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  }
  /* fx:spotlight:end */

  /* fx:reveal:start */
  function revealIn(el) {
    if (el.classList.contains('is-pending')) {
      el.classList.replace('is-pending', 'is-in');
      io.unobserve(el);
    }
  }
  /* fx:reveal:end */

  function onIntersect(entries) {
    entries.forEach(function (e) {
      var el = e.target;
      var i = visible.indexOf(el);
      var a = asciiVis.indexOf(el);
      if (e.isIntersecting) {
        if (i === -1) { visible.push(el); }
        if (el.hasAttribute('data-fx-ascii') && a === -1) { asciiVis.push(el); }
        if (el.hasAttribute('data-fx-reveal')) { revealIn(el); }
        var kind = el.getAttribute('data-fx');
        if (KINDS[kind] && gates().ok && !(active && active.demo)) { mountOn(el, kind, false); }
      } else {
        if (i !== -1) { visible.splice(i, 1); }
        if (a !== -1) { asciiVis.splice(a, 1); }
        if (active && active.el === el) { destroyActive(false); }
      }
    });
    asciiSync();
  }

  /* Registra nodos nuevos; nada dentro de una superficie de lectura se registra. */
  function scan() {
    var nodes = io ? document.querySelectorAll('[data-fx],[data-fx-ascii],[data-fx-reveal],[data-fx-spotlight]') : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el._fx || inReading(el)) { continue; }
      el._fx = 1;
      if (el.hasAttribute('data-fx-ascii')) {
        el._cols = el.textContent.replace(/\n+$/, '').split('\n').map(function (l) { return l.length; });
      }
      if (el.hasAttribute('data-fx-spotlight')) { bindSpot(el); }
      if (el.hasAttribute('data-fx-reveal') && !motionReasons().length) { el.classList.add('is-pending'); }
      io.observe(el);
    }
  }

  function start() {
    if (started) { return; }
    started = true;
    if (typeof window.IntersectionObserver === 'function') {
      io = new window.IntersectionObserver(onIntersect, { threshold: 0.15 });
      scan();
    }
  }

  var pauseBtns = [];

  function syncPause() {
    var on = root.dataset.motion === 'reduced' || mqReduce.matches;
    pauseBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.disabled = mqReduce.matches;
    });
  }

  function setPaused(state) {
    if (state) { root.setAttribute('data-motion', 'reduced'); }
    else { root.removeAttribute('data-motion'); }
    emit(active ? active.kind : null, state ? 'user-paused' : 'user-resumed');
    reevaluate();
  }

  function bindPause(btn) {
    if (!btn || pauseBtns.indexOf(btn) !== -1) { return; }
    pauseBtns.push(btn);
    btn.addEventListener('click', function () {
      var next = root.dataset.motion !== 'reduced';
      try { window.sessionStorage.setItem('fx-paused', next ? '1' : '0'); } catch (e) { /* sin storage */ }
      setPaused(next);
    });
    syncPause();
  }

  [mqReduce, mqNarrow, mqCoarse].forEach(function (mq) { mq.addEventListener('change', reevaluate); });
  new window.MutationObserver(reevaluate).observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-saver'] });

  document.addEventListener('visibilitychange', function () {
    asciiSync();
    if (!active) { return; }
    if (document.hidden) { active.handle.pause(); emit(active.kind, 'paused'); }
    else { active.handle.play(); emit(active.kind, 'resumed'); }
  });

  window.FX = {
    gates: gates,
    motionGates: function () {
      var r = motionReasons();
      return { ok: r.length === 0, reasons: r };
    },
    count: function () { return document.querySelectorAll('canvas.fx-canvas').length; },
    active: function () { return active ? { kind: active.kind, el: active.el, at: active.at } : null; },
    isPaused: function () { return root.dataset.motion === 'reduced'; },
    setPaused: setPaused,
    bindPause: bindPause,
    scan: scan,
    destroy: function () { destroyActive(true); },
    /* Por boton: alterna, respeta los gates de movimiento y no el de ancho ni puntero. */
    demo: function (el) {
      var kind = el && el.getAttribute('data-fx-demo');
      if (!KINDS[kind] || inReading(el)) { return false; }
      if (active && active.el === el) {
        destroyActive(false);
        return false;
      }
      if (motionReasons().length) { return false; }
      start();
      var ok = mountOn(el, kind, true);
      if (ok && io && visible.indexOf(el) === -1) { io.observe(el); }
      return ok;
    }
  };

  /* saveData tambien enciende data-saver para que el CSS apague el movimiento. */
  if (navigator.connection && navigator.connection.saveData === true) { root.setAttribute('data-saver', 'on'); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-fx-pause]'), bindPause);
  try {
    if (window.sessionStorage.getItem('fx-paused') === '1') { setPaused(true); }
  } catch (e) { /* sin storage */ }

  function schedule() {
    if (typeof window.requestIdleCallback === 'function') { window.requestIdleCallback(start, { timeout: 2000 }); }
    else { window.setTimeout(start, 200); }
  }
  if (document.readyState === 'complete') { schedule(); }
  else { window.addEventListener('load', schedule); }
})();
