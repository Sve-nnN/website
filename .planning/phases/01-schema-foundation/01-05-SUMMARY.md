---
phase: 01-schema-foundation
plan: 05
subsystem: cms-blocks
tags: [payload, blocks, page-builder, lexical, schema-consolidation]

# Dependency graph
requires:
  - phase: 01-schema-foundation
    provides: "src/utilities/deepMerge.ts and src/fields/slug.ts (Wave 1 shared utilities)"
provides:
  - "6 consolidated Payload block configs: Hero, Content, ArchiveBlock, CallToAction, FAQ, MediaBlock"
  - "src/fields/link.ts and src/fields/linkGroup.ts field utilities (ported dependency, not originally in this plan's file list)"
affects: [01-schema-foundation Wave 3 (Pages.layout block registration), Phase 5 (frontend block rendering)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Block config shape: import type { Block } from 'payload'; export const X: Block = { slug, interfaceName, fields, labels? }"
    - "Consolidation via discriminator field (Hero.variant) instead of multiple block slugs"
    - "Consolidation via relationTo/mode fields (ArchiveBlock) instead of multiple near-duplicate grid blocks"
    - "admin.condition callbacks on sibling fields for mode-based conditional visibility (limit vs selectedDocs)"

key-files:
  created:
    - src/blocks/Hero/config.ts
    - src/blocks/Content/config.ts
    - src/blocks/ArchiveBlock/config.ts
    - src/blocks/CallToAction/config.ts
    - src/blocks/FAQ/config.ts
    - src/blocks/MediaBlock/config.ts
    - src/fields/link.ts
    - src/fields/linkGroup.ts
  modified: []

key-decisions:
  - "Hero kept schema flat with no admin.condition callbacks per PLAN.md instruction — variant-based conditional rendering is a Phase 5 concern, not Phase 1 schema"
  - "Dropped animationField() from CallToAction and MediaBlock (presentation-layer field for a later motion system, out of scope for Phase 1 schema per PATTERNS.md discretion note)"
  - "ArchiveBlock uses relationTo (posts/case-studies) + mode (latest/manual), replacing JuanPortfolio's populateBy: collection/selection pattern — consolidates 9+ 'Featured X' blocks behind one slug"
  - "CallToAction slug changed from JuanPortfolio's 'cta' to 'callToAction' per PLAN.md task spec"

patterns-established:
  - "ArchiveBlock.relationTo is the single extension point for any future 'grid of N items from a collection' need — documented inline per RESEARCH.md Pitfall 5"

requirements-completed: [SCHEMA-06]

# Metrics
duration: 12min
completed: 2026-07-09
---

# Phase 01 Plan 05: Consolidated Block Configs (Hero, Content, ArchiveBlock, CallToAction, FAQ, MediaBlock) Summary

**6 consolidated Payload block configs replacing ~35 near-duplicate blocks from the old JuanPortfolio site — Hero's variant discriminator replaces 4+ hero slugs, ArchiveBlock's relationTo+mode replaces 9+ "Featured X" grid blocks.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-09T18:41:00Z
- **Completed:** 2026-07-09T18:53:34Z
- **Tasks:** 2 completed
- **Files modified:** 8 (6 block configs + 2 field-utility dependencies)

## Accomplishments
- Hero block with `variant` select discriminator (home/listing/post-header/case-study-header), collapsing what was 6 separate hero/header block slugs in JuanPortfolio into one
- ArchiveBlock consolidating posts+case-studies grid needs behind `relationTo` + `mode` (latest/manual), with an inline code comment locking the extension pattern (no new block slugs for future grid needs)
- Content, CallToAction, FAQ, MediaBlock ported from JuanPortfolio analogs, trimmed of presentation-layer `animationField()` calls per Phase 1 schema-only scope
- Added missing `link()`/`linkGroup()` field utilities (required by Content and CallToAction but not present in the greenfield repo yet)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Hero, Content, ArchiveBlock configs** - `0b2305f` (feat)
2. **Task 2: Create CallToAction, FAQ, MediaBlock configs** - `8e46126` (feat)

**Plan metadata:** (pending — see final commit below)

## Files Created/Modified
- `src/blocks/Hero/config.ts` - Consolidated hero block, `variant` discriminator, flat schema (no admin.condition)
- `src/blocks/Content/config.ts` - Multi-column richText block (`columns` array: size/richText/enableLink/link)
- `src/blocks/ArchiveBlock/config.ts` - Consolidated grid/archive block (`relationTo`, `mode`, `limit`, `selectedDocs`)
- `src/blocks/CallToAction/config.ts` - Single-CTA block (`richText` + `linkGroup`)
- `src/blocks/FAQ/config.ts` - FAQ accordion block (`title` + `faqs` array)
- `src/blocks/MediaBlock/config.ts` - Standalone media/image block (`media` upload field)
- `src/fields/link.ts` - Link group field utility (internal/custom URL, appearance) — new dependency, ported from JuanPortfolio
- `src/fields/linkGroup.ts` - Array wrapper around `link()` — new dependency, ported from JuanPortfolio

## Decisions Made
- Kept Hero schema flat (no `admin.condition` callbacks tied to `variant`) — those are admin-UI/rendering concerns for Phase 5, not Phase 1 schema, per explicit PLAN.md instruction
- Dropped `animationField()` from CallToAction and MediaBlock — presentation-layer motion-system field not needed until a later phase, per PATTERNS.md discretion note
- ArchiveBlock's `relationTo` options are locked to exactly `posts` and `case-studies` (not JuanPortfolio's broader `populateBy: collection/selection` pattern) — matches CONTEXT.md's consolidated block-library decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `src/fields/link.ts` and `src/fields/linkGroup.ts`**
- **Found during:** Task 1 (Content block config) and Task 2 (CallToAction block config)
- **Issue:** Content's `columns` fields and CallToAction's CTA both depend on a `link()` (and `linkGroup()`) field utility. These files did not exist yet in the greenfield `juan-payload` repo — only `src/fields/slug.ts` existed from Wave 1 — and importing them without creating the files would break the build immediately.
- **Fix:** Ported `src/fields/link.ts` and `src/fields/linkGroup.ts` verbatim from JuanPortfolio (both already use the `deepMerge` utility that Wave 1 already created at `src/utilities/deepMerge.ts`, so no further new dependency was needed).
- **Files modified:** `src/fields/link.ts`, `src/fields/linkGroup.ts`
- **Verification:** `npx tsc --noEmit` reports zero errors for `src/blocks/Content/config.ts`, `src/blocks/CallToAction/config.ts`, `src/fields/link.ts`, `src/fields/linkGroup.ts`
- **Committed in:** `0b2305f` (Task 1 commit, since Content needed `link()` first)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing referenced files)
**Impact on plan:** Necessary for Content and CallToAction to compile at all; no scope creep beyond the two field-utility files these blocks directly import.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 block config files exist under `src/blocks/*/config.ts`, each exporting a valid `Block`-typed object with the exact slug specified in the plan
- Ready for registration on `Pages.layout` in Wave 3 alongside the other consolidated blocks from sibling Wave 2 plans (FAQ, Code, TableOfContentsBlock, ContactFormBlock, TestimonialsCarousel, ResultsSection, RelatedPosts, Section)
- No blockers

---
*Phase: 01-schema-foundation*
*Completed: 2026-07-09*

## Self-Check: PASSED

All 8 created files verified present on disk. Both task commits (`0b2305f`, `8e46126`) verified present in `git log --oneline --all`.
