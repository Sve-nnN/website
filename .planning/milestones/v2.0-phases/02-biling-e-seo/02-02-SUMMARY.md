---
phase: 02-biling-e-seo
plan: 02
subsystem: database
tags: [payload, localization, i18n, neon, postgres, migration, seo, llms]

# Dependency graph
requires:
  - phase: 01-schema-foundation
    provides: Payload 3.85 config with postgresAdapter (push:false), migration workflow, and localized:true fields already present on Pages/Posts/CaseStudies/Testimonials/Authors/Categories
  - phase: 02-biling-e-seo
    provides: 02-01 established defaultLocale 'es' in src/i18n/routing.ts — this plan's localization block must stay in sync
provides:
  - Active Payload localization block (es default, en secondary, fallback true) — first time enabled in this project
  - Llms global (slug 'llms') registered and backed by a live Postgres table, ready for 02-04 llms.txt/llms-full.txt routes
  - Media.alt localized (closes content-parity gap from RESEARCH.md Pitfall 6)
  - seoPlugin generateTitle/generateDescription functions
  - phase2_i18n_seo migration applied to live Neon (batch 2) creating all _locales join tables + llms table
affects: [02-03 (middleware locale resolution + [locale] pages), 02-04 (sitemap + llms.txt routes), 02-05 (seed script)]

# Tech tracking
tech-stack:
  added: []
  patterns: [single schema-authority plan per phase — all schema-affecting changes bundled so only one migration runs, avoiding drift]

key-files:
  created:
    - src/globals/Llms/index.ts
    - src/migrations/20260709_201401_phase2_i18n_seo.ts
    - src/migrations/20260709_201401_phase2_i18n_seo.json
  modified:
    - src/payload.config.ts
    - src/collections/Media/index.ts
    - src/migrations/index.ts
    - src/payload-types.ts

key-decisions:
  - "Localization block placed with a sync-warning comment tying it to src/i18n/routing.ts defaultLocale (RESEARCH.md Pitfall 2 — two independent defaultLocale settings that can silently drift)"
  - "Llms global uses English admin labels matching this project's convention (not the aprendoclub Spanish reference), no defaultValue — content seeded later by 02-05"
  - "Migration applied against live Neon via payload migrate:create/migrate, never push:true (SCHEMA-01 invariant preserved)"

patterns-established:
  - "Schema-authority plan: bundle every schema-affecting change of a phase into one plan so a single migration covers the whole phase"

requirements-completed: [I18N-01, I18N-02, I18N-04]

# Metrics
duration: 27min
completed: 2026-07-09
---

# Phase 02 Plan 02: Localization Block, Llms Global & Neon Migration Summary

**Payload localization activated for the first time (es default, en secondary, fallback true), Media.alt localized, Llms global created and registered, seoPlugin generate functions added, and the resulting `_locales` join tables + `llms` table applied to the live Neon Postgres DB via a committed migration**

## Performance

- **Duration:** 27 min
- **Started:** 2026-07-09T15:01:38-05:00 (Task 1 commit)
- **Completed:** 2026-07-09T15:28:11-05:00 (Task 2 commit)
- **Tasks:** 2 (both auto)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- Added the `localization` block to `payload.config.ts` (locales es/en, `defaultLocale: 'es'`, `fallback: true`) — the first time localization is active in this project, with a sync-warning comment tying it to `src/i18n/routing.ts`
- Registered a new `Llms` global (`slug: 'llms'`, English admin labels, two required textareas `llmsTxt`/`llmsFull`) via `globals: [Llms]`
- Marked `Media.alt` as `localized: true`, closing the content-parity gap from RESEARCH.md Pitfall 6
- Extended `seoPlugin` with `generateTitle` (`… | Juan Carlos Angulo`) and `generateDescription` (heroSubtitle ?? excerpt ?? '')
- Regenerated `payload-types.ts` and generated `payload migrate:create phase2-i18n-seo`
- Applied the migration to the live Neon Postgres DB (batch 2) — creates all `_locales` join tables (media, pages, case_studies, testimonials, authors, categories, posts, plus blocks and `_v` version tables) and the `llms` global table
- Confirmed via `payload migrate:status`: both `20260709_191127_initial` and `20260709_201401_phase2_i18n_seo` show `Ran: Yes` with no pending migrations

## Task Commits

Each task was committed atomically:

1. **Task 1: Add localization block, Llms global, Media.alt fix, seoPlugin generate functions** - `ac8f898` (feat)
2. **Task 2: Generate types and apply phase2 i18n/seo migration to Neon** - `1ed321f` (feat)

**Plan metadata:** pending (this SUMMARY.md commit)

## Files Created/Modified
- `src/globals/Llms/index.ts` - GlobalConfig for the `llms` global (llmsTxt/llmsFull admin-editable textareas)
- `src/migrations/20260709_201401_phase2_i18n_seo.ts` - Migration creating `_locales` join tables and the `llms` table
- `src/migrations/20260709_201401_phase2_i18n_seo.json` - Migration schema snapshot
- `src/payload.config.ts` - Added localization block, `globals: [Llms]` + import, seoPlugin generateTitle/generateDescription
- `src/collections/Media/index.ts` - `alt` field now `localized: true`
- `src/migrations/index.ts` - Registered the new phase-2 migration
- `src/payload-types.ts` - Regenerated to reflect localization, the Llms global type, and locale-aware Media.alt

## Decisions Made
- Localization block carries an inline sync-warning comment pointing at `src/i18n/routing.ts` to prevent the two independent `defaultLocale` values from drifting (RESEARCH.md Pitfall 2).
- Llms global uses English admin labels/descriptions per this project's convention (not the aprendoclub Spanish reference) and no `defaultValue` — placeholder content will be seeded by 02-05, not hardcoded here.
- Migration was created and applied through `payload migrate:create`/`payload migrate` against the live Neon DB; `push: false` remains a hard-coded literal (SCHEMA-01 invariant, unmodified).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. The migration had already been applied against Neon by the orchestrator (with Juan's direct authorization); this executor reconfirmed via `payload migrate:status` (both migrations `Ran: Yes`, no pending), then committed the migration files, updated `migrations/index.ts`, and regenerated `payload-types.ts`.

## User Setup Required

None - no external service configuration required. `DATABASE_URI` (Neon direct/unpooled) was already confirmed correct in Phase 1 (01-10).

## Next Phase Readiness
- `localization` is now active in Payload — 02-03 can build `middleware.ts` locale resolution and `[locale]` pages, and query documents per locale.
- The `llms` global table exists and is queryable — 02-04 can back the `/llms.txt` and `/llms-full.txt` routes on it.
- `_locales` join tables exist for every `localized: true` field — 02-05 seed script can write locale-scoped content.
- No blockers. STATE.md/ROADMAP.md updates are handled by the orchestrator after 02-01 and 02-02 both complete.

---
*Phase: 02-biling-e-seo*
*Completed: 2026-07-09*

## Self-Check: PASSED

All created files verified present on disk (`src/globals/Llms/index.ts`, both migration files, this SUMMARY). Both task commits (`ac8f898`, `1ed321f`) verified in git log. `payload migrate:status` reconfirms `20260709_201401_phase2_i18n_seo` as `Ran: Yes` (batch 2), no pending migrations.
