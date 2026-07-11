# Roadmap: Juan Carlos Angulo — Portfolio (Payload rebuild)

## Overview

Reconstrucción de plataforma: mismo contenido y páginas del sitio actual, pero sobre Payload 3.85 + Next.js 15 con PostgreSQL (en vez de MongoDB), Cloudinary (en vez de Vercel Blob), y self-hosted en Hostinger (en vez de Vercel). El camino va de fundación disciplinada (schema Postgres + colecciones limpias) a capa bilingüe/SEO, resolución del único riesgo arquitectónico abierto (adapter de Cloudinary), migración de contenido 1:1 desde Mongo, construcción de las páginas públicas con los diferenciadores competitivos, y cierre con deploy + cutover operacional en Hostinger. Cada fase se apoya en la anterior: sin `push:false` y colecciones limpias no hay superficie estable para migrar; sin i18n y storage resueltos, la migración escribiría contra un target movedizo; sin contenido migrado no hay páginas que renderizar; sin páginas no hay qué desplegar.

**Milestone v1.1 — UI/UX Polish Pass:** Antes de retomar Phase 6 (Deploy + Cutover, en pausa), el sitio recibe una pasada de pulido visual profesional sobre los 16 bloques Payload-editables y componentes shadcn ya construidos en Phase 5. El camino va de fundación de tokens (elevación/motion CSS-puro, dark-mode branded, sin toggle) a primitivas shadcn + chrome global (máximo apalancamiento, se propaga a los 16 bloques), a hero/resultados/tipografía de contenido largo, a cards/listados + autoría E-E-A-T, y cierra con una verificación cruzada final (contraste, layout ES, grep de contenido hardcodeado, Lighthouse móvil). Motion/animación (carruseles, scroll-reveal) y un toggle visible de dark mode quedan explícitamente diferidos por decisión de Juan — UI-03 es solo corrección de tokens, sin UI de cambio de tema.

**Scope expandido 2026-07-10 (post Phase 10.5 Wave 1):** Tras feedback directo de Juan rechazando la dirección visual acumulada de Phases 7-10 como insuficiente, el milestone se amplía con tres fases nuevas (10.6, 10.7, 10.8) insertadas entre Phase 10.5 y Phase 11: completar header/footer con verificación mobile real, cerrar los gaps de componentes identificados contra el sitio Payload viejo (`JuanPortfolio`, `COMPONENT-GAP-ANALYSIS.md`) agregando y **poblando** dos bloques nuevos, y enriquecer el bloque Hero con CTA/breadcrumbs también poblados. Disciplina mobile-first (~375px primero) se vuelve la práctica estándar de verificación desde aquí en adelante, reforzada explícitamente en Phase 11. Phase 10.5 queda cerrada con alcance reducido a solo lo que ya completó (tipografía + schema de Footer); el trabajo de restyle de header/footer que tenía pendiente se absorbe en Phase 10.6.

**Milestone v1.2 — Content Parity (Home + Author Page), creado 2026-07-11:** Con v1.1 cerrado (Phases 7-11 completas, Phase 6 aún en pausa), una comparación directa contra el sitio de referencia real (`JuanPortfolio`, `localhost:3000`) reveló 3 brechas concretas de contenido/componentes no cerradas por v1.1, más un pedido nuevo de asignación de keyword objetivo (EN/ES) informada por research real. El milestone agrega 4 fases nuevas (12-15): recuperar las secciones E-E-A-T recortadas del author page (Phase 12), poblar Home con la sección "Mi enfoque en Consultoría Técnica" (`AboutSection` extendido) y el bloque FAQ ya existente pero nunca poblado (Phase 13), agregar el campo editorial `targetKeyword` a Pages/Authors (Phase 14), y dar al sitemap una hoja de estilos XSL navegable más una versión HTML (Phase 15). Blog/posts queda explícitamente fuera de alcance (pedido de Juan), y CalendlyEmbed queda cerrado definitivamente (Juan ya no usa Calendly). Ver `.planning/REQUIREMENTS.md` sección "v1.2 Requirements — Content Parity" para el detalle completo.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Schema Foundation** - Postgres + colecciones limpias con disciplina de migraciones desde el día uno (completed 2026-07-09)
- [x] **Phase 2: Bilingüe + SEO** - Routing EN/ES, plugin SEO, sitemaps, llms.txt, redirects funcionando (completed 2026-07-09)
- [x] **Phase 3: Cloudinary Media Spike** - Adapter de storage Cloudinary validado y wireado (completed 2026-07-09)
- [x] **Phase 4: Migración Mongo → Postgres** - Contenido actual migrado 1:1 con URLs y medios preservados (completed 2026-07-10)
- [x] **Phase 5: Frontend Pages** - Todas las páginas públicas renderizando contenido migrado con diferenciadores competitivos (completed 2026-07-10)
- [ ] **Phase 6: Deploy + Cutover** - Sitio en producción en Hostinger con checklist de go-live verificado (en pausa — retoma después de v1.1/v1.2)
- [x] **Phase 7: Design-Token Foundation** - Tokens de sombra/motion CSS-puro, prefers-reduced-motion global, paleta dark branded (sin toggle) (completed 2026-07-10)
- [x] **Phase 8: shadcn Primitives + Global Chrome** - Primitivas shadcn refinadas con los nuevos tokens + header/footer restyled (completed 2026-07-10)
- [x] **Phase 9: Hero + Resultados/KPI + Tipografía** - Hero de mayor impacto, KPIs de case studies reforzados, jerarquía tipográfica en contenido largo (completed 2026-07-10)
- [x] **Phase 10: Cards/Listados + Autoría E-E-A-T** - Tratamiento visual consistente en bloques tipo card + credenciales de autor prominentes (completed 2026-07-10)
- [x] **Phase 10.5 [INSERTED]: Typography + Footer Schema** - Tipografía Array/Khand/Geist wireada + campo dynamicColumns del Footer con migración commiteada (completed 2026-07-10; alcance reducido — restyle de header/footer pasa a Phase 10.6)
- [x] **Phase 10.6 [INSERTED]: Header/Footer Completion + Mobile Verification** - Nav mobile-first completa, footer con contenido dinámico realmente renderizado, verificación real con Playwright en 375/768/1280px (completed 2026-07-10)
- [x] **Phase 10.7 [INSERTED]: Component Gap-Fill (AboutSection + TestimonialSection)** - Dos bloques nuevos identificados por el gap-analysis contra JuanPortfolio, construidos y poblados con contenido real/de muestra (completed 2026-07-10)
- [x] **Phase 10.8 [INSERTED]: Hero Enrichment (CTA + Breadcrumbs)** - Campos de CTA/links y breadcrumbs agregados al Hero existente y poblados con datos reales (completed 2026-07-10)
- [x] **Phase 11: Verificación Cruzada Final** - Contraste WCAG, layout `/es`, grep de contenido hardcodeado, Lighthouse móvil, disciplina mobile-first confirmada de punta a punta (completed 2026-07-10)
- [x] **Phase 12: Author Page E-E-A-T Expansion** - Author page recupera expertise/educación/experiencia recortados en Phase 1, más una 4ta sección de speaking events, con JSON-LD enriquecido — verificado 7/7, code review limpio (4 warnings corregidos), Juan confirmó visualmente (completed 2026-07-11)
- [ ] **Phase 13: Home Content Population** - AboutSection extendido con features + FAQ poblado en Home
- [ ] **Phase 14: Target Keyword Field** - Campo editorial targetKeyword en Pages/Authors, poblado con picks de keyword research real
- [ ] **Phase 15: Sitemap XSL + HTML** - sitemap.xml con hoja de estilos navegable + sitemap.html enlazado desde el footer

