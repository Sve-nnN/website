# Phase 50: Gate de Cierre de Monetización - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning
**Mode:** Auto-generado (infraestructura — fase de gate/medición puro, sin decisiones de producto)

<domain>
## Phase Boundary

El milestone v2.1 cierra probando que la monetización (Phases 44-49) no costó performance ni SEO: comparación real contra el baseline de Phase 45 sobre las mismas rutas y procedimiento, más las aserciones específicas de afiliación (disclosure, `rel=sponsored`, `/go/`, paridad de locales, `overrideAccess`) verificadas sobre HTML renderizado real, nunca por lectura de código.

Fase deliberadamente última y separada: el gate no puede vivir dentro de la fase que produce el cambio que mide (mismo patrón que Phase 32→36 en v1.7).

</domain>

<decisions>
### Claude's Discretion
Toda la fase es Claude's Discretion en cuanto a mecánica de medición (scripts a reusar de Phase 45/32/36, formato del reporte final) — los criterios de éxito ya están completamente fijados y son numéricos/verificables por el ROADMAP, no hay grey area de producto que discutir con Juan.

</decisions>

<code_context>
## Existing Code Insights

- `scripts/lighthouse-mobile.mjs`, `scripts/capture-service-page-snapshot.mjs`, `scripts/capture-head-links-snapshot.mjs` (Phase 45) — reusar el mismo procedimiento de medición contra las mismas 14 rutas del baseline.
- `.planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md`, `lh-phase45-baseline.json`, `45-baseline-content.json`, `45-baseline-headlinks.json` — el baseline real contra el que se compara.
- Todas las superficies de afiliación de Phases 46-49: `AffiliateLink`, `AffiliateDisclosure`, `/go/[slug]`, `/stack`, `AffiliateInlineBlock`, `AuditorHighlight`/`AuditorCallout` (Phase 48.5, sin `rel=sponsored` por ser producto propio), `EmailCaptureBlock`.
- `.planning/milestones/v1.7-phases/32-regression-baseline/`, `36-regression-gate/` — precedente del mismo patrón REG-01/REG-02 en el milestone anterior, referencia de formato de reporte.

</code_context>

<specifics>
## Specific Ideas

- GATE-01: sin caída de más de 5 puntos de performance, sin cruce de banda de CWV, delta de CLS 0.00, ≤5 KB de JS de cliente agregado en TODO el milestone (no por fase).
- GATE-02: cero anchors de afiliado sin `sponsored` (excepto Amazon, que va directo por policy, y el auditor, que es producto propio); disclosure antes del primer anchor de afiliado en DOM order en cada superficie; ningún link de Amazon por `/go/`; paridad de locales por dato (no inspección visual); grep de `overrideAccess: false` en todo `payload.find(` agregado en el milestone; `subscribers`/`affiliate-clicks`/`lead-magnets` fuera de `mcpPlugin` y `SITEMAP_COLLECTIONS`.

</specifics>

<deferred>
## Deferred Ideas

Ninguna — última fase del milestone.

</deferred>
