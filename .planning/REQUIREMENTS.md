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

Coverage: 6/6 v1 requirements mapped. No orphans, no duplicates.
