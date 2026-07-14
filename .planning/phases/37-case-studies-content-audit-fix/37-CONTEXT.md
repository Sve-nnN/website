# Phase 37: Case Studies Content Audit & Fix - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Los 6 case studies borrador (ids 15-20) quedan corregidos de punta a punta: contenido bilingüe completo, KPIs y filas de `results.metrics` con label visible, doc 20 anonimizado, chart de resultados legible (escalas + mobile), autor sin duplicar, JSON-LD dinámico por doc, y estructura revisada contra `ariannalupi.com/casos/ecommerce-vape` como referencia. Cubre CASE-01 a CASE-11.

</domain>

<decisions>
## Implementation Decisions

### Autor Duplicado (CASE-07)
- Causa raíz confirmada en código: `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` renderiza `AuthorByline` y `AuthorCard` apilados (líneas ~243-249) — ambos muestran avatar/nombre/jobTitle, la card además la bio y credenciales.
- Fix: quitar `AuthorByline` de esta página, dejar solo `AuthorCard` (mismo patrón que la author page). No tocar `AuthorByline` en otros lugares (cards de listado, etc.) donde no duplica nada.

### Chart de Resultados — Escala y Mobile (CASE-09, CASE-10)
- Causa raíz confirmada en código: `src/components/CaseStudyResultsChart.tsx` usa un solo `YAxis` lineal compartido por todas las filas de `metrics` — una métrica de escala chica (ej. posición ~8) queda invisible junto a una de escala grande (ej. impresiones ~30,000).
- Fix: agrupar métricas por orden de magnitud y usar eje Y secundario (`yAxisId`) para las de escala distinta dentro del mismo chart — no normalizar a porcentaje (se pierde la magnitud real que Juan quiere mostrar).
- Mobile: revisar `ChartContainer`/`BarChart` con varias filas — evitar overflow, labels ilegibles o barras cortadas en viewport angosto (< 400px). Verificar en vivo, no solo por código.

### Datos GSC Reales (CASE-04, CASE-06)
- Cuentas MCP a usar: **solo `gsc-juan-*`, `gsc-arianna-*` y `gsc-javier-*`** — NO usar `gsc-josedavid-*` ni `gsc-souma-*` (no son clientes de este proyecto).
- Doc 20 (despacho penal Pittsburgh) ya tiene propiedad real confirmada: `www.pittsburghcriminalattorney.com` vía `gsc-javier-*`.
- Para los otros 5 docs (ids 15-19): el ejecutor debe leer cada doc (sector, contexto de cliente, métricas ya cargadas) e inferir/buscar la propiedad real más parecida entre las 3 cuentas permitidas, documentando qué propiedad mapeó a qué doc en el resultado final para que Juan lo verifique.
- El cliente sigue anonimizado en el copy (sin exponer nombre/dominio real) aunque los números detrás vengan de una propiedad real.

### Schema JSON-LD (CASE-08)
- Auditar el `creativeWorkData` que arma cada page.tsx de case study: confirmar que usa datos reales por doc (autor, fechas, métricas) y no valores hardcodeados/genéricos compartidos entre docs. Corregir donde falte.

### Benchmark de Estructura (CASE-11)
- Revisar `https://ariannalupi.com/casos/ecommerce-vape/` solo como referencia de estructura/secciones — no copiar contenido.
- Mantener el modelo de datos actual (KPIs/reto/solución/resultados); agregar SOLO secciones/piezas que falten y calcen con ese modelo sin rehacer el layout completo.

### Claude's Discretion
- Detalle exacto de qué propiedad GSC mapea a cada uno de los ids 15-19 (dentro de las 3 cuentas permitidas).
- Implementación técnica exacta del eje Y secundario en Recharts (agrupación de métricas por magnitud).
- Alcance fino de qué secciones agregar tras el benchmark contra ariannalupi.com/casos.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/CaseStudies/index.ts` — `kpis[].label` y `results.metrics[].label` YA existen como campos required en el schema. El bug de "KPI sin label" es de POBLACIÓN DE DATOS en los 6 docs, no de schema/frontend — el frontend ya renderiza `kpi.label` (page.tsx línea 157) y `metric.label` (línea ~222).
- `src/components/AuthorCard.tsx` — ya soporta `asPageHeading`, bio, credenciales, avatar; es el componente a mantener solo en la página de case study.
- `src/components/CaseStudyResultsChart.tsx` — `parseLeadingNumber()` ya maneja sufijos k/m/ms/%; solo falta el eje secundario por magnitud.
- Prior intento fallido: `scripts/tmp-inspect-case-studies.ts` (Local API script vía `npx payload run`) — devolvió salida vacía en el shell de Juan. NO reutilizar ese camino sin verificar primero que produce output real.
- Dev server corriendo en `localhost:3000`; MCP server `juan-payload` configurado en `.mcp.json`/`.claude.json` del proyecto (`http://localhost:3000/api/mcp`, bearer token en config) — preferir esta vía para leer/escribir los 6 docs. Si las tools del MCP `juan-payload` no aparecen disponibles en la sesión del ejecutor, verificar conexión antes de asumir que funciona.

### Established Patterns
- Author page (`authors/[slug]/page.tsx`) usa `AuthorCard` con `asPageHeading` sin `AuthorByline` adicional — mismo patrón a replicar en case-studies.
- Recharts + shadcn `ChartContainer`/`ChartConfig` ya wireados (Phase reciente `fe5532c`).

### Integration Points
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — punto único de fix para autor duplicado y auditoría de JSON-LD.
- `src/components/CaseStudyResultsChart.tsx` — punto único de fix para escala/mobile.
- Los 6 docs (ids 15-20, colección `case-studies`) — vía Payload MCP o vía admin/API REST si el MCP no responde.

</code_context>

<specifics>
## Specific Ideas

- Bio real de Juan a usar donde falte contenido de autor: "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda. Mi trabajo combina la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack utilizando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica mediante correcciones a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe orientado a desarrolladores y profesionales de tecnología en Latinoamérica y España." (usar solo si `author.bio` está vacío en el doc real de Juan — no pisar contenido real si ya existe).
- Ejemplos concretos de números mezclados dados por Juan: "+83%", "+71%", "86,000", "22.4M" (KPIs) y "47,108" / "86,000" / "13.1M" / "22.4M" / "36.3" / "19.2" (tabla de métricas) — todos necesitan label visible.
- Ejemplo concreto de escala mezclada: posición ~8 vs impresiones ~30,000 en el mismo eje.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
