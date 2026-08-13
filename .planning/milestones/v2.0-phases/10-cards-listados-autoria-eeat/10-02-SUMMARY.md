---
phase: 10-cards-listados-autoria-eeat
plan: 02
subsystem: testing
tags: [payload, postgres, verification, fixtures, e2e]

requires:
  - phase: 10-cards-listados-autoria-eeat
    plan: 01
    provides: "PostCard/CaseStudyCard/AuthorCard restyled to compose the Card primitive with E-E-A-T prominence styling"
provides:
  - "Automated proof that repeater min/max boundaries (1 and schema-max-6) render correctly for FeaturedPostsBlock, ArchiveBlock, FeaturedCaseStudiesBlock"
  - "Automated proof that AuthorCard E-E-A-T prominence styling renders correctly against a fully-populated author, in both en and es"
  - "Automated proof the two longest real ES post titles (75 chars) render without server-side truncation"
  - "Guarded, idempotent seed/cleanup script pair with zero residual production data"
affects: [11-cross-cutting-verification]

tech-stack:
  added: []
  patterns:
    - "Surgical raw-SQL single-column updates (via payload.db.drizzle.execute) for toggling non-localized block fields, instead of round-tripping an entire localized blocks array through the Local API"
    - "DOM-anchor-based card counting (`<a class=\"group block\" href=\"...\">`) instead of Tailwind-class-fragment counting, which overcounts due to the same strings appearing in the embedded Next.js RSC hydration payload"

key-files:
  created:
    - scripts/seed-phase10-eeat-fixtures.ts
    - scripts/verify-phase10-cards-eeat.mjs
    - scripts/cleanup-phase10-eeat-fixtures.ts
    - .planning/phases/10-cards-listados-autoria-eeat/10-VERIFICATION.md
  modified:
    - .gitignore

key-decisions:
  - "Discovered mid-execution that the plan's 'real content facts' misattributed ArchiveBlock's limit=12 instance to the home page — it actually lives on the blog page (pages.id=2). Verify script corrected to fetch the right route; no plan styling/code was affected."
  - "Discovered the pages.layout field is actually nested at pages.content.layout (a group field wraps the blocks array) — both seed and verify scripts written against the real path."
  - "Chose surgical raw-SQL updates over Local API round-trips for toggling block limit fields, after a full-array round-trip broke CallToAction's link validation on unrelated real content during development — this is safer for production data and is the pattern both verify and cleanup scripts use."

patterns-established:
  - "Guarded fixture seed/verify/cleanup script triad for boundary-condition testing against real production data, following scripts/cleanup-phase1-fixtures.ts's exact-match-guard precedent"

requirements-completed: [UI-09, UI-10]

duration: 55min
completed: 2026-07-10
---

# Phase 10 Plan 02: Boundary-condition + E-E-A-T verification Summary

**Seeded, verified, and cleanly removed 7 throwaway fixtures (1 fully-populated Author + 6 CaseStudies) against the real production Postgres database to prove the card-grid consistency and E-E-A-T prominence styling from 10-01 holds at repeater min/max boundaries, in both locales, and against the two longest real Spanish post titles — with zero residual data or altered field values left behind.**

## Performance

- **Duration:** 55 min (includes debugging real caching/counting-methodology issues discovered mid-execution)
- **Tasks:** 3 completed
- **Files modified:** 4 created, 1 modified (.gitignore)

## Accomplishments
- Verified `FeaturedPostsBlock` (limit=1, real data), `ArchiveBlock` (real limit=12 on the blog page, real data), and `FeaturedCaseStudiesBlock` (limit=1 and limit=6, seeded fixtures — 0 real CaseStudies exist) all render correctly with the restyled `PostCard`/`CaseStudyCard`
- Verified `AuthorCard`'s E-E-A-T prominence styling (bio, 3 credentials, headline-stat yearsExperience, 3 social links) renders correctly in both `/en` and `/es` against a fully-populated fixture author
- Verified the two longest real ES post titles (ids 53/66, 75 chars each) render verbatim with no server-side truncation
- Verified the pre-existing category-filter empty-state behavior (0-post category) still works correctly post-10-01-restyle — confirmed not a regression
- All 7 seeded fixtures deleted, `FeaturedContent` and toggled `limit` fields restored, state file removed — real DB confirmed clean (0 case-studies, 1 real author) after cleanup

## Task Commits

1. **Task 1: Seed E-E-A-T and case-study repeater-boundary fixtures** - `bd4aebb` (feat)
2. **Task 2: Automated boundary/ES/E-E-A-T verification against the running dev server** - `bd1007c` (feat)
3. **Task 3: Guarded fixture cleanup and phase verification report** - `d4e5bec` (feat)

