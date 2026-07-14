# Juan Carlos Angulo — Portfolio (Payload rebuild)

## What This Is

Sitio portfolio personal de Juan Carlos Angulo, ingeniero de software y experto SEO, reconstruido en Payload CMS sobre un backend limpio (sin herramientas internas de SEO tooling, dashboards de métricas ni integraciones experimentales que sí tiene el sitio Next.js actual en `JuanPortfolio`). Mismo contenido y mismas páginas que el sitio actual en localhost:3001, pero servido desde un CMS mantenible, con Resend para email, Cloudinary para medios, y desplegado en Hostinger (Cloud/Business con soporte Node.js).

## Core Value

El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en el contenido (case studies, blog) como en la ejecución técnica (rendimiento y SEO impecables). Si el rendimiento o el SEO fallan, el sitio no cumple su propósito.

## Requirements

### Validated

- **AUTHOR-01..06** (Phase 12): colección `Authors` recupera `expertise[]`/`education[]`/`experience[]`; author page con secciones Expertise/Educación/Experiencia diseñadas con `ui-ux-pro-max`; Person JSON-LD enriquecido (`sameAs`/`knowsAbout`/`hasCredential`); contenido real de Juan poblado en ambos locales — verificado en vivo por `.planning/v1.2-MILESTONE-AUDIT.md`
- **ABOUT-01, ABOUT-02** (Phase 13): `AboutSection` extendido con `features[]` (4 items) + `ctaText`/`ctaLink`; Home poblado con "Mi enfoque en Consultoría Técnica" — verificado en vivo
- **FAQ-01** (Phase 13): bloque `FAQ` poblado en Home con 5 preguntas reales — verificado en vivo
- **SEO-KW-01, SEO-KW-02** (Phase 14): campo editorial `targetKeyword` (en/es) en `pages`/`authors`, poblado con picks reales de keyword research en Home y Author page — verificado en vivo, sin llamadas a APIs externas
- **SITEMAP-01, SITEMAP-02** (Phase 15): `sitemap.xml` con hoja de estilos XSL navegable + `sitemap.html` nuevo enlazado desde el footer — verificado en vivo
- **HERO-ANIM-01..06** (Phases 16-17): fondo del Hero home reemplazado por `GrainGradient` (`@paper-design/shaders-react`), colores de tokens, copy intacto, `prefers-reduced-motion` respetado, sin reactividad al mouse (implementada y quitada a pedido de Juan), Lighthouse/CWV verificado sin regresión significativa — verificado en vivo por `.planning/v1.3-MILESTONE-AUDIT.md`
- **SEO-STRUCT-01/02, SEO-META-01** (Phase 18): H1 semántico real en `/contact` (sr-only) y en la Author page (vía `AuthorCard.asPageHeading`); Authors sumada a `@payloadcms/plugin-seo` — verificado en vivo por `.planning/v1.4-MILESTONE-AUDIT.md`
- **SEO-SVC-01/02/03** (Phase 19): página "Servicios" + 4 landings individuales (Auditoría SEO Técnica, Consultoría SEO, Desarrollo Full-Stack con SEO integrado, SEO para IA/GEO), sin precios, dual URL segment (`/servicios`+`/services`), GEO page enlaza `/llms.txt`/`/llms-full.txt` — verificado en vivo, 10 combinaciones de URL curl-verificadas
- **SEO-LOCAL-01/02** (Phase 20): landings "SEO técnico en Lima" (grounded en presencia física real + taller DinoRANK/Arianna Lupi) y "SEO técnico en Madrid/España" (framing remoto honesto + datos reales de keyword research ES) — contenido genuinamente diferenciado, no templated
- **SEO-HOME-01/02** (Phase 21): copy de Home reforzado con el ángulo Next.js/Payload/SEO-en-el-código; nav principal enlaza a `/services` — verificado en vivo
- **BREAD-01/02/03, SEOTECH-01/02/03, SVCHOME-01/02/03, SVCPOL-01..09** (Phases 22-25, milestone v1.5): breadcrumbs visual + `BreadcrumbList` JSON-LD en Servicios desde una única fuente (`buildTrail()`); canonical/hreflang correcto en las 4 combinaciones de URL de servicio + `metadataBase` sitewide; bloque `ServicesShowcase` en Home leyendo `SERVICE_SLUGS` en vivo; anatomía visual completa (10 bloques) + prueba social reforzada + tarjeta de alcance sin precio + case study relacionado en las 4 landings de servicio, copy humanizado — 18/18 requirements verificados en vivo (curl real + code review) durante la ejecución de cada fase, sin auditoría formal de milestone (lifecycle audit/complete/cleanup diferido a pedido de Juan mientras Phase 6 sigue abierta). Fase 25 encontró y corrigió 2 bugs reales: leak de páginas en borrador vía Local API (Phase 24) y 3 instancias de campos no-localizados de Payload rompiendo enlaces/labels por idioma.
- **LOCAL-01, LOCAL-02** (Phase 33, milestone v1.7): nuevo variant `local-landing` en el bloque Hero (badge de ciudad, anillo decorativo, stat inline, CTA row) + block nuevo `LocalProofSection` (3 stats + testimonial), registrados en Payload, cero tokens nuevos — verificado en vivo por `.planning/v1.7-MILESTONE-AUDIT.md`
- **LOCAL-03, LOCAL-04** (Phase 34): `/seo-tecnico-madrid` y `/seo-tecnico-lima` usan el Hero `local-landing` con diferenciación estructural real por ciudad (anillo lado/opacity/flip, CTA row single vs doble) confirmada por diff de config, no solo copy — verificado en vivo
- **LOCAL-05** (Phase 34): `LocalProofSection` incorporado a ambas landings, estructuralmente completo y funcionando — **con caveat**: contenido en su mayoría `[PLACEHOLDER]` (solo 1 stat real de Lima, taller DinoRANK/Arianna Lupi 2025), autorizado explícitamente por Juan a la espera de datos reales de clientes vía Google Search Console; ver `.planning/v1.7-MILESTONE-AUDIT.md`
- **POLISH-01..06** (Phase 35): revisión `ui-ux-pro-max` de los 28 componentes restantes del .pen (UI primitives, chrome, Hero variants existentes, bloques de contenido, autoría) contra `designs/current-site-real.pen`; 6 micro-mejoras genuinas implementadas (incluido un bug real preexistente: `text-destructive-foreground` sin efecto en Button/Badge destructive por falta de `.foreground` en el token `destructive`), 6 descartadas con razón explícita — `HeroGrainGradient` confirmado intacto — verificado en vivo por `.planning/v1.7-MILESTONE-AUDIT.md`
- **REG-01, REG-02** (Phases 32, 36): baseline de Lighthouse/CWV + H1/JSON-LD capturado antes de tocar componentes, gate de cierre PASS 6/6 rutas (sin caída >5pt de performance, sin cruce de banda CWV, H1/JSON-LD byte-idénticos) — verificado en vivo por `.planning/v1.7-MILESTONE-AUDIT.md`

