# Phase 5: Frontend Pages - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Todas las páginas públicas del sitio actual existen en el nuevo frontend, renderizando el contenido migrado, con los diferenciadores competitivos (case studies estructurados, autoría E-E-A-T, búsqueda, taxonomía) implementados según lo identificado en research. Páginas requeridas: home, blog (listado + post), case studies (listado + detalle), authors (listado + perfil), contact, privacy, terms, search — en ambos locales (EN/ES).

</domain>

<decisions>
## Implementation Decisions

### Fidelidad visual y libertad de diseño
- Juan da libertad de diseño explícita para esta fase — NO es una réplica pixel-perfect obligatoria del sitio viejo (JuanPortfolio), a diferencia del resto del proyecto (que sí exige réplica 1:1 de contenido/páginas).
- Basarse en: el sitio viejo JuanPortfolio (estructura de páginas, blocks, heros existentes en `src/heros/` y `src/blocks/`) como referencia funcional, MÁS un research de competidores/mejores prácticas de UI/UX para mejorar sobre esa base.
- Correr `gsd-ui-phase` (el research + UI-SPEC contract de GSD) para este research y para fijar el contrato de diseño antes de planear — es el mecanismo ya disponible en el proyecto para esto ("skill de ui ux pro max" = gsd-ui-phase).

### HARD RULE — Todo debe ser editable desde Payload
- Cada componente y sección visual de cada página debe modelarse como un bloque/campo editable en el admin de Payload (Lexical blocks, campos de colección, globals), NO como contenido hardcodeado en el componente React.
- Esto aplica a TODO: home, hero, secciones de blog, case studies, bylines de autor, footer, CTAs, testimonios, clientes destacados, etc.
- Ningún texto, imagen, o estructura visual que un editor pudiera querer cambiar debe vivir fuera del control de Payload.

### Blog listing
- Replicar el layout del sitio viejo: sección de posts destacados (equivalente a `FeaturedBlog`/`FeaturedBlogPosts`) arriba, header de archivo con filtro por categoría (equivalente a `BlogArchiveHeader`), y grid/lista cronológica abajo (equivalente a `ArchiveBlock`).
- El filtro de categoría y la sección de destacados deben ser configurables desde Payload (qué posts se destacan, no hardcodeado por fecha únicamente).

### Autoría E-E-A-T
- Expandir las credenciales del autor más allá de lo que mostraba el sitio viejo (que solo tenía avatar + nombre + bio corta + link a perfil).
- Agregar señales de confianza adicionales en el byline de posts y case studies: credenciales/expertise más visibles, posiblemente años de experiencia, certificaciones, o enlaces a perfiles profesionales (LinkedIn, etc.) si existen en el modelo de datos de Authors.
- Esto es un diferenciador competitivo explícito del roadmap (criterio de éxito #2 de la fase) — no un nice-to-have.

### Claude's Discretion
- Diseño visual específico (colores, tipografía, espaciado, microinteracciones) queda a discreción de Claude, informado por el research de competidores que produzca `gsd-ui-phase`.
- Estructura exacta de los bloques de Payload (qué campos, qué bloques reutilizables vs específicos por colección) queda a discreción de Claude, siguiendo los patrones ya establecidos en Phase 1 (colecciones) y el modelo de datos migrado en Phase 4.

</decisions>

<code_context>
## Existing Code Insights

- Sitio viejo de referencia: `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio` — Next.js + Payload previo. Tiene páginas para home, blog (listado+categoría+paginación+post), case-studies, authors (listado+perfil), contact, privacy, terms, search, en `src/app/(frontend)/[locale]/`.
- Blocks reutilizables ya existentes en el sitio viejo (`src/blocks/`): FeaturedBlog, FeaturedBlogPosts, FeaturedCaseStudies, FeaturedClients, FeaturedWorks, BlogArchiveHeader, ArchiveBlock, CaseStudiesGrid, CaseStudyHeader, ContactFormBlock, CallToAction, FAQ, Banner, Content, Code, CalendlyEmbed, AboutSection, AboutWithFeatures, HeroHome — sirven como catálogo de referencia funcional para portar/mejorar en el nuevo stack, no para copiar literalmente.
- Heros ya existentes en el sitio viejo (`src/heros/`): ArchiveHero, HighImpact, LowImpact, MediumImpact, PostHero, RenderHero.tsx + config.ts.
- Nota heredada de Phase 4: ningún post real tiene `heroImage` — el sitio viejo usa un fallback determinístico por slug contra un pool de 53 imágenes ya en Cloudinary (`portfolio/fallback-image-1.avif`...`fallback-image-53.avif`, cloud `dmufha3qv`). Replicar esta misma lógica de fallback (o una equivalente) en el nuevo Post Hero.
- Contenido y relaciones ya migrados en Postgres real (Phase 4): 72 posts, 6 clientes, 5 categories, 1 author, 1 testimonial — listos para renderizar.
- Colecciones/campos ya definidos en Phase 1 — revisar `src/collections/` para el modelo de datos exacto disponible (Posts, CaseStudies, Authors, Categories, Clientes, Testimonials, Media, Pages).
- Search: usar `@payloadcms/plugin-search` per criterio de éxito #4 — no está aún instalado/configurado en este repo, a diferencia del sitio viejo que tiene su propia página `search/page.tsx` + `page.client.tsx`.

</code_context>

<specifics>
## Specific Ideas

- "Usa la skill de ui ux pro max" — interpretado como: correr `gsd-ui-phase` para investigar competidores/mejores prácticas y producir el UI-SPEC.md antes de planear (mecanismo ya soportado por el workflow autónomo para fases con "UI hint: yes").
- Todo componente/sección editable desde Payload es un hard rule, no una preferencia — cualquier plan que hardcodee contenido visual debe tratarse como una desviación a corregir.

</specifics>

<deferred>
## Deferred Ideas

None — discusión se mantuvo dentro del alcance de la fase.

</deferred>
