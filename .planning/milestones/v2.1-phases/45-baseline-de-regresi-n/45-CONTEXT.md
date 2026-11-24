# Phase 45: Baseline de Regresión - Context

**Gathered:** 2026-08-30
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — 2 áreas presentadas, ambas aceptadas por Juan sin cambios

<domain>
## Phase Boundary

Esta fase mide y no cambia nada. Produce la foto del estado actual del sitio contra la cual va a comparar el gate de cierre de la Phase 50: Lighthouse mobile, H1, JSON-LD, canonical/hreflang, el snapshot de Search Console y el tráfico real con número. Ninguna fase que altere un byte renderizado puede empezar antes de que esta cierre, así que el criterio de `git diff src/` vacío no es una formalidad: es la razón de ser de la fase.

Queda fuera: cualquier cambio de código, de contenido o de schema; abrir cuentas; postular a programas de afiliados; construir la página de stack.

**Bloqueo levantado el 2026-08-30.** La fase estaba marcada BLOQUEADA por dos dependencias externas y las dos murieron. "Neon caído" quedó obsoleto porque la base de producción migró a Dokploy y `juan-tech.com` responde 200 con TTFB de 0,92s. La falta de proyecto en Ahrefs dejó de importar porque el acceso a Search Console llega por las herramientas `gsc-juan-*` del hub MCP, con `sc-domain:juan-tech.com` como siteOwner.

</domain>

<decisions>
## Implementation Decisions

### Alcance y método del baseline
- Entran las 14 rutas que pide el criterio 1: `/`, `/en`, las 4 landings de servicio en `/servicios/{slug}` y `/en/services/{slug}`, y las 2 geo `/seo-tecnico-madrid` y `/seo-tecnico-lima` con sus variantes `/en/`. Confirmar la resolución de cada una por curl antes de medir, porque `/es` redirige a `/` por el `localePrefix: 'as-needed'` de next-intl.
- Lighthouse se corre solo en mobile, igual que las Phases 32 y 36, para que el gate de la Phase 50 compare contra la misma serie.
- Se reusan los scripts que ya existen y están probados: `scripts/lighthouse-mobile.mjs` y `scripts/capture-service-page-snapshot.mjs`, que ya acepta `--base-url` y `--routes`. No se escribe un capturador nuevo.
- La medición va contra producción live, `https://juan-tech.com`, que es lo que ven Google y los usuarios y es el mismo blanco contra el que va a comparar la Phase 50. No se levanta build local.
- Tres corridas por ruta, y se guarda la mediana. Contra producción hay ruido de red que una sola corrida no filtra; las Phases 32 y 36 midieron contra localhost, donde una alcanzaba.

### El número V y los artefactos
- La incógnita `V` del modelo de DEC-02 son visitas a la página de stack, que todavía no existe. Se escriben los dos números por separado y sin mezclarlos: el tráfico orgánico real del sitio medido en Search Console, y `V(stack) = 0` a la fecha, con el supuesto de qué fracción del tráfico podría llegar ahí declarado explícitamente como supuesto y no como medición.
- Los artefactos viven en el directorio de la fase, mismo patrón que la Phase 32: un `45-REGRESSION-BASELINE.md` legible, más `lh-phase45-baseline.json`, `45-baseline-content.json` y el snapshot de GSC en JSON.
- `DECISIONS.md` de la Phase 44 se actualiza reemplazando la incógnita por el número real con su fecha, pero la tabla paramétrica queda intacta para poder recalcular cuando el tráfico cambie.
- Ventana de Search Console: 28 días, 2026-07-31 a 2026-08-27, contra los 28 previos (2026-07-03 a 2026-07-30). Es la misma ventana que usó la auditoría de agosto, así las dos series son comparables.

</decisions>

<code_context>
## Existing Code Insights

- `scripts/lighthouse-mobile.mjs` — corre Lighthouse en form factor mobile vía Chrome-for-Testing. Es el que produjo `lh-phase32-baseline.json` y `lh-phase28-baseline.json`.
- `scripts/capture-service-page-snapshot.mjs` — script ESM independiente, sin importar Payload ni tocar la base. Hace fetch de una lista de URLs y extrae todos los `<h1>` y todos los bloques `<script type="application/ld+json">`, y escribe un JSON por path. Acepta `--base-url` y `--routes`, así que apunta a producción sin modificarlo.
- `.planning/milestones/v1.7-phases/32-regression-baseline/32-REGRESSION-BASELINE.md` — el formato exacto a replicar: tabla de Lighthouse con bandas de LCP/CLS/TBT declaradas, tabla de H1/JSON-LD, y los JSON crudos referenciados por nombre.
- El acceso a Search Console no está disponible como herramienta MCP nativa en esta sesión: el cliente hizo timeout con mcp-hub al arrancar. El servidor sí responde. Se llega por JSON-RPC directo sobre HTTP contra la URL y el token de `mcp-hub` en `~/.claude.json`. Las herramientas útiles son `gsc-juan-compare-search-periods` (acepta `site_url`, los cuatro bordes de fecha, `dimensions` y `limit`) y `gsc-juan-get-search-by-page-query`. Si Juan reconecta con `/mcp`, quedan disponibles de forma nativa y es el camino preferible.

</code_context>

<specifics>
## Specific Ideas

- El dato duro que ya se conoce y el baseline debe confirmar: en la ventana medida hay 190 páginas con métricas, y el canibalismo entre URL vieja y canónica sigue vivo. `/blog/pilas-y-colas` (vieja) tiene 150 impresiones contra 48 de `/blog/cs-fundamentals/pilas-y-colas` (canónica).
- CrUX no tiene datos de campo para este dominio por falta de tráfico, según la auditoría del 2026-08-25. El baseline debe decirlo en lugar de dejar celdas vacías, porque en la Phase 50 la ausencia de datos de campo se va a repetir y no debe leerse como una regresión.
- La auditoría del 2026-08-25 midió la home en 94 de PageSpeed Insights tras el trabajo de rendimiento (LCP 7,9s a 2,63s, TBT 620ms a 156ms, TTFB 3,82s a 0,12s). Si Lighthouse mobile contra producción devuelve algo muy por debajo de eso, es señal de que la medición está mal montada, no de que el sitio se rompió.

</specifics>

<deferred>
## Deferred Ideas

- Dar de alta `juan-tech.com` como proyecto en Ahrefs. Sería el camino duradero y repetible para el gate de la Phase 50, pero requiere acción de Juan y el hub MCP ya cubre la necesidad de esta fase.
- Reconectar mcp-hub con `/mcp` para tener las herramientas de Search Console como tools nativas en vez de por JSON-RPC directo.

</deferred>
