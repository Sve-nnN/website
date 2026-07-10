# Requirements: Juan Carlos Angulo — Portfolio (Payload rebuild)

**Defined:** 2026-07-09
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en contenido como en ejecución técnica (rendimiento y SEO impecables).

## v1 Requirements

### SCHEMA (Fundación Postgres + colecciones limpias)

- [x] **SCHEMA-01**: Backend corre sobre PostgreSQL vía `@payloadcms/db-postgres` con `push:false` desde el día uno (nunca push automático en prod)
- [x] **SCHEMA-02**: Colecciones limitadas a lo esencial para contenido público: Pages, Posts, Authors, CaseStudies, Categories, Media, Testimonials, Clientes, Users — sin Works (reemplazado por CaseStudies), sin AdBanners, BrokenLinks, GSCMetrics, KeywordMetrics, PageMetrics ni integraciones dinorank
- [x] **SCHEMA-03**: Migraciones de schema versionadas y committeadas (`payload migrate:create` / `payload migrate`), aplicadas en build/deploy, nunca manual en producción
- [x] **SCHEMA-04**: Case studies con campos estructurados siguiendo el modelo de referencia (`ariannalupi.com/casos/`): hero con métrica principal, metadatos (cliente/sector/período/servicios), 4 KPIs en tarjetas, sección "El cliente" (contexto), "El reto" (lista de problemas), "La solución" (proceso en pasos numerados), "Resultados" (comparativa antes/después por período), conclusión — no solo rich text libre
- [x] **SCHEMA-05**: Testimonios con atribución estructurada (nombre, rol, empresa) — no citas anónimas
- [x] **SCHEMA-06**: Librería de blocks consolidada (~12-14 blocks) reemplazando los ~35 blocks casi-duplicados del sitio actual
- [x] **SCHEMA-07**: Colección Clientes independiente (nombre, logo, link a sitio web) para alimentar el carrusel de logos de clientes — sin campos de case study, solo credibilidad visual

### I18N (Bilingüe + SEO)

- [x] **I18N-01**: Sitio bilingüe EN/ES con next-intl para routing/UI y localización nativa de Payload para campos de contenido, paridad completa entre ambos idiomas en cada tipo de contenido
- [x] **I18N-02**: `@payloadcms/plugin-seo` habilitado (tabbed) en Pages, Posts y CaseStudies — metas, OG, canonical
- [x] **I18N-03**: Sitemaps XML (pages/posts/authors/categories) y `robots.txt` generados dinámicamente, sin plugin oficial de sitemap (patrón `app/sitemap.ts` consultando Local API)
- [x] **I18N-04**: `llms.txt` / `llms-full.txt` mantenidos para descubribilidad GEO/AI search
- [x] **I18N-05**: JSON-LD schema markup (Person, Article, BreadcrumbList) escrito a mano en las páginas relevantes
- [x] **I18N-06**: `@payloadcms/plugin-redirects` instalado con middleware/route handler que ejecuta los redirects (el plugin solo gestiona la colección)

### MEDIA (Cloudinary)

- [x] **MEDIA-01**: Adapter de storage Cloudinary validado mediante spike — adapter custom sobre `@payloadcms/plugin-cloud-storage` (portado de la referencia `github.com/Sahitya1707/payload-cloudinary`, Payload 3.33→3.85) como primera opción, con `@jhb.software/payload-cloudinary-plugin` o `payload-storage-cloudinary` como fallback si el custom encuentra un bloqueo real
- [x] **MEDIA-02**: Registro del plugin de storage gateado por env vars (fallback a disco local en dev)
- [x] **MEDIA-03**: Transformaciones automáticas (`f_auto,q_auto`) para Core Web Vitals, compatibles con `next/image`

### MIGRATION (Mongo → Postgres, contenido 1:1)

- [x] **MIGR-01**: Inventario congelado de URLs vivas del sitio actual (crawleado desde sitemap/GSC) como contrato antes de migrar
- [x] **MIGR-02**: Script ETL standalone (fuera de `app/`) que usa Payload Local API en ambos configs (Mongo origen read-only, Postgres destino), en orden de dependencia: Media → Authors/Categories → Posts/CaseStudies/Testimonials/Clientes
- [x] **MIGR-03**: Slugs/URLs copiados verbatim del sitio actual (nunca regenerados desde el título)
- [x] **MIGR-04**: Tabla de remapeo ObjectId (Mongo) → ID nuevo (Postgres) para preservar relaciones
- [x] **MIGR-05**: Medios re-subidos a Cloudinary (no solo copia de URL), con URLs reescritas en todos los campos incluyendo rich text/blocks
- [x] **MIGR-06**: Mapa de redirects 301 para cualquier URL que cambie intencionalmente durante la migración

