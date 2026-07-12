---
gsd_state_version: 1.0
milestone: none (awaiting next milestone)
milestone_name: none
status: v1.3 (Hero Grainy Gradient Animation) CLOSED 2026-07-12. 6/6 requirements verified live by v1.3-MILESTONE-AUDIT.md, 0 blocking gaps. Awaiting Juan's definition of the next milestone.
stopped_at: v1.3 milestone completed (Phases 16-17, 6/6 requirements). No active milestone. Phase 6 (Deploy + Cutover) remains the sole open project-wide item, paused pending real Hostinger/DNS/Resend credentials. See .planning/MILESTONES.md for the closure record.
last_updated: "2026-07-12T06:00:00.000Z"
last_activity: "2026-07-12 — v1.3 milestone completed: MILESTONES.md updated with full closure summary (incl. live design iteration wave→ripple→blob, mouse-reactivity added then removed, a mid-session process note about a corrected mis-flagged user preference), PROJECT.md updated (v1.3 moved to Milestone Anterior, HERO-ANIM-01..06 moved to Validated, Phase 6 confirmed as sole open item), ROADMAP.md marked v1.3 CLOSED, STATE.md reset to awaiting-next-milestone position."
progress:
  total_phases: 17
  completed_phases: 17
  total_plans: 73
  completed_plans: 69
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-09)

**Core value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en contenido como en ejecución técnica (rendimiento y SEO impecables).
**Current focus:** Ningún milestone activo. v1.3 (Hero Grainy Gradient Animation) cerrado 2026-07-12 con 6/6 requirements verificados en vivo (`.planning/v1.3-MILESTONE-AUDIT.md`, 0 gaps bloqueantes) — ver `.planning/MILESTONES.md` para el resumen completo de cierre. v1.1 y v1.2 también cerrados. El único ítem abierto a nivel de proyecto es **Phase 6 (Deploy + Cutover)**, en pausa, retoma cuando Juan confirme con credenciales reales de Hostinger/DNS/Resend. Awaiting Juan's definition of the next milestone — not started.

## Current Position

Phase: Not started (no active milestone)
Plan: —
Status: v1.1, v1.2, v1.3 all closed. Awaiting Juan's definition of the next milestone. Phase 6 (Deploy + Cutover) remains the sole open project-wide item, paused.
Last activity: 2026-07-12 — v1.3 milestone completed (Phases 16-17, 6/6 requirements verified live)

## Performance Metrics

**Velocity:**

