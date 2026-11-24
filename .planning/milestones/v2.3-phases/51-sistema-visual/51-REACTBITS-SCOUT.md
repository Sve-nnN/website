# Fase 51: Scout del catálogo completo de React Bits

**Fecha:** 2026-10-15
**Alcance:** solo lectura. Complementa 51-RESEARCH.md. No se toca src/, package.json ni Payload.

## Método y nivel de confianza

- **Catálogo verificado:** https://reactbits.dev/llms.txt (descargado hoy). Total 187 componentes: 33 Text Animations, 38 Animations, 47 Components, 69 Backgrounds. Todos los nombres de este documento aparecen en ese índice. Las URLs de docs siguen el patrón `https://www.reactbits.dev/<categoria>/<slug>`.
- **Dependencias y peso:** descargué `https://reactbits.dev/r/<Nombre>-JS-CSS.json` de cada candidato y analicé los imports del código y el gzip de los archivos del registro. Ese gzip es **cota superior**: incluye comentarios, props y demo, y excluye React, `ogl` y `gsap`. Los ports originales mínimos de la fase deben pesar entre 1 y 2 KB gzip.
- **Detección WebGL/Canvas2D:** heurística por texto (`webgl`, `getContext('2d')`). Un componente marcado con ambos puede usar uno solo; verificar al portar. Marcado como "verificar" cuando es dudoso.
- **Descripción visual:** inferida del nombre, del código del registro y de la descripción del catálogo. No abrí cada demo en navegador. Cualquier frase visual sin captura queda **no verificada visualmente**.
- **Catálogo vs. dependencias:** casi todo el catálogo actual es WebGL crudo o Canvas 2D sin librerías. Solo `ogl` (DitherVeil), `vgpu` (ShapeWaves, AeroShards), `gsap` (Shuffle, ScrollReveal, TextLoop) y `motion` (CountUp, RotatingText) aparecen como imports externos. Ningún candidato de este scout necesita `three`.
- **Licencia:** MIT + Commons Clause. No copiamos código. Cada fila describe solo el efecto de forma conceptual para escribir un port original.

## Ya elegidos (no se reinvestigan)

Grainient, PatternWaves, CRTWarp, MicroSlats, PixelBlast, PixelCard, GradientASCII, ASCIIText, TextType, DecryptedText, ScrambledText.

## Candidatos evaluados

Clase de costo: **CSS** = portable a CSS/SVG puro; **C2D** = Canvas 2D; **GL** = WebGL crudo propio; **GL+dep** = requiere librería externa (no recomendado). Peso = gzip de registro (cota superior).

### Backgrounds