## Phase Details

### Phase 1: Schema Foundation

**Goal**: Backend Payload corre sobre PostgreSQL con disciplina de schema (`push:false`, migraciones committeadas) y solo las colecciones necesarias para contenido público, listas para recibir el contenido migrado y bilingüe de fases posteriores.
**Depends on**: Nothing (first phase)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07
**Success Criteria** (what must be TRUE):

  1. El backend arranca contra PostgreSQL vía `@payloadcms/db-postgres` con `push:false`, sin ningún push automático de schema en ningún entorno
  2. Solo existen las colecciones esenciales (Pages, Posts, Authors, CaseStudies, Categories, Media, Testimonials, Clientes, Users) — no hay rastro de Works, AdBanners, BrokenLinks, GSCMetrics, KeywordMetrics, PageMetrics ni dinorank
  3. Un cambio de schema se aplica exclusivamente vía `payload migrate:create`/`payload migrate`, con el archivo de migración commiteado en el repo
  4. Un editor puede crear un case study siguiendo el modelo `ariannalupi.com/casos/` (hero con métrica principal, metadatos cliente/sector/período/servicios, 4 KPIs en tarjetas, secciones "El cliente"/"El reto"/"La solución"/"Resultados" con comparativa antes-después, conclusión) y un testimonio con atribución estructurada (nombre, rol, empresa), sin recurrir a rich text libre para esos datos
  5. Un editor puede crear una entrada en Clientes con nombre, logo y link a su web, pensada solo para alimentar el carrusel de logos (sin campos de case study)
  6. La librería de blocks disponible para Pages tiene entre 12 y 14 blocks consolidados (no ~35 variantes casi-duplicadas)

**Plans**: 10 plans (6 waves)

Plans:

- [x] 01-01-PLAN.md — Project scaffold (package.json/tsconfig/next.config) + shared access/slug/deepMerge utilities
- [x] 01-02-PLAN.md — Users, Media, Categories, Posts collections
- [x] 01-03-PLAN.md — Authors, Clientes, Testimonials collections
- [x] 01-04-PLAN.md — CaseStudies collection (structured KPI/challenge/solution/results model)
- [x] 01-05-PLAN.md — Hero, Content, ArchiveBlock, CallToAction, FAQ, MediaBlock block configs
- [x] 01-06-PLAN.md — TestimonialsCarousel, ContactFormBlock, Code, RelatedPosts, TableOfContentsBlock, ResultsSection, Section block configs
- [x] 01-07-PLAN.md — Pages collection (registers all 13 consolidated blocks)
- [x] 01-08-PLAN.md — payload.config.ts wiring (9 collections, plugins, push:false Postgres adapter)
- [x] 01-09-PLAN.md — App router scaffold ((payload)/(frontend) route groups) + generate importmap/types
- [x] 01-10-PLAN.md — [BLOCKING] Neon Postgres schema push via payload migrate:create/migrate

### Phase 2: Bilingüe + SEO

**Goal**: El sitio tiene routing y contenido bilingüe EN/ES con paridad completa, y la capa de SEO técnico (metas, sitemaps, llms.txt, JSON-LD, redirects) queda operativa antes de que exista contenido migrado, para que la migración no tenga que remapear locales después.
**Depends on**: Phase 1
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06
**Success Criteria** (what must be TRUE):

  1. Cada tipo de contenido (Pages, Posts, CaseStudies, etc.) tiene paridad completa EN/ES, con routing `[locale]` funcionando vía next-intl y localización de campos vía Payload
  2. Un editor puede completar metas, OG y canonical desde una pestaña SEO en Pages, Posts y CaseStudies, y esos valores aparecen en el HTML renderizado
  3. `/sitemap.xml` y `/robots.txt` se generan dinámicamente consultando la Local API (no un plugin oficial de sitemap), reflejando pages/posts/authors/categories reales
  4. `llms.txt` y `llms-full.txt` están accesibles públicamente y reflejan el contenido del sitio
  5. Al menos una página de post/case study incluye JSON-LD (Person/Article/BreadcrumbList) escrito a mano, y un redirect creado en la colección de redirects se ejecuta de verdad al visitar la URL vieja

