---
phase: 02-biling-e-seo
plan: 4
subsystem: seo
tags: [nextjs, metadata-route, payload-local-api, sitemap, robots, llms-txt, geo]

requires:
  - phase: 02-biling-e-seo (02-02)
    provides: Llms global (llmsTxt/llmsFull fields), Pages/Posts/CaseStudies/Authors/Categories schema with slug + versions.drafts
provides:
  - MetadataRoute.Sitemap default export merging pages/posts/case-studies/authors/categories with hreflang alternates (es/en)
  - MetadataRoute.Robots default export disallowing /admin and /api, referencing /sitemap.xml
  - GET /llms.txt reading Llms.llmsTxt via payload.findGlobal, force-dynamic
  - GET /llms-full.txt reading Llms.llmsFull via payload.findGlobal, force-dynamic
affects: [02-05 (seed/verification), 05-frontend (public routes), 06-deploy]

tech-stack:
  added: []
  patterns:
    - "Native Next.js MetadataRoute file conventions (sitemap.ts, robots.ts) instead of a sitemap plugin — none exists for Payload 3"
    - "payload.find({ collection, locale: 'all', where: { _status: { equals: 'published' } } }) for draft-aware public sitemap queries"
    - "Route handlers with export const dynamic = 'force-dynamic' reading Payload globals directly via payload.findGlobal for always-fresh admin-edited text files"

key-files:
  created:
    - src/app/sitemap.ts
    - src/app/robots.ts
    - src/app/llms.txt/route.ts
    - src/app/llms-full.txt/route.ts
  modified: []

key-decisions:
  - "Collection-to-prefix map (pages: '', posts: 'blog', case-studies: 'case-studies', authors: 'authors', categories: 'categories') kept in sync with 02-03's middleware redirect resolver, per plan interfaces contract"
  - "_status: { equals: 'published' } filter applied only to pages/posts/case-studies (collections with versions.drafts); authors/categories have no draft/publish field, so no where clause is applied to avoid a query error"
  - "Home page (pages collection, slug 'home') maps to site root ('' path) rather than /home, both for es (SITE_URL) and en (SITE_URL/en) alternates"

patterns-established:
  - "SITEMAP_COLLECTIONS typed array (not a generic Record loop) used in sitemap.ts so the collection-to-prefix-to-drafts mapping is both type-safe (literal union on collection slugs) and grep-verifiable"

requirements-completed: [I18N-03, I18N-04]

duration: 15min
completed: 2026-07-09
---

# Phase 02 Plan 4: Sitemap, robots.txt, llms.txt/llms-full.txt Summary

**Hand-written Next.js MetadataRoute + Payload Local API routes for /sitemap.xml, /robots.txt, /llms.txt, and /llms-full.txt — no plugins, all four SEO/GEO discoverability endpoints reading live content directly.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-09T20:20:00Z
- **Completed:** 2026-07-09T20:33:42Z
- **Tasks:** 2
- **Files modified:** 4 (all new)

## Accomplishments
- `src/app/sitemap.ts` merges pages/posts/case-studies/authors/categories via `payload.find({ locale: 'all' })`, with a published-only filter on the three drafts-enabled collections and `alternates.languages` (es/en) on every entry
- `src/app/robots.ts` uses the native `MetadataRoute.Robots` convention, disallows `/admin` and `/api`, and points to `/sitemap.xml`
- `src/app/llms.txt/route.ts` and `src/app/llms-full.txt/route.ts` are force-dynamic route handlers reading the `Llms` global (`llmsTxt`/`llmsFull`) so admin edits appear immediately without redeploy

## Task Commits

Each task was committed atomically:

1. **Task 1: sitemap.ts and robots.ts** - `1d3a615` (feat)
2. **Task 2: llms.txt and llms-full.txt route handlers** - `f87dee7` (feat)

_No plan-metadata commit for STATE.md/ROADMAP.md — orchestrator updates those centrally after both Wave 2 plans (02-03, 02-04) complete, per sequential_execution instructions._

## Files Created/Modified
- `src/app/sitemap.ts` - Default export queries all 5 content collections via Local API, builds hreflang-aware sitemap entries
- `src/app/robots.ts` - Default export with allow-all rule minus /admin and /api, references sitemap.xml
- `src/app/llms.txt/route.ts` - GET handler serving `Llms.llmsTxt` as plain text, force-dynamic
- `src/app/llms-full.txt/route.ts` - GET handler serving `Llms.llmsFull` as plain text, force-dynamic

## Decisions Made
- Confirmed via reading `src/collections/Authors/index.ts` and `src/collections/Categories/index.ts` that neither has a `versions` block, so no `_status` filter is applied to those two queries (matches plan's explicit interface contract).
- Used a typed array (`SITEMAP_COLLECTIONS`) rather than a plain object/Record for the collection-prefix-drafts mapping, giving TypeScript a literal union on `collection` (satisfies Payload's `find({ collection })` overloads without an `any` cast) while still keeping the source readable and matching the plan's grep-based verification pattern.

## Deviations from Plan

None - plan executed exactly as written (interface/reference shapes for `llms.txt`/`llms-full.txt` followed verbatim per plan's `<interfaces>` block).

## Issues Encountered
None. `npx tsc --noEmit` reported zero errors across the whole project after adding all four files.

## User Setup Required
None - no external service configuration required. All four routes use only the already-configured Payload Local API and `NEXT_PUBLIC_SERVER_URL` env var (falls back to `https://juancarlosangulo.com` if unset).

## Next Phase Readiness
- All four SEO/GEO discoverability routes exist and type-check cleanly; runtime verification (curl 200s, content reflecting seeded docs) is explicitly deferred to 02-05 per this plan's `<verification>` section, since no content is seeded yet.
- No blockers for 02-05. This plan's files (`sitemap.ts`, `robots.ts`, `llms.txt/route.ts`, `llms-full.txt/route.ts`) do not overlap with 02-03's `[locale]`/middleware work, confirmed disjoint at plan time and no conflicts arose during execution.

---
*Phase: 02-biling-e-seo*
*Completed: 2026-07-09*
