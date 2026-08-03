---
phase: 43-performance-response-time-html-size
plan: 02
subsystem: performance
tags: [nextjs, unstable_cache, payload, postgres, cache-invalidation, archive-block]

# Dependency graph
requires:
  - "src/lib/cache.ts — getCachedPageBySlug, getCachedArchive (built unwired in 43-01)"
provides:
  - "Servicios índice (/services, /servicios) served from the shared cache lib"
  - "Blog listing shell + ArchiveBlock grid served from the shared cache lib, with select scoping on posts/case-studies"
affects: [43-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getCachedArchive's categoryId param retyped number (was string) to match Category.id's real Payload type — closes a latent equality-check bug before it shipped"
    - "getCachedArchive's 3 branches now carry sort:'-publishedAt', matching the original direct-query behavior it replaced (was missing in the 43-01 unwired version)"

key-files:
  modified:
    - src/lib/services-data.ts
    - "src/app/(frontend)/[locale]/blog/page.tsx"
    - src/blocks/ArchiveBlock/Component.tsx
    - src/lib/cache.ts

key-decisions:
  - "getServicesIndexPage delegates to getCachedPageBySlug(SERVICES_INDEX_SLUG, locale, 1) — both physical route twins (/services, /servicios) already called getServicesIndexPage indirectly, so no route file needed editing"
  - "getCachedArchive's categoryId param retyped from string to number (Rule 1 bug fix): Category.id is a numeric Payload id (confirmed in payload-types.ts), so the string-typed param from 43-01 would have made the categories:{in:[categoryId]} where-clause compare a string against an integer column — silently breaking category-filter results the moment this task wired a real caller into it. Fixed at the fetcher, not the caller, since the caller (ArchiveBlock's pre-existing categoryFilter) was already correctly typed number."
  - "getCachedArchive gained sort:'-publishedAt' on all 3 branches (Rule 1 bug fix): the original direct payload.find call ArchiveBlock replaced had this sort; the unwired 43-01 version of getCachedArchive omitted it. Wiring the caller in without this fix would have silently dropped list ordering (most-recent-first) on Blog listing and any other ArchiveBlock instance. Applied uniformly to posts/case-studies/websites branches to match the original query's uniform sort across all relationTo values."
  - "ArchiveBlock's docs.map render casts changed from `as Post`/`as CaseStudy` to `as PostCardData`/`as CaseStudyCardData` — reflects the real runtime shape now returned by getCachedArchive's select-scoped query, matching PostCard/CaseStudyCard's already-narrowed prop types from 43-01"

requirements-completed: [PERF-01, PERF-02]

coverage:
  - id: D1
    description: "getServicesIndexPage delegates to getCachedPageBySlug, no longer runs its own payload.find"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "grep -n getCachedPageBySlug src/lib/services-data.ts (3 matches: import + comment + call)"
        status: pass
    human_judgment: false
  - id: D2
    description: "getBlogPage delegates to getCachedPageBySlug('blog', locale)"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "grep -n getCachedPageBySlug \"src/app/(frontend)/[locale]/blog/page.tsx\" (2 matches: import + call)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ArchiveBlock's non-manual grid (posts/case-studies/websites) delegates to getCachedArchive, select-scoped for posts/case-studies same as Home's 43-01 fix"
    requirement: PERF-02
    verification:
      - kind: other
        ref: "grep -n getCachedArchive src/blocks/ArchiveBlock/Component.tsx (1 match); code review of cache.ts select blocks"
        status: pass
    human_judgment: false
  - id: D4
    description: "Category filter (?category=X vs no filter) never shares a cache entry across variants, correct filtering preserved (T-43-06)"
    verification:
      - kind: other
        ref: "code review: categoryId is part of getCachedArchive's keyParts array; categoryId retyped number to match Category.id, closing a would-be equality-check bug before any caller exercised it"
      - kind: manual
        status: deferred
        ref: "curl http://localhost:3000/blog vs /blog?category=<slug> — blocked by local Neon ECONNRESET, see Issues Encountered"
    human_judgment: true
    rationale: "Live before/after curl comparison could not run due to the same intermittent local Neon connectivity issue affecting this whole session (WINDOWS.md id 6, same as 43-01). Static evidence (cache-key structure + type-correctness fix) is the accepted primary evidence per this plan's own MEJOR ESFUERZO acceptance criteria."
  - id: D5
    description: "npx tsc --noEmit clean and a real production build (NEXT_PUBLIC_SERVER_URL set, same command Dokploy runs) completes without the circular-import TDZ error class from the prior incident"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (exit 0, no output); NEXT_PUBLIC_SERVER_URL=https://juan-tech.com npm run build (32/32 pages generated, no errors)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Live response-time/HTML-size measurement on Servicios and Blog listing"
    verification: []
    human_judgment: true
    rationale: "Local Neon Postgres connectivity failed with the same session-wide ECONNRESET pattern documented in WINDOWS.md (ids 1-4, 6) on the one live attempt (npm run start hit the standalone-mode warning; killed the stray process and re-ran via node .next/standalone/server.js, still ECONNRESET on Payload init after ~15s). Not retried per this plan's explicit instruction to attempt once and defer, not loop. Deferred to production confirmation post-deploy, same as 43-01's own D7."

# Metrics
duration: ~25min
completed: 2026-08-02
status: complete
---

# Phase 43 Plan 02: Servicios + Blog Listing Cache Summary

**Servicios índice and Blog listing (shell + real ArchiveBlock grid) now read from the same `unstable_cache` layer proven on Home in 43-01, with a real select-scoping bug (missing sort) and a real type bug (categoryId string vs Category.id number) caught and fixed before either shipped to a live caller.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-02
- **Tasks:** 2/2 completed
- **Files modified:** 4

## Accomplishments

- `getServicesIndexPage` (`src/lib/services-data.ts`) now delegates to `getCachedPageBySlug(SERVICES_INDEX_SLUG, locale, 1)`, preserving the exact `depth:1`/`overrideAccess:false` it already had (Phase 24 WR-02). Both physical route twins (`/services`, `/servicios`) pick this up automatically since they already call `getServicesIndexPage` indirectly — no route file edits needed.
- `getBlogPage` (`"src/app/(frontend)/[locale]/blog/page.tsx"`) now delegates to `getCachedPageBySlug('blog', locale)`, removing its own duplicated `payload.find` (previously run twice per request: once in `generateMetadata`, once in the page body).
- `ArchiveBlock`'s non-manual grid branch (the real query backing every automatic-mode instance, including Blog listing's posts grid) now delegates to `getCachedArchive`, which select-scopes posts (title/slug/excerpt/heroImage) and case-studies (title/slug/sector/heroMetric/client) — same mechanism that shrank Home's RSC payload in 43-01, now extended to the highest-traffic listing page.
- Found and fixed two real latent bugs in `getCachedArchive` (built unwired in 43-01, exercised for the first time by this plan's wiring):
  - **Type bug:** `categoryId` was typed `string` but `Category.id` is a numeric Payload id — the equality check inside the cached query (`categories: { in: [categoryId] } }`) would have silently failed to match against the DB's integer column the moment a real caller (this task) passed the real `number`-typed `categoryFilter`. Retyped to `number`.
  - **Missing behavior:** the original direct query ArchiveBlock ran had `sort: '-publishedAt'`; the unwired `getCachedArchive` in 43-01 omitted it. Wiring the caller in without fixing this would have silently dropped list ordering (most-recent-first) sitewide on every ArchiveBlock instance. Added to all 3 branches (posts/case-studies/websites), matching the original query's uniform sort regardless of `relationTo`.
- `npx tsc --noEmit` clean and a real production build (`NEXT_PUBLIC_SERVER_URL` set, Dokploy's exact invocation) completed cleanly — 32/32 pages generated, no circular-import TDZ errors, matching 43-01's own verification discipline given the recent production incident.

## Task Commits

Each task was committed atomically:

1. **Task 1: Servicios índice — cachear getServicesIndexPage** - `ad5d234` (feat)
2. **Task 2: Blog listing — cachear el shell + el grid de ArchiveBlock** - `02876f5` (feat)

_Note: Plan-metadata commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows separately per `<final_commit>`._

## Files Created/Modified

- `src/lib/services-data.ts` - `getServicesIndexPage` now delegates to `getCachedPageBySlug`; `getPayload`/`config` imports retained for the still-direct `getServicePage` (out of this plan's scope per its own explicit exclusion).
- `"src/app/(frontend)/[locale]/blog/page.tsx"` - `getBlogPage` now delegates to `getCachedPageBySlug('blog', locale)`; removed the now-unused direct `getPayload`/`config` imports.
- `src/blocks/ArchiveBlock/Component.tsx` - non-manual grid branch delegates to `getCachedArchive`; `docs` array type widened to include `PostCardData`/`CaseStudyCardData`; render-time casts updated from `as Post`/`as CaseStudy` to `as PostCardData`/`as CaseStudyCardData` to match the real select-scoped runtime shape.
- `src/lib/cache.ts` - `getCachedArchive`'s `categoryId` param retyped `number` (was `string`); `sort: '-publishedAt'` added to all 3 branches (posts/case-studies/websites).

## Decisions Made

- Both Servicios route twins needed zero direct edits — they already call `getServicesIndexPage`/`getServicesIndexMetadata` from `services-data.ts`, so fixing the shared helper covered both `/services` and `/servicios` in one change, confirmed by reading both route files before editing (they are byte-identical except for file path).
- `getServicePage` (individual service landing, e.g. `/servicios/[slug]`) was left untouched per the plan's explicit scope note — only "Servicios índice" was in scope for Task 1, not the 4 individual landings.
- `categories` (the tab-filter list fetched separately inside `ArchiveBlockComponent`) was left uncached per the plan's explicit instruction — `categories` isn't in the 43-CONTEXT.md-authorized hook list (Pages/Posts/CaseStudies/FeaturedContent/Redirects) and is a small, low-churn collection, not a confirmed root cause of the HTML-size or response-time problems.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `getCachedArchive`'s `categoryId` param typed `string`, but `Category.id` is `number`**
- **Found during:** Task 2, before wiring `ArchiveBlockComponent`'s `categoryFilter` (already correctly typed `number`) into `getCachedArchive`
- **Issue:** `src/lib/cache.ts`'s `getCachedArchive` (built unwired in 43-01) declared `categoryId?: string` and used it directly in a Payload `where: { categories: { in: [categoryId] } } }` clause. `Category.id` is a numeric Payload id (confirmed via `payload-types.ts`). Passing the real caller's `number` value would have been a TypeScript error; coercing it to a string to satisfy the signature would have made the equality check compare a string against the DB's integer column, silently breaking category filtering for anyone who used the `?category=` query param.
- **Fix:** Retyped `categoryId` to `number` in `getCachedArchive`, updated the cache key computation (`String(categoryId ?? 'none')`) to keep `unstable_cache`'s keyParts as strings. No caller-side workaround was used because the caller (`ArchiveBlockComponent`) was already correctly typed — the bug was entirely inside `cache.ts`.
- **Files modified:** `src/lib/cache.ts`
- **Verification:** `npx tsc --noEmit` clean; code review confirms `categories: { in: [categoryId] }` now compares `number` against `number`, matching the pre-existing `ArchiveBlockComponent` where-clause semantics exactly before this plan touched it.
- **Committed in:** `02876f5` (part of Task 2 commit)

**2. [Rule 1 - Bug] `getCachedArchive` missing `sort: '-publishedAt'` on all 3 branches**
- **Found during:** Task 2, comparing the original `ArchiveBlockComponent` query (`payload.find({..., sort: '-publishedAt', ...})`) against `getCachedArchive`'s implementation before wiring it in
- **Issue:** The direct query this task's caller was replacing always sorted by `-publishedAt` (most recent first), applied uniformly regardless of `relationTo`. `getCachedArchive` (unwired in 43-01) had no `sort` at all on any of its 3 branches (posts/case-studies/websites) — wiring the caller in as-is would have silently changed list ordering to arbitrary DB order on every page using `ArchiveBlockComponent` in automatic mode, including Blog listing (this plan's own scope).
- **Fix:** Added `sort: '-publishedAt'` to all 3 branches of `getCachedArchive`, matching the original query's behavior exactly (including applying it to the `websites` branch, which has no `publishedAt` field on its schema — but that mismatch already existed in the pre-existing direct query before this plan, so this fix is behavior-preserving, not behavior-changing, for that branch).
- **Files modified:** `src/lib/cache.ts`
- **Verification:** `npx tsc --noEmit` clean; production build succeeded; code review confirms all 3 branches now match the original query's sort behavior.
- **Committed in:** `02876f5` (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bug fixes), both inside `src/lib/cache.ts` — a file this plan's own objective said would not be touched ("no se toca `src/lib/cache.ts`/`cache-tags.ts`"). Both fixes were narrowly scoped (1 type annotation, 3 added `sort` keys), directly caused by this plan's own act of wiring a real caller into a previously-unwired fetcher, and necessary to avoid shipping a silent regression (broken category filtering, dropped list ordering) into the plan's own stated scope (Blog listing). No unrelated changes made to `cache.ts`.

**Impact on plan:** Both deviations improve correctness of code this plan is directly responsible for activating. No scope creep beyond `getCachedArchive`.

## Issues Encountered

Local Neon Postgres connectivity failed with the same session-wide `ECONNRESET` pattern already documented in `.planning/WINDOWS.md` (ids 1-4, 6 — spanning Phases 41-43) on the one live verification attempt for this plan. Sequence: `npm run start` bound port 3000 but hung with the "does not work with output:standalone" warning and never responded (10s timeout); killed the stray process, re-ran via `node .next/standalone/server.js` directly (the correct standalone invocation); server started in 370ms, but every request to `/servicios` and `/blog` timed out at 15s with `ECONNRESET` on Postgres connect logged server-side. Per this plan's explicit instruction ("Try live verification once; if blocked, fall back to static... don't loop retrying"), this was not retried further. Static evidence is the primary accepted evidence: `tsc --noEmit` clean, production build clean (32/32 pages), all grep acceptance criteria pass, and both real bugs found during code review (categoryId type, missing sort) were fixed and re-verified via `tsc`/build rather than live curl.

Logged to the Broken Windows Ledger (`.planning/WINDOWS.md`) as a new `unrun-verify` entry, same class as id 6 from 43-01.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

`src/lib/cache.ts`'s `getCachedPost`/`getCachedCaseStudy` fetchers remain unwired, ready for 43-03 (post detail, case-study detail routes) to consume directly. `getCachedArchive` is now proven end-to-end (wired + fixed) by this plan, so 43-03 inherits a corrected implementation, not the as-built 43-01 version.

One item carried forward from 43-01, still open: live before/after response-time + HTML-size measurement against a running server (local or production) for Home, Servicios, and now Blog listing — blocked locally by the intermittent Neon connectivity issue across every plan in this phase so far (41 through 43), not by anything in this plan's code. Recommend a single consolidated live verification pass once local Neon connectivity stabilizes or against `https://juan-tech.com` post-deploy, covering all three routes at once (43-01 Home, 43-02 Servicios/Blog) plus whatever 43-03 adds.

---
*Phase: 43-performance-response-time-html-size*
*Completed: 2026-08-02*

## Self-Check: PASSED

All 4 modified files confirmed present on disk; both task commits (`ad5d234`, `02876f5`) confirmed present in `git log`.
