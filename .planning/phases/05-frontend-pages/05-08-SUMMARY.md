---
phase: 05-frontend-pages
plan: 08
subsystem: ui
tags: [payload, e-e-a-t, hero-fallback, blog-post-detail]

requires:
  - phase: 05-05
    provides: AuthorByline/AuthorCard, getFallbackHeroImage
  - phase: 05-04
    provides: RelatedPosts/TableOfContentsBlock renderers, RichTextRenderer
provides:
  - Full blog post detail page (hero fallback, byline, content, AuthorCard, related posts, TOC)
affects: [05-13]

tech-stack:
  added: []
  patterns:
    - "Non-Pages-collection routes (blog post detail) call block Component.tsx renderers directly with manually-constructed props (blockType included to satisfy generated types) rather than going through RenderBlocks"
    - "Reading time computed via a plain-text extraction over the Lexical JSON tree, word count / 200wpm, no new dependency"

key-files:
  modified:
    - src/app/(frontend)/[locale]/blog/[slug]/page.tsx

key-decisions:
  - "RelatedPostsComponent/TableOfContentsBlockComponent called directly (not via RenderBlocks) since this page isn't a Pages-collection doc with a content.layout array"

patterns-established: []

requirements-completed: [CONT-01, CONT-02]

duration: 30min
completed: 2026-07-09
---

# Phase 5 Plan 08: Blog Post Detail Summary

**Full post detail page — deterministic hero-image fallback, compact + expanded author E-E-A-T components, rich-text content, related posts, and table of contents — verified end-to-end against real migrated content.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- Replaced the bare-bones Phase 2 post page (title/excerpt/author-name) with the full detail experience
- Hero renders `getFallbackHeroImage(doc.slug)` whenever `heroImage` is null — true for all real migrated posts
- `AuthorByline` in the hero, full `AuthorCard` below the content — both read real Authors E-E-A-T data
- Reading time computed via a plain-text word-count estimate over the Lexical JSON tree (no new dependency)
- `RelatedPostsComponent`/`TableOfContentsBlockComponent` called directly with manually-constructed props (this route isn't a Pages doc)
- Verified against a real running server on a real migrated post (`tablas-hash`): fallback image renders, real bio/reading-time/TOC render correctly; related posts correctly renders nothing for a post with 0 assigned categories (no fabricated matches)

## Task Commits

1. **Task 1 + Task 2 combined: Hero/byline/content + AuthorCard/RelatedPosts/TOC** - `dcd98ae` (feat)

_Note: both tasks touched the same single file (`page.tsx`); committed together after full verification rather than splitting an in-progress file across two commits._

## Files Created/Modified
- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` - full rewrite of the post detail body, preserving existing `getPost`/`generateMetadata`/Article JSON-LD

## Decisions Made
- `blockType` literal strings added to the manually-constructed props passed to `RelatedPostsComponent`/`TableOfContentsBlockComponent` purely to satisfy Payload's generated block types (unused by either renderer's logic)

## Deviations from Plan

None beyond the type-satisfying `blockType` prop additions (mechanical TypeScript requirement, not a behavior change).

## Issues Encountered
- The test post (`tablas-hash`) has 0 assigned categories in the real database, so `RelatedPostsComponent` correctly renders nothing (by design — no category overlap possible). Verified this is real-data behavior, not a bug, by checking the post's actual `categories` field via Local API.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Post detail page is real and content-driven, ready for 05-13's bilingual QA pass. Authors with populated `credentials`/`socialLinks` (currently empty for the sole real author, Juan Carlos Angulo) will show the full expanded set once an editor fills those fields in — the components already render them conditionally.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
