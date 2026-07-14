---
phase: 38-websites-schema-collection-design
plan: 01
subsystem: database
tags: [payload, postgres, collections, migrations, cms]

# Dependency graph
requires:
  - phase: 37-case-studies-content-audit-fix
    provides: "CaseStudies collection pattern (access, versions, slugField, challenge array shape) used as the direct structural analog"
provides:
  - "Websites Payload collection (schema only — no frontend/content)"
  - "websites Postgres table + sub-tables (highlights, stack, challenges, screenshots) + versions/locales tables"
  - "Website TypeScript interface in payload-types.ts"
affects: [39-websites-frontend, 40-websites-content-seed]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Group field + required sibling date field for 'never save a metric without a capture timestamp' constraint (lighthouse + lighthouseCapturedAt)"]

key-files:
  created: [src/collections/Websites/index.ts, src/migrations/20260714_163429.ts, src/migrations/20260714_163429.json]
  modified: [src/payload.config.ts, src/payload-types.ts, src/migrations/index.ts]

key-decisions:
  - "stack is a plain array of text tags (no relationship/taxonomy) per CONTEXT.md — 6 documents doesn't warrant a new collection"
  - "lighthouseCapturedAt is a sibling field to the lighthouse group, not nested inside it, so no score can ever be saved without a capture date"
  - "client and relatedCaseStudy relationships are both optional and unidirectional — no back-reference added to CaseStudies"
  - "websites added only to seoPlugin's collections[], deliberately excluded from redirectsPlugin/searchPlugin/mcpPlugin per CONTEXT.md scope boundary"

patterns-established:
  - "Group field + required sibling date field as the pattern for metric+capture-timestamp integrity (reusable for future scored/audited fields)"

requirements-completed: [WEB-01, WEB-02, WEB-03, WEB-04, WEB-05]

# Metrics
duration: 15min
completed: 2026-07-14
---

# Phase 38 Plan 01: Websites Schema & Collection Design Summary

**Websites Payload collection with Lighthouse scores gated by a required capture date, optional unidirectional relationships to Clientes and CaseStudies, and an applied additive Postgres migration on the real Neon DB**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-14T16:35:00Z
- **Tasks:** 3 (3 completed)
- **Files modified:** 6 (1 created collection, 1 config edit, 2 migration files, 1 migrations index, 1 generated types file)

## Accomplishments
- Created the `Websites` collection modeled exactly on `CaseStudies` (access control, versions/drafts, slugField), with 13 fields covering identity, stack, challenges, screenshots, Lighthouse scores + required capture date, and two optional unidirectional relationships
- Registered `Websites` in `payload.config.ts`'s `collections[]` and in `@payloadcms/plugin-seo`'s `collections[]` only, per the CONTEXT.md scope boundary
- Generated, read, and applied a purely additive Postgres migration against the real Neon production DB (no DROP/ALTER on any pre-existing table or column)
- Regenerated `payload-types.ts`, confirming the `Website` interface is present

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the Websites collection schema** - `b18f747` (feat)
2. **Task 2: Register Websites in payload.config.ts** - `6da28fd` (feat)
3. **Task 3: Generate + apply Postgres migration, run generate:types** - `1218d8b` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/collections/Websites/index.ts` - New CollectionConfig: title/role/industry/year, highlights array, stack array (tag), challenges array (reuses CaseStudies.challenge shape), screenshots array of uploads, lighthouse group (4 scores 0-100) + required lighthouseCapturedAt sibling, client -> clientes and relatedCaseStudy -> case-studies (both optional, hasMany:false), slugField()
- `src/payload.config.ts` - Added `import { Websites }`, appended `Websites` to `collections[]`, appended `'websites'` to `seoPlugin({ collections: [...] })`
- `src/migrations/20260714_163429.ts` / `.json` - Additive migration: `CREATE TABLE "websites"` + sub-tables (`websites_highlights`, `websites_stack`, `websites_challenges`, `websites_screenshots`, locales tables), versions (`_websites_v*`) tables, FK constraints to `clientes` and `case_studies`, plus one `ADD COLUMN`/`ADD CONSTRAINT` on `payload_locked_documents_rels` to support the new collection's document-locking relationship. Applied successfully.
- `src/migrations/index.ts` - Auto-updated by `payload migrate:create` to register the new migration
- `src/payload-types.ts` - Regenerated; now includes `interface Website`

## Decisions Made
- Followed CONTEXT.md and PATTERNS.md exactly — no deviations from the specified field list, order, or shapes
- Confirmed the generated migration's `up()` function contains zero `DROP` statements before applying (verified via grep on the up-function block), satisfying CLAUDE.md's Database Safety rule for additive migrations running without pause

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Websites collection schema is live in production Postgres and reflected in `payload-types.ts`
- Ready for Phase 39 (frontend) to consume `Website` documents via Payload's Local API / REST
- No content has been seeded yet — that is Phase 40's scope
- Manual spot-check recommended (non-blocking, per plan's verification step 4): visit `/admin/collections/websites/create` to confirm the admin form renders all fields correctly

---
*Phase: 38-websites-schema-collection-design*
*Completed: 2026-07-14*

## Self-Check: PASSED
- FOUND: src/collections/Websites/index.ts
- FOUND: src/migrations/20260714_163429.ts
- FOUND: .planning/phases/38-websites-schema-collection-design/38-01-SUMMARY.md
- FOUND commit: b18f747
- FOUND commit: 6da28fd
- FOUND commit: 1218d8b
