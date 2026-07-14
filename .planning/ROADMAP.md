# Roadmap: Juan Carlos Angulo — Portfolio (Payload rebuild)

## Overview

Reconstrucción de plataforma: mismo contenido y páginas del sitio actual, pero sobre Payload 3.85 + Next.js 15 con PostgreSQL (en vez de MongoDB), Cloudinary (en vez de Vercel Blob), y self-hosted en Hostinger (en vez de Vercel). El camino va de fundación disciplinada (schema Postgres + colecciones limpias) a capa bilingüe/SEO, resolución del único riesgo arquitectónico abierto (adapter de Cloudinary), migración de contenido 1:1 desde Mongo, construcción de las páginas públicas con los diferenciadores competitivos, y cierre con deploy + cutover operacional en Hostinger. Cada fase se apoya en la anterior: sin `push:false` y colecciones limpias no hay superficie estable para migrar; sin i18n y storage resueltos, la migración escribiría contra un target movedizo; sin contenido migrado no hay páginas que renderizar; sin páginas no hay qué desplegar.

**Milestone v1.1 — UI/UX Polish Pass:** Antes de retomar Phase 6 (Deploy + Cutover, en pausa), el sitio recibe una pasada de pulido visual profesional sobre los 16 bloques Payload-editables y componentes shadcn ya construidos en Phase 5. El camino va de fundación de tokens (elevación/motion CSS-puro, dark-mode branded, sin toggle) a primitivas shadcn + chrome global (máximo apalancamiento, se propaga a los 16 bloques), a hero/resultados/tipografía de contenido largo, a cards/listados + autoría E-E-A-T, y cierra con una verificación cruzada final (contraste, layout ES, grep de contenido hardcodeado, Lighthouse móvil). Motion/animación (carruseles, scroll-reveal) y un toggle visible de dark mode quedan explícitamente diferidos por decisión de Juan — UI-03 es solo corrección de tokens, sin UI de cambio de tema.

**Scope expandido 2026-07-10 (post Phase 10.5 Wave 1):** Tras feedback directo de Juan rechazando la dirección visual acumulada de Phases 7-10 como insuficiente, el milestone se amplía con tres fases nuevas (10.6, 10.7, 10.8) insertadas entre Phase 10.5 y Phase 11: completar header/footer con verificación mobile real, cerrar los gaps de componentes identificados contra el sitio Payload viejo (`JuanPortfolio`, `COMPONENT-GAP-ANALYSIS.md`) agregando y **poblando** dos bloques nuevos, y enriquecer el bloque Hero con CTA/breadcrumbs también poblados. Disciplina mobile-first (~375px primero) se vuelve la práctica estándar de verificación desde aquí en adelante, reforzada explícitamente en Phase 11. Phase 10.5 queda cerrada con alcance reducido a solo lo que ya completó (tipografía + schema de Footer); el trabajo de restyle de header/footer que tenía pendiente se absorbe en Phase 10.6.

**Milestone v1.2 — Content Parity (Home + Author Page), creado 2026-07-11:** Con v1.1 cerrado (Phases 7-11 completas, Phase 6 aún en pausa), una comparación directa contra el sitio de referencia real (`JuanPortfolio`, `localhost:3000`) reveló 3 brechas concretas de contenido/componentes no cerradas por v1.1, más un pedido nuevo de asignación de keyword objetivo (EN/ES) informada por research real. El milestone agrega 4 fases nuevas (12-15): recuperar las secciones E-E-A-T recortadas del author page (Phase 12), poblar Home con la sección "Mi enfoque en Consultoría Técnica" (`AboutSection` extendido) y el bloque FAQ ya existente pero nunca poblado (Phase 13), agregar el campo editorial `targetKeyword` a Pages/Authors (Phase 14), y dar al sitemap una hoja de estilos XSL navegable más una versión HTML (Phase 15). Blog/posts queda explícitamente fuera de alcance (pedido de Juan), y CalendlyEmbed queda cerrado definitivamente (Juan ya no usa Calendly). Ver `.planning/REQUIREMENTS.md` sección "v1.2 Requirements — Content Parity" para el detalle completo. **v1.2 CERRADO 2026-07-12** — 18/18 requirements verificados en vivo, 0 gaps bloqueantes (ver `.planning/v1.2-MILESTONE-AUDIT.md` y `.planning/MILESTONES.md`).

**Milestone v1.3 — Hero Grainy Gradient Animation, creado 2026-07-12:** Pedido directo de Juan — reemplazar el fondo sólido del Hero home por un gradiente animado con grano vía WebGL. Research previo en conversación descartó anime.js (tweening, no genera shaders/ruido) y three.js/ShaderGradient (~150KB+, contradice el presupuesto de performance del propio Hero, que anuncia "Performance 100"); se eligió `@paper-design/shaders-react` → componente `GrainGradient` (~5KB, zero-dependency, WebGL nativo). 2 fases nuevas (16-17): implementación del shader (Phase 16) y verificación de Lighthouse/CWV + mobile (Phase 17), separadas porque la verificación requiere build de producción y es un gate binario distinto de la codificación. Revierte puntualmente la exclusión de motion/animación de v1.1 (UI-02/UI-03) solo para este fondo — el resto de esas exclusiones (carruseles, toggle de dark mode) siguen vigentes. Ver `.planning/REQUIREMENTS.md` sección "v1.3 Requirements — Hero Grainy Gradient Animation" para el detalle completo. **v1.3 CERRADO 2026-07-12** — 6/6 requirements verificados en vivo, 0 gaps bloqueantes (ver `.planning/v1.3-MILESTONE-AUDIT.md` y `.planning/MILESTONES.md`).

**Milestone v1.4 — SEO Competitivo: Auditoría y Optimización, creado 2026-07-12:** Investigación en profundidad de encabezados/metadata/servicios/precios/SEO local de 4 competidores directos (`research/SEO-COMPETITIVE-AUDIT-v1.4.md`) encontró 2 bugs técnicos reales (H1 faltante en `/contact` y en la Author page) y gaps de posicionamiento puro: sin páginas de servicio, sin "SEO para IA/GEO" nombrado pese a tener la infraestructura (`llms.txt`/`llms-full.txt`), sin SEO local. 4 fases nuevas (18-21), continuando la numeración desde Phase 17: fixes técnicos de jerarquía semántica y metadata de la Author page (Phase 18, independiente y de bajo riesgo), páginas de servicio incluyendo SEO para IA/GEO como línea propia (Phase 19), 2 geo-pages con contenido genuinamente diferenciado en vez del patrón templated que Juan rechazó explícitamente (Phase 20, independiente de Phase 19), y refuerzo de encabezados/copy de Home más el enlace hacia las páginas de servicio nuevas (Phase 21, depende de Phase 19 porque Home no puede enlazar páginas que no existen todavía). Decisiones de Juan: sin precios publicados en servicios (patrón dominante, 3/4 competidores); solo Lima + Madrid como geo-pages, sin expandir a más ciudades. La decisión de arquitectura de información (Author page vs About page vs atribución de blog) quedó confirmada sin cambios — el patrón actual ya sigue la práctica recomendada. Ver `.planning/REQUIREMENTS.md` sección "v1.4 Requirements — SEO Competitivo: Auditoría y Optimización" para el detalle completo. **v1.4 CERRADO 2026-07-12** — 10/10 requirements verificados en vivo, 0 gaps bloqueantes (ver `.planning/v1.4-MILESTONE-AUDIT.md` y `.planning/MILESTONES.md`).