### Active

- [ ] Réplica de contenido: home, blog (posts + listado), case studies (+ listado), authors (+ listado), contact, privacy, terms, search — mismas páginas que el sitio actual
- [ ] Bilingüe EN/ES (next-intl o localización nativa de Payload) igual que el sitio actual
- [ ] Backend Payload limpio: solo colecciones necesarias para el contenido público (Pages, Posts, Authors, CaseStudies, Categories, Media, Testimonials, Clientes, Users) — sin Works (reemplazado por CaseStudies enriquecido), sin AdBanners, BrokenLinks, GSCMetrics, KeywordMetrics, PageMetrics, dinorank, internal-links tooling
- [ ] Plugin SEO de Payload (`@payloadcms/plugin-seo`) tabbed en Pages/Posts, metas, OG, canonical
- [ ] Sitemaps XML (pages/posts/authors/categories) y `robots.txt`
- [ ] `llms.txt` / `llms-full.txt` (el sitio actual ya los tiene — mantener para GEO/AI search)
- [ ] Formulario de contacto enviando emails vía Resend (`@payloadcms/email-resend`)
- [ ] Media servida desde Cloudinary (reemplaza Vercel Blob del ejemplo aprendoclub)
- [ ] Base de datos PostgreSQL (Drizzle adapter, igual que aprendoclub)
- [ ] Migración/seed de todo el contenido actual (posts, case studies, authors, testimonials, works/clientes) desde JuanPortfolio (Mongo) hacia el nuevo esquema Postgres
- [ ] Deploy standalone Next.js en Hostinger (Cloud/Business con Node.js), sin depender de Vercel
- [ ] Rendimiento optimizado: Core Web Vitals en verde, imágenes optimizadas vía Cloudinary, output standalone
- [ ] Research de competencia (portfolios de ingenieros/SEO experts) para incorporar tácticas que funcionan

