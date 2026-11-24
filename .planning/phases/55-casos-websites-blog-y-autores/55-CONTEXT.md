# Phase 55: Casos, websites, blog y autores - Context

**Gathered:** 2026-11-08
**Status:** Ready for planning
**Mode:** Auto (`--auto`): decisiones tomadas con la opción recomendada, sin preguntas a Juan. Cada decisión marcada "auto, a revisar por Juan" puede revertirse en la revisión del preview.

<domain>
## Phase Boundary

Juan recorre en el preview (`dev.juan-tech.com`), en EN y ES, las superficies de prueba y de contenido editorial con el diseño MUI y datos de Payload: índice y detalle de casos de éxito, portafolio y detalle de websites, índice del blog con búsqueda, categorías con "ver más", post con TOC y progreso de lectura (58 posts), e índice y perfil de autores. Requisitos: PAG-03, PAG-04, PAG-05, PAG-10.

Fuera de alcance: home, servicios, contacto, stack, legales y sobre mí (fase 54, ya cerrada), los textos que solo Juan decide y las lecciones aprobadas (fase 56), y el retiro de Tailwind y del código viejo (fase 57). Las rutas y las URLs actuales no cambian: esta fase reemplaza la capa visual y agrega campos aditivos, nada más.

</domain>

<decisions>
## Implementation Decisions

### Estrategia general (hereda de la fase 54)
- **D-01:** Los componentes MUI se portan desde el sandbox `designs/design-system-mui/src/components/{site,blog}` (CaseDetail, CaseStudiesIndex, CaseCard, BeforeAfter, WebsiteDetail, WebsitesIndex, ProjectCard, AuthorsPage, BlogIndex, CategoryPage, CategoryNav, PostPage, PostBody, PostCard, Toc, ReadingProgress, RichText, Frames) a `src/components/`. Se conserva marcado, tokens y estados. (auto, a revisar por Juan)
- **D-02:** Cero datos del sandbox en el HTML. Ningún import de `designs/design-system-mui/src/data/*` (`cases.ts`, `case-lessons.ts`, `websites.ts`, `blog/*`, `about.ts`). Cada ruta sigue siendo un Server Component que lee por Local API (`overrideAccess: false` y `select` en colecciones con `access.read`) y pasa props tipadas a la vista. El script `54-no-sandbox-data.mjs` se extiende como `55-no-sandbox-data.mjs`.
- **D-03:** Las lecturas pasan por `src/lib/cache.ts` con tags de `src/lib/cache-tags.ts`. Los hooks `afterChange` de CaseStudies, Websites, Authors, Posts, Categories y SpeakingEvents revalidan esos tags. Esto cierra IN-05 de la revisión de la fase 54 para las colecciones que esta fase toca. (auto, a revisar por Juan)
- **D-04:** URLs, `generateMetadata`, `generateStaticParams`, canonical, hreflang, Open Graph y JSON-LD actuales no se tocan: se extraen a funciones de datos y se reutilizan tal cual. Solo cambia el árbol visual. Paridad de SEO contra producción para cada URL existente (58 posts, casos, websites, autores, categorías, índices) es criterio de aceptación, no verificación final.
- **D-05:** Las primitivas de la fase 54 se reutilizan, no se duplican: `MuiRichText` y `Toc` (`src/components/mui/rich-text`), `FaqAccordion`, `lists.tsx`, `links.ts`, `GrainBlob`, `PageHero`, `Crumbs`, `CtaSection`, `TranslationNotice`, `CaseMetricCard`, `ScoreRing`, `TechChips`. Las piezas nuevas (BeforeAfter, Frames, tabla comparativa) viven en `src/components/mui/` o `src/components/pages/` según su alcance.
- **D-06:** Migración solo aditiva y orden estricto: generar con `payload migrate:create`, leer el SQL, correr `payload migrate` con `juantech_user` y después desplegar. El preview lee con `juantech_preview_ro` (solo SELECT): un campo sin migrar rompe la página. Cada tabla nueva (`case_studies_lessons`, sus `_locales` y las de versiones si la colección las tiene) se verifica con la consulta del supuesto A7 de la fase 54-16, que confirmó que el rol lee tablas nuevas sin GRANT manual. Si el rol falla en una tabla nueva, el plan agrega un GRANT SELECT dentro de la migración. (auto, a revisar por Juan)
- **D-07:** Antes de cualquier escritura de contenido o migración se corre `scripts/db/04-which-database.ts` con el entorno de producción del túnel, nunca `--env-file=.env`. La verificación siempre es contra el HTML servido por `dev.juan-tech.com`, no contra la misma base que escribió.