**Plans**: 5 plans (3 waves)

Plans:

- [x] 02-01-PLAN.md — next-intl install + i18n routing/request config + message catalogs + next.config.mjs wiring
- [x] 02-02-PLAN.md — payload.config.ts localization block + Media.alt fix + Llms global + [BLOCKING] Neon migration
- [x] 02-03-PLAN.md — middleware (next-intl + redirects execution) + [locale] restructure + home page with Person JSON-LD
- [x] 02-04-PLAN.md — sitemap.ts, robots.ts, llms.txt/llms-full.txt route handlers
- [x] 02-05-PLAN.md — seed test content + blog/case-study detail pages with Article/CreativeWork/BreadcrumbList JSON-LD + end-to-end verification

### Phase 3: Cloudinary Media Spike

**Goal**: El único riesgo arquitectónico abierto del proyecto (no existe adapter oficial de Payload para Cloudinary) queda resuelto con un adapter validado contra una cuenta real, gateado por env vars, antes de que la migración necesite re-subir medios.
**Depends on**: Phase 1
**Requirements**: MEDIA-01, MEDIA-02, MEDIA-03
**Success Criteria** (what must be TRUE):

  1. Un archivo subido desde el admin de Payload en un entorno con credenciales de Cloudinary configuradas termina almacenado en Cloudinary (no en disco local), usando un adapter custom sobre `@payloadcms/plugin-cloud-storage` (basado en la referencia `github.com/Sahitya1707/payload-cloudinary`, portado de Payload 3.33 a 3.85), con `@jhb.software/payload-cloudinary-plugin` o `payload-storage-cloudinary` como fallback si el adapter custom encuentra un bloqueo real
  2. En un entorno sin credenciales de Cloudinary, el mismo flujo de subida cae automáticamente a disco local sin romper el admin
  3. Una imagen servida desde Cloudinary se renderiza correctamente vía `next/image` con transformaciones `f_auto,q_auto` aplicadas (verificable en la URL generada)

**Plans**: 3 plans (3 waves)

Plans:

- [x] 03-01-PLAN.md — Install cloudinary + @payloadcms/plugin-cloud-storage, with legitimacy checkpoint
- [x] 03-02-PLAN.md — Ported/corrected Cloudinary adapter, conditional config wiring, imageSizes gating, [BLOCKING] schema migration
- [x] 03-03-PLAN.md — Real end-to-end Cloudinary upload validation + next/image browser checkpoint

### Phase 4: Migración Mongo → Postgres

**Goal**: Todo el contenido real del sitio actual (posts, case studies, authors, testimonials, works/clientes, medios) existe en el nuevo backend Postgres con URLs idénticas a las actuales y relaciones preservadas, listo para renderizarse en las páginas públicas.
**Depends on**: Phase 2, Phase 3
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04, MIGR-05, MIGR-06
**Success Criteria** (what must be TRUE):

  1. Existe un inventario congelado de URLs vivas del sitio actual (crawleado desde sitemap/GSC) que sirve como contrato de verificación
  2. Correr el script ETL standalone puebla el backend Postgres con Media → Authors/Categories → Posts/CaseStudies/Testimonials/Clientes en ese orden, usando la Local API de Payload en ambos configs (no SQL crudo); el contenido de la colección Works actual (retirada) se audita manualmente y se absorbe como case study si corresponde, no se migra 1:1 como colección
  3. Cada documento migrado conserva su slug/URL verbatim del sitio original (ninguno regenerado desde el título), verificable comparando el inventario congelado contra las URLs nuevas
  4. Las relaciones entre documentos migrados (ej. post → author, post → categoría) resuelven correctamente gracias a la tabla de remapeo ObjectId → ID Postgres
  5. Los medios migrados están re-subidos a Cloudinary (no solo URLs copiadas) y las referencias dentro de rich text/blocks apuntan a las nuevas URLs de Cloudinary; toda URL que cambió intencionalmente tiene su entrada correspondiente en el mapa de redirects 301

**Plans**: 8 plans (8 waves)

Plans:

- [x] 04-01-PLAN.md — Foundation: dump real (Local API, Mongo) de las 8 colecciones fuente + inventario congelado de URLs (MIGR-01) + módulos remap-table/richtext-remap
- [x] 04-02-PLAN.md — Media: re-subida real a Cloudinary vía el adapter de Fase 3
- [x] 04-03-PLAN.md — Authors + Categories (slugs verbatim, avatar remapeado)
- [x] 04-04-PLAN.md — Testimonials + Clientes (maneja campos ahora-requeridos que el esquema viejo no exigía)
- [x] 04-05-PLAN.md — Posts (dos pasadas: relaciones/media, luego links internos post-a-post)
- [x] 04-06-PLAN.md — CaseStudies (preserva richText viejo en clientContext; documenta el vacío de KPIs estructurados)
- [x] 04-07-PLAN.md — Auditoría de Works + fold-in a CaseStudies (checkpoint:decision)
- [x] 04-08-PLAN.md — Redirects 301 para deltas de URL (MIGR-06) + reporte final de verificación

### Phase 5: Frontend Pages

