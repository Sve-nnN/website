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
- Plugins de Payload no esenciales para el sitio público: admin-bar, plugin-mcp, dashboard-analytics, plugin-form-builder (se resuelve contacto con lógica simple + Resend, no formbuilder genérico) — salvo que la investigación de research determine que alguno es necesario

## Context

- Sitio actual corriendo en `localhost:3001`, código fuente real en `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio` (el directorio `portfolio` estaba vacío — confusión inicial resuelta).
- Stack actual: Payload 3.61.1 + Next.js 15 (App Router), MongoDB, next-intl para `[locale]`, Vercel Blob storage, Resend ya integrado (`@payloadcms/email-resend`), muchos plugins/colecciones de tooling SEO interno.
- Referencia de frontend/deploy en Hostinger: `/Users/juan/Documents/Codigo/Arianna/apturio/website` — Next.js 15 + Payload 3, `output: 'standalone'`, corre como Node app en Hostinger VPS/Cloud, Postgres vía Neon (pooler), storage S3-compatible (Cloudflare R2) via `@payloadcms/storage-vercel-blob`-equivalente condicional por env vars.
- Referencia de backend limpio: `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub` — Payload 3.85 con Postgres, colecciones lean (Users, Media, Testimonios, ClientesTrabajados, Programas, TeamMembers, Faq, Pages, Category, Author, BlogPost), plugins mínimos (nested-docs, redirects, seo), sin tooling interno.
- Se detectó y resolvió una carpeta `.planning` huérfana en `/Users/juan/Documents/Codigo/.planning` (movida a `.planning.orphan-backup-20260709`) que interfería con la detección de raíz de proyecto de gsd-sdk.
- Modelo de case study a replicar (referencia de competencia de Juan, `ariannalupi.com/casos/ecommerce-vape/`): hero con métrica principal (ej. "$41K → $76K"), metadatos (cliente/sector/período/servicios), 4 KPIs en tarjetas, sección "El cliente" (contexto), "El reto" (lista de problemas), "La solución" (proceso en pasos numerados), "Resultados" (comparativa antes/después por período), conclusión estratégica, CTA doble. Coincide con el patrón "métrica en el titular" ya identificado en FEATURES.md.
- Con v1.1 y v1.2 cerrados, el único trabajo abierto a nivel de proyecto es **Phase 6 (Deploy + Cutover)**, en pausa, retoma solo cuando Juan dé el visto bueno explícito con credenciales reales de Hostinger/DNS/Resend (`RESEND_API_KEY` sigue siendo placeholder/inválido).

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

## Current Milestone

Ninguno activo. v1.1 (UI/UX Polish Pass) y v1.2 (Content Parity — Home + Author Page) están cerrados — ver secciones "Milestone Anterior" más abajo y `.planning/MILESTONES.md` para el historial completo. **Phase 6 (Deploy + Cutover)** sigue siendo el único trabajo abierto a nivel de proyecto, en pausa, a la espera de que Juan confirme el arranque con credenciales reales de Hostinger/DNS/Resend. El próximo milestone (v1.3 o el que Juan defina) todavía no ha sido iniciado.

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
*Last updated: 2026-07-12 — milestone v1.2 closed, 18/18 requirements validated; awaiting next milestone (Phase 6 Deploy + Cutover remains the sole open project-wide item, paused pending Juan's go-ahead with real Hostinger/DNS/Resend credentials)*
