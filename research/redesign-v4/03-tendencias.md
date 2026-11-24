# Rediseño v4: tendencias, recetas y direcciones creativas para la home

Fecha: 2026-10-16. Alcance: solo investigación. No toca src/, package.json ni Payload.

## 0. Cómo leer este documento y qué verifiqué

- **Verificado hoy con datos primarios:** soporte de navegadores (web-features y caniuse en GitHub), pesos gzip de librerías (descargué cada archivo de jsDelivr y lo comprimí con `gzip -9`), versiones y licencias (registro npm), pesos gzip de los componentes React Bits ya compilados en `designs/redesign-v3/app/dist/assets/`, existencia (HTTP 200) de cada URL citada y el stack de tres sitios de referencia leyendo su `package.json` público.
- **No verificado:** el aspecto visual exacto de los sitios de referencia. Casi todos renderizan con JavaScript, y mi lector solo obtuvo el HTML inicial. Donde describo un efecto visual de un sitio sin haberlo visto, lo marco como "visual no verificado". Tampoco encontré la landing de Lovable que mencionas: sin URL, no la analizo. Si me pasas el enlace, la reviso.
- **Cifras de mercado:** un artículo de agencia afirma +23% de profundidad de scroll con estas tendencias. Es un dato de un proveedor sin metodología, no lo uso para decidir.
- **Regla del proyecto que condiciona todo:** presupuesto de 2 efectos WebGL o canvas por página (`MAX_EFFECTS_PER_PAGE = 2` en `designs/redesign-v3/app/src/home/effect-budget.ts`), LCP menor a 2 s en móvil, CLS 0, WCAG 2.2 AA, `prefers-reduced-motion` respetado, sin bloques de código en la home.

## 1. Hallazgos clave (resumen de 8 líneas)

1. Las animaciones de scroll nativas en CSS (`animation-timeline: view()`) ya funcionan en Chrome/Edge 115+ y Safari 26+, pero **no son Baseline** y Firefox estable sigue sin ellas. Sirven como mejora progresiva: sin soporte, el contenido se ve completo y quieto.
2. Las View Transitions ya cubren todos los navegadores en la versión de documento único (Firefox 144+, Safari 18+, Chrome 111+). Las de documento cruzado (MPA) funcionan en Chrome 126+ y Safari 18.2+; Firefox solo con soporte parcial.
3. Lenis pesa 5.4 KB gzip, GSAP core 28.3 KB, ScrollTrigger 18.0 KB, Motion 51.6 KB (bundle completo UMD), three.js 89.9 KB, Rive 124.9 KB. Para un consultor que vende rendimiento, la respuesta por defecto es CSS puro y cero librerías de animación.
4. Lo que da sensación de "vivo" y cuesta casi nada: foco de luz que sigue al cursor, marquee CSS, reveals con `view()`, contadores con `@property`, grano estático, borde orbitante, hover con glare. Todos funcionan con transform/opacity o variables CSS.
5. Lo que daña la propuesta: scroll-jacking con Lenis o GSAP en toda la página, 3D con three.js en el hero, vídeo de fondo, cursor propio que oculta el nativo, y sonido automático.
6. Para un consultor SEO y de rendimiento, la prueba tangible vale más que la decoración: un contador real de Lighthouse, un antes y después, una mini auditoría interactiva. Eso diferencia a Juan de un portfolio genérico y a la vez es dinámico.
7. De los 16 componentes React Bits que ya están en la galería, 6 sirven para dinamismo barato (sección 6). Los demás son shaders de 5 a 8 KB gzip cada uno y consumen el cupo de 2 efectos.
8. Propongo tres direcciones (sección 8): **Banco de pruebas** (la página es una auditoría viva), **Sala de control** (bento de instrumentos) y **Manual editorial** (tipografía enorme y scroll narrado). Ninguna necesita más de un efecto WebGL.

## 2. Datos de soporte verificados

