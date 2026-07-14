---
phase: 37-case-studies-content-audit-fix
plan: 01
subsystem: ui
tags: [nextjs, payload, json-ld, seo, react]

# Dependency graph
requires: []
provides:
  - Deduplicated author section on case-study detail page (single AuthorCard render)
  - Per-doc JSON-LD CreativeWork object (description/author/dateCreated/dateModified/creator/additionalProperty)
  - Closing CTA section (heading + 2 locale-aware buttons) between conclusion and author
affects: [37-03-content-audit, 37-04-content-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional spread (...(condition ? {key: value} : {})) for optional JSON-LD fields to avoid emitting undefined keys"
    - "Inline localePrefix ternary (locale === 'es' ? '' : '/en') for locale-aware hrefs, matching src/lib/breadcrumbs.ts homeHref without a cross-file import"

key-files:
  created: []
  modified:
    - "src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"

key-decisions:
  - "Kept the CTA section unconditional (not gated by doc.conclusion) so every case study gets the closing CTA regardless of whether it has a conclusion field filled in"

patterns-established:
  - "Closing CTA section pattern (heading + primary/secondary Button asChild + Link) for detail pages: reusable if other detail pages (e.g. blog posts) need the same closing CTA later"

requirements-completed: [CASE-07, CASE-08, CASE-11]

# Metrics
duration: 20min
completed: 2026-07-14
---

# Phase 37 Plan 01: Case Studies Detail Page Code Fixes Summary

**Deduplicated author render, per-doc JSON-LD CreativeWork object, and a new locale-aware closing CTA section on the case-study detail page**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-14 (session start)
- **Completed:** 2026-07-14T18:25:09Z
- **Tasks:** 3/3 completed
- **Files modified:** 1

## Accomplishments
- Removed the duplicate `AuthorByline` + `AuthorCard` stack so the author section renders `AuthorCard` exactly once
- Replaced the generic 2-field `creativeWorkData` JSON-LD object with a real per-doc composition: `description`, `author` (Person), `dateCreated`/`dateModified`, `creator` (Organization), and `additionalProperty` (kpis mapped to `PropertyValue`), each conditionally included only when the underlying doc field is present
- Added a new closing CTA section (heading + primary "contact" button + secondary "case studies" button, both locale-aware) placed after `conclusion` and before `author`, matching the `ariannalupi.com/casos` structural reference

## Task Commits

Each task was committed atomically:

1. **Task 1: Deduplicate author section (CASE-07)** - `5d5998f` (fix)
2. **Task 2: Dynamic per-doc JSON-LD (CASE-08)** - `995602b` (fix)
3. **Task 3: Closing CTA section (CASE-11)** - `cc91a76` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` - Author section dedup, dynamic JSON-LD, new closing CTA section

## Decisions Made
- CTA section renders unconditionally (not gated on `doc.conclusion` truthiness) — every case study should end with a CTA regardless of whether its conclusion field is populated, since the section's purpose (drive contact/browse-more actions) is independent of that field's content.

## Deviations from Plan

None - plan executed exactly as written. (One self-caught slip during drafting: an early edit accidentally gated the new CTA section behind `doc.conclusion &&`, copy-pasted from the adjacent block. Caught and corrected before committing — the final committed code has the CTA section unconditional, matching the plan's intent. No deviation rule needed since this was corrected within the same task before verification/commit, not a post-hoc fix.)

## Issues Encountered
- The local dev server (`localhost:3000`) was slow to respond during initial verification (timed out at 10-20s, likely mid-recompile). Retried after a short wait and it responded normally — used it to spot-check both locales live: confirmed single `AuthorCard` render (no `AuthorByline` text in output), correct-language CTA button copy on `/case-studies/edtech-financiera-infantil-crecimiento-organico-seo` (ES) and `/en/case-studies/edtech-financiera-infantil-crecimiento-organico-seo` (EN), and populated `additionalProperty` JSON-LD with real KPI labels/values from that doc.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The 3 code-level bugs (CASE-07, CASE-08, CASE-11) are fixed and independently verified against a real doc/locale pair — ready for Plan 37-03/37-04's content audit to build on a correct page structure.
- No blockers.

---
*Phase: 37-case-studies-content-audit-fix*
*Completed: 2026-07-14*

## Self-Check: PASSED
