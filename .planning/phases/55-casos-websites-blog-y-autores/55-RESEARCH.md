# Phase 55: Casos, websites, blog y autores - Research

**Researched:** 2026-11-08
**Domain:** Port of four editorial surfaces (case studies, websites, blog with 58 posts, authors) from the approved MUI sandbox to Payload 3.85.2 on Next 15.4.11, reading a Postgres shared with production through a SELECT-only preview role, with one additive migration (`lessons`), SEO parity as an acceptance criterion and no content writes.
**Confidence:** HIGH for code, schema, live data and verify-script patterns (all read or measured this session); MEDIUM for deployment behavior and role privileges on the new tables (cannot touch the DB from this session, see Assumptions Log).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Estrategia general (hereda de la fase 54)**
- **D-01:** Los componentes MUI se portan desde el sandbox `designs/design-system-mui/src/components/{site,blog}` (CaseDetail, CaseStudiesIndex, CaseCard, BeforeAfter, WebsiteDetail, WebsitesIndex, ProjectCard, AuthorsPage, BlogIndex, CategoryPage, CategoryNav, PostPage, PostBody, PostCard, Toc, ReadingProgress, RichText, Frames) a `src/components/`. Se conserva marcado, tokens y estados. (auto, a revisar por Juan)
- **D-02:** Cero datos del sandbox en el HTML. Ningún import de `designs/design-system-mui/src/data/*` (`cases.ts`, `case-lessons.ts`, `websites.ts`, `blog/*`, `about.ts`). Cada ruta sigue siendo un Server Component que lee por Local API (`overrideAccess: false` y `select` en colecciones con `access.read`) y pasa props tipadas a la vista. El script `54-no-sandbox-data.mjs` se extiende como `55-no-sandbox-data.mjs`.
- **D-03:** Las lecturas pasan por `src/lib/cache.ts` con tags de `src/lib/cache-tags.ts`. Los hooks `afterChange` de CaseStudies, Websites, Authors, Posts, Categories y SpeakingEvents revalidan esos tags. Esto cierra IN-05 de la revisión de la fase 54 para las colecciones que esta fase toca. (auto, a revisar por Juan)
- **D-04:** URLs, `generateMetadata`, `generateStaticParams`, canonical, hreflang, Open Graph y JSON-LD actuales no se tocan: se extraen a funciones de datos y se reutilizan tal cual. Solo cambia el árbol visual. Paridad de SEO contra producción para cada URL existente (58 posts, casos, websites, autores, categorías, índices) es criterio de aceptación, no verificación final.
- **D-05:** Las primitivas de la fase 54 se reutilizan, no se duplican: `MuiRichText` y `Toc` (`src/components/mui/rich-text`), `FaqAccordion`, `lists.tsx`, `links.ts`, `GrainBlob`, `PageHero`, `Crumbs`, `CtaSection`, `TranslationNotice`, `CaseMetricCard`, `ScoreRing`, `TechChips`. Las piezas nuevas (BeforeAfter, Frames, tabla comparativa) viven en `src/components/mui/` o `src/components/pages/` según su alcance.
- **D-06:** Migración solo aditiva y orden estricto: generar con `payload migrate:create`, leer el SQL, correr `payload migrate` con `juantech_user` y después desplegar. El preview lee con `juantech_preview_ro` (solo SELECT): un campo sin migrar rompe la página. Cada tabla nueva (`case_studies_lessons`, sus `_locales` y las de versiones si la colección las tiene) se verifica con la consulta del supuesto A7 de la fase 54-16, que confirmó que el rol lee tablas nuevas sin GRANT manual. Si el rol falla en una tabla nueva, el plan agrega un GRANT SELECT dentro de la migración. (auto, a revisar por Juan)
- **D-07:** Antes de cualquier escritura de contenido o migración se corre `scripts/db/04-which-database.ts` con el entorno de producción del túnel, nunca `--env-file=.env`. La verificación siempre es contra el HTML servido por `dev.juan-tech.com`, no contra la misma base que escribió.

**Casos de éxito (PAG-03)**
- **D-08:** Detalle: hero con métrica y deck, KPIs (`kpis`), contexto (`clientContext`), desafío (`challenge`), solución (`solution`), testimonio embebido (`testimonialSection`), resultados antes y después (`results`), comparativos, lecciones y conclusión (`conclusion`). Las secciones vacías no se renderizan (sin encabezado huérfano).
- **D-09:** Casos comparativos se calculan en el servidor a partir de los `results.metrics` de los demás casos (fila de clics orgánicos, ranking por porcentaje y por valor absoluto, igual que el sandbox). No hay campo nuevo ni dato duplicado. Si un caso no mide clics, queda fuera de la comparación. (auto, a revisar por Juan)
- **D-10:** Campo nuevo aditivo `lessons` (array de `text` localizado) en CaseStudies. Las lecciones del sandbox (`case-lessons.ts`) son borradores sin aprobar: NO se siembran en Payload. La vista renderiza la sección solo si hay lecciones; la fase 56 las carga ya aprobadas por Juan. Consecuencia que Juan debe saber: hasta la fase 56 el preview no muestra "Lecciones aprendidas". (auto, a revisar por Juan)
- **D-11:** Los campos existentes (`heroMetric`, `heroSubtitle`, `client`, `sector`, `period`, `services`, `kpis`, `clientContext`, `challenge`, `solution`, `results`, `conclusion`, `heroImage`, `author`) cubren estadísticas, contexto, solución y conclusión. Cualquier otro campo que la vista necesite entra con migración aditiva y sin tocar datos existentes. Los casos existentes conservan sus datos byte a byte.
- **D-12:** El índice usa `CaseCard` con la métrica de cabeza y filtra cero casos: lista todos los publicados. El gráfico de resultados actual (`CaseStudyResultsChart`) se reemplaza por `BeforeAfter` con alternativa textual (tabla) para lectores de pantalla.

**Websites (PAG-04)**
- **D-13:** Índice y detalle salen de la colección Websites (`highlights`, `stack`, `challenges`, `screenshots`, `lighthouse`, `relatedCaseStudy`). Los puntajes Lighthouse y las capturas son los de Payload, no los del sandbox (medidos el 6 de noviembre en el sandbox). Si Juan quiere los puntajes nuevos, es una actualización de contenido posterior, no de esta fase. (auto, a revisar por Juan)
- **D-14:** El tipo de sitio (Next.js, WordPress, Astro) se deriva de `stack` al renderizar, sin campo nuevo. Si el sitio solo tiene una captura, `Frames` muestra solo la de escritorio, sin marco de móvil vacío.
- **D-15:** El detalle enlaza el caso relacionado (`relatedCaseStudy`) y sugiere hasta 3 sitios del mismo tipo, con respaldo a los demás. El enlace externo del dominio lleva `rel="noopener"`.

**Blog (PAG-05)**
- **D-16:** Los 58 posts responden 200 con su rich text completo. El rich text se renderiza con las conversiones actuales de bloques (`richTextBlockConverters.tsx`: bloques de código, FAQ, afiliado inline con divulgación, `EmailCaptureBlock`) re-vestidas con MUI sobre `MuiRichText`. No se reescribe el contenido ni se pierde ningún bloque. `RichTextRenderer` y los converters viejos solo se retiran en la fase 57.
- **D-17:** Búsqueda del índice: filtro en el cliente sobre `title` y `excerpt` de una lista ligera de los 58 posts (props), normalizado sin tildes como en el sandbox, con región `aria-live` que anuncia el número de resultados. Sin consulta, el HTML del servidor ya contiene todas las tarjetas y todos los enlaces; la búsqueda nunca reduce el contenido indexable. La página `/search` actual no cambia. (auto, a revisar por Juan)
- **D-18:** "Ver más" por categoría es un enlace real a `/blog/[category]` (sin JS necesario): el índice muestra las primeras 6 por categoría y la página de categoría lista todas. Se prefirió enlace sobre revelado en cliente para que cada post tenga un enlace rastreable y la regla de conteo de texto indexable no cambie. (auto, a revisar por Juan)
- **D-19:** Post: `Toc` generado desde los encabezados h2 y h3 del Lexical (anclas por `id` estables, las mismas que hoy cuando existan) y `ReadingProgress` como barra con `role="progressbar"`, `aria-valuenow` y respeto de `useMotion`. El TOC sticky colapsa a acordeón en móvil.
- **D-20:** La divulgación de afiliados se mantiene visible antes del primer enlace de afiliado inline y el `rel` real `sponsored nofollow noopener` (más estricto que el texto del requisito). El post conserva byline de autor (E-E-A-T), fecha, tiempo de lectura (`src/lib/reading-time.ts`) y los posts relacionados actuales.
- **D-21:** Lo que hoy es inerte en el preview sigue inerte: captura de email (doble opt-in), registro de clics de `/go`. En el preview el formulario responde éxito simulado, igual que Contacto en la fase 54.
- **D-22:** Una sola ruta de posts: `blog/[category]/[slug]` ya existe y se conserva. Las categorías usan los nombres y descripciones de Payload (`categories`), no los del sandbox.

**Autores (PAG-10)**
- **D-23:** Índice y perfil salen de Authors: `name`, `jobTitle`, `bio`, `avatar`, `credentials`, `expertise`, `education`, `experience`, `yearsExperience`, `socialLinks`, más `SpeakingEvents` para la sección de eventos. El perfil de Juan conserva su JSON-LD `Person` (reutiliza `src/lib/person.ts`).
- **D-24:** El perfil reutiliza el timeline de `@mui/lab` ya instalado en la fase 54 para experiencia y educación. No se agrega ninguna dependencia nueva en esta fase.
- **D-25:** `/authors` y `/sobre-mi` no se unifican: sobre mí es la página de conversión de Juan (global propio), autores es la entidad editorial. Los dos comparten el origen de datos de Authors donde coinciden para no duplicar la bio.

**Home y leftovers de la fase 54**
- **D-26:** Las secciones Casos y Sitios de la home dependen de `featured-content`, que hoy no tiene métricas de casos ni sitios. En esta fase se agrega un respaldo de solo lectura: si `featured-content` viene vacío, la home toma los N casos y sitios más recientes de las colecciones, con datos reales. No se escribe en el global (el contenido curado es de Juan). (auto, a revisar por Juan)
- **D-27:** Se pliegan los ítems baratos de `54-REVIEW.md` en los archivos que esta fase ya toca: IN-08 (`role="list"` por defecto en `lists.tsx`), IN-09 (`Section` sin `aria-labelledby` colgante), IN-07 (`limit ?? 8` no cubre 0 y falta `locale`), IN-06a (`assertSafeTarget` en los scripts nuevos de base de datos) e IN-05 (D-03). Se difieren IN-01 (copiar correo duplicado), IN-02 (el formulario pierde el mensaje), IN-03 (`key` de StackView) e IN-04 (cadenas fijas fuera de `messages`) salvo que un plan toque ese archivo. (auto, a revisar por Juan)

