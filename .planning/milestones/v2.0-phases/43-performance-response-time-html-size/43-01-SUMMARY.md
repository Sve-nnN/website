---
phase: 43-performance-response-time-html-size
plan: 01
subsystem: performance
tags: [nextjs, unstable_cache, payload, postgres, cache-invalidation, revalidateTag]

# Dependency graph
requires: []
provides:
  - "src/lib/cache-tags.ts — config-free tag scheme + invalidation hooks, reusable by any future collection/global"
  - "src/lib/cache.ts — unstable_cache-wrapped fetchers (getCachedPageBySlug, getCachedFeaturedContent, getCachedPost, getCachedCaseStudy, getCachedArchive, getCachedRedirectTarget) + PostCardData/CaseStudyCardData narrow types, ready for 43-02/43-03 to import without editing this file again"
  - "Home end-to-end proof of the cache pattern (dedup + select/populate scoping + real hook invalidation)"
affects: [43-02, 43-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "unstable_cache(fn, keyParts, {tags, revalidate}) wrapping Payload Local API calls — data cache, not route cache (routes stay force-dynamic)"
    - "Config-free tag/hook module (cache-tags.ts) separated from the config-importing fetcher module (cache.ts) to avoid the payload.config.ts -> collections -> lib -> @payload-config import cycle"
    - "populate (not select) for scoping fields on documents reached via a relationship from a global/collection query"

key-files:
  created:
    - src/lib/cache-tags.ts
    - src/lib/cache.ts
  modified:
    - "src/app/(frontend)/[locale]/page.tsx"
    - src/blocks/FeaturedPostsBlock/Component.tsx
    - src/blocks/FeaturedCaseStudiesBlock/Component.tsx
    - src/components/PostCard.tsx
    - src/components/CaseStudyCard.tsx
    - src/collections/Pages/index.ts
    - src/collections/Posts/index.ts
    - src/collections/CaseStudies/index.ts
    - src/globals/FeaturedContent/index.ts
    - src/app/api/redirects-lookup/route.ts
    - src/payload.config.ts

key-decisions:
  - "getCachedFeaturedContent uses populate (not select) because featuredPosts/featuredCaseStudies are relationship-populated docs, not the directly-queried collection — populate is Payload's correct mechanism there (confirmed against node_modules/payload/dist/types/index.d.ts: PopulateType = Partial<TypedCollectionSelect>)"
  - "FeaturedPostsBlock/FeaturedCaseStudiesBlock keep filtering with the full Post/CaseStudy type predicate (not PostCardData/CaseStudyCardData) — TS's type-predicate assignability rule (TS2677) rejects a Pick-narrowed type as a predicate against FeaturedContent's static (number | Post)[] field type. PostCard/CaseStudyCard still narrow at their own prop boundary since Post/CaseStudy structurally satisfy the Pick"
  - "getCachedPageBySlug now passes overrideAccess:false explicitly, closing a pre-existing gap: the original getHomePage had no overrideAccess:false at all (unlike src/lib/services-data.ts's established pattern) — folded into this plan's cache wrapping rather than filed separately, since T-43-02 already required it for every new fetcher"
  - "getCachedArchive (Task 1, unwired) branches relationTo with 3 literal payload.find calls instead of one dynamic collection: relationTo call — Payload's generic select type doesn't correlate against a union collection type"

requirements-completed: [PERF-01, PERF-02]

coverage:
  - id: D1
    description: "Home's FeaturedPostsBlock + FeaturedCaseStudiesBlock share one cached getCachedFeaturedContent(locale) call instead of 2 separate findGlobal round-trips per render"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "grep -n getCachedFeaturedContent src/blocks/FeaturedPostsBlock/Component.tsx src/blocks/FeaturedCaseStudiesBlock/Component.tsx (1 match each)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Posts/CaseStudies/Pages afterChange+afterDelete hooks and FeaturedContent afterChange hook call revalidateTag with the correct cache tags"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "grep -n revalidateTag src/lib/cache-tags.ts (7 call sites across pages/posts/case-studies/featured-content/redirects hooks)"
        status: pass
    human_judgment: false
  - id: D3
    description: "getCachedFeaturedContent scopes featuredPosts/featuredCaseStudies via populate to title/slug/excerpt/heroImage and title/slug/sector/heroMetric/client — richText/results.metrics no longer serialize into Home's RSC payload"
    requirement: PERF-02
    verification:
      - kind: other
        ref: "code review of src/lib/cache.ts populate block + PostCardData/CaseStudyCardData Pick types"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every new fetcher in src/lib/cache.ts passes overrideAccess:false explicitly, preventing draft content from being cached and served to anonymous visitors (T-43-02)"
    verification:
      - kind: other
        ref: "grep -n 'overrideAccess: false' src/lib/cache.ts (7 matches across page/featured-content/post/case-study/archive x2/redirect)"
        status: pass
    human_judgment: false
  - id: D5
    description: "/api/redirects-lookup (middleware-transversal, every public request) cached via getCachedRedirectTarget with hook-based invalidation on the redirects collection, T-02-01 open-redirect mitigation preserved verbatim"
    verification:
      - kind: other
        ref: "grep -n 'overrides:' src/payload.config.ts; grep -n getCachedRedirectTarget src/app/api/redirects-lookup/route.ts; grep -n 'SECURITY (T-02-01' src/lib/cache.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "npx tsc --noEmit clean and a real production build (NEXT_PUBLIC_SERVER_URL set, same command Dokploy runs) completes without the circular-import TDZ error class seen in the prior incident"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (exit 0); NEXT_PUBLIC_SERVER_URL=https://juan-tech.com npm run build (32/32 pages generated, no errors)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Real before/after measurement of Home response time + HTML size (npm run start + curl timing/wc -c)"
    verification: []
    human_judgment: true
    rationale: "Local Neon Postgres connectivity failed with ECONNRESET on the one live attempt (same pre-existing intermittent pattern documented in .planning/WINDOWS.md ids 1-3 from Phase 41/42) — deferred to production per plan's explicit MEJOR ESFUERZO clause, which accepts static evidence (dedup/select/tsc, all D1-D6 above) as primary evidence for this phase's closure. A human (or a later phase) should confirm live timing/wc -c against https://juan-tech.com post-deploy."

# Metrics
duration: ~35min
completed: 2026-08-02
status: complete
---

# Phase 43 Plan 01: Cache Infra + Home Tracer Summary

**Deduped, TTL-60s-backstopped `unstable_cache` layer wraps Home's Payload queries end-to-end (dedup + populate/select scoping + real `revalidateTag` invalidation), with the redirects-lookup middleware cache and 3 unwired fetchers (`getCachedPost`/`getCachedCaseStudy`/`getCachedArchive`) staged for 43-02/43-03.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-08-02
- **Tasks:** 2/2 completed
- **Files modified:** 13 (2 created, 11 modified)

## Accomplishments

- Closed the real N+1 on Home: `FeaturedPostsBlock` and `FeaturedCaseStudiesBlock` now share one `getCachedFeaturedContent(locale)` call instead of two independent `payload.findGlobal('featured-content')` round-trips per render.
- Closed the real HTML-size root cause: `getCachedFeaturedContent` uses Payload's `populate` to scope the featured posts/case-studies down to card-display fields only (title/slug/excerpt/heroImage for posts; title/slug/sector/heroMetric/client for case-studies) — richText and `results.metrics` no longer serialize into Home's RSC payload.
- Wired real `afterChange`/`afterDelete` invalidation hooks on Pages, Posts, CaseStudies, and `afterChange` on the FeaturedContent global — the 60s TTL is now a safety net, not the primary freshness mechanism, matching root cause #2 from 43-CONTEXT.md ("cero capa de cache en absoluto").
- Cached the transversal `/api/redirects-lookup` route (hit on every public request via `src/middleware.ts`), with hook-based invalidation wired through `redirectsPlugin`'s `overrides.hooks` — preserved the T-02-01 open-redirect security comment verbatim while moving the query into `src/lib/cache.ts`.
- `src/lib/cache.ts` also ships `getCachedPost`, `getCachedCaseStudy`, and `getCachedArchive` (unwired in this plan) so 43-02/43-03 can import them directly without touching this file again — avoids a file-collision risk across the two follow-up plans.
- `npx tsc --noEmit` clean and a real production build (`NEXT_PUBLIC_SERVER_URL` set, same invocation Dokploy runs) completed cleanly twice (once per task) — explicitly checked for the circular-import TDZ error class from the recent incident; none found.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cache infra + Home end-to-end (dedup + select scoping + invalidation)** - `ea77e94` (feat)
2. **Task 2: Cache transversal del lookup de redirects** - `6b951aa` (feat)

_Note: Plan-metadata commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows separately per `<final_commit>`._

## Files Created/Modified

- `src/lib/cache-tags.ts` - New. Config-free tag scheme (`CACHE_TAGS`) + typed `revalidateTag`-calling hooks (pages/posts/case-studies/featured-content/redirects), importable by collections/globals without triggering the payload.config.ts import cycle.
- `src/lib/cache.ts` - New. `unstable_cache`-wrapped fetchers: `getCachedPageBySlug`, `getCachedFeaturedContent`, `getCachedPost`, `getCachedCaseStudy`, `getCachedArchive`, `getCachedRedirectTarget`, plus `PostCardData`/`CaseStudyCardData` narrow types.
- `src/app/(frontend)/[locale]/page.tsx` - `getHomePage` now delegates to `getCachedPageBySlug('home', locale)` (same signature, both `generateMetadata` and `HomePage` still call it once each per request, second call now hits the Data Cache instead of Postgres).
- `src/blocks/FeaturedPostsBlock/Component.tsx`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx` - Replaced direct `payload.findGlobal` with `getCachedFeaturedContent(locale)`.
- `src/components/PostCard.tsx`, `src/components/CaseStudyCard.tsx` - Prop types narrowed from full `Post`/`CaseStudy` to `PostCardData`/`CaseStudyCardData`.
- `src/collections/Pages/index.ts`, `src/collections/Posts/index.ts`, `src/collections/CaseStudies/index.ts` - Added `hooks.afterChange`/`afterDelete` wired to the corresponding `cache-tags.ts` revalidation functions.
- `src/globals/FeaturedContent/index.ts` - Added `hooks.afterChange` (globals have no `afterDelete`).
- `src/app/api/redirects-lookup/route.ts` - Simplified to call `getCachedRedirectTarget(from)`, query/resolution logic moved into `cache.ts`.
- `src/payload.config.ts` - `redirectsPlugin` now receives `overrides.hooks` for cache invalidation.

## Decisions Made

- `getCachedFeaturedContent` uses `populate` rather than `select` for field scoping — the featured posts/case-studies are relationship-populated documents reached through the global, not the collection being queried directly; `populate` is Payload's documented mechanism for that case (`PopulateType = Partial<TypedCollectionSelect>` confirmed in `node_modules/payload/dist/types/index.d.ts`).
- `FeaturedPostsBlockComponent`/`FeaturedCaseStudiesBlockComponent` filter with the full `Post`/`CaseStudy` type predicate (imported from `@/payload-types`), not the narrower `PostCardData`/`CaseStudyCardData` — TypeScript's type-predicate assignability rule (TS2677) rejects a `Pick`-narrowed type as a predicate against `FeaturedContent`'s static `(number | Post)[]` field type (`PostCardData` is missing required `Post` fields like `content`/`author`/`updatedAt`). `PostCard`/`CaseStudyCard` still narrow correctly at their own prop boundary because `Post`/`CaseStudy` structurally satisfy the `Pick` types (superset assignment is allowed).
- Extended `getCachedPageBySlug` to always pass `overrideAccess: false`, closing a pre-existing gap: the original `getHomePage` had zero `overrideAccess` handling (unlike the established pattern in `src/lib/services-data.ts` since Phase 24's WR-02 fix) — folded into this plan under Rule 2 (T-43-02 already required `overrideAccess: false` on every new fetcher, so this wasn't separately flagged).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type-predicate error on FeaturedPostsBlock/FeaturedCaseStudiesBlock filters**
- **Found during:** Task 1, first `npx tsc --noEmit` run
- **Issue:** Using `PostCardData`/`CaseStudyCardData` directly as the `filter((p): p is PostCardData => ...)` predicate failed TS2677 ("A type predicate's type must be assignable to its parameter's type") because those `Pick`-narrowed types omit fields required by the full `Post`/`CaseStudy` types that `FeaturedContent`'s generated interface declares (`content`, `author`, `updatedAt`, `createdAt`, etc.).
- **Fix:** Kept the filter predicates typed against the full `Post`/`CaseStudy` types (imported from `@/payload-types`), letting `PostCard`/`CaseStudyCard`'s own prop signatures do the narrowing to `PostCardData`/`CaseStudyCardData` — valid because `Post`/`CaseStudy` structurally satisfy those `Pick` types.
- **Files modified:** `src/blocks/FeaturedPostsBlock/Component.tsx`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx`
- **Verification:** `npx tsc --noEmit` clean after the fix; both a production build and grep-based dedup checks confirmed no regression.
- **Committed in:** `ea77e94` (part of Task 1 commit)

**2. [Rule 2 - Missing security control] `getHomePage` was missing `overrideAccess: false`**
- **Found during:** Task 1, reading `src/app/(frontend)/[locale]/page.tsx` before editing
- **Issue:** The pre-existing `getHomePage` query had no `overrideAccess` handling at all — unlike the established Phase 24 (WR-02) pattern in `src/lib/services-data.ts`, meaning Local API's default `overrideAccess: true` could theoretically let a draft Home page leak to anonymous visitors.
- **Fix:** `getCachedPageBySlug` (which `getHomePage` now delegates to) passes `overrideAccess: false` unconditionally, matching every other fetcher in `cache.ts` per T-43-02.
- **Files modified:** `src/lib/cache.ts`, `src/app/(frontend)/[locale]/page.tsx`
- **Verification:** `grep -n "overrideAccess: false" src/lib/cache.ts` confirms 7 matches including the page fetcher; production build succeeded rendering both locale variants of Home.
- **Committed in:** `ea77e94` (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug fix, 1 Rule 2 security gap closure)
**Impact on plan:** Both were necessary for correctness/security, within the exact scope the plan's own threat model (T-43-02) already called for. No scope creep.

## Issues Encountered

Local Neon Postgres connectivity failed with `ECONNRESET` on the one live before/after measurement attempt (`npm run start` against the real production build, then `curl` timing + `wc -c`) — this matches the pre-existing intermittent local-DB pattern already documented in `.planning/WINDOWS.md` (ids 1-3, from Phase 41/42), not a regression introduced by this plan. Per the plan's own acceptance criteria ("MEJOR ESFUERZO... si la conexión local a Neon falla... documentar el intento y diferir la confirmación en vivo a producción"), this does not block plan closure — static evidence (dedup via grep, populate/select scoping via code review, `overrideAccess:false` via grep, `tsc`/production-build clean) is the primary accepted evidence for this phase. Live timing/HTML-size confirmation against `https://juan-tech.com` is deferred to a human or a later phase's production check.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`src/lib/cache.ts`/`cache-tags.ts` are ready for 43-02 (Servicios índice, Blog listing) and 43-03 (post detail, case-study detail) to consume `getCachedPost`, `getCachedCaseStudy`, and `getCachedArchive` directly without editing these two files again — avoiding a file-collision risk if 43-02/43-03 run in parallel. The cache tag scheme (`pages:<slug>`, `posts:all`/`posts:<slug>`, `case-studies:all`/`case-studies:<slug>`, `featured-content`, `redirects`) is established and consistent for those plans to extend.

One open item carried forward: live before/after Home response-time + HTML-size measurement against a running server (local or production) is still needed to close the loop on PERF-01/PERF-02's quantitative claims (baseline was 1.58-2.4s / 276-283KB per 43-CONTEXT.md) — blocked locally by the intermittent Neon connectivity issue, not by anything in this plan's code.

---
*Phase: 43-performance-response-time-html-size*
*Completed: 2026-08-02*

## Self-Check: PASSED

All 13 files created/modified confirmed present on disk; both task commits (`ea77e94`, `6b951aa`) confirmed present in `git log`.
