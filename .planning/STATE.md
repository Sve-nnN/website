---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: milestone
status: Phase 10.6 en progreso — plans 01/02 (SiteHeader, SiteFooter) completados; plan 03 (Playwright mobile verification, checkpoint humano) pendiente
stopped_at: "10.6-01 y 10.6-02 ejecutados y commiteados; 10.6-03 (mobile verification, requiere checkpoints humanos) no ejecutado en esta corrida"
last_updated: "2026-07-10T16:20:00.000Z"
last_activity: 2026-07-10 — Ejecutados 10.6-01-PLAN.md (SiteHeader, UI-17) y 10.6-02-PLAN.md (SiteFooter dynamicColumns + restyle mobile-first, UI-18); 3 commits atomicos (5681087, 1ae02eb, 7ed4742)
progress:
  total_phases: 11
  completed_phases: 9
  total_plans: 55
  completed_plans: 50
  percent: 91
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-09)

**Core value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en contenido como en ejecución técnica (rendimiento y SEO impecables).
**Current focus:** Milestone v1.1 (UI/UX Polish Pass) — scope expandido 2026-07-10. Roadmap ahora cubre Phases 7-11 más tres fases insertadas (10.6, 10.7, 10.8) entre Phase 10.5 y Phase 11: header/footer completion + verificación mobile real (UI-17..19), component gap-fill AboutSection/TestimonialSection poblados (UI-20/21), y enriquecimiento de Hero con CTA/breadcrumbs poblados (UI-22/23). UI-24 (disciplina mobile-first) se verifica de forma cruzada en Phase 11, no como fase separada. Phase 10.5 cierra con alcance reducido (solo tipografía + schema de Footer, ya completo); el restyle de header/footer que tenía pendiente pasa a Phase 10.6. Phase 6 (Deploy + Cutover) sigue en pausa, retoma después de que Phase 11 cierre. Dos pre-deploy action items de Phase 5 siguen pendientes (contenido E-E-A-T de autor, Resend API key real).

## Current Position

Phase: 10.6 (Header/Footer Completion + Mobile Verification) — 2/3 plans completos
Plan: 10.6-01 (SiteHeader, UI-17) y 10.6-02 (SiteFooter, UI-18) completados y commiteados; 10.6-03 (Playwright mobile verification 375/768/1280px, UI-19) pendiente — no autonomo, requiere 2 checkpoints humanos (legitimidad de paquete playwright + confirmacion visual final)
Status: Phase 10.6 en progreso, esperando ejecucion de 10.6-03
Last activity: 2026-07-10 — Ejecutados 10.6-01-PLAN.md (SiteHeader completado: audit cerro un gap de accesibilidad real — SheetTitle faltante en el Sheet movil) y 10.6-02-PLAN.md (SiteFooter dynamicColumns conectado a datos reales via Local API con filtro _status published, mas restyle mobile-first del grid)

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

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
- [Phase 10.6] 10.6-03 (Playwright viewport verification 375/768/1280px, UI-19) no se ejecutó en esta corrida por instrucción explícita del orquestador — requiere 2 checkpoints humanos no automatizables (confirmar legitimidad del paquete npm `playwright` antes de instalar, y confirmación visual final de Juan sobre header+footer). Pendiente de ejecución en una corrida separada.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-10T16:20:00.000Z
Stopped at: 10.6-01 y 10.6-02 completados y commiteados; 10.6-03 (mobile verification, checkpoints humanos) pendiente de ejecución
Resume file: .planning/phases/10.6-header-footer-completion-mobile-verification/10.6-03-PLAN.md
</content>
