# Phase 27: Micro-animation Library Adoption - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Mode:** Infrastructure phase — smart discuss skipped. Goal is a technical adoption decision ("librería queda decidida, instalada y validada"), all 3 success criteria are technical (installed, bundle measured, hook exists), no user-facing "ve/muestra" language — this phase adds no visible animation yet, that's Phase 28.

<domain>
## Phase Boundary

La librería `motion` queda instalada y wireada a través de un provider raíz, su costo real de bundle medido contra un build de producción, y existe un hook compartido `useReducedMotion()` SSR-safe usado por 2-3 componentes piloto (MOTION-01, MOTION-02). No incluye el rollout completo a todos los componentes (Phase 28).

</domain>

<decisions>
### Claude's Discretion
Decisión técnica ya resuelta por el research v1.6 (`.planning/research/STACK-v1.6.md`), no hay ambigüedad de producto:
- Librería: `motion` (paquete npm `motion`), vía `LazyMotion`+`m`+`domAnimation` — no GSAP (más pesado, imperativo, aunque gratis desde 2025) ni Anime.js v4 (sin bindings de React, `ScrollObserver` inmaduro).
- Costo esperado: ~19-20KB gzip total pagado una sola vez en el provider raíz.
- `whileInView`/`useInView` de Motion están confirmados basados en IntersectionObserver (docs oficiales) — usar ese mecanismo para scroll-reveal, no un listener de scroll manual.
- `useReducedMotion()` debe seguir el mismo patrón SSR-safe ya probado en `HeroGrainGradient.tsx` (Phase 16: estado inicial `false` en servidor y cliente, lectura de `matchMedia`/preferencia real solo dentro de `useEffect`) — evita el bug de hydration mismatch ya documentado en el historial del proyecto. Motion tiene su propio `<MotionConfig reducedMotion="user">` a nivel de provider, evaluar en plan-phase si reemplaza la necesidad de un hook custom o si conviene igual un hook fino sobre él para los casos que no pasan por `m.*` components.
- Componentes piloto sugeridos por el research: 2-3 elementos ya tocados en Phase 26 (ej. FAQ cards, testimonials) — a discreción del planner cuáles, siempre que sean representativos (uno con scroll-reveal, uno con hover).
- Medición de bundle real: usar `next build` antes/después y diffar el tamaño de chunk del provider raíz (o `@next/bundle-analyzer` si ya está instalado, verificar primero) — no solo confiar en el número de research.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/HeroGrainGradient.tsx` — patrón SSR-safe de detección de preferencia de usuario ya probado y verificado, replicar la misma disciplina para `useReducedMotion()`.
- Tokens de motion de Phase 7 (`--duration-fast/base/slow`, `--ease-out/standard` en `tailwind.config.ts`) — Motion's `transition` prop debe consumir estos valores, no inventar timings nuevos.

### Established Patterns
- Componentes cliente aislados (`'use client'`) para lo que requiere estado/efectos de browser, dejando el resto del árbol como Server Components — mismo patrón que `HeroGrainGradient`, `LocaleSwitcher`, `SiteHeaderChrome` (Phase 26).

### Integration Points
- Provider raíz: probablemente `src/app/(frontend)/[locale]/layout.tsx` o un nuevo componente cliente wrapeado ahí (evaluar en plan-phase el punto exacto de menor blast-radius).
- `package.json` (nueva dependencia `motion`).

</code_context>

<specifics>
## Specific Ideas

Ninguna — decisión técnica ya resuelta por research, sin ambigüedad de producto.

</specifics>

<deferred>
## Deferred Ideas

Rollout completo de animaciones a todos los componentes de Phase 26 y a Hero variants/grillas de blog — explícitamente Phase 28, no esta fase.

</deferred>
