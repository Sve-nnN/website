# Phase 1: Schema Foundation - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend Payload corre sobre PostgreSQL con disciplina de schema (`push:false`, migraciones committeadas) y solo las colecciones necesarias para contenido público, listas para recibir el contenido migrado y bilingüe de fases posteriores. Entrega: `payload.config.ts` con colecciones KEEP-list, adapter Postgres, migration tooling, y librería de blocks consolidada (~12-14). No incluye: routing i18n (Fase 2), storage Cloudinary real (Fase 3), datos migrados (Fase 4), frontend (Fase 5), deploy (Fase 6).

</domain>

<decisions>
## Implementation Decisions

### Colecciones: KEEP vs DROP (fuente de verdad: research/ARCHITECTURE.md)

- KEEP: Pages, Posts, Media (rewire a Cloudinary en fase 3, disco local en fase 1), Categories, Users (simplificado, sin campos ligados a MCP), Authors, CaseStudies, Testimonials, Clientes
- DROP: Works (retirado — decisión de Juan, se absorbe conceptualmente en CaseStudies enriquecido, no se migra 1:1), AdBanners, KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks

### Colección Clientes (decisión de Juan, no de research)

- Colección lean, solo para carrusel de logos: `name` (text), `logo` (upload → Media), `websiteUrl` (text/url)
- Sin campos de case study — es puramente credibilidad visual, no cuenta la historia del cliente

### Colección CaseStudies (modelo de referencia: ariannalupi.com/casos/, aprobado por Juan)

Campos estructurados, no rich text libre:
- Hero: `title`, `heroMetric` (ej. "$41K → $76K"), `heroSubtitle`
- Metadatos: `client` (relationship a Clientes, opcional), `sector`, `period` (texto o fecha inicio/fin), `services` (array de tags)
- `kpis`: array de 4 tarjetas {label, value}
- `clientContext`: rich text — sección "El cliente"
- `challenge`: array de bullets — sección "El reto"
- `solution`: array de pasos numerados {title, description} — sección "La solución"
- `results`: comparativa antes/después {periodBefore, periodAfter, metrics: array {label, before, after}}
- `conclusion`: rich text

### Colección Testimonials

- Atribución estructurada obligatoria: `name`, `role`, `company` — no citas anónimas

### Plugins: KEEP vs DROP (fuente de verdad: research/ARCHITECTURE.md + PLUGINS.md)

- KEEP: `@payloadcms/plugin-seo` (tabbed en Pages/Posts/CaseStudies), `@payloadcms/plugin-redirects`, `@payloadcms/email-resend`, `@payloadcms/db-postgres`
- DROP: `@payloadcms/plugin-mcp`, `@payloadcms/plugin-form-builder`, admin-bar, dashboard-analytics, GSC dashboard components, `@payloadcms/plugin-nested-docs` (a menos que un content audit posterior muestre necesidad de páginas anidadas — no asumir en fase 1)
- Storage Cloudinary: NO se configura en fase 1 — fase 1 usa disco local por defecto (`disableLocalStorage: false`), el adapter real llega en fase 3

### Blocks consolidados (~12-14, fuente: research/ARCHITECTURE.md, con overrides de Juan)

- `Hero` (variant field: home / listing / post-header / case-study-header)
- `Content`
- `ArchiveBlock` / `FeaturedGrid` (relationTo + mode: latest/manual)
- `CallToAction`
- `FAQ`
- `TestimonialsCarousel`
- `ContactFormBlock`
- `MediaBlock`
- `Code` — CONFIRMADO por Juan (posts técnicos con syntax highlighting)
- `RelatedPosts`
- `TableOfContentsBlock` — CONFIRMADO por Juan (posts largos)
- `ResultsSection`
- `Section` (wrapper genérico de layout, mantener si se usa para spacing/background)

**Descartado explícitamente:** `CalendlyEmbed` — decisión de Juan, un solo CTA (formulario de contacto) según research de competencia. `SidebarBanners`/`PostSidebar` (ligado a AdBanners dropeado). `Form` block genérico (superado por `ContactFormBlock` simple, sin plugin-form-builder).

### Claude's Discretion

- Nombres exactos de campos TypeScript/slugs dentro de cada colección (siempre que preserven el modelo de datos descrito arriba)
- Estructura interna de `payload.config.ts` (organización de archivos, agrupación admin)
- Orden de migraciones dentro de esta fase (no hay datos reales todavía, solo schema)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- Referencia de colecciones limpias: `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/payload.config.ts` y `/collections/*` — patrón de `push:false`, plugins mínimos
- Referencia de deploy standalone: `/Users/juan/Documents/Codigo/Arianna/apturio/website` — `next.config.mjs`, build command con `payload migrate && next build`
- Fuente de contenido actual a replicar (no copiar código, solo estructura de campos como referencia): `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/collections/`, `/src/blocks/`

### Established Patterns

- `@payloadcms/db-postgres` (Drizzle-based), `push: false` siempre en cualquier entorno no-throwaway
- Migraciones vía `payload migrate:create` / `payload migrate`, nunca schema push manual

### Integration Points

- `payload.config.ts` es el punto central — collections, plugins, db adapter, editor (lexical)
- Blocks se registran en el campo `layout` (o similar) de la colección `Pages`

</code_context>

<specifics>
## Specific Ideas

- Modelo de case study calcado de `ariannalupi.com/casos/ecommerce-vape/` (ver arriba) — Juan lo señaló explícitamente como referencia a seguir
- Clientes es deliberadamente mínimo — no se quiere que compita conceptualmente con CaseStudies

</specifics>

<deferred>
## Deferred Ideas

- CalendlyEmbed — descartado para v1, podría reconsiderarse en v2 si Juan empieza a ofrecer llamadas de consultoría de forma recurrente
- `@payloadcms/plugin-nested-docs` — diferido hasta que un content audit muestre necesidad real de jerarquía de páginas

</deferred>