| Nombre | Docs | Qué se ve | Deps y peso | Fit | Uso sugerido | Costo | Riesgo perf / a11y |
|---|---|---|---|---|---|---|---|
| Dither | https://www.reactbits.dev/backgrounds/dither | Ondas de ruido tramadas con dithering ordenado (Bayer) en dos tonos, reactivas al cursor | ninguna, 7.1 KB | 5 | Divisor entre secciones o fondo de CTA en violeta/tinta; exactamente el look "dithering" pedido | GL (el dither Bayer se aproxima con CSS `background-image` repetido y `mask`) | Es el segundo shader continuo; limitar a 1 activo. Pausar fuera del viewport. Movimiento >5s requiere pausa |
| Faulty Terminal | https://www.reactbits.dev/backgrounds/faulty-terminal | Rejilla de caracteres de terminal con parpadeo, scanlines y tinte; look monitor averiado | ninguna, 8.8 KB | 5 | Hero de contacto o 404 con fósforo verde `#B6FF3B` sobre tinta | GL | Parpadeo: mantener frecuencia baja y bajo 3 flashes por segundo. Contraste del texto encima: usar scrim de tinta |
| Letter Glitch | https://www.reactbits.dev/backgrounds/letter-glitch | Muro de letras que cambian de color y símbolo al azar (matriz de glitch) | ninguna, 9.2 KB | 4 | Fondo de sección "Servicios" o 404; texto superpuesto en panel sólido | C2D (fácil de portar a `<pre>` con JS ligero) | Muchas repintadas en canvas; costo CPU en móvil. Decorativo, `aria-hidden` |
| Dot Grid | https://www.reactbits.dev/backgrounds/dot-grid | Rejilla de puntos que se repelen/vibran con el cursor | ninguna, 6.2 KB | 4 | Fondo sutil de about o case studies; sostiene lectura | CSS para estático (`radial-gradient`), C2D para interactivo | Bajo riesgo. En superficie de lectura mantener estático |
| Dot Field | https://www.reactbits.dev/backgrounds/dot-field | Campo de puntos con deformación suave | ninguna, 7.5 KB | 3 | Alternativa a Dot Grid | GL (verificar) | Redundante con Dot Grid; elegir uno |
| Gradient Blinds | https://www.reactbits.dev/backgrounds/gradient-blinds | Gradiente visto a través de persianas verticales (slats) con ruido y reacción al mouse | ninguna, 6.2 KB | 5 | Sustituto/pareja de MicroSlats para hero de servicios: gradiente violeta a coral en franjas | GL; fallback CSS `repeating-linear-gradient` + máscara | Un shader más; usar uno solo de MicroSlats o Gradient Blinds |
| Gradient Waves | https://www.reactbits.dev/backgrounds/gradient-waves | Ondas de gradiente fluidas, rellenas | ninguna, 6.8 KB | 3 | Fondo de CTA final | GL | Solapa con Grainient y PatternWaves |
| Sliced Waves | https://www.reactbits.dev/backgrounds/sliced-waves | Ondas cortadas en bandas horizontales (stripes) | ninguna, 6.9 KB | 4 | Divisor de sección con efecto stripes + gradiente | GL; fallback CSS con franjas | Bajo con pausa |
| Line Waves | https://www.reactbits.dev/backgrounds/line-waves | Líneas finas onduladas tipo osciloscopio | ninguna, 5.7 KB | 4 | Divisor fino entre bloques, o fondo de FAQ | GL ligero; también SVG animado con `<path>` | Bajo. El más barato del grupo "ondas" |
| Waves | https://www.reactbits.dev/backgrounds/waves | Campo de líneas con ruido Perlin que fluye | ninguna, 7.5 KB | 3 | Alternativa a Line Waves | C2D/GL (verificar) | Canvas 2D con muchos segmentos puede ser caro |
| Scanner | https://www.reactbits.dev/backgrounds/scanner | Barrido de escaneo (haz que recorre) | ninguna, 5.5 KB | 4 | Estado de carga o transición de "auditoría SEO" en servicios | GL (efecto equivalente en CSS con gradiente animado) | Barrido repetitivo: pausar y respetar reduced-motion |
| Grid Scan | https://www.reactbits.dev/backgrounds/grid-scan | Rejilla en perspectiva con línea de escaneo | ninguna, 10.9 KB | 4 | Hero alternativo o sección "técnico/SEO"; look retro-tech | GL | Pesado de los candidatos; solo si se usa como único shader |
| Radar | https://www.reactbits.dev/backgrounds/radar | Radar con barrido circular y pings | ninguna, 9.8 KB | 3 | Sección "auditoría" | GL | Temático pero llamativo; riesgo de distraer |
| Noise (Animations) | https://www.reactbits.dev/animations/noise | Capa de grano animado superpuesta | ninguna, 3.3 KB | 5 | Overlay global de grano sobre todo el sitio (bajo costo) | C2D; en producción SVG `feTurbulence` o PNG tileable | Overlay con `pointer-events:none`. Mantener opacidad baja para no bajar contraste |
| Plasma | https://www.reactbits.dev/backgrounds/plasma | Plasma fluido saturado | ninguna, 5.4 KB | 2 | No recomendado: look genérico | GL | Sin ventaja sobre Grainient |
| Silk | https://www.reactbits.dev/backgrounds/silk | Seda ondulada con ruido | ninguna, 6.2 KB | 2 | Solo si se quiere mood suave | GL | Fuera del tono ASCII/pixel |
| Topography | https://www.reactbits.dev/backgrounds/topography | Curvas de nivel animadas | ninguna, 15.1 KB | 3 | Fondo de about; pesa mucho | GL | El más pesado del scout, descartable |
| Threads | https://www.reactbits.dev/backgrounds/threads | Hilos sinusoidales con interacción | ninguna, 5.6 KB | 3 | Fondo de FAQ | GL | Bajo |
| Dark Veil | https://www.reactbits.dev/backgrounds/dark-veil | Velo oscuro con ruido y scanlines | ninguna, 9.6 KB | 3 | Fondo oscuro de bloque de testimonios | GL | Contraste excelente para texto, pero 9.6 KB |
| Shape Grid | https://www.reactbits.dev/backgrounds/shape-grid | Rejilla de formas (cuadrados, círculos) con hover | ninguna, 7.3 KB | 4 | Fondo pixel/cuadrícula de case studies | C2D, portable a CSS grid | Bajo |
| Acid Squares | https://www.reactbits.dev/backgrounds/acid-squares | Cuadrados saturados que pulsan | ninguna, 9.9 KB | 3 | Opcional para 404 | GL+C2D | Colores ácidos fuera de paleta, requiere retintado |
| Iridescence | https://www.reactbits.dev/backgrounds/iridescence | Superficie iridiscente | ninguna, 5.5 KB | 2 | No encaja con tinta + fósforo | GL | Look de plantilla genérica |

