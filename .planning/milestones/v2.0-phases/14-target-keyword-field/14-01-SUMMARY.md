---
phase: 14-target-keyword-field
plan: 01
subsystem: database
tags: [payload, postgres, seo, migrations, seed-script]

# Dependency graph
requires:
  - phase: 13-home-content-population
    provides: Home `pages` doc and `contactFormBlock` seeded content this plan builds on
provides:
  - targetKeyword group field (en/es plain text, not localized) on Pages and Authors collections
  - Applied Postgres migration adding target_keyword_en/es columns to pages, _pages_v, authors
  - Idempotent seed script populating Home + the real Author's targetKeyword with the 4 locked picks
affects: [seo, content-editing, future keyword-tracking phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Editorial-only group field (en/es sub-fields, not localized:true) for admin-side reference data that must be visible in both languages regardless of active admin locale"

key-files:
  created:
    - scripts/seed-phase14-target-keyword.ts
    - src/migrations/20260712_001122_phase14_target_keyword_field.ts
    - src/migrations/20260712_001122_phase14_target_keyword_field.json
  modified:
    - src/collections/Pages/index.ts
    - src/collections/Authors/index.ts
    - src/payload-types.ts
    - src/migrations/index.ts

key-decisions:
  - "targetKeyword added as a standalone top-level group field on both collections (no SEO tab exists on either today), separate from @payloadcms/plugin-seo's meta fields"
  - "en/es sub-fields are plain text, not localized:true, so both language picks are visible side-by-side in admin regardless of active locale (editorial comparison use case)"

patterns-established:
  - "Group field with explicit en/es sub-fields (not Payload's localized:true) when the field must show both languages simultaneously in admin"

requirements-completed: [SEO-KW-01, SEO-KW-02]

# Metrics
duration: 6min
completed: 2026-07-12
---

# Phase 14 Plan 01: Target Keyword Field Summary

**Added an editorial `targetKeyword` group field (en/es plain text) to Pages and Authors, migrated Postgres, and seeded Home + the real Author with the four already-researched keyword picks.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-12T00:11:00Z
- **Completed:** 2026-07-12T00:16:20Z
- **Tasks:** 3
- **Files modified:** 7 (2 collections, payload-types.ts, 3 migration-related files, 1 new seed script)

## Accomplishments
- `targetKeyword` group field (en/es text, not localized, no external API call) added to `pages` and `authors`, placed after the existing `slugField()` on each
- Postgres migration generated via `payload migrate:create`, reviewed (touches only `pages`, `_pages_v`, `authors`), and applied with `push:false` untouched
- Idempotent seed script populates Home (`pages`, slug=home) with es="seo técnico"/en="technical seo consultant" and the real Author (`authors`, slug=juan-carlos-angulo) with es="auditoría seo técnico"/en="technical seo specialist"
- Verified directly against the running dev server's REST API (`/api/pages`, `/api/authors`) in both `es` and `en` locale params — all four values confirmed correct and identical regardless of locale (as expected for a non-localized group)
- Re-ran the seed script a second time — identical output, no errors, no duplication

## Task Commits

Each task was committed atomically:

1. **Task 1: Add targetKeyword group field to Pages and Authors collections** - `34ab57c` (feat)
2. **Task 2: Generate + apply + commit the Postgres migration** - `648256c` (feat)
3. **Task 3: Idempotent seed script populating Home + the real Author's targetKeyword** - `e163cee` (feat)

**Plan metadata:** _(pending — final commit below)_

## Files Created/Modified
- `src/collections/Pages/index.ts` - added targetKeyword group field
- `src/collections/Authors/index.ts` - added targetKeyword group field
- `src/payload-types.ts` - regenerated, Page/Author interfaces now include targetKeyword
- `src/migrations/20260712_001122_phase14_target_keyword_field.ts` / `.json` - new migration adding target_keyword_en/es columns
- `src/migrations/index.ts` - auto-registered new migration (CLI-managed)
- `scripts/seed-phase14-target-keyword.ts` - idempotent seed script for the 4 locked picks

## Decisions Made
- Field placed as a standalone top-level group (no SEO tab exists on either collection) rather than nested — matches the plan's locked `<interfaces>` shape exactly.
- No `locale` param used in the seed script's `payload.update()` calls since the group's sub-fields are plain (not `localized: true`) — a single call writes both `en`/`es` values at once, unlike Phase 13's per-locale loop pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing missing es-locale contactInfo data blocking the Home doc update**
- **Found during:** Task 3 (seed script first run)
- **Issue:** `payload.update()` on the Home `pages` doc failed with a `ValidationError` ("Content > Content > Layout > Block 9 (Contact Form) > Contact Info 1 > Title, ... Value") — unrelated to `targetKeyword`. Payload validates the full merged document on update, and the es-locale (default locale) `contactFormBlock.contactInfo[0].title`/`value` (both `localized: true, required: true`) were empty, a pre-existing data gap left over from an earlier phase's seed run. This blocked any `update()` call against the Home doc, including the targetKeyword seed.
- **Fix:** Ran a one-off, non-committed Local API script to backfill `contactInfo[0].title="Email"`/`value="hello@juan-tech.com"` for the `es` locale, matching the already-correct `en` locale values (same text, since "Email" and the address don't differ by language). Script was deleted after running — it's a data fix, not a plan artifact.
- **Files modified:** none (database data only, no source file changes)
- **Verification:** Confirmed via `/api/pages?locale=es` that `contactInfo[0].title`/`value` are now populated; the targetKeyword seed script then ran successfully on both docs.
- **Committed in:** n/a (data-only fix, no file changes to commit; the fixed state is implicitly reflected in the dev database, not in git)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock Task 3; no scope creep into unrelated collection schema or plugin-seo config. Out of caution, this pre-existing data gap should be flagged to Juan since it means the live Home page's `es` contact section may have been rendering without an email label/value prior to this fix — worth a quick visual check on `/contact` or the Home page's contact section in Spanish.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `targetKeyword` is fully wired (schema + migration + data) on both collections, ready for any future phase that wants to reference it (e.g., a keyword-tracking dashboard or content-writing checklist).
- Flag for Juan: the es-locale `contactInfo` title/value gap fixed as a deviation in this plan was a pre-existing bug from a prior phase's seed script, not something Phase 14 introduced — worth a quick look at the live Spanish Home page's contact section to confirm it displays correctly now.

---
*Phase: 14-target-keyword-field*
*Completed: 2026-07-12*

## Self-Check: PASSED
All created/modified files confirmed present; all 3 task commit hashes (34ab57c, 648256c, e163cee) confirmed in git log.