### Casos de éxito (PAG-03)
- **D-08:** Detalle: hero con métrica y deck, KPIs (`kpis`), contexto (`clientContext`), desafío (`challenge`), solución (`solution`), testimonio embebido (`testimonialSection`), resultados antes y después (`results`), comparativos, lecciones y conclusión (`conclusion`). Las secciones vacías no se renderizan (sin encabezado huérfano).
- **D-09:** Casos comparativos se calculan en el servidor a partir de los `results.metrics` de los demás casos (fila de clics orgánicos, ranking por porcentaje y por valor absoluto, igual que el sandbox). No hay campo nuevo ni dato duplicado. Si un caso no mide clics, queda fuera de la comparación. (auto, a revisar por Juan)
- **D-10:** Campo nuevo aditivo `lessons` (array de `text` localizado) en CaseStudies. Las lecciones del sandbox (`case-lessons.ts`) son borradores sin aprobar: NO se siembran en Payload. La vista renderiza la sección solo si hay lecciones; la fase 56 las carga ya aprobadas por Juan. Consecuencia que Juan debe saber: hasta la fase 56 el preview no muestra "Lecciones aprendidas". (auto, a revisar por Juan)
- **D-11:** Los campos existentes (`heroMetric`, `heroSubtitle`, `client`, `sector`, `period`, `services`, `kpis`, `clientContext`, `challenge`, `solution`, `results`, `conclusion`, `heroImage`, `author`) cubren estadísticas, contexto, solución y conclusión. Cualquier otro campo que la vista necesite entra con migración aditiva y sin tocar datos existentes. Los casos existentes conservan sus datos byte a byte.
- **D-12:** El índice usa `CaseCard` con la métrica de cabeza y filtra cero casos: lista todos los publicados. El gráfico de resultados actual (`CaseStudyResultsChart`) se reemplaza por `BeforeAfter` con alternativa textual (tabla) para lectores de pantalla.

### Websites (PAG-04)
- **D-13:** Índice y detalle salen de la colección Websites (`highlights`, `stack`, `challenges`, `screenshots`, `lighthouse`, `relatedCaseStudy`). Los puntajes Lighthouse y las capturas son los de Payload, no los del sandbox (medidos el 6 de noviembre en el sandbox). Si Juan quiere los puntajes nuevos, es una actualización de contenido posterior, no de esta fase. (auto, a revisar por Juan)
- **D-14:** El tipo de sitio (Next.js, WordPress, Astro) se deriva de `stack` al renderizar, sin campo nuevo. Si el sitio solo tiene una captura, `Frames` muestra solo la de escritorio, sin marco de móvil vacío.
- **D-15:** El detalle enlaza el caso relacionado (`relatedCaseStudy`) y sugiere hasta 3 sitios del mismo tipo, con respaldo a los demás. El enlace externo del dominio lleva `rel="noopener"`.

