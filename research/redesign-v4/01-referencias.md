# Rediseño v4: análisis de las 4 referencias

Fecha del análisis: 2026-10-16. Método: Playwright (Chromium) en 1440x900 y 390x844, scroll por pasos, capturas con 3 a 7 segundos de diferencia, diff de píxeles entre capturas, y lectura del HTML y de los bundles JS/CSS descargados con curl. Las capturas están en `research/redesign-v4/refs/`.

Pesos de JS: gzip o brotli, es decir, lo que viaja por la red. Entre paréntesis va el peso sin comprimir.

## Resumen en una tabla

| Sitio | Stack real | JS (comprimido) | Qué mueve | Sensación |
|---|---|---|---|---|
| Lovable "Loudio" | Vite + React + Framer Motion + Tailwind | ~272 KB (953 KB) | Entrada escalonada del hero, forma de onda en bucle, texto circular girando, estrellas que aparecen, rotación ligada al scroll, reveals por sección, acordeón | Viva y juguetona, con identidad fuerte |
| Brittany Chiang v4 | Gatsby + React + styled-components + anime.js + ScrollReveal | ~120 KB propios (+ gtag 40 KB) | Loader con logo que se dibuja, fade-up escalonado, reveals con 100 ms de escalón, hover que cambia color de imágenes, nav que se oculta al bajar | Pulida y sobria, el movimiento es sutil |
| craftz.dog | Next.js (pages) + Chakra UI + Framer Motion + Three.js | ~210 KB base + ~140 KB Three + ~148 KB Draco (gzip) + 144 KB modelo | Perrito voxel 3D que da una vuelta de intro y luego rota solo, transición de página, fade-up de secciones, modo claro y oscuro | Viva por un solo objeto 3D, el resto es muy quieto |
| Showlit | Vite + React + shadcn/ui + Tailwind 4 + React Router | ~127 KB (406 KB) | Casi nada: sidebar colapsable, tooltips, filtros de skills, reproductor de Spotify embebido | Ordenada pero estática |

Hallazgo central: lo que Juan percibe como "vivo" en la referencia de Lovable NO viene de efectos exóticos. Viene de (1) una entrada escalonada en el hero, (2) un elemento hero que nunca se detiene (ondas y texto circular), (3) un lenguaje visual con identidad (neobrutalismo, sombras duras, rejilla) y (4) reveals consistentes. Todo se hace con Framer Motion y CSS normal.

---

## 1. Lovable "Loudio" (voice-post-scheduler-69feb5c5.lovable.app)

Es una plantilla de Lovable (SPA, sin SSR). El HTML es un shell de 12 KB con `<div id="root">`; todo el contenido sale de un solo bundle `index-DLF4Q2Ci.js`.

### Secciones en orden