**Milestone v1.5 — UI/UX Pro Max: Polish y Competitividad, creado 2026-07-12:** Pasada de diseño profesional sobre Servicios y Home, priorizada por research de competencia directa (Arianna Lupi, Aleyda Solis — ambas sin URLs de servicio dedicadas ni breadcrumbs, confirmando que la arquitectura de landings individuales de Phase 19 ya es una ventaja estructural a pulir, no abandonar). 4 fases nuevas (22-25), continuando la numeración desde Phase 21, ordenadas por riesgo ascendente de regresión/DB per `research/SUMMARY.md`: breadcrumbs visual + JSON-LD en Servicios (Phase 22, sin riesgo de schema, sienta el helper `buildTrail()` compartido); canonical/hreflang en las 4 combinaciones de URL de servicio + `metadataBase` sitewide (Phase 23, cierra el gap de contenido duplicado dual-slug antes de que el rediseño lo vuelva más visible); bloque `ServicesShowcase` en Home leyendo `SERVICE_SLUGS` en vivo (Phase 24, aditivo, sin tocar columnas existentes); y polish visual + prueba social reforzada en las 4 landings de servicio (Phase 25, la fase de mayor superficie/riesgo de regresión, por eso va última, con gates explícitos de Lighthouse/CWV, paridad EN/ES y preservación de H1/JSON-LD contra baseline pre-pase). Sin dependencias nuevas de runtime (shadcn/Radix/Tailwind ya cubre todo lo necesario); sin tabla de precios (regla dura del proyecto); sin colección `Services` nueva (se reutiliza `pages`, Key Decision D-01). Ver `.planning/REQUIREMENTS.md` sección "v1.5 Requirements" para el detalle completo.
**Milestone v1.6 — UI/UX Pro Max II: Componentes, Motion y Voz, creado 2026-07-13:** Segunda pasada de diseño sobre los componentes/plantillas que v1.5 no tocó (navbar, heroes de listing, CTA strip, FAQ, clientes, testimonios, grillas de blog, case studies), sumando micro-animaciones consistentes con la estética del hero de Home sin pegarle a performance, y humanizando todo el copy real de la base de datos con la voz de Juan calibrada contra sus competidores directos (Arianna Lupi, Aleyda Solis). Dos tracks independientes con historial de riesgo muy distinto: Track A (UI/motion, fases 26-28, continuando la numeración desde Phase 25) es una serie de cambios de código con gate de build/Lighthouse; Track B (humanización de contenido, fases 29-31) es la parte de mayor riesgo del milestone — el proyecto ya tiene un historial documentado de 3 bugs reales de campos no-localizados pisados por escrituras bulk y un incidente real de pérdida de datos (2026-07-12, recuperado vía Neon point-in-time restore) — por eso Phase 29 (auditoría de campos + snapshot + los 2 fixes de schema ya aprobados por Juan) es un prerequisito duro antes de reescribir una sola palabra, y la reescritura real (Phases 30-31) se ordena por riesgo/blast-radius ascendente (globals+páginas núcleo+servicios primero, posts+case studies al final, por ser lo de mayor volumen y visibilidad SEO). Ver `.planning/REQUIREMENTS.md` sección "v1.6 Requirements" y `.planning/research/SUMMARY-v1.6.md` para el detalle completo.
**Milestone v1.7 — Local Landing Design + Component Polish Pass, creado 2026-07-13:** El archivo de diseño Pencil `designs/current-site-real.pen` (réplica fiel del design system actual, no un rediseño — ver `designs/DESIGN-SYSTEM-PEN.md`) aporta solo 2 piezas nuevas: un variant `local-landing` para el bloque Hero (badge de ciudad, anillo decorativo, stat inline, CTA row) y un block nuevo `LocalProofSection` (prueba social localizada), pensados para diferenciar estructuralmente las landings de Lima y Madrid — hoy ambas reusan bloques genéricos sin diferenciación visual real. El resto del .pen (28 componentes) ya tiene equivalente exacto en código, así que el milestone suma una pasada de polish puntual sobre esos 28 componentes. 5 fases nuevas (32-36), continuando la numeración desde Phase 31 (v1.6 Track B queda pausado, retoma después): baseline de regresión antes de tocar nada (Phase 32, mismo patrón que v1.5 Phase 25 / v1.6 Phase 28); construcción de los 2 componentes nuevos (Phase 33); aplicación real y diferenciada a Madrid/Lima (Phase 34, depende de Phase 33); pasada de polish visual sobre los 28 componentes restantes (Phase 35); y gate de cero regresión al cierre (Phase 36, última, comparado contra el baseline de Phase 32). Ver `.planning/REQUIREMENTS.md` sección "v1 Requirements" (milestone v1.7) para el detalle completo. **v1.7 CERRADO 2026-07-14** — 13/13 requirements Done (LOCAL-05 con contenido placeholder de `LocalProofSection` en ambas landings, autorizado explícitamente por Juan, pendiente de datos reales de clientes), 0 gaps bloqueantes (ver `.planning/milestones/v1.7-MILESTONE-AUDIT.md` y `.planning/MILESTONES.md`).

**Milestone v1.8 — Case Studies Content Audit & Fix, creado 2026-07-14:** Juan verificó a mano en el admin los 6 case studies borrador (ids 15-20) y encontró bugs reales de contenido: "El reto"/"La solución" incompletos en uno o ambos locales, KPIs mostrados como números sueltos sin label explicativo, el doc 20 (despacho penal Pittsburgh) exponiendo datos reales de un cliente sin anonimizar (nombre, dominio, condado, conteo de reseñas), y `results.metrics` con muy pocas filas por caso (charts de 1-2 barras). 1 fase nueva (Phase 37), continuando la numeración desde Phase 36: corrige los 6 docs de punta a punta — contenido completo bilingüe, KPIs con label, doc 20 anonimizado, y `results.metrics` poblado con datos reales de Google Search Console (MCP `gsc-juan-*`) sin exponer branding del cliente. Nota de ejecución dura: un intento previo de correr scripts Local API (`npx payload run`) para leer/escribir en vivo falló en silencio en el shell de Juan (exit 0, sin salida) pese a funcionar en agentes previos del mismo hilo — el plan de esta fase debe preferir el servidor MCP `juan-payload` (`http://localhost:3000/api/mcp`, dev server debe estar levantado) para leer/escribir los docs en lugar de repetir ese camino roto; si igual se usa un script Local API, debe verificar primero que produce salida real antes de confiar en él. Cierra devolviendo el JSON crudo completo de los 6 docs corregidos (no un resumen) para que Juan lo verifique él mismo, ya que un intento anterior declaró "verificado" sin estarlo. Ver `.planning/REQUIREMENTS.md` sección "v1 Requirements" (milestone v1.8) para el detalle completo.

**Milestone v1.9 — Websites Portfolio Section, creado 2026-07-14:** Juan tiene una colección de sitios web reales que construyó (no solo case studies con storytelling SEO) y hoy el sitio no tiene dónde mostrar ese trabajo técnico como portfolio de desarrollo, separado del ángulo de resultados/case study. 3 fases nuevas (38-40), continuando la numeración desde Phase 37 (queda en cola con CONTEXT.md/UI-SPEC.md aprobados, retoma después de v1.9): schema de la colección `Websites` (Phase 38, mismo patrón que `CaseStudies`, con relaciones opcionales a `Clientes`/`CaseStudies` y campo `lighthouseCapturedAt` obligatorio para que los scores nunca se presenten como en vivo); componentes/rutas de frontend (Phase 39, `WebsiteCard` compartido, `FeaturedWebsitesBlock`, extensión de `ArchiveBlock`, rutas `/websites`+`/websites/[slug]` con JSON-LD `CreativeWork`); y poblado de contenido real (Phase 40, 6 sitios reales — ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com — con stack confirmado interactivamente con Juan sitio por sitio, screenshots reales vía Playwright y Lighthouse real corrido una sola vez, no en vivo/recurrente). `Websites` y `CaseStudies` quedan separados a propósito (craft técnico vs. resultado de negocio), mismo principio que ya separa `Clientes` de `CaseStudies`. Ver `.planning/REQUIREMENTS.md` sección "Milestone v1.9" y `.planning/research/SUMMARY-v1.9.md` para el detalle completo.

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
- [x] **Phase 13: Home Content Population** - AboutSection extendido con features + FAQ poblado en Home (completed 2026-07-11)
- [x] **Phase 14: Target Keyword Field** - Campo editorial targetKeyword en Pages/Authors, poblado con picks de keyword research real (completed 2026-07-12)
- [x] **Phase 15: Sitemap XSL + HTML** - sitemap.xml con hoja de estilos navegable (XSLT 1.0) + sitemap.html navegable agrupado por sección + link "Sitemap" agregado al footer (es+en), verificado en vivo contra el dev server sin regresión en robots.txt/Phase 2 (completed 2026-07-11)
- [x] **Phase 16: Hero Grainy Gradient — Implementation** - El fondo del Hero home pasa de sólido a shader animado (`GrainGradient` de `@paper-design/shaders-react`) con colores ember/navy, copy intacto, respeta `prefers-reduced-motion` (completed 2026-07-12)
- [x] **Phase 17: Hero Grainy Gradient — Performance & Mobile Verification** - Verificación real de que el shader no degrada Lighthouse/CWV ni causa overflow/jank mobile-first (completed 2026-07-12)
- [x] **Phase 18: SEO Technical Fixes + Metadata** - H1 semántico en /contact y Author page, Author page sumada a plugin-seo (completed 2026-07-12)
- [x] **Phase 19: Service Pages** - Página Servicios + landings individuales, incluyendo SEO para IA/GEO como línea propia (completed 2026-07-12)
- [x] **Phase 20: SEO Local Geo-pages** - Landings "SEO técnico en Lima" y "SEO técnico en Madrid" con contenido genuinamente diferenciado (completed 2026-07-12)
- [x] **Phase 21: Home Optimization & Service Linking** - Home refuerza el ángulo desarrollo+SEO técnico y enlaza a las páginas de servicio nuevas (completed 2026-07-12)