### Blog (PAG-05)
- **D-16:** Los 58 posts responden 200 con su rich text completo. El rich text se renderiza con las conversiones actuales de bloques (`richTextBlockConverters.tsx`: bloques de código, FAQ, afiliado inline con divulgación, `EmailCaptureBlock`) re-vestidas con MUI sobre `MuiRichText`. No se reescribe el contenido ni se pierde ningún bloque. `RichTextRenderer` y los converters viejos solo se retiran en la fase 57.
- **D-17:** Búsqueda del índice: filtro en el cliente sobre `title` y `excerpt` de una lista ligera de los 58 posts (props), normalizado sin tildes como en el sandbox, con región `aria-live` que anuncia el número de resultados. Sin consulta, el HTML del servidor ya contiene todas las tarjetas y todos los enlaces; la búsqueda nunca reduce el contenido indexable. La página `/search` actual no cambia. (auto, a revisar por Juan)
- **D-18:** "Ver más" por categoría es un enlace real a `/blog/[category]` (sin JS necesario): el índice muestra las primeras 6 por categoría y la página de categoría lista todas. Se prefirió enlace sobre revelado en cliente para que cada post tenga un enlace rastreable y la regla de conteo de texto indexable no cambie. (auto, a revisar por Juan)
- **D-19:** Post: `Toc` generado desde los encabezados h2 y h3 del Lexical (anclas por `id` estables, las mismas que hoy cuando existan) y `ReadingProgress` como barra con `role="progressbar"`, `aria-valuenow` y respeto de `useMotion`. El TOC sticky colapsa a acordeón en móvil.
- **D-20:** La divulgación de afiliados se mantiene visible antes del primer enlace de afiliado inline y el `rel` real `sponsored nofollow noopener` (más estricto que el texto del requisito). El post conserva byline de autor (E-E-A-T), fecha, tiempo de lectura (`src/lib/reading-time.ts`) y los posts relacionados actuales.
- **D-21:** Lo que hoy es inerte en el preview sigue inerte: captura de email (doble opt-in), registro de clics de `/go`. En el preview el formulario responde éxito simulado, igual que Contacto en la fase 54.
- **D-22:** Una sola ruta de posts: `blog/[category]/[slug]` ya existe y se conserva. Las categorías usan los nombres y descripciones de Payload (`categories`), no los del sandbox.

### Autores (PAG-10)
- **D-23:** Índice y perfil salen de Authors: `name`, `jobTitle`, `bio`, `avatar`, `credentials`, `expertise`, `education`, `experience`, `yearsExperience`, `socialLinks`, más `SpeakingEvents` para la sección de eventos. El perfil de Juan conserva su JSON-LD `Person` (reutiliza `src/lib/person.ts`).
- **D-24:** El perfil reutiliza el timeline de `@mui/lab` ya instalado en la fase 54 para experiencia y educación. No se agrega ninguna dependencia nueva en esta fase.
- **D-25:** `/authors` y `/sobre-mi` no se unifican: sobre mí es la página de conversión de Juan (global propio), autores es la entidad editorial. Los dos comparten el origen de datos de Authors donde coinciden para no duplicar la bio.

### Home y leftovers de la fase 54
- **D-26:** Las secciones Casos y Sitios de la home dependen de `featured-content`, que hoy no tiene métricas de casos ni sitios. En esta fase se agrega un respaldo de solo lectura: si `featured-content` viene vacío, la home toma los N casos y sitios más recientes de las colecciones, con datos reales. No se escribe en el global (el contenido curado es de Juan). (auto, a revisar por Juan)
- **D-27:** Se pliegan los ítems baratos de `54-REVIEW.md` en los archivos que esta fase ya toca: IN-08 (`role="list"` por defecto en `lists.tsx`), IN-09 (`Section` sin `aria-labelledby` colgante), IN-07 (`limit ?? 8` no cubre 0 y falta `locale`), IN-06a (`assertSafeTarget` en los scripts nuevos de base de datos) e IN-05 (D-03). Se difieren IN-01 (copiar correo duplicado), IN-02 (el formulario pierde el mensaje), IN-03 (`key` de StackView) e IN-04 (cadenas fijas fuera de `messages`) salvo que un plan toque ese archivo. (auto, a revisar por Juan)

### Voz, accesibilidad y contenido
- **D-28:** Voz según la memoria del proyecto: encabezados y meta títulos sin puntos ni comas, se habla de Juan y no de una agencia, tono de experto que enseña. Esta fase no escribe copy editorial nuevo; solo etiquetas de interfaz, que van a `messages` en EN y ES con paridad (`55-messages-parity.mjs`).
- **D-29:** `A11Y.md` estricto: un `main` (lo pone el layout), un `h1` por página, jerarquía sin saltos, `aria-labelledby` por sección, foco visible, objetivos táctiles, `prefers-reduced-motion` vía `useMotion`, tablas con `caption` y `scope`, búsqueda con `role="search"` y etiqueta. Los marcadores `{{pendiente}}` no se inventan ni se ocultan: se renderizan como llegan de Payload y la fase 56 los cierra.
- **D-30:** Tipografía y espaciado heredan las excepciones aceptadas por Juan el 2026-11-08: escala `display` (24, 30, 36, h2 clamp 32 a 48, h1 clamp 40 a 60, 48, 72, 112, 176 px) y escala vertical de sección (80 a 192 px) se mantienen. Texto de cuerpo 12, 14, 16 y 20 px, con pesos 400 y 600. No se piden nuevas excepciones.
- **D-31:** Contenido en un solo idioma: si un caso, sitio o post existe solo en ES, EN sirve el aviso de traducción existente (`TranslationNotice`, `src/lib/translation-gaps.ts`) y conserva el comportamiento actual de hreflang; no se inventa traducción.

