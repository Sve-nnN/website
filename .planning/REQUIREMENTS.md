# Requirements

> Dos milestones activos en paralelo: v1.8 quedó en cola a mitad de Phase 37 (CONTEXT.md + UI-SPEC.md ya aprobados, falta plan/execute) cuando Juan pidió abrir v1.9 con prioridad. Se preserva la sección v1.8 completa para retomarla después — no se archivó porque no cerró.

## Milestone v1.8 — Case Studies Content Audit & Fix (ids 15-20) — EN COLA

### v1 Requirements

#### Case Study Content Completeness

- [ ] **CASE-01**: Los 6 case studies borrador (ids 15-20) tienen "El reto" (`challenge`) y "La solución" (`solution`) completos y no vacíos en ambos locales (en/es)
- [ ] **CASE-02**: Cada KPI mostrado en un case study (tarjetas tipo "+83%"/"+71%"/"86,000"/"22.4M") tiene un label visible que explica qué mide (ningún número suelto sin contexto)

#### Anonimización

- [ ] **CASE-03**: Doc 20 (despacho penal Pittsburgh) no contiene nombre real del cliente, dominio real, condado real ni conteo de reseñas real — reemplazado por datos anonimizados consistentes con el resto de case studies

#### Datos de Resultados

- [ ] **CASE-04**: `results.metrics` de cada uno de los 6 docs tiene suficientes filas reales (clics, impresiones, posición) para que el chart de antes/después no quede con 1-2 barras
- [ ] **CASE-06**: Los datos de `results.metrics` vienen de Google Search Console real (vía cualquier MCP `gsc-*` ya conectado y en vivo — no hace falta agregar propiedades nuevas) para las propiedades que respaldan cada case study — no números inventados — manteniendo el cliente anonimizado (sin branding/nombre/dominio real expuesto), y cada fila/valor de la tabla lleva su título/label visible indicando qué métrica es

#### Bugs de Página (encontrados por Juan en vivo, 2026-07-14)

- [ ] **CASE-07**: La tarjeta de autor (JU / Juan Carlos Angulo / Ingeniero de Software y Consultor SEO Técnico + bio) no se duplica en la página de detalle de case study — aparece una sola vez. Bio real a usar si falta contenido: "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda. Mi trabajo combina la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack utilizando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica mediante correcciones a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe orientado a desarrolladores y profesionales de tecnología en Latinoamérica y España."
- [ ] **CASE-08**: Los 6 case studies tienen JSON-LD Schema.org correcto y dinámico por doc (no hardcodeado/genérico) — datos reales de cada caso (autor, fechas, métricas, organización) reflejados en el schema, optimizado para rich results
- [ ] **CASE-09**: El chart de resultados no mezcla métricas de escalas muy distintas en el mismo eje (ej. posición ~8 vs impresiones ~30,000) — la métrica de escala chica no debe quedar invisible; usar eje secundario, normalización, o separar en charts distintos según corresponda
- [ ] **CASE-10**: Los charts de resultados se ven correctamente en mobile (sin overflow, labels ilegibles, ni barras cortadas)
- [ ] **CASE-11**: La estructura de la página de case study se revisa contra `https://ariannalupi.com/casos/ecommerce-vape/` como referencia — se identifican y agregan secciones/elementos que falten y tengan sentido para el modelo de datos actual (sin copiar contenido, solo estructura/inspiración)

#### Verificación

- [ ] **CASE-05**: El agente que ejecuta el fix devuelve el JSON crudo completo de los 6 docs corregidos (no un resumen) para que Juan lo verifique él mismo antes de dar por cerrado el milestone

### Out of Scope (v1.8)

- Publicar (`status: published`) los 6 case studies — este milestone solo corrige contenido, la decisión de publicar queda para Juan después de verificar
- Case studies fuera del rango ids 15-20
- Cambios de diseño/UI del chart de resultados (ya entregado en `fe5532c feat(case-studies): add before/after results chart via shadcn+recharts`) — solo se pobla de más datos reales

### Traceability (v1.8)

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

Coverage: 11/11 v1.8 requirements mapped. No orphans, no duplicates.

---

## Milestone v1.9 — Websites Portfolio Section — ACTIVO

### v1 Requirements

#### Schema & Collection (Phase A)