### CONTENT (Páginas públicas)

- [x] **CONT-01**: Réplica de todas las páginas actuales — home, blog (posts + listado), case studies (+ listado), authors (+ listado), contact, privacy, terms, search
- [x] **CONT-02**: Autor con bio + credenciales visibles en cada post/case study (E-E-A-T)
- [x] **CONT-03**: Blog con taxonomía de categorías y sección de posts destacados (no solo cronológico)
- [x] **CONT-04**: Búsqueda vía `@payloadcms/plugin-search`
- [x] **CONT-05**: Formulario de contacto funcional enviando emails vía Resend (`@payloadcms/email-resend`)
- [x] **CONT-06**: Analytics vía Google Search Console + GA4 externos, sin dashboards ni tooling SEO interno en el admin de Payload

### DEPLOY (Hostinger + cutover)

- [ ] **DEPLOY-01**: Build standalone (`payload migrate && next build`) con copia de `.next/static` y `public/` al bundle standalone
- [ ] **DEPLOY-02**: Proceso Node persistente en Hostinger Cloud/Business (PM2 o supervisor nativo del panel, confirmar tier real antes de finalizar)
- [ ] **DEPLOY-03**: Tamaño de pool de conexiones Postgres verificado contra el límite real del plan de Hostinger contratado
- [ ] **DEPLOY-04**: Checklist de go-live: redirects 301 verificados en vivo, robots.txt/noindex fetcheados de producción (no solo leídos en código), ambos locales muestreados, sitemap diffeado contra el inventario congelado
- [ ] **DEPLOY-05**: Congelamiento de contenido en el sitio actual inmediatamente antes de la corrida final de migración, para evitar pérdida de contenido en el corte

## v1.1 Requirements (UI/UX Polish Pass)

**Defined:** 2026-07-10
**Milestone goal:** Pasada de pulido visual profesional sobre los 16 bloques Payload-editables y componentes shadcn ya construidos en Phase 5, antes de deployar a Hostinger. Sin animación/motion (diferido), sin toggle de dark mode visible (solo corrección de tokens).

### UI (Fundamentos de tokens)

- [x] **UI-01**: Tokens de elevación (`--shadow-sm/md/lg/focus`) y de timing CSS-puro (`--motion-fast/base/slow`, `--ease-*`, sin librería JS) agregados a `globals.css`/`tailwind.config.ts`, mapeados a utilidades Tailwind (`boxShadow`, `transitionDuration`, `transitionTimingFunction`)
- [x] **UI-02**: Regla global `prefers-reduced-motion` agregada, aplicable a cualquier transición CSS existente o futura
- [x] **UI-03**: Paleta `.dark` reemplazada de gris genérico shadcn por tokens branded ember/navy derivados de la paleta light de `05-UI-SPEC.md`, sin toggle visible (solo corrección del token set para uso futuro)

### UI-PRIM (Primitivas shadcn + chrome global)

- [x] **UI-04**: Variantes `cva()` de primitivas shadcn (button, card, badge, input, select, tabs, sheet, navigation-menu, separator, skeleton, textarea, avatar) refinadas usando los tokens de sombra/spacing/tipografía ya vigentes — sin agregar nuevas dependencias
- [x] **UI-05**: `SiteHeader`/`SiteFooter` restyled con jerarquía visual clara y consistente con la dirección editorial-tech ya fijada

### UI-HERO (Hero + resultados/KPI)

- [x] **UI-06**: Hero restyled con tratamiento de mayor impacto visual (tipografía, spacing, jerarquía) manteniendo el copy 100% editable desde Payload
- [x] **UI-07**: `ResultsSection`/KPIs de case studies restyled para reforzar el patrón "métrica en el titular" ya decidido en PROJECT.md
- [x] **UI-08**: Jerarquía tipográfica (Inter/Fraunces) aplicada consistentemente en contenido largo (posts, case studies)

