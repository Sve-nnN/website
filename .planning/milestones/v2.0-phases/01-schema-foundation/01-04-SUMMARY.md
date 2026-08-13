---
phase: 01-schema-foundation
plan: 04
subsystem: database
tags: [payload-cms, postgres, collections, structured-content, case-studies]

# Dependency graph
requires:
  - phase: 01-schema-foundation (plan 01)
    provides: authenticated/authenticatedOrPublished access utilities, slugField() shared field
provides:
  - CaseStudies collection with fully structured field model (hero, metadata, kpis, clientContext, challenge, solution, results, conclusion)
affects: [payload.config.ts wiring (Wave 4), Clientes relationship consumers, frontend case-study rendering (Phase 5)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Structured content modeling: array-of-group/array-of-object fields instead of a single free-form richText blob for content with a fixed visual shape (KPI cards, numbered steps, before/after comparisons)"

key-files:
  created:
    - src/collections/CaseStudies/index.ts
  modified: []

key-decisions:
  - "kpis array uses minRows:1/maxRows:6 (soft guard) rather than a hard 4-only lock, per RESEARCH.md Assumption A4"
  - "results.metrics before/after fields typed as text, not number, since case-study metrics are formatted strings like \"$41K\" or \"3.2x\""
  - "period/sector kept as plain text fields (not split date-range) per RESEARCH.md Assumption A3, deferred to Phase 4 ETL data review"

patterns-established:
  - "CaseStudies access tiering matches Pages/Posts: create/update/delete gated by authenticated, read via authenticatedOrPublished so drafts stay hidden from public visitors"

requirements-completed: [SCHEMA-04]

# Metrics
duration: 5min
completed: 2026-07-09
---

# Phase 1 Plan 4: CaseStudies Collection Summary

**Structured CaseStudies collection (hero/metadata/kpis/clientContext/challenge/solution/results/conclusion) matching the ariannalupi.com/casos/ reference model, replacing JuanPortfolio's single rich-text blob.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-09T18:47:00Z
- **Completed:** 2026-07-09T18:52:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `src/collections/CaseStudies/index.ts` exporting `CaseStudies: CollectionConfig` with the full structured field model: hero (title/heroMetric/heroSubtitle), metadata row (client relationship/sector/period), services array, kpis array (1-6 rows), clientContext richText, challenge bullets array, solution numbered-steps array, results group with before/after metrics array, conclusion richText, heroImage upload, and slugField()
- Wired the required access tiering (`authenticated` for create/update/delete, `authenticatedOrPublished` for read) per RESEARCH.md's Security Domain table and the plan's threat model (T-01-07)
- Added `versions.drafts` (autosave interval 100, schedulePublish) matching the Pages/Posts draft pattern

## Task Commits

Each task's file content was committed, though not in an isolated commit — see Deviations below for details.

1. **Task 1: Create the CaseStudies collection with the full structured field model** - content landed in commit `f4cef7e` ("feat(01-02): add Users, Media, Categories collections"), a sibling wave-2 plan's commit, due to a `git add`/staging race between concurrently executing agents. File content verified byte-identical to what this plan intended.

## Files Created/Modified
- `src/collections/CaseStudies/index.ts` - Structured CaseStudies collection: hero, metadata, kpis, clientContext, challenge, solution, results, conclusion, heroImage, slug

## Decisions Made
- Followed RESEARCH.md's authoritative code example verbatim, adding only the two explicitly-called-out additions: `access` tiering (authenticated/authenticatedOrPublished) and `versions.drafts` (matching Pages/Posts pattern) — both required by CONTEXT.md/RESEARCH.md but omitted from the raw interface snippet for brevity.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing functionality, or blocking issues encountered. The field model was implemented exactly as specified in the plan's `<interfaces>` block.

### Process Note (not a Rule 1-4 deviation)

**Commit landed in a sibling agent's commit, not its own atomic commit.** This plan runs as a sequential Wave 2 executor alongside sibling agents executing other Wave 2 plans concurrently on the same working tree (no worktree isolation for this wave). After staging `src/collections/CaseStudies/index.ts` individually (`git add src/collections/CaseStudies/index.ts`), a concurrently-running sibling agent (01-02, Users/Media/Categories) executed its own commit before this agent's `git commit` call, and that sibling's commit swept up the already-staged CaseStudies file (staged index state is shared across agents operating in the same working tree — not isolated per-agent). By the time this agent attempted its own commit, the working tree showed "no changes added to commit" because the file was already committed as part of `f4cef7e`.

Verified via `git show f4cef7e:src/collections/CaseStudies/index.ts | diff - src/collections/CaseStudies/index.ts` → **IDENTICAL**. No content was lost, altered, or duplicated. This is a git working-tree race condition inherent to non-worktree-isolated concurrent execution, not a defect in this plan's code or a deviation requiring Rule 1-4 handling. Flagging for the orchestrator: Wave 2 sequential-but-shared-tree execution risks this race whenever multiple agents stage files close in time; worktree isolation (as used for other waves) would prevent it.

---

**Total deviations:** 0 auto-fixed. 1 process note (commit attribution, not code).
**Impact on plan:** None on correctness — file content is exactly as planned and verified identical in the actual commit.

## Issues Encountered
Commit-attribution race described above; resolved by verification (byte-identical diff), no rework needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `CaseStudies` collection is ready for import into `payload.config.ts` in Wave 4
- `client` relationship field references `clientes` collection slug — depends on the Clientes collection (separate Wave 2 plan) using slug `clientes`, confirmed matching in RESEARCH.md's Clientes field model
- No blockers

---
*Phase: 01-schema-foundation*
*Completed: 2026-07-09*
