---
phase: 05-frontend-pages
plan: 04
subsystem: ui
tags: [react, payload-blocks, next-server-components, tailwind]

requires:
  - phase: 05-01
    provides: Container/Prose primitives, shadcn UI components, design tokens
  - phase: 05-03
    provides: FeaturedPostsBlock/FeaturedCaseStudiesBlock/ClientLogosBlock configs + ArchiveBlock enableCategoryFilter field
provides:
  - RenderBlocks.tsx single registry mapping all 16 Pages block slugs to renderers
  - 16 block Component.tsx files
  - RichTextRenderer (shared Lexical-to-JSX serializer) and CMSLink shared components
  - PostCard/CaseStudyCard shared card presentation
affects: [05-06, 05-07, 05-08, 05-09, 05-10, 05-12]

tech-stack:
  added: []
  patterns:
    - "RenderBlocks is the single block-slug-to-Component map; Section recursively delegates to it for nested blocks instead of duplicating switch logic"
    - "RichTextRenderer wraps @payloadcms/richtext-lexical/react's official RichText + defaultJSXConverters, framed by Prose"
    - "Featured*Block components read curated docs from the FeaturedContent global via findGlobal at render time, never a hardcoded recency query"
    - "ArchiveBlock's category filter validates the ?category= param against the real fetched categories list before using it in a where clause (T-05-04-01)"

key-files:
  created:
    - src/blocks/RenderBlocks.tsx
    - src/blocks/*/Component.tsx (16 files)
    - src/components/RichTextRenderer.tsx
    - src/components/CMSLink.tsx
    - src/components/PostCard.tsx
    - src/components/CaseStudyCard.tsx
  modified: []

key-decisions:
  - "lucide-react no longer ships brand icons (Linkedin/Github removed in the installed version) — substituted generic Link2/Code2 icons in ContactFormBlock's icon map"
  - "RelatedPostsComponent accepts optional currentPostId/currentCategoryIds props (beyond its own block config) since RenderBlocks has no notion of 'current post' — the calling page (05-08) must pass these through"
  - "TableOfContentsBlock parses headings from the rendered DOM client-side after mount, rather than re-parsing Lexical JSON, to stay decoupled from any single content field"

patterns-established:
  - "PostCard/CaseStudyCard are the canonical card presentation reused by ArchiveBlock, Featured*Block, and RelatedPosts — later page plans should reuse these, not reinvent card markup"

requirements-completed: [CONT-01, CONT-03]

duration: 45min
completed: 2026-07-09
---

# Phase 5 Plan 04: RenderBlocks Registry + 16 Block Renderers Summary

**Single RenderBlocks registry resolving all 16 Pages blocks, with FeaturedPosts/FeaturedCaseStudies reading curated docs from the FeaturedContent global and a validated category-filter on ArchiveBlock.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 2 completed
- **Files modified:** 21

## Accomplishments
- Built `RenderBlocks.tsx`, the single slug-to-Component registry every page plan calls instead of ad-hoc imports
- Created renderers for all 16 registered Pages blocks (Hero, Content, CallToAction, FAQ, MediaBlock, Code, Section, ArchiveBlock, TestimonialsCarousel, RelatedPosts, TableOfContentsBlock, ResultsSection, FeaturedPostsBlock, FeaturedCaseStudiesBlock, ClientLogosBlock, ContactFormBlock)
- `Section`'s nested `blocks` array recursively calls `RenderBlocks` itself — no duplicated switch logic
- `FeaturedPostsBlock`/`FeaturedCaseStudiesBlock` read from `FeaturedContent` global at render time via `findGlobal`, honoring the single-curation-surface rule
- `ArchiveBlock`'s category filter validates the `?category=` search param against the real fetched categories list before querying (T-05-04-01 mitigation)
- `ContactFormBlock` renders 100% Payload-sourced copy with a swappable no-op `onSubmit` prop, ready for 05-12 to wire Resend

## Task Commits

1. **Task 1: Generic/layout block renderers + RenderBlocks skeleton** - `f4f737d` (feat)
2. **Task 2: Data-driven + featured/client/contact renderers, RenderBlocks finalized** - `e6b8889` (feat)

## Files Created/Modified
- `src/blocks/RenderBlocks.tsx` - block-slug registry
- `src/blocks/*/Component.tsx` - 16 renderer files
- `src/components/RichTextRenderer.tsx` - shared Lexical serializer
- `src/components/CMSLink.tsx` - shared link renderer
- `src/components/PostCard.tsx`, `src/components/CaseStudyCard.tsx` - shared card presentation

## Decisions Made
- lucide-react no longer exports `Linkedin`/`Github` icons (brand icons removed) — substituted `Link2`/`Code2` in `ContactFormBlock`'s icon map; 05-05's Footer/AuthorCard social icons should follow the same substitution
- `RelatedPostsComponent` accepts `currentPostId`/`currentCategoryIds` as extra optional props beyond its Payload block config, since the generic `RenderBlocks` map has no per-request context — the calling page must pass these

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] lucide-react has no `Linkedin`/`Github` exports**
- **Found during:** Task 2 (`npm run build` verification)
- **Issue:** The installed `lucide-react` version removed brand/social icons entirely; importing `Linkedin`/`Github` failed the build
- **Fix:** Substituted `Link2` (linkedin) and `Code2` (github) as generic icon stand-ins
- **Files modified:** src/blocks/ContactFormBlock/Component.tsx
- **Committed in:** e6b8889

**2. [Rule 1 - Bug] `CMSLink`'s `reference` prop type was too strict for Payload's generated union types**
- **Found during:** Task 1 (`npm run build`)
- **Issue:** `CallToAction`'s `linkGroup()`-produced `reference` type (a discriminated union over `pages`/`posts` with `Page`/`Post` values whose `slug` can be `null`) didn't structurally match a narrower hand-written `LinkReference` interface
- **Fix:** Loosened `CMSLinkProps.reference` to accept the shape Payload's generated types actually produce
- **Files modified:** src/components/CMSLink.tsx
- **Committed in:** f4f737d

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both were necessary to get a clean, verifiable `npm run build`. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Every Wave 4 page plan (Home, Blog listing/detail, Case Studies, Authors, Search, Contact) can now compose a `Pages` doc's `content.layout` via `<RenderBlocks blocks={doc.content.layout} />` instead of importing block internals directly.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