| # | Sección | Qué muestra | Animación | Técnica |
|---|---|---|---|---|
| 0 | Header sticky | Logo wordmark, 4 anclas, Log In (contorno) y Sign Up (negro) con botones píldora. Menú móvil con panel que baja. | Línea inferior aparece al hacer scroll (`scrollY>0`). Panel móvil: `opacity 0, y -20` a visible, 0.3 s, links con delay 0.1 a 0.25. | `motion.div` con `AnimatePresence`, estado por scroll |
| 1 | Hero | Etiqueta mono "AUDIO-FIRST POSTING WORKSPACE", titular "RECORD IT. POST IT." gigante en peso negro, párrafo, CTA naranja con sombra dura, prueba social (3 avatares). A la derecha, composición: píldora rosa con micrófono y forma de onda, sobre una rejilla de cuadrados con estrellas de 4 puntas y un texto circular. | Entrada en cascada: etiqueta (delay 0.1), línea 1 (0.2), línea 2 (0.3), párrafo (0.4), CTA (0.5), cada una `opacity 0, y 20` a visible en 0.6 s. Los cuadrados de la rejilla entran con `delay = índice x 0.05`. Las estrellas hacen `scale 0 a 1` (0.6 s, delays 0.7 y 1). La forma de onda son 11 barras que cambian de altura en bucle (1.2 s, `easeInOut`, delay `i x 0.08`, `repeatType: reverse`). El texto "AUDIO • TRANSFORM • PUBLISH" gira 360 grados cada 20 s lineal sobre un `textPath` SVG. | Framer Motion (`initial/animate/transition`), SVG `textPath`, CSS |
| 2 | Banda de logos | Marcas (Riverside, descript, Alitu, castos, Spotify, zencastr) en una tira con borde | Ninguna visible | HTML estático con bordes |
| 3 | "Total Transformation" (#features) | Rejilla de 4 tarjetas con borde fino, esquinas redondeadas alternas, iconos en círculos de color | `whileInView` con `opacity 0, y 20` a visible, `once: true`, delays 0, 0.1, 0.2, 0.3 | Framer Motion `whileInView` |
| 4 | "Capture ideas in the wild" (#how-it-works) | Texto a la izquierda y 3 tarjetas apiladas a la derecha (blanca, amarilla, blanca) con esquinas redondeadas que se "encajan" | Tarjetas entran desde la derecha (`x 20`), delays 0, 0.1, 0.2 | `whileInView` |
| 5 | Stats | 4 cifras grandes en cuadrícula (50MB, 280, 1-click, 0) | Sin animación de conteo, aunque el patrón la permitiría | Estático |
| 6 | Testimonios | Dos citas gigantes en mayúsculas sobre fondo verde menta y blanco, con rejilla escalonada detrás y dos "relojes" negros | Los círculos negros y las estrellas rotan de 0 a 360 grados según el scroll (`useScroll` con `offset ["start end","end start"]` más `useTransform`) | Framer Motion `useScroll` |
| 7 | Pricing (#pricing) | Dos planes: Free (blanco) y Pro (rosa, "TBD") con rejilla decorativa a los lados y estrella central | `whileInView` en las tarjetas | Framer Motion |
| 8 | FAQ (#faq) | Acordeón de 6 preguntas con borde y sombra negra, chevron | Apertura con `accordion-down/up` 0.2 s `ease-out`, chevron que rota | Keyframes de Radix en CSS |
| 9 | CTA final | Bloque naranja a ancho completo con rejilla en los bordes y botón negro | `whileInView` en título y botón | Framer Motion |
| 10 | Footer | Fondo negro, mini sello circular giratorio con estrella, links, wordmark "LOUDIO" gigante que ocupa todo el ancho, estado "All systems operational" | Texto circular gira 20 s en bucle, estrella aparece con fade | Framer Motion + SVG `textPath` |

### Evidencia de movimiento medida
- Entre dos capturas separadas 3.5 s, cambió el 0.10 % de los píxeles, todos en la zona de la composición del hero (x 1008 a 1299, y 345 a 677): barras de la onda y texto circular. El resto de la página está quieto hasta que se hace scroll.
- Sin `getAnimations()` activas en reposo porque Framer Motion anima por JS (`requestAnimationFrame`), no por CSS.

### Qué lo hace sentir vivo
1. El hero entra en cascada con 6 pasos de 0.1 s. Se percibe "armado a mano".
2. Un elemento hero nunca descansa (ondas, texto orbitando). El ojo siempre tiene algo en el que posarse.
3. Identidad gráfica fuerte: tipografía negra ultra pesada (Google Sans Flex, 900), sombras duras sin blur desplazadas 8 a 16 px, bordes de 1 px negros, rejilla de módulos de 64 px, estrellas de 4 puntas. Todo mantiene el mismo vocabulario.
4. Color plano y saturado por bloque (naranja, rosa, amarillo, menta) que rompe el blanco.
5. Reveals siempre iguales (`y 20`, `once`), de modo que el movimiento es predecible y elegante.
6. Rotación ligada al scroll en los testimonios: el scroll "mueve" cosas.

### Copiable y no copiable
- Copiable tal cual: cascada del hero, `whileInView` con `once`, onda animada (barras SVG o `div` con `scaleY`), texto circular con `textPath` girando, rotación por scroll, acordeón.
- Adaptable: sombra dura en botones y tarjetas (sirve como firma de marca si Juan elige este camino).
- No copiar: la paleta y la composición exacta (es de una marca real, Loudio/Lovable), el wordmark gigante del footer tal cual, el bundle completo (953 KB sin comprimir, incluye Supabase y Radix que no hacen falta). Las dos imágenes PNG de avatares pesan 2.4 MB, un error de rendimiento que no se debe repetir.

### Tipografía, paleta, grid, espaciado
- Fuentes: Google Sans Flex (display, 900), Inter (cuerpo), `ui-monospace` para etiquetas.
- Paleta: blanco, negro, naranja `#ff6600` aprox., rosa pastel, amarillo `#ffe730`, menta `#49ffcb`.
- Grid: contenedor de 1152 px centrado, módulo de 64 px para la decoración. Secciones con `py-16` a `py-32`.
- Peso: JS 272 KB gzip (953 KB), CSS 14.6 KB gzip, imágenes 2.5 MB, fuentes 165 KB.

---

## 2. Brittany Chiang v4 (v4.brittanychiang.com)

Sitio Gatsby (SSG con hidratación). Un solo documento con 5 secciones y navegación por anclas.

### Secciones en orden

| # | Sección | Qué muestra | Animación | Técnica |
|---|---|---|---|---|
| 0 | Loader | Hexágono con "B" sobre fondo azul marino | Se dibuja el trazo del hexágono (1.5 s, `easeInOutQuart`, `strokeDashoffset`), aparece la B (0.7 s), el logo se encoge y desaparece. Bloquea el scroll hasta terminar (el documento mide 900 px durante la carga y 5830 px después). | anime.js timeline (`strokeDashoffset: [setDashoffset, 0]`) |
| 1 | Nav fija | Logo hexagonal, 4 links numerados en mono verde, botón Resume con contorno | Se oculta al bajar y reaparece al subir (`scrollDirection`), baja de altura y gana sombra al salir del tope | Hook de scroll + styled-components |
| 2 | Hero | "Hi, my name is" (mono verde), nombre en azul claro, frase en gris pizarra, párrafo, botón contorno. Rail izquierdo con iconos sociales y rail derecho con correo vertical, ambos con línea vertical | Fade-up escalonado de 5 elementos: `transition-delay` de 100 ms, 200 ms, 300 ms, etc. | `react-transition-group` (`fadeup-enter`, 0.01 a 1 de opacidad, `translateY(20px)` a 0) |
| 3 | 01 About | Texto, lista de tecnologías con viñeta triangular, foto con filtro verde y marco desplazado | Reveal al entrar. Hover: la foto pierde el filtro y el marco se desplaza (`translate(-5px,-5px)` y `translate(8px,8px)`) | ScrollReveal + CSS (`mix-blend-mode: multiply`, `filter: grayscale(100%) contrast(1)`) |
| 4 | 02 Where I've Worked | Pestañas verticales (Upstatement, Apple, Scout...) y panel con cargo y viñetas | Barra indicadora que se desliza a la pestaña activa, cambio de panel con fade | CSS transitions + `translateY` del highlight |
| 5 | 03 Some Things I've Built | 3 proyectos destacados alternando izquierda y derecha, con captura teñida en verde y tarjeta de texto que se solapa sobre la imagen | Reveal por proyecto. Hover: la imagen recupera su color real (de tinte verde a color), la tarjeta de texto queda por encima | ScrollReveal + `mix-blend-mode`, `filter` |
| 6 | Other Noteworthy Projects | Rejilla de tarjetas con icono de carpeta y tags | Reveal con escalón de 100 ms entre tarjetas. Hover: la tarjeta sube `translateY(-7px)`. Botón "Show More" que revela más con fade-up escalonado (`300 ms x índice`) | ScrollReveal + `TransitionGroup` |
| 7 | 04 Get In Touch | Titular, texto y botón "Say Hello" | Reveal | ScrollReveal |
| 8 | Footer | "Designed & Built by" con estrellas y forks desde la API de GitHub | Ninguna | Dato en vivo |

Configuración de ScrollReveal hallada en el bundle: `origin: bottom`, `distance: 20px`, `duration: 500`, `delay` base 200 ms, `easing: cubic-bezier(0.645, 0.045, 0.355, 1)`, `viewFactor: 0.25`, `reset: false`, `mobile: true`. Todo respeta `prefers-reduced-motion`.

### Evidencia de movimiento medida
- Entre capturas 3.5 s después de terminar la carga: 0.00 % de píxeles distintos. La página está quieta en reposo, y aun así se percibe cuidada.
- Mucho del carácter viene del loader de entrada (≈ 3 s) y de que cada sección aparece una sola vez al llegar.

### Qué lo hace sentir vivo
1. Una entrada con sentido de marca (logo que se dibuja) crea expectativa antes del contenido.
2. Reveals sutiles pero constantes: 20 px, 500 ms, un solo easing en todo el sitio.
3. Microinteracciones en hover que cambian algo real (color de imagen, desplazamiento de marco, elevación de tarjeta).
4. Nav inteligente que respira con el scroll.
5. Rails laterales fijos (sociales y correo vertical) que hacen que la página "tenga marco".
6. Mono verde menta sobre azul marino: contraste de color con un único acento.

### Copiable y no copiable
- Copiable: ScrollReveal con esos parámetros (se replica con `IntersectionObserver` y 6 líneas de CSS), nav que se oculta al bajar, tab vertical con indicador deslizante, hover de imagen teñida, `Show More` escalonado, rails laterales.
- No copiar: la identidad visual completa (paleta navy y menta, hexágono, tipografía Calibre y SF Mono) porque es muy reconocible y pertenece a ella. El loader es opcional y puede perjudicar LCP, SEO y percepción de velocidad en un sitio cuyo valor central es el rendimiento. Para Juan es una mala idea bloquear el scroll durante 3 segundos.

### Tipografía, paleta, grid, espaciado
- Fuentes: Calibre (400, 500, 600) y SF Mono (400, 600), autoalojadas en woff2.
- Paleta: `#020c1b`, `#0a192f`, `#112240`, `#233554` (fondos), `#495670`, `#8892b0` (texto), verde menta `#64ffda` como único acento.
- Tipografía fluida con `clamp(40px, 8vw, 80px)` en el titular.
- Contenedor angosto (≈ 1000 px) con secciones de 100 a 150 px de padding vertical, título de sección numerado con línea horizontal.
- Peso: app 23 KB, vendor 52 KB, framework React 42 KB, runtime 2 KB, más Google Tag Manager 40 KB. Total propio ≈ 120 KB gzip. Fuentes 144 KB. Imágenes 100 KB.

---

## 3. craftz.dog (Takuya Matsuyama)

Next.js (Pages Router) con Chakra UI y Framer Motion. Página muy corta (1788 px) en una columna angosta de unos 800 px.

### Secciones en orden

| # | Sección | Qué muestra | Animación | Técnica |
|---|---|---|---|---|
| 0 | Nav | Logo con huella, Works, Wallpapers, Posts, Uses, Source (GitHub), botón de tema | Barra translúcida con blur. Botón sol/luna con cambio animado. En móvil, menú hamburguesa. | Chakra UI `useColorMode` |
| 1 | Hero 3D | Escritorio voxel con un perrito sobre mesa, fondo transparente | Al cargar, la cámara da una vuelta de intro con curva `easeOutCirc` durante 100 frames, luego `OrbitControls.autoRotate` gira la escena sin parar. Mientras el modelo carga, aparece un spinner. Medido: 1.82 % de píxeles cambian entre capturas (zona del 3D, x 606 a 888, y 122 a 357). | Three.js (renderer WebGL, cámara ortográfica, `GLTFLoader` + `DRACOLoader`, `dog.glb` de 144 KB), canvas con `requestAnimationFrame` |
| 2 | Presentación | Burbuja "Hello, I'm an indie app developer based in Japan!", nombre, rol, avatar redondo | `Section` con `initial {y:10, opacity:0}` a `animate {y:0, opacity:1}`, 0.8 s, `delay` creciente por bloque | Framer Motion (`motion.div` envuelto con Chakra) |
| 3 | Work | Párrafo justificado, botón "My portfolio" | Misma cascada | Framer Motion |
| 4 | Bio | Línea de tiempo con años en negrita | Misma cascada | Framer Motion |
| 5 | I love / On the web | Lista de intereses y enlaces sociales con icono | Misma cascada | Framer Motion |
| 6 | Tarjetas de producto | Miniaturas de YouTube e Inkdrop, esquinas de 12 px | Hover con elevación | Chakra + `next/image` con placeholder blur |
| 7 | Newsletter y footer | CTA y copyright | Cascada | Framer Motion |
| Páginas | `/works`, `/posts`, etc. | Rejilla de miniaturas | Transición de página: `opacity 0, y 20` a visible en 0.4 s, con salida inversa | `AnimatePresence` en `_app` |

### Qué lo hace sentir vivo
1. Un único objeto 3D, pequeño y simpático, que gira siempre. Es el ancla emocional de toda la página.
2. Cascada de fade-up (10 px, 0.8 s) con retardos que hacen que el contenido "se arme" al cargar.
3. Transiciones entre páginas suaves (no hay recarga visual brusca).
4. Modo claro y oscuro con paletas cálidas bien diferenciadas (oscuro `#202023`, claro crema).
5. Tono cercano: burbuja de saludo, avatar, emojis y color rosa en palabras clave.

### Copiable y no copiable
- Copiable: la idea de UN objeto hero que se mueve siempre (puede ser un SVG animado o un canvas 2D en vez de 3D), la cascada de fade-up, transición de página, modo claro y oscuro.
- Cuidado: Three.js más Draco suman unos 290 KB comprimidos y 144 KB de modelo. Para un sitio cuyo argumento es el rendimiento, hay que cargarlo diferido (después del LCP, con `dynamic import`) o sustituirlo por una alternativa liviana. El modelo voxel es una obra suya, no se debe copiar ni imitar de cerca.
- No copiar: el perrito, el voxel art ni la composición (es de Takuya).

### Tipografía, paleta, grid
- Fuente: M PLUS Rounded 1c (300 y 700), redondeada, que aporta calidez. Sistema para cuerpo.
- Paleta oscura: fondo `rgb(32,32,35)`, texto blanco 92 %, acento turquesa `#81e6d9` y rosa.
- Grid: una sola columna de ≈ 800 px, secciones con `mb: 6`, títulos subrayados con trazo de color.
- Peso: ver tabla resumen. Fuentes 35 KB. Imágenes 200 KB.

---

## 4. Showlit (pm25.github.io/showlit)

Plantilla de portafolio académico (Vite, React Router con rutas `/`, `/projects`, `/publications`, `/articles`, `/movies`, `/music`). Los datos de proyectos vienen de la API de GitHub.

### Secciones en orden (home)

| # | Sección | Qué muestra | Animación | Técnica |
|---|---|---|---|---|
| 0 | Sidebar | Riel de iconos con colapso, modo claro y oscuro abajo | Ancho animado 200 ms lineal; en móvil panel deslizante (`slide-in-from-left`, 500 ms) | shadcn/ui `Sidebar` y `Sheet` (Radix) |
| 1 | About Me | Foto, nombre, afiliación, correo, iconos y texto | Aparece tras un texto "Loading..." de unos 500 ms (carga diferida) | Suspense |
| 2 | Education y Work Experiences | Dos tarjetas con logos | Ninguna | Estático |
| 3 | Publications | Tabla ligera con "View all" | Ninguna | Estático |
| 4 | Projects | Rejilla de 6 tarjetas con captura, descripción, tags, estrellas y enlaces | Carga con `IntersectionObserver` (umbral 0.5) para renderizar al entrar en pantalla | Lazy render |
| 5 | Skills | Filtros por categoría y tarjetas con icono | Cambio de filtro instantáneo | Estado React |
| 6 | Presentations y Professional Services | Listas por categoría con fecha | Ninguna | Estático |
| Rutas | `/music` | Reproductor de Spotify embebido con lista de pistas | Interacción propia del iframe | iframe |
| Rutas | `/movies` | Pósters en tarjetas | Hover de elevación | CSS |

### Evidencia de movimiento medida
- 0.00 % de píxeles distintos entre capturas: no hay nada en movimiento en reposo.
- No hay Framer Motion, GSAP, Lenis ni canvas. Solo las animaciones `enter/exit` de Radix y transiciones de 200 ms.

### Qué lo hace sentir vivo (poco)
1. Interactividad funcional más que visual: filtros, ordenar por, sidebar plegable, tema claro y oscuro.
2. Contenido que cambia solo (estrellas de GitHub en tiempo real, reproductor de música).
3. Tarjetas densas con tags, que dan sensación de actividad.

### Copiable y no copiable
- Copiable: filtro de skills por categoría, tarjetas de proyecto con datos vivos (estrellas, último commit), sección con reproductor o contenido embebido.
- No copiar: la estructura de sidebar lateral (es de panel de control, no de marketing), el estilo de plantilla genérico de shadcn.
- Conclusión honesta: es la referencia más estática de las cuatro. Si a Juan le gusta, probablemente le gusta el orden y la claridad, no el movimiento.

### Tipografía, paleta, grid
- Fuente del sistema (`ui-sans-serif`), sin fuentes web. Paleta shadcn en OKLCH, fondo `oklch(12.9% .042 264.7)` casi negro azulado.
- Grid: contenedor de 3 columnas para proyectos, 2 para educación y trabajo.
- Peso: JS 127 KB gzip (406 KB), CSS 12.7 KB gzip, imágenes 662 KB (una ilustración de 396 KB).

---

## Síntesis

### Los 10 patrones de dinamismo más repetidos

| # | Patrón | Dónde aparece | Costo | Encaja con un consultor técnico |
|---|---|---|---|---|
| 1 | Reveal al entrar en viewport (fade y subida de 10 a 20 px, una sola vez) | Lovable, Brittany, craftz.dog (3 de 4) | Muy bajo: `IntersectionObserver` y CSS, 0 KB de librería | Sí. Es la base de todo. Mantener 500 a 800 ms y un solo easing. |
| 2 | Cascada escalonada en el hero (retardos de 0.1 s por elemento) | Lovable, Brittany, craftz.dog (3 de 4) | Bajo, CSS `animation-delay` | Sí. Es lo que más rápido se nota. |
| 3 | Un elemento hero que nunca se detiene (ondas, texto circular, objeto 3D) | Lovable, craftz.dog | Bajo (SVG/CSS) a alto (WebGL) | Sí, en versión liviana: diagrama de auditoría animado, o un trazo SVG que se "escanea". |
| 4 | Microinteracción en hover con cambio real (color, elevación, desplazamiento de marco, sombra dura que se hunde) | Lovable, Brittany, craftz.dog | Muy bajo, solo CSS | Sí. |
| 5 | Identidad gráfica coherente (un vocabulario: sombras duras, bordes, rejilla, mono, acento único) | Lovable, Brittany | Diseño, no código | Sí, es el factor que más separa "vivo" de "plantilla". Hay que elegir una sola. |
| 6 | Tipografía como protagonista (titular enorme y pesado, o mono con numeración) | Lovable, Brittany | Bajo | Sí. Combina bien con la voz de experto que enseña. |
| 7 | Nav que reacciona al scroll (se oculta al bajar, borde al salir del tope) | Lovable, Brittany | Bajo | Sí. |
| 8 | Animación atada al scroll (rotación o progreso según posición) | Lovable (testimonios), Brittany (smooth scroll) | Medio (`animation-timeline: scroll()` en CSS o Framer Motion) | Sí, con moderación: barra de progreso de lectura, una cifra o diagrama que se completa al bajar. |
| 9 | Transición entre páginas y modo claro y oscuro | craftz.dog, Showlit | Medio | Parcial. El modo oscuro sí; la transición solo si no daña la navegación ni el SEO. |
| 10 | Datos o contenido vivos (estrellas de GitHub, estado "All systems operational", reproductor) | Brittany, Showlit, Lovable (footer) | Bajo a medio | Sí y es muy relevante: métricas reales (Core Web Vitals del propio sitio, fecha del último fix, puntaje Lighthouse) prueban la pericia en vez de decirla. |

Menciones menores: loader de entrada (solo Brittany, no recomendado por rendimiento), 3D (solo craftz.dog, caro), acordeón con animación (Lovable), filtros interactivos (Showlit).

### Qué encaja con un consultor técnico y SEO

El valor central del sitio de Juan es demostrar rendimiento y SEO impecables. Eso marca los límites:

- Sí: 1, 2, 3 (versión SVG), 4, 5, 6, 7, 8 (con CSS nativo), 10. Todos se hacen con CSS y `IntersectionObserver`, sin dependencias, o con Framer Motion cargado de forma acotada (por referencia, Lovable carga 272 KB, de los cuales la parte de animación pesa unos 35 KB).
- Con reservas: 9 (transiciones de página) y cualquier WebGL. Solo si se carga diferido y no toca LCP.
- No: loader bloqueante (Brittany), bundles de más de 250 KB, imágenes PNG de 1 a 2 MB (Lovable) y animaciones que dependan de JS para que el contenido sea visible (en Lovable y Showlit el HTML inicial está vacío; para SEO esto es un anti-ejemplo y el sitio de Juan debe seguir renderizando en servidor).

### Receta mínima para que se sienta vivo (en orden de impacto por costo)
1. Hero en cascada de 5 pasos (etiqueta, titular línea 1, línea 2, párrafo, CTA), 0.6 s y 0.1 s entre pasos.
2. Un elemento hero perpetuo en SVG (por ejemplo, una "auditoría" que va marcando checks, o ondas de pulso sobre un diagrama), 0 KB de librería.
3. Una firma visual única (por ejemplo sombra dura en botones y tarjetas, o mono con numeración) aplicada a todo el sitio.
4. Reveals `once` en cada sección, con escalón de 100 ms entre tarjetas.
5. Hover que cambia algo real en tarjetas, imágenes y botones.
6. Nav que se oculta al bajar y barra de progreso en los artículos.
7. Bloque de datos vivos en el home (Core Web Vitals reales, fecha del último fix, repo público).
8. Respetar `prefers-reduced-motion` en todo (la mayoría de las referencias lo hace, y además cumple A11Y.md).

### Peso de JS, resumen

| Sitio | JS comprimido aprox. | Nota |
|---|---|---|
| Lovable | 272 KB | Incluye Supabase, Radix, router; animación pesa poco |
| Brittany | ≈ 120 KB (+ 40 KB de gtag) | El más eficiente en proporción |
| craftz.dog | ≈ 210 KB + 140 KB Three + 148 KB Draco | Sin el 3D son unos 210 KB |
| Showlit | 127 KB | Casi sin animación |

Presupuesto sugerido para el rediseño: menos de 30 KB de JS adicional para animación (o 0 KB con CSS y `IntersectionObserver`), y cualquier librería extra cargada tras la interacción.

### Notas de método y limitaciones
- Las capturas son de estados de carga y scroll, no de video. La rotación del texto circular de Lovable y la onda se verificaron por diff de píxeles y por lectura del código fuente.
- La URL de Lovable con `#pricing` se analizó también sin el ancla para ver la página completa. El header del sitio es sticky.
- No se instaló nada en el proyecto. Playwright se resolvió desde `node_modules` del repositorio y los bundles descargados quedaron en el directorio temporal de la sesión.