**Voz, accesibilidad y contenido**
- **D-28:** Voz según la memoria del proyecto: encabezados y meta títulos sin puntos ni comas, se habla de Juan y no de una agencia, tono de experto que enseña. Esta fase no escribe copy editorial nuevo; solo etiquetas de interfaz, que van a `messages` en EN y ES con paridad (`55-messages-parity.mjs`).
- **D-29:** `A11Y.md` estricto: un `main` (lo pone el layout), un `h1` por página, jerarquía sin saltos, `aria-labelledby` por sección, foco visible, objetivos táctiles, `prefers-reduced-motion` vía `useMotion`, tablas con `caption` y `scope`, búsqueda con `role="search"` y etiqueta. Los marcadores `{{pendiente}}` no se inventan ni se ocultan: se renderizan como llegan de Payload y la fase 56 los cierra.
- **D-30:** Tipografía y espaciado heredan las excepciones aceptadas por Juan el 2026-11-08: escala `display` (24, 30, 36, h2 clamp 32 a 48, h1 clamp 40 a 60, 48, 72, 112, 176 px) y escala vertical de sección (80 a 192 px) se mantienen. Texto de cuerpo 12, 14, 16 y 20 px, con pesos 400 y 600. No se piden nuevas excepciones.
- **D-31:** Contenido en un solo idioma: si un caso, sitio o post existe solo en ES, EN sirve el aviso de traducción existente (`TranslationNotice`, `src/lib/translation-gaps.ts`) y conserva el comportamiento actual de hreflang; no se inventa traducción.

**Verificación (scripts `scripts/verify/55-*`)**
- **D-32:** Misma batería que la fase 54, con orquestador `55-run-all.mjs` y un arnés SSR por superficie: contrato HTML por ruta y locale, estado 200 de los 58 posts en EN y ES, paridad de title, description, canonical, hreflang, Open Graph y JSON-LD contra producción (reutiliza `53-crawl-parity.mjs`), un `h1`, TOC con anclas que resuelven, `role="progressbar"`, búsqueda que cuenta resultados, enlaces "ver más" reales, `rel` de afiliado, ids únicos, migración aditiva (`55-migration-additive.mjs` rechaza DROP, TRUNCATE y ALTER destructivo), cero datos del sandbox, noindex del preview intacto. Se corre contra `dev.juan-tech.com` tras cada despliegue.

### Claude's Discretion
Nombres de archivos, estructura interna de `src/components/`, partición en planes y olas, diseño exacto del campo `lessons` y de cualquier campo aditivo adicional, cómo se agrupan las funciones de datos, y el número exacto de tarjetas por categoría en el índice (propuesto: 6).

### Deferred Ideas (OUT OF SCOPE)
- Carga de las lecciones aprendidas aprobadas, textos CTA, marcadores `{{pendiente}}` y contenido curado de `featured-content` (métricas de casos y sitios): fase 56.
- Actualizar los puntajes Lighthouse y capturas de Websites a las mediciones nuevas del sandbox: contenido de Juan, posterior.
- Retiro de Tailwind, `RichTextRenderer`, `PostCard`, `ToolCard` y demás componentes viejos, y de los verificadores de la fase 48: fase 57.
- IN-01, IN-02, IN-03, IN-04 de `54-REVIEW.md` (salvo que un plan toque el archivo).
- Paginación o infinite scroll del blog: no se pidió; la categoría lista todo.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAG-03 | Casos de éxito (índice y detalle) con estadísticas, contexto, solución, lecciones, comparativos y conclusiones (campos nuevos en CaseStudies vía migración aditiva) | Field map "Cases" below: every sandbox block maps to an existing field except `lessons` (new, 4 additive tables). Comparison is computed from `results.metrics` with a locale-independent matcher (ES and EN labels measured). Lessons stay hidden until phase 56. |
| PAG-04 | Websites (portafolio y detalle) desde la colección Websites | Field map "Websites": one full-page screenshot per site, `domain` derived from `client.websiteUrl` (null for `juan-tech-com`), Lighthouse null case, caption must not claim "mobile". |
| PAG-05 | Blog (índice con búsqueda, categorías con "ver más", post con TOC y progreso) sirve los 58 posts con su rich text | Measured post corpus (58 ES + 58 EN; block types, link kinds, h1-in-body, duplicate heading slugs), the five rich-text pitfalls in `MuiRichText`, route-level SEO artifacts that must survive, search/progress/TOC patterns. |
| PAG-10 | Autores (índice y perfil) desde la colección Authors | Profile has no sandbox section for experience, education, expertise, events: compose from the `AboutView` timeline pattern. Keep `buildSitePerson` JSON-LD. Render all posts server-side (production lists only 50). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Database safety (CLAUDE.md "Database Safety").** `DATABASE_URI` in `.env` is not trustworthy (incident 2026-08-17: it pointed at an abandoned Neon). Run `scripts/db/04-which-database.ts` before any migration or write; if the host is not Dokploy's (via the tunnel, `127.0.0.1:15432/juantech`) stop. Additive migrations and normal content writes need no confirmation; `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, `delete` and field reshapes need Juan to read the SQL and approve by name. Generate with `payload migrate:create`, read the SQL first. `push: false`.
- **This task adds a stricter rule (orchestrator constraints):** never pass `--env-file=.env`; Claude does not touch any DB; Juan runs every DB step through the tunnel; master is never touched; the preview is reached only by pushing `feat/mui-redesign`.
- **Stack pins:** `next` 15.4.11 [VERIFIED: package.json `"next": "15.4.11"`; CLAUDE.md text says 15.5.x but the repo pins 15.4.11], `react` 19.2.7, `payload` and every `@payloadcms/*` 3.85.2, `@mui/material` 9.5.0, `@mui/lab` 9.0.0-beta.10 (already installed), `graphql` ^16.
- **Frontend:** follow `A11Y.md` strictly (WCAG 2.2 AA) plus `designs/design-system-mui/A11Y-DECISIONS.md`.
- **Voice (every written deliverable):** no em or en dashes, headings and meta titles without periods or commas, speak of Juan not an agency, expert who teaches. UI strings in `messages/{es,en}.json` with parity.
- **GSD:** file edits start through a GSD command (`/gsd:execute-phase`). Production deploys only by merging to `master`; the preview is validated against `dev.juan-tech.com`, never local.
- **Script traps (project memory):** `fallbackLocale: false` when a read decides whether to write; `draft: false` on every `update` of a collection with drafts; count with `grep -o | wc -l` (HTML arrives on one line); wait the 60 s cache TTL; verify against the served HTML.
- **No project skills with code patterns** (`.claude/skills/` only has `react-doctor` and `ui-ux-pro-max`).

## Summary

Phase 55 is a visual-layer replacement plus **one** additive schema change. Every sandbox block already has a Payload field except "Lecciones aprendidas", and per D-10 that section is not seeded, so the preview will not show it until phase 56. The phase writes no content to any database: its only database action is applying one additive migration (4 new tables, no column changes to existing tables), which Juan applies through the tunnel before the single push. The rest is porting components, extracting existing route logic into data functions, and extending the 54 verification battery to the 58 posts in both locales with SEO parity.