### Animations

| Nombre | Docs | Qué se ve | Deps y peso | Fit | Uso sugerido | Costo | Riesgo |
|---|---|---|---|---|---|---|---|
| Dither Veil | https://www.reactbits.dev/animations/dither-veil | Velo de dithering sobre contenido/imagen | **ogl**, 8.0 KB | 4 | Transición o velo sobre imágenes de case studies | GL+dep (ogl); portar a shader crudo | Dependencia `ogl`; descartar el original, portar |
| Halftone Reveal | https://www.reactbits.dev/animations/halftone-reveal | Imagen que se revela con trama de halftone | ninguna, 8.6 KB | 5 | Imágenes de case studies o retrato en about con reveal halftone | GL+C2D | Una instancia por vista; la imagen debe existir sin JS (`<img>` real) |
| Pixel Transition | https://www.reactbits.dev/animations/pixel-transition | Transición por cuadrados pixelados entre dos contenidos (hover) | ninguna, 4.5 KB | 5 | Tarjeta de case study: cover a detalle en hover | C2D/DOM; port CSS con `clip-path` y rejilla | Hover: dar equivalente en foco por teclado |
| Pixel Swap | https://www.reactbits.dev/animations/pixel-swap | Cambio de contenido por pixeles | ninguna, 4.6 KB | 4 | Cambio de métricas en resultados | DOM/CSS | Bajo |
| Pixel Trail | https://www.reactbits.dev/animations/pixel-trail | Estela de pixeles que sigue al cursor | ninguna, 7.1 KB | 4 | Cursor del hero, solo desktop | GL+C2D | Solo punteros finos; desactivar en táctil y reduced-motion |
| Pixel Snow | https://www.reactbits.dev/backgrounds/pixel-snow | Nieve pixelada cayendo | ninguna, 8.6 KB | 2 | No recomendado | GL | Look estacional, no técnico |
| Glare Hover | https://www.reactbits.dev/animations/glare-hover | Brillo que cruza la tarjeta en hover | ninguna, 3.4 KB | 4 | Hover de tarjetas de servicios | CSS (gradiente + transform) | Muy bajo |
| Click Spark | https://www.reactbits.dev/animations/click-spark | Chispas al hacer click | ninguna, 4.3 KB | 3 | Feedback en botón CTA | C2D | Bajo, desactivar con reduced-motion |
| Crosshair | https://www.reactbits.dev/animations/crosshair | Retícula tipo mira que sigue al cursor | ninguna, 4.3 KB | 4 | Cursor técnico en hero, solo desktop | DOM/CSS | Cursor personalizado: nunca ocultar el cursor nativo en inputs |
| Target Cursor | https://www.reactbits.dev/animations/target-cursor | Mira que se ancla a elementos interactivos | react-dom, 4.0 KB | 3 | Alternativa a Crosshair | DOM | Mismo cuidado |
| Cursor Grid | https://www.reactbits.dev/animations/cursor-grid | Rejilla que reacciona al cursor | ninguna, 6.4 KB | 3 | Hero | GL | Solapa con Pixel Trail |
| Electric Border | https://www.reactbits.dev/animations/electric-border | Borde con descarga eléctrica animada | ninguna, 8.7 KB | 3 | Borde de tarjeta destacada | GL+C2D, fallback CSS | Parpadeo: validar frecuencia |
| Star Border | https://www.reactbits.dev/animations/star-border | Borde con punto de luz orbitando | ninguna, 6.3 KB | 4 | Botón CTA principal (borde ámbar a coral) | CSS (`conic-gradient` animado o `offset-path`) | Bajo |
| Gradual Blur | https://www.reactbits.dev/animations/gradual-blur | Desenfoque progresivo en borde de scroll | ninguna, 2.9 KB | 4 | Borde inferior de listas largas, fade de overflow | CSS (`backdrop-filter` + máscara) | `backdrop-filter` puede costar en móvil |

### Text Animations

