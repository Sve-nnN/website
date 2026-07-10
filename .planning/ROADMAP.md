# Roadmap: Juan Carlos Angulo — Portfolio (Payload rebuild)

## Overview

Reconstrucción de plataforma: mismo contenido y páginas del sitio actual, pero sobre Payload 3.85 + Next.js 15 con PostgreSQL (en vez de MongoDB), Cloudinary (en vez de Vercel Blob), y self-hosted en Hostinger (en vez de Vercel). El camino va de fundación disciplinada (schema Postgres + colecciones limpias) a capa bilingüe/SEO, resolución del único riesgo arquitectónico abierto (adapter de Cloudinary), migración de contenido 1:1 desde Mongo, construcción de las páginas públicas con los diferenciadores competitivos, y cierre con deploy + cutover operacional en Hostinger. Cada fase se apoya en la anterior: sin `push:false` y colecciones limpias no hay superficie estable para migrar; sin i18n y storage resueltos, la migración escribiría contra un target movedizo; sin contenido migrado no hay páginas que renderizar; sin páginas no hay qué desplegar.

**Milestone v1.1 — UI/UX Polish Pass:** Antes de retomar Phase 6 (Deploy + Cutover, en pausa), el sitio recibe una pasada de pulido visual profesional sobre los 16 bloques Payload-editables y componentes shadcn ya construidos en Phase 5. El camino va de fundación de tokens (elevación/motion CSS-puro, dark-mode branded, sin toggle) a primitivas shadcn + chrome global (máximo apalancamiento, se propaga a los 16 bloques), a hero/resultados/tipografía de contenido largo, a cards/listados + autoría E-E-A-T, y cierra con una verificación cruzada final (contraste, layout ES, grep de contenido hardcodeado, Lighthouse móvil). Motion/animación (carruseles, scroll-reveal) y un toggle visible de dark mode quedan explícitamente diferidos por decisión de Juan — UI-03 es solo corrección de tokens, sin UI de cambio de tema.

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
- [ ] **Phase 6: Deploy + Cutover** - Sitio en producción en Hostinger con checklist de go-live verificado (en pausa — retoma después de v1.1)
- [x] **Phase 7: Design-Token Foundation** - Tokens de sombra/motion CSS-puro, prefers-reduced-motion global, paleta dark branded (sin toggle) (completed 2026-07-10)
- [x] **Phase 8: shadcn Primitives + Global Chrome** - Primitivas shadcn refinadas con los nuevos tokens + header/footer restyled (completed 2026-07-10)
- [x] **Phase 9: Hero + Resultados/KPI + Tipografía** - Hero de mayor impacto, KPIs de case studies reforzados, jerarquía tipográfica en contenido largo (completed 2026-07-10)
- [ ] **Phase 10: Cards/Listados + Autoría E-E-A-T** - Tratamiento visual consistente en bloques tipo card + credenciales de autor prominentes
- [ ] **Phase 11: Verificación Cruzada Final** - Contraste WCAG, layout `/es`, grep de contenido hardcodeado, Lighthouse móvil sin regresión

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

**Plans**: 5 plans (3 waves) — EN PAUSA, retoma después de milestone v1.1

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
- [ ] 10-02-PLAN.md — Boundary-condition + ES-locale + E-E-A-T verification against real Postgres data and guarded seeded fixtures, closes with explicit non-blocking flag for Juan's pending author content

**UI hint**: yes

### Phase 11: Verificación Cruzada Final

**Goal**: El diff acumulado de todo el milestone se verifica de punta a punta contra los riesgos identificados en research — contraste, layout en español, contenido hardcodeado y performance — antes de dar por cerrado el pulido visual y retomar Phase 6.
**Depends on**: Phase 7, Phase 8, Phase 9, Phase 10
**Requirements**: UI-11, UI-12, UI-13, UI-14
**Success Criteria** (what must be TRUE):

  1. El contraste WCAG se re-verifica en ambos temas (light/dark) sobre el estado final de todos los cambios de esta fase, no solo sobre los checks parciales de cada fase individual
  2. El layout de todas las páginas tocadas se verifica en `/es` contra los títulos/textos más largos reales de los 72 posts/case studies migrados
  3. Un grep de contenido hardcodeado (strings de prueba, badges/stats sin campo Payload backing) en todos los bloques tocados por este milestone devuelve cero diffs en `src/blocks/*/config.ts` y `payload-types.ts`
  4. Un Lighthouse móvil corrido tras todos los cambios visuales no muestra regresión respecto al baseline de producción capturado antes de esta fase

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 (Phase 6 en pausa, retoma tras el cierre de 7-11)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Foundation | 10/10 | Complete    | 2026-07-09 |
| 2. Bilingüe + SEO | 5/5 | Complete    | 2026-07-09 |
| 3. Cloudinary Media Spike | 3/3 | Complete   | 2026-07-09 |
| 4. Migración Mongo → Postgres | 8/8 | Complete   | 2026-07-10 |
| 5. Frontend Pages | 13/13 | Complete   | 2026-07-10 |
| 6. Deploy + Cutover | 0/TBD | Paused (resumes after v1.1) | - |
| 7. Design-Token Foundation | 1/1 | Complete   | 2026-07-10 |
| 8. shadcn Primitives + Global Chrome | 2/2 | Complete   | 2026-07-10 |
| 9. Hero + Resultados/KPI + Tipografía | 3/3 | Complete   | 2026-07-10 |
| 10. Cards/Listados + Autoría E-E-A-T | 1/2 | In Progress|  |
| 11. Verificación Cruzada Final | 0/TBD | Not started | - |
</content>