- [x] **Phase 22: Breadcrumbs (visual + schema)** - Servicios index + 4 landings ganan trail visual y BreadcrumbList JSON-LD desde una sola fuente (completed 2026-07-12)
- [x] **Phase 23: Canonical + hreflang hardening** - Las 4 combinaciones de URL de servicio emiten canonical/hreflang correctos, metadataBase sitewide (completed 2026-07-12)
- [x] **Phase 24: ServicesShowcase en Home** - Home muestra las 4 tarjetas de servicio leyendo SERVICE_SLUGS en vivo, aditivo (completed 2026-07-13)
- [x] **Phase 25: Service-page visual polish** - Las 4 landings de servicio ganan anatomía visual completa y prueba social competitiva (completed 2026-07-13)
- [x] **Phase 26: UI/UX Polish Pass — Low-Risk Components** - CTA sale del full-width vw, navbar/FAQ/logos/testimonios pulidos, breadcrumbs unificados en Case Studies (Track A) (completed 2026-07-13)
- [x] **Phase 27: Micro-animation Library Adoption** - `motion` instalado vía LazyMotion, bundle-size verificado contra build real, hook `useReducedMotion()` compartido (Track A) (completed 2026-07-13)
- [x] **Phase 28: Component Motion Rollout + Hero Variants + Blog Grids** - Hero listing/post-header/case-study-header diferenciados (CSS-only, scope minimal), grillas de blog pulidas con scroll-reveal/hover, gate CWV cerrado sobre lo atribuible a las animaciones — TTFB preexistente de /en/blog logueado como follow-up separado, no bloqueante (Track A, cierre) (completed 2026-07-13)
- [ ] **Phase 29: Content Humanization Safety Net** - Auditoría de campos localizados, snapshot completo, 2 fixes de schema aprobados por Juan, perfil de voz escrito (Track B, prerequisito duro)
- [ ] **Phase 30: Content Humanization — Globals, Core Pages, Services & Geo** - Copy reescrito en la voz de Juan para el primer tramo, de menor riesgo (Track B)
- [ ] **Phase 31: Content Humanization — Posts & Case Studies + Verificación Final** - Copy de mayor volumen/visibilidad SEO reescrito, verificación final conjunta de ambos tracks (Track B, cierre de milestone)
- [x] **Phase 32: Regression Baseline** - Baseline de Lighthouse/CWV + H1/JSON-LD capturado antes de tocar cualquier componente (v1.7) (completed 2026-07-14)
- [x] **Phase 33: Local Landing Components** - Hero variant `local-landing` + block `LocalProofSection` construidos y registrados (v1.7) (completed 2026-07-14)
- [x] **Phase 34: Local Landing Application (Madrid/Lima)** - `/seo-tecnico-madrid` y `/seo-tecnico-lima` usan los componentes nuevos con diferenciación estructural real (LOCAL-05 con contenido placeholder marcado, real pendiente de Juan) (completed 2026-07-14)
- [x] **Phase 35: Component Polish Pass** - Revisión `ui-ux-pro-max` de los 28 componentes restantes contra el .pen, micro-mejoras implementadas en código (v1.7) (completed 2026-07-14)
- [x] **Phase 36: Regression Gate** - Gate de cero regresión al cierre, comparado contra el baseline de Phase 32 (v1.7, cierre de milestone) (completed 2026-07-14)
- [ ] **Phase 37: Case Studies Content Audit & Fix** - Los 6 case studies borrador (ids 15-20) quedan con contenido completo, KPIs explicados, doc 20 anonimizado, `results.metrics` respaldado por datos reales de GSC, autor deduplicado, schema JSON-LD dinámico, chart con escalas/mobile arreglado, y estructura revisada contra ariannalupi.com/casos
- [x] **Phase 38: Websites — Schema & Collection Design** - Colección `Websites` modelada, registrada y tipada, con relaciones opcionales a Clientes/CaseStudies y captura de fecha obligatoria para Lighthouse (completed 2026-07-14)
- [ ] **Phase 39: Websites — Frontend Components & Routes** - `WebsiteCard`, sección en Home, `ArchiveBlock` extendido, rutas de listado/detalle con JSON-LD `CreativeWork` y sitemap actualizado
- [ ] **Phase 40: Websites — Content Population (Real Data Capture)** - 6 sitios reales poblados con stack confirmado por Juan, screenshots reales y Lighthouse real capturado una sola vez

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

**Plans**: 2 plans (2 waves)

Plans:

- [x] 13-01-PLAN.md — AboutSection features[]/ctaText/ctaLink schema + admin icon-picker (Modal-based) + Postgres migration
- [x] 13-02-PLAN.md — AboutSection features/CTA render + Home FAQ/ContactFormBlock population (seed)

**UI hint**: yes

### Phase 14: Target Keyword Field

**Goal**: Pages y Authors ganan un campo editorial `targetKeyword` (EN/ES) informativo — sin llamadas en vivo a ninguna API externa — y Home + el author page de Juan quedan poblados con los picks reales del keyword research ya hecho.
**Depends on**: Phase 13
**Requirements**: SEO-KW-01, SEO-KW-02
**Success Criteria** (what must be TRUE):

  1. Las colecciones `pages` y `authors` exponen un campo `targetKeyword` con sub-campos `en`/`es` (texto simple), puramente editorial — no dispara ninguna llamada en vivo a Ahrefs/DinoRank/ninguna API externa
  2. Home tiene `targetKeyword` poblado con los picks de `research/keyword-research/KEYWORD-RESEARCH.md` (ES: "seo técnico", EN: "technical seo consultant")
  3. El author page de Juan tiene `targetKeyword` poblado con los picks de `research/keyword-research/KEYWORD-RESEARCH.md` (ES: "auditoría seo técnica", EN: "technical seo specialist")

**Plans**: 1 plan (1 wave)

Plans:

- [x] 14-01-PLAN.md — targetKeyword group field (en/es) on Pages + Authors, migration, idempotent seed of Home + real Author picks

### Phase 15: Sitemap XSL + HTML

**Goal**: El sitemap del sitio deja de ser XML crudo ilegible para cualquiera que lo abra directamente en el navegador, y gana una versión HTML navegable enlazada desde un nuevo link "Sitemap" en el footer (que no existía — corrige la asunción original de REQUIREMENTS.md).
**Depends on**: Phase 14
**Requirements**: SITEMAP-01, SITEMAP-02
**Success Criteria** (what must be TRUE):

  1. `sitemap.xml` recibe una hoja de estilos XSL — al abrir la URL directamente en el navegador se ve una tabla legible, no el XML crudo
  2. Existe una página `sitemap.html` navegable (listado de URLs agrupado por sección), enlazada desde un nuevo link "Sitemap" agregado al footer

Plans:

- [x] 15-01-PLAN.md — src/lib/sitemap-data.ts (shared query) + src/app/sitemap.xml/route.ts (replaces native sitemap.ts, adds xml-stylesheet PI) + public/sitemap.xsl (XSLT 1.0 table stylesheet)
- [x] 15-02-PLAN.md — src/app/sitemap.html/route.ts (grouped navigable page) + scripts/seed-phase15-sitemap-footer-link.ts (idempotent footer link seed; also backfilled a pre-existing ES-locale label gap on Footer.legalLinks/columns that blocked the write, confirmed by Juan)

**Plans**: 2 plans (2 waves)

Plans:

- [ ] 15-01-PLAN.md — Shared sitemap query module + sitemap.xml route handler with XSL processing instruction + public/sitemap.xsl stylesheet
- [ ] 15-02-PLAN.md — sitemap.html grouped navigable route + idempotent footer "Sitemap" link seed

### Phase 16: Hero Grainy Gradient — Implementation

**Goal**: El fondo del Hero home pasa de sólido a un shader animado de gradiente con grano (`GrainGradient` de `@paper-design/shaders-react`, WebGL, ~5KB zero-dependency), con colores derivados de los tokens ember/navy de Phase 7, sin tocar título/subtítulo/CTAs/breadcrumbs, y respetando `prefers-reduced-motion`.
**Depends on**: Phase 11 (último trabajo de UI/UX cerrado sobre el mismo Hero; corre en paralelo a Phase 6, no depende de su cierre)
**Requirements**: HERO-ANIM-01, HERO-ANIM-02, HERO-ANIM-03, HERO-ANIM-04
**Success Criteria** (what must be TRUE):

  1. Home muestra un gradiente animado WebGL (`GrainGradient`) reemplazando el fondo sólido `bg-secondary` del Hero (`variant: 'home'`)
  2. Los colores del gradiente derivan visiblemente de los tokens ember/navy ya definidos en Phase 7 (no colores nuevos inventados)
  3. Título, subtítulo, CTAs y breadcrumbs del Hero renderizan idénticos al estado pre-cambio — solo el fondo cambia
  4. Con `prefers-reduced-motion: reduce` activo, el shader queda pausado o se muestra un frame estático en vez de la animación en vivo

**Plans**: 3 plans (3 waves)

Plans:

- [x] 16-01-PLAN.md — Install @paper-design/shaders-react + package legitimacy checkpoint
- [x] 16-02-PLAN.md — HeroGrainGradient Client Component + wire into Hero isHome branch
- [x] 16-03-PLAN.md — Playwright shader/overflow/reduced-motion verification + report

**UI hint**: yes

