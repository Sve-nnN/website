# Phase 16: Hero Grainy Gradient — Implementation - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Fondo del Hero home (`variant: 'home'`) reemplazado por `GrainGradient` de `@paper-design/shaders-react` (WebGL, ~5KB zero-dependency). Título/subtítulo/CTAs/breadcrumbs sin cambios. Respeta `prefers-reduced-motion`.

</domain>

<decisions>
## Implementation Decisions

### Research previo (hecho en conversación, antes de abrir el milestone)
- **anime.js descartado**: librería de tweening (animar propiedades DOM/CSS en el tiempo), no genera shaders ni ruido/grain — no es la herramienta correcta para este efecto
- **three.js / ShaderGradient descartados**: three.js completo pesa ~150KB+ min+gzip, `ShaderGradient`/`@shadergradient/react` arrastra `three` + `@react-three/fiber` + `three-stdlib` como dependencias — contradice el presupuesto de performance del propio Hero (anuncia "Performance 100" en su copy)
- **CSS puro (SVG `feTurbulence`)** considerado como alternativa más conservadora (0 KB JS) pero no elegido — Juan confirmó preferencia por `GrainGradient`
- **Elegido: `@paper-design/shaders-react` → componente `GrainGradient`** — ~5KB, zero-dependency, WebGL nativo, ~2-5% uso de GPU en hardware moderno (comparable a reproducir un video), componente construido literalmente para este caso de uso

### Parámetros técnicos
- Colores: 2-3 stops tomados directo de `globals.css` (`--primary` ember, `--secondary` navy actual del Hero, tono intermedio derivado) — no colores nuevos inventados
- Intensidad: grano sutil, movimiento lento — tono profesional/B2B, no experimental
- Campo `media` (upload opcional) del Hero: se mantiene en el schema (uso futuro/otras variantes), pero el shader lo tapa completamente en `variant: 'home'` — no se borra el campo
- Paquete: `npm install @paper-design/shaders-react` — instalación única, sin peer deps de three.js/R3F
- Renderizado: shader aislado en un Client Component propio (`'use client'`), el resto de `HeroComponent` sigue siendo Server Component — minimiza el JS que cruza al cliente

### Revisión post-implementación (2026-07-12, Juan vio el resultado en vivo)

Primera pasada (`shape="wave"`) funcionalmente correcta (4/4 verificado, screenshots reales) pero Juan pidió 2 cambios de diseño antes de cerrar la fase, con una imagen de referencia: una única cinta/ribbon de luz curva (ember→navy) sobre fondo casi negro, mucho más negative-space que la ola actual, más "light streak" que "gradiente que cubre media sección". Además pidió que reaccione al mouse.

**Investigación técnica (tipos reales instalados, `node_modules/@paper-design/shaders/dist/shaders/grain-gradient.d.ts` y `shader-sizing.d.ts`, no la doc web — más confiable):**
- `GrainGradientParams` soporta 7 `shape`: `wave`, `dots`, `truchet`, `corners`, `ripple`, `blob`, `sphere` — `ripple` o `blob` son mejores candidatos visuales que `wave` para una cinta curva única; probar ambos y comparar contra la referencia antes de fijar uno
- `GrainGradientParams extends ShaderSizingParams` — confirma props reales `offsetX`/`offsetY`/`rotation`/`scale`/`fit`/`worldWidth`/`worldHeight` (uniforms `u_offsetX`, `u_offsetY`, `u_rotation`, `u_scale`), todos números simples
- **No existe ningún prop nativo de mouse/pointer** en la librería (confirmado, sin `onPointerMove` ni equivalente documentado en los tipos) — ver "Reactividad al mouse — REVERTIDA" más abajo
- `colorBack` (fondo) puede ir a un negro casi puro (`#0a0a0f` o similar, no negro absoluto para mantener algo de la identidad navy) para lograr el look de "cinta sobre fondo oscuro" de la referencia, en vez del navy sólido actual