### UI-CARD (Cards/listados + autoría E-E-A-T)

- [x] **UI-09**: Tratamiento visual consistente de elevación/spacing en todos los bloques de listado tipo card (`ArchiveBlock`, `FeaturedPostsBlock`, `FeaturedCaseStudiesBlock`, related posts)
- [x] **UI-10**: `AuthorByline`/`AuthorCard` restyled para hacer visualmente prominentes las credenciales E-E-A-T (bio, años de experiencia, redes) ya modeladas en Phase 5

### UI-QA (Verificación cruzada final)

- [ ] **UI-11**: Contraste WCAG re-verificado en ambos temas (light/dark) tras los cambios de tokens de esta fase, no solo al final
- [ ] **UI-12**: Layout verificado en `/es` contra los títulos/textos más largos reales de los 72 posts/case studies migrados (español corre ~15-25% más largo que inglés)
- [ ] **UI-13**: Grep final de contenido hardcodeado (strings de prueba, badges/stats sin campo Payload backing) en todos los bloques tocados — cero diffs en `src/blocks/*/config.ts` y `payload-types.ts`
- [ ] **UI-14**: Lighthouse móvil corrido tras los cambios visuales, sin regresión respecto al baseline de producción capturado antes de esta fase

## v1.1 Requirements — Expansión (Component Gap-Fill + Chrome + Mobile-First)

**Defined:** 2026-07-10
**Milestone goal (expandido):** Tras feedback directo de Juan sobre el estado acumulado de Phases 7-10 (tipografía, header y footer insuficientes), el milestone se amplía: nueva dirección tipográfica (Array/Khand/Geist, la misma de `auditor`), header/footer ricos y editables, dos bloques nuevos identificados por research de gaps contra el sitio Payload viejo (`JuanPortfolio`), enriquecimiento de campos del Hero, y disciplina mobile-first estricta de ahora en adelante.

### UI-CHROME (Tipografía + Header/Footer — ya iniciado en Phase 10.5, continúa aquí)

- [x] **UI-15**: Cuatro familias tipográficas (Array display, Khand headings/UI, Geist Sans body, Geist Mono código) self-hosted y wireadas, reemplazando Inter/Fraunces (completado en Phase 10.5 Wave 1)
- [x] **UI-16**: Campo `dynamicColumns` en el global Footer (fuente: últimos posts / últimos case studies) con migración commiteada (completado en Phase 10.5 Wave 1)
- [ ] **UI-17**: `SiteHeader` con navegación visible completa, verificada mobile-first (menú hamburguesa/Sheet primero, nav horizontal desktop después)
- [ ] **UI-18**: `SiteFooter` con columnas manuales editables MÁS sección de contenido dinámico (últimos posts/case studies) funcionando en render real, sensación de footer "completo" no vacío
- [ ] **UI-19**: Verificación mobile real (~375px) con herramienta headless (Playwright u equivalente), no solo "riesgo bajo asumido" como en fases previas

### UI-GAPS (Bloques nuevos + campos de Hero — de COMPONENT-GAP-ANALYSIS.md)

- [ ] **UI-20**: Bloque `AboutSection` nuevo — bio narrativa consolidada (eyebrow + título + párrafos + foto) para credibilidad E-E-A-T, ausente hoy como sección independiente
- [ ] **UI-21**: Bloque `TestimonialSection` nuevo — spotlight de una sola cita de cliente, embebible dentro de un case study (entre "Solución" y "Resultados"), distinto del `TestimonialsCarousel` general existente
- [ ] **UI-22**: Campo de CTA/link array agregado al bloque `Hero` existente (el hero de home hoy no tiene botón de acción)
- [ ] **UI-23**: Breadcrumbs agregados a la variante `listing` del `Hero` existente

### UI-MOBILE (Disciplina mobile-first, aplica de ahora en adelante)

- [ ] **UI-24**: Todo el trabajo visual restante de este milestone (incluida la re-verificación final) se diseña y verifica mobile-first (~375px primero, luego ~768px, luego ~1280px) — no desktop-first con mobile como check final

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Expansion