### Phase 17: Hero Grainy Gradient — Performance & Mobile Verification

**Goal**: Confirmar con evidencia real (Lighthouse en build de producción local, spot-check mobile-first) que el shader animado del Hero no degrada el Core Web Vitals/Performance que el propio Hero anuncia en su copy, y que no rompe el layout en ningún breakpoint.
**Depends on**: Phase 16
**Requirements**: HERO-ANIM-05, HERO-ANIM-06
**Success Criteria** (what must be TRUE):

  1. Lighthouse Performance en build de producción local no muestra regresión significativa respecto al baseline pre-milestone (mismo método que 11-03: build local, no producción real — Phase 6 sigue en pausa)
  2. Core Web Vitals (LCP/INP/CLS) dentro de rango aceptable comparado contra el baseline
  3. En 375/768/1280px el shader no causa overflow horizontal, layout roto, ni jank visual observable

**Plans**: 1 plan (1 wave)

Plans:

- [x] 17-01-PLAN.md — Extend lighthouse-mobile.mjs with CWV extraction, run production-build Lighthouse against /en+/es vs Phase 11 baseline, production-build mobile spot-check + verification report

### Phase 18: SEO Technical Fixes + Metadata

**Goal**: Corregir los 2 bugs de jerarquía semántica (H1 faltante) y el gap de metadata editable de la Author page encontrados por la auditoría competitiva, sin tocar copy ni layout más allá de lo estrictamente necesario para el fix.
**Depends on**: Nothing (independiente, primera fase del milestone)
**Requirements**: SEO-STRUCT-01, SEO-STRUCT-02, SEO-META-01
**Success Criteria** (what must be TRUE):

  1. `/contact` (ambos locales) renderiza un `<h1>` semántico real — hoy el único heading es un H2 ("Hablemos"/"Get in Touch") dentro de `ContactFormBlockComponent`
  2. `/authors/[slug]` renderiza el nombre del autor dentro de un elemento `<h1>` real, no un `<Link>` con clases visuales de heading (`AuthorCard.tsx`)
  3. `authors` aparece en la lista de colecciones configuradas de `@payloadcms/plugin-seo` en `payload.config.ts`
  4. El meta title/description de la Author page en `<head>` se lee del tab SEO editable desde `/admin` (campo `meta.title`/`meta.description` de la colección `authors`), no del fallback manual hardcodeado anterior

**Plans**: 1 plan (1 wave)

Plans:

- [x] 18-01-PLAN.md — H1 fixes on /contact + Author page, Authors wired into plugin-seo, migration + generateMetadata update

### Phase 19: Service Pages

**Goal**: Juan tiene una oferta de servicios explícita y navegable — 4 líneas de servicio con landing propia cada una, siguiendo el patrón estructural validado por los 4 competidores auditados, y "SEO para IA/GEO" nombrado como línea propia aprovechando la infraestructura `llms.txt`/`llms-full.txt` ya existente.
**Depends on**: Nothing (independiente de Phase 18; debe completarse antes de Phase 21)
**Requirements**: SEO-SVC-01, SEO-SVC-02, SEO-SVC-03
**Success Criteria** (what must be TRUE):

  1. Existe una página "Servicios" (`/servicios` en ES, `/services` en EN) que lista las 4 líneas de servicio (Auditoría SEO Técnica, Consultoría SEO, Desarrollo Full-Stack con SEO integrado, SEO para IA/GEO), sin precios publicados, con CTA a contacto
  2. Cada servicio individual tiene su propia landing (`/servicios/[slug]`) que sigue el patrón H1 del servicio → problema/dolor → qué incluye → cómo trabajo → FAQ → CTA final, validado por los 4 competidores auditados
  3. "SEO para IA / GEO" tiene su propia página de servicio con copy que referencia explícitamente `llms.txt`/`llms-full.txt` como parte tangible de la oferta (no solo el nombre del servicio)
  4. Las páginas de servicio (índice + individuales) están disponibles y curl-eables en ambos locales (EN/ES), con contenido traducido, no solo URL espejada

**Plans**: 5 plans (3 waves)

Plans:

- [x] 19-01-PLAN.md — Service slug registry, content-authoring contracts, sitemap path fix
- [x] 19-02-PLAN.md — Dual-locale service routes (/services + /servicios, index + [slug])
- [ ] 19-03-PLAN.md — Bilingual copy: index page + Auditoría SEO Técnica + Consultoría SEO
- [ ] 19-04-PLAN.md — Bilingual copy: Desarrollo Full-Stack + SEO para IA/GEO
- [ ] 19-05-PLAN.md — Seed script assembly + idempotent run + end-to-end verification

**UI hint**: yes

### Phase 20: SEO Local Geo-pages

**Goal**: Juan tiene 2 landings locales (Lima, Madrid) con contenido genuinamente diferenciado, evitando el patrón de páginas templated/find-replace por ciudad rechazado explícitamente por Juan.
**Requirements**: SEO-LOCAL-01, SEO-LOCAL-02
**Depends on**: Nothing (independiente — puede ejecutarse en paralelo o después de Phase 19)
**Success Criteria** (what must be TRUE):

  1. Landing "SEO técnico en Lima" existe y es curl-eable, con contenido específico sobre la base real de Juan en Lima/Perú (referencias concretas, no genéricas)
  2. Landing "SEO técnico en Madrid/España" existe y es curl-eable, con contenido específico sobre el mercado ES identificado en `research/keyword-research/`
  3. El copy de ambas landings es verificablemente distinto entre sí más allá del nombre de la ciudad — cada una tiene al menos una sección/argumento que no aparece en la otra (prueba directa contra el riesgo de contenido fino/duplicado)
  4. Ambas landings tienen H1 y meta title/description propios vía `@payloadcms/plugin-seo`, distintos entre sí y del resto del sitio

**Plans**: TBD
**UI hint**: yes

### Phase 21: Home Optimization & Service Linking

**Goal**: Home refuerza el ángulo competitivo "desarrollo real (Next.js/Payload/CMS headless) + SEO técnico" y deja de mantener implícita la oferta de servicios, enlazando a las páginas de servicio creadas en Phase 19.
**Depends on**: Phase 19 (Home no puede enlazar páginas de servicio que todavía no existen)
**Requirements**: SEO-HOME-01, SEO-HOME-02
**Success Criteria** (what must be TRUE):

  1. El copy del Hero y/o `AboutSection` de Home (ambos locales) refuerza explícitamente el ángulo "desarrollo real (Next.js/Payload/CMS headless) + SEO técnico" frente al "SEO + WordPress genérico" identificado en 3 de los 4 competidores auditados
  2. Home tiene al menos un link visible hacia la página de Servicios y/o hacia páginas de servicio individuales, ubicado en `AboutSection` y/o en la navegación principal
  3. Los links de Home hacia Servicios resuelven sin 404 en ambos locales

**Plans**: TBD
**UI hint**: yes

### Phase 22: Breadcrumbs (visual + schema)

**Goal**: Usuarios ven un trail de breadcrumbs claro en la jerarquía de Servicios, y los motores de búsqueda reciben el mismo trail como BreadcrumbList JSON-LD, derivados de una sola fuente de verdad sin riesgo de schema/DB.
**Depends on**: Phase 21 (último trabajo del sitio sobre las mismas rutas de Servicios; corre en paralelo a Phase 6, no depende de su cierre)
**Requirements**: BREAD-01, BREAD-02, BREAD-03
**Success Criteria** (what must be TRUE):

  1. Un usuario ve un trail de breadcrumbs visual en la página índice de Servicios y en las 4 landings individuales, en ambos locales (ES/EN)
  2. Cada página con breadcrumbs emite `BreadcrumbList` JSON-LD derivado de la misma función `buildTrail()` que alimenta el trail visual, sin lógica de URL/locale duplicada
  3. El `BreadcrumbList` JSON-LD valida sin errores en ambos locales usando el agente/MCP `seo-schema` disponible en el proyecto, antes de cerrar la fase

**Plans**: 1 plan (1 wave)
**UI hint**: yes

Plans:

- [x] 22-01-PLAN.md — src/lib/breadcrumbs.ts (buildTrail/buildBreadcrumbJsonLd) + wired into all 4 Servicios page.tsx files + seo-schema agent validation sweep

### Phase 23: Canonical + hreflang hardening

**Goal**: Las 4 combinaciones de URL de servicio (ES/EN x `/servicios`/`/services`) dejan de ser contenido duplicado sin canonical — cada una emite `alternates.canonical`/`alternates.languages` correctos desde un helper compartido, y el layout raíz define `metadataBase` una sola vez para todo el sitio.
**Depends on**: Phase 22 (re-toca los mismos templates de Servicios que breadcrumbs acaba de tocar; se resuelve antes de que el rediseño de Phase 25 haga más visible el gap)
**Requirements**: SEOTECH-01, SEOTECH-02, SEOTECH-03
**Success Criteria** (what must be TRUE):

  1. Cada una de las 4 combinaciones de URL de servicio (`/servicios/[slug]`, `/en/services/[slug]`) emite `alternates.canonical` correcto en `generateMetadata`, construido con un helper compartido (no hardcodeado)
  2. Cada página de servicio emite `alternates.languages` (hreflang) apuntando a su contraparte en el otro locale
  3. El layout raíz define `metadataBase` una sola vez, desbloqueando canonicals correctos en todo el sitio (no solo Servicios)
  4. Los tags canonical/hreflang se verifican en vivo (curl/view-source) contra las 4 combinaciones de URL antes de cerrar la fase

