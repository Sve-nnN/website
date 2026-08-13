# Phase 17: Hero Grainy Gradient — Performance & Mobile Verification - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Mode:** Infrastructure/verification phase — no user-facing UI change, discuss skipped (success criteria all técnicas)

<domain>
## Phase Boundary

Confirmar con evidencia real (Lighthouse en build de producción local, spot-check mobile-first) que el shader `GrainGradient` (`shape=blob`, implementado y cerrado en Phase 16) no degrada el Core Web Vitals/Performance del Hero, y que no rompe layout en ningún breakpoint.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Método exacto: mismo patrón ya usado en Phase 11-03 (`lighthouse`/`chrome-launcher`/`@puppeteer/browsers`, build de producción local — Phase 6 sigue en pausa, no hay producción real en Hostinger todavía)
- Baseline de comparación: usar el baseline pre-milestone v1.3 más reciente disponible (buscar en `.planning/phases/11-verificacion-cruzada-final/` o donde haya quedado el reporte de Lighthouse de Phase 11-03) — si no hay uno directamente comparable al Hero actual, correr Lighthouse contra el HEAD actual (post Phase 16) y documentar los números reales, sin bloquear la fase por falta de baseline histórico exacto
- Umbral de "regresión significativa": usar buen juicio — una caída de Performance de más de ~5 puntos o degradación visible de LCP/INP/CLS por el shader amerita flag; variación normal de +/-2-3 puntos entre corridas no es regresión

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/` ya tiene el patrón de runner de Lighthouse de Phase 11-03 (revisar nombre exacto del script, ej. `scripts/lighthouse-*.mjs` o similar)
- `scripts/verify-hero-grain-gradient.mjs` (Phase 16) ya verifica overflow/layout en 375/768/1280px — puede extenderse o reusarse como base, no reinventar

### Integration Points
- Nuevo script o extensión del runner de Lighthouse existente, apuntando al Hero home con el shader activo
- Build de producción local (`next build && next start`, no dev server) — el shader/WebGL debe medirse en modo producción, no en dev (dev tiene overhead de HMR que distorsiona métricas)

</code_context>

<specifics>
## Specific Ideas

Ninguna — fase de medición pura, sin decisiones de diseño.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure/verification phase.

</deferred>