## Files Created/Modified
- `scripts/seed-phase10-eeat-fixtures.ts` - Creates 1 test Author (full E-E-A-T fields) + 6 test CaseStudies, points FeaturedContent at them, records original state
- `scripts/verify-phase10-cards-eeat.mjs` - 9 automated checks against the real dev server: posts min/max boundaries, category empty-state, case-study min/max boundaries, AuthorCard en/es, ES longest titles
- `scripts/cleanup-phase10-eeat-fixtures.ts` - Guarded deletion of all 7 fixtures + field restoration, idempotent
- `.planning/phases/10-cards-listados-autoria-eeat/10-VERIFICATION.md` - Full verification report with explicit non-blocking content-gap flag for Juan's real author profile
- `.gitignore` - Excludes the cross-script scratch state file

## Decisions Made
- ArchiveBlock's real `limit=12` instance is on the blog page (`pages.id=2`), not the home page as the plan's real-content-facts section stated — corrected in the verify script, documented in 10-VERIFICATION.md as an execution-time correction, not a code change.
- Block `limit` fields are toggled via surgical raw-SQL `UPDATE`s scoped to a single non-localized column (`payload.db.drizzle.execute`), rather than round-tripping the entire localized `content.layout` blocks array through the Local API — the latter approach broke `CallToAction`'s link-label validation during development when tested against real production content. This is documented as the safer pattern for any future scripts needing to toggle a single block field on a live page.
- Card-count assertions use literal rendered DOM anchor matching (`<a class="group block" href="...">`) rather than Tailwind class-fragment matching, after discovering the latter overcounts by also matching the same class strings embedded in Next.js's RSC hydration payload later in the same document.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in own verification tooling] Card-count assertions overcounted due to RSC hydration payload duplication**
- **Found during:** Task 2, first verification run
- **Issue:** Naive regex counting of Tailwind class fragments (e.g. `aspect-[16/10]`) against the full HTML response matched both the true rendered DOM element and 1-2 duplicate occurrences of the same string inside Next.js's embedded RSC hydration payload script, inflating counts (e.g. reporting 3 PostCards when only 1 was actually rendered).
- **Fix:** Switched to matching literal rendered anchor tags (`<a class="group block" href="/blog/...">`), which only appear once per real DOM element and are not duplicated in the serialized hydration payload (which encodes props as JSON, not literal HTML tag strings).
- **Files modified:** `scripts/verify-phase10-cards-eeat.mjs`
- **Verification:** Re-ran full verify script after the fix; all 9 checks passed with counts matching manually-confirmed real DOM anchor counts.
- **Committed in:** `bd1007c`

**2. [Rule 1 - Bug in own verification tooling] Full-array Local API round-trip broke unrelated CallToAction validation**
- **Found during:** Task 2, first attempt at toggling block limits
- **Issue:** An initial implementation read the full `content.layout` blocks array via the Local API and wrote it back with only the target block's `limit` changed. This round-trip lost required nested-field data on an unrelated `CallToAction` block (its `links[].link.label` field), causing a `ValidationError` and risking real content corruption.
- **Fix:** Rewrote the toggle logic to use surgical raw-SQL `UPDATE`s against the single non-localized `limit` column on the relevant `pages_blocks_featured_*_block` table, scoped by `_parent_id` — never touching any other block's data.
- **Files modified:** `scripts/verify-phase10-cards-eeat.mjs`, `scripts/cleanup-phase10-eeat-fixtures.ts`
- **Verification:** Confirmed via direct Postgres reads that only the intended `limit` column changed and all other real page content (Hero, CallToAction, etc.) remained byte-for-byte untouched throughout the plan.
- **Committed in:** `bd1007c`, `d4e5bec`

**3. [Rule 1 - Plan documentation correction] Plan's real-content-facts misattributed ArchiveBlock's limit=12 instance to the home page**
- **Found during:** Task 2, when the home page's layout was inspected directly and found to have no `archiveBlock` entry
- **Issue:** The plan stated "home page (pages.id=1) ArchiveBlock limit=12" — direct read of `pages_blocks_archive_block` confirmed this instance actually belongs to the blog page (`pages.id=2`).
- **Fix:** Task 2's verify script fetches `/en/blog` (not `/en`) for the ArchiveBlock max-boundary check. No plan-scoped styling or code was affected; this is purely a verification-target correction, documented in `10-VERIFICATION.md`.
- **Files modified:** `scripts/verify-phase10-cards-eeat.mjs`
- **Verification:** Confirmed via direct `pages_blocks_archive_block` Postgres read (`_parent_id=2`).
- **Committed in:** `bd1007c`

## Threat Flags

None — this plan added no new production-facing surface (verification/cleanup scripts only, run locally against a dev server and the same production DB every prior phase's scripts already touch).

## Self-Check: PASSED

All created files found on disk; all three task commits (bd4aebb, bd1007c, d4e5bec) found in git log.