### Verificación (scripts `scripts/verify/55-*`)
- **D-32:** Misma batería que la fase 54, con orquestador `55-run-all.mjs` y un arnés SSR por superficie: contrato HTML por ruta y locale, estado 200 de los 58 posts en EN y ES, paridad de title, description, canonical, hreflang, Open Graph y JSON-LD contra producción (reutiliza `53-crawl-parity.mjs`), un `h1`, TOC con anclas que resuelven, `role="progressbar"`, búsqueda que cuenta resultados, enlaces "ver más" reales, `rel` de afiliado, ids únicos, migración aditiva (`55-migration-additive.mjs` rechaza DROP, TRUNCATE y ALTER destructivo), cero datos del sandbox, noindex del preview intacto. Se corre contra `dev.juan-tech.com` tras cada despliegue.

### Claude's Discretion
Nombres de archivos, estructura interna de `src/components/`, partición en planes y olas, diseño exacto del campo `lessons` y de cualquier campo aditivo adicional, cómo se agrupan las funciones de datos, y el número exacto de tarjetas por categoría en el índice (propuesto: 6).

</decisions>

<canonical_refs>
## Canonical References

**Los agentes posteriores DEBEN leer esto antes de planear o implementar.**

### Alcance y requisitos
- `.planning/ROADMAP.md` (Phase 55) - objetivo y 4 criterios de éxito
- `.planning/REQUIREMENTS.md` - PAG-03, PAG-04, PAG-05, PAG-10; SEO-01 a SEO-03 (paridad); CAL-01 a CAL-03
- `.planning/PROJECT.md`, `.planning/STATE.md`
- `CLAUDE.md` (raíz) - sección Database Safety (migraciones aditivas, `04-which-database.ts`)

### Fase 54 (patrones a reutilizar)
- `.planning/phases/54-paginas-de-conversion-y-utilidad/54-CONTEXT.md` - decisiones heredadas
- `.planning/phases/54-paginas-de-conversion-y-utilidad/54-UI-SPEC.md` - contrato de UI y excepciones aceptadas
- `.planning/phases/54-paginas-de-conversion-y-utilidad/54-RESEARCH.md`
- `.planning/phases/54-paginas-de-conversion-y-utilidad/54-16-SUMMARY.md` - supuesto A7 (rol `juantech_preview_ro`) y patrón de despliegue
- `.planning/phases/54-paginas-de-conversion-y-utilidad/54-REVIEW.md` - IN-01 a IN-09
- `.planning/phases/54-paginas-de-conversion-y-utilidad/deferred-items.md`
- `.planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/` - shell, `PREVIEW_READONLY`, crawl de paridad

### Diseño aprobado
- `designs/design-system-mui/src/components/site/` (CaseDetail, CaseStudiesIndex, CaseCard, BeforeAfter, WebsiteDetail, WebsitesIndex, ProjectCard, AuthorsPage, Frames)
- `designs/design-system-mui/src/components/blog/` (BlogIndex, CategoryPage, CategoryNav, PostPage, PostBody, PostCard, Toc, ReadingProgress, RichText, postUtils)
- `designs/design-system-mui/A11Y-DECISIONS.md`, `DESIGN-SYSTEM-MUI.md`
- `A11Y.md` (https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md)
- Los datos de `designs/design-system-mui/src/data/*` son solo referencia visual, no fuente

### Memoria del proyecto
- Voz y tono del copy del sitio; Trampas al escribir scripts contra Payload (fallbackLocale, `draft:false`, TTL de caché, verificar contra el HTML); Prod DB access (SSH, relay, túnel); Wrong-database incident 2026-08-17; Websites draft-publish fix

