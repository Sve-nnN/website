# Requirements — Milestone v1.8 Case Studies Content Audit & Fix

## v1 Requirements

### Case Study Content Completeness

- [ ] **CASE-01**: Los 6 case studies borrador (ids 15-20) tienen "El reto" (`challenge`) y "La solución" (`solution`) completos y no vacíos en ambos locales (en/es)
- [ ] **CASE-02**: Cada KPI mostrado en un case study tiene un label que explica qué mide (ningún número suelto tipo "+83%" sin contexto)

### Anonimización

- [ ] **CASE-03**: Doc 20 (despacho penal Pittsburgh) no contiene nombre real del cliente, dominio real, condado real ni conteo de reseñas real — reemplazado por datos anonimizados consistentes con el resto de case studies

### Datos de Resultados

- [ ] **CASE-04**: `results.metrics` de cada uno de los 6 docs tiene suficientes filas reales (clics, impresiones, posición) para que el chart de antes/después no quede con 1-2 barras
- [ ] **CASE-06**: Los datos de `results.metrics` vienen de Google Search Console real (vía MCP `gsc-juan-*`) para las propiedades que respaldan cada case study — no números inventados — manteniendo el cliente anonimizado (sin branding/nombre/dominio real expuesto)

### Verificación

- [ ] **CASE-05**: El agente que ejecuta el fix devuelve el JSON crudo completo de los 6 docs corregidos (no un resumen) para que Juan lo verifique él mismo antes de dar por cerrado el milestone

## Future Requirements

(ninguno identificado — milestone acotado a corregir bugs existentes en docs 15-20)

## Out of Scope

- Publicar (`status: published`) los 6 case studies — este milestone solo corrige contenido, la decisión de publicar queda para Juan después de verificar
- Case studies fuera del rango ids 15-20
- Cambios de diseño/UI del chart de resultados (ya entregado en `fe5532c feat(case-studies): add before/after results chart via shadcn+recharts`) — solo se pobla de más datos reales

## Traceability

(a completar por el roadmapper)