| Nombre | Docs | Qué se ve | Deps y peso | Fit | Uso sugerido | Costo | Riesgo |
|---|---|---|---|---|---|---|---|
| Glitch Text | https://www.reactbits.dev/text-animations/glitch-text | Texto con capas RGB desplazadas que se cortan | ninguna, 4.2 KB | 4 | Eyebrow o título 404; sustituible por CSS puro | CSS (`clip-path` + `::before/::after`) | Parpadeo: breve y raro. Texto real en DOM |
| Fuzzy Text | https://www.reactbits.dev/text-animations/fuzzy-text | Texto difuminado/ruidoso que se enfoca en hover | ninguna, 5.0 KB | 3 | Título de sección | C2D | Texto en canvas no se lee con lector: mantener copia accesible |
| Tech Text | https://www.reactbits.dev/text-animations/tech-text | Texto con efecto de terminal/HUD técnico | ninguna, 9.5 KB | 3 | Titular de hero | C2D | Pesado para texto |
| Split Flap Text | https://www.reactbits.dev/text-animations/split-flap-text | Tablero de aeropuerto con letras que giran | ninguna, 5.7 KB | 4 | Contador de métricas o cambio de rol en hero | CSS/DOM | Usar `aria-live="off"` y texto estático para lectores |
| Echo Text | https://www.reactbits.dev/text-animations/echo-text | Eco repetido del texto con desvanecido | ninguna, 5.1 KB | 3 | Titular grande, decorativo | CSS/DOM | Bajo |
| Text Cursor | https://www.reactbits.dev/text-animations/text-cursor | Cursor de texto parpadeante/seguidor | ninguna, 3.9 KB | 4 | Cursor fósforo en terminal del hero (estados) | CSS | Parpadeo moderado, pausar |
| Shiny Text | https://www.reactbits.dev/text-animations/shiny-text | Barrido de brillo sobre el texto | ninguna, 3.6 KB | 3 | Enlace destacado en nav | CSS | Contraste del texto base debe pasar sin el brillo |
| Gradient Text | https://www.reactbits.dev/text-animations/gradient-text | Texto con gradiente animado | ninguna, 2.8 KB | 3 | Palabra clave del titular | CSS (`background-clip:text`) | Zona muerta de contraste del gradiente (ver 51-RESEARCH.md): usar solo en texto grande >=24 px con ratio calculado |
| Shuffle | https://www.reactbits.dev/text-animations/shuffle | Letras que se barajan al entrar | **gsap**+SplitText, 6.1 KB | 2 | No: ya hay ScrambledText/DecryptedText | GL+dep | Dependencia gsap |
| Count Up | https://www.reactbits.dev/text-animations/count-up | Número que cuenta hasta el valor | **motion**, 4.8 KB | 3 | Métricas de resultados | CSS `@property` o JS 15 líneas | Dar valor final en HTML sin JS |

### Components

| Nombre | Docs | Qué se ve | Deps y peso | Fit | Uso sugerido | Costo | Riesgo |
|---|---|---|---|---|---|---|---|
| Spotlight Card | https://www.reactbits.dev/components/spotlight-card | Foco de luz que sigue al cursor dentro de la tarjeta | ninguna, 3.6 KB | 4 | Tarjetas de servicios y testimonios | CSS (variables `--x/--y` + `radial-gradient`) | Muy bajo |
| Border Glow | https://www.reactbits.dev/components/border-glow | Borde que brilla según el cursor | ninguna, 3.6 KB | 4 | Tarjetas de case studies | CSS | Bajo |
| Chroma Grid | https://www.reactbits.dev/components/chroma-grid | Rejilla de tarjetas con color por foco | ninguna, 4.1 KB | 3 | Grid de websites | CSS | Bajo |
| Specular Button | https://www.reactbits.dev/components/specular-button | Botón con reflejo especular | ninguna, 5.4 KB | 3 | CTA | GL+C2D, fallback CSS | Bajo |
| Holo Card | https://www.reactbits.dev/components/holo-card | Tarjeta holográfica con inclinación | ninguna, 8.0 KB | 3 | Tarjeta "sobre mí" | GL+C2D | Efecto de inclinación: usar solo con puntero fino |
| Glass Surface | https://www.reactbits.dev/components/glass-surface | Superficie de vidrio con refracción | ninguna, 9.1 KB | 2 | No: contradice tinta + grano | GL | Bajo contraste y peso |
| Folder | https://www.reactbits.dev/components/folder | Carpeta 3D que se abre | ninguna, 20.4 KB | 2 | No | GL | Muy pesado |
| Counter | https://www.reactbits.dev/components/counter | Contador tipo odómetro | ninguna, 5.9 KB | 3 | Métricas | CSS | Valor final en HTML |
| Stepper | https://www.reactbits.dev/components/stepper | Pasos con transición | iconos externos, 7.1 KB | 2 | Formulario de contacto multi paso, pero arrastra librería de iconos | DOM | Descartar dependencia de iconos |