**Plans**: 1 plan

Plans:

- [x] 23-01-PLAN.md — Shared canonical/hreflang helper, metadataBase, wired into all 4 Servicios generateMetadata + live curl verification

### Phase 24: ServicesShowcase en Home

**Goal**: Home muestra una vitrina de los 4 servicios que enlaza a sus landings, leída dinámicamente del set fijo `SERVICE_SLUGS` en vez de hardcodeada por instancia, registrada de forma puramente aditiva en Payload.
**Depends on**: Phase 23 (la vitrina enlaza páginas de Servicios que ya deben estar SEO-correctas: canonical/hreflang resueltos antes de linkearlas desde Home)
**Requirements**: SVCHOME-01, SVCHOME-02, SVCHOME-03
**Success Criteria** (what must be TRUE):

  1. Un usuario ve un componente "Servicios" en el Home (bloque `ServicesShowcase`) con las 4 tarjetas de servicio, en ambos locales
  2. Cada tarjeta enlaza a su landing correspondiente en el locale activo, leída dinámicamente del set fijo `SERVICE_SLUGS` (no hardcodeada por instancia)
  3. El bloque se registra como aditivo en Payload (config + `RenderBlocks` + `payload generate:types`) sin modificar columnas existentes; si llegara a requerir tocar una columna existente, se pide aprobación nombrada de Juan primero, y la migración generada se lee antes de aplicarse

**Plans**: 1 plan (1 wave)
**UI hint**: yes

Plans:

- [x] 24-01-PLAN.md — ServicesShowcase block (config + Component, dynamic SERVICE_SLUGS grid) + additive Pages/RenderBlocks registration + migration + Home seed (both locales) + live verification

### Phase 25: Service-page visual polish

**Goal**: Cada una de las 4 landings de servicio compite de verdad con la competencia directa auditada — anatomía visual completa por bloques, prueba social reforzada, tarjeta de alcance sin precio, case study relacionado y CTA repetido — sin perder el H1/JSON-LD existente ni regresar Core Web Vitals.
**Depends on**: Phase 24 (es la fase de mayor superficie y mayor riesgo de regresión — corre última, sobre una capa de routing/schema de Servicios ya estable y correcta)
**Requirements**: SVCPOL-01, SVCPOL-02, SVCPOL-03, SVCPOL-04, SVCPOL-05, SVCPOL-06, SVCPOL-07, SVCPOL-08, SVCPOL-09
**Success Criteria** (what must be TRUE):

  1. Cada una de las 4 landings de servicio muestra una anatomía visual completa y distinguible por bloques (H1 → dolor/problema → qué incluye → proceso → prueba social → FAQ → CTA), sin muro único de rich text
  2. Cada landing incluye prueba social reforzada (testimonios y/o logos de clientes y/o resultados cuantificados) y una tarjeta "alcance del servicio" (alcance/resultado/tiempo) sin precio
  3. Cada landing muestra un case study relacionado (tarjeta con métrica en el titular) vinculado al servicio correspondiente, y repite el mismo CTA primario arriba (Hero) y abajo (CallToAction) con misma acción/label
  4. Todo el copy nuevo o reescrito (ES y EN) pasa por la skill `humanizer` antes de publicarse — sin marcas de escritura de IA, sin em/en dash, voz natural variada
  5. Ninguna landing pierde su H1 semántico único ni el `BreadcrumbList`/`Person`/JSON-LD existente frente a un baseline pre-pase, ninguna regresa Core Web Vitals/Lighthouse mobile respecto a ese baseline, y todo componente/string nuevo tiene paridad ES/EN verificada en vivo

**Plans**: 4 plans
**UI hint**: yes

Plans:

- [x] 25-01-PLAN.md — Capture pre-change baseline (H1/JSON-LD snapshot + Lighthouse mobile) for all 8 service URLs
- [x] 25-02-PLAN.md — Build ServiceScopeCard + RelatedCaseStudyBlock, register additively, apply additive migration
- [x] 25-03-PLAN.md — Author + humanize copy, seed the 10-block anatomy onto all 4 service landings (real DB write)
- [x] 25-04-PLAN.md — Re-capture snapshot/Lighthouse, diff against baseline, confirm zero regression + ES/EN parity

### Phase 26: UI/UX Polish Pass — Low-Risk Components

**Goal**: Los componentes compartidos que v1.5 no tocó (CTA strip, navbar, FAQ, clientes, testimonios) ganan tratamiento visual pulido de nivel `ui-ux-pro-max`, y Case Studies gana el mismo trail de breadcrumbs visual + JSON-LD que Servicios, cerrando la queja nombrada de Juan (CTA full-width) el primer día del milestone.
**Depends on**: Nothing (primera fase del milestone, no toca schema ni contenido de forma destructiva — solo JSX/Tailwind + un helper compartido de breadcrumbs ya existente)
**Requirements**: UIPOL-01, UIPOL-02, UIPOL-04, UIPOL-05, UIPOL-06, UIPOL-09
**Success Criteria** (what must be TRUE):

  1. El bloque `CallToAction` renderiza dentro del mismo wrapper `Container` que el resto de los bloques del sitio, sin bleed full-width `vw`, en ambos locales
  2. `SiteHeader` muestra un estado visual distinguible al hacer scroll y/o un indicador de ruta activa, usando los tokens de elevación/motion ya establecidos en Phase 7
  3. El bloque FAQ muestra agrupación visual pulida, distinguible del look template-default actual, manteniendo el `<details>` nativo
  4. `ClientLogosBlock` y `TestimonialsCarousel` muestran tratamiento visual pulido (normalización de tamaño de logos / affordance de scroll en testimonios)
  5. El listado y el detalle de Case Studies muestran un trail de breadcrumbs visual real construido con el mismo helper `buildTrail()` que usa Servicios, con `BreadcrumbList` JSON-LD consistente (reemplazando la implementación propia y desalineada actual)

**Plans**: 3 plans (1 wave)

Plans:

- [x] 26-01-PLAN.md — CTA Container fix + FAQ visual grouping + ClientLogos scale normalization + TestimonialsCarousel scroll affordance (UIPOL-01, 04, 05, 06)
- [x] 26-02-PLAN.md — SiteHeader scroll-state + active-route indicator, extracted into SiteHeaderChrome client component (UIPOL-02)
- [x] 26-03-PLAN.md — Case Studies breadcrumbs: buildCaseStudiesTrail() sibling export + listing/detail wiring (UIPOL-09)

**UI hint**: yes

### Phase 27: Micro-animation Library Adoption

**Goal**: La librería de micro-animaciones queda decidida, instalada y validada contra un build de producción real antes de aplicarse a ningún componente — decisión técnica real (motion vs GSAP vs Anime.js), no asumida.
**Depends on**: Phase 26 (evita mezclar la decisión de librería con los componentes que ya se están tocando en el polish pass; Phase 26 no necesita motion para cerrar)
**Requirements**: MOTION-01, MOTION-02
**Success Criteria** (what must be TRUE):

  1. El paquete `motion` (`LazyMotion`+`m`+`domAnimation`) está instalado y wireado a través de un único provider raíz consumido por 2-3 componentes piloto
  2. El costo real de bundle (diff de `next build` antes/después) queda medido y documentado — no solo estimado por el research — confirmando que se ajusta al presupuesto de ~20KB
  3. Existe un hook compartido `useReducedMotion()` (SSR-safe, sin mismatch de hidratación, mismo patrón ya probado en `HeroGrainGradient`) y los componentes piloto ya lo usan de forma consistente

**Plans:** 1 plan

Plans:

- [x] 27-01-PLAN.md — Instala `motion`, provider raíz + hook `useReducedMotion()`, pilotos FAQ (scroll-reveal) + Testimonials (hover), bundle-size real medido (completed 2026-07-13; gap doc cerrado — bundle cost es per-RenderBlocks-template, no per-instancia)

### Phase 28: Component Motion Rollout + Hero Variants + Blog Grids