**Goal**: Todas las páginas públicas del sitio actual existen en el nuevo frontend, renderizando el contenido migrado, con los diferenciadores competitivos (case studies estructurados, autoría E-E-A-T, búsqueda, taxonomía) implementados según lo identificado en research.
**Depends on**: Phase 4
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):

  1. Un visitante puede navegar home, blog (listado + post individual), case studies (listado + detalle), authors (listado + perfil), contact, privacy, terms y search — en ambos locales
  2. Cada post y case study muestra bio y credenciales del autor visiblemente en el byline
  3. El listado de blog permite filtrar/navegar por categoría y muestra una sección de posts destacados además del orden cronológico
  4. Un visitante puede buscar contenido usando `@payloadcms/plugin-search` y obtener resultados relevantes
  5. Un visitante puede enviar el formulario de contacto y Juan recibe el email vía Resend; no hay ningún dashboard de SEO tooling interno visible en el admin de Payload, y GA4/Search Console quedan como los únicos puntos de analytics

**Plans**: 13 plans (5 waves)

Plans:

- [x] 05-01-PLAN.md — Design system bootstrap (Tailwind + shadcn init, Inter/Fraunces fonts, color/spacing/typography tokens, Container/Prose primitives)
- [x] 05-02-PLAN.md — Header/Footer/FeaturedContent globals + Authors E-E-A-T expansion + migration + Phase 1/2 fixture cleanup
- [x] 05-03-PLAN.md — FeaturedPostsBlock/FeaturedCaseStudiesBlock/ClientLogosBlock configs + ArchiveBlock category-filter extension + Pages registration + migration
- [x] 05-04-PLAN.md — RenderBlocks registry + renderers for all 16 registered Pages blocks
- [x] 05-05-PLAN.md — SiteHeader/SiteFooter + AuthorByline/AuthorCard (E-E-A-T) + deterministic hero-image fallback utility
- [x] 05-06-PLAN.md — Home page (Hero + Featured Case Studies + About + Client Logos + Featured Posts + Testimonials + Contact CTA)
- [x] 05-07-PLAN.md — Blog listing (featured section + category-filterable chronological grid)
- [x] 05-08-PLAN.md — Blog post detail (hero fallback, author E-E-A-T byline, related posts, table of contents)
- [x] 05-09-PLAN.md — Case studies listing + detail (KPIs, challenge/solution/results, author byline)
- [x] 05-10-PLAN.md — Authors listing + profile (E-E-A-T card + posts/case studies by author)
- [x] 05-11-PLAN.md — Search (@payloadcms/plugin-search across posts/case-studies/authors) + /search page
- [x] 05-12-PLAN.md — Contact (Resend wiring) + Privacy + Terms (ported real legal copy)
- [x] 05-13-PLAN.md — [BLOCKING] Bilingual QA walkthrough + final requirements coverage checkpoint

**UI hint**: yes

### Phase 6: Deploy + Cutover

**Goal**: El sitio corre en producción en Hostinger Cloud/Business como proceso Node persistente, con el cutover ejecutado sin pérdida de contenido ni de rankings respecto al sitio actual.
**Depends on**: Phase 5
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**Success Criteria** (what must be TRUE):

  1. El build standalone (`payload migrate && next build`) se ejecuta en Hostinger con `.next/static` y `public/` copiados correctamente al bundle, y el sitio sirve tráfico real desde ahí
  2. El proceso Node persiste entre reinicios/deploys (PM2 o supervisor nativo del panel de Hostinger, confirmado contra el tier real contratado)
  3. El pool de conexiones Postgres está dimensionado y verificado contra el límite real del plan de Hostinger contratado, sin errores de conexión bajo uso normal
  4. El checklist de go-live pasa en producción: los 301 redirects funcionan en vivo, robots.txt/noindex se fetchean (no solo se leen en código) desde la URL de producción, ambos locales fueron muestreados manualmente, y el sitemap de producción no diverge del inventario de URLs congelado en Phase 4
  5. El contenido del sitio actual quedó congelado inmediatamente antes de la corrida final de migración, sin contenido publicado después del freeze que se haya perdido en el corte

**Plans**: 5 plans (3 waves) — EN PAUSA, retoma después de milestone v1.1/v1.2

Plans:

- [ ] 06-01-PLAN.md — Build standalone verificado + PM2 (ecosystem.config.cjs, scripts/deploy.sh) + runbook manual de deploy/arranque en Hostinger
- [ ] 06-02-PLAN.md — Pool de conexiones Postgres dimensionado y verificado contra el límite real de Neon (checkpoint:decision sobre pooled vs unpooled)
- [ ] 06-03-PLAN.md — [ALTO RIESGO] Cutover de DNS a Hostinger con rollback documentado + verificación pública real por Claude
- [ ] 06-04-PLAN.md — Checklist de go-live verificado en vivo contra producción (robots.txt, sitemap vs inventario congelado, redirect 301, ambos locales)
- [ ] 06-05-PLAN.md — Procedimiento de content-freeze verificable (snapshot + diff) del backend Payload/Postgres antes del corte

### Phase 7: Design-Token Foundation

**Goal**: El sitio tiene una capa de tokens de elevación y timing CSS-puro que hoy no existe, más una paleta dark-mode branded (ember/navy), disponibles para que toda restauración visual posterior componga sobre ellos sin reinventar valores por bloque.
**Depends on**: Phase 5
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):

  1. `globals.css`/`tailwind.config.ts` exponen tokens `--shadow-sm/md/lg/focus` y `--motion-fast/base/slow`/`--ease-*` (sin ninguna librería JS de animación), mapeados a utilidades Tailwind (`boxShadow`, `transitionDuration`, `transitionTimingFunction`) usables desde cualquier componente
  2. Una regla `@media (prefers-reduced-motion: reduce)` global neutraliza cualquier transición CSS existente o futura para usuarios que la solicitan
  3. El bloque `.dark` en `globals.css` usa una paleta ember/navy derivada de `05-UI-SPEC.md` (no los grises genéricos de shadcn), sin exponer ningún control de UI para cambiar de tema
  4. El contraste WCAG del nuevo set de tokens dark se verifica antes de cerrar la fase (no se difiere a la verificación final)