| Tecnología | Estado verificado hoy | Fuente |
|---|---|---|
| Scroll-driven animations (`animation-timeline`, `view()`, `scroll()`, `animation-range`) | Baseline: false. Chrome 115, Edge 115, Safari 26. Firefox estable sin soporte por defecto | [web-features, scroll-driven-animations](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/scroll-driven-animations.yml.dist), [Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) |
| View Transitions, mismo documento | Chrome 111, Edge 111, Safari 18.0, iOS Safari 18.0, Firefox 144 | [caniuse view-transitions](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/view-transitions.json) |
| View Transitions, entre documentos (`@view-transition`) | Chrome 126, Safari 18.2, iOS Safari 18.2. Firefox: soporte parcial (estado "a") | [caniuse cross-document](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/cross-document-view-transitions.json) |
| `@property` (propiedades registradas) | Baseline low desde 2024-07-09: Chrome 85, Firefox 128, Safari 16.4 | [web-features, registered-custom-properties](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/registered-custom-properties.yml.dist) |
| `@starting-style` | Baseline low desde 2024-08-06: Chrome 117, Firefox 129, Safari 17.5 | [web-features](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/starting-style.yml.dist) |
| `text-wrap: balance` | Baseline low desde 2024-05-13: Chrome 114, Firefox 121, Safari 17.5 | [web-features](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/text-wrap-balance.yml.dist) |
| Scroll snap | Baseline high desde 2022-07-15 | [web-features](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/scroll-snap.yml.dist) |
| Popover API | Baseline low desde 2025-01-27 | [web-features](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/popover.yml.dist) |

Nota técnica verificada en MDN: la propiedad abreviada `animation` reinicia `animation-timeline`. Declara `animation-timeline` siempre después del `animation` ([MDN animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)). Chrome for Developers confirma que estas animaciones pueden correr fuera del hilo principal y recomienda animar `transform` en vez de `width`.

## 3. Criterios de accesibilidad que aplican a todo