**Nota:** todos los requirements "Active" listados arriba corresponden funcionalmente a trabajo de Phases 1-5 (Schema, i18n/SEO, Cloudinary, Migración, Frontend Pages), ya completado según ROADMAP.md, y a Phase 6 (Deploy + Cutover), el único ítem abierto a nivel de proyecto — ver "Current Milestone" más abajo. Estos checkboxes reflejan la redacción original de v1 y se cerrarán formalmente cuando Phase 6 verifique el sitio en producción.

### Out of Scope

- Dashboard interno de analytics/SEO tooling (AdBanners, BrokenLinks, GSCMetrics, KeywordMetrics, PageMetrics, dinorank, internal-links apply, keyword-score/coverage) — es el "clutter" que se descarta explícitamente en esta reconstrucción. **Aclaración v1.2:** esta exclusión es sobre el dashboard/live-integration de dinorank dentro de la app; el campo editorial `targetKeyword` (v1.2) y el research puntual vía DinoRank API para elegir esos valores son un insumo estático de investigación, no una integración en vivo — no reabre esta exclusión.
- MongoDB — se reemplaza por Postgres para alinear con el backend de referencia (aprendoclub) y la oferta de DB gestionada de Hostinger
- Vercel Blob storage — se reemplaza por Cloudinary
- Plugins de Payload no esenciales para el sitio público: admin-bar, dashboard-analytics, plugin-form-builder (se resuelve contacto con lógica simple + Resend, no formbuilder genérico) — salvo que la investigación de research determine que alguno es necesario. **Actualización 2026-07-12:** `@payloadcms/plugin-mcp` fue instalado y activado fuera del scope de v1.4 (trabajo paralelo de la sesión principal, no de este milestone) — se retira de esta lista de exclusión ya que ya está en el proyecto; no formaba parte de los requirements de v1.4 y no fue tocado por las fases 18-21.

## Context

- Sitio actual corriendo en `localhost:3001`, código fuente real en `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio` (el directorio `portfolio` estaba vacío — confusión inicial resuelta).
- Stack actual: Payload 3.61.1 + Next.js 15 (App Router), MongoDB, next-intl para `[locale]`, Vercel Blob storage, Resend ya integrado (`@payloadcms/email-resend`), muchos plugins/colecciones de tooling SEO interno.
- Referencia de frontend/deploy en Hostinger: `/Users/juan/Documents/Codigo/Arianna/apturio/website` — Next.js 15 + Payload 3, `output: 'standalone'`, corre como Node app en Hostinger VPS/Cloud, Postgres vía Neon (pooler), storage S3-compatible (Cloudflare R2) via `@payloadcms/storage-vercel-blob`-equivalente condicional por env vars.
- Referencia de backend limpio: `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub` — Payload 3.85 con Postgres, colecciones lean (Users, Media, Testimonios, ClientesTrabajados, Programas, TeamMembers, Faq, Pages, Category, Author, BlogPost), plugins mínimos (nested-docs, redirects, seo), sin tooling interno.
- Se detectó y resolvió una carpeta `.planning` huérfana en `/Users/juan/Documents/Codigo/.planning` (movida a `.planning.orphan-backup-20260709`) que interfería con la detección de raíz de proyecto de gsd-sdk.
- Modelo de case study a replicar (referencia de competencia de Juan, `ariannalupi.com/casos/ecommerce-vape/`): hero con métrica principal (ej. "$41K → $76K"), metadatos (cliente/sector/período/servicios), 4 KPIs en tarjetas, sección "El cliente" (contexto), "El reto" (lista de problemas), "La solución" (proceso en pasos numerados), "Resultados" (comparativa antes/después por período), conclusión estratégica, CTA doble. Coincide con el patrón "métrica en el titular" ya identificado en FEATURES.md.
- Con v1.1, v1.2, v1.3 y v1.4 cerrados, el único trabajo abierto a nivel de proyecto es **Phase 6 (Deploy + Cutover)**, en pausa, retoma solo cuando Juan dé el visto bueno explícito con credenciales reales de Hostinger/DNS/Resend (`RESEND_API_KEY` sigue siendo placeholder/inválido).
- `@payloadcms/plugin-mcp` fue instalado y activado en el repo (2026-07-12, trabajo paralelo fuera de v1.4) — API keys collection agregada vía migración, fuera del scope de este milestone.

