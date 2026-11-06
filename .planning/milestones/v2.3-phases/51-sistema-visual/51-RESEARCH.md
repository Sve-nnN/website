# Phase 51: Sistema visual - Research

**Researched:** 2026-10-15
**Domain:** Sistema de diseño estático en HTML/CSS/JS vanilla (tokens, componentes, efectos inspirados en React Bits, fallbacks CSS, medición de contraste y peso)
**Confidence:** HIGH para catálogo React Bits, contraste y pesos medidos; MEDIUM para licencias de fuentes y comportamiento de axe

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dirección visual (fijada por Juan)**
- Estética: ASCII, pixel, grainy gradient. Componentes inspirados en React Bits: gradientes, micro slats, pattern waves, CRT warp.
- Paleta nueva: negro tinta `#0B0B12`; gradiente grainy violeta `#5B3DF5` a coral `#FF4D6D` a ámbar `#FFB020`; verde fósforo `#B6FF3B` solo para ASCII, cursores y estados.
- Juan eligió "nueva paleta con gradientes" y efectos en varias secciones.

**Performance (requisito del sitio)**
- Máximo 1 shader/canvas activo a la vez y 2 por página; el resto CSS o SVG.
- Efectos pesados cargan después de LCP, solo al entrar al viewport, y se pausan al salir.
- Fallback estático CSS (gradiente + ruido SVG) para mobile, `prefers-reduced-motion` y `saveData`. DPR limitado a 1.5.
- Sin dependencias de CDN pesadas ni `three` completo; si hace falta WebGL, escribir un shader vanilla mínimo.

**Tipografía**
- Titulares y cuerpo: Array y Geist Sans (ya autohospedadas en el sitio). Mono: Geist Mono para ASCII. Fuente pixel solo para etiquetas cortas, autohospedada y con subset.

**Accesibilidad**
- WCAG 2.2 AA y A11Y.md. Cada par texto/fondo con ratio calculado. ASCII decorativo `aria-hidden`.

### Claude's Discretion
- Estructura de archivos dentro de `designs/redesign-v3/` (CSS compartido, JS de efectos, assets).
- Implementación vanilla de cada efecto de React Bits (los componentes originales son React; el mockup es estático, se portan a vanilla o se aproximan con CSS).
- Nombre exacto de cada componente de origen: verificar contra el catálogo real de reactbits.dev, no asumir. Si un efecto pedido no existe con ese nombre (por ejemplo "micro slats"), documentar el equivalente más cercano.
- Herramienta para calcular contraste y para medir peso.

### Deferred Ideas (OUT OF SCOPE)
- Implementación en Next.js + Payload (milestone posterior, requiere aprobación de Juan sobre los mockups).
- Páginas distintas de la home: fases 53 a 55, tras la aprobación de la fase 52.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYS-01 | `system.html` muestra paleta, tipografía y escala de espaciado | Tokens en la sección Code Examples; fuentes reales y rutas en Standard Stack |
| SYS-02 | Cada par texto/fondo con ratio calculado y todos cumplen WCAG 2.2 AA | Matriz de contraste medida, zona muerta del gradiente, token `--violet-text`, script `contrast.mjs` |
| SYS-03 | Biblioteca de componentes con hover, focus, disabled y reduced-motion | Patrón `data-motion` + `prefers-reduced-motion` y demos opt-in; reglas de foco y objetivo táctil de A11Y.md |
| SYS-04 | Cada efecto identificado contra el catálogo real con nombre exacto y costo de peso | Tabla del catálogo verificado (nombres, categoría, dependencias, peso original medido) |
| SYS-05 | Fallback estático CSS por efecto, visible sin JS, en mobile, reduced-motion y saveData | Fallbacks CSS renderizados y medidos (3.3 KB sin comprimir, 1.3 KB gzip los seis) |
</phase_requirements>

## Summary

Los seis efectos que Juan pidió existen con nombre propio en el catálogo vivo de React Bits: `Grainient`, `PatternWaves`, `CRTWarp`, `MicroSlats`, `PixelBlast` (más `PixelCard`) y `GradientASCII` / `ASCIIText`. No hace falta documentar equivalentes aproximados: "micro slats" es literalmente `MicroSlats` en Backgrounds. Dos hechos cambian el plan respecto a CONTEXT.md. Primero, la mayoría de los componentes actuales ya no usan `three`: `Grainient`, `CRTWarp`, `PixelBlast` y `GradientASCII` son WebGL2 crudo sin dependencias, y solo `PatternWaves` y `MicroSlats` dependen de `ogl`. Segundo, Geist Mono NO está autohospedada en el sitio (el repo decide explícitamente no tener webfont mono) y Geist Sans se autohospeda en build vía `next/font/google`, no existe como archivo fuente en `src/`.

La estrategia correcta es CSS primero, JavaScript como mejora. Medí un prototipo: un gestor de "slot único" más tres shaders crudos (grain gradient, halftone, CRT) pesa 3.4 KB minificado, 1.77 KB gzip, y los seis fallbacks CSS pesan 1.3 KB gzip. Eso es entre 15 y 20 veces menos que los componentes originales (5 a 8 KB gzip cada uno, sin contar React ni `ogl`). Solo `Grainient` debe ser el efecto WebGL permanente de la página; `MicroSlats`, `PatternWaves` y `CRTWarp` son los más caros del catálogo (fluidos, render targets, 4 pasadas) y deben ir en CSS en producción, con demos WebGL opt-in solo en `system.html`.

El hallazgo de accesibilidad más importante: ningún color de texto único cumple 4.5:1 sobre todo el gradiente. Blanco pasa en violeta y hasta un 60% del tramo violeta a coral; tinta pasa desde el 70%; entre ambos hay una zona muerta. Además `#5B3DF5` sobre tinta da 3.20:1, así que no sirve como texto. La regla del sistema debe ser: el texto nunca vive directo sobre el gradiente, siempre sobre scrim de tinta al 60% (5.25:1 mínimo medido a 50%) o sobre panel sólido.

**Primary recommendation:** Construir `system.html` con fallbacks CSS como estado por defecto, activar efectos solo por demo explícita (un botón por efecto, uno a la vez), escribir shaders originales mínimos en lugar de portar los de React Bits, y generar la tabla de contraste con un script Node sin dependencias que corra en el plan.

## Architectural Responsibility Map

Este milestone es HTML estático sin servidor de aplicación. Los "tiers" relevantes son los de un sitio estático.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tokens (color, tipografía, espaciado) | CSS (custom properties en `tokens.css`) | n/a | Un solo origen de verdad; el HTML y el script de contraste leen los mismos valores |
| Fallback visual de cada efecto | CSS + SVG inline | n/a | Debe verse sin JS, en mobile, reduced-motion y saveData; pinta con el primer render |
| Efecto animado (grain, halftone, CRT) | Browser JS (WebGL1/2 crudo) | Canvas 2D para efectos livianos | Mejora progresiva: solo si pasa todos los gates (idle, viewport, reduced-motion, saveData, ancho) |
| ASCII y texto terminal | DOM (`<pre aria-hidden>`) | Canvas 2D solo si hay animación densa | Texto es más barato que canvas y no cuenta contra el límite WebGL/canvas |
| Cálculo de contraste | Script Node en tiempo de autor | `system.html` muestra el resultado estático | Evita calcular en runtime y deja evidencia versionada en `reports/` |
| Medición de performance | Lighthouse CLI local contra servidor estático | n/a | Herramienta ya instalada en el repo (`lighthouse` 13.4.1) |
| Servido de fuentes | Archivos estáticos en `assets/fonts/` | n/a | Autohospedadas, sin CDN, con `font-display` explícito |

## Standard Stack