- **CONTX-01**: Página dedicada de Speaking/media (requiere 5+ apariciones reales para justificarla)
- **CONTX-02**: Newsletter (requiere cadencia de contenido sostenida primero)
- **CONTX-03**: Franja de menciones de prensa/premios (solo si hay menciones reales, no fabricadas)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Dashboard interno de SEO tooling (AdBanners, BrokenLinks, GSCMetrics, KeywordMetrics, PageMetrics, dinorank, internal-links apply) | Es el "clutter" que esta reconstrucción existe para eliminar — confirmado en PROJECT.md y validado por research de competencia (ningún competidor expone tooling interno públicamente) |
| MongoDB como base de datos | Se reemplaza por Postgres para alinear con backend de referencia y evitar depender de Mongo Atlas externo en Hostinger |
| Vercel Blob storage | Se reemplaza por Cloudinary |
| `@payloadcms/plugin-mcp`, `@payloadcms/plugin-form-builder`, admin-bar, dashboard-analytics | Plugins no esenciales para el sitio público; contacto se resuelve con lógica simple + Resend, no formbuilder genérico |
| Múltiples funnels de lead-gen concurrentes | Anti-patrón identificado en research de competencia — un solo CTA: formulario de contacto |
| Plugin de comentarios en blog | No aporta a la credibilidad E-E-A-T buscada; mantenimiento extra sin valor claro para v1 |
| Colección Works | Se retira — Juan prefiere case studies enriquecidos como vitrina principal en vez de un concepto separado y más liviano; el contenido de Works no tiene réplica 1:1 obligatoria, se absorbe conceptualmente en CaseStudies durante el content audit de Fase 1 |
| Paquetes de comunidad de Cloudinary como primera opción | Se prueba primero el adapter custom sobre `@payloadcms/plugin-cloud-storage` (referencia validada `github.com/Sahitya1707/payload-cloudinary`); los paquetes de comunidad quedan como fallback, no como plan A — decisión actualizada tras research adicional |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 1 | Complete |
| SCHEMA-02 | Phase 1 | Complete |
| SCHEMA-03 | Phase 1 | Complete |
| SCHEMA-04 | Phase 1 | Complete |
| SCHEMA-05 | Phase 1 | Complete |
| SCHEMA-06 | Phase 1 | Complete |
| SCHEMA-07 | Phase 1 | Complete |
| I18N-01 | Phase 2 | Complete |
| I18N-02 | Phase 2 | Complete |
| I18N-03 | Phase 2 | Complete |
| I18N-04 | Phase 2 | Complete |
| I18N-05 | Phase 2 | Complete |
| I18N-06 | Phase 2 | Complete |
| MEDIA-01 | Phase 3 | Complete |
| MEDIA-02 | Phase 3 | Complete |
| MEDIA-03 | Phase 3 | Complete |
| MIGR-01 | Phase 4 | Complete |
| MIGR-02 | Phase 4 | Complete |
| MIGR-03 | Phase 4 | Complete |
| MIGR-04 | Phase 4 | Complete |
| MIGR-05 | Phase 4 | Complete |
| MIGR-06 | Phase 4 | Complete |
| CONT-01 | Phase 5 | Complete |
| CONT-02 | Phase 5 | Complete |
| CONT-03 | Phase 5 | Complete |
| CONT-04 | Phase 5 | Complete |
| CONT-05 | Phase 5 | Complete |
| CONT-06 | Phase 5 | Complete |
| DEPLOY-01 | Phase 6 | Pending |
| DEPLOY-02 | Phase 6 | Pending |
| DEPLOY-03 | Phase 6 | Pending |
| DEPLOY-04 | Phase 6 | Pending |
| DEPLOY-05 | Phase 6 | Pending |
| UI-01 | Phase 7 | Complete |
| UI-02 | Phase 7 | Complete |
| UI-03 | Phase 7 | Complete |
| UI-04 | Phase 8 | Complete |
| UI-05 | Phase 8 | Complete |
| UI-06 | Phase 9 | Complete |
| UI-07 | Phase 9 | Complete |
| UI-08 | Phase 9 | Complete |
| UI-09 | Phase 10 | Complete |
| UI-10 | Phase 10 | Complete |
| UI-11 | Phase 11 | Pending |
| UI-12 | Phase 11 | Pending |
| UI-13 | Phase 11 | Pending |
| UI-14 | Phase 11 | Pending |

**Coverage:**

- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-09*
*Last updated: 2026-07-10 — v1.1 roadmap created (Phases 7-11)*