## Constraints

- **Hosting**: Hostinger Cloud/Business con soporte Node.js (confirmado por Juan) — arquitectura debe seguir el patrón standalone de apturio, no asumir capacidades de Vercel (ISR, edge functions, ni ejecución serverless nativa)
- **Base de datos**: PostgreSQL — Hostinger ofrece DB gestionada en estos planes; validar límites de conexión (igual que Neon pooler en apturio) durante research/roadmap
- **Storage**: Cloudinary para medios — Payload no tiene adapter oficial para Cloudinary; investigar plugin de comunidad o integración custom antes de planear la fase de media
- **Email**: Resend vía `@payloadcms/email-resend`
- **Contenido**: debe ser réplica 1:1 del contenido/páginas actuales — no es un rediseño de información, es una migración de plataforma con backend limpio
- **Idiomas**: EN + ES, mismo alcance que el sitio actual

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Proyecto nuevo en `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload` (carpeta hermana) | El dir `portfolio` estaba vacío y no correspondía al sitio real; se evita tocar el sitio en producción mientras se reconstruye | ✓ Good |
| Hosting: Hostinger Cloud/Business con Node.js | Confirmado por Juan — plan soporta Node.js persistente, necesario para Payload | ✓ Good |
| Base de datos: PostgreSQL | Alinea con backend de referencia (aprendoclub) y evita depender de Mongo Atlas externo en Hostinger | ✓ Good |
| Idiomas: EN + ES | Mismo alcance SEO internacional que el sitio actual | ✓ Good |
| Works vs Clientes: se elimina Works, Clientes queda como colección propia solo para carrusel de logos (nombre, logo, link a web); CaseStudies se enriquece con el modelo estructurado de ariannalupi.com/casos/ | Juan no quiere "Works" como concepto separado — prefiere case studies ricos como vitrina principal, y Clientes como pieza aparte solo para credibilidad visual (logos) | ✓ Good |
| SpeakingEvents como colección standalone (no array field en Authors) | Juan pidió poder seguir agregando eventos post-launch sin reabrir el schema de Authors (pedido directo, mid-Phase 12) | ✓ Good |
| `targetKeyword` (v1.2) como campo editorial informativo, sin llamadas en vivo a DinoRank/Ahrefs | Mantiene la exclusión de "dinorank tooling" de Out of Scope — el research vía API es insumo estático, no integración en vivo | ✓ Good |
| Páginas de servicio (v1.4) reusan la colección `Pages` existente en vez de una colección `Services` nueva | Son landings de marketing con la misma forma que cualquier doc de `Pages` (bloques Hero/Content/FAQ/CallToAction) — una colección nueva hubiera significado migración + admin UI + plumbing duplicado sin beneficio funcional | ✓ Good |
| Geo-pages (v1.4): Lima grounded en presencia física real, Madrid honesto sobre trabajo remoto sin oficina física | Evita el patrón templated/find-replace-por-ciudad que Juan rechazó explícitamente — cada página necesitaba un argumento genuinamente distinto, no solo el nombre de la ciudad cambiado | ✓ Good |
| Database Safety rule (root CLAUDE.md, agregada durante v1.4, luego relajada por Juan) | Un incidente real de pérdida de datos (migración de fase 19 sin backfill, recuperada vía Neon PITR) forzó una regla dura de aprobación humana antes de cualquier escritura contra la DB real; Juan luego la relajó a solo operaciones destructivas (DROP/TRUNCATE/delete/reshape con pérdida) una vez que confió en el patrón | ✓ Good |