La fase no instala ningún paquete ni toca `package.json`. Todo es HTML, CSS y JavaScript vanilla.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTML + CSS custom properties | n/a | Tokens, componentes, fallbacks | Sin build step, funciona sin JS |
| WebGL1/WebGL2 crudo | n/a | Único efecto shader activo | Restricción de Juan: shader mínimo, sin `three` |
| Lighthouse CLI | 13.4.1 (ya en el repo) | Medir performance y accesibilidad | [VERIFIED: `node_modules/.bin/lighthouse --version` devolvió 13.4.1; `package.json` línea 58 declara `"lighthouse": "^13.4.0"`] |
| Node | v24.13.0 | Script de contraste y de peso | [VERIFIED: `node --version`] |

### Supporting (solo herramientas de autor, no se envían al navegador)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `esbuild` vía `npx -y esbuild` | 0.2x | Minificar para medir peso real del JS | Al medir `effects.js`; no es dependencia del repo |
| `pyftsubset` (fonttools) | pip, en venv temporal | Subset de la fuente pixel y Geist Mono | Una sola vez al preparar `assets/fonts/`; no commitear el venv |
| `npx serve@14` | 14.x | Servidor estático con brotli | Para que Lighthouse mida transferencia comprimida realista |
| `python3 -m http.server` | 3.14.7 | Servidor sin compresión | Alternativa conservadora; no comprime |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shader original mínimo | Portar el JSX de React Bits a vanilla | Los originales pesan 5.3 a 8.1 KB gzip cada uno (medido) y su licencia tiene Commons Clause sobre "versión portada" (ver Pitfall 6) |
| Geist Pixel Square | Silkscreen (3.5 KB latin, OFL) | Silkscreen es más ligera pero no pertenece a la familia Geist; Geist Pixel hace pareja directa con Geist Sans/Mono |
| `npx serve@14` | `python3 -m http.server` | Python no comprime; las métricas de transferencia salen peores que en producción |

**Installation:** ninguna. Los comandos de autor se ejecutan con `npx -y` y un venv temporal fuera del repo.

**Version verification (medido en esta sesión):**
```
npx -y esbuild   -> esbuild minifica effects.js a 3458 bytes
lighthouse       -> 13.4.1 (node_modules/.bin/lighthouse)
npx serve@14     -> responde Content-Encoding: br
```

### Fuentes: estado real en el repo (corrige CONTEXT.md)

| Familia | Estado real | Evidencia |
|---------|-------------|-----------|
| Array | Archivo en el repo, 21 KB, un solo peso 400 | [VERIFIED: `src/fonts/Array-Regular.woff2`, 21k; `src/fonts.ts:6-10`] `path: './fonts/Array-Regular.woff2', weight: '400', style: 'normal',` |
| Geist Sans | NO hay archivo fuente. Se autohospeda en build con `next/font/google` | [VERIFIED: `src/fonts.ts:39-43`] `export const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap', })`. El resultado en build es `.next/static/media/22a5144ee8d83bca-s.p.woff2`, 29 KB, variable, 288 glifos (identificado con fontTools en esta sesión). `.next/` está en `.gitignore` |
| Geist Mono | NO existe webfont. Decisión explícita del repo | [VERIFIED: `src/fonts.ts:45`] `// There is deliberately no monospace webfont here.` y `tailwind.config.ts:23` `// Sin webfont: los bloques de codigo usan la mono del sistema.` |
| Khand | Existe en el sitio incumbente, no está en las decisiones de v3 | [VERIFIED: `src/fonts.ts:17-23`] No incluir salvo que Juan lo pida |

**Consecuencia para el plan:** hay que descargar o copiar Geist Sans y Geist Mono a `designs/redesign-v3/assets/fonts/`. Geist Sans latin variable (400 a 700) desde Google Fonts pesa 29,288 bytes [VERIFIED: curl a `fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2`]. Geist Mono latin variable pesa 23,108 bytes; instanciada a peso 400 y recortada a ASCII + Latin-1 baja a 7.3 KB [VERIFIED: fontTools `varLib.instancer` + `pyftsubset`, medido en esta sesión].

### Fuente pixel recomendada

**Geist Pixel, variante Square, solo mayúsculas y dígitos.**

