---
phase: 28-component-motion-rollout-hero-variants-blog-grids
plan: 03
subsystem: ui
tags: [motion, framer-motion, scroll-reveal, hover, reduced-motion, blog-grid, react, nextjs]

# Dependency graph
requires:
  - phase: 27-micro-animation-library-adoption
    provides: "ScrollReveal leaf, useReducedMotion() hook, MotionProvider root wiring, motion/react-m import discipline"
  - phase: 28-01
    provides: "MotionProvider still mounted in [locale] layout (no changes needed here, reused as-is)"
provides:
  - "ArchiveBlock (/blog, both post and case-study modes) and FeaturedPostsBlock grid items scroll-reveal into view via the reused Phase 27 ScrollReveal leaf"
  - "PostCard hover fully migrated from CSS-only group-hover:scale-105 to Motion whileHover + useReducedMotion(), closing the Phase 27 SUMMARY's flagged inconsistency"
  - "ScrollReveal gains data-testid=\"scroll-reveal\" for 28-04's headless reduced-motion verification pass"
affects: [28-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reused ScrollReveal verbatim (only additive data-testid change) rather than creating a second scroll-reveal component, per plan constraint"
    - "PostCard follows TestimonialCardMotion's exact whileHover + useReducedMotion() gating pattern, importing 'motion/react-m' as * as m"

key-files:
  created: []
  modified:
    - src/components/ScrollReveal.tsx
    - src/blocks/ArchiveBlock/Component.tsx
    - src/blocks/FeaturedPostsBlock/Component.tsx
    - src/components/PostCard.tsx

key-decisions:
  - "Moved key={doc.id}/key={post.id} from PostCard/CaseStudyCard up to the new ScrollReveal wrapper, per plan interface spec, rather than keeping the key on the inner card"
  - "PostCard's Image fill wrapper (m.div) uses a plain non-positioning className (h-full w-full) since the outer div already provides position:relative + aspect ratio, avoiding a redundant second positioned layer"
  - "Removed the now-unused group class from PostCard's outer Link since nothing inside references group-* classes after the CSS-hover migration"

requirements-completed: [UIPOL-07, UIPOL-08, MOTION-03]

# Metrics
duration: 15min
completed: 2026-07-13
---

# Phase 28 Plan 03: Component Motion Rollout — Blog Grids Summary

**ArchiveBlock and FeaturedPostsBlock grid items now scroll-reveal into view using the exact Phase 27 ScrollReveal leaf, and PostCard's hover scale moved from a bare CSS group-hover transition to a reduced-motion-gated Motion whileHover interaction.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 (2 auto code tasks, 1 live verification task)
- **Files modified:** 4

## Accomplishments
- `ScrollReveal` gained `data-testid="scroll-reveal"` — purely additive, no behavior change, gives 28-04's headless Playwright pass a stable selector
- `ArchiveBlock/Component.tsx` wraps every grid item (both `PostCard` and `CaseStudyCard` branches) in `<ScrollReveal>`, staying an async Server Component (no `'use client'` added)
- `FeaturedPostsBlock/Component.tsx` wraps every `PostCard` in `<ScrollReveal>`, same discipline
- `PostCard.tsx` converted to `'use client'`, hover-scale now goes through `m.div whileHover={{ scale: reducedMotion ? 1 : 1.05 }}` gated by `useReducedMotion()`, matching `TestimonialCardMotion`'s exact pattern (`motion/react-m`, not `motion/react`)
- Live-verified on both locales (`/en/blog`, `/es/blog`, `/en`, `/es`): scroll-reveal wrappers present around every grid card (15 on `/blog`, 8 on the home page's `FeaturedPostsBlock`), post images render correctly with proper `src`/`alt`, no hydration-mismatch text found in rendered HTML

## Task Commits

Each task was committed atomically:

1. **Task 1: Add data-testid to ScrollReveal, wrap ArchiveBlock + FeaturedPostsBlock grid items** — `8897eb5` (feat)
2. **Task 2: Migrate PostCard hover from CSS group-hover to Motion whileHover + useReducedMotion** — `39d039b` (feat)
3. **Task 3: Live verification — blog grid scroll-reveal + PostCard hover, both locales** — verification-only, no commit (no files touched)

_No plan-metadata commit — orchestrator owns STATE.md/ROADMAP.md updates and will make the final metadata commit itself._

## Files Created/Modified
- `src/components/ScrollReveal.tsx` - Added `data-testid="scroll-reveal"` to the `m.div`, otherwise unchanged
- `src/blocks/ArchiveBlock/Component.tsx` - Each `docs.map()` grid item (PostCard or CaseStudyCard) wrapped in `<ScrollReveal key={doc.id}>`
- `src/blocks/FeaturedPostsBlock/Component.tsx` - Each `posts.map()` PostCard wrapped in `<ScrollReveal key={post.id}>`
- `src/components/PostCard.tsx` - Converted to `'use client'`; Image hover-scale migrated from `group-hover:scale-105` CSS to `m.div whileHover` gated by `useReducedMotion()`; unused `group` class removed from outer `Link`

## Verification Results

1. `npx tsc --noEmit -p tsconfig.json` — zero errors after Task 1 and after Task 2.
2. `grep -c "group-hover:scale-105" src/components/PostCard.tsx` — returns `0`.
3. Live `npm run dev` (already running) + curl fetch:
   - `/en/blog` — 15 `data-testid="scroll-reveal"` wrappers present, post/case-study card images render with correct `src`/`alt`
   - `/es/blog` (via `/es/blog` redirect-followed) — 15 `data-testid="scroll-reveal"` wrappers present
   - `/en` (home, FeaturedPostsBlock) — 8 `data-testid="scroll-reveal"` wrappers present
   - `/es` (home) — 8 `data-testid="scroll-reveal"` wrappers present
   - No React hydration-mismatch warning text found in any fetched HTML (the only "Hydration" string matches were legitimate blog post titles — "Web Hydration SEO" — a real post title, not an error)

## Decisions Made
- Kept `ScrollReveal` fully verbatim from Phase 27 except the additive `data-testid`, per the plan's explicit "reuse verbatim, do not create a second scroll-reveal component" instruction.
- `key` prop moved from `PostCard`/`CaseStudyCard` up to the new `ScrollReveal` wrapper (React requires the key on the direct child of `.map()`, which is now `ScrollReveal`).
- `PostCard`'s `m.div` wrapper around `Image` uses `className="h-full w-full"` (no `relative`) since the existing outer `<div className="relative aspect-[16/10] bg-muted">` already provides the positioned ancestor Next's `fill` prop needs — avoids a redundant second positioning layer.

## Deviations from Plan

None — plan executed exactly as written. `src/blocks/Hero/Component.tsx` (owned by a concurrent parallel-wave agent) was left untouched and never staged, per the plan's explicit scope boundary.

## Issues Encountered

None. Dev server was already running on port 3000 from a prior session; reused it rather than starting a new instance. Could not directly tail the dev server's live stdout log (background process from an earlier session), so hydration-mismatch verification was done by inspecting fetched HTML for error-boundary/hydration-warning markers instead — none found, and all 4 fetched routes returned HTTP 200.

## User Setup Required

None — no external service configuration required, no new dependencies added.

## Next Phase Readiness

28-04 (headless reduced-motion verification pass) can proceed directly:
- `data-testid="scroll-reveal"` selector is live on `ScrollReveal` and present on both `/blog` grid modes and the home page's `FeaturedPostsBlock`.
- `PostCard`'s hover is now a real Motion `whileHover` interaction that 28-04 can assert collapses to zero scale under `prefers-reduced-motion: reduce` emulation.
- No new leaf-component conventions were invented — `ScrollReveal` and `PostCard`'s hover both reuse Phase 27's exact patterns.

---
*Phase: 28-component-motion-rollout-hero-variants-blog-grids*
*Completed: 2026-07-13*

## Self-Check: PASSED

Both created/modified files verified present on disk with expected content (`data-testid="scroll-reveal"` in ScrollReveal.tsx, `ScrollReveal` imports/wraps in ArchiveBlock and FeaturedPostsBlock, `useReducedMotion`/`motion/react-m` in PostCard.tsx with zero `group-hover:scale-105` occurrences); both task commits (8897eb5, 39d039b) verified present in `git log --oneline`.