**Goal**: Las variantes de Hero quedan visualmente diferenciadas, las grillas de blog ganan tratamiento visual pulido, y las micro-interacciones (scroll-reveal + hover) se extienden de forma consistente a todos los componentes de la pasada Track A — cerrando con un gate de cero regresión de Lighthouse/CWV.
**Depends on**: Phase 27 (necesita la librería y el patrón de componente-cliente ya validados antes de un rollout más amplio)
**Requirements**: UIPOL-03, UIPOL-07, UIPOL-08, MOTION-03, MOTION-04
**Success Criteria** (what must be TRUE):

  1. Las variantes de Hero `listing`/`post-header`/`case-study-header` son visualmente distinguibles entre sí (hoy son pixel-idénticas salvo breadcrumbs), con H1/breadcrumbs/JSON-LD intactos
  2. La grilla de blog (`/blog`) y `FeaturedPostsBlock` muestran tratamiento visual pulido con scroll-reveal/hover consistentes con la estética del hero de Home
  3. Todo componente animado en Phases 26-28 usa el hook `useReducedMotion()` compartido de forma consistente, verificado con una pasada headless de `prefers-reduced-motion` sobre todas las páginas tocadas
  4. Un re-chequeo de Lighthouse/CWV mobile contra las rutas representativas tocadas por Track A no muestra regresión atribuible a las animaciones nuevas, comparado contra un baseline pre-pase (mismo patrón de gate que v1.5 Phase 25)

**Plans**: 4 plans (3 waves) — completed 2026-07-13
**UI hint**: yes

Plans:

- [x] 28-01-PLAN.md — Baseline pre-cambio: H1/JSON-LD snapshot + Lighthouse mobile en 6 rutas representativas
- [x] 28-02-PLAN.md — Diferenciación CSS-only de Hero listing/post-header/case-study-header (scope minimal confirmado por Juan — sin tocar blog/[slug] ni case-studies/[slug])
- [x] 28-03-PLAN.md — ScrollReveal en ArchiveBlock/FeaturedPostsBlock + PostCard hover migrado a whileHover
- [x] 28-04-PLAN.md — Gate de regresión: reduced-motion PASS 6/6, H1/JSON-LD PASS 6/6, Lighthouse inicialmente FAIL 2/6 (LCP) — gap closure encontró y arregló 2 bugs reales (ScrollReveal SSR-opacity, PostCard sin `priority`); LCP residual en `/en/blog` root-caused a TTFB preexistente (no atribuible a las animaciones nuevas) — cerrado, TTFB logueado como follow-up separado en `28-REGRESSION-DIFF.md`

### Phase 29: Content Humanization Safety Net

**Goal**: Toda la herramienta de seguridad (auditoría de campos, snapshot, fixes de schema bloqueantes, perfil de voz) existe y está verificada antes de reescribir una sola palabra de contenido real — prerequisito duro, no una fase paralela opcional, dado el historial real del proyecto (3 bugs repetidos de campos no-localizados pisados, 1 incidente real de pérdida de datos el 2026-07-12 recuperado vía Neon point-in-time restore).
**Depends on**: Nothing (Track B es independiente de Track A — puede arrancar en paralelo a Phase 26, pero se lista después en la numeración por orden de riesgo del milestone)
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05
**Success Criteria** (what must be TRUE):

  1. Existe un documento de auditoría pre-vuelo cubriendo todo campo de texto público en cada colección/global de Payload, clasificando localizado vs no-localizado, completado antes de tocar cualquier contenido real
  2. `TestimonialsCarousel.title` queda migrado a `localized: true` con backfill correcto — la migración generada fue leída por Claude y aprobada por nombre por Juan antes de aplicarse contra la Neon real, cerrando el patrón de bug repetido 3 veces en v1.5 (**recordatorio de scope**: esta es una migración que toca una columna existente con datos — requiere backfill explícito de ambos locales antes de cualquier `DROP`, y aprobación nombrada de Juan; no es una escritura aditiva que se pueda correr sin pausar, per la sección "Database Safety" de `CLAUDE.md`)
  3. `CaseStudies.services[].service` queda resuelto de forma locale-segura (fix de schema si aplica — mismo protocolo de aprobación que el punto anterior si toca una columna existente — o decisión documentada de no tocarlo)
  4. Existe un snapshot completo de texto real (no solo metadata) de toda la DB, diffable, usable como base de rollback más allá del point-in-time restore de Neon
  5. Existe un perfil de voz escrito (español neutro, sin voceo, profesional-directo, primera persona con reclamos de credenciales directos estilo Arianna Lupi, framing de CTA colaborativo) derivado del research de Arianna Lupi/Aleyda Solis, listo como brief para la skill `humanizer`

**Plans**: TBD

### Phase 30: Content Humanization — Globals, Core Pages, Services & Geo

**Goal**: El primer tramo de reescritura real, de menor riesgo/blast-radius (globals y colecciones lean, páginas núcleo, servicios y geo-pages), queda humanizado en la voz de Juan y verificado, validando el toolchain de snapshot/paridad antes de tocar el contenido de mayor volumen.
**Depends on**: Phase 29 (prerequisito duro — nada se reescribe sin la auditoría, el snapshot, los 2 fixes de schema y el perfil de voz ya cerrados y verificados)
**Requirements**: VOICE-06 (parte 1 de 2 — ver Phase 31 para el cierre formal del requirement), VOICE-07 (parte 1 de 2 — verificación de este tramo)
**Success Criteria** (what must be TRUE):

  1. El copy real de Header/Footer/Llms/Authors/Testimonials/Clientes/SpeakingEvents/Categories queda reescrito en la voz de Juan (perfil de VOICE-05), en ambos locales, sin tocar `meta.title`/`meta.description`/`targetKeyword`
  2. El copy real de Home/Contact/Privacy/Terms queda reescrito en la voz de Juan, en ambos locales
  3. El copy real del índice de Servicios + 4 landings + 2 geo-pages queda reescrito en la voz de Juan, en ambos locales
  4. Una verificación de paridad de locale sobre todas las colecciones/globals tocados en este tramo no muestra ningún campo colapsado/pisado entre `es`/`en`
  5. El `BreadcrumbList`/`Person`/JSON-LD y los campos `meta.title`/`meta.description` de SEO siguen válidos e intactos en todas las páginas tocadas, verificado en vivo (curl/validación de schema)

**Plans**: TBD

### Phase 31: Content Humanization — Posts & Case Studies + Verificación Final

**Goal**: El tramo de mayor volumen/visibilidad SEO (Posts y Case Studies) queda humanizado, cerrando formalmente el requirement de reescritura completa, y el milestone cierra con una verificación conjunta final de ambos tracks (Track A motion + Track B contenido) contra el baseline pre-milestone.
**Depends on**: Phase 30 (el tramo de mayor blast-radius corre último, sobre un toolchain de snapshot/paridad ya validado en tramos de menor riesgo)
**Requirements**: VOICE-06 (cierre formal — todo el copy real de la DB reescrito), VOICE-07 (cierre formal — verificación post-sweep completa)
**Success Criteria** (what must be TRUE):

  1. El body rich-text de todos los Posts y Case Studies queda reescrito en la voz de Juan, en ambos locales, sin tocar campos SEO/meta
  2. Existe un snapshot post-sweep diffado contra el snapshot pre-humanize de VOICE-04, disponible para que Juan lo lea antes de considerar el track cerrado
  3. `reindex-search.ts` corre de nuevo después del sweep completo, reflejando el copy reescrito en los resultados de `/search`
  4. Un barrido en vivo (curl, ambos locales) sobre todas las rutas tocadas por Track B más una validación de JSON-LD confirma cero structured data roto
  5. Un gate final de Lighthouse/CWV sobre las rutas representativas tocadas por ambos tracks (motion + contenido reescrito) no muestra regresión respecto al baseline pre-milestone

**Plans**: TBD

### Phase 32: Regression Baseline

**Goal**: Existe un snapshot medible (Lighthouse/CWV + H1/JSON-LD) del estado actual del sitio, capturado antes de que cualquier plan de este milestone toque un componente, siguiendo el mismo patrón "baseline antes, gate después" que v1.5 Phase 25 y v1.6 Phase 28.
**Depends on**: Nothing (primera fase del milestone; continúa la numeración desde Phase 31, que queda pausada)
**Requirements**: REG-01
**Success Criteria** (what must be TRUE):

  1. Lighthouse mobile capturado (misma tooling que Phase 25/28, `scripts/lighthouse-mobile.mjs` o equivalente) para un set representativo de rutas, incluyendo explícitamente `/seo-tecnico-madrid` y `/seo-tecnico-lima` (únicas rutas que Phase 34 va a modificar estructuralmente)
  2. H1 y JSON-LD capturados para el mismo set de rutas, mismo patrón de snapshot que fases anteriores
  3. El snapshot queda documentado en un archivo committeado (ej. `32-REGRESSION-BASELINE.md`) antes de que arranque cualquier plan de Phase 33
  4. Ningún componente ni contenido es modificado durante esta fase — es puramente de medición

**Plans**: TBD

### Phase 33: Local Landing Components