**Plans**: 1 plan (1 wave)

Plans:

- [x] 07-01-PLAN.md — Shadow/motion tokens + Tailwind mapping + prefers-reduced-motion rule + ember/navy .dark rebrand + WCAG contrast verification script

### Phase 8: shadcn Primitives + Global Chrome

**Goal**: Las primitivas shadcn de más alto apalancamiento (consumidas por los 16 bloques) y el chrome global del sitio (header/footer) reflejan los tokens de sombra/motion/dark de Phase 7, estableciendo la base visual sobre la que compone el resto del milestone.
**Depends on**: Phase 7
**Requirements**: UI-04, UI-05
**Success Criteria** (what must be TRUE):

  1. Las variantes `cva()` de button, card, badge, input, select, tabs, sheet, navigation-menu, separator, skeleton, textarea y avatar usan los tokens de sombra/spacing/tipografía vigentes, sin agregar nuevas dependencias de paquete
  2. `SiteHeader` y `SiteFooter` muestran una jerarquía visual clara y consistente con la dirección editorial-tech ya fijada en `05-UI-SPEC.md`
  3. Ningún archivo `config.ts` de bloque ni `payload-types.ts` cambia como resultado de esta fase (los cambios son visuales, no de schema)
  4. Los 16 bloques que consumen estas primitivas siguen renderizando sin errores tras el refinamiento (verificación visual de humo en al menos una página por tipo de bloque)

**Plans**: 2 plans (2 waves)

Plans:

- [x] 08-01-PLAN.md — Refine cva() variants of 12 shadcn primitives (interactive controls + structural/overlay) to consume Phase 7 shadow/motion tokens
- [x] 08-02-PLAN.md — Restyle SiteHeader/SiteFooter + phase-close verification (16-block smoke test, config.ts/payload-types.ts zero-diff gate)

### Phase 9: Hero + Resultados/KPI + Tipografía

**Goal**: El hero del sitio, la sección de resultados/KPIs de case studies y la jerarquía tipográfica de contenido largo (posts, case studies) transmiten mayor impacto visual y refuerzan el patrón "métrica en el titular" ya decidido en PROJECT.md, manteniendo el copy 100% editable desde Payload.
**Depends on**: Phase 8
**Requirements**: UI-06, UI-07, UI-08
**Success Criteria** (what must be TRUE):

  1. El Hero muestra un tratamiento de mayor impacto (tipografía, spacing, jerarquía) sin que ningún texto quede hardcodeado — todo el copy sigue viniendo de campos Payload
  2. `ResultsSection`/los KPIs de case studies tienen un tratamiento visual que refuerza visualmente la métrica principal como elemento dominante de la sección
  3. Los posts y case studies aplican la jerarquía tipográfica Inter/Fraunces de forma consistente en contenido largo (encabezados, cuerpo, citas), sin degradar la semántica de encabezados existente
  4. El contraste sobre fondos compuestos (overlays del hero) se re-verifica tras el cambio, no se asume heredado de Phase 7

**Plans**: 3 plans
Plans:

- [x] 09-01-PLAN.md — Hero: jerarquía tipográfica reforzada + verificación WCAG del overlay contra las 53 imágenes reales de fallback
- [x] 09-02-PLAN.md — ResultsSection + KPIs de case study: métrica principal visualmente dominante
- [x] 09-03-PLAN.md — Tipografía de contenido largo: blockquotes editoriales en Prose + ritmo del header de posts

**UI hint**: yes

### Phase 10: Cards/Listados + Autoría E-E-A-T

**Goal**: Todos los bloques de listado tipo card comparten un tratamiento visual consistente de elevación/spacing, y las credenciales de autoría (E-E-A-T) ya modeladas en Phase 5 se vuelven visualmente prominentes en byline/perfil.
**Depends on**: Phase 8
**Requirements**: UI-09, UI-10
**Success Criteria** (what must be TRUE):

  1. `ArchiveBlock`, `FeaturedPostsBlock`, `FeaturedCaseStudiesBlock` y related posts muestran el mismo lenguaje visual de elevación/spacing entre sí
  2. Los listados de cards se verifican con conteos límite del repeater (1 ítem y el máximo real) sin romper el layout
  3. `AuthorByline`/`AuthorCard` muestran de forma visualmente prominente bio, años de experiencia y redes sociales ya modelados en Phase 5
  4. El layout de cards y byline se verifica en `/es` contra títulos/nombres largos reales (no placeholder), sin overflow ni truncamiento roto

**Plans**: 2 plans (2 waves)

Plans:

- [x] 10-01-PLAN.md — PostCard/CaseStudyCard/AuthorByline/AuthorCard restyled to consume the Card primitive consistently, E-E-A-T fields made prominent
- [x] 10-02-PLAN.md — Boundary-condition + ES-locale + E-E-A-T verification against real Postgres data and guarded seeded fixtures, closes with explicit non-blocking flag for Juan's pending author content

**UI hint**: yes

### Phase 10.5 [INSERTED]: Typography + Footer Schema