| Dato | Valor | Fuente |
|------|-------|--------|
| Nombre | Geist Pixel (variantes Square, Grid, Circle, Triangle, Line) | [CITED: https://vercel.com/blog/introducing-geist-pixel] |
| Licencia | SIL Open Font License 1.1 | [CITED: https://github.com/vercel/geist-pixel-font, readme.md y OFL.txt] |
| Publicación | 6 de febrero de 2026, 480 glifos | [CITED: https://vercel.com/blog/introducing-geist-pixel] |
| Archivo base | `fonts/webfonts/GeistPixel-Square.woff2`, 28,288 bytes, 466 glifos | [VERIFIED: GitHub API contents/fonts/webfonts + fontTools] |
| Subset medido | `U+0020-005F` más `Á É Í Ñ Ó Ú Ü` y `→`, sin hinting, sin tablas de layout: **2.4 KB** | [VERIFIED: `pyftsubset` en esta sesión, `sq.upper.woff2` = 2.4k] |
| Subset latin completo (minúsculas incluidas) | 16 KB; solo ASCII 11 KB | [VERIFIED: medido] por eso se restringe a mayúsculas |
| Uso | Etiquetas cortas en mayúsculas (badges, eyebrow, estados), tamaño mínimo 12 px | Recomendación |
| `font-display` | `optional` | Evita swap y CLS; si no carga a tiempo, cae a Geist Mono |

Alternativas con licencia OFL medidas: Silkscreen latin 3.5 KB, VT323 latin 7.2 KB, Pixelify Sans latin 7.6 KB [VERIFIED: curl a `fonts.gstatic.com`, Google Fonts CSS API]. Silkscreen es la segunda opción si Juan prefiere algo más clásico. Cuidado: el OFL de Geist Pixel declara nombre reservado; el subset es una modificación, así que el archivo derivado no debe llamarse "Geist Pixel" en el `font-family` público sin revisar la cláusula 3 de `OFL.txt` (usar `font-family: "Pixel Label"` como alias interno ya basta).

**Array:** no recortar ni modificar. La licencia de Fontshare para fuentes cerradas restringe la modificación y el servido a terceros [ASSUMED: ver A1]. Usar el archivo tal cual (21 KB) y declarar solo peso 400. Nunca asignar `font-weight: 600` a Array: el sitio actual ya documenta que sintetiza negrita falsa [VERIFIED: `src/blocks/ResultsSection/Component.tsx:31-34`, comentario "synthesise the bold"]. Añadir `font-synthesis: none`.

## Package Legitimacy Audit

La fase no instala paquetes externos y no modifica `package.json`. `ogl`, `gsap` y `motion` aparecen solo como dependencias de los componentes originales de React Bits, con fines de medición. No se recomiendan.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (ninguno instalado) | n/a | n/a | n/a | n/a | n/a | n/a |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

Nota de procedencia: `ogl@1.0.11`, `gsap@^3.13.0` y `motion@^12.23.12` salen del registro JSON oficial de React Bits (`https://reactbits.dev/r/<Componente>-JS-CSS.json`) [VERIFIED: leído en esta sesión]. Se instalaron solo en un directorio temporal fuera del repo para medir tamaño.

## Catálogo React Bits verificado (SYS-04)

Fuentes cruzadas: índice vivo `https://reactbits.dev/llms.txt`, listado de directorios del repo `https://github.com/DavidHDev/react-bits/tree/main/src/content`, y registro JSON `https://reactbits.dev/r/<Nombre>-JS-CSS.json` para dependencias. El nombre de la CLI coincide con el nombre del directorio.

### Efectos pedidos por Juan

| Efecto pedido | Componente exacto | Categoría y URL | Dependencias | Descripción oficial |
|---------------|-------------------|-----------------|--------------|---------------------|
| Grainy gradient | **Grainient** | Backgrounds, `https://reactbits.dev/backgrounds/grainient` | Ninguna (WebGL2 crudo, dos pasadas: campo + composite con grano) | "Flowing grainy gradients you can stir with the cursor." |
| Pattern waves | **PatternWaves** | Backgrounds, `https://reactbits.dev/backgrounds/pattern-waves` | `ogl@^1.0.11` | "A lit halftone surface of dots, lines or glyphs that moves like draped silk." |
| CRT warp | **CRTWarp** | Backgrounds, `https://reactbits.dev/backgrounds/crt-warp` | Ninguna (WebGL2 crudo, 4 shaders: CONTENT, GLOW, BLUR, DISPLAY) | "A blocky plasma glowing on a curved CRT, with real scanlines, a phosphor mask, afterglow and a power-on intro." |
| Micro slats | **MicroSlats** (existe con ese nombre exacto) | Backgrounds, `https://reactbits.dev/backgrounds/micro-slats` | `ogl@^1.0.11` | "A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests." |
| Pixel (fondo) | **PixelBlast** | Backgrounds, `https://reactbits.dev/backgrounds/pixel-blast` | Ninguna (WebGL2 crudo) | "Dithered pixel clouds that drift, shimmer and light up under the cursor, with ripples, shapes and a perspective floor." |
| Pixel (tarjeta) | **PixelCard** | Components, `https://reactbits.dev/components/pixel-card` | Ninguna (canvas 2D) | "A card that fills with twinkling pixels on hover, rippling out from the center or the cursor." |
| ASCII (fondo) | **GradientASCII** | Backgrounds, `https://reactbits.dev/backgrounds/gradient-ascii` | Ninguna (WebGL2 + canvas 2D para atlas) | "Soft gradient glows drawn in ASCII characters that scramble under the cursor." |
| ASCII (texto) | **ASCIIText** | Text Animations, `https://reactbits.dev/text-animations/ascii-text` | Ninguna (WebGL2 + canvas 2D) | "Waving ASCII text that tilts toward the pointer, scrambles on hover and ripples on click." |

[CITED: https://reactbits.dev/llms.txt para nombres, categorías y descripciones] [VERIFIED: registro JSON `https://reactbits.dev/r/*-JS-CSS.json` para `dependencies`, leído en esta sesión]

### Componentes vecinos útiles (todos existen en el catálogo)

| Componente | Categoría | Dependencias | Uso sugerido |
|------------|-----------|--------------|--------------|
| `Waves` | Backgrounds | Ninguna | Líneas fluidas; alternativa barata a PatternWaves |
| `FaultyTerminal` | Backgrounds | Ninguna | "A flickering CRT terminal of glowing glyphs"; referencia del bloque terminal CRT |
| `Dither` | Backgrounds | Ninguna | "Retro dithered waves with Bayer, halftone, line and noise patterns" |
| `LetterGlitch` | Backgrounds | Ninguna | Campo de letras que parpadean; alternativa ASCII |
| `GradientBlinds` | Backgrounds | Ninguna | Vecino de MicroSlats: persianas con gradiente |
| `SlicedWaves`, `LineWaves`, `Scanner` | Backgrounds | no verificado una a una | Otros candidatos de CRT y rayas |
| `PixelTrail`, `PixelTransition`, `PixelSwap` | Animations | Ninguna (canvas 2D) | Interacciones pixel; no necesarias en v3 |
| `TextType` | Text Animations | `gsap@^3.13.0` | Máquina de escribir con cursor |
| `DecryptedText` | Text Animations | `motion@^12.23.12` | Descifrado de glifos |
| `ScrambledText` | Text Animations | `gsap@^3.13.0` (SplitText y ScrambleTextPlugin) | Distorsión con cursor |

### Peso de los originales (medido, solo código del componente)

Procedimiento: se descargó cada `.jsx` desde `raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/...`, se quitó el import de CSS y se minificó con esbuild dejando `react`, `ogl`, `gsap` y `motion` como externos. [VERIFIED: medido en esta sesión]

| Componente | Fuente JSX+CSS (bytes) | Minificado | gzip | Dependencia adicional (tree-shaken) |
|------------|-----------------------|-----------|------|-------------------------------------|
| Grainient | 21,320 | 13.9 KB | 5.8 KB | ninguna |
| PatternWaves | 28,915 | 19.1 KB | 7.1 KB | `ogl`: 53.8 KB min, 14.8 KB gzip |
| CRTWarp | 28,289 | 19.7 KB | 7.5 KB | ninguna |
| MicroSlats | 29,366 | 18.7 KB | 6.7 KB | `ogl`: 53.8 KB min, 14.8 KB gzip |
| PixelBlast | 32,104 | 22.6 KB | 8.1 KB | ninguna |
| GradientASCII | 30,232 | 20.8 KB | 7.7 KB | ninguna |
| ASCIIText | 19,812 | 12.9 KB | 5.3 KB | ninguna |
| PixelCard | 21,870 | 10.2 KB | 4.2 KB | ninguna |
| TextType | 13,313 | 5.8 KB | 2.7 KB | `gsap` core: 71.3 KB min, 28.2 KB gzip |
| DecryptedText | 18,368 | 8.6 KB | 3.9 KB | `motion/react` más `react-dom` empaquetados: 355 KB min, 113 KB gzip (incluye el runtime de React, no es solo motion) |

Todos los números excluyen el runtime de React, que un componente React real sí necesita. En el mockup vanilla no aplica, pero la tabla sirve para justificar "no portar".

## Cómo reproducir cada efecto en vanilla (SYS-05, pregunta 2)

Prototipo medido en el scratchpad de esta sesión: un archivo con gestor de slot, `IntersectionObserver`, tres fragment shaders (grain gradient, halftone, CRT) y todos los gates. Minificado 3,458 bytes; gzip 1,769 bytes; brotli 1,540 bytes. Seis fallbacks CSS (con el SVG de grano inline): 3,296 bytes, gzip 1,345 bytes. [VERIFIED: esbuild, `gzip -9`, `brotli -q 11` en esta sesión]

| Efecto | Fallback CSS (siempre presente) | Mejora JS | Peso aproximado de la mejora | Costo de hilo principal | Cuenta como WebGL/canvas |
|--------|----------------------------------|-----------|------------------------------|-------------------------|---------------------------|
| Grainy gradient (`Grainient`) | Tres `radial-gradient` apilados sobre tinta, más pseudo-elemento con SVG `feTurbulence` (`fractalNoise`, `baseFrequency .85`, `numOctaves 3`) en `mix-blend-mode: overlay`, opacidad .35 a .45 | Fragment shader de una pasada: dos octavas de value noise deforman un `s` lineal; 3 stops; grano `hash(gl_FragCoord)` ±.06 | ~0.7 KB gzip el shader; runner compartido ~1 KB gzip | Casi nulo en GPU real; con SwiftShader (headless) medir. 24 a 30 fps bastan | **Sí. Es el único WebGL permanente de la página** |
| Pattern waves (`PatternWaves`) | `radial-gradient` de punto en celda de 8 px con `mask-image: repeating-radial-gradient` y `transform: rotate`; animación solo de `transform` en pseudo-elemento | Shader halftone: celda de 8 px, radio = onda lit | ~0.4 KB gzip | Bajo | Sí si se activa con shader; **recomendado dejarlo en CSS** |
| CRT warp (`CRTWarp`) | `repeating-linear-gradient` de scanlines (1 px cada 3 px), viñeta radial, `box-shadow` inset fósforo, `border-radius` elíptico, `text-shadow` fósforo, parpadeo con `opacity` | Shader con barrel distortion `u*=1+.08*dot(u,u)`, scanlines `sin(gl_FragCoord.y*π)`, viñeta | ~0.5 KB gzip | Bajo | Sí si se activa; **recomendado CSS en el contenido, shader solo en la demo** |
| Micro slats (`MicroSlats`) | `repeating-linear-gradient(90deg, #2b2070 0 7px, ink 7px 10px)` en plano con `perspective() rotateX()` y máscara de degradado, más brillo `screen` con `translateX` | Canvas 2D: columnas con altura sinusoidal | ~1.2 KB gzip estimado | Bajo | Canvas si se activa; **recomendado CSS** |
| Pixel (`PixelBlast`, `PixelCard`) | Degradado + `conic-gradient` de tablero 6 px como tramado, `image-rendering: pixelated` | `PixelCard`: canvas 2D solo en hover (~1 KB gzip estimado) | ~1 KB gzip | Solo durante hover | Canvas efímero; no cuenta como "activo" fuera del hover |
| ASCII (`GradientASCII`, `ASCIIText`) | `<pre aria-hidden="true">` con caracteres precalculados y Geist Mono | `setInterval` a 8 a 12 fps reescribiendo `textContent` con un campo de ondas | ~0.6 KB gzip estimado | Bajo: DOM de texto, no canvas | **No** (DOM) |

Rangos marcados "estimado" son [ASSUMED]; los demás salen del prototipo medido.

### Regla del slot único (PERF-01)

Un gestor central mantiene `active = {el, fx}`. Cuando un efecto entra al viewport y ya hay uno activo en otro elemento, el gestor llama `destroy()` del anterior (cancela rAF, `WEBGL_lose_context`, quita el canvas). Esto garantiza "1 a la vez" sin coordinar manualmente. El "2 por página" lo garantiza el diseño: un slot permanente (hero) más un slot de demo; el resto es CSS o DOM.

**Decisión recomendada:** `Grainient` (versión mínima) es el único efecto WebGL de producción. `CRTWarp`, `PatternWaves` y `MicroSlats` se entregan como CSS en las páginas, y como demo WebGL activable por botón solo en `system.html`, donde el slot único evita solapes.

### Hallazgo de medición con Lighthouse

Con `--form-factor=mobile` el viewport emulado es de 412 px; el gate `max-width: 767px` desactiva el shader y Lighthouse mide solo el fallback (performance 1.0, LCP 0.9 s, CLS 0, TBT 0 ms). Con `--preset=desktop` el shader sí corre: ocho corridas dieron TBT de 0 a 40 ms y performance 1.0, **con una corrida atípica en la primera ejecución en frío: TBT 490 ms, performance 0.79** [VERIFIED: medido en esta sesión, causa sin determinar, ver A9]. Consecuencias: (a) PERF-03 mobile mide el fallback, no el shader; (b) hay que correr desktop además de mobile; (c) correr cada medición 3 veces y reportar la mediana; (d) headless usa render por software, así que un TBT alto allí no implica lo mismo en GPU real.

## Architecture Patterns

### Diagrama del flujo de un efecto

```
Carga de página (HTML + tokens.css + effects.css)
        |
        v
Fallback CSS pinta de inmediato  --->  LCP = H1 en HTML (no depende del efecto)
        |
        v   evento window "load"
requestIdleCallback (timeout 2000 ms; setTimeout si no existe)
        |
        v
Gates (todos deben pasar):
  prefers-reduced-motion != reduce
  html[data-motion] != "reduced"            (simulador de la demo)
  navigator.connection.saveData != true
  html[data-saver] != "on"                  (simulador de la demo)
  ancho >= 768 px y pointer no "coarse"
        |  falla alguno
        +-----------------------------------> se queda el fallback CSS
        |  pasan todos
        v
IntersectionObserver (threshold .15, un observer para todos)
        |  entra al viewport
        v
Gestor de slot: destruye el activo previo, monta canvas absoluto (opacity 0)
        |
        v
rAF a 30 fps, DPR = min(devicePixelRatio, 1.5), canvas fade-in por opacity
        |  sale del viewport o document.hidden
        v
pause() o destroy() + loseContext
```

### Estructura recomendada de `designs/redesign-v3/`

```
designs/redesign-v3/
  system.html                 # entregable de la fase
  assets/
    css/
      tokens.css              # custom properties: color, tipografía, espaciado, radios, motion
      base.css                # reset, @font-face, tipografía, foco global, utilidades
      components.css          # botones, cards, badges, nav, footer, form, bloque CRT, bloque ASCII
      effects.css             # fallbacks CSS de los seis efectos (estado por defecto)
    js/
      effects.js              # gestor de slot + gates + shaders mínimos (script clásico, defer)
      system-demo.js          # solo system.html: toggles de reduced-motion y saver, botones de demo
    fonts/
      Array-Regular.woff2     # copia exacta de src/fonts/ (sin modificar)
      Geist-latin-var.woff2   # 29 KB, variable 400..700
      GeistMono-400-latin.woff2   # 7.3 KB
      GeistPixel-Square-upper.woff2  # 2.4 KB
      OFL-geist.txt           # licencias de las fuentes copiadas
  tools/
    contrast.mjs              # calcula ratios y escribe reports/contrast.json
    weight.mjs                # mide bytes crudos, gzip y brotli de assets
  reports/
    contrast.json
    weights.json
    lighthouse-system-mobile.report.html / .json
    lighthouse-system-desktop.report.html / .json
```

Reglas: rutas siempre relativas; ningún CDN; el HTML de las fases 52 a 55 enlaza `../assets/...` o el mismo `assets/` si viven en la misma carpeta. Las páginas posteriores no deben redefinir tokens (criterio de la Phase 53: "sin estilos ad hoc").

**Nota de git:** `git ls-files designs` devuelve vacío y `git status` muestra `?? designs/`, o sea que todo `designs/` está sin versionar hoy. Las tareas de commit deben hacer `git add designs/redesign-v3` de forma explícita y el plan debe decidir si también se versiona el resto de `designs/` (decisión de Juan, ver Open Questions).

### Cómo servir localmente (sin tocar `package.json`)

```bash
# Opción A, recomendada: comprime con brotli, parecido a producción
npx -y serve@14 -l 4173 designs/redesign-v3

# Opción B, sin compresión (métricas de transferencia más pesimistas)
python3 -m http.server 4173 --bind 127.0.0.1 --directory designs/redesign-v3
```

[VERIFIED: ambas probadas en esta sesión; `serve@14` respondió `Content-Encoding: br`, Python no comprime]

### Cómo medir con Lighthouse

```bash
# Mobile (mide el fallback porque el viewport es 412 px)
node_modules/.bin/lighthouse http://127.0.0.1:4173/system.html \
  --form-factor=mobile --only-categories=performance,accessibility,best-practices \
  --output=json --output=html \
  --output-path=designs/redesign-v3/reports/lighthouse-system-mobile \
  --chrome-flags="--headless=new" --quiet

# Desktop (mide el shader activo)
node_modules/.bin/lighthouse http://127.0.0.1:4173/system.html \
  --preset=desktop --only-categories=performance,accessibility,best-practices \
  --output=json --output=html \
  --output-path=designs/redesign-v3/reports/lighthouse-system-desktop \
  --chrome-flags="--headless=new" --quiet
```

[VERIFIED: la forma con dos `--output` y `--output-path` base produce `<base>.report.json` y `<base>.report.html`; probado con Lighthouse 13.4.1 y Chrome headless en esta sesión]. Para extraer cifras: `node -e "const r=require('./designs/redesign-v3/reports/lighthouse-system-mobile.report.json'); console.log(r.categories.performance.score, r.audits['largest-contentful-paint'].numericValue, r.audits['cumulative-layout-shift'].numericValue)"`.

### Patrón de movimiento: reducido por defecto (SYS-03)

A11Y.md pide "Build the reduced-motion path as the default, adding motion in the `no-preference` branch" [CITED: https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md]. El navegador no permite conmutar `prefers-reduced-motion` desde la página, así que para que Juan pruebe el estado en `system.html` hay que simularlo con un atributo.

```css
/* effects.css: el movimiento solo existe si el usuario no lo rechazó Y el simulador no lo apagó */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-motion="reduced"]) .fx-crt-text { animation: crt-flicker 6s steps(1) infinite; }
  :root:not([data-motion="reduced"]) .fx-waves::before { animation: drift 24s linear infinite; }
}
```

```js
// effects.js
var root = document.documentElement;
function motionOk() {
  return !matchMedia('(prefers-reduced-motion: reduce)').matches && root.dataset.motion !== 'reduced';
}
```

Para "disabled" y "focus" en componentes: foco visible con `outline: 2px solid` y `outline-offset: 2px`, mínimo 3:1 contra el fondo adyacente; `outline: none` sin reemplazo está prohibido [CITED: A11Y.md, regla de focus]. Objetivo táctil mínimo 24x24 (WCAG 2.5.8), diseñar a 44x44 [CITED: A11Y.md]. Estados `disabled`: usar `aria-disabled="true"` o `disabled` y documentar que el texto inactivo está exento de 1.4.3 pero se mantiene legible [CITED: https://www.w3.org/TR/WCAG22/ 1.4.11, "Inactive components ... are excluded"].

### Pausa obligatoria de movimiento (hallazgo de A11Y)

WCAG 2.2.2 (Nivel A) exige mecanismo para pausar, detener u ocultar cualquier contenido que se mueve, empieza solo, dura más de 5 segundos y aparece junto a otro contenido [CITED: https://www.w3.org/TR/WCAG22/ 2.2.2]. Un fondo `Grainient` animado entra en esa definición. El sistema debe incluir un botón global "Pausar animaciones" con `aria-pressed` que ponga `data-motion="reduced"` y destruya el efecto activo. Esto no aparece en CONTEXT.md ni en PERF-04 y debe entrar en los componentes de SYS-03.

### Anti-patterns
- **Texto directo sobre el gradiente:** nunca; ver zona muerta.
- **Shader por sección:** rompe el límite 1 activo y 2 por página.
- **Canvas sin tamaño CSS previo:** produce CLS. El contenedor define `min-height` o `aspect-ratio` en CSS; el canvas es `position:absolute; inset:0`.
- **`filter: blur`, `backdrop-filter` o `feDisplacementMap` en áreas grandes:** el costo de pintado es mayor que el del shader; no usarlos para "simular" CRT o vidrio.
- **Verde fósforo como fondo o como texto sobre gradiente:** `#B6FF3B` sobre ámbar da 1.51:1 y sobre coral 2.66:1.
- **Glifos de bloque en el ASCII (`█ ▓ ▒ ░`):** Geist Mono no los incluye (medido), caerían a otra fuente y cambiarían el ancho de celda. Usar solo `.:-=+*#%@`, que es el charset por defecto de React Bits `PatternWaves` (`DEFAULT_CHARACTERS = '.:-=+*#%@'`).

## Contraste WCAG 2.2 AA (SYS-02, pregunta 4)

Fórmula: luminancia relativa sRGB de WCAG, ratio `(L1 + 0.05) / (L2 + 0.05)`. Umbrales: texto normal 4.5:1, texto grande (18 pt o 14 pt negrita, es decir 24 px o 18.66 px negrita) 3:1, componentes de interfaz y gráficos 3:1 [CITED: https://www.w3.org/TR/WCAG22/ 1.4.3 y 1.4.11]. A11Y.md añade: "Ratios are computed, never estimated" y foco 2 px con 3:1 [CITED: A11Y.md]. Todos los números siguientes fueron calculados con un script Python de la biblioteca estándar en esta sesión [VERIFIED].

Neutros tomados del sistema incumbente para texto de apoyo: `paper #FAFAF7` y `quiet-paper #A8ACBB` [VERIFIED: `DESIGN.md:13,15`] `paper: "#FAFAF7"`, `quiet-paper: "#A8ACBB"`. Se conservan como candidatos; Juan puede reemplazarlos.

### Matriz medida

| Texto | Fondo | Ratio | Texto normal (4.5) | Texto grande / UI (3) |
|-------|-------|-------|--------------------|-----------------------|
| `#FFFFFF` blanco | `#0B0B12` tinta | 19.61 | Pasa | Pasa |
| `#FAFAF7` paper | `#0B0B12` tinta | 18.75 | Pasa | Pasa |
| `#A8ACBB` quiet | `#0B0B12` tinta | 8.67 | Pasa | Pasa |
| `#B6FF3B` fósforo | `#0B0B12` tinta | 16.21 | Pasa | Pasa |
| `#FFB020` ámbar | `#0B0B12` tinta | 10.72 | Pasa | Pasa |
| `#FF4D6D` coral | `#0B0B12` tinta | 6.10 | Pasa | Pasa |
| `#5B3DF5` violeta | `#0B0B12` tinta | **3.20** | **Falla** | Pasa (justo) |
| `#7A61F7` violeta-texto (propuesto) | `#0B0B12` tinta | 4.56 | Pasa | Pasa |
| `#FFFFFF` blanco | `#5B3DF5` violeta | 6.12 | Pasa | Pasa |
| `#FAFAF7` paper | `#5B3DF5` violeta | 5.85 | Pasa | Pasa |
| `#B6FF3B` fósforo | `#5B3DF5` violeta | 5.06 | Pasa | Pasa |
| `#0B0B12` tinta | `#5B3DF5` violeta | **3.20** | **Falla** | Pasa (justo) |
| `#0B0B12` tinta | `#FF4D6D` coral | 6.10 | Pasa | Pasa |
| `#FFFFFF` blanco | `#FF4D6D` coral | **3.21** | **Falla** | Pasa |
| `#0B0B12` tinta | `#FFB020` ámbar | 10.72 | Pasa | Pasa |
| `#FFFFFF` blanco | `#FFB020` ámbar | **1.83** | **Falla** | **Falla** |
| `#0B0B12` tinta | `#B6FF3B` fósforo | 16.21 | Pasa | Pasa |
| `#B6FF3B` fósforo | `#FFB020` ámbar | **1.51** | **Falla** | **Falla** |
| `#B6FF3B` fósforo | `#FF4D6D` coral | **2.66** | **Falla** | **Falla** |

Fósforo atenuado (para ASCII decorativo a opacidad parcial sobre tinta): 0.5 da 4.56:1, 0.6 da 6.14:1, 0.4 da 3.31:1, 0.3 da 2.33:1. El ASCII es decorativo (`aria-hidden`) y queda exento de 1.4.3 como texto, pero si se usa como etiqueta visible o estado no debe bajar de 0.5.

### Superficies elevadas sobre tinta (propuestas, [ASSUMED] como valores de diseño)

| Superficie | Blanco | quiet `#A8ACBB` | Fósforo | Violeta-texto `#8F7BFF` |
|------------|--------|-----------------|---------|--------------------------|
| `#14141F` | 18.27 | 8.08 | 15.10 | 5.61 |
| `#1B1B2A` | 16.98 | 7.51 | 14.03 | 5.21 |
| `#23233A` | 15.30 | 6.76 | 12.64 | 4.69 |

### Zona muerta del gradiente

Interpolando como lo hace CSS por defecto (sRGB) a lo largo de `#5B3DF5` a `#FF4D6D`:

| t | Color | Blanco | Tinta | Texto válido |
|---|-------|--------|-------|--------------|
| 0.00 | `#5B3DF5` | 6.12 | 3.20 | blanco |
| 0.50 | `#AD45B1` | 4.93 | 3.98 | blanco |
| 0.60 | `#BD47A3` | 4.57 | 4.29 | blanco |
| 0.65 | `#C6479D` | 4.38 | 4.47 | **ninguno** |
| 0.70 | `#CE4896` | 4.21 | 4.66 | tinta |
| 1.00 | `#FF4D6D` | 3.21 | 6.10 | tinta |

En el tramo coral a ámbar, tinta pasa en todo (6.10 a 10.72) y blanco falla en todo. La zona muerta es estrecha en el modelo estático (t entre ~0.62 y ~0.68) pero el grano de ±8% y la iluminación "silk" del shader la ensanchan. No hay un color de texto que sirva en todo el ancho.

### Reglas propuestas para el sistema

1. **Texto sobre gradiente siempre va sobre scrim `rgba(11,11,18,.6)` o sobre panel sólido tinta.** Medido con grano de peor caso (+8% de escala completa) y scrim al 50%: blanco da 10.80 sobre violeta, 9.38 sobre `#AD45B1`, 8.00 sobre coral, 6.69 sobre `#FF7E46`, 5.25 sobre ámbar. Al 60% todos mejoran. [VERIFIED: script Python en esta sesión]
2. **Botón relleno violeta:** texto blanco (6.12). **Botón relleno coral o ámbar:** texto tinta (6.10 y 10.72). Nunca texto blanco sobre coral o ámbar.
3. **Violeta como texto o enlace sobre tinta:** usar el token `--violet-text: #7A61F7` (4.56:1), que conserva el matiz. Para superficies `#23233A` usar `#8F7BFF` (4.69).
4. **Anillo de foco:** ámbar `#FFB020` (10.72 sobre tinta, 3.35 sobre violeta) o blanco (6.12 sobre violeta, 3.21 sobre coral). Evitar fósforo sobre coral o ámbar. Con el anillo ámbar doble capa (`outline` ámbar más `box-shadow` tinta) se cubre cualquier fondo.
5. **Fósforo:** solo sobre tinta o superficies elevadas (12.6 a 16.2). Como fondo de botón o badge solo con texto tinta (16.21).
6. **Borde de componente (1.4.11):** violeta `#5B3DF5` sobre tinta da 3.20, pasa por 0.20; es margen mínimo. Preferir `--violet-text` o `quiet` para bordes de input.

### Script de contraste

El plan debe incluir `tools/contrast.mjs` (Node, cero dependencias) que lea los tokens de `tokens.css`, calcule la matriz y escriba `reports/contrast.json`. `system.html` renderiza esa tabla estática (no calcula en runtime) para que se vea sin JS y quede versionada. Redondeo: no redondear hacia arriba; truncar a dos decimales antes de comparar con 4.5 y 3 [ASSUMED: ver A3].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cálculo de contraste | Estimación visual o tablas copiadas de herramientas web | `tools/contrast.mjs` con la fórmula WCAG | A11Y.md exige "computed, never estimated" y evita ratios obsoletos al cambiar un token |
| Ruido de grano estático | PNG de ruido | SVG `feTurbulence` inline como data URI (~330 B) | Sin petición de red, escala sin pérdida, mismo patrón que `GrainTexture.tsx` del sitio actual |
| Pausa por visibilidad | Temporizadores propios | `IntersectionObserver` más `visibilitychange` | Patrón estándar y ya usado por los componentes originales |
| Subset de fuentes | Editar glifos a mano | `pyftsubset` de fonttools | Reproducible y documentable |
| Servidor de pruebas con compresión | Script propio | `npx serve@14` | Ya responde brotli |
| Medición de performance | Cronómetros manuales | Lighthouse CLI ya instalado | Es la métrica del requisito PERF-03 |

**Key insight:** el mayor ahorro no viene de portar mejor, sino de no portar. Un fallback CSS bien hecho es el 80% del efecto visual a 1.3 KB gzip para los seis, y el shader solo añade movimiento.

## Common Pitfalls

### Pitfall 1: Geist Mono y Geist Sans no están donde CONTEXT.md supone
**What goes wrong:** el plan referencia `src/fonts/GeistMono.woff2` y el ejecutor no lo encuentra, o añade 71 KB de mono que el sitio rechazó deliberadamente.
**Why it happens:** CONTEXT.md dice "ya autohospedadas"; el sitio las sirve vía `next/font/google` en build y la mono ni existe como webfont.
**How to avoid:** tarea explícita "preparar `assets/fonts/`" con las URLs y comandos de subset de esta investigación.
**Warning signs:** `404` en `assets/fonts/*` en la pestaña Network; mono cayendo a `ui-monospace`.

### Pitfall 2: Lighthouse mobile no mide el shader
**What goes wrong:** se reporta "performance 100 mobile" y el shader nunca corrió.
**Why it happens:** el viewport emulado (412 px) cae bajo el gate de 767 px.
**How to avoid:** correr también `--preset=desktop` y reportar ambos; documentar qué ruta mide cada informe.
**Warning signs:** `effects.js` no aparece en `network-requests` del informe.

### Pitfall 3: Corridas atípicas de TBT
**What goes wrong:** una corrida en frío dio TBT 490 ms (perf 0.79) y las siguientes 0 a 40 ms.
**Why it happens:** sin determinar; probable compilación de shader con render por software de Chrome headless en la primera carga.
**How to avoid:** tres corridas, mediana; precalentar Chrome; si persiste, bajar escala de render a 0.5 y fps a 30 (medido: no empeora el score).
**Warning signs:** `total-blocking-time` mayor a 200 ms con `main-thread` dominado por `Rendering` o `Script Evaluation`.

### Pitfall 4: Contraste que cambia con el grano y la iluminación del shader
**What goes wrong:** el texto pasa con los colores base y falla en los píxeles más claros del shader.
**Why it happens:** el grano suma hasta ±8% y `Grainient` tiene iluminación `silk` y contraste por Lab.
**How to avoid:** scrim al 60%, y tomar el caso peor (+8% de escala) al calcular. Verificar con captura y muestreo del píxel más claro detrás de cada bloque de texto.
**Warning signs:** axe marca "needs review" en bloques sobre gradiente ([ASSUMED: ver A2]).

### Pitfall 5: CLS por fuentes y por canvas
**What goes wrong:** el H1 en Array reflowea al cargar la fuente, o el canvas empuja contenido.
**Why it happens:** `font-display: swap` sin fallback ajustado; canvas sin tamaño reservado.
**How to avoid:** `<link rel="preload" as="font" type="font/woff2" crossorigin>` para Array y Geist Sans; `@font-face` de fallback con `size-adjust` calibrado midiendo (no inventar valores); `font-display: optional` para la pixel; contenedor con `min-height` o `aspect-ratio` en CSS; canvas con `position:absolute` y `opacity` para el fade.
**Warning signs:** `cumulative-layout-shift` distinto de 0 en el informe; "Avoid large layout shifts" lista el H1.

### Pitfall 6: Licencia Commons Clause de React Bits
**What goes wrong:** se copia el JSX portado a vanilla y se publica como librería o en un repo abierto.
**Why it happens:** la licencia es MIT más Commons Clause: permite usar como parte de "una aplicación, sitio web o producto", y prohíbe vender, sublicenciar o redistribuir "los componentes mismos... solo, en bundle o como versión portada" [CITED: https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md].
**How to avoid:** escribir shaders originales mínimos "inspirados en" (decisión ya recomendada), citar el nombre del componente de origen como referencia en `system.html`, y no copiar bloques de GLSL. Si Juan quisiera portar literalmente, conservar el aviso de copyright. Esto no es asesoría legal.
**Warning signs:** archivos en `designs/` con GLSL idéntico al de `Grainient.jsx` o `CRTWarp.jsx`.

### Pitfall 7: Slats en perspectiva se ven como una franja
**What goes wrong:** la primera pasada del fallback de `MicroSlats` (plano con `rotateX(58deg)` y `height:120%`) renderiza solo una tira inferior con un brillo vertical aislado.
**Why it happens:** `transform-origin: bottom` más la máscara recortan el plano.
**How to avoid:** plano más alto que el contenedor (`height: 220%`), `rotateX` menor (45 a 50 deg), glint con `translateX` animado. Revisar con captura antes de cerrar. Visto en una captura de prueba de esta sesión.
**Warning signs:** menos del 40% del contenedor cubierto de slats.

### Pitfall 8: Contenido ASCII leído por lectores de pantalla
**What goes wrong:** el lector enuncia "punto dos puntos guion igual...".
**How to avoid:** `aria-hidden="true"` en el `<pre>` decorativo; si transmite información, dar el equivalente en texto normal al lado. `role="img"` con `aria-label` solo si el arte es significativo.

### Pitfall 9: `designs/` no está versionado
**What goes wrong:** los entregables no entran en el commit de la fase.
**Why it happens:** `git ls-files designs` devuelve vacío; `designs/` aparece como `??`.
**How to avoid:** `git add designs/redesign-v3` explícito en el plan de commit.

## Code Examples

### Tokens base (`tokens.css`)
```css
/* Valores de paleta fijados por Juan (CONTEXT.md). Derivados marcados. */
:root {
  --ink: #0B0B12;
  --violet: #5B3DF5;
  --coral: #FF4D6D;
  --amber: #FFB020;
  --phosphor: #B6FF3B;

  --paper: #FAFAF7;          /* heredado de DESIGN.md:13 */
  --quiet: #A8ACBB;          /* heredado de DESIGN.md:15 */
  --violet-text: #7A61F7;    /* derivado: 4.56:1 sobre --ink, mismo matiz */
  --ink-raised: #14141F;     /* propuesto */
  --scrim: rgba(11, 11, 18, .6);

  --grad: linear-gradient(135deg, var(--violet), var(--coral) 55%, var(--amber));

  --font-display: "Array", "Arial Narrow", system-ui, sans-serif;
  --font-body: "Geist", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Consolas, monospace;
  --font-pixel: "Pixel Label", var(--font-mono);

  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px;
  --space-5: 32px; --space-6: 48px; --space-7: 64px;
}
```

### `@font-face` (`base.css`)
```css
@font-face { font-family: "Array"; src: url("../fonts/Array-Regular.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Geist"; src: url("../fonts/Geist-latin-var.woff2") format("woff2");
  font-weight: 400 700; font-display: swap; }
@font-face { font-family: "Geist Mono"; src: url("../fonts/GeistMono-400-latin.woff2") format("woff2");
  font-weight: 400; font-display: swap; }
@font-face { font-family: "Pixel Label"; src: url("../fonts/GeistPixel-Square-upper.woff2") format("woff2");
  font-weight: 400; font-display: optional; }
h1, h2, h3 { font-synthesis: none; }
```

### Fallback grain gradient (probado, renderiza bien)
```css
.fx-grain {
  position: relative; isolation: isolate; overflow: hidden;
  background:
    radial-gradient(60% 90% at 12% 15%, var(--violet) 0, transparent 72%),
    radial-gradient(55% 80% at 88% 25%, var(--coral) 0, transparent 72%),
    radial-gradient(70% 90% at 55% 105%, var(--amber) 0, transparent 70%),
    var(--ink);
}
.fx-grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  mix-blend-mode: overlay; opacity: .45;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E");
}
.fx-grain > .fx-content { position: relative; z-index: 1; background: var(--scrim); }
```
Mismo recurso que el sitio actual: `src/components/GrainTexture.tsx` [VERIFIED: archivo leído, usa `feTurbulence` `fractalNoise` `baseFrequency='0.85'` `numOctaves='3'` con `saturate 0` y `mix-blend-overlay`].

### Fallbacks de halftone, CRT, tramado y ASCII (probados en captura)
```css
.fx-waves::before { content:""; position:absolute; inset:-20%;
  background: radial-gradient(circle, var(--phosphor) 0 1.4px, transparent 1.9px) 0 0 / 8px 8px;
  mask-image: repeating-radial-gradient(ellipse at 20% 120%, #000 0 14px, rgba(0,0,0,.15) 28px 44px);
  transform: rotate(-8deg); }
.fx-crt { border-radius: 18px / 22px; position: relative;
  background: radial-gradient(ellipse at 50% 45%, #1a2208 0, var(--ink) 80%);
  box-shadow: inset 0 0 70px rgba(182,255,59,.18), inset 0 0 0 2px #222; }
.fx-crt::after { content:""; position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 3px),
              radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.6) 100%); }
.fx-crt-text { color: var(--phosphor); text-shadow: 0 0 6px rgba(182,255,59,.6); }
.fx-pixel { background: var(--grad); image-rendering: pixelated; position: relative; }
.fx-pixel::after { content:""; position:absolute; inset:0;
  background: conic-gradient(var(--ink) 25%, transparent 0 50%, var(--ink) 0 75%, transparent 0) 0 0 / 6px 6px;
  mask-image: linear-gradient(90deg, #000, transparent 70%); }
```
Nota: la animación de scanlines se hace trasladando el pseudo-elemento (`transform`), no animando `background-position`, para quedar en el compositor.

### Gestor de slot mínimo (núcleo; el prototipo completo pesa 3.4 KB min)
```js
(function () {
  var root = document.documentElement;
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var low = function () {
    return mqReduce.matches || root.dataset.motion === 'reduced' ||
      (navigator.connection && navigator.connection.saveData) || root.dataset.saver === 'on' ||
      matchMedia('(max-width: 767px)').matches || matchMedia('(pointer: coarse)').matches;
  };
  var active = null;
  function mount(el, kind) { /* canvas absolute, getContext('webgl', {antialias:false, alpha:false,
     powerPreference:'low-power'}), triángulo único, DPR = Math.min(devicePixelRatio, 1.5),
     rAF a 30 fps; devuelve {play, pause, destroy} */ }
  function start() {
    if (low()) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          if (active && active.el !== el) { active.fx.destroy(); active.el.__fx = null; }
          el.__fx = el.__fx || mount(el, el.dataset.fx);
          if (el.__fx) { el.__fx.play(); active = { el: el, fx: el.__fx }; }
        } else if (el.__fx) { el.__fx.destroy(); el.__fx = null; if (active && active.el === el) active = null; }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-fx]').forEach(function (el) { io.observe(el); });
    document.addEventListener('visibilitychange', function () {
      if (active) { document.hidden ? active.fx.pause() : active.fx.play(); }
    });
  }
  addEventListener('load', function () {
    (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(start, { timeout: 2000 });
  });
})();
```

### Contraste (`tools/contrast.mjs`, núcleo)
```js
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Math.floor(((x + 0.05) / (y + 0.05)) * 100) / 100; };
// Leer pares desde reports/pairs.json {fg, bg, size:'normal'|'large'|'ui'}; fallar con exit 1 si alguno incumple.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Bits con `three` o `postprocessing` para fondos | Fondos en WebGL2 crudo sin dependencias (`Grainient`, `CRTWarp`, `PixelBlast`, `GradientASCII`) | Visto en `main` de `DavidHDev/react-bits` en esta sesión | No hace falta `three` ni siquiera para citar el origen; solo `PatternWaves` y `MicroSlats` mantienen `ogl` |
| Geist vía paquete npm `geist` con archivos de 70 KB sin `unicode-range` | `next/font/google` con `subsets: ['latin']` | Documentado en `src/fonts.ts:25-37` | El peso real de Geist Sans en el sitio es 29 KB, no 70 KB |
| Geist Mono como webfont | Sin webfont, mono del sistema | `src/fonts.ts:45-57` | v3 debe decidir si reintroduce 7.3 KB de Geist Mono solo para ASCII |
| Fuentes pixel de terceros (Press Start 2P, VT323) | Geist Pixel (OFL, feb 2026) | 2026-02-06 | Pareja directa con Geist, 2.4 KB subset mayúsculas |

**Deprecated/outdated:** en CONTEXT.md, "ya autohospedadas en el sitio" para Geist Mono es incorrecto; `three` ya no es necesario para ningún efecto pedido.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Array (Fontshare, Indian Type Foundry) se rige por la Free Font License cerrada de ITF: uso web libre, sin modificación ni servido a terceros | Standard Stack, fuentes | Si permite subset, se podrían ahorrar KB; si es más restrictiva, hay que revisar la copia en `designs/` |
| A2 | axe-core (motor de Lighthouse) marca como "needs review" o no evalúa el contraste de texto sobre gradientes y canvas | Pitfall 4 | Podría dar falsos pasa o falsos fallos; el plan igual debe validar con script y captura |
| A3 | WCAG no permite redondear ratios hacia arriba (4.499 no cumple) | Contraste | Muy bajo: ningún par propuesto está cerca de un umbral salvo `#5B3DF5` sobre tinta (3.20) |
| A4 | `navigator.connection.saveData` y `requestIdleCallback` no existen en Safari | Patrón de gates | Si existen, el fallback se activa menos; por eso el gate de ancho y pointer es independiente |
| A5 | Pesos de los ports vanilla de MicroSlats (canvas 2D), PixelCard y ASCII DOM: 0.6 a 1.2 KB gzip | Cómo reproducir | Solo afecta el presupuesto; medir al construir con `tools/weight.mjs` |
| A6 | Usar shaders originales "inspirados en" cumple la Commons Clause sin necesidad de atribución | Pitfall 6 | Riesgo legal bajo; Juan puede decidir citar siempre el origen |
| A7 | Valores de `size-adjust` del fallback de Array y Geist deben medirse, no se dan aquí | Pitfall 5 | CLS no nulo si se improvisan |
| A8 | El subset mayúsculas de Geist Pixel Square cubre toda etiqueta ES y EN prevista (incluye Á É Í Ñ Ó Ú Ü) | Fuente pixel | Faltan glifos y cae a Geist Mono |
| A9 | La corrida con TBT 490 ms fue un efecto de arranque en frío con render por software | Hallazgo de Lighthouse | Si es reproducible, el shader necesita menos resolución o pasar a CSS en desktop |

## Open Questions

1. **¿Se reintroduce Geist Mono solo para los bloques ASCII?**
   - Lo que sabemos: el sitio actual la rechazó (71 KB) y usa mono del sistema; la versión recortada a peso 400 ASCII + Latin-1 pesa 7.3 KB.
   - Lo que falta: decisión de Juan; CONTEXT.md la da por existente.
   - Recomendación: incluirla en `assets/fonts/` solo para v3 (7.3 KB) y marcarla como costo explícito en el reporte de pesos. Una cuadrícula ASCII necesita ancho de celda estable, que el stack del sistema no garantiza.

2. **¿Fuente pixel: Geist Pixel Square o Silkscreen?**
   - Lo que sabemos: ambas OFL, 2.4 KB y 3.5 KB.
   - Recomendación: Geist Pixel Square por coherencia con Geist; Silkscreen como plan B.

3. **¿Umbral "mobile"?**
   - El gate propuesto es `max-width: 767px` o `pointer: coarse`. Una tablet táctil de 1024 px quedaría en fallback.
   - Recomendación: mantenerlo; es la opción conservadora para PERF-03.

4. **¿Se versiona todo `designs/` o solo `designs/redesign-v3`?**
   - Hoy ningún archivo de `designs/` está en git.
   - Recomendación: versionar solo `redesign-v3` en esta fase y dejar el resto a decisión de Juan.

5. **¿Botón global "Pausar animaciones"?**
   - Es requisito de WCAG 2.2.2 (Nivel A) para efectos que corren más de 5 s. No estaba en CONTEXT.md ni en SYS-03.
   - Recomendación: incluirlo en la biblioteca de componentes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `contrast.mjs`, `weight.mjs`, Lighthouse | Sí | v24.13.0 | n/a |
| Lighthouse CLI | PERF-03 (Fase 52), validación | Sí | 13.4.1 en `node_modules/.bin` | `npx lighthouse` |
| Google Chrome | Lighthouse y capturas | Sí | `/Applications/Google Chrome.app` | Chrome de `~/.cache/puppeteer` |
| Python 3 | Servidor estático, fonttools | Sí | 3.14.7 | `npx serve@14` |
| `npx serve@14` | Servidor con brotli | Sí (descarga bajo demanda) | 14.x | `python3 -m http.server` |
| fonttools (`pyftsubset`) | Subset de fuentes | No instalado globalmente | pip en venv temporal | Usar los archivos ya recortados entregados por la fase, o Google Fonts con `&text=` |
| Acceso a red | Descargar Geist y Geist Pixel una vez | Sí | n/a | Fuentes en `.next/static/media/` (Geist Sans) |

**Missing dependencies with no fallback:** ninguna.
**Missing dependencies with fallback:** fonttools (usar venv temporal; no instalar en el sistema ni en el repo).

## Security Domain

`security_enforcement` está habilitado (ASVS nivel 1). La fase es HTML estático local sin backend, sin datos de usuario y sin secretos.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | n/a, sin sesión |
| V3 Session Management | No | n/a |
| V4 Access Control | No | n/a |
| V5 Input Validation | Parcial | El formulario de la biblioteca no debe enviar a ningún endpoint: sin `action` real, `onsubmit="return false"` o `preventDefault`, y `autocomplete` coherente |
| V6 Cryptography | No | n/a |
| V14 Configuration | Sí | Sin scripts de terceros ni CDN; todo en `assets/`; cabeceras de seguridad no aplican a mockup local |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Dependencia remota comprometida (CDN) | Tampering | Cero `<script src>` externos; fuentes y JS autohospedados |
| Formulario de mockup que filtra datos reales | Information Disclosure | Sin `action`; textos de ejemplo marcados como "pendiente"; no capturar datos |
| Exposición accidental de credenciales o `.env` al copiar archivos | Information Disclosure | La fase solo toca `designs/redesign-v3/`; revisar `git status` antes del commit |
| `innerHTML` con datos dinámicos en el ASCII | Tampering | Usar `textContent`; el contenido es generado localmente |

## Sources

### Primary (HIGH confidence)
- `https://reactbits.dev/llms.txt` : catálogo vivo, nombres, categorías, descripciones y comandos CLI
- `https://github.com/DavidHDev/react-bits/tree/main/src/content` : listado de directorios Backgrounds, Animations, TextAnimations, Components
- `https://reactbits.dev/r/<Componente>-JS-CSS.json` (Grainient, PatternWaves, CRTWarp, MicroSlats, PixelBlast, GradientASCII, PixelCard, ASCIIText, TextType, DecryptedText, ScrambledText, Waves, FaultyTerminal, Dither, LetterGlitch, GradientBlinds, PixelTrail, PixelTransition) : dependencias y tamaño de fuente
- `https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md` : MIT más Commons Clause
- `https://github.com/vercel/geist-pixel-font` y `https://vercel.com/blog/introducing-geist-pixel` : licencia OFL, variantes, publicación
- `https://www.w3.org/TR/WCAG22/` : 1.4.3, 1.4.11, 2.4.11, 2.2.2, definición de texto grande (leído parcialmente: los primeros 100,000 de 269,706 caracteres; 2.5.8 no se verificó en el texto del W3C, se cita vía A11Y.md)
- `https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md` : foco 2 px y 3:1, objetivo 24x24 y 44x44, reduced-motion por defecto, `outline: none` prohibido
- Archivos del repo leídos: `src/fonts.ts`, `src/components/GrainTexture.tsx`, `DESIGN.md` (líneas 1 a 90), `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/config.json`, `.gitignore`, `package.json` línea 58

### Secondary (MEDIUM confidence)
- Búsqueda web sobre licencia de Fontshare (sin texto oficial de Array); resultados de directorios y blogs
- Google Fonts CSS API para rutas y tamaños de Silkscreen, VT323, Pixelify Sans, Geist, Geist Mono

### Tertiary (LOW confidence)
- Comportamiento de axe con gradientes (A2) y de Safari con `requestIdleCallback` (A4): conocimiento previo, sin verificar en esta sesión

## Metadata

**Confidence breakdown:**
- Catálogo React Bits y dependencias: HIGH, índice vivo más registro JSON más código fuente
- Pesos: HIGH, medidos con esbuild y gzip en esta sesión (originales) y prototipo (vanilla)
- Contraste: HIGH, calculado; propuestas de superficie y `--violet-text` son diseño [ASSUMED]
- Fuentes y licencias: MEDIUM, Geist Pixel verificado; Array sin texto de licencia oficial
- Performance de shader en GPU real: LOW, solo se pudo medir con render por software en headless
- Pitfalls: MEDIUM

**Research date:** 2026-10-15
**Valid until:** 2026-11-15 (el catálogo de React Bits cambia con frecuencia; revalidar nombres antes de ejecutar si pasa más de un mes)