**Goal**: Los 2 componentes nuevos que el .pen aporta (Hero variant `local-landing`, block `LocalProofSection`) existen en código, están registrados en Payload, y renderizan correctamente contra contenido de prueba — sin tocar todavía las páginas reales de Madrid/Lima.
**Depends on**: Phase 32 (baseline debe existir antes de tocar código)
**Requirements**: LOCAL-01, LOCAL-02
**Success Criteria** (what must be TRUE):

  1. `src/blocks/Hero/config.ts` acepta un nuevo valor de variant `local-landing`, y `Component.tsx` renderiza badge de ciudad (ícono map-pin + nombre), anillo decorativo (ellipse con stroke, sin fill), stat inline con check-icon, y CTA row cuando ese variant está activo
  2. Existe un block Payload nuevo `LocalProofSection` (config + componente React) registrado en la lista de bloques de `Pages` y en el registry de `RenderBlocks`, editable desde `/admin` con 3 stats numéricos + testimonial card (nombre/negocio)
  3. Ambos componentes reusan únicamente tokens de color/tipografía/espaciado ya existentes — cero tokens nuevos agregados a `tailwind.config.ts`/`globals.css`
  4. Ambos renderizan sin error contra un dev server real cuando se agregan a una página de prueba (seed o vía admin), confirmado en vivo

**Plans**: TBD

### Phase 34: Local Landing Application (Madrid/Lima)

**Goal**: Las 2 landings locales reales dejan de reusar bloques genéricos sin diferenciación y pasan a tener una identidad visual/estructural propia por ciudad, con contenido real (no placeholder).
**Depends on**: Phase 33 (los componentes deben existir antes de aplicarlos)
**Requirements**: LOCAL-03, LOCAL-04, LOCAL-05
**Success Criteria** (what must be TRUE):

  1. `/seo-tecnico-madrid` usa el Hero variant `local-landing` con el anillo decorativo a la derecha, opacity 0.25, y una CTA row de un solo botón primario
  2. `/seo-tecnico-lima` usa el Hero variant `local-landing` con el anillo espejado (`flipX`) a la izquierda, opacity 0.35, y una CTA row de botón primario + botón outline ("Ver casos en Lima")
  3. Ambas landings incorporan `LocalProofSection` con stats y testimonial reales y propios de cada ciudad (no contenido templated/placeholder)
  4. La diferenciación Madrid vs Lima es estructural, confirmable por diff de código (props/config), no solo de copy — ambas rutas devuelven 200 verificado en vivo

**Plans**: TBD
**UI hint**: yes

### Phase 35: Component Polish Pass

**Goal**: Los 28 componentes restantes que el .pen ya mapea 1:1 contra el código actual reciben una revisión visual profesional (`ui-ux-pro-max`), y toda micro-mejora genuina encontrada queda implementada en código, no solo documentada.
**Depends on**: Phase 34 (evita pulir el Hero `local-landing`/`LocalProofSection` dos veces — la superficie completa del milestone ya existe antes de esta pasada)
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06
**Success Criteria** (what must be TRUE):

  1. Los 5 grupos de componentes (UI primitives, chrome, Hero variants existentes, bloques de contenido, componentes de autoría) quedan revisados contra su definición exacta en el .pen, con hallazgos documentados por grupo
  2. Toda micro-mejora genuina encontrada queda implementada en código, o descartada con razón explícita registrada cuando el .pen y el código ya son visualmente equivalentes
  3. `HeroGrainGradient` del Hero de Home queda intacto, confirmado por diff (no se toca, ya validado en v1.3)
  4. Cero tokens de diseño nuevos agregados — solo ajustes sobre tokens ya existentes
  5. `tsc --noEmit` limpio y los smoke checks existentes (ej. patrón de Phase 8) siguen en verde después de los cambios

**Plans**: 35-01 (single wave — review + direct fix)
**UI hint**: yes

### Phase 36: Regression Gate

**Goal**: El milestone cierra solo si una comparación medible contra el baseline de Phase 32 confirma cero regresión de performance/SEO atribuible al trabajo de Phase 33-35.
**Depends on**: Phase 35 (corre después de todo el trabajo de Local Landing y Polish)
**Requirements**: REG-02
**Success Criteria** (what must be TRUE):

  1. La misma medición de Lighthouse/CWV de Phase 32 se vuelve a correr sobre las mismas rutas y se diffea programáticamente contra el baseline
  2. H1/JSON-LD se vuelven a verificar en las mismas rutas y se diffean contra el baseline de Phase 32
  3. Queda un veredicto explícito PASS/FAIL registrado en un documento (ej. `36-REGRESSION-DIFF.md`), con gap closure corrido si el veredicto es FAIL (mismo patrón que Phase 25/28)
  4. El milestone solo se considera cerrable cuando el gate final es PASS

**Plans**: TBD

### Phase 37: Case Studies Content Audit & Fix

**Goal**: Los 6 case studies borrador (ids 15-20) que Juan verificó a mano en el admin quedan corregidos de punta a punta — sin huecos de contenido, sin KPIs sin sentido, sin cliente real expuesto — listos para que Juan decida publicarlos.
**Depends on**: Phase 36 (continúa la numeración; sin dependencia técnica real, milestone independiente)
**Requirements**: CASE-01, CASE-02, CASE-03, CASE-04, CASE-05, CASE-06, CASE-07, CASE-08, CASE-09, CASE-10, CASE-11
**Success Criteria** (what must be TRUE):

  1. Los 6 case studies (ids 15-20) tienen `challenge` y `solution` no vacíos en ambos locales (en/es) — verificable leyendo el doc crudo de cada uno.
  2. Cada KPI mostrado en los 6 docs (tarjetas tipo "+83%"/"+71%"/"86,000"/"22.4M") tiene un label visible que explica qué mide — ningún número suelto sin contexto.
  3. El doc 20 (despacho penal Pittsburgh) no contiene nombre real del cliente, dominio real, condado real ni conteo de reseñas real en ningún campo (incluidos metadata/clientContext) — reemplazado por datos anonimizados consistentes con el resto de case studies.
  4. `results.metrics` de cada uno de los 6 docs tiene múltiples filas reales (clics, impresiones, posición) sourced de Google Search Console real vía cualquier MCP `gsc-*` ya conectado y en vivo (no se requiere agregar propiedades nuevas) para la propiedad que respalda cada caso — sin exponer branding/nombre/dominio real del cliente. Cada fila/valor de la tabla (ej. "47,108"/"86,000"/"13.1M"/"22.4M"/"36.3"/"19.2") también lleva un título/label visible indicando qué métrica es — suficientes filas para que el chart antes/después no quede en 1-2 barras.
  5. La ejecución de la fase devuelve el JSON crudo completo de los 6 docs corregidos (no un resumen) para verificación manual de Juan, obtenido preferentemente vía el MCP `juan-payload` (`http://localhost:3000/api/mcp`, requiere dev server levantado) o por otra vía confirmada como funcional (no asumida) dado que un intento previo de scripting vía Local API falló en silencio en el shell de Juan.
  6. La tarjeta de autor (JU / Juan Carlos Angulo / Ingeniero de Software y Consultor SEO Técnico + bio) aparece una sola vez en la página de detalle de case study, no duplicada.
  7. Los 6 case studies tienen JSON-LD Schema.org válido, optimizado y dinámico por doc — cada uno refleja sus propios datos (no un schema genérico/hardcodeado copiado entre docs).
  8. El chart de resultados no mezcla en el mismo eje métricas de escalas muy distintas (ej. posición ~8 vs impresiones ~30,000 dejando la métrica chica invisible) — resuelto con eje secundario, normalización o separación de charts — y se ve correctamente en mobile (sin overflow, labels ilegibles, ni barras cortadas).
  9. La estructura de la página de case study fue comparada contra `https://ariannalupi.com/casos/ecommerce-vape/` como referencia, y se agregaron las secciones/elementos que faltaban y tenían sentido para el modelo de datos actual.

**Plans**: TBD

Plans:

- [ ] 37-01: TBD (definido en /gsd:plan-phase 37 — cubre auditoría de contenido de los 6 docs, fetch de datos GSC reales, escritura corregida contra la DB real, dedup de autor, schema JSON-LD dinámico, fix de escala/responsive del chart, benchmark contra ariannalupi.com/casos, y verificación con JSON crudo devuelto)

### Phase 38: Websites — Schema & Collection Design

**Goal**: Existe una colección `Websites` en Payload, modelada sobre el mismo patrón que `CaseStudies`, con todos los campos y cardinalidades correctos desde el día uno — este es el único punto del milestone donde los pitfalls de research (fecha de captura ausente, relaciones con cardinalidad incorrecta, contenido duplicado con `CaseStudies`) son baratos de prevenir, y caros de corregir después con contenido real ya cargado.
**Depends on**: Nothing (primera fase del milestone; continúa la numeración desde Phase 37, que queda en cola sin tocar)
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05
**Success Criteria** (what must be TRUE):

  1. Un editor puede crear un documento en `Websites` desde `/admin` con título, slug, array de tags de stack, screenshots reales (Media/Cloudinary), array `challenges` (mismo patrón que `CaseStudies.challenge`), año de lanzamiento, rol en el proyecto, industria/nicho y highlights técnicos
  2. El documento expone 4 scores de Lighthouse (performance/accessibility/best-practices/SEO) junto a un campo `lighthouseCapturedAt` (fecha) obligatorio — ningún score puede guardarse sin su fecha de captura
  3. El campo `client` (relación a `Clientes`, `hasMany: false`) y el campo `relatedCaseStudy` (relación a `case-studies`, `hasMany: false`, unidireccional) son ambos opcionales — un documento sin cliente externo (ej. apturio.com, juan-tech.com) se guarda sin error
  4. `Websites` aparece en `payload.config.ts` y en la lista `collections[]` de `@payloadcms/plugin-seo`, y `payload generate:types` corrió después del schema (payload-types.ts refleja la colección nueva)