**Goal**: El sitio adopta la dirección tipográfica de `auditor` (Array/Khand/Geist Sans/Geist Mono) reemplazando Inter+Fraunces, y el global Footer gana el campo de schema `dynamicColumns` con migración commiteada — sentando fuentes y schema como base para que Phase 10.6 construya el restyle real de header/footer sobre ellos. Insertada tras feedback visual directo de Juan sobre el estado acumulado de Phases 7-10; alcance reducido 2026-07-10 (ver nota de scope expandido en Overview) — el restyle de header/footer y la verificación mobile que originalmente vivían aquí (Wave 2/3) se absorben en Phase 10.6.
**Depends on**: Phase 10
**Requirements**: UI-15, UI-16
**Success Criteria** (what must be TRUE):

  1. Las cuatro familias tipográficas (Array display, Khand headings/UI, Geist Sans body, Geist Mono código) están self-hosted y wireadas, reemplazando toda referencia a Inter/Fraunces en el codebase
  2. El global Footer expone el campo `dynamicColumns` en su schema (fuente: últimos posts / últimos case studies), con migración commiteada y `payload-types.ts` actualizado (`push:false` respetado)

**Plans**: 2 plans (2 waves)

Plans:

- [x] 10.5-01-PLAN.md — Typography swap: Array/Khand/Geist Sans/Geist Mono, tailwind tokens, codebase-wide font-heading migration
- [x] 10.5-02-PLAN.md — Footer schema: dynamicColumns field + migrate:create + payload-types.ts

### Phase 10.6 [INSERTED]: Header/Footer Completion + Mobile Verification

**Goal**: `SiteHeader` y `SiteFooter` completan el trabajo de chrome global que Phase 10.5 dejó a nivel de fuentes/schema — navegación mobile-first realmente visible en el header, columnas dinámicas del footer efectivamente renderizando datos de Payload, y una verificación mobile real con herramienta headless que reemplaza el "riesgo bajo asumido" de fases previas.
**Depends on**: Phase 10.5
**Requirements**: UI-17, UI-18, UI-19
**Success Criteria** (what must be TRUE):

  1. `SiteHeader` muestra navegación completa y visible en mobile (~375px) vía menú hamburguesa/Sheet, con nav horizontal completa en desktop — ambos estados verificados por separado, no solo el desktop
  2. `SiteFooter` combina sus columnas manuales editables (ya existentes) con la sección de contenido dinámico (`dynamicColumns` de Phase 10.5) efectivamente renderizada con datos reales (últimos posts/case studies) desde Payload, sin quedar vacía ni con placeholder
  3. Un run de Playwright (u equivalente headless) contra 375px/768px/1280px confirma que header y footer no rompen layout ni ocultan contenido crítico en ningún breakpoint, con evidencia (screenshots o assertions) adjunta al cierre de la fase
  4. El footer deja de transmitir sensación de "vacío": al menos 2 columnas manuales más la sección dinámica son visibles simultáneamente en el viewport de desktop

**Plans**: 3 plans (2 waves)

Plans:

- [x] 10.6-01-PLAN.md — SiteHeader mobile-first nav completion (UI-17)
- [x] 10.6-02-PLAN.md — SiteFooter dynamicColumns wiring + mobile-first restyle (UI-18)
- [ ] 10.6-03-PLAN.md — Playwright mobile viewport verification 375/768/1280px (UI-19)

### Phase 10.7 [INSERTED]: Component Gap-Fill (AboutSection + TestimonialSection)

**Goal**: Los dos gaps genuinos de bloque identificados en `COMPONENT-GAP-ANALYSIS.md` contra el sitio Payload viejo (`JuanPortfolio`) — `AboutSection` (bio narrativa E-E-A-T) y `TestimonialSection` (spotlight de una cita dentro de un case study) — existen como bloques Payload-editables completos y están poblados con contenido real o de muestra representativo, para poder verse y validarse visualmente, no solo quedar construidos y vacíos.
**Depends on**: Phase 10.6
**Requirements**: UI-20, UI-21
**Success Criteria** (what must be TRUE):

  1. El bloque `AboutSection` (eyebrow + título + array de párrafos + foto opcional) existe como `config.ts` + `Component.tsx`, está registrado en `RenderBlocks.tsx` y disponible en el blocks array de Pages
  2. El bloque `TestimonialSection` (cita + authorName + authorRole, distinto del `TestimonialsCarousel` general) existe como `config.ts` + `Component.tsx`, registrado en `RenderBlocks.tsx` y disponible en el blocks array de CaseStudies
  3. `AboutSection` está poblado con contenido real o de muestra representativo y es visible navegando una página real del sitio (ej. home)
  4. `TestimonialSection` está poblado con una cita real o de muestra y es visible embebido en un case study real, entre las secciones "Solución" y "Resultados"
  5. Ningún campo de ninguno de los dos bloques queda hardcodeado en el `Component.tsx` — todo el contenido visible proviene de Payload, verificado con el mismo grep de contenido hardcodeado que usan las fases previas

**Plans**: 1 plan (1 wave)

Plans:

- [x] 10.7-01-PLAN.md — AboutSection + TestimonialSection: config.ts + Component.tsx + RenderBlocks registration + poblado real/de muestra

**UI hint**: yes

### Phase 10.8 [INSERTED]: Hero Enrichment (CTA + Breadcrumbs)

**Goal**: El bloque `Hero` existente cierra los dos gaps de campo identificados en `COMPONENT-GAP-ANALYSIS.md` (CTA/links y breadcrumbs), agregándolos al schema, renderizándolos, y poblándolos con datos reales para que puedan verse y validarse, no solo quedar como campos opcionales vacíos.
**Depends on**: Phase 10.7
**Requirements**: UI-22, UI-23
**Success Criteria** (what must be TRUE):

  1. El `Hero` block expone un array opcional de `links` (label + url + estilo) en su schema, renderizado como botones de acción cuando está presente
  2. El hero de home tiene al menos un CTA real poblado (ej. "Ver case studies" / "Agendar llamada") y visible en la página
  3. La variante `listing` del `Hero` expone un array opcional de `breadcrumbs`, renderizado como navegación de breadcrumbs cuando está presente
  4. Al menos una página listing real (blog o case studies) tiene breadcrumbs poblados y visibles
  5. Ambos campos se verifican mobile-first (~375px) antes que desktop, sin overflow ni ruptura de layout, consistente con la disciplina mobile-first del resto del scope expandido