## Current Milestone: ninguno (planificando el siguiente)

Con v1.7 cerrado (2026-07-14, 13/13 requirements Done, ver `.planning/v1.7-MILESTONE-AUDIT.md`), no hay milestone activo. Dos candidatos abiertos esperan que Juan decida cuál retomar primero:

- **v1.6 Track B — Content Humanization** (Phases 29-31, pausado): auditoría de campos + humanización de copy real de la DB con la voz de Juan, prerequisito duro de seguridad de datos ya investigado (research completo, ver `.planning/research/SUMMARY-v1.6.md`).
- **Phase 6 — Deploy + Cutover** (pausado): sitio en producción en Hostinger, bloqueado en `RESEND_API_KEY` real y credenciales de Hostinger/DNS.

## Milestone Anterior: v1.7 Local Landing Design + Component Polish Pass (cerrado 2026-07-14)

Implementó en código las 2 piezas nuevas que el archivo de diseño Pencil `designs/current-site-real.pen` agrega para las landing pages locales (Lima/Madrid) — hasta entonces ambas reusaban bloques genéricos sin diferenciación visual real — y pasó una revisión de polish visual sobre los 28 componentes restantes que el .pen ya mapea 1:1 contra el código actual. 5 fases (32-36): baseline de regresión (Lighthouse/CWV + H1/JSON-LD) antes de tocar nada; Hero variant `local-landing` (badge de ciudad, anillo decorativo, stat inline, CTA row) + block nuevo `LocalProofSection` (3 stats + testimonial), cero tokens nuevos; aplicación real y diferenciada a Madrid (anillo derecha/opacity 0.25/CTA único) y Lima (anillo espejado izquierda/opacity 0.35/CTA doble); pasada `ui-ux-pro-max` sobre los 28 componentes restantes (6 micro-mejoras fixeadas, incluido un bug real preexistente en el token `text-destructive-foreground`); gate de cierre PASS 6/6 rutas sin regresión de performance/SEO. Único gap: LOCAL-05 (contenido de `LocalProofSection`) queda con placeholders en su mayoría — autorizado explícitamente por Juan, a la espera de datos reales de clientes de Lima/Madrid (conexión a Google Search Console en curso). Auditoría (`.planning/v1.7-MILESTONE-AUDIT.md`) verificó 13/13 requirements, status `gaps_found` (0 bloqueantes / 1 no bloqueante ya autorizado). Ver `.planning/MILESTONES.md` para el detalle completo.

## Milestone Pausado: v1.6 UI/UX Pro Max II — Componentes, Motion y Voz (Track A cerrado, Track B pendiente)

**Goal:** Segunda pasada `ui-ux-pro-max` sobre los componentes/plantillas que v1.5 no tocó (navbar, heroes de listing, CTA strip, FAQ, clientes, testimonios, grillas de blog, case studies), sumar micro-animaciones consistentes con la estética del hero de Home sin pegarle a performance, y humanizar todo el copy real de la base de datos con la voz/tono de Juan grounded en cómo hablan sus competidores directos (incluida Aleyda Solis, ya identificada en el research de v1.5).

**Target features:**
- Pasada de diseño (`ui-ux-pro-max`) sobre: CTA strip (sacarle el `full-width vw` que a Juan no le gusta), navbar/`SiteHeader`, bloques Hero (variantes listing/post-header/case-study-header), FAQ, sección de clientes (`ClientLogosBlock`), sección de testimonios (`TestimonialsCarousel`/`TestimonialSection`), grilla de blog (`/blog`), grilla de blog destacados (`FeaturedPostsBlock`), página de case studies (listado + detalle)
- Research + selección de librería de micro-animaciones (gsap / motion / animejs u otra más liviana) evaluada por peso/performance, no solo features — debe seguir la estética ya validada del `HeroGrainGradient` de Home sin degradar Lighthouse/CWV
- Implementación de micro-animaciones consistentes (scroll-reveal, hover states, transiciones) en los componentes de la pasada de diseño, respetando `prefers-reduced-motion`
- Research de tono/voz de competidores directos (Arianna Lupi, Aleyda Solis) para calibrar la voz humanizada de Juan: español neutro, sin voceo, profesional pero directo
- Pasada de humanización sobre TODO el copy real almacenado en la DB (Payload) — no solo el código nuevo — aplicando la skill `humanizer` con la voz calibrada arriba, sin marcas de escritura de IA, sin em/en dash
- Baseline de regresión (Lighthouse/CWV + H1/JSON-LD) antes de tocar nada, gate de cero regresión al cerrar, mismo patrón que v1.5 Phase 25