- [x] **WEB-01**: Colección nueva `Websites` en Payload, modelada sobre el mismo patrón que `CaseStudies` (título, slug, array de tags de stack, screenshots reales vía Media/Cloudinary, array `challenges` reusando el patrón de `CaseStudies.challenge`, año de lanzamiento, rol en el proyecto, industria/nicho, highlights técnicos)
- [x] **WEB-02**: Scores de Lighthouse reales (performance/accessibility/best-practices/SEO) con campo `lighthouseCapturedAt` (fecha) obligatorio — los números nunca se presentan como si fueran en vivo
- [x] **WEB-03**: Relación opcional `client` → `Clientes` (`hasMany: false`) — varios sitios (apturio.com, juan-tech.com) no tienen cliente externo y deben poder quedar sin este campo sin romper nada
- [x] **WEB-04**: Relación opcional `relatedCaseStudy` → `case-studies` (`hasMany: false`, unidireccional, sin back-reference simétrico) para cruzar con el case study de resultados cuando exista
- [x] **WEB-05**: `Websites` registrada en `payload.config.ts` y en `@payloadcms/plugin-seo` (`collections[]`); `payload generate:types` corrido después del schema

#### Frontend & Rutas (Phase B)

- [ ] **WEB-06**: Componente `WebsiteCard` compartido entre el bloque de Home, `ArchiveBlock` y la página de listado
- [ ] **WEB-07**: Sección nueva en Home vía `FeaturedWebsitesBlock` + campo `featuredWebsites` en el global `FeaturedContent` — mismo patrón que `FeaturedCaseStudiesBlock`, nunca una sección hardcodeada
- [ ] **WEB-08**: `ArchiveBlock` extendido con opción `relationTo: 'websites'` (y en `selectedDocs.relationTo`) — no se crea un block nuevo, sigue la convención ya documentada en el código
- [ ] **WEB-09**: Rutas `/[locale]/websites` (listado) y `/[locale]/websites/[slug]` (detalle) espejando el patrón de `/case-studies`, con `buildWebsitesTrail()` (wrapper sobre `buildSectionTrail()` existente) para breadcrumbs
- [ ] **WEB-10**: JSON-LD tipo `CreativeWork` (no `SoftwareApplication`) en la página de detalle, validado conceptualmente contra Rich Results antes del cierre del milestone
- [ ] **WEB-11**: `src/lib/sitemap-data.ts` extendido para incluir las URLs de `/websites` y `/websites/[slug]`

#### Poblado de Contenido Real (Phase C)

- [ ] **WEB-12**: 6 docs reales creados: ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com
- [ ] **WEB-13**: Stack de cada sitio confirmado interactivamente con Juan sitio por sitio (una pregunta por sitio) — lo que no confirme se infiere del código/contenido público del sitio
- [ ] **WEB-14**: Screenshot real de cada sitio (full-page, vía Playwright) capturado una sola vez y subido a Cloudinary por el pipeline de Media existente — nunca iframe en vivo ni fetch de captura en tiempo de request
- [ ] **WEB-15**: Lighthouse real corrido una sola vez contra la URL en vivo de cada sitio (cloná el patrón de `scripts/lighthouse-mobile.mjs`), con `lighthouseCapturedAt` seteado a la fecha real de esa corrida
- [ ] **WEB-16**: Relaciones a `Clientes`/`CaseStudies` pobladas donde exista match real (ej. si alguno de los 6 dominios ya es cliente en la colección `Clientes` o está detrás de un case study existente) — regla explícita antes de poblar: qué dato vive en `Websites` vs. en `CaseStudies` para el mismo sitio, sin duplicar ni contradecir

### Future Requirements

- Filtro/orden por stack o industria en el listado — no vale la pena con solo 6 entradas, revisar cuando pase de ~12-15
- Integración en vivo/programada de Lighthouse (re-audit automático) — viola el límite arquitectónico explícito del proyecto de "sin SEO tooling en vivo"
- Link a repo de GitHub por sitio

### Out of Scope (v1.9)

- Preview embebido en vivo (iframe) de los sitios — costo real de performance/seguridad, rechazado en research
- Fusionar `Websites` con `CaseStudies` — son conceptos distintos a propósito (craft técnico vs. resultado de negocio), mismo principio que ya separa `Clientes` de `CaseStudies`
- Re-captura automática o programada de Lighthouse/screenshots — es una captura manual puntual de los 6 sitios reales, no un sistema de monitoreo

### Traceability (v1.9)

| Requirement | Phase | Status |
|-------------|-------|--------|
| WEB-01 | Phase 38 | Complete |
| WEB-02 | Phase 38 | Complete |
| WEB-03 | Phase 38 | Complete |
| WEB-04 | Phase 38 | Complete |
| WEB-05 | Phase 38 | Complete |
| WEB-06 | Phase 39 | Pending |
| WEB-07 | Phase 39 | Pending |
| WEB-08 | Phase 39 | Pending |
| WEB-09 | Phase 39 | Pending |
| WEB-10 | Phase 39 | Pending |
| WEB-11 | Phase 39 | Pending |
| WEB-12 | Phase 40 | Pending |
| WEB-13 | Phase 40 | Pending |
| WEB-14 | Phase 40 | Pending |
| WEB-15 | Phase 40 | Pending |
| WEB-16 | Phase 40 | Pending |

Coverage: 16/16 v1.9 requirements mapped. No orphans, no duplicates.
