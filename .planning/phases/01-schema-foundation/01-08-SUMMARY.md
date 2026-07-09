---
phase: 01-schema-foundation
plan: 08
subsystem: database
tags: [payload, postgres, drizzle, lexical, seo, redirects, resend, sharp]

# Dependency graph
requires:
  - phase: 01-schema-foundation
    provides: "9 KEEP-list collections (Users, Media, Pages, Posts, Authors, Categories, CaseStudies, Testimonials, Clientes) built in waves 1-3"
provides:
  - "src/payload.config.ts - single source of truth wiring collections, plugins, db adapter, editor"
  - "push:false hard-coded Postgres adapter (no auto-schema-push in any environment)"
  - "seo/redirects/email-resend plugins wired end to end"
affects: [01-09, 01-10, migrations, app-router-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "push:false as a literal boolean on postgresAdapter, never conditional — migrations are the only schema-change path"
    - "email adapter wired from day one even though contact-form usage lands in a later phase, to avoid a later payload.config.ts refactor"

key-files:
  created: [src/payload.config.ts]
  modified: []

key-decisions:
  - "push:false hard-coded as literal boolean per RESEARCH.md Pitfall 3 — no throwaway environment in this project ever gets push:true"
  - "resendAdapter wired now despite contact-form usage being Phase 5 scope, per RESEARCH.md guidance to keep config complete from day one"

patterns-established:
  - "payload.config.ts imports collections from relative ./collections/* paths, exactly the 9 KEEP-list names, no DROP-listed collection ever referenced"

requirements-completed: [SCHEMA-01, SCHEMA-02]

# Metrics
duration: 6min
completed: 2026-07-09
---

# Phase 01 Plan 08: payload.config.ts Summary

**Single source-of-truth Payload config wiring all 9 KEEP-list collections onto a push:false Postgres adapter, with plugin-seo (tabbedUI), plugin-redirects, and email-resend**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-09T18:56:00Z
- **Completed:** 2026-07-09T19:02:48Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `src/payload.config.ts` registering exactly Users, Media, Pages, Posts, Authors, Categories, CaseStudies, Testimonials, Clientes — zero DROP-listed collections referenced
- Hard-coded `push: false` as a literal boolean on `postgresAdapter`, with load-bearing inline comment explaining the migration-only discipline
- Wired `seoPlugin` (tabbedUI on pages/posts/case-studies), `redirectsPlugin` (pages/posts/case-studies/categories/authors), and `resendAdapter` for email
- Wired `lexicalEditor()` and `sharp` for image processing
- Confirmed zero TypeScript errors against the existing tsconfig `@payload-config` path alias

## Task Commits

Each task was committed atomically:

1. **Task 1: Create payload.config.ts wiring all 9 collections, plugins, and the push:false Postgres adapter** - `22587c7` (feat)

**Plan metadata:** (this commit) `docs: complete 01-08 plan`

## Files Created/Modified
- `src/payload.config.ts` - Central Payload config: collections, plugins, db adapter (postgresAdapter, push:false), lexical editor, sharp, email-resend adapter, TypeScript output path

## Decisions Made
- Followed the plan's `<interfaces>` skeleton exactly (sourced from RESEARCH.md + aprendoclub structural reference), no deviation needed since the template already matched this project's collection exports 1:1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All 9 collection files already exported the expected named exports (`Users`, `Media`, `Pages`, `Posts`, `Authors`, `Categories`, `CaseStudies`, `Testimonials`, `Clientes`), and `@payload-config` path alias in `tsconfig.json` already pointed at `src/payload.config.ts`, so no additional wiring was required beyond the file itself.

## Acceptance Criteria Verification

- `grep -c "push: false"` → 1 (exact match)
- Conditional/`push: true` grep → 0 matches
- 9 collection imports from `./collections/*` → all 9 present
- DROP-listed collection references (Works/AdBanners/KeywordMetrics/PageMetrics/GSCMetrics/BrokenLinks) → 0
- `seoPlugin`/`redirectsPlugin`/`resendAdapter` references → present (6 lines matched: import + usage per symbol, functionally 3 distinct integrations as required)
- Dropped plugin references (nestedDocsPlugin/vercelBlobStorage/mcpPlugin/formBuilderPlugin) → 0
- `npx tsc --noEmit -p tsconfig.json` → 0 `error TS` lines

## User Setup Required

None - no external service configuration required. `.env` already contains `DATABASE_URI`, `PAYLOAD_SECRET`, and `CLOUDINARY_*` var names (confirmed present, contents not inspected per instruction); `RESEND_API_KEY`/`RESEND_FROM_EMAIL` fall back to safe defaults (`''` / `no-reply@example.com`) until Phase 5 wires the contact form.

## Next Phase Readiness
- `src/payload.config.ts` is ready for `payload generate:importmap` / `generate:types` (Wave 5) and `payload migrate:create` / `migrate` (Wave 6)
- No blockers

---
*Phase: 01-schema-foundation*
*Completed: 2026-07-09*

## Self-Check: PASSED

- FOUND: src/payload.config.ts
- FOUND: 22587c7