| Criterio WCAG 2.2 | Qué exige | Efecto en la home |
|---|---|---|
| [2.2.2 Pausar, detener, ocultar](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) (A) | Todo movimiento que dure más de 5 s y arranque solo necesita un mecanismo de pausa | Marquees, fondos animados y carruseles llevan botón de pausa visible |
| [2.3.1 Tres destellos](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) (A) | Nada destella más de 3 veces por segundo | Glitch, terminal averiada y CRT: frecuencia baja y duración corta |
| [2.3.3 Animación por interacciones](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) (AAA, objetivo) | El movimiento disparado por interacción se puede desactivar | `prefers-reduced-motion: reduce` apaga parallax, zoom y scroll-linked |
| [2.5.8 Tamaño de objetivo mínimo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (AA) | Objetivos táctiles de al menos 24 por 24 px | Chips, botones de pausa y controles de bento |
| 2.4.11 Foco no oculto (AA) | El foco no queda tapado por barras fijas | Cuidado con nav fija y barras de progreso |

Reglas operativas propias, derivadas de lo anterior: contenido siempre presente en el DOM sin JavaScript, animación solo como mejora; `aria-hidden` en lo decorativo; foco por teclado equivalente a cada hover; no ocultar nunca el cursor nativo.

## 4. Catálogo de tendencias con veredicto

Escala de costo: **0** = CSS puro sin JS; **bajo** = menos de 1 KB gzip propio o JS mínimo; **medio** = 5 a 30 KB gzip; **alto** = más de 30 KB gzip o GPU continua. Veredicto: **USAR**, **PROBAR** (con prueba medida) o **EVITAR**.

### 4.1 Patrones de hero

| Tendencia | Qué es | Ejemplos (URL) | Costo rendimiento | Costo a11y | Encaje con consultor de rendimiento | Veredicto |
|---|---|---|---|---|---|---|
| Titular enorme con texto real y una palabra en movimiento | H1 de 8 a 12 vw, una palabra rota entre 3 valores o con subrayado animado | [rauno.me](https://rauno.me), [joshwcomeau.com](https://joshwcomeau.com) (visual no verificado) | 0 a bajo | Bajo si el H1 queda estático en el DOM y la rotación usa `aria-hidden` en las variantes | Alto: es texto, pinta en el primer frame, protege el LCP | USAR |
| Hero con "prueba viva" (métrica real en pantalla) | Un resultado medido (por ejemplo LCP antes y después) como pieza central | Patrón propio. Referencia de bento con métricas: [vercel.com](https://vercel.com), [linear.app](https://linear.app) (visual no verificado) | 0 a bajo | Bajo | Muy alto: demuestra la propuesta | USAR |
| Hero con terminal escribiendo | Efecto máquina de escribir con cursor parpadeante | [v4.brittanychiang.com](https://v4.brittanychiang.com) usa `animejs` según su [package.json](https://raw.githubusercontent.com/bchiang7/v4/main/package.json) para su entrada | Bajo | Medio: hace falta texto final estático y parpadeo moderado | Medio: el usuario pidió sin bloques de código, la terminal debe hablar de métricas, no de código | PROBAR |
| Hero con 3D (three.js, Spline) | Escena 3D interactiva | [bruno-simon.com](https://bruno-simon.com) (portfolio completo en 3D, existe y responde; uso de three en su HTML confirmado por mi grep) | Alto: three.js 89.9 KB gzip solo la librería | Alto: navegación alternativa obligatoria | Contradice la propuesta | EVITAR |
| Hero con vídeo de fondo | Bucle en MP4 o WebM | Común en agencias (sin URL concreta verificada) | Alto: tráfico, decodificación, riesgo de LCP | Medio: requiere pausa (2.2.2) | Contradice la propuesta | EVITAR |

### 4.2 Secciones de moda

| Tendencia | Qué es | Ejemplos | Costo rendimiento | Costo a11y | Encaje | Veredicto |
|---|---|---|---|---|---|---|
| Bento grid | Mosaico de tarjetas de tamaños distintos, cada una con una idea | [Guía de tendencias 2026 de Line25](https://line25.com/articles/web-design-trends-2026/) lo cita como patrón reconocible; ejemplos de producto: [linear.app](https://linear.app), [vercel.com](https://vercel.com) (visual no verificado) | 0 con CSS grid | Bajo si el orden DOM coincide con el orden visual | Alto: permite mostrar 4 a 6 pruebas a la vez | USAR |
| Scroll storytelling | La página narra en pasos que aparecen al desplazar | [Guía 2026 de StudioMeyer](https://studiomeyer.io/en/blog/webdesign-trends-2026) lo describe (fuente de agencia) | 0 con `view()`, medio con GSAP | Medio: motion ligado al scroll puede molestar | Alto si el "paso" es una auditoría real | USAR en versión CSS |
| Timeline vertical | Hitos de experiencia o del proceso con línea que se rellena | [craftz.dog](https://craftz.dog) tiene una sección Bio en formato timeline (estructura confirmada en el HTML inicial) | 0 | Bajo con lista ordenada `<ol>` | Medio | USAR |
| Contadores animados | Números que suben hasta el valor final | Patrón general. React Bits ofrece Count Up y Counter (ver scout) | 0 con `@property`; 51 KB si se usa Motion | Medio: hay que entregar el valor final como texto real | Alto: cifras de resultados | USAR con CSS |
| Marquee de logos o tecnologías | Banda infinita horizontal | Patrón general | 0 | Medio: exige pausa (2.2.2) y copia `aria-hidden` | Medio | USAR con botón de pausa |
| Mini demos interactivas | Un widget real: simulador de peso de página, comparador de imágenes antes y después | Patrón propio | Bajo a medio, un componente pequeño | Medio: teclado y lector de pantalla desde el diseño | Muy alto: es la demostración | USAR (una sola) |
| Testimonios en carrusel automático | Slider rotando | Común | Bajo | Alto: 2.2.2 y foco | Bajo | EVITAR (usar rejilla estática) |

### 4.3 Movimiento y scroll

| Tendencia | Qué es | Ejemplos | Costo rendimiento | Costo a11y | Encaje | Veredicto |
|---|---|---|---|---|---|---|
| Scroll-driven animations CSS (`view()`, `scroll()`) | Animación ligada al progreso de scroll sin JavaScript | [Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) | 0, puede ir fuera del hilo principal | Medio: apagar con reduced-motion y no esconder contenido | Muy alto: moderno, ligero y demostrable | USAR como mejora progresiva |
| View Transitions API | Transición animada entre vistas o páginas | Documentación en [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | 0 a bajo | Medio: respetar reduced-motion | Alto, pero cuidado con CLS y con el LCP de la página destino | PROBAR (cross-document opt-in, medir) |
| Smooth scroll con Lenis | Inercia en el scroll | [lenis.darkroom.engineering](https://lenis.darkroom.engineering), 5.4 KB gzip, MIT | Bajo en peso, pero retoca el scroll del hilo principal | Alto: altera el comportamiento nativo, afecta lupa y teclado | Contradictorio con "ligero y nativo" | EVITAR |
| GSAP ScrollTrigger | Timelines ligadas al scroll, pinning | [gsap.com](https://gsap.com), core 28.3 KB + ScrollTrigger 18.0 KB gzip; licencia propia "Standard no charge" ([términos](https://gsap.com/community/standard-license/)) | Medio: 46 KB gzip en JS en el hilo principal | Medio a alto | Bajo: se puede lograr lo mismo en CSS | EVITAR |
| Motion (antes Framer Motion) | Librería de animación para React | [motion.dev](https://motion.dev), 14.3.0, MIT; bundle UMD completo 51.6 KB gzip, las APIs mini son mucho menores | Medio | Medio | Bajo si basta CSS | EVITAR salvo para un caso concreto |
| Scroll-jacking y pinning largo | La página se "atasca" para contar una historia | Común en sitios premiados | Alto | Alto: rompe la navegación | Contradictorio | EVITAR |
| Parallax por capas | Fondo y primer plano a velocidades distintas | Común | Bajo con `view()`, alto con JS | Alto en vestibular | Bajo | EVITAR (usar movimiento mínimo, máximo 24 px) |

### 4.4 Cursor, luz e interacción

| Tendencia | Qué es | Ejemplos | Costo rendimiento | Costo a11y | Encaje | Veredicto |
|---|---|---|---|---|---|---|
| Spotlight (foco de luz bajo el cursor) | Gradiente radial que sigue al puntero dentro de tarjetas | No pude confirmar este efecto en v4.brittanychiang.com (visual no verificado). React Bits tiene SpotlightCard ya compilado en la galería | 0 a bajo: 2 variables CSS | Bajo: solo `hover: hover` y `pointer: fine` | Alto | USAR |
| Cursor personalizado de seguimiento | Punto o aro que persigue al ratón | Común en sitios creativos | Bajo a medio | Alto: no debe ocultar el nativo ni romper foco | Bajo | EVITAR |
| Hover con glare o borde orbitando | Brillo que cruza la tarjeta o punto de luz en el borde | React Bits: Glare Hover, Star Border (ver scout) | 0 con CSS | Bajo | Medio | USAR en 1 o 2 sitios (CTA principal) |
| Tilt 3D en tarjetas | Inclinación según el puntero | Común | Bajo | Medio: solo puntero fino | Bajo | EVITAR |
| Microinteracciones (botón, enlace, copiar) | Feedback de 120 a 200 ms | Patrón general | 0 | Bajo | Alto | USAR |
| Sonido | Clic o ambiente | Raro | Bajo en peso | Alto: nunca debe arrancar solo | Bajo | EVITAR |

### 4.5 Estilos visuales

| Estética | Qué es | Ejemplos | Riesgo | Veredicto |
|---|---|---|---|---|
| Dark mode con acento fósforo | Fondo tinta, acento verde o ámbar, texto claro | Línea ya adoptada en redesign-v3 | Contraste: comprobar cada par; ver `designs/redesign-v3/reports/contrast.json` | USAR (es la identidad ya decidida) |
| Retro-pixel, ASCII, CRT | Tramas, dithering, terminal | Ya instalados en la galería: ASCIIText, GradientASCII, CRTWarp, PixelBlast, Dither | Cada efecto GPU consume cupo; el estilo cansa si cubre todo | USAR con moderación: un solo shader por pantalla |
| Brutalismo | Bordes duros, tipografía cruda, color plano | Tendencia amplia en portfolios (fuentes de agencia) | Legibilidad si se exagera | PROBAR como base de la dirección 3 |
| Glassmorphism | Vidrio translúcido y desenfoque | React Bits Glass Surface, descartado en el scout | `backdrop-filter` cuesta en móvil; contraste bajo | EVITAR |
| Grano y ruido | Textura estática | React Bits Noise (2.3 KB gzip compilado) o SVG `feTurbulence` | Bajo si es estático | USAR |
| Tipografía enorme y variable | Titulares de 10 vw, fuentes variables que cambian con el scroll o el hover | [Guía 2026 de Line25](https://line25.com/articles/web-design-trends-2026/) lo cita junto con el movimiento sutil | Peso de fuente: usar una sola variable ya cargada | USAR |
| Texto cinético | Letras que se mueven o se reorganizan | Ya instalados: DecryptedText, ScrambledText, TextType | Parpadeo y lectura. Mantener el texto real en el DOM | USAR en 1 titular y 1 eyebrow |

### 4.6 3D ligero y Lottie

| Tendencia | Peso gzip medido | Veredicto |
|---|---|---|
| three.js 0.186.1 (build module minificado) | 89.9 KB | EVITAR |
| Rive (runtime canvas) | 124.9 KB | EVITAR |
| lottie-web (build light) | 46.5 KB | EVITAR |
| OGL 1.0.11 (UMD completo) | 53.6 KB | EVITAR en bruto. Los componentes React Bits ya portados solo usan lo que necesitan (ver sección 6) |
| Shader crudo propio en un canvas | 2 a 8 KB (rango medido en los ports de la galería) | PROBAR, un único slot |
| CSS 3D transform simple (una tarjeta) | 0 | PROBAR en un caso aislado |

## 5. Recetas de animación baratas (CSS primero)

Todas dejan el contenido visible si falla el CSS o el JS. Todas animan solo `transform` y `opacity` (no provocan CLS). Cada una sale con `@media (prefers-reduced-motion: no-preference)`.

### 5.1 Reveal al entrar con `view()` (0 JS)

```css
@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: rise linear both;
      animation-timeline: view();      /* después del shorthand */
      animation-range: entry 0% entry 60%;
    }
  }
}
```

Efecto: cada bloque sube y aparece cuando entra al viewport. Sin soporte (Firefox estable), el bloque se ve completo. Riesgo: no aplicar al elemento del LCP.

### 5.2 Barra de progreso de lectura (0 JS)

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    .progress { position: fixed; inset: 0 0 auto 0; height: 3px; transform-origin: 0 50%;
      background: var(--accent); animation: grow linear both; animation-timeline: scroll(root); }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  }
}
```

Riesgo: no tapar el foco (WCAG 2.4.11); mantener la barra de 3 px, `aria-hidden="true"`.

### 5.3 Spotlight bajo el cursor (JS de 6 líneas)

JS: un `pointermove` con `requestAnimationFrame` que escribe `--x` y `--y` en la tarjeta. CSS:

```css
.card { position: relative; overflow: clip; }
@media (hover: hover) and (pointer: fine) {
  .card::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0;
    background: radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgb(255 255 255 / .10), transparent 70%);
    transition: opacity .2s; }
  .card:hover::before, .card:focus-within::before { opacity: 1; }
}
```

Costo: casi nulo; no repinta layout. `:focus-within` da el equivalente por teclado.

### 5.4 Marquee infinito con pausa (0 a 1 línea de JS para el botón)

Duplicar el contenido, marcar la copia con `aria-hidden="true"`, animar `translateX(0)` a `translateX(-50%)` con `linear infinite`. Pausar con `animation-play-state: paused` al activar un botón de pausa (WCAG 2.2.2) y también en `:hover` y `:focus-within`. Con `prefers-reduced-motion: reduce`, mostrar las tecnologías en rejilla estática con `flex-wrap`.

### 5.5 Contador con `@property` (0 JS)

```css
@property --n { syntax: "<integer>"; inherits: false; initial-value: 0; }
.stat .num { counter-reset: n var(--n); animation: count 1.2s ease-out both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
.stat .num::after { content: counter(n); }
@keyframes count { to { --n: 87; } }
```

Accesibilidad: poner el valor final como texto visible para lectores (`<span class="sr-only">87</span>`) y marcar el contador animado como `aria-hidden` en un contenedor aparte, porque el contenido generado se lee de forma inconsistente. Soporte: `@property` es Baseline low desde 2024-07-09. Sin `view()`, el valor queda en 0 si no hay fallback: definir el valor final por defecto y animar solo dentro de `@supports`.

### 5.6 Titular con palabra rotatoria (0 JS)

Tres `<span>` apilados en una rejilla de una celda; animar `opacity` con `animation-delay` escalonado en un ciclo de 9 s. Solo el primero es visible para lectores y los otros llevan `aria-hidden`. Con reduced-motion se muestra una sola palabra fija. Ojo: más de 5 s requiere pausa (2.2.2); si el ciclo corre más de 5 s, ofrecer botón o detener tras dos vueltas con `animation-iteration-count: 2`.

### 5.7 Texto que se "escribe" sin JS

`steps()` sobre `width` con `ch` y `overflow: hidden` en un solo renglón. Mejor: `clip-path: inset(0 100% 0 0)` a `inset(0)` con `steps(24, end)`, para no tocar layout. Detener tras una pasada.

### 5.8 Borde orbitante para el CTA principal

`@property --a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }` y un `conic-gradient(from var(--a), transparent 70%, var(--accent))` en el borde con `mask` de contenido; animar `--a` de 0 a 360deg en 3 s con `linear infinite`. Pausar en reduced-motion y dejar un borde estático del color de acento.

### 5.9 Transición entre páginas (View Transitions, opt-in)

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
}
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .18s; }
```

Funciona en Chrome 126+ y Safari 18.2+. En el resto, navegación normal. Medir antes: una transición puede retrasar el primer pintado de la página destino.

### 5.10 Grano estático global

Una sola capa `position: fixed; inset: 0; pointer-events: none; opacity: .05` con una imagen de ruido tileable (SVG de `feTurbulence` en un data URI o PNG de menos de 4 KB). Sin animación. Verifica el contraste del texto pequeño con el grano encendido.

## 6. Librerías: pesos y veredicto

Medí cada archivo con `gzip -9` el 2026-10-16 desde jsDelivr. "Raw" es minificado sin comprimir.

| Librería | Versión y licencia | Raw | gzip | Veredicto |
|---|---|---|---|---|
| Lenis | 1.3.27, MIT | 18.7 KB | 5.4 KB | EVITAR (altera scroll nativo) |
| GSAP core | 3.15.0, licencia "Standard no charge" | 72.9 KB | 28.3 KB | EVITAR |
| GSAP ScrollTrigger | mismo paquete | 44.6 KB | 18.0 KB | EVITAR |
| Motion (bundle UMD completo) | 14.3.0, MIT | 154.4 KB | 51.6 KB | EVITAR (usar CSS) |
| framer-motion (build dev) | n/d | 805.2 KB | 184.2 KB | EVITAR (medición de build de desarrollo, no representa el peso de producción con tree shaking; lo muestro solo como advertencia) |
| OGL | 1.0.11, Unlicense | 280.8 KB | 53.6 KB | EVITAR en bruto |
| three.js | 0.186.1, MIT | 392.8 KB | 89.9 KB | EVITAR |
| lottie-web (light) | n/d | 168.4 KB | 46.5 KB | EVITAR |
| Rive (canvas) | n/d | 570.0 KB | 124.9 KB | EVITAR |
| Splitting (dividir texto en letras) | n/d | 3.9 KB | 1.8 KB | PROBAR solo si hace falta, mejor dividir en el servidor |

Conclusión: ninguna librería se justifica para el 90% de lo que Juan pide. Lo que se necesite en JavaScript es de 10 a 30 líneas propias.

## 7. Galería React Bits ya instalada: qué sirve para dinamismo

Pesos gzip medidos sobre los archivos compilados en `designs/redesign-v3/app/dist/assets/` (JS por componente; el CSS aparte es de unos cientos de bytes). El registro original de cada uno es de 10 a 35 KB sin comprimir (`reactbits.manifest.json`).

| Componente | JS gzip (dist) | Costo | Qué aporta | Veredicto para dinamismo |
|---|---|---|---|---|
| Noise | 2.3 KB | bajo | Grano global | USAR |
| SpotlightCard | 2.6 KB | bajo | Foco de luz al hover en tarjetas | USAR |
| PixelTransition | 3.2 KB | bajo | Tarjeta de caso que cambia de cover a detalle con cuadrados | USAR (con equivalente de foco) |
| StarBorder | 4.3 KB | bajo | Borde orbitante para el CTA | USAR en 1 botón (o receta 5.8) |
| PixelCard | 4.2 KB | bajo | Tarjeta con trama pixel al hover | PROBAR |
| GradientBlinds | 5.3 KB | GPU | Persianas con gradiente, alternativa a MicroSlats | PROBAR como único shader |
| ASCIIText | 5.3 KB | GPU | Titular ASCII | PROBAR en hero si el H1 real queda en el DOM |
| Grainient | 5.8 KB | GPU | Fondo con grano y degradado | PROBAR como fondo del hero (cupo 1) |
| Dither | 6.0 KB | GPU | Dithering real | PROBAR en una sola sección |
| MicroSlats | 6.6 KB | GPU | Franjas finas | Solapa con GradientBlinds. Elegir uno |
| PatternWaves | 7.0 KB | GPU | Ondas con patrón | PROBAR, el cupo manda |
| HalftoneReveal | 7.3 KB | GPU | Imagen que se revela con trama | PROBAR en el retrato de About |
| CRTWarp | 7.4 KB | GPU | Pantalla CRT curva | PROBAR en contacto |
| FaultyTerminal | 7.7 KB | GPU | Terminal averiada | PROBAR en contacto o 404 (parpadeo bajo control) |
| GradientASCII | 7.7 KB | GPU | Gradiente ASCII | PROBAR |
| PixelBlast | 8.0 KB | GPU | Pixeles reactivos | EVITAR en la home (el más pesado y continuo) |

Bundle principal de la app de mockups: `index-*.js` mide 79.6 KB gzip, incluye React. No es el número de la home real de producción, que va en Next.js.

Los seis que sirven sin romper presupuesto: **Noise, SpotlightCard, PixelTransition, StarBorder, PixelCard y un único shader** (Grainient o GradientBlinds). Para los demás, la regla de dos efectos por página decide.

## 8. Tres direcciones creativas para la home

Las tres reutilizan el copy y las 11 secciones que ya existen en `designs/redesign-v3/app/src/home/sections/` (clientes, errores reales, casos, websites, servicios, auditor, about, testimonio, oferta, FAQ, contacto), y el brief de la home (auditoría de 600 USD acreditables, bloque central con fixes del repo público). Cambian el ritmo, la jerarquía y el tipo de movimiento.

### Dirección A: "Banco de pruebas"

- **Idea:** la home es una auditoría que se ejecuta mientras lees. El visitante ve la propuesta de Juan en acción: métricas que se llenan, un antes y después, un semáforo de CWV.
- **Secciones:**
  1. Hero: H1 enorme estático (palabra clave rotatoria de 3 valores) y a la derecha un panel con tres métricas reales (LCP, CLS, INP) que cuentan hasta su valor.
  2. Franja de clientes en marquee con botón de pausa.
  3. Errores reales: lista de hallazgos que aparecen uno a uno con `view()`.
  4. Casos: tarjetas con antes y después, `PixelTransition` en hover y foco.
  5. Auditor: mini demo interactiva (comparador deslizante de peso de página).
  6. Servicios, oferta, FAQ y contacto con el CTA de borde orbitante.
- **Animaciones clave:** contadores con `@property`, reveals con `view()`, barra de progreso, marquee, comparador con `<input type="range">` nativo, grano estático.
- **Peso estimado:** 0 KB de librerías, un shader opcional (Grainient 5.8 KB gzip) solo en el hero.
- **Riesgos:** sin soporte de `view()` en Firefox estable el efecto se pierde (el contenido sigue completo). El comparador requiere trabajo de teclado. Riesgo de que sea "demasiado dashboard" si faltan datos reales: cada cifra debe salir de una medición verificable.
- **Encaje con el consultor:** el más alto. La página prueba lo que vende.

### Dirección B: "Sala de control"

- **Idea:** la home es un bento de instrumentos. Cada tarjeta muestra un servicio, un caso o una prueba, con vida propia (spotlight, sparkline, estado).
- **Secciones:**
  1. Hero compacto con titular y un bento de 6 celdas (3 por 2): foco, métrica, caso destacado, stack, ubicación y disponibilidad.
  2. Bento de servicios (4 a 6 celdas con tamaños distintos).
  3. Carrusel manual (scroll snap, sin autoplay) de casos.
  4. Banda de tecnologías en marquee.
  5. About, testimonio en rejilla estática, oferta, FAQ y contacto.
- **Animaciones clave:** `SpotlightCard` en todas las celdas, sparklines SVG cuyo trazo se dibuja con `stroke-dashoffset` y `view()` (sin JS), contadores, hover con glare, `Noise`.
- **Peso estimado:** 2.6 KB (SpotlightCard) más CSS propio. Sin shaders obligatorios; opcional Dither en la sección de contacto.
- **Riesgos:** el bento denso puede saturar en móvil, hay que colapsar a una columna con orden claro. Demasiados puntos de interés dispersan el mensaje. Muchas tarjetas con `backdrop-filter` costarían en móvil, así que no se usa.
- **Encaje:** alto. Es la estética que ya reconocen los clientes de producto técnico.

### Dirección C: "Manual editorial"

- **Idea:** brutalismo cálido y tipografía gigante. Juan habla como un experto que enseña: cada sección abre con una frase enorme y una prueba pequeña debajo. El scroll narra una auditoría paso a paso.
- **Secciones:**
  1. Hero tipográfico: una frase de 10 vw, subrayado animado y grano. Sin imagen.
  2. Capítulos numerados (01 a 05) con barra lateral que se llena según el scroll (`scroll()`).
  3. Cada capítulo: frase, evidencia (captura o métrica) y enlace.
  4. Timeline vertical de experiencia con línea que se dibuja.
  5. Oferta con precio visible, FAQ, contacto con un único shader (`FaultyTerminal` o `Dither`).
- **Animaciones clave:** palabra enfatizada con subrayado que se dibuja (`clip-path`), numeración que cambia con `view()`, línea de timeline con `scaleY`, View Transitions entre páginas.
- **Peso estimado:** 0 KB de librerías; 1 shader opcional en contacto (6 a 8 KB gzip).
- **Riesgos:** la tipografía enorme necesita una fuente variable ya cargada y `font-display` bien configurado, o aparece CLS; hay que medir. Es la dirección con menos "efectos" y más voz: depende de que el copy sea muy bueno. Menos sensación de "vivo" a primera vista si el visitante busca efectos.
- **Encaje:** alto en credibilidad editorial, medio en sensación de movimiento.

### Cómo comparan

| Criterio | A Banco de pruebas | B Sala de control | C Manual editorial |
|---|---|---|---|
| Sensación de vida | Alta, con datos | Alta, con tarjetas | Media, con tipografía |
| Esfuerzo de construcción | Medio (demo interactiva) | Medio (bento) | Bajo |
| Riesgo de rendimiento | Bajo | Bajo | Bajo |
| Riesgo de a11y | Medio (comparador) | Bajo | Bajo |
| Diferenciación | Muy alta | Media | Alta |
| Reutiliza lo que ya hay | Sí | Sí | En parte |

Mi recomendación: **A**, con la piel bento de **B** en la sección de servicios. Es la que convierte la propuesta de valor en la propia experiencia de la página.

## 9. Presupuesto sugerido para cualquiera de las tres

- Cero librerías de animación en el bundle de la home.
- Máximo 1 shader, ubicado fuera del hero si el LCP lo exige, con `IntersectionObserver` para montarlo, pausa fuera del viewport y póster estático.
- JavaScript propio total para efectos: menos de 3 KB gzip.
- Todo reveal con `@supports` y `prefers-reduced-motion`, y el elemento del LCP sin animación de entrada.
- Verificar con PSI móvil real después del despliegue, nunca solo en local.

## 10. Fuentes

- [Scroll-driven animations en web-features](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/scroll-driven-animations.yml.dist)
- [Chrome for Developers: Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [caniuse: view-transitions](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/view-transitions.json) y [cross-document](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/cross-document-view-transitions.json)
- [web-features: registered-custom-properties](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/registered-custom-properties.yml.dist), [starting-style](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/starting-style.yml.dist), [text-wrap-balance](https://raw.githubusercontent.com/web-platform-dx/web-features/main/features/text-wrap-balance.yml.dist)
- [WCAG 2.2: pausar, detener, ocultar](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [tres destellos](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [animación por interacciones](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [tamaño de objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Line25: Web Design Trends 2026](https://line25.com/articles/web-design-trends-2026/) y [StudioMeyer: tendencias 2026](https://studiomeyer.io/en/blog/webdesign-trends-2026) (fuentes de agencia, usadas solo para nombrar tendencias, no para cifras)
- Repos de referencia: [bchiang7/v4](https://github.com/bchiang7/v4) (Gatsby, animejs, scrollreveal, styled-components), [pm25/showlit](https://github.com/pm25/showlit) (React 19, Tailwind 4, react-router; sitio en [pm25.github.io/showlit](https://pm25.github.io/showlit/)), [craftzdog/craftzdog-homepage](https://github.com/craftzdog/craftzdog-homepage)
- Registro y scout internos: `.planning/phases/51-sistema-visual/51-REACTBITS-SCOUT.md`, `designs/redesign-v3/app/reactbits.manifest.json`, `designs/redesign-v3/app/dist/assets/`

## 11. Pendientes que no pude verificar

- El aspecto visual de v4.brittanychiang.com, craftz.dog y showlit (los tres respondieron HTTP 200, pero renderizan con JavaScript y mi lector solo vio el HTML inicial).
- La landing de Lovable que mencionas: la búsqueda no devolvió ninguna con ese nombre. Necesito la URL.
- Estado exacto de Firefox para scroll-driven animations en la versión estable de hoy: web-features lo marca sin soporte; un artículo de terceros dice que sigue tras un flag. Confirma en caniuse o MDN antes de comprometer una animación crítica.
- Rendimiento real de las recetas en un Moto G de gama baja: hay que medirlo en prototipo.
