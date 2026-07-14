# Requirements — Milestone v1.8 Case Studies Content Audit & Fix

## v1 Requirements

### Case Study Content Completeness

- [ ] **CASE-01**: Los 6 case studies borrador (ids 15-20) tienen "El reto" (`challenge`) y "La solución" (`solution`) completos y no vacíos en ambos locales (en/es)
- [ ] **CASE-02**: Cada KPI mostrado en un case study (tarjetas tipo "+83%"/"+71%"/"86,000"/"22.4M") tiene un label visible que explica qué mide (ningún número suelto sin contexto)

### Anonimización

- [ ] **CASE-03**: Doc 20 (despacho penal Pittsburgh) no contiene nombre real del cliente, dominio real, condado real ni conteo de reseñas real — reemplazado por datos anonimizados consistentes con el resto de case studies

### Datos de Resultados

- [ ] **CASE-04**: `results.metrics` de cada uno de los 6 docs tiene suficientes filas reales (clics, impresiones, posición) para que el chart de antes/después no quede con 1-2 barras
- [ ] **CASE-06**: Los datos de `results.metrics` vienen de Google Search Console real (vía cualquier MCP `gsc-*` ya conectado y en vivo — no hace falta agregar propiedades nuevas) para las propiedades que respaldan cada case study — no números inventados — manteniendo el cliente anonimizado (sin branding/nombre/dominio real expuesto), y cada fila/valor de la tabla lleva su título/label visible indicando qué métrica es

### Bugs de Página (encontrados por Juan en vivo, 2026-07-14)

- [ ] **CASE-07**: La tarjeta de autor (JU / Juan Carlos Angulo / Ingeniero de Software y Consultor SEO Técnico + bio) no se duplica en la página de detalle de case study — aparece una sola vez. Bio real a usar si falta contenido: "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda. Mi trabajo combina la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack utilizando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica mediante correcciones a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe orientado a desarrolladores y profesionales de tecnología en Latinoamérica y España."
- [ ] **CASE-08**: Los 6 case studies tienen JSON-LD Schema.org correcto y dinámico por doc (no hardcodeado/genérico) — datos reales de cada caso (autor, fechas, métricas, organización) reflejados en el schema, optimizado para rich results
- [ ] **CASE-09**: El chart de resultados no mezcla métricas de escalas muy distintas en el mismo eje (ej. posición ~8 vs impresiones ~30,000) — la métrica de escala chica no debe quedar invisible; usar eje secundario, normalización, o separar en charts distintos según corresponda
- [ ] **CASE-10**: Los charts de resultados se ven correctamente en mobile (sin overflow, labels ilegibles, ni barras cortadas)
- [ ] **CASE-11**: La estructura de la página de case study se revisa contra `https://ariannalupi.com/casos/ecommerce-vape/` como referencia — se identifican y agregan secciones/elementos que falten y tengan sentido para el modelo de datos actual (sin copiar contenido, solo estructura/inspiración)

### Verificación

- [ ] **CASE-05**: El agente que ejecuta el fix devuelve el JSON crudo completo de los 6 docs corregidos (no un resumen) para que Juan lo verifique él mismo antes de dar por cerrado el milestone

## Future Requirements

(ninguno identificado — milestone acotado a corregir bugs existentes en docs 15-20)

## Out of Scope

- Publicar (`status: published`) los 6 case studies — este milestone solo corrige contenido, la decisión de publicar queda para Juan después de verificar
- Case studies fuera del rango ids 15-20
- Cambios de diseño/UI del chart de resultados (ya entregado en `fe5532c feat(case-studies): add before/after results chart via shadcn+recharts`) — solo se pobla de más datos reales

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CASE-01 | Phase 37 | Pending |
| CASE-02 | Phase 37 | Pending |
| CASE-03 | Phase 37 | Pending |
| CASE-04 | Phase 37 | Pending |
| CASE-05 | Phase 37 | Pending |
| CASE-06 | Phase 37 | Pending |
| CASE-07 | Phase 37 | Pending |
| CASE-08 | Phase 37 | Pending |
| CASE-09 | Phase 37 | Pending |
| CASE-10 | Phase 37 | Pending |
| CASE-11 | Phase 37 | Pending |

Coverage: 11/11 v1 requirements mapped. No orphans, no duplicates.
