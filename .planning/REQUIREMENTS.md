# Requirements: Juan Carlos Angulo — Portfolio (Payload rebuild)

**Defined:** 2026-07-12
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en el contenido (case studies, blog) como en la ejecución técnica (rendimiento y SEO impecables). Si el rendimiento o el SEO fallan, el sitio no cumple su propósito.

## v1.5 Requirements — UI/UX Pro Max: Polish y Competitividad

Requirements para el milestone v1.5. Cada uno mapea a una fase del roadmap (Home + Servicios primero).

### Breadcrumbs

- [x] **BREAD-01**: Usuario ve un trail de breadcrumbs visual en la página índice de Servicios y en las 4 landings individuales, en ambos locales (ES/EN)
- [x] **BREAD-02**: Cada página con breadcrumbs emite `BreadcrumbList` JSON-LD derivado de la misma fuente que el trail visual (una sola función `buildTrail()`, sin duplicar lógica de URL/locale)
- [x] **BREAD-03**: El schema `BreadcrumbList` se valida sin errores en ambos locales usando el agente/MCP de schema SEO disponible en el proyecto (`seo-schema`) antes de dar la fase por cerrada

### SEO Técnico (Canonical / Hreflang)

- [x] **SEOTECH-01**: Cada una de las 4 combinaciones de URL de servicio (`/servicios/[slug]`, `/en/services/[slug]`) emite `alternates.canonical` correcto en `generateMetadata`, construido con un helper compartido (no hardcodeado)
- [x] **SEOTECH-02**: Cada página de servicio emite `alternates.languages` (hreflang) apuntando a su contraparte en el otro locale
- [x] **SEOTECH-03**: El layout raíz define `metadataBase` una sola vez, desbloqueando canonicals correctos en todo el sitio (no solo Servicios)

### Home — Vitrina de Servicios

- [x] **SVCHOME-01**: Usuario ve un componente "Servicios" en el Home (bloque `ServicesShowcase`) con las 4 tarjetas de servicio, en ambos locales
- [x] **SVCHOME-02**: Las tarjetas del bloque leen dinámicamente el set fijo de servicios (`SERVICE_SLUGS`) en vez de estar hardcodeadas por instancia, y cada una enlaza a su landing correspondiente en el locale activo
- [x] **SVCHOME-03**: El bloque se registra como aditivo en Payload (config + `RenderBlocks` + `payload generate:types`) sin modificar columnas existentes; si llegara a requerir tocar una columna existente, se pide aprobación nombrada de Juan primero

### Páginas de Servicio — Polish Visual y Competitividad

- [ ] **SVCPOL-01**: Cada una de las 4 landings de servicio tiene una anatomía visual completa y distinguible por bloques: H1 → dolor/problema → qué incluye → proceso → prueba social → FAQ → CTA — sin muro único de rich text
- [ ] **SVCPOL-02**: Cada landing de servicio incluye prueba social reforzada (testimonios y/o logos de clientes y/o resultados cuantificados), cerrando el gap detectado frente a la competencia
- [ ] **SVCPOL-03**: Cada landing de servicio incluye una tarjeta "alcance del servicio" (alcance/resultado/tiempo) sin precio, como sustituto de tabla de precios — respeta la regla de no-precios del proyecto
- [ ] **SVCPOL-04**: Cada landing de servicio muestra un case study relacionado (tarjeta con métrica en el titular) vinculado al servicio correspondiente
- [ ] **SVCPOL-05**: El CTA primario se repite arriba (Hero) y abajo (CallToAction) de cada landing, con misma acción/label
- [ ] **SVCPOL-06**: Todo el copy nuevo o reescrito en esta fase (ES y EN) pasa por la skill `humanizer` antes de publicarse — sin marcas de escritura de IA, sin em/en dash, voz natural variada
- [ ] **SVCPOL-07**: Ninguna landing de servicio pierde su H1 semántico único ni el `BreadcrumbList`/`Person`/JSON-LD existente durante el polish — verificado contra un baseline pre-pase
- [ ] **SVCPOL-08**: Ninguna landing de servicio regresa Core Web Vitals/Lighthouse mobile respecto al baseline pre-pase (gate por fase, `next/image` con dimensiones explícitas, sin `'use client'` a nivel de página)
- [ ] **SVCPOL-09**: Todo componente/string nuevo tiene paridad ES/EN verificada en vivo (sin labels vacíos, sin campos no localizados compartidos) antes de cerrar la fase

## v2 Requirements (Deferred)

Fuera de este milestone, priorizadas por impacto según research — quedan para fases/milestones futuros.

### Polish de otras plantillas

- **POLISH-CASE-01**: Pasada de diseño profesional sobre listado + template de Case Studies
- **POLISH-BLOG-01**: Pasada de diseño profesional sobre listado + template de Blog/Post
- **POLISH-AUTHOR-01**: Revisión visual adicional de la Author page (ya recibió trabajo en v1.2)

## Out of Scope

Explícitamente excluido de v1.5. Documentado para prevenir scope creep.

| Feature | Reason |
|---------|--------|
| Tabla de precios en páginas de servicio | Regla dura del proyecto (PROJECT.md) — commoditiza un engagement a medida; se sustituye por tarjeta de alcance/valor (SVCPOL-03) |
| Nueva colección `Services` en Payload | Decisión ya tomada (Key Decision D-01 en PROJECT.md) — se reutiliza `pages` con bloques |
| Librería de animación (framer-motion, GSAP, Lenis, three.js) | Riesgo de regresión de Core Web Vitals — mismo criterio que descartó three.js en v1.3; el sistema shadcn/Radix/CSS ya cubre todo lo necesario (STACK-v1.5.md) |
| Breadcrumbs en Home/páginas raíz de 1 nivel | Ruido en una jerarquía plana; se limita a la jerarquía de Servicios |
| Mega-menú/dropdown para los 4 servicios | Sobre-ingeniería — la vitrina de Home + índice `/services` ya resuelven descubribilidad |
| Reescritura del copy ya grounded de Phase 19 (más allá del polish visual) | Scope creep — riesgo de regresionar copy ya validado con research real |
| Polish de Case Studies, Blog, Author page | Priorizado para fases/milestones posteriores a Home + Servicios (ver v2 Requirements) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BREAD-01 | Phase 22 | Done |
| BREAD-02 | Phase 22 | Done |
| BREAD-03 | Phase 22 | Done |
| SEOTECH-01 | Phase 23 | Done |
| SEOTECH-02 | Phase 23 | Done |
| SEOTECH-03 | Phase 23 | Done |
| SVCHOME-01 | Phase 24 | Done |
| SVCHOME-02 | Phase 24 | Done |
| SVCHOME-03 | Phase 24 | Done |
| SVCPOL-01 | Phase 25 | Pending |
| SVCPOL-02 | Phase 25 | Pending |
| SVCPOL-03 | Phase 25 | Pending |
| SVCPOL-04 | Phase 25 | Pending |
| SVCPOL-05 | Phase 25 | Pending |
| SVCPOL-06 | Phase 25 | Pending |
| SVCPOL-07 | Phase 25 | Pending |
| SVCPOL-08 | Phase 25 | Pending |
| SVCPOL-09 | Phase 25 | Pending |

**Coverage:** 18/18 v1.5 requirements mapped, 0 orphaned.

---
*Requirements defined: 2026-07-12*