**Nueva decisión:**
- Retunear `HeroGrainGradient.tsx`: probar `shape="ripple"` y `shape="blob"` contra la referencia (screenshot comparison), quedarse con el que más se acerque — **resultado: `ripple` elegido.** El patrón de anillos concéntricos de `ripple` irradia desde un centro fijo, por lo que `offsetX`/`offsetY` estáticos pueden dejar ese centro justo fuera del cuadro, mostrando un único arco curvo estable. `blob` genera varios puntos calientes que orbitan de forma independiente (trayectorias basadas en tiempo, hardcodeadas en el shader), a menudo invisibles del todo con la paleta de marca (tonos navy cercanos entre sí) y sin control de posición fiable — no sirve para una cinta única y estable.
- `colorBack` se oscurece hacia casi-negro (`#0A0A0F`) para el efecto "ribbon sobre fondo oscuro" de la referencia
- `offsetX`/`offsetY` fijos (no dinámicos) posicionan el centro del `ripple` fuera del cuadro para dejar un solo arco curvo visible, con mucho negative space alrededor

**Reactividad al mouse — REVERTIDA (mismo día, tras probarla en vivo):**
- Se implementó reactividad real al mouse (no simulada): listener de `pointermove` en el contenedor del Hero, posición normalizada del cursor mapeada a `offsetX`/`offsetY` vía React state con throttle por `requestAnimationFrame`, respetando `prefers-reduced-motion` (reactividad desactivada junto con la animación base) y filtrando `pointerType !== 'mouse'` (sin reactividad en touch/mobile). Verificado funcionando de verdad (el centro de la cinta se movía siguiendo el cursor en capturas reales).
- Juan probó el resultado en vivo y **pidió quitarla por completo** — no la quiere en el Hero ni en ningún otro componente futuro (se había considerado evaluar agregarla a otros lados después; esa idea también queda descartada).
- Se revirtió el listener de `pointermove`, el estado de posición del cursor, y el binding de `offsetX`/`offsetY`/`rotation` al mouse. El shader quedó con su animación de tiempo normal (`speed`) únicamente, sin ningún tracking de puntero. `offsetX`/`offsetY` volvieron a ser valores estáticos (los mismos usados para posicionar la cinta fuera de cuadro), no dinámicos.
- Mobile: sin mouse real de todas formas — el shader mobile mantiene su comportamiento animado (sin reactividad), consistente con que "reactivo al mouse" era un concepto de desktop que ya no aplica en absoluto tras el revert.

### Claude's Discretion
- Nombre exacto del archivo/componente del wrapper client-side del shader
- Valores numéricos exactos de los parámetros del shader (speed/scale/colorBack, según la API real de `GrainGradient` — verificar en la documentación del paquete al implementar)
- Manejo exacto de `prefers-reduced-motion` (pausar animación vs renderizar frame estático vs fallback a gradiente CSS simple) — cualquiera de estas satisface HERO-ANIM-04, elegir la más simple de implementar con la API real del componente

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/blocks/Hero/Component.tsx` — Server Component actual, `variant === 'home'` ya identificado como el branch a modificar; fondo hoy es `bg-secondary` sólido + imagen opcional al 30% opacity (sin uso real en home)
- `globals.css` — tokens ember/navy ya definidos desde Phase 7 (`--primary`, `--secondary`, y las variantes `.dark`)
- Regla global `prefers-reduced-motion` ya existe desde Phase 7 (UI-02) — reusar el mismo mecanismo

### Established Patterns
- Client Components aislados para lo estrictamente interactivo/animado, resto del árbol como Server Component (patrón ya implícito en el proyecto — Payload/Next App Router)

### Integration Points
- `src/blocks/Hero/Component.tsx` — modificar branch `isHome`
- Nuevo componente client-side (ej. `src/components/HeroGrainGradient.tsx`)
- `package.json` — nueva dependencia `@paper-design/shaders-react`

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia visual pixel-específica — "sutil, profesional, colores de marca ya definidos" es el criterio.

</specifics>

<deferred>
## Deferred Ideas

None — discusión se mantuvo dentro del alcance de la fase.

</deferred>