- Total plans completed: 15
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 10 | - | - |
| 02 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 12 | 2 tasks | 8 files |
| Phase 01-schema-foundation P07 | 12min | 1 tasks | 1 files |
| Phase 01-schema-foundation P08 | 6min | 1 tasks | 1 files |
| Phase 01-schema-foundation P09 | 6min | 2 tasks | 9 files |
| Phase 01-schema-foundation P10 | 5min | 2 tasks | 3 files |
| Phase 02-biling-e-seo P05 | 25min | 2 tasks | 3 files |
| Phase 04-migraci-n-mongo-postgres P01 | 45min | 3 tasks | 9 files |
| Phase 04-migraci-n-mongo-postgres P02 | 15min | 1 tasks | 1 files |
| Phase 04-migraci-n-mongo-postgres P03 | 15min | 1 tasks | 1 files |
| Phase 04-migraci-n-mongo-postgres P04 | 10min | 1 tasks | 1 files |
| Phase 04-migraci-n-mongo-postgres P05 | 35min | 2 tasks | 1 files |
| Phase 04-migraci-n-mongo-postgres P06 | 5min | 1 tasks | 1 files |
| Phase 04-migraci-n-mongo-postgres P07 | 10min | 2 tasks | 2 files |
| Phase 04-migraci-n-mongo-postgres P08 | 10min | 2 tasks | 2 files |
| Phase 07 P01 | 12min | 3 tasks | 3 files |
| Phase 08 P01 | 15min | 2 tasks | 12 files |
| Phase 08 P02 | 20min | 2 tasks | 3 files |
| Phase 09 P01 | 15min | 2 tasks | 2 files |
| Phase 09 P02 | 12min | 2 tasks | 2 files |
| Phase 09 P03 | 10min | 2 tasks | 2 files |
| Phase 10.5 P01 | 15min | 3 tasks | 26 files |
| Phase 10.6 P01 | 15min | 2 tasks | 1 files |
| Phase 10.6 P02 | 20min | 2 tasks | 1 files |
| Phase 13 P01 | 15min | 3 tasks | 8 files |
| Phase 13 P02 | 35min | 2 tasks | 5 files |
| Phase 14 P01 | 6min | 3 tasks | 7 files |
| Phase 15 P01 | 15min | 2 tasks | 4 files |
| Phase 15 P02 | 40min | 2 tasks | 2 files |
| Phase 16 P01 | 4min | 2 tasks | 2 files |
| Phase 16 P02 | 25min | 2 tasks | 2 files |
| Phase 16 P03 | 20min | 2 tasks | 2 files |
| Phase 17 P01 | 20min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Milestone v1.2]: Roadmap: 4 fases (12-15) derivadas de los 18 requirements v1.2, continuando la numeración desde Phase 11 (Phase 6 sigue en pausa, sin re-numerar). Phase 12 (Author E-E-A-T) primero por ser el trabajo de mayor superficie (schema + 3 secciones UI + JSON-LD); Phase 13 agrupa las dos poblaciones de contenido de Home (AboutSection features+CTA y FAQ) por ser del mismo tipo de trabajo; Phase 14 (targetKeyword) y Phase 15 (sitemap XSL/HTML) quedan como fases técnicas compactas independientes, sin dependencia real entre sí más allá del orden secuencial de ejecución. v1.2 corre en paralelo a Phase 6 (Deploy + Cutover, en pausa), sin bloquearlo ni depender de su cierre.
- Roadmap: Estructura de 6 fases en capas horizontales (Schema → Bilingüe/SEO → Cloudinary spike → Migración → Frontend → Deploy), siguiendo la propuesta de research/SUMMARY.md sin modificaciones
- Roadmap: Phase 4 (Migración) depende de Phase 2 y Phase 3 juntas — la migración no puede empezar hasta que i18n y storage estén resueltos, para no reescribir contenido migrado después
- [Phase ?]: next pinned to 15.4.11 (not 15.5.20) because @payloadcms/next@3.85.2 peerDependencies exclude the entire 15.5.x line — Discovered during 01-01 npm install; 15.4.11 is the highest version satisfying the actual peer range while staying on Next 15
- [Phase 01]: .gitignore left unchanged — pre-existing .planning/CLAUDE.md paths already tracked in git, adding them would break future commit workflow
- [Phase 01-schema-foundation]: 01-07: Followed plan interfaces template verbatim for Pages collection (individual block imports, no barrel re-export); SEO tab fields deferred entirely to plugin-seo tabbedUI in Wave 4
- [Phase ?]: push:false hard-coded como literal boolean en postgresAdapter (payload.config.ts) — nunca condicional, per RESEARCH.md Pitfall 3
- [Phase ?]: resendAdapter wired en payload.config.ts desde el día uno, aunque el uso del formulario de contacto es scope de Fase 5
- [Phase ?]: [Phase 01-schema-foundation]: 01-09: .env already existed (provisioned by orchestrator with real Neon/Cloudinary/PAYLOAD_SECRET) — left untouched per revised plan; proceeded directly to payload generate:importmap / generate:types CLI commands
- [Phase ?]: [Phase 01-schema-foundation]: 01-10: .env already had a valid Neon UNPOOLED DATABASE_URI provisioned pre-planning — Task 1 checkpoint resolved automatically via grep verification, no human interruption needed; initial migration generated and applied cleanly against live Neon Postgres
- [Phase 04]: 04-01: dump-source.ts patches an in-memory kv adapter onto the imported JuanPortfolio config to bridge a cross-version payload gap (their config sanitized by payload 3.61.1, our runtime is 3.85, which requires `config.kv`)
- [Phase 04]: 04-01: URL-INVENTORY.json derived from the real dump + source-code sitemap logic instead of a live HTTP fetch, because juan-tech.com (Vercel) returned DEPLOYMENT_DISABLED (402) for every route at freeze time
- [Phase 04]: 04-01: real source DB confirmed empty for case-studies (0) and works (0) via direct Local API query — waves 6/7 will have nothing to migrate/audit; 4 of 15 media docs lack cloudinaryUrl and their only fallback source (juan-tech.com) is currently unreachable
- [Phase ?]: Juan confirmed explicitly to close the works-audit checkpoint with 0 Works processed / 0 CaseStudies created from fold-in -- real production Works collection has 0 documents
- [Phase ?]: Phase 4 verification (04-VERIFICATION.md): 0 URL deltas, 0 redirects needed -- verbatim-slug pipeline held across all 7 migrated collections; independent verifier confirmed 4/15 media assets lost to external juan-tech.com DEPLOYMENT_DISABLED are NOT referenced by any migrated document (orphaned assets, zero content impact)
- [Phase 04]: Juan confirmed accepting the 4/15 media loss permanently ("no veo problema con eso, esas imágenes creo que igual no las vamos a usar") -- no backup sourcing needed
- [Phase 04]: 0/73 real posts had heroImage in the source by original design, not a migration gap -- JuanPortfolio's PostHero computes a deterministic per-slug fallback at render time against 53 pre-existing Cloudinary images (portfolio/fallback-image-1..53, verified reachable); Phase 5 must replicate this fallback pattern client-side, not backfill heroImage in the DB
- [Phase 05]: 05-01: shadcn@2.10.0 CLI pinned explicitly (not `npx shadcn@latest`, which resolves to a redesigned 4.x CLI with an incompatible Nova/Vega preset system) to honor the UI-SPEC's locked new-york/neutral/CSS-vars preset
- [Phase 05]: 05-09: CaseStudies had no `author` relationship (a real data-model gap) — added directly rather than a checkpoint:decision, since the plan itself recommended this and exactly 1 real Author exists to backfill against
- [Phase 05]: 05-12: found and fixed a real, sitewide bilingual-content bug — Content block's `richText` field was missing `localized: true`, and 4 seed scripts (home/blog/contact/legal-pages) regenerated block/array ids on every locale's update, silently orphaning the previous locale's localized data (Hero title/subtitle, ArchiveBlock emptyState copy, Content richText). Both root causes fixed; all 5 affected pages re-verified correct in both locales against the real running server.
- [Phase ?]: [Phase 05] 05-13: bilingual QA walkthrough completed directly by Juan against real dev server + real Neon Postgres data; all 10 checklist items verified (2 with explicitly logged, non-blocking caveats: category-tab click-filtering and FeaturedContent admin edit-reload confirmed via code/database-level evidence due to Arc browser click-interaction limitation)
- [Milestone v1.1]: Roadmap: 5 fases (7-11) derivadas directamente de research/SUMMARY.md sin modificaciones estructurales, salvo el explicit deferral de Juan de motion/animación (carruseles, scroll-reveal) y del toggle visible de dark mode — UI-03 queda como corrección de tokens únicamente, sin UI de cambio de tema. Phase 6 (Deploy + Cutover) queda en pausa y no se renumera; retoma después de que Phase 11 cierre.
- [Phase ?]: Fase 7: tokens de sombra/motion + rebrand ember/navy de .dark, WCAG AA verificado (10/10 pares pasan via scripts/check-dark-contrast.ts)
- [Phase 08]: 08-01: los 12 primitivos shadcn migrados de `shadow`/`transition-colors` sin nombre a los tokens con nombre de Fase 7 (shadow-sm/md/lg/focus, duration-fast/base/slow, ease-out/standard); cero nuevas dependencias, cero cambios de API/props
- [Phase 08]: 08-02: SiteHeader/SiteFooter restyled consumiendo los primitivos refinados; smoke check automatizado (scripts/smoke-check-phase8.mjs) confirma 15/16 bloques renderizando sin error, 1 SKIP documentado (ResultsSection, sin CaseStudies reales en la DB — gap de contenido ya confirmado por Juan en Fase 4, no un defecto de código); gate de cero-diff en src/blocks/*/config.ts y payload-types.ts confirmado vacío en toda la fase
- [Phase ?]: Phase 9: Hero overlay contrast verified against all 53 real Cloudinary fallback images plus synthetic white worst case; no opacity adjustment needed
- [Phase ?]: Phase 9: KPI/results metric dominance pattern (tracking-tight tabular-nums value + uppercase tracking-wide opacity-70 label) unified across ResultsSection and case-study detail page
- [Phase ?]: Phase 9: Prose.tsx h2/h3 differentiated via opacity-90 recession on h3 rather than a new size token, since both share the locked text-heading size
- [Phase 10]: 10-01: PostCard/CaseStudyCard/AuthorCard restyled to compose Phase 8's Card/CardContent primitive; AuthorCard's yearsExperience given a headline-stat treatment reusing Phase 9's KPI metric-dominance pattern; AuthorByline left untouched (chromeless by design)
- [Phase 10]: 10-02: guarded seed/verify/cleanup script triad proved repeater min/max boundaries (real data + seeded fixtures where 0 real CaseStudies exist), E-E-A-T prominence in en+es, and ES longest-title rendering; discovered and corrected ArchiveBlock's real limit=12 instance lives on the blog page not the home page; all 7 seeded fixtures cleanly removed; real author (id=1) still needs credentials/yearsExperience/socialLinks populated via /admin — non-blocking content task, flagged in 10-VERIFICATION.md
- [Milestone v1.1 — scope expandido]: Juan rechazó la dirección visual acumulada de Phases 7-10 como insuficiente y pidió: auditoría de componentes vs JuanPortfolio, cierre de gaps genuinos, y contenido real poblado en cualquier bloque nuevo. Roadmap actualizado: Phase 10.5 cierra con alcance reducido a solo UI-15/UI-16 (tipografía + schema Footer, ya completos); se insertan Phase 10.6 (header/footer completion + Playwright mobile verification, UI-17..19), Phase 10.7 (AboutSection + TestimonialSection poblados, UI-20/21) y Phase 10.8 (Hero CTA + breadcrumbs poblados, UI-22/23); Phase 11 pasa a depender también de 10.6/10.7/10.8 y suma UI-24 (disciplina mobile-first) como requirement de verificación cruzada final, en vez de una fase separada
- [Milestone v1.1 — scope expandido]: `CalendlyEmbed` (tercer gap genuino identificado en COMPONENT-GAP-ANALYSIS.md) NO se agrega al roadmap — confianza MEDIA sobre si Juan sigue usando Calendly; queda documentado en REQUIREMENTS.md Out of Scope como candidato v2/insert futuro si se confirma
- [Phase 10.6]: 10.6-01: audit del edit sin commitear de SiteHeader.tsx confirmó que ya cumplía los must_haves de UI-17 (tap targets 44px, Separator, hover states, breakpoints no invertidos); único gap real cerrado fue un `SheetTitle` faltante en el Sheet móvil (Radix Dialog requiere nombre accesible) — sin indicador de página activa (fuera de alcance) ni auto-close del Sheet (aceptado el comportamiento default)
- [Phase 10.6]: 10.6-02: dynamicColumns del footer resuelto vía Local API con filtro `_status: published` explícito (obligatorio porque Local API usa `overrideAccess: true` y no respeta el access control de las colecciones); case-studies ordenado por `-createdAt` (no tiene `publishedAt`); grid mobile-first (`grid-cols-1` en 375px) y jerarquía tipográfica (`font-heading` en títulos de columna)
- [Phase 10.6]: 10.6-03: Playwright confirmado por Juan como paquete oficial Microsoft antes de instalar; `scripts/verify-mobile-viewport.mjs` PASS en los 3 breakpoints contra el dev server real (cero overflow horizontal, SheetTrigger/NavigationMenu mutuamente exclusivos por breakpoint, footer con 3 column headings visibles incluyendo dynamicColumns); Juan dio la confirmación visual final directamente sin requerir walkthrough guiado — Phase 10.6 cerrada 3/3 (UI-17, UI-18, UI-19)
- [Phase 12]: 12-01: expertise/education/experience recovered on Authors collection (certificate upload NOT ported, per CONTEXT.md — no real certificate files available); migration generated via payload migrate:create, applied with push:false respected, payload-types.ts regenerated
- [Phase 12]: 12-02: 3 new author-page sections (Expertise tag cloud, Education card grid, Experience timeline) inserted between AuthorCard and posts/case-studies grids, each conditionally rendered only when its array has data; Person JSON-LD enriched with sameAs/knowsAbout/hasCredential, each conditionally omitted (not empty array) when source is empty
- [Phase 12]: 12-03: real bilingual content seeded via scripts/seed-author-eeat.ts (idempotent, sub-array id reuse across locale writes) — 4 expertise/2 education/2 experience items in ES+EN, 3 socialLinks; avatar verified untouched; re-run confirmed idempotency (no duplicate rows)
- [Phase 12]: 12-04 Task 1: dev server cache found stale (x-nextjs-cache HIT serving pre-seed content) mid-verification — cleared .next and restarted, unrelated to Phase 12 code; scripts/verify-phase12-author-eeat.mjs then reported RESULT: PASS across both locale routes and all 3 breakpoints (375/768/1280), confirming real content + JSON-LD
- [Phase 12]: 12-05 (mid-phase, ad-hoc, Juan's direct request via orchestrator): SpeakingEvents modeled as a NEW standalone Payload collection (`speaking-events`), not an Authors array field, so Juan can keep adding events post-launch without reopening Authors schema; 4th author-page section added after Experiencia, same conditional-render contract; 2 real events seeded (Caracas SEO Fest, Taller SEO+IA en Lima/DinoRANK) with NO invented dates (date field left null per Juan's explicit instruction); added a 3rd `experience[]` item (aprendoclub, "Senior Tech SEO Analyst", ongoing role, startDate/endDate both null, reference URL kept in description text rather than reopening Authors.experience schema for a new link field, per Juan's explicit instruction); a `defaultSort` type error (misplaced under `admin` instead of top-level CollectionConfig) was caught by `tsc` and fixed inline (Rule 1); extended verification script re-confirmed PASS across all 4 sections
- [Phase 13]: 13-01: `IconPickerField` built on `@payloadcms/ui`'s Modal/useField/useModal/FieldLabel instead of shadcn's Dialog — the Payload admin route only imports `@payloadcms/next/css`, not the site's globals.css, so Tailwind/shadcn classes have no effect there; icon values kept camelCase (trendingUp, zap, code, monitor, ...) matching the existing iconMap/socialIconMap convention already used in AuthorCard.tsx; features[]/ctaText/ctaLink added additively to AboutSection (no new block type, per ABOUT-01); migration generated via payload migrate:create and applied, push:false untouched
- [Phase 13]: 13-02: added a `contactFormBlock` to Home's layout (not previously present) reusing scripts/seed-contact-page.ts's exact copy verbatim, closing a gap CONTEXT.md's CTA decision assumed away (`#contact` anchor had nothing to scroll to); each locale's full layout fetched fresh via `findByID({ locale })` inside the seed script to avoid cross-locale content bleed on sibling blocks; discovered during verification that nested sub-arrays (features[]/faqs[]) need the same id-reuse-across-locale-writes discipline as top-level blocks (Payload full-replaces arrays on update) — fixed in the seed script; also fixed a pre-existing Phase 10.7 bug (leftover Spanish AboutSection paragraph on the EN Home page, root cause: `author.bio ?? fallback` evaluated identically regardless of locale in seed-phase10-7-gap-fill.ts) as part of this phase's own bilingual sanity pass
- [Phase 13]: Admin icon-picker (`IconPickerField`) interactive modal not yet visually confirmed by Juan — no admin credentials available to the executor to log in and test the popup grid live. TypeScript compiles clean, importMap.js registers the component, /admin/login loads without a build/runtime crash. Flagged for Juan's quick manual pass.
- [Phase 14]: 14-01: targetKeyword added as a standalone top-level group field (en/es plain text, not localized:true) on Pages and Authors, separate from plugin-seo's meta fields — no SEO tab exists on either collection today, so it's a sibling field, not nested; migration generated via payload migrate:create/migrate, push:false untouched; seed script populated Home + the real Author with the 4 locked picks from KEYWORD-RESEARCH.md, verified directly against the running dev server's /api/pages and /api/authors in both locales. Deviation (Rule 3): fixed a pre-existing es-locale contactInfo.title/value gap on Home's contactFormBlock (empty, required, blocking any update() on the doc) — backfilled to match the en-locale values ("Email"/"hello@juan-tech.com"); worth a quick visual check of the Spanish Home page's contact section.
- [Phase 15]: 15-01: sitemap.ts (native MetadataRoute.Sitemap) replaced by sitemap.xml/route.ts (custom route handler with xml-stylesheet PI) — Next's native convention has no way to emit a processing instruction; query logic ported exactly (5 collections, published-only, ES/EN alternates) into a new shared src/lib/sitemap-data.ts also consumed by 15-02; SITE_URL fallback left unchanged (pre-existing pattern repeated repo-wide) — production correctness depends on NEXT_PUBLIC_SERVER_URL being set correctly in Hostinger
- [Phase 15]: 15-02: sitemap.html route reuses the shared query module, groups by Pages/Blog/Case Studies/Authors/Categories, empty groups omitted. Deviation (Rule 3, explicitly confirmed by Juan before running against the real DB): the ES locale was missing required localized label/title values on EXISTING Footer.legalLinks (Privacy/Terms) and Footer.columns/links (Site/Contact + nested link labels) — same sitewide bilingual data-gap pattern as Phases 5/13/14 (an EN-only write orphaning the shared array). Payload validates the full merged global doc on every updateGlobal, so this blocked the seed's own ES write. Backfilled using the known-correct ES copy already authored in scripts/seed-header-footer-content.ts, preserving existing ids. Found but NOT fixed (out of scope, flagged to Juan): the separate Header global has the same class of bug (navItems ES labels empty) — logged in .planning/phases/15-sitemap-xsl-html/deferred-items.md, high severity (live ES homepage nav has no visible link text), recommend a quick follow-up before v1.2 close.
- [Phase 16]: 16-01: Package-legitimacy checkpoint for @paper-design/shaders-react resolved directly by Juan via prior WebSearch research (real npm package, GrainGradient built for this use case, no squatting signal), not a mid-run interactive prompt
- [Phase 16]: 16-02: reducedMotion state must init to false (SSR-matching) and read matchMedia inside useEffect, not a useState lazy initializer -- React does not patch attribute-level hydration mismatches after the initial commit
- [Phase 16]: 16-03: verification script confirmed 0 failures/0 warnings — shader canvas renders on both locales, no overflow at any breakpoint, copy unchanged, reduced-motion correctly detected; HERO-ANIM-01..04 all closed with real headless-browser evidence
- [Phase 16]: Post-implementation retune: Hero shader went wave -> ripple -> blob (final, per Juan's live preference 'me gusta mas blob que ripple'); mouse reactivity was built, verified working, then explicitly removed per Juan's rejection -- no pointer tracking anywhere in the component or planned elsewhere
- [Phase ?]: [Phase 17] 17-01: Baseline source is Phase 11-03's post-11-02 lh-current.json (pre-shader); regression threshold ~5 Performance points or CWV entering poor lab band per 17-CONTEXT.md -- both /en and /es measured Delta-3, PASS, no regression flagged

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 05 → Phase 06 pre-deploy blocker] `RESEND_API_KEY` in `.env` is still a placeholder/invalid value (confirmed via direct 401 from Resend's API) — real contact-form email delivery cannot be verified or used in production until Juan obtains and sets a real Resend API key. Contact-form logic (validation, honeypot, graceful-failure redirect) verified correct by direct invocation; only the actual send is blocked. Explicit pre-deploy blocker for Phase 6, confirmed still open by 05-13's direct human verification.
- [Phase 05 → Phase 06 follow-up] Author E-E-A-T fields (`credentials[]`, `yearsExperience`, `socialLinks[]`) are correctly modeled and wired end-to-end (confirmed via direct Postgres query) but not populated for the one real migrated author — Juan needs to fill these in via `/admin` before this differentiator is visibly live. Content-population task, not a code gap.
- ~~[Phase 05] 05-13 Task 2 (bilingual QA walkthrough) is a mandatory `checkpoint:human-verify`~~ — RESUELTO 2026-07-10: Juan completed the direct bilingual walkthrough against the real dev server and real Neon Postgres data. All 10 checklist items verified (2 with explicitly logged, non-blocking caveats — see 05-13-SUMMARY.md and 05-VERIFICATION.md). Phase 5 closed 13/13.
- Phase 3 (Cloudinary): adapter custom sobre `@payloadcms/plugin-cloud-storage` es ahora la opción primaria (referencia validada `github.com/Sahitya1707/payload-cloudinary`, target Payload 3.33 → verificar compatibilidad con 3.85 en el spike); paquetes de comunidad quedan como fallback
- Phase 6 (Hostinger): tier real contratado y `max_connections` de Postgres deben confirmarse contra el plan provisto antes de finalizar dimensionamiento de pool
- ~~Phase 1: decisión Works vs Clientes~~ — RESUELTO 2026-07-09: Works se retira (absorbido conceptualmente en CaseStudies enriquecido), Clientes queda como colección propia solo para carrusel de logos (nombre, logo, link)
- ~~Plan 02-05 Task 1 (seed script): permission classifier blocked execution of 'npx tsx scripts/seed-phase2.ts' against the production Neon DB~~ — RESUELTO 2026-07-09: authorization step cleared; per the orchestrator's report the seed ran successfully (idempotency confirmed on re-run) and all 8 end-to-end curl checks passed. Phase 2 closed 5/5.
- [Phase 10.7 pending confirmation] `CalendlyEmbed` no entró al roadmap por confianza MEDIA sobre si Juan sigue usando Calendly — si Juan confirma que sí, se puede insertar como fase adicional (ej. 10.75) más adelante
- [v1.2 → v1.3 backlog, 2026-07-11] Juan pidió reestructurar URLs de blog (`/blog/categoria/slug` para posts, `/blog/categoria-slug` para listados de categoría) + agregar paginación al blog. Explícitamente diferido — cierra v1.2 (Home+Author, blog fuera de scope) primero. Cambio SEO-sensible: requiere estrategia de redirects 301 para no perder el resultado "0 URL deltas" ya verificado en Phase 4 (04-VERIFICATION.md). Candidato a nueva fase (v1.2 extendida o v1.3), no ejecutar ad-hoc.
- ~~[Phase 15, 2026-07-11] Header global (main site nav) tiene el mismo bug de labels ES vacíos ya corregido en Footer durante 15-02~~ — RESUELTO antes del cierre de v1.2: `scripts/fix-header-navitems-es-labels.ts` corrigió `navItems[].link.label` en ES; confirmado en vivo por `.planning/v1.2-MILESTONE-AUDIT.md` ("Blog, Casos de éxito, Autores, Contacto" renderizan con texto ES correcto en `/`).

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-12T05:27:05.767Z
Stopped at: v1.3 milestone (Hero Grainy Gradient Animation) roadmap created — 2 phases (16-17), continuing numbering after v1.2's Phase 15 (Phase 6 Deploy+Cutover stays paused, out of this roadmap). Phase 16 covers HERO-ANIM-01..04 (shader implementation, token colors, copy parity, reduced-motion). Phase 17 covers HERO-ANIM-05..06 (Lighthouse/CWV verification + mobile-first spot-check). Awaiting roadmap approval, then `/gsd:plan-phase 16`.
Resume file: None
</content>