## Conflictos con PSI/CWV o superficies de lectura

| Componente | Motivo | Decisión |
|---|---|---|
| Topography (15 KB), Folder (20 KB), AeroShards (21 KB, `vgpu`), GridScan (11 KB) | Peso de registro muy superior al presupuesto de 1 a 2 KB por efecto | Excluir; GridScan solo si sustituye a otro shader |
| Faulty Terminal, Letter Glitch, Acid Squares, Electric Border | Parpadeo/cambios rápidos | Limitar bajo 3 destellos por segundo, `aria-hidden`, pausa visible |
| Tech Text, Fuzzy Text | Texto dibujado en canvas, ilegible para lectores de pantalla y para el rastreo | No usar en H1; si se usan, mantener texto real en DOM |
| Gradient Text | Zona muerta de contraste del gradiente | Solo texto grande con ratio calculado |
| Todo shader continuo | Superficie de lectura de blog: movimiento y ruido bajan legibilidad | Blog y case study solo con grano estático o Dot Grid estático |
| Pixel Snow, Plasma, Silk, Iridescence, Glass Surface | Fuera de la estética ASCII/pixel/tinta | Excluir |
| ShapeWaves, DitherVeil, AeroShards | Dependen de `vgpu`/`ogl` | Portar a shader crudo o no usar |

Regla de presupuesto (de CONTEXT.md): 1 shader/canvas activo a la vez y 2 por página. Elegidos previos ya ocupan ese cupo: Grainient (permanente) más un slot rotativo. Todo candidato de este scout se resuelve en CSS salvo los marcados explícitamente.

## Top 8 adicionales (ranking)

| # | Componente | Por qué | Costo |
|---|---|---|---|
| 1 | Noise | Grano global casi gratis; refuerza "grainy" en todo el sitio | CSS/SVG |
| 2 | Dither | Dithering real, el efecto más cercano a retro-tech que falta | GL (1 slot) o CSS estático |
| 3 | Halftone Reveal | Imágenes con trama halftone al entrar; encaja en case studies | GL+C2D, único instancia |
| 4 | Pixel Transition | Hover de tarjeta con cuadrados pixelados, con fallback CSS | DOM/CSS |
| 5 | Faulty Terminal | Look CRT/terminal completo en 404 y contacto | GL (1 slot) |
| 6 | Spotlight Card | Hover profesional de bajo costo para todas las tarjetas | CSS |
| 7 | Gradient Blinds | Slats con gradiente; alternativa/pareja de MicroSlats | CSS (fallback) o GL |
| 8 | Star Border | CTA con borde de luz orbitando en ámbar a coral | CSS |

Menciones: Glitch Text (CSS puro para eyebrow), Line Waves (divisor ligero), Dot Grid (fondo de lectura), Glare Hover.

## Mapeo a secciones de la home

| Sección | Primario (ya elegidos) | Añadir del scout |
|---|---|---|
| Hero | Grainient, ASCIIText/GradientASCII, TextType | Noise (overlay), Text Cursor fósforo, Star Border en CTA, Crosshair opcional desktop |
| Servicios | MicroSlats, DecryptedText | Gradient Blinds o Sliced Waves como divisor, Spotlight Card, Glare Hover, Scanner (estado) |
| Case studies | PixelCard, PixelBlast | Halftone Reveal, Pixel Transition, Border Glow |
| Websites | PatternWaves | Shape Grid, Chroma Grid, Spotlight Card |
| About | ScrambledText | Dot Grid estático, Halftone Reveal en retrato, Line Waves |
| Testimonios | CRTWarp (punto de contraste) | Dark Veil o Noise, Spotlight Card |
| FAQ | (sin efecto pesado) | Line Waves divisor, Dot Grid estático. Sin shaders: superficie de lectura |
| Contacto | CRTWarp/GradientASCII | Faulty Terminal, Dither, Text Cursor fósforo, Star Border |
| 404 | n/a | Faulty Terminal o Letter Glitch, Glitch Text |

## No verificado

- Aspecto exacto de cada demo (no abrí las páginas en navegador; descripciones inferidas del nombre y del código).
- Si el componente usa WebGL o Canvas 2D cuando aparece marcado con ambos (heurística de texto).
- Peso gzip real tras minificación y portado (las cifras son el archivo del registro completo).