No hay specs externas adicionales: lo no listado queda capturado en las decisiones.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/mui/*` (fase 54): `PageHero`, `Crumbs`, `CtaSection`, `CtaPanel`, `FaqAccordion`, `CaseMetricCard`, `ScoreRing`, `TechChips`, `TestimonialCards`, `TranslationNotice`, `GrainBlob`, `lists.tsx`, `links.ts`, `rich-text/` (MuiRichText, Toc).
- Componentes viejos Tailwind que esta fase reemplaza en sus rutas: `CaseStudyCard`, `CaseStudyResultsChart`, `WebsiteCard`, `PostCard`, `BlogCategoryTabs`, `AuthorCard`, `AuthorByline`, `RichTextRenderer`, `ReadingProgress`, `Prose`. Se conservan en el repo hasta la fase 57 si otra ruta los usa.
- `src/components/richTextBlockConverters.tsx`, `AffiliateInlineCard`, `AffiliateDisclosure`, `InlineOffer`, `RailOffer`, `BlogClosing`, `CategoryBridge` (bloques y ofertas del post).
- Lógica de datos y SEO: `src/lib/{blog-paths,blog-promo,reading-time,breadcrumbs,person,site-schema,canonical,translation-gaps,affiliate,post-affiliate-scan,cache,cache-tags}.ts`.
- Scripts: `scripts/verify/54-*` (arnés SSR, `54-run-all`, paridad, migración aditiva, no-sandbox-data), `scripts/verify/53-crawl-parity.mjs`, `scripts/db/04-which-database.ts`, `scripts/db/23-phase54-verify-schema.ts`.

### Established Patterns
- Rutas ya existentes bajo `src/app/(frontend)/[locale]/`: `case-studies`, `case-studies/[slug]`, `websites`, `websites/[slug]`, `blog`, `blog/[category]`, `blog/[category]/[slug]`, `authors`, `authors/[slug]`. Se conservan.
- Lectura Local API con `overrideAccess: false` y `select`; globals sin `access.read` se leen sin esa opción (ver `src/lib/cache.ts`).
- Payload en proceso, `push:false`, migraciones aditivas en `src/migrations/` (la última: `20261108_043335_phase54_shadow_content`), hooks `afterChange` con `revalidateTag`.
- Colecciones: CaseStudies (`src/collections/CaseStudies/index.ts`), Websites, Authors, Posts (`title`, `excerpt`, `content`, `heroImage`, `author`, `categories`, `publishedAt`), Categories, SpeakingEvents.

### Integration Points
- Home: `src/components/home/Cases.tsx` y `Sites.tsx` leen de `featured-content` (D-26).
- Dokploy `juantech-preview` redespliega al empujar `feat/mui-redesign`; el rol `juantech_preview_ro` limita el preview a SELECT.
- Sitemap y `llms.txt` ya incluyen estas URLs; no deben cambiar.

</code_context>

<specifics>
## Specific Ideas

- Diseño aprobado en `designs/design-system-mui/` (solo oscuro); sandbox como referencia visual de cada pantalla, no como fuente de datos.
- Referencias de voz: el blog y los casos hablan de Juan, con el detalle técnico que cambia el resultado.
- La comparación entre casos del sandbox (ranking por porcentaje y por valor absoluto con barras) es parte del diseño aprobado y se conserva.

</specifics>

<deferred>
## Deferred Ideas

- Carga de las lecciones aprendidas aprobadas, textos CTA, marcadores `{{pendiente}}` y contenido curado de `featured-content` (métricas de casos y sitios): fase 56.
- Actualizar los puntajes Lighthouse y capturas de Websites a las mediciones nuevas del sandbox: contenido de Juan, posterior.
- Retiro de Tailwind, `RichTextRenderer`, `PostCard`, `ToolCard` y demás componentes viejos, y de los verificadores de la fase 48: fase 57.
- IN-01, IN-02, IN-03, IN-04 de `54-REVIEW.md` (salvo que un plan toque el archivo).
- Paginación o infinite scroll del blog: no se pidió; la categoría lista todo.

</deferred>

---

*Phase: 55-casos-websites-blog-y-autores*
*Context gathered: 2026-11-08*
