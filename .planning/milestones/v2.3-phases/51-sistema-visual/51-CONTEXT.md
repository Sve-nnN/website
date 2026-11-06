# Phase 51: Sistema visual - Context

**Gathered:** 2026-10-15
**Status:** Ready for planning
**Mode:** Decisiones tomadas por Juan en la sesión de shape previa; sin ronda adicional de discuss.

<domain>
## Phase Boundary

Entregar `designs/redesign-v3/system.html`: tokens, tipografía, escala, biblioteca de componentes en HTML, catálogo de efectos contra reactbits.dev y fallbacks CSS estáticos. Solo HTML/CSS/JS estático bajo `designs/redesign-v3/`. Cero cambios en `src/`, Payload, schema, base de datos ni `package.json`.

</domain>

<decisions>
## Implementation Decisions

### Dirección visual (fijada por Juan)
- Estética: ASCII, pixel, grainy gradient. Componentes inspirados en React Bits: gradientes, micro slats, pattern waves, CRT warp.
- Paleta nueva: negro tinta `#0B0B12`; gradiente grainy violeta `#5B3DF5` a coral `#FF4D6D` a ámbar `#FFB020`; verde fósforo `#B6FF3B` solo para ASCII, cursores y estados.
- Juan eligió "nueva paleta con gradientes" y efectos en varias secciones.

### Performance (requisito del sitio)
- Máximo 1 shader/canvas activo a la vez y 2 por página; el resto CSS o SVG.
- Efectos pesados cargan después de LCP, solo al entrar al viewport, y se pausan al salir.
- Fallback estático CSS (gradiente + ruido SVG) para mobile, `prefers-reduced-motion` y `saveData`. DPR limitado a 1.5.
- Sin dependencias de CDN pesadas ni `three` completo; si hace falta WebGL, escribir un shader vanilla mínimo.

### Tipografía
- Titulares y cuerpo: Array y Geist Sans (ya autohospedadas en el sitio). Mono: Geist Mono para ASCII. Fuente pixel solo para etiquetas cortas, autohospedada y con subset.

### Accesibilidad
- WCAG 2.2 AA y A11Y.md. Cada par texto/fondo con ratio calculado. ASCII decorativo `aria-hidden`.

### Decisiones post-investigación (defaults del orquestador, Juan puede revertir en la revisión)
- Fuentes: el contexto asumía Geist Sans/Mono autohospedadas y es falso. Solo Array está en el repo. Se prepara `designs/redesign-v3/assets/fonts/`: Geist Sans (29 KB), Geist Mono recortada a ASCII + Latin-1 (7.3 KB, solo para ASCII) y Geist Pixel Square subset (2.4 KB, OFL; plan B Silkscreen). No se recorta Array.
- Licencia: React Bits es MIT + Commons Clause. No se copia su GLSL; se escriben shaders originales mínimos. Los nombres de origen sí se documentan (Grainient, PatternWaves, CRTWarp, MicroSlats, PixelBlast, PixelCard, GradientASCII, ASCIIText).
- Un solo WebGL permanente: Grainient mínimo. CRTWarp, PatternWaves y MicroSlats van en CSS en producción y como demo opt-in en `system.html`.
- ASCII como `<pre aria-hidden>` usando solo `.:-=+*#%@` (Geist Mono no tiene bloques).
- Contraste: texto nunca directo sobre el gradiente; siempre scrim de tinta >= 50% o panel sólido. `--violet-text: #7A61F7` (4.56:1) para texto violeta. Fósforo solo sobre tinta.
- WCAG 2.2.2: se agrega componente "Pausar animaciones" (`aria-pressed`) a SYS-03.
- Versionado: `git add designs/redesign-v3` explícito; no se versiona el resto de `designs/`.
- Lighthouse: `node_modules/.bin/lighthouse` ya instalado, mediana de 3 corridas, mobile y desktop. Servir con `npx serve@14`.
- Simulación de reduced-motion/saveData con `data-motion="reduced"` y `data-saver="on"`.

### Claude's Discretion
- Estructura de archivos dentro de `designs/redesign-v3/` (CSS compartido, JS de efectos, assets).
- Implementación vanilla de cada efecto de React Bits (los componentes originales son React; el mockup es estático, se portan a vanilla o se aproximan con CSS).
- Nombre exacto de cada componente de origen: verificar contra el catálogo real de reactbits.dev, no asumir. Si un efecto pedido no existe con ese nombre (por ejemplo "micro slats"), documentar el equivalente más cercano.
- Herramienta para calcular contraste y para medir peso.

</decisions>

<code_context>
## Existing Code Insights

- Sistema incumbente: `DESIGN.md`, `designs/DESIGN-SYSTEM.md`, `designs/current-site-real.pen` (referencia de qué se reemplaza, no autoridad).
- Ya existe `HeroGrainGradient` con `@paper-design/shaders-react` y `GrainTexture` en `src/components`; son evidencia del grano actual, no se tocan.
- Tailwind 3.4, Next 15, fuentes Array/Khand/Geist ya en el proyecto.

</code_context>

<specifics>
## Specific Ideas

- Juan citó: gradientes, micro slats, pattern waves, CRT warp, estética ASCII, pixel y grainy gradient.
- Referencia: https://reactbits.dev/get-started/index

</specifics>

<deferred>
## Deferred Ideas

- Implementación en Next.js + Payload (milestone posterior, requiere aprobación de Juan sobre los mockups).
- Páginas distintas de la home: fases 53 a 55, tras la aprobación de la fase 52.

</deferred>