**Plans**: 1 plan (1 wave)

Plans:

- [x] 10.8-01-PLAN.md — Hero CTA links + breadcrumbs: schema, render, poblado real, verificación mobile-first

**UI hint**: yes

### Phase 11: Verificación Cruzada Final

**Goal**: El diff acumulado de todo el milestone (incluidas las fases 10.6-10.8 del scope expandido) se verifica de punta a punta contra los riesgos identificados en research — contraste, layout en español, contenido hardcodeado, performance y disciplina mobile-first — antes de dar por cerrado el pulido visual y retomar Phase 6.
**Depends on**: Phase 7, Phase 8, Phase 9, Phase 10, Phase 10.5, Phase 10.6, Phase 10.7, Phase 10.8
**Requirements**: UI-11, UI-12, UI-13, UI-14, UI-24
**Success Criteria** (what must be TRUE):

  1. El contraste WCAG se re-verifica en ambos temas (light/dark) sobre el estado final de todos los cambios de esta fase, no solo sobre los checks parciales de cada fase individual
  2. El layout de todas las páginas tocadas se verifica en `/es` contra los títulos/textos más largos reales de los 72 posts/case studies migrados
  3. Un grep de contenido hardcodeado (strings de prueba, badges/stats sin campo Payload backing) en todos los bloques tocados por este milestone devuelve cero diffs en `src/blocks/*/config.ts` y `payload-types.ts`
  4. Un Lighthouse móvil corrido tras todos los cambios visuales no muestra regresión respecto al baseline de producción capturado antes de esta fase
  5. Se confirma que el trabajo de Phases 10.6-10.8 fue diseñado y verificado mobile-first (375px → 768px → 1280px, con evidencia Playwright de Phase 10.6) y no como un check desktop-first de último momento

**Plans**: 3 plans (2 waves) — se re-planea al cierre de Phase 10.8 para incorporar los diffs de las fases 10.6-10.8

Plans:

- [x] 11-01-PLAN.md — Contraste WCAG AA en ambos temas (light/dark, tokens completos) + grep final de contenido hardcodeado + diff config.ts/payload-types.ts en el rango completo del milestone (re-verificado contra el diff final post 10.6-10.8)
- [x] 11-02-PLAN.md — Layout `/es` contra contenido real más largo en home/authors/case-studies (páginas no cubiertas por Phase 10), cerrado con verificación contra el case study real y el testimonio embebido de Phase 10.7
- [x] 11-03-PLAN.md — Lighthouse móvil sobre build de producción local, baseline pre-milestone vs HEAD actual (sustituto documentado del baseline de producción, ya que Phase 6 sigue en pausa)

### Phase 12: Author Page E-E-A-T Expansion

**Goal**: El author page de Juan muestra su trayectoria completa — expertise, educación/certificaciones, experiencia laboral y eventos donde ha sido ponente — en 4 secciones nuevas diseñadas profesionalmente, con el schema estructurado y el Person JSON-LD enriquecido que respaldan esas secciones.
**Depends on**: Phase 11 (último trabajo de UI/UX cerrado sobre el mismo codebase; corre en paralelo a Phase 6, no depende de su cierre)
**Requirements**: AUTHOR-01, AUTHOR-02, AUTHOR-03, AUTHOR-04, AUTHOR-05, AUTHOR-06 (+ speaking-events añadido mid-phase por pedido directo de Juan, sin nuevo requirement ID formal)
**Success Criteria** (what must be TRUE):

  1. Un editor puede completar `expertise[]` (array de temas), `education[]` (título/institución/logo/fecha inicio/fin/certificado/descripción) y `experience[]` (empresa/rol/fecha inicio/fin/descripción) en la colección Authors desde `/admin`
  2. El author page renderiza una sección "Expertise" (tags) cuando `expertise[]` tiene datos, diseñada con la skill `ui-ux-pro-max`
  3. El author page renderiza una sección "Educación y Certificaciones" (grid con logo/institución/fechas) cuando `education[]` tiene datos, diseñada con `ui-ux-pro-max`
  4. El author page renderiza una sección "Experiencia" (timeline laboral) cuando `experience[]` tiene datos, diseñada con `ui-ux-pro-max`
  5. El Person JSON-LD del author page incluye `sameAs` (redes sociales), `knowsAbout` (desde `expertise[]`) y `hasCredential` (desde `education[]`)
  6. Las 4 secciones nuevas están pobladas con contenido real de Juan donde exista (adaptado del sitio de referencia) o quedan como placeholder claramente editable desde `/admin` si el dato real no está disponible
  7. [Añadido mid-phase] El author page renderiza una sección "Eventos donde he sido ponente" (grid de cards) cuando existen docs en la colección standalone `speaking-events`, poblada con los 2 eventos reales (Caracas SEO Fest, Taller SEO+IA en Lima por DinoRANK)

**Plans**: 4 plans (3 waves) + 1 mid-phase addition (12-05, ad-hoc, no formal PLAN.md — ejecutado directamente por pedido de Juan)

Plans:

- [x] 12-01-PLAN.md — Authors collection: expertise/education/experience fields + migration + payload-types
- [x] 12-02-PLAN.md — Author page: 3 secciones nuevas (Expertise/Educación/Experiencia) + Person JSON-LD enriquecido (sameAs/knowsAbout/hasCredential)
- [x] 12-03-PLAN.md — scripts/seed-author-eeat.ts: contenido real ES/EN (4 expertise, 2 education, 2 experience) + verificación de avatar existente
- [ ] 12-04-PLAN.md — Verificación automatizada (Playwright, PASS) + checkpoint humano de cierre de fase (Task 1 hecha, Task 2 awaiting Juan)
- [x] 12-05 (mid-phase, ad-hoc) — Colección standalone SpeakingEvents + migración + 4ta sección en author page + seed real (2 eventos) + 3er item de experience (aprendoclub) + verificación headless extendida

**UI hint**: yes

### Phase 13: Home Content Population

**Goal**: Home cierra los dos gaps de contenido restantes identificados contra el sitio de referencia — la sección "Mi enfoque en Consultoría Técnica" (features del `AboutSection` extendido) y el bloque FAQ, que ya existe en el registry pero nunca se pobló — ambos con contenido real de Juan.
**Depends on**: Phase 12
**Requirements**: ABOUT-01, ABOUT-02, FAQ-01
**Success Criteria** (what must be TRUE):

  1. El bloque `AboutSection` expone un campo opcional `features[]` (mínimo/máximo 4 items: icon + título + descripción) y campos opcionales `ctaText`/`ctaLink`, extendiendo el bloque existente (no un bloque nuevo)
  2. Home muestra la sección "Mi enfoque en Consultoría Técnica" (eyebrow "Estrategia y datos. Más allá del código", 4 features: SEO Técnico / Rendimiento web / Arquitectura escalable / Ingeniería de UX) usando el `AboutSection` extendido
  3. El bloque `FAQ` (ya existente en el registry, nunca poblado) está agregado al layout de Home y muestra 5 preguntas reales (diferencia SEO tradicional vs técnico, auditoría vs implementación, stack/plataformas, medición de éxito, proceso para empezar)

**Plans**: TBD

**UI hint**: yes

### Phase 14: Target Keyword Field

**Goal**: Pages y Authors ganan un campo editorial `targetKeyword` (EN/ES) informativo — sin llamadas en vivo a ninguna API externa — y Home + el author page de Juan quedan poblados con los picks reales del keyword research ya hecho.
**Depends on**: Phase 13
**Requirements**: SEO-KW-01, SEO-KW-02
**Success Criteria** (what must be TRUE):

  1. Las colecciones `pages` y `authors` exponen un campo `targetKeyword` con sub-campos `en`/`es` (texto simple), puramente editorial — no dispara ninguna llamada en vivo a Ahrefs/DinoRank/ninguna API externa
  2. Home tiene `targetKeyword` poblado con los picks de `research/keyword-research/KEYWORD-RESEARCH.md` (ES: "seo técnico", EN: "technical seo consultant")
  3. El author page de Juan tiene `targetKeyword` poblado con los picks de `research/keyword-research/KEYWORD-RESEARCH.md` (ES: "auditoría seo técnica", EN: "technical seo specialist")

**Plans**: TBD

### Phase 15: Sitemap XSL + HTML

**Goal**: El sitemap del sitio deja de ser XML crudo ilegible para cualquiera que lo abra directamente en el navegador, y gana una versión HTML navegable enlazada desde el footer (que ya tiene el link "Sitemap" apuntando a esta página).
**Depends on**: Phase 14
**Requirements**: SITEMAP-01, SITEMAP-02
**Success Criteria** (what must be TRUE):

  1. `sitemap.xml` recibe una hoja de estilos XSL — al abrir la URL directamente en el navegador se ve una tabla legible, no el XML crudo
  2. Existe una página `sitemap.html` navegable (listado de URLs agrupado por sección), enlazada desde el link "Sitemap" que el footer ya tiene

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 10.5 → 10.6 → 10.7 → 10.8 → 11 → 12 → 13 → 14 → 15 (Phase 6 en pausa, retoma tras el cierre de v1.1/v1.2)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Foundation | 10/10 | Complete    | 2026-07-09 |
| 2. Bilingüe + SEO | 5/5 | Complete    | 2026-07-09 |
| 3. Cloudinary Media Spike | 3/3 | Complete   | 2026-07-09 |
| 4. Migración Mongo → Postgres | 8/8 | Complete   | 2026-07-10 |
| 5. Frontend Pages | 13/13 | Complete   | 2026-07-10 |
| 6. Deploy + Cutover | 0/TBD | Paused (resumes after v1.1/v1.2) | - |
| 7. Design-Token Foundation | 1/1 | Complete   | 2026-07-10 |
| 8. shadcn Primitives + Global Chrome | 2/2 | Complete   | 2026-07-10 |
| 9. Hero + Resultados/KPI + Tipografía | 3/3 | Complete   | 2026-07-10 |
| 10. Cards/Listados + Autoría E-E-A-T | 2/2 | Complete   | 2026-07-10 |
| 10.5. Typography + Footer Schema | 2/2 | Complete   | 2026-07-10 |
| 10.6. Header/Footer Completion + Mobile Verification | 3/3 | Complete   | 2026-07-10 |
| 10.7. Component Gap-Fill (AboutSection + TestimonialSection) | 1/1 | Complete   | 2026-07-10 |
| 10.8. Hero Enrichment (CTA + Breadcrumbs) | 1/1 | Complete   | 2026-07-10 |
| 11. Verificación Cruzada Final | 3/3 | Complete   | 2026-07-10 |
| 12. Author Page E-E-A-T Expansion | 5/4 | Complete   | 2026-07-11 |
| 13. Home Content Population | 0/TBD | Not planned | - |
| 14. Target Keyword Field | 0/TBD | Not planned | - |
| 15. Sitemap XSL + HTML | 0/TBD | Not planned | - |
</content>
