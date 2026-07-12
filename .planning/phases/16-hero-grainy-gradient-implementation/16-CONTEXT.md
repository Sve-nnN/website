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