## Milestone Anterior: v1.5 UI/UX Pro Max — Polish y Competitividad (cerrado 2026-07-13)

Segunda pasada de diseño profesional sobre Servicios y Home, priorizada por research de competencia directa (Arianna Lupi, Aleyda Solis — ambas sin URLs de servicio dedicadas ni breadcrumbs). 4 fases (22-25): breadcrumbs visual + `BreadcrumbList` JSON-LD en Servicios desde una única fuente compartida (`buildTrail()`); canonical/hreflang correcto en las 4 combinaciones de URL de servicio + `metadataBase` sitewide (colapsando contenido duplicado); bloque `ServicesShowcase` en Home leyendo `SERVICE_SLUGS` en vivo, 100% aditivo; y polish visual completo (anatomía de 10 bloques, prueba social reforzada, tarjeta de alcance sin precio, case study relacionado, CTA repetido) en las 4 landings de servicio, con copy humanizado. Durante el milestone se encontraron y corrigieron varios bugs reales: leak de páginas en borrador vía Local API bypaseando `access` (Phase 24), y — el patrón más recurrente del milestone — 3+ instancias de campos no-localizados de Payload (`Header.navItems.url`, `Content` block `link.url`, `TestimonialsCarousel.title`) rompiendo enlaces/labels específicamente por idioma, resuelto extrayendo helpers puros de normalización (`src/lib/service-slugs.ts`) aplicados en render-time. Un gate de regresión de Phase 25 dio FAIL inicial por ruido de medición (procesos `next dev` huérfanos compitiendo por CPU durante Lighthouse) — confirmado con entorno limpio + ruta control, de paso se encontró y corrigió una regresión real de accesibilidad (contraste insuficiente + salto de heading). 18/18 requirements verificados en vivo. Ver `.planning/MILESTONES.md` para el detalle completo. **Phase 6 (Deploy + Cutover) sigue abierta y en pausa**, fuera de scope de v1.5 y v1.6 por decisión explícita de Juan.

## Milestone Anterior: v1.4 SEO Competitivo — Auditoría y Optimización (cerrado 2026-07-12)

Investigación en profundidad de encabezados/metadata/servicios/precios/SEO local de 4 competidores directos (`research/SEO-COMPETITIVE-AUDIT-v1.4.md`) encontró 2 bugs técnicos reales (H1 faltante en `/contact` y en la Author page) y gaps de posicionamiento puro (sin páginas de servicio, sin "SEO para IA/GEO" nombrado pese a tener la infraestructura, sin SEO local). 4 fases (18-21): fixes técnicos de H1 + metadata de Author page vía `plugin-seo` (Phase 18); página "Servicios" + 4 landings individuales incluyendo SEO para IA/GEO, con rutas duales `/servicios`+`/services` (Phase 19); 2 geo-pages (Lima, Madrid) con contenido genuinamente diferenciado, no templated (Phase 20); Home reforzado con el ángulo Next.js/Payload/SEO-en-el-código + link a Servicios en el nav (Phase 21). Durante Phase 19 se encontró y corrigió un bug Crítico real (`CallToAction.richText` sin `localized: true`, colisionando el CTA bilingüe) — el primer intento de migración de fix causó pérdida de datos real contra la DB de producción (recuperada vía Neon point-in-time restore), lo que produjo la regla "Database Safety" en `CLAUDE.md` (luego relajada por Juan a solo operaciones destructivas). Durante Phase 21 se encontró y corrigió otro bug real (colisión de id en `Header.navItems`, array compartido no-localizado). Auditoría (`.planning/v1.4-MILESTONE-AUDIT.md`) verificó 10/10 requirements en vivo contra código real y servidor corriendo, 0 gaps bloqueantes, 3 items de deuda técnica no bloqueante documentados. Ver `.planning/MILESTONES.md` para el detalle completo.