The main risks are not in the sandbox components but in what the sandbox does not know about the real data and routes. Measured on the live API (2026-11-08): the 58 posts contain 204 absolute own-domain links in ES (120 in EN) that the 54 `MuiRichText` would render as `target="_blank"` external links; 12 ES posts (10 EN) carry an `h1` inside the body that the site demotes to `h2` but that the 54 TOC and heading-id map ignore; EN has 11 duplicate heading slugs; the post body is split in two halves for the inline offer and each half would restart heading-id numbering; and `email-capture` blocks have no converter in `MuiRichText` at all. The sandbox `CategoryPage` and `AuthorProfile` reveal posts client-side (9 at a time), which would cut crawlable links (production's author page already lists only 50 of 58 posts). The post and index routes carry SEO behavior the sandbox lacks (308 to the primary category, `omitEn` hreflang and `noindex` for 17 incomplete EN posts, legacy `/blog/<slug>` redirects, `?newsletter=` and `?subscribed=` state, `force-dynamic` forced by `searchParams`) and all of it must survive the swap of the visual tree.

D-26 resolves the 54 gap: the home hides Cases and Sites because `featured-content` is empty (preview HTML has no `id="casos"` and no `id="sitios"`); the fallback reads the latest published cases and websites with the existing `mapFeaturedCases` and `mapWebsite` mappers.

**Primary recommendation:** Build a thin tracer first (Websites index end to end plus the `55-*` verification skeleton), generate and guard the `lessons` migration in parallel, gate the single push behind a Juan-run migration checkpoint (format of plan 54-07), fix the five `MuiRichText` gaps before touching the post page, render every list fully server-side, and extend the page contract so SEO parity compares Open Graph, Twitter and full JSON-LD for all 58 posts in both locales (EN URLs derived from ES, because the sitemap lists only 41 EN posts).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Reading cases, websites, posts, authors, categories, speaking events | API / Backend (Local API in a Server Component, `unstable_cache` layer) | Database / Storage | Payload SDK must not reach the client bundle; `overrideAccess: false` plus `select` is the repo rule (`src/lib/cache.ts` header) |
| Comparison table and ranking of cases | Frontend Server | none | Pure computation over `results.metrics` of the other cases, then serializable props; no new field |
| View rendering (cards, tables, timeline, frames) | Browser / Client (`'use client'` MUI views) | Frontend Server (Emotion SSR) | MUI needs the client; all text must still be in the server HTML (SEO-03) |
| Lexical to JSX (post body, FAQ, code, tables) | Frontend Server (`MuiRichText`, Server Component) | Browser (copy button, scroll region, TOC scrollspy) | Converters render in the server; only interactive leaves are client |
| Heading ids and TOC | Frontend Server (pure `lexical-toc.ts` over the whole body) | Browser (active link via IntersectionObserver) | Ids must come from one function so anchors match; the observer only reinforces |
| Blog search | Browser (filter over a light list passed as props) | Frontend Server (full cards in HTML without a query) | D-17: never reduces indexable content; progressive fallback to `/search` through a real form |
| "Ver más" per category | Frontend Server (real link to `/blog/[category]`) | none | D-18: crawlable, works without JS |
| Reading progress | Browser | none | Scroll-driven, decorative reinforcement with `role="progressbar"` |
| SEO metadata, canonical, hreflang, OG, JSON-LD | Frontend Server (`generateMetadata`, `JsonLd`) | none | Unchanged by D-04; extracted to data functions and reused |
| 308 redirects (primary category, legacy `/blog/<slug>`) | Frontend Server (route handlers) | none | Already implemented in route files; the visual swap must not drop them |
| Cache invalidation | API / Backend (`afterChange` hooks, `revalidateTag`) | none | Hooks only act in the process that runs the admin; the preview relies on the 60 s TTL |
| Email capture in post body | API / Backend (existing server action `subscribeToLeadMagnetAction`) | Browser (form) | Already inert under `PREVIEW_READONLY` (redirects to `?subscribed=pending`) |
| Schema (`lessons`) | Database / Storage | API / Backend | Additive migration applied by Juan before the push |

## Standard Stack

### Core (already installed, no change)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@mui/material` | 9.5.0 | Components and theme | [VERIFIED: package.json] |
| `@mui/lab` | 9.0.0-beta.10 | `Timeline` for author experience and education (D-24) | Already installed in 54 [VERIFIED: package.json `"@mui/lab": "9.0.0-beta.10"`]; reuse the `AboutView` timeline markup |
| `payload`, `@payloadcms/*` | 3.85.2 | Local API, `richtext-lexical/react` `RichText` | [VERIFIED: package.json] |
| `next` | 15.4.11 | App Router, ISR, `unstable_cache` | [VERIFIED: package.json] |
| `next-intl` | ^4.13.1 | `useTranslations`, `getTranslations` | Already in use |
| `lucide-react` | ^1.24.0 | Icons, always `aria-hidden` | Already in use |
| `playwright` | ^1.61.1 | Browser-level checks (search count, progressbar) | In devDependencies, Chromium cached (`~/Library/Caches/ms-playwright`) |

### Supporting
None. D-24 forbids new dependencies and none are needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side filter for blog search (D-17) | Server search by query param | Duplicates `/search`; D-17 is locked |
| Computing comparison in the view | A manual `compare` field | Duplicated data that goes stale; D-09 is locked |

**Installation:** none. **Version verification:** versions above were read from `package.json` this session; no `npm view` is needed because nothing is installed.

## Package Legitimacy Audit

No external packages are installed in this phase. `gsd-tools query package-legitimacy check` was not run because there is nothing to check.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | n/a | n/a | n/a | n/a | n/a | n/a |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (note: `@mui/lab` was flagged `too-new` in phase 54 and approved with a checkpoint there; it is already installed).

## Data Map: sandbox against Payload

Status column: **Exists**, **Derivable** (computed at render, no write), **Gap** (needs a decision or a new field).

### Cases (PAG-03)

Schema read this session [VERIFIED: src/collections/CaseStudies/index.ts:27-30]:
```
  versions: {
    drafts: { autosave: { interval: 100 }, schedulePublish: true },
    maxPerDoc: 50,
  },
```
Hooks already wired [VERIFIED: src/collections/CaseStudies/index.ts:23-26]: `afterChange: [revalidateCaseStudiesCache]`, `afterDelete: [revalidateCaseStudiesCacheOnDelete]`. Fields [VERIFIED: index.ts:32-111]: `title`, `heroMetric`, `heroSubtitle` (localized text), `client` (relationship `clientes`), `sector` (localized), `period`, `services[]`, `kpis[]` (`label` localized, `value`), `clientContext` (richText, localized), `challenge[].text`, `solution[]` (`title`, `description`), `testimonialSection` (blocks, maxRows 1), `results` group (`periodBefore`, `periodAfter`, `metrics[]` with `label` localized, `before`, `after`), `conclusion` (richText), `heroImage`, `author`. There is no `publishedAt` on this collection (the JSON-LD comment in the detail route says so).

| Sandbox element (`CaseDetail`, `CaseCard`) | Payload source | Status | Note |
|---|---|---|---|
| `metric` and `metricLabel` | `heroMetric` through `splitHeroMetric` | Exists | `src/components/mui/split-hero-metric.ts` already exports `splitHeroMetric` and `formatSector`; `0 -> 56 clicks` and `+68%` fall back to the whole string |
| `industry` | `sector` through `formatSector` | Exists | Payload stores a long dash between sector and subsector; `formatSector` rewrites it to a comma (voice rule) |
| `deck` | `heroSubtitle` | Exists | |
| `period` | `period` | Exists | |
| `kpis` | `kpis[]` | Exists | 4 KPIs in 6 cases, 3 in the migration case (measured) |
| `compare` ("Jul 2024 a Jun 2025 -> Jul 2025 a Jun 2026") | `results.periodBefore` and `results.periodAfter` | Derivable | Build "before -> after" from the two fields; never hardcode periods |
| `results[].change` | computed `(after - before) / before` | Derivable | Sandbox values equal the plain ratio rounded, including negative for positions (36.3 to 19.2 gives -47). `null` when `before` is 0 or a field is not numeric |
| `client` paragraphs | `clientContext` (Lexical) | Exists | Single paragraph in all 7 cases (measured); render with `MuiRichText` |
| `challenge[]`, `solution[]` | `challenge[].text`, `solution[].title` and `.description` | Exists | 3 each in all 7 cases |
| `closing` paragraphs | `conclusion` (Lexical) | Exists | Single paragraph |
| `quote` | `testimonialSection[0]` (`quote`, `authorName`, `authorRole`) | Exists | Only the migration case has one (author name Marcela Ibanez). Render it next to the conclusion as the sandbox does |
| `lessons` | none | **Gap (new field)** | See "Schema change" below; stays hidden until phase 56 |
| Comparison table and ranking | other cases' `results.metrics` | Derivable | See Pitfall 9 |
| "Mas casos" (3 other cases) | other published cases | Derivable | |
| Author byline | `author` populated at depth 2 | Exists | The sandbox case page has none; keep an E-E-A-T author aside (the current route renders `AuthorCard` and its JSON-LD names the author) |

Live measurement (anonymous API, 2026-11-08) [VERIFIED: `GET https://juan-tech.com/api/case-studies?locale=es|en&depth=0|1`]: 7 published cases; no `heroImage` on any (hero uses the metric aside, no image); ES metric labels `Clics orgánicos anuales`, `Impresiones orgánicas anuales`; EN labels `Annual organic clicks`, `Annual organic impressions`; the migration case measures `Tráfico orgánico mensual` and so is excluded from the click comparison; the talleres case has `before` `0` (no percentage, ranks only by absolute value) and a position row with a non-numeric `before`.

### Websites (PAG-04)

Schema [VERIFIED: src/collections/Websites/index.ts:21-67]: `title`, `role`, `industry` (localized), `year`, `highlights[]`, `stack[].tag`, `challenges[]`, `screenshots[].image` (upload, required), `lighthouse` group (four numbers 0 to 100), `lighthouseCapturedAt` (`{ name: 'lighthouseCapturedAt', type: 'date', required: true }`, line 57), `client` (relationship `clientes`), `relatedCaseStudy`, slug. No hooks (no `afterChange`), no `domain` or `url` field.

Live measurement [VERIFIED: `GET https://juan-tech.com/api/websites?locale=es&depth=1`]: 6 sites, each with exactly **one** screenshot, a full-page capture (widths 1280, heights 7799, 5622, 10879, 7052, 10727 and one 1280x720); `juan-tech-com` has `client: null` and all four Lighthouse values `null`; `lighthouseCapturedAt` is 2026-07-14 for every site; stack tags are `Next.js`, `Payload CMS`, `Neon Postgres`, `Hostinger` or `WordPress`, `Elementor`; the five other sites have `client.websiteUrl` (`estylopia.com` has a trailing slash). Default order from the API is newest first (ids 6 to 1) with juan-tech first, matching the sandbox order.

| Sandbox element | Payload source | Status | Note |
|---|---|---|---|
| `name`, `tagline`, `industry`, `year` | `title`, `role`, `industry`, `year` | Exists | `year` is a number |
| `domain` (frame bar, "Visitar el sitio") | `hostnameOf(client.websiteUrl)` (exists in `src/lib/home-data-b.ts`) | Derivable with a gap | `juan-tech-com` has no client. Fallback: derive from the slug (`apturio-com` gives `apturio.com`) or treat the site as own site (`SITE_URL`). Only ever build the external link from the validated hostname (`https://${hostname}`), never from raw input |
| `kind` (Next.js, WordPress, Astro) | derived from `stack[].tag` | Derivable | D-14. Payload tags contain no Astro: the sandbox's Astro entry has no Payload equivalent, so only two filters appear (Next.js and WordPress). `ariannalupi-com` is tagged Next.js in Payload while the sandbox calls it Astro: do not "fix" this, it is content |
| `desktop` and `mobile` images | `screenshots[0]` only | Exists, reduced | One full-page image: show only `BrowserFrame` with `object-fit: cover; object-position: top` in the 16:10 box; no phone frame (D-14) |
| `scores` | `lighthouse` | Exists | Hide each ring whose value is `null` (`ScoreRing` already returns nothing for non-numbers); hide the whole scores section when all four are null |
| "PageSpeed Insights en movil, 6 de noviembre de 2026" caption | `lighthouseCapturedAt` | Gap | Payload does not record the device. Caption must say the measurement date from `lighthouseCapturedAt` and must not claim "mobile" (Pitfall 10) |
| `highlights`, `challenges` | same names | Exists | 3 and 2 per site |
| Previous and next project | other sites in list order | Derivable | |
| "Mas proyectos" (3 of same kind, then fill) | derived | Derivable | D-15 |
| Related case study link | `relatedCaseStudy` | Exists | `null` for all 6 sites today, so the link is conditional |

### Posts and categories (PAG-05)

Schema [VERIFIED: src/collections/Posts/index.ts]: `title`, `excerpt` (localized), `content` (Lexical with `BlocksFeature` of `AffiliateInlineBlock` and `EmailCaptureBlock`), `heroImage`, `author` (required), `categories` (hasMany), `publishedAt`, slug; hooks `revalidatePostsCache` and `revalidatePostsCacheOnDelete` already wired.

Measured corpus [VERIFIED: public API `GET /api/posts?locale=es|en&depth=0&limit=100&pagination=false`, scripted analysis, 2026-11-08]:

| Fact | ES | EN |
|---|---|---|
| Published posts | 58 | 58 |
| Top-level node types | paragraph 2304, heading 1628, list 400, block 67, table 31 | paragraph 1757, heading 1212, list 240, block 32, table 31 |
| Block types | `code-block` 56, `faq` 9, `affiliate-inline` 1, `email-capture` 1 | `code-block` 30, `affiliate-inline` 1, `email-capture` 1 (no `faq`) |
| `h1` inside the body (demoted to `h2` by the site converter) | 12 | 10 |
| Posts without any `h2` | 1 | 1 |
| Duplicate h2/h3 slugs inside a post | 0 | 11 |
| Own-domain absolute links (`https://juan-tech.com/...`) | 204 | 120 |
| Relative links (`/blog/...`) | 242 | 154 |
| External absolute links | 0 | 0 |
| Upload or image nodes in body | 0 | 0 |
| Heading ids that collide with page ids (`contacto`, `main-content`, `page-title`) | 0 | 0 |
| Downward heading jumps, with body `h1` treated as `h2` | 0 | 0 |

Categories [VERIFIED: `GET /api/categories`, counts by `where[categories.slug]`]: `tech-seo` (SEO Técnico) 16 posts, `seo` (Estrategia SEO) 11, `development` (Desarrollo) 9, `cs-fundamentals` (Ciencias de la Computación) 22, `general` (General) 0. The sum of the first four is 58. `general` is the URL fallback category; it has an indexed page (`/blog/general` is in the sitemap) with an empty state and must keep answering 200. `BlogCategoryRows` and `BlogCategoryTabs` exclude `general` from listings and tabs (`FALLBACK_CATEGORY_SLUG`).

The `/blog` index content comes from the Pages doc `blog` [VERIFIED: `GET /api/pages?where[slug][equals]=blog`]: layout is `hero` (title `Blog`, a subtitle, breadcrumbs), `blogCategoryRows` (`postsPerCategory: 3`, ordered `categoryOrder`) and `newsletterBlock` (title, description, labels, consent text). `meta.description` is set, `meta.title` is null. Keep the h1 text from this doc, not the sandbox's new copy.

### Authors (PAG-10)

`Authors` has `access: { read: () => true }` [VERIFIED: src/collections/Authors/index.ts:27-29 region] and no hooks; `SpeakingEvents` likewise `read: () => true` and no hooks. Fields: `name`, `jobTitle`, `bio` (textarea, localized), `avatar`, `credentials[]`, `expertise[].topic`, `education[]` (`degree`, `institution`, `logo`, dates, `description`), `experience[]` (`company`, `role`, dates, `description`), `yearsExperience`, `socialLinks[]`, slug, target keyword. One author (`juan-carlos-angulo`) and 2 speaking events (no `flyer` on either, per the 54 measurement).

The sandbox `AuthorProfile` has hero, a stats row and a post grid only. It has **no** section for credentials, expertise, experience, education or events, which ROADMAP criterion 4 requires. Compose them from the `AboutView` timeline pattern (`ul` with the date inside the item content, A11Y-DECISIONS "Linea de tiempo"). Production's profile lists `limit: 50` posts and `limit: 50` cases [VERIFIED: authors/[slug]/page.tsx:198,205,212], so 8 of 58 posts have no link from it today; render all 58.

## Schema change: `lessons` (the only migration)

**Design (Claude's discretion, D-10 wording says "array de text"):** use an array with `title` (text, localized, required) and `body` (textarea, localized, required). The sandbox lesson is a heading plus a sentence (`{ title, body }`), and the view renders an `h3` and a paragraph; a single `text` field cannot carry the heading without inventing a delimiter. Place it after `results` and before `conclusion`.

```ts
// src/collections/CaseStudies/index.ts (insert between `results` and `conclusion`)
{
  name: 'lessons',
  label: 'Lecciones aprendidas',
  type: 'array',
  admin: { description: 'Opcional. La seccion solo se muestra si hay lecciones cargadas.' },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'body', type: 'textarea', required: true, localized: true },
  ],
},
```

**Expected tables (4, all new):** `case_studies_lessons`, `case_studies_lessons_locales`, `_case_studies_v_version_lessons`, `_case_studies_v_version_lessons_locales`. This follows the pattern of the existing array `challenge`, which has `case_studies_challenge` (+ `_locales`) and `_case_studies_v_version_challenge` (+ `_locales`) [VERIFIED: CREATE TABLE statements in src/migrations/20260709_191127_initial.ts:650, 20260709_201401_phase2_i18n_seo.ts:415 and the `_case_studies_v_version_challenge*` tables listed by grep]. No existing table or column changes, so the 7 existing cases keep their data byte for byte (D-11) and master ignores the new tables.

**Procedure for the planner (same as 54-02):**
1. Add the field; `PAYLOAD_SECRET=build-only DATABASE_URI=postgresql://build:build@127.0.0.1:5432/build node_modules/.bin/payload migrate:create phase55_case_lessons` (fake build variables; this connection is never opened) [CITED: 54-02-SUMMARY "Authentication Gates" and 54-02-PLAN line 187]. `migrate:create` also writes a `.json` snapshot and rewrites the trailing comma of the previous entry in `src/migrations/index.ts` (normal, 54-02-SUMMARY).
2. Read the SQL. Run `scripts/verify/55-migration-additive.mjs`, a copy of `54-migration-additive.mjs` whose allow-list is exactly the four table names above (plus their indexes and foreign keys, `REFERENCES` to `case_studies`, `_case_studies_v` and `_locales`), no `CREATE TYPE`, and which rejects `DROP`, `TRUNCATE`, `DELETE`, `RENAME`, `ALTER COLUMN ... TYPE`. If the guard shows anything else (drift between the last snapshot `20261108_043335_phase54_shadow_content.json` and the config), stop and report instead of editing the SQL.
3. `npm run generate:types` with the same fake variables, `npx tsc --noEmit`.
4. Do not apply and do not push; the checkpoint below does.

## Architecture Patterns

### System Architecture Diagram

```
Visitor -> Cloudflare -> Traefik -> juantech-preview container (feat/mui-redesign, PREVIEW_READONLY=true)
   |
   v middleware: /es/* 308 | next-intl rewrite | X-Robots-Tag noindex
   |
   v (frontend)/[locale]/layout.tsx  [Providers MUI, header, single <main id="main-content">, footer]
   |
   +-- case-studies/page.tsx ------> getCaseStudiesIndex(locale) --+
   +-- case-studies/[slug]/page.tsx -> getCaseStudyView(slug)      +--> cache.ts (unstable_cache, TTL 60 s, tags)
   +-- websites/page.tsx, [slug] --> getWebsites*(locale)          |       |
   +-- blog/page.tsx --------------> page doc `blog` + categories  |       v
   |        (force-dynamic: reads ?newsletter=)  + posts light list|   Payload Local API (overrideAccess:false, select)
   +-- blog/[category]/page.tsx ---> category + all posts          |       |
   |        (legacy /blog/<slug> -> permanentRedirect)             |       v
   +-- blog/[category]/[slug]/page.tsx -> getCachedPost + promo    |   Postgres via role juantech_preview_ro (SELECT)
   |        (force-dynamic: reads ?subscribed=; 308 to primary category)
   +-- authors/page.tsx, [slug] ---> authors + posts + cases + events
   +-- page.tsx (home) ------------> getHomeCases/getHomeSites with D-26 fallback (latest published)
   |
   v  page.tsx extracts generateMetadata + JSON-LD builders unchanged (D-04)
   v  View ('use client') receives serializable props -> MUI tree
   v  MuiRichText (Server Component): Lexical -> JSX, ids from lexical-toc over the WHOLE body

Writes: none (preview is SELECT-only). The only DB action is one additive migration applied by Juan via tunnel.
```

### Recommended Project Structure
```
src/
├── collections/CaseStudies/index.ts        # + lessons
├── lib/
│   ├── cache-tags.ts                       # + websites, authors, speakingEvents tags and hooks
│   ├── cache.ts                            # + cached fetchers for the 55 surfaces
│   ├── case-study-data.ts                  # index/detail props, comparison (pure), JSON-LD builder
│   ├── websites-data.ts                    # props, domain, kind (pure), JSON-LD builder
│   ├── blog-data.ts                        # index rows, light search list, post view data, Article JSON-LD
│   ├── authors-data.ts                     # index and profile props
│   └── home-data-b.ts                      # + D-26 fallback
├── components/
│   ├── mui/                                # shared: BeforeAfter, Frames, ScrollRegion, ReadingProgress, PostCard, rich-text blocks
│   │   └── rich-text/                      # MuiRichText extensions, blocks.tsx (code, faq, affiliate, email, table)
│   └── pages/{cases,websites,blog,authors}/ # views
└── app/(frontend)/[locale]/...             # routes: only the default export body changes
scripts/
├── db/24-phase55-verify-schema.ts          # read only, assertSafeTarget
└── verify/55-*.mjs|ts                      # see Verification map
```

### Pattern 1: Route keeps its SEO shell, swaps its body
**What:** Each existing `page.tsx` keeps `revalidate`/`dynamic`, `generateStaticParams`, `generateMetadata`, redirects and JSON-LD objects. Extract the Payload read and the JSON-LD object into functions in `src/lib/*-data.ts` (pure builders, testable), and replace only the returned JSX by `<View ... />`.
**When:** all 9 routes.
**Do not change:** `export const revalidate = 60` on cases, websites and authors routes; `export const dynamic = 'force-dynamic'` on `blog/page.tsx` [VERIFIED: blog/page.tsx:23] and `blog/[category]/[slug]/page.tsx` [VERIFIED: :84]. The post route's header comment documents that dropping `force-dynamic` there returned 500 (`DYNAMIC_SERVER_USAGE`) because it reads `searchParams`.

### Pattern 2: Cached read with `overrideAccess: false` and `select`
```ts
// Source: src/lib/cache.ts (getCachedCategories and getCachedLatestPostLinks follow this shape)
export function getCachedWebsitesIndex(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'websites',
        locale,
        sort: '-createdAt',        // NOT -publishedAt: the collection has no such field
        limit: 0,
        pagination: false,
        depth: 1,
        overrideAccess: false,     // drops never-published drafts (SEO-40 class of leak)
        select: { title: true, slug: true, role: true, industry: true, year: true, stack: true,
                  screenshots: true, lighthouse: true, lighthouseCapturedAt: true, client: true },
        populate: { media: { url: true, width: true, height: true, alt: true }, clientes: { websiteUrl: true, name: true } },
      })
      return docs
    },
    ['websites-index', locale],
    { tags: [CACHE_TAGS.websites()], revalidate: CACHE_TTL_SECONDS },
  )()
}
```
The current index and detail routes for websites, case studies and authors call `payload.find` directly without `overrideAccess: false`, without cache and without `select` [VERIFIED: websites/page.tsx:31-37, case-studies/page.tsx:36-45, authors/page.tsx:30-36]; the port fixes that (D-02, D-03).

### Pattern 3: Cache tags and hooks (D-03, IN-05)
Existing tags [VERIFIED: src/lib/cache-tags.ts:74-89]:
```
export const CACHE_TAGS = {
  page: (slug: string) => `pages:${slug}`,
  posts: () => 'posts:all',
  post: (slug: string) => `posts:${slug}`,
  caseStudies: () => 'case-studies:all',
  caseStudy: (slug: string) => `case-studies:${slug}`,
  categories: () => 'categories:all',
  ...
  affiliateLinks: () => 'affiliate-links:all',
}
```
Posts, CaseStudies and Categories already have `afterChange` and `afterDelete` hooks. **Websites, Authors and SpeakingEvents have none.** `cache.ts` already tags websites with the literal string `'websites:all'` (in `getCachedArchive`), which no hook invalidates. Add `websites: () => 'websites:all'`, `authors: () => 'authors:all'`, `speakingEvents: () => 'speaking-events:all'` plus `revalidate*Cache` and `...OnDelete` hooks (same `safeRevalidateTag` plus `safeRevalidateAllPaths` shape), wire them into the three collections, and retag the untagged author reads: `getCachedSitePerson` in `src/lib/person.ts`, `getCachedCtaAuthor` in `src/lib/cta-data.ts`, and the authors and speaking-events caches in `src/lib/about-data.ts` (those `unstable_cache` calls currently pass only `revalidate`). Keep `cache-tags.ts` free of `payload` and `@payload-config` imports (documented import-cycle rule in its header).
**Limit to tell the planner:** hooks run in the process that executes the admin. Production admin is `master` (unaware of the new tags) and the preview is a different process, so on the preview an edit propagates only by the 60 s TTL plus the 60 s ISR window [CITED: 54-VERIFICATION.md human-check "revalidateTag corre en el proceso de produccion y no invalida la cache del proceso del preview"]. IN-05 can therefore only be verified statically (a `55-cache-tags.ts` self-test that each collection config exposes the hooks and that every tag a fetcher uses is produced by `CACHE_TAGS`), not on the preview. The live revalidation check stays in the phase 57 human gate.

### Pattern 4: Case comparison as a pure function
Sandbox logic (`clicks`, `rows`, `byPct`, `byAbs`, ranks) ports to a pure module. Match the click row by a locale-independent matcher, because labels differ by locale [VERIFIED: ES `Clics orgánicos anuales`, EN `Annual organic clicks`]:
```ts
const CLICKS_LABEL = /^(clics org[aá]nicos anuales|annual organic clicks)/i
// num(): "47,108" -> 47108, "13.1M" -> 1.31e7, "533K" -> 533000, "-" or "(dash)" -> NaN
```
Exclude a case when no row matches or a value is `NaN`. `pct` is `null` when `before <= 0`. Include the current case only if it is in `rows` (the migration case is not). The table needs `<caption>`, `scope="col"` and `scope="row"` (D-29). The bar column stays `aria-hidden` (A11Y-DECISIONS "Barras antes y despues"). Do not add `tabIndex={0}` to the scroll container unless it overflows (A11Y.md section 6, see Pitfall 6).

### Pattern 5: Blog index and category, all server-side
The index renders: hero from the Pages doc `blog` (h1 and subtitle), `CategoryNav` as a `nav` of real links with `aria-current`, the latest post featured, then one section per listable category with the first 6 posts and a real link to `/blog/<slug>` (D-18), then the `newsletterBlock` content, then the closing. Search is a client island: pass a light list of all 58 posts (`title`, `excerpt`, `category`, `slug`, `dateISO`, `minutes` omitted because reading time needs the body) as props; without a query the section tree is the server HTML; with a query the client swaps to a results list and announces the count in a `role="status"` (aria-live polite) region. Wrap the field in `<form role="search" action="/search" method="get">` with `name="q"` and a visible label, and `preventDefault` on submit when JS filtered: without JS pressing Enter reaches the existing `/search` page (it already accepts `q`; `/en/search` for EN), so the control is never dead. Keep `?newsletter=` handling (links from the double opt-in emails return to `/blog?newsletter=confirmed|unsubscribed|invalid`).
Category page: all posts of the category in the HTML (no client reveal), `CategoryNav`, `CategoryBridge` equivalent (links to the other categories), empty state for `general`, and `permanentRedirect` from a legacy `/blog/<postSlug>` segment (function `legacyPostRedirectPath` in the current route).

### Pattern 6: Post page structure
Keep, in this order: `generateMetadata` (canonical path uses the primary category; `alternates` with `omitEn` for `EN_TRANSLATION_INCOMPLETE`; `robots: { index: false, follow: true }` when `isEnTranslationIncomplete(locale, slug)`), the 308 to the primary category, the `Article` and `BreadcrumbList` JSON-LD objects, `postHasAffiliateInline` and `postHasAmazonAffiliateInline` for the disclosure placed before the body, `splitContentForOffer` for the inline offer, `buildRichTextConverters({ subscribedState, postPath })`, related posts (same-category, `overrideAccess: false`, excluding the current post), `BlogClosing`. New: `Toc` from `extractHeadings` over the **entire** `doc.content`, `ReadingProgress` targeting the article element, author byline and author aside, previous and next links within the category.

### Anti-Patterns to Avoid
- **Importing anything from `designs/design-system-mui/src/data`** (D-02); the sandbox `RichText` and `PostBody` operate on a Block JSON of its own and must not be ported, `MuiRichText` replaces them.
- **Calling `MuiRichText` once per body half** (the offer split): each call builds its own id map and restarts numbering.
- **Client-side reveal of lists** (sandbox `CategoryPage` STEP 9, `AuthorProfile` STEP 9): cuts links in the server HTML.
- **`getCachedArchive` for cases or websites**: it sorts those collections by `-publishedAt`, a field they do not have (cache.ts:437 and :447); use `-createdAt`.
- **`linkFor()` or `NextLink` as `component` from a Server Component**: React Flight cannot serialize it (54 review CR-01); guard `54-rsc-boundary.mjs` already fails on it.
- **Two closing blocks on blog surfaces** (see Open Question 1).
- **Eyebrows and leads copied from the sandbox** that Payload does not have (for example "Resultados reales", "Quien escribe"): D-28 says no new editorial copy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heading ids and TOC | A DOM-scanning TOC (old `TableOfContentsBlock` assigns `heading-N` after mount) | `extractHeadings` and `buildHeadingIdMap` in `src/components/mui/rich-text/lexical-toc.ts` | One function feeds the list and the headings; anchors match by construction. Extend it, do not fork it |
| Lexical to JSX | New serializer | `RichText` from `@payloadcms/richtext-lexical/react` with `richTextConverters` / `buildRichTextConverters` | Already handles `code-block`, `faq`, `affiliate-inline`, `email-capture`, tables with header row, h1 demotion |
| Sector and metric text | New regex | `splitHeroMetric`, `formatSector` (`src/components/mui/split-hero-metric.ts`) | Already handles the voice rule and the `0 -> 56` case |
| Domain of a site | New URL parser | `hostnameOf` (`src/lib/home-data-b.ts`) | Restricts to http and https, strips `www.` |
| Site card mapping | New mapper | `mapWebsite`, `mapFeaturedCases` (`src/lib/home-data-b.ts`) | Already tolerant of nulls; D-26 reuses them |
| Breadcrumbs | Hand-built trails | `buildCaseStudiesTrail`, `buildWebsitesTrail`, `buildAuthorsTrail`, `buildBlogTrail`, `buildBreadcrumbJsonLd` | JSON-LD and visible trail come from one array. Map `{ label, url }` to the `PageHero` `crumbs` `{ label, href }` |
| Metadata | New `generateMetadata` | `pageTitle`, `buildOpenGraph`, `buildAlternates` | SEO parity (D-04) |
| Person JSON-LD | New node | `buildSitePerson`, `personRef`, `SITE_PERSON_SLUG` (`src/lib/person.ts`) | Shared `@id`; education split into `hasCredential` and `alumniOf` |
| Reading time | New counter | `estimateReadingTime`, `readingTimeLabel` (`src/lib/reading-time.ts`) | Not computed for cards (needs the full body); only on the post page and the featured entry |
| Offer copy | Sandbox `CtaBlock` text | `getCachedBlogPromo` and `resolveBlogPromo` | Copy lives in the `blog-promo` global; omitting it reduces indexable text |
| Link `component` | Inline decision | `linkFor` inside a client file, or `RichTextLink` | RSC boundary |
| DB target guard | New check | `assertSafeTarget` from `scripts/db/data/54-seed-lib.ts` | Rejects Neon and unknown hosts |
| Verify harness | New renderer | `scripts/verify/54-ssr-harness.ts` (`renderToHtml`, `countOf`, `hasId`, `headingLevels`, `textOf`) | Real theme, real next-intl messages, `createElement` only |
| Contract and parity helpers | New parsers | exports of `54-page-contract.mjs`: `extractMeta`, `checkContract`, `compareMeta`, `punctuatedHeadings`, `sandboxAssetPaths` | `buildRoutes()` has a selftest asserting 30 routes, so do not extend it in place; write `55-page-contract.mjs` that imports these |

**Key insight:** the blog rich text is where hidden behavior lives (absolute links, split body, demoted h1, duplicate slugs, a block with no converter). Reuse the repo's converters and fix the shared primitive once, so privacy and terms (54) benefit too.

## Runtime State Inventory

Not a rename phase, but it shares live state with production, so the planner must treat these as inventory:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Same `juantech` database for preview and production. This phase adds 4 empty tables (`case_studies_lessons*`, `_case_studies_v_version_lessons*`). No rows are written by this phase | Additive migration only. No seed. `lessons` stays empty until phase 56 |
| Live service config | Production admin runs `master`, which does not know `lessons`; the preview process is the only code that will read it | Juan edits lessons later in the local admin (`./scripts/db/dev-tunneled.sh`) or after cutover |
| OS-registered state | Preview app `juantech-preview` in Dokploy auto-deploys on push to `feat/mui-redesign`; role `juantech_preview_ro` is SELECT only | None new. Re-verify read on the 4 new tables with the preview role (D-06) |
| Secrets/env vars | `DATABASE_URI` for the tunnel, exported by Juan in his terminal; `.env` holds a Neon URI that must not be used | Pre-flight check before `migrate` (see Pitfall 21). No new variables |
| Build artifacts | `src/payload-types.ts` (regenerate), `src/migrations/*.json` snapshot and `index.ts` | Regenerate types after the field change; commit the snapshot with the migration |

## Common Pitfalls

### Pitfall 1: `MuiRichText` turns own-domain absolute links into new-tab external links
**What goes wrong:** 204 ES and 120 EN body links are `https://juan-tech.com/...`. `renderLink` treats `https?:` as external and emits `target="_blank"`, `rel="noopener noreferrer"` and a "(se abre en otra pestana)" suffix for every one of them [VERIFIED: src/components/mui/rich-text/MuiRichText.tsx:73 `const external = /^https?:/i.test(href) || Boolean(fields?.newTab)`]. Production renders them as plain same-tab links (`rel` and `target` undefined, seen in the live post HTML).
**How to avoid:** in the shared primitive, classify a link whose host is the site host (`juan-tech.com`, with or without `www.`) as internal: same tab, no suffix, href unchanged (parity). Keep `target="_blank"` only for non-site hosts or `fields.newTab`. In the preview those links leave `dev.juan-tech.com` for production; record that as a known property or, only when `isPreviewReadonly()`, rewrite the origin to a relative path (Open Question 3).
**Warning signs:** `55-post-contract` counts anchors with `target="_blank"` in a post whose production HTML has none.

### Pitfall 2: Heading ids across the split body, the demoted `h1` and duplicate slugs
**What goes wrong:** `splitContentForOffer` yields `{ before, after }` and the current page renders two `RichTextRenderer`s inside one `article`. `MuiRichText` computes `buildHeadingIdMap(data.root)` per call [VERIFIED: MuiRichText.tsx:59], so the second half restarts at `-2` numbering and may reuse ids from the first half while the TOC (built from the whole body) points at the wrong node. Separately, `extractHeadings` and `buildHeadingIdMap` default to `levels = [2, 3]` [VERIFIED: lexical-toc.ts `levels: number[] = [2, 3]`], so a body `h1` (12 ES, 10 EN posts) is rendered as `h2` by the site converter but gets no id and no TOC entry, whereas the old DOM-based TOC listed it. EN has 11 duplicate heading slugs, so the `-2`, `-3` suffix logic is exercised for real.
**How to avoid:** compute the id map once over the full `doc.content` and pass it down (new optional prop on `MuiRichText`, for example `headingIds`), or render one `RichText` and inject the offer through a converter at the split index. Treat `h1` as level 2 when collecting (`level = tag === 'h1' ? 2 : n`) so it joins the TOC and gets an id. Add a reserved-id set (`contacto`, `main-content`, `page-title`, and any fixed id the post view declares) to `collect` so a heading slug never duplicates a page id; none collide today, this is prevention.
**Warning signs:** `55-post-contract` finds a TOC `href="#x"` with no element id, or duplicate ids on a page.

### Pitfall 3: `email-capture` has no converter in `MuiRichText`
**What goes wrong:** `MuiRichText` builds on the static `richTextConverters(args)`, which deliberately has no `email-capture` entry; that entry exists only in `buildRichTextConverters(ctx)` [VERIFIED: src/components/richTextBlockConverters.tsx:299-308, `'email-capture': () => (<EmailCaptureCard postPath=... subscribedState=... />)`]. Without it Payload logs "no converter" and the block renders nothing (one post per locale loses its subscription form).
**How to avoid:** give `MuiRichText` an optional `converters` or `ctx` input (`subscribedState`, `postPath`) and compose over `buildRichTextConverters`. The MUI block re-skins (code, FAQ, affiliate-inline, email capture, table) go in a new file under `src/components/mui/rich-text/` and must keep the import constraint documented in `AffiliateInlineCard.tsx` and `EmailCaptureBlock/Component.tsx`: never import `RichTextRenderer`, `AffiliateDisclosure` or the FAQ component transitively (TDZ circular import with `richTextBlockConverters`).
**Warning signs:** `[payload]` "no converter" lines in the preview logs; `grep -o 'name="email"'` returns 0 on the post that has the block.

### Pitfall 4: Absolute own links, relative links and locale prefixes
Relative body links (`/blog/...`, 242 ES, 154 EN) go through `sanitizeHref` and `RichTextLink`, so on an EN page `linkFor` adds `/en`. Production leaves them unprefixed even on EN pages. This is an improvement but changes hrefs. `55-content-parity` must compare internal link sets after stripping a leading `/en` and the site origin.

### Pitfall 5: Sandbox lists reveal client-side
`CategoryPage` and `AuthorProfile` keep `shown` state with STEP 9, so the server HTML has 9 cards. D-18 and SEO-03 forbid it. Render every card on the server. If the page is judged too heavy, defer image loading (`loading="lazy"`), not the links.

### Pitfall 6: A11Y.md on scroll regions
The sandbox puts `role="region" tabIndex={0}` on every table container and `tabIndex={0}` on every code `pre`. A11Y.md section 6 says: "MUST NOT add `tabindex="0"` to a scrollable container that does not actually overflow." [CITED: A11Y.md section 6 "Focus Traps Nobody Asked For", fetched 2026-11-08]. It also forbids `aria-label` that duplicates visible text and requires the accessible name to contain the visible text (SC 2.5.3). Build one client `ScrollRegion` that measures `scrollWidth > clientWidth` (ResizeObserver) and only then adds `tabIndex={0}`, `role="region"` and a label; use it for post tables (31 per locale), code blocks (56 ES, 30 EN) and the comparison table. The sandbox "Copiar" button stays a real `button` with a `role="status"` announcement.

### Pitfall 7: Sandbox type sizes and spacing exceed the accepted scale
Sandbox `PostBody` uses 18 px body, 22 px lead and 34 px h2; sandbox `CaseDetail` uses 18 px lead. D-30 and 54-UI-SPEC accept body text of 12, 14, 16 and 20 px with weights 400 and 600: lead becomes 20/30, prose 16/24, post h2 uses the existing `h4` role (30 px) and h3 `h5` (24 px) exactly as `MuiRichText` does today. Also round gaps to the standard set (4, 8, 16, 24, 32, 48, 64) as 54 did (gaps between 8 and 16 go to 16, between 16 and 24 go to 24). Chip links and nav pills use `minHeight: 40`.

### Pitfall 8: Lessons are absent, not empty
`lessons` is `undefined` or `[]` for all 7 cases. The view must treat both as "no section" with no orphan heading and no overline (D-08). The SSR self-test must cover a fixture with lessons and one without. Do not copy `case-lessons.ts` anywhere, including tests: use invented fixture text.

### Pitfall 9: The click comparison depends on labels, number formats and the migration case
Labels differ by locale (see Pattern 4). Numbers use `,` for thousands (`47,108`), `K` and `M` suffixes (`533K`, `1.25M`), and a non-numeric dash for a missing before (position row). The migration case measures monthly traffic and is out of the comparison; its page must not render the comparison section, and the footnote about it must be a `messages` key (UI label, not editorial copy). Ranking by percentage excludes cases with `before` 0.

### Pitfall 10: Websites data quirks
One full-page screenshot per site (heights up to 10879): render in the 16:10 frame with `object-fit: cover; object-position: top` and explicit `width` and `height`, not `fill` with unbounded height. `juan-tech-com` has no `client` (no domain) and null scores; the Lighthouse section must not claim "PageSpeed Insights en movil" (the device is not stored); show the date from `lighthouseCapturedAt` formatted in the page locale in UTC, as `Sites.tsx` already does. The sandbox third kind "Astro" has no Payload counterpart.

### Pitfall 11: `getCachedArchive` sorts by a field that does not exist for cases and websites
[VERIFIED: src/lib/cache.ts:437 and :447 `sort: '-publishedAt'` for `case-studies` and `websites`; neither collection has `publishedAt`]. Do not route the new fetchers through it; use `sort: '-createdAt'`. Fixing the old function is optional and out of scope.

### Pitfall 12: Hooks do not cross processes
See Pattern 3. Do not write a verification that edits production data to prove revalidation.

### Pitfall 13: ISR and `force-dynamic` choices are load-bearing
Keep `revalidate = 60` plus empty `generateStaticParams` on cases, websites and authors (the build container has no database access), and `force-dynamic` on `/blog` and on the post route because they read `searchParams`. Making them ISR returns 500.

### Pitfall 14: Routing behavior hidden in the old route files
Preserve: `legacyPostRedirectPath` in `blog/[category]/page.tsx` (a non-category segment that is a post slug 308s to the post), the primary-category `permanentRedirect` in the post route, `/blog/general` rendering an empty category with 200, and `next.config.mjs` `/categories` redirects (untouched). `55-post-contract` must request one legacy URL and one non-primary category URL and expect 308 with the right `Location`.

### Pitfall 15: The sitemap lists 41 EN posts, not 58
[VERIFIED: live `sitemap.xml` has 58 ES post URLs and 41 EN post URLs; `EN_TRANSLATION_INCOMPLETE` has 17 slugs, translation-gaps.ts:29]. The 17 incomplete EN posts answer 200 but are `noindex` and omitted from the sitemap and from hreflang. D-32 says "58 posts in EN and ES return 200": derive the EN URL list by prefixing `/en` to each ES URL, never from the EN sitemap entries. For the 17, the contract expects 200, `noindex, follow` and no `hreflang=en` on the ES page.

### Pitfall 16: Dashes and punctuation in data
Sector strings contain a long dash between sector and subsector (use `formatSector`). Metric labels also contain a long dash in some rows (for example position rows); they are content rendered in an `h3` or table cell. Rendering them verbatim keeps parity with production; rewriting would be new editorial treatment. Default: verbatim, and mention it to Juan (Open Question 7). Interface strings in `messages` must have no dashes (the 54 parity script enforces it).

### Pitfall 17: RSC boundary
Every new `'use client'` view imports `NextLink` and `linkFor` itself; Server Components pass only serializable data. Keep `54-rsc-boundary.mjs` in the 55 selftests.

### Pitfall 18: Duplicate ids
`FaqAccordion` and `Toc` had duplicate-id bugs fixed in 54 (MUI sets the region id from `aria-controls`; do not repeat it on `AccordionDetails`). New accordions (mobile TOC reuses `Toc`) must follow it. D-32 requires unique ids: add a unique-id check to `55-post-contract`.

### Pitfall 19: Affiliate disclosure and `rel`
D-20 keeps `rel="sponsored nofollow noopener"` (the value `AffiliateLink` fixes). The MUI affiliate card must reuse `AffiliateLink` and `resolveAffiliateCta` (3 states: active, pending, none), and the disclosure must appear in the DOM before the first affiliate link (`postHasAffiliateInline(doc.content)` over the whole content, not over the split halves). Only 1 post per locale has the inline block today, so the verification is a fixture test plus one live assertion on that post.

### Pitfall 20: Preview behaviors that must stay inert
Email capture: `subscribeToLeadMagnetAction` already short-circuits to `?subscribed=pending` under `isPreviewReadonly()` [VERIFIED: src/app/actions/subscribe-lead-magnet.tsx:97-99]. Keep the form posting to the same action with the same field names: `postPath`, `locale`, `email`, honeypot `company_website` [VERIFIED: EmailCaptureBlock/Component.tsx:83-110]. The blog index newsletter block uses `subscribeAction` through a client `NewsletterForm` with `useActionState`; its field names are `email`, `locale`, `source`, honeypot `company_website`. `53-write-gates.mjs` must stay green.

### Pitfall 21: The Payload CLI reads `.env` by itself
`payload migrate` (and `migrate:create`, `generate:types`) call `loadEnv()` through `@next/env` [VERIFIED: node_modules/payload/dist/bin/loadEnv.js uses `loadEnvConfig(process.cwd(), dev)`; node_modules/payload/dist/bin/index.js:24 `loadEnv()`]. Variables already exported win: `@next/env` only assigns a key when `typeof initialEnv[key] === 'undefined'` [VERIFIED: node_modules/@next/env/dist/index.js `processEnv`]. So `--env-file=.env` is not needed, but if Juan forgets to export `DATABASE_URI` the CLI silently loads the abandoned Neon from `.env`, exactly the 2026-08-17 failure. Mitigation: a mandatory pre-flight in the checkpoint that prints host, port and database from the exported variable and aborts unless it reads `127.0.0.1`, `15432`, `/juantech`.

### Pitfall 22: Preview role on new tables
A7 held for `home_page*` and `about_page*` in 54 (0 `permission denied` in logs) [CITED: 54-16-SUMMARY "Supuesto A7"]. It rests on `ALTER DEFAULT PRIVILEGES FOR ROLE juantech_user` [CITED: 53-06-PLAN.md:140 via 54-RESEARCH Pitfall 3], so it holds only if the migration runs as `juantech_user`. Re-check with the preview role anyway (checkpoint step) and, if it fails, add `GRANT SELECT` on the four tables inside the migration (D-06).

## Code Examples

### Same-origin link classification (extension of the shared primitive)
```tsx
// Source: pattern for src/components/mui/rich-text/MuiRichText.tsx renderLink
const SITE_HOSTS = new Set(['juan-tech.com', 'www.juan-tech.com'])
function isSiteHost(href: string): boolean {
  try { return SITE_HOSTS.has(new URL(href).hostname.toLowerCase()) } catch { return false }
}
// inside renderLink, after `href` is sanitized:
const absolute = /^https?:/i.test(href)
const sameSite = absolute && isSiteHost(href)
const external = (absolute && !sameSite) || Boolean(fields?.newTab)
// sameSite: <Link href={href} underline="always" sx={{ color: 'accentText' }}>{children}</Link>  (no target, no suffix)
```

### Whole-body heading ids shared by TOC and both halves
```tsx
// Source: pattern, built on lexical-toc.ts (extractHeadings, buildHeadingIdMap)
const headings = extractHeadings(doc.content.root, [1, 2, 3])        // h1 collected as level 2
const ids = buildHeadingIdMap(doc.content.root, [1, 2, 3])           // Map<node, id> for the WHOLE body
// body.before and body.after contain the SAME node objects (split slices the children array),
// so one map keyed by node reference is valid for both halves:
<MuiRichText data={body.before} headingIds={ids} converters={converters} />
<InlineOffer ... />
<MuiRichText data={body.after} headingIds={ids} converters={converters} />
<Toc items={headings} label={t('toc.label')} />
```
`splitContentForOffer` builds `{ ...content, root: { ...content.root, children: children.slice(...) } }` [VERIFIED: src/lib/lexical-split.ts], so child node objects are shared by reference; a `Map` keyed by node reference computed over the original root works for both halves.

### Reading progress with the accepted semantics
```tsx
// Source: pattern; sandbox ReadingProgress is aria-hidden, D-19 asks for a progressbar
'use client'
export function ReadingProgress({ targetId, label }: { targetId: string; label: string }) {
  const { paused } = useMotion()   // [VERIFIED: src/theme/motion.tsx:55-63 value is { paused, toggle }]
  const [pct, setPct] = useState(0)
  // update on scroll with requestAnimationFrame; round to an integer to avoid constant DOM churn
  return (
    <Box role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      sx={{ position: 'fixed', top: 0, left: 0, height: 3, width: `${pct}%`, zIndex: 1400, bgcolor: 'primary.main',
            transition: paused ? 'none' : 'width 100ms linear', pointerEvents: 'none' }} />
  )
}
```

### D-26 fallback (home)
```ts
// Source: pattern over src/lib/home-data-b.ts getHomeCases (line ~308) and readHomeSites (~440)
// 1) existing path: mapFeaturedCases(featured.featuredCaseStudies) -> if items.length > 0 return it
// 2) fallback (read only): payload.find({ collection: 'case-studies', locale, sort: '-createdAt',
//      limit: HOME_CASES_MAX, depth: 0, overrideAccess: false,
//      select: { title: true, slug: true, sector: true, heroMetric: true } }) -> mapFeaturedCases(docs)
// Sites: same with collection 'websites', limit HOME_SITES_MAX, SITES_SELECT, then mapWebsite.
// Tag both caches with CACHE_TAGS.caseStudies() / CACHE_TAGS.websites() (they currently tag featuredContent only).
```
`HOME_CASES_MAX = 3` (home-data-b.ts:148 region) and `HOME_SITES_MAX = 5` (home-data-b.ts:412). The section text (`homePage.cases`, `homePage.sites`) is already seeded by 54, so with items the sections render. Expected result in the preview: `id="casos"` with 3 cards and `id="sitios"` with up to 5, in ES and EN.

### `lessons` section, hidden when absent
```tsx
// Source: pattern for the CaseDetail view
{lessons && lessons.length > 0 && (
  <Section id="lecciones" band title={t('lessons.title')}>
    <UL sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0,1fr)', md: `repeat(${Math.min(lessons.length, 3)}, minmax(0,1fr))` } }}>
      {lessons.map((l, i) => (
        <Box key={`${i}-${l.title}`} component="li">{/* h3 title + body paragraph */}</Box>
      ))}
    </UL>
  </Section>
)}
```

## How phase 54 handled shadow content, and what 55 does instead

54 added private globals (`home-page`, `about-page`) without `access.read` (public API answers 403), seeded them by scripts with dry-run, `--apply --db-checked` and `assertSafeTarget`, and never overwrote an existing production field; copy that differed from production lived only in new fields. Phase 55 needs no shadow globals: every field it renders already exists in production and it writes no content. The only new field is `lessons`, which master ignores, and per D-10 is left empty. The EN copy of the 54 shadow sections is still Spanish by fallback (54-16 "Gaps abiertos" item 1), a content item for 56, not for 55.

## Human-action checkpoint (format of plan 54-07, adapted)

54-07 structure to copy [CITED: 54-07-PLAN.md Task 2]: `<task type="checkpoint:human-action" gate="blocking-human">` with `<reversibility rating="costly">`, `<action>`, numbered `<instructions>` split between "Terminal A (tunnel, stays open)" and "Terminal B (repo root)", a `<verification>` listing exactly which pasted outputs Claude reads, and a `<resume-signal>` ("Escribe 'aplicado' y pega la salida de los pasos ..."). `user_setup` lists the tunnel service. Claude never opens the relay or the SSH tunnel (the classifier blocks it).

Phase 55 version (one migration, no seeds, no media, no logos):
1. Terminal A: `./scripts/db/tunnel.sh` (leave open).
2. Terminal B: export without writing to a file: `export DATABASE_URI="postgresql://juantech_user:<key printed by the tunnel>@127.0.0.1:15432/juantech?sslmode=disable"` and `export PAYLOAD_SECRET=migrate-only`.
3. **Pre-flight (new, Pitfall 21):** `node -e "const u=new URL(process.env.DATABASE_URI);console.log(u.hostname,u.port,u.pathname)"` must print `127.0.0.1 15432 /juantech`; otherwise stop.
4. `node_modules/.bin/tsx scripts/db/04-which-database.ts` (no `--env-file`); paste the output (it prints host, port and name, never credentials, and compares witness values with the live site). Stop if the host is not the tunnel.
5. Read the migration: `sed -n '1,120p' src/migrations/*phase55_case_lessons.ts`; confirm only the four `lessons` tables.
6. `node_modules/.bin/payload migrate`; the output must list only `phase55_case_lessons` as run.
7. `node_modules/.bin/tsx scripts/db/24-phase55-verify-schema.ts` with the owner role (reads `case-studies` with `select: { lessons: true }` in both locales and `fallbackLocale: false`; expects schema present, zero rows is valid).
8. Same script with `DATABASE_URI` pointing at `juantech_preview_ro` (password from `~/.config/juantech/preview.env`); must print PASS with no `permission denied` [CITED: 54-07 step 11].
9. Ctrl-C in terminal A.
Claude's verification reads only: step 3 and 4 output, step 6 list, steps 7 and 8 PASS lines. Without them no push.

After the checkpoint Claude pushes `feat/mui-redesign` (only that branch), waits with `BASE_URL=https://dev.juan-tech.com node scripts/verify/54-notfound-status.mjs --wait`, then runs the live battery. If this machine fails with `ENOTFOUND dev.juan-tech.com` use the session `dnsfix.cjs` through `NODE_OPTIONS="--require <scratchpad>/dnsfix.cjs"` (not versioned) [CITED: 54-16 plan notes].

## Suggested partition and order (planner may adjust)

| Wave | Plan | Content | Autonomous |
|---|---|---|---|
| 1 | 55-01 (tracer) | Verification skeleton (`55-run-all.mjs`, `55-no-sandbox-data.mjs`, `55-messages-parity.mjs`, `55-migration-additive.mjs`, selftests), IN-08 and IN-09 in primitives, messages namespaces (`cases`, `websites`, `blog`, `post`, `authors`), **Websites index end to end** (data function, cached read, view, `55-websites-ssr.ts`, build) | yes |
| 1 | 55-02 | `lessons` field, `migrate:create`, guard, types, `24-phase55-verify-schema.ts` with `assertSafeTarget` (IN-06a) | yes |
| 1 | 55-03 | Tags and hooks for Websites, Authors, SpeakingEvents; retag author reads; IN-07; `55-cache-tags.ts` | yes |
| 2 | 55-04 | **Checkpoint**: apply migration, verify with both roles | no (Juan) |
| 2 | 55-05 | Shared primitives: `MuiRichText` extensions (same-site links, `headingIds`, converters ctx, h1 as level 2, reserved ids), `ScrollRegion`, MUI block re-skins (code, FAQ, affiliate, email capture, tables), `BeforeAfter`, `Frames`, `PostCard`, `ReadingProgress` | yes |
| 3 | 55-06 | Websites detail (index done in 55-01) | yes |
| 3 | 55-07 | Cases index and detail, comparison, `lessons` rendering | yes |
| 3 | 55-08 | Blog index, category, search island, newsletter block | yes |
| 3 | 55-09 | Post page | yes |
| 3 | 55-10 | Authors index and profile | yes |
| 3 | 55-11 | Home fallback D-26 | yes |
| 4 | 55-12 | Live scripts (`55-post-contract`, `55-seo-parity`, `55-content-parity`, `55-blog-search`), push, wait, live battery, fixes | yes (after 55-04) |

All Wave 3 plans commit locally; there is a single push, after 55-04 (Pitfall 2 of phase 54: code that reads an unmigrated table breaks every case study page for the SELECT-only role).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Post TOC scans the DOM after mount (`TableOfContentsBlock`) | TOC and ids from the Lexical tree (`lexical-toc.ts`) | Phase 54 | Anchors exist in the server HTML; production heading tags have no `id` today (seen in live HTML), so all anchors are new |
| Tailwind blocks in posts (`CodeBlockNode`, `FaqBlockNode`, `AffiliateInlineCard`, `EmailCaptureCard`) | MUI re-skins over the same converters | This phase (D-16) | Required before phase 57 removes Tailwind |
| Result bar chart (`CaseStudyResultsChart`) | `BeforeAfter` with text and table alternative | This phase (D-12) | |

**Deprecated/outdated (stay until phase 57):** `RichTextRenderer`, `PostCard`, `CaseStudyCard`, `WebsiteCard`, `AuthorCard`, `AuthorByline`, `BlogCategoryTabs`, `CategoryBridge`, `InlineOffer`, `RailOffer`, `BlogClosing`, `AffiliateDisclosureFrame`, `ReadingProgress` (old), the verifiers `scripts/verify-stack-*.ts`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `migrate:create` with fake build variables generates only the four `lessons` tables with no drift from the last snapshot | Schema change | Guard `55-migration-additive.mjs` would FAIL and stop the plan; no data risk |
| A2 | The preview role reads the four new tables without a manual GRANT (extends 54's A7, which held for `home_page*`) | Pitfall 22 | Preview 500 on every case page; checkpoint step 8 detects it before the push |
| A3 | A save of a case in the production (`master`) admin does not delete `lessons` rows it does not know about | Runtime State Inventory | After phase 56 loads lessons, an edit in the master admin before cutover could drop them; consider doing the 56 load right at cutover |
| A4 | Showing `TranslationNotice` on EN posts in `EN_TRANSLATION_INCOMPLETE` is the right reading of D-31 | Open Questions | Notice text says the page is Spanish; for 22 percent translations (partial EN) it is slightly inaccurate |
| A5 | The 17-slug list is current; posts translated since 2026-08-25 may no longer need the notice | Pitfall 15 | A stale entry keeps a translated post `noindex`; unchanged behavior, so no regression |
| A6 | For `juan-tech-com` (no client) deriving the domain from the slug (`juan-tech-com` to `juan-tech.com`) is acceptable | Data Map, Websites | A wrong domain in the frame bar and the visit link; mitigated by hiding the link when no safe domain exists |
| A7 | Lighthouse device is unknown, so the caption must omit "mobile" | Data Map, Websites | If Juan confirms mobile, add it back |
| A8 | Throttling `aria-valuenow` to integer percent is enough to avoid screen reader noise | Code Examples | Minor; progressbar role does not announce without focus |
| A9 | `ScrollRegion` with overflow detection satisfies A11Y.md section 6 | Pitfall 6 | A scrollable region without keyboard access (SC 2.1.1) or an unneeded tab stop |
| A10 | `@next/env` precedence (exported over `.env`) holds for the installed version | Pitfall 21 | [VERIFIED in source, listed here only because the pre-flight still guards it] |
| A11 | The sandbox's single-closing intent maps to the existing `BlogClosing` copy for blog surfaces | Open Question 1 | Two stacked closings or lost indexable copy |
| A12 | `general` category needs an icon fallback because the sandbox maps only four slugs | Data Map | Missing icon or a throw on `categoryIcon['general']` |
| A13 | A rewrite of same-site absolute links to relative paths in the preview is optional | Open Question 3 | Reviewers leave the preview when clicking body links |

## Open Questions

1. **One closing or two on blog surfaces?**
   - What we know: production ends index, category and post with `BlogClosing` (copy from the `blog-promo` global, plus inline and rail offers inside posts); the sandbox ends with `CtaSection` using copy that is not in Payload.
   - What is unclear: whether Juan wants the generic `CtaSection` as well.
   - Recommendation: one closing, the MUI re-skin of `BlogClosing` fed by `getCachedBlogPromo` and `resolveBlogPromo` (existing copy, keeps indexable text), and keep the inline offer and the desktop rail card as MUI components. Use `CtaSection` on cases, websites and authors as in the sandbox.
2. **`lessons` shape.** D-10 says "array of text"; recommended `{ title, body }` to match the approved design. Confirm during review; changing later costs another migration.
3. **Same-site absolute links in the preview.** Keep hrefs identical to production (links go to `juan-tech.com`) or rewrite to relative only while `isPreviewReadonly()`. Recommendation: keep identical for parity, and tell Juan.
4. **Authors profile design.** No sandbox sections for experience, education, expertise and events. Recommendation: reuse the `AboutView` timeline and chips, no new design language; the UI-SPEC is skipped by decision, so list the composition in the plan.
5. **Eyebrows and leads from the sandbox** that are not in Payload ("Resultados reales", "Quien escribe", "Proyecto destacado" and similar). D-28 forbids new editorial copy. Recommendation: omit eyebrows that have no current-site equivalent, keep existing route copy (case index lead, websites description) and move any label that stays to `messages` with an EN version flagged for Juan's approval, as 54 did.
6. **Blog index h1.** Use the h1 of the Pages doc (`Blog`) and its subtitle, not the sandbox heading, to keep the current h1 text. Note for the phase 57 parity gate.
7. **Long dashes inside metric labels.** Keep verbatim (parity) or normalize like `sector`? Recommendation: verbatim, report to Juan.
8. **EN content for new UI labels.** All new `messages` keys need ES and EN; the EN is a planner translation pending Juan's approval (same note as 54-16 "Para Juan").
9. **PAG-01 closure.** D-26 fixes the technical cause; REQUIREMENTS still lists PAG-01 as pending from 54. Recommendation: the live battery asserts `id="casos"` and `id="sitios"` on `/` and `/en`, then the verifier or orchestrator closes PAG-01.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | scripts, build | yes | v24.13.0 | none |
| `tsx`, `payload` CLI | selftests, migrate | yes | `node_modules/.bin` (both present) | none |
| Playwright Chromium | search and progressbar checks | yes | `chromium_headless_shell-1208` and `-1234` in `~/Library/Caches/ms-playwright` | `curl` contracts only |
| Preview `dev.juan-tech.com` | live battery | yes | `/blog` answers 200 with `x-robots-tag: noindex, nofollow`; case, website, author and two post URLs return 200 today (old Tailwind pages) | none |
| Production `juan-tech.com` | parity and public API | yes | anonymous API answers | none |
| Tunnel to `shared-postgres` | migration and schema check | not probed (Juan runs it) | `./scripts/db/tunnel.sh` | none: no tunnel, no migration, no push |
| Dokploy `juantech-preview` | deploy | yes (auto on push, about 7 min) | n/a | none |

**Missing dependencies with no fallback:** the tunnel (manual step by Juan).

## Validation Architecture

Skipped by decision: `workflow.nyquist_validation` is `false` in `.planning/config.json` [VERIFIED]. Brief verification-script map (names fixed by D-32; pattern of the 54 battery: ESM, print `PASS` or `FAIL reason`, exit 1 on any FAIL, `--selftest` with valid and defective fixtures, count with global regexes):

| Script | Covers | Type |
|---|---|---|
| `55-run-all.mjs` (`--selftests`, `--live`) | Orchestrator; `--live` also runs the whole 54 live battery as regression | runner |
| `55-no-sandbox-data.mjs` | 54 audit plus: no sandbox lesson titles or case slugs as literals in `src/`; live: no `id="lecciones-t"` in preview case pages | static |
| `55-messages-parity.mjs` | imports `REVIEWED` from `54-messages-parity.mjs`, adds the new namespaces, same rules (no dashes, no `{{`, ICU vars, headings without period or comma) | static |
| `55-migration-additive.mjs` | allow-list of the 4 `lessons` tables; rejects DROP, TRUNCATE, DELETE, RENAME, ALTER TYPE | static |
| `55-cache-tags.ts` | hooks present on the six collections; fetcher tags produced by `CACHE_TAGS` | static |
| `55-cases-ssr.ts` | case view fixtures: no lessons, lessons, migration case, comparison rank and table caption and scopes, no orphan heading | SSR |
| `55-websites-ssr.ts` | one screenshot without phone frame, null scores hidden, domain absent or present, `rel="noopener"` | SSR |
| `55-blog-ssr.ts` | index shows 6 per category with real links, search filter count in a status region, category page lists all, empty `general` | SSR |
| `55-post-ssr.ts` | TOC hrefs resolve, unique ids, progressbar attributes, code, FAQ, affiliate (disclosure before first link, `rel`), email capture form fields, same-site links stay in tab | SSR |
| `55-authors-ssr.ts` | sections present when data exists, timeline as list, all posts rendered | SSR |
| `55-home-fallback-ssr.ts` | pure fallback selection when featured is empty | SSR |
| `55-post-contract.mjs` | 58 posts x 2 locales (EN URLs derived from ES): 200, one h1, no downward jumps, unique ids, TOC anchors resolve, `noindex, follow` for the 17 incomplete EN, 308 for a legacy and a non-primary category URL | HTML |
| `55-seo-parity.mjs` | all 55-surface URLs: title, description, canonical, hreflang, `og:*`, `twitter:*`, robots meta and full JSON-LD deep equality (not only types, unlike 54) against `PROD_BASE` | HTML |
| `55-content-parity.mjs` | per post: visible word count not below production, h2 and h3 counts, code block and FAQ counts, internal link set (origin and leading `/en` stripped) | HTML |
| `55-blog-search.mjs` | Playwright: typing updates the status count, Enter without JS reaches `/search?q=`, keyboard only | browser |
| `scripts/db/24-phase55-verify-schema.ts` | read-only schema check; calls `assertSafeTarget(DATABASE_URI, false, false)` first (IN-06a) | DB read |
| reused | `53-crawl-parity`, `54-notfound-status`, `54-rsc-boundary`, `53-shell-contract`, `53-computed-styles`, `53-write-gates`, `53-layer-check`, `54-page-contract` helpers | various |

Human checks stay consolidated in the phase 57 gate (screen readers, visual review at 375, 900, 1024 and 1280 px with 200 percent zoom, admin-to-preview revalidation) [CITED: 54-VERIFICATION.md].

## Security Domain

`security_enforcement` is enabled (absent means enabled), ASVS level 1, block on high.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No login in these pages; admin stays blocked in the preview |
| V3 Session Management | no | No new sessions |
| V4 Access Control | yes | `overrideAccess: false` and `select` on every collection read; `lessons` inherits the collection rule `authenticatedOrPublished`; preview role SELECT only; no new public API surface |
| V5 Input Validation | yes | `sanitizeHref` for CMS-authored hrefs; `hostnameOf` restricts website links to http and https and the link is rebuilt from the hostname; search is a client filter (React escapes); `q` handled by the existing `/search` route |
| V6 Cryptography | no | None |
| V10 / V14 Config and malicious code | yes | No new packages; migration guard; `assertSafeTarget` on every DB script; no `dangerouslySetInnerHTML` outside `JsonLd` |

### Known Threat Patterns for Next + Payload + MUI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Draft leak through unauthenticated Local API read (index pages read without `overrideAccess: false` today) | Information disclosure | `overrideAccess: false` on all new fetchers, as in SEO-40 |
| `javascript:` or control-character hrefs from Lexical links or website URLs | Tampering / XSS | `sanitizeHref`, `hostnameOf`, `rel="noopener"` on external anchors |
| `</script>` injection through JSON-LD | Tampering | existing `JsonLd` component, never hand-build `<script>` |
| Open redirect | Spoofing | affiliate `/go/<slug>` untouched; redirects resolved only from admin-authored `redirects` docs |
| Writing to the wrong database (abandoned Neon) | Tampering | `04-which-database.ts`, pre-flight host print, `assertSafeTarget`, no `.env` reliance |
| Destructive or drifted migration | Tampering | `55-migration-additive.mjs`, SQL read before apply, additive only |
| Cache poisoning of a draft by `unstable_cache` | Information disclosure | `overrideAccess: false` inside the cached function |
| Preview writes (email capture, `/go` clicks) | Tampering | `PREVIEW_READONLY` gates already in actions and routes; `53-write-gates.mjs` |

## Sources

### Primary (HIGH confidence)
- Code read this session: `src/collections/{CaseStudies,Websites,Authors,Posts,Categories,SpeakingEvents}`, `src/lib/{cache,cache-tags,home-data-b,person,cta-data,about-data,service-view-data,blog-paths,blog-promo,lexical-split,reading-time,translation-gaps,breadcrumbs,canonical,placeholder,nav-links}.ts`, `src/components/mui/{PageHero,Section,lists,links,Crumbs,TranslationNotice,CaseMetricCard,ScoreRing,TechChips,CtaSection,split-hero-metric}` and `rich-text/{MuiRichText,Toc,RichTextLink,lexical-toc}`, `src/components/richTextBlockConverters.tsx`, `AffiliateInlineCard`, `BlogClosing`, `CategoryBridge`, `BlogCategoryTabs`, `InlineOffer`, `RailOffer`, `blocks/{BlogCategoryRows,EmailCaptureBlock,NewsletterBlock,RelatedPosts,TestimonialSection,TableOfContentsBlock}`, `src/app/(frontend)/[locale]/{case-studies,websites,blog,authors}` routes, `src/app/actions/subscribe-lead-magnet.tsx`, `scripts/verify/{54-run-all,54-page-contract,54-migration-additive,54-no-sandbox-data,54-messages-parity,54-ssr-harness,54-about-ssr,54-richtext-toc,54-rsc-boundary,53-crawl-parity}`, `scripts/db/{04-which-database,23-phase54-verify-schema,tunnel.sh}`, `scripts/db/data/54-seed-lib.ts`, `src/migrations/*`.
- Sandbox read: `designs/design-system-mui/src/components/{site,blog}/*`, `src/data/{cases,case-lessons,websites,blog/index}.ts`, `A11Y-DECISIONS.md`.
- Phase artifacts: `55-CONTEXT.md`, `55-DISCUSSION-LOG.md`, ROADMAP, REQUIREMENTS, STATE, `54-CONTEXT`, `54-RESEARCH`, `54-UI-SPEC` (typography and spacing), `54-07-PLAN` (checkpoint format), `54-16-SUMMARY` (A7, battery), `54-REVIEW` (IN-01 to IN-09), `54-REVIEW-FIX`, `54-VERIFICATION`, `deferred-items`.
- Live anonymous read-only measurements 2026-11-08: `https://juan-tech.com/api/{case-studies,websites,posts,categories,pages,authors,speaking-events}`, `/sitemap.xml`, post HTML of `/blog/tech-seo/guia-google-search-console`, `https://dev.juan-tech.com` status and robots header, scripted corpus analysis (scratchpad `analyze.mjs`, `jumps.mjs`, `cases.mjs`).
- `node_modules/payload/dist/bin/{loadEnv,index}.js`, `node_modules/@next/env/dist/index.js` (env precedence).

### Secondary (MEDIUM confidence)
- A11Y.md (`https://raw.githubusercontent.com/fecarrico/A11Y.md/main/docs/en/A11Y.md`), overview only: the scroll-region, label and touch target rules cited above; per-component guides are not included in that page.
- Project memory (trampas de scripts, incidente de base equivocada, acceso a produccion).

### Tertiary (LOW confidence)
- None from web search. Context7 was not queried: no library behavior outside already-read code and installed packages was needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, nothing new, versions read from `package.json`.
- Schema change and migration procedure: HIGH for shape (pattern verified against existing array tables), MEDIUM for role privileges (A2).
- Architecture and rich-text pitfalls: HIGH, each backed by a read line range or a measurement.
- Verification map: HIGH, extends scripts that exist and pass.
- Open design questions (closing, authors composition, eyebrows): MEDIUM, they need Juan or planner judgment.

**Research date:** 2026-11-08
**Valid until:** 2026-11-22 (live corpus counts and the 17-slug translation list change with Juan's content work; re-measure the posts if more than two weeks pass)