**Plans**: 1 plan

Plans:

- [x] 38-01-PLAN.md — Crear colección Websites (schema completo), registrarla en payload.config.ts + plugin-seo, generar/aplicar migración y correr generate:types

### Phase 39: Websites — Frontend Components & Routes

**Goal**: La capa de renderizado reutilizable (card, bloque curado de Home, extensión de `ArchiveBlock`, rutas de listado/detalle) existe y sigue las convenciones ya establecidas del codebase (extender, no forkear) — un visitante puede navegar el nuevo portfolio de sitios igual que ya navega case studies.
**Depends on**: Phase 38 (nada de esto puede consultar un schema que no existe)
**Requirements**: WEB-06, WEB-07, WEB-08, WEB-09, WEB-10, WEB-11
**Success Criteria** (what must be TRUE):

  1. Un componente `WebsiteCard` compartido renderiza consistentemente en el bloque de Home, en `ArchiveBlock` y en la página de listado
  2. Home muestra una sección curada de sitios vía un `FeaturedWebsitesBlock` nuevo + campo `featuredWebsites` en el global `FeaturedContent` — mismo patrón que `FeaturedCaseStudiesBlock`, sin ninguna sección hardcodeada
  3. `ArchiveBlock` acepta `relationTo: 'websites'` (schema + `selectedDocs.relationTo`) sin crear un block nuevo
  4. Un visitante puede navegar `/[locale]/websites` (listado) y `/[locale]/websites/[slug]` (detalle), con breadcrumbs vía `buildWebsitesTrail()` (wrapper sobre `buildSectionTrail()` existente)
  5. La página de detalle emite JSON-LD tipo `CreativeWork` (no `SoftwareApplication`), validado conceptualmente contra Rich Results antes del cierre de la fase
  6. `src/lib/sitemap-data.ts` incluye las URLs de `/websites` y `/websites/[slug]` en el sitemap generado

**Plans**: 4 plans (2 waves)

Plans:

- [ ] 39-01-PLAN.md — Foundation: WebsiteCard component + buildWebsitesTrail() breadcrumb helper + websites sitemap entry
- [ ] 39-02-PLAN.md — FeaturedWebsitesBlock (config+Component) + FeaturedContent.featuredWebsites field + blockRegistry/Pages registration + migration
- [ ] 39-03-PLAN.md — ArchiveBlock extended with relationTo: 'websites'
- [ ] 39-04-PLAN.md — /[locale]/websites (listado) + /[locale]/websites/[slug] (detalle) con JSON-LD CreativeWork

**UI hint**: yes

### Phase 40: Websites — Content Population (Real Data Capture)

**Goal**: Los 6 sitios reales que Juan construyó existen como documentos completos y verídicos en `Websites` — stack confirmado por Juan sitio por sitio, screenshots reales, y Lighthouse real capturado una sola vez con su fecha, sin ninguna infraestructura de re-auditoría en vivo.
**Depends on**: Phase 39 (el poblado apunta a un schema y una UI ya renderizando, para verificar cada doc visualmente al cargarlo)
**Requirements**: WEB-12, WEB-13, WEB-14, WEB-15, WEB-16
**Success Criteria** (what must be TRUE):

  1. Existen 6 documentos reales en `Websites`: ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com
  2. El stack de cada uno de los 6 sitios fue confirmado interactivamente con Juan, un sitio a la vez (una pregunta por sitio) — lo que Juan no confirme se infiere del código/contenido público del sitio, no se asume de una sola vez para los 6
  3. Cada documento tiene un screenshot real full-page (capturado vía Playwright, una sola corrida) subido a Cloudinary por el pipeline de Media existente — ningún iframe en vivo ni fetch de captura en tiempo de request
  4. Cada documento tiene scores de Lighthouse reales corridos una sola vez contra la URL en vivo del sitio (mismo patrón que `scripts/lighthouse-mobile.mjs`), con `lighthouseCapturedAt` seteado a la fecha real de esa corrida — visible en la UI, no solo en el dato crudo
  5. Las relaciones `client`/`relatedCaseStudy` quedan pobladas donde exista match real (ej. si el dominio ya es cliente en `Clientes` o tiene un case study existente), sin duplicar ni contradecir qué dato vive en `Websites` vs. en `CaseStudies` para el mismo sitio

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 10.5 → 10.6 → 10.7 → 10.8 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25 → 26 → 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38 → 39 → 40 (v1.1-v1.5 cerrados; v1.6 Track A [26-28] cerrado, Track B [29-31] pausado, retoma después de v1.7; v1.7 CERRADO [Phase 32-36 completas] — baseline de regresión → componentes nuevos de Local Landing → aplicación real a Madrid/Lima → polish pass de los 28 componentes restantes → gate de cierre (PASS, 6/6 rutas limpias); v1.8 [Phase 37, EN COLA] — fix de contenido/anonimización/datos GSC reales en los 6 case studies borrador ids 15-20, CONTEXT.md/UI-SPEC.md aprobados, retoma cuando v1.9 cierre; v1.9 [Phase 38-40, ACTIVO] — schema `Websites` → componentes/rutas de frontend → poblado real de 6 sitios (stack confirmado con Juan, screenshots/Lighthouse capturados una sola vez); Phase 6 en pausa, único ítem abierto aparte, retoma con el visto bueno de Juan)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Foundation | 10/10 | Complete    | 2026-07-09 |
| 2. Bilingüe + SEO | 5/5 | Complete    | 2026-07-09 |
| 3. Cloudinary Media Spike | 3/3 | Complete   | 2026-07-09 |
| 4. Migración Mongo → Postgres | 8/8 | Complete   | 2026-07-10 |
| 5. Frontend Pages | 13/13 | Complete   | 2026-07-10 |
| 6. Deploy + Cutover | 0/TBD | Paused (sole open project-wide item; resumes on Juan's go-ahead w/ real Hostinger/DNS/Resend creds) | - |
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
| 13. Home Content Population | 2/2 | Complete   | 2026-07-11 |
| 14. Target Keyword Field | 1/1 | Complete   | 2026-07-12 |
| 15. Sitemap XSL + HTML | 2/2 | Complete   | 2026-07-12 |
| 16. Hero Grainy Gradient — Implementation | 3/3 | Complete   | 2026-07-12 |
| 17. Hero Grainy Gradient — Performance & Mobile Verification | 1/1 | Complete   | 2026-07-12 |
| 18. SEO Technical Fixes + Metadata | 1/1 | Complete   | 2026-07-12 |
| 19. Service Pages | 0/TBD | Not started | - |
| 20. SEO Local Geo-pages | 0/TBD | Not started | - |
| 21. Home Optimization & Service Linking | 0/TBD | Not started | - |
| 22. Breadcrumbs (visual + schema) | 0/TBD | Not started | - |
| 23. Canonical + hreflang hardening | 0/TBD | Not started | - |
| 24. ServicesShowcase en Home | 0/TBD | Not started | - |
| 25. Service-page visual polish | 0/TBD | Not started | - |
| 26. UI/UX Polish Pass — Low-Risk Components | 0/TBD | Not started | - |
| 27. Micro-animation Library Adoption | 1/1 | Complete   | 2026-07-13 |
| 28. Component Motion Rollout + Hero Variants + Blog Grids | 4/4 | Complete   | 2026-07-13 |
| 29. Content Humanization Safety Net | 0/TBD | Not started | - |
| 30. Content Humanization — Globals, Core Pages, Services & Geo | 0/TBD | Not started | - |
| 31. Content Humanization — Posts & Case Studies + Verificación Final | 0/TBD | Not started | - |
| 32. Regression Baseline | 1/1 | Complete | 2026-07-14 |
| 33. Local Landing Components | 1/1 | Complete | 2026-07-14 |
| 34. Local Landing Application (Madrid/Lima) | 1/1 | Complete | 2026-07-14 |
| 35. Component Polish Pass | 1/1 | Complete | 2026-07-14 |
| 36. Regression Gate | 1/1 | Complete | 2026-07-14 |
| 37. Case Studies Content Audit & Fix | 0/TBD | Not started | - |
| 38. Websites — Schema & Collection Design | 1/1 | Complete   | 2026-07-14 |
| 39. Websites — Frontend Components & Routes | 0/TBD | Not started | - |
| 40. Websites — Content Population (Real Data Capture) | 0/TBD | Not started | - |
</content>