## Milestone Anterior: v1.3 Hero Grainy Gradient Animation (cerrado 2026-07-12)

Reemplazó el fondo sólido del Hero home por un gradiente animado con grano vía WebGL (`@paper-design/shaders-react`, componente `GrainGradient`, ~5KB zero-dependency), tras descartar anime.js (tweening, no genera shaders) y three.js/ShaderGradient (~150KB+, contradice presupuesto de performance). Iteración de diseño en vivo con Juan: `wave` → `ripple` → `blob` final, fondo casi-negro (`#0A0A0F`). Reactividad al mouse implementada de verdad y luego quitada por completo a pedido explícito de Juan. Lighthouse verificado contra build de producción: Δ-3 puntos de Performance en ambos locales, dentro del umbral acordado, CWV sin regresión real. Revierte puntualmente la exclusión de motion/animación de v1.1 (UI-02/UI-03) solo para este fondo. Auditoría (`.planning/v1.3-MILESTONE-AUDIT.md`) verificó 6/6 requirements en vivo, 0 gaps bloqueantes. Ver `.planning/MILESTONES.md` para el detalle completo, incluida una nota de proceso sobre una confusión corregida en la sesión respecto a una preferencia de diseño de Juan.

## Milestone Anterior: v1.2 Content Parity — Home + Author Page (cerrado 2026-07-12)

Cerró las 3 brechas reales de contenido/componentes detectadas al comparar Home y Author page del rebuild contra el sitio de referencia real (`JuanPortfolio`), más el pedido de keyword objetivo (EN/ES) informado por research real. Author page ganó 4 secciones nuevas (Expertise, Educación y Certificaciones, Experiencia, Eventos como ponente — esta última añadida mid-milestone por pedido de Juan), Home se pobló con "Mi enfoque en Consultoría Técnica" y el bloque FAQ, se agregó el campo editorial `targetKeyword`, y el sitemap ganó una versión XSL navegable + `sitemap.html`. Durante el milestone se encontraron y corrigieron 4 bugs reales fuera del scope original: gap de eyebrow/título de `AboutSection` en inglés, un bloqueo de mapeo del icon-picker de admin, una fuga de acceso a nivel de campo en `targetKeyword`, y bugs de labels ES vacíos en Footer y Header. Auditoría (`.planning/v1.2-MILESTONE-AUDIT.md`) verificó 18/18 requirements en vivo contra el dev server y la DB real; cerrado con 0 gaps bloqueantes y 2 no bloqueantes aceptados explícitamente por Juan (click-through manual del icon-picker pendiente, y un 500 pre-existente de Phase 1 en `GET /api/posts?depth>=1` sin impacto en el sitio real). Ver `.planning/MILESTONES.md` para el detalle completo.

## Milestone Anterior: v1.1 UI/UX Polish Pass (cerrado parcialmente 2026-07-11)

Todos los componentes del sitio recibieron una pasada de diseño profesional (Phases 7-11, 10/11 completas). Incluyó auditoría de los 16 bloques actuales contra los ~39 bloques del sitio Payload viejo, cierre de gaps genuinos (AboutSection, TestimonialSection), enriquecimiento del Hero (CTA/breadcrumbs), y verificación cruzada final (contraste WCAG, layout `/es`, Lighthouse móvil). **Phase 6 (Deploy + Cutover) sigue abierta y en pausa** — no se re-numera, retoma cuando Juan dé el visto bueno con credenciales reales de Hostinger/DNS/Resend. v1.2 corrió en paralelo sobre contenido/componentes, sin bloquear ni depender del cierre de Phase 6.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-14 — milestone v1.7 (Local Landing Design + Component Polish Pass) cerrado, 13/13 requirements Done (LOCAL-05 con caveat de contenido placeholder, autorizado por Juan); sin milestone activo — candidatos: v1.6 Track B (Content Humanization, fases 29-31, pausado) y Phase 6 Deploy + Cutover (pausado)*
