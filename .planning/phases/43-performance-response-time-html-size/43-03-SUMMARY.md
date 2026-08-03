---
phase: 43-performance-response-time-html-size
plan: 03
subsystem: performance
tags: [nextjs, unstable_cache, payload, postgres, cache-invalidation, lighthouse]

# Dependency graph
requires:
  - "src/lib/cache.ts — getCachedPost, getCachedCaseStudy (built unwired in 43-01, unused until this plan)"
provides:
  - "Post detail (/blog/[slug]) and Case-study detail (/case-studies/[slug]) served from the shared unstable_cache layer"
  - "All 5 tracer routes named in 43-CONTEXT.md (Home, Servicios index, Blog listing, post detail, case-study detail) confirmed wired to src/lib/cache.ts fetchers, zero raw payload.find/findGlobal left on any of them"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Detail-route getX(locale, slug) wrapper functions now just re-order args into the cache.ts fetcher's (slug, locale) signature and return its promise directly — no local payload.find left in either detail route"

key-files:
  modified:
    - "src/app/(frontend)/[locale]/blog/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"

key-decisions:
  - "getPost/getCaseStudy kept as thin same-name wrapper functions (not inlined at call sites) — generateMetadata and the page body both call them, and unstable_cache's own memoization means the second call in the same request hits the cache, not Postgres, so no further dedup was needed inside this plan"
  - "No select scoping applied to either detail fetcher, per 43-01's original design and this plan's own action note — detail views render full richText/content, unlike the card-only listing fetchers that got select scoping in 43-01/43-02"
  - "Live curl timing + Lighthouse mobile comparison against lh-phase36-post.json was attempted once (per plan instruction: try once, don't loop) against a local standalone server — blocked by the same session-wide local Neon ECONNRESET pattern as every other plan in this phase (WINDOWS ids 1-4, 6, 7); deferred to production confirmation post-deploy per the plan's own explicit fallback clause, logged as WINDOWS id 8"

requirements-completed: [PERF-01, PERF-02]

coverage:
  - id: D1
    description: "Post detail (getPost) delegates to getCachedPost(slug, locale), no longer runs its own payload.find"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "grep -n getCachedPost \"src/app/(frontend)/[locale]/blog/[slug]/page.tsx\" (2 matches: import + call)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Case-study detail (getCaseStudy) delegates to getCachedCaseStudy(slug, locale), no longer runs its own payload.find"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "grep -n getCachedCaseStudy \"src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx\" (2 matches: import + call)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 5 tracer routes from 43-CONTEXT.md (Home, Servicios index, Blog listing, post detail, case-study detail) confirmed wired to a getCachedX fetcher from src/lib/cache.ts, no raw payload.find/findGlobal call sites remain on any of them (excluding the two pre-existing, explicitly out-of-scope call sites: getServicePage in services-data.ts and the categories tab-filter list in ArchiveBlock, both documented as out-of-scope in 43-02-SUMMARY.md)"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "final sitewide grep across all 5 tracer route files + their block components, sourced from this plan's own execution — see Verification section below"
        status: pass
    human_judgment: false
  - id: D4
    description: "npx tsc --noEmit clean and a real production build (NEXT_PUBLIC_SERVER_URL set, same command Dokploy runs) completes without the circular-import TDZ error class from the prior incident"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (exit 0, no output); NEXT_PUBLIC_SERVER_URL=https://juan-tech.com npm run build (32/32 pages generated, no errors)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Live curl timing/HTML-size comparison of Home before/after, and Lighthouse mobile regression check against lh-phase36-post.json"
    verification: []
    human_judgment: true
    rationale: "Local Neon Postgres connectivity failed with the same session-wide ECONNRESET pattern documented in WINDOWS.md (ids 1-4, 6, 7) on the one live attempt for this plan (node .next/standalone/server.js started in 274ms, but every request hit read ECONNRESET on Postgres connect within the Payload init path — exact stack trace in the task commit message). Not retried per this plan's explicit instruction to attempt once and defer, not loop. lh-phase43-post.json was NOT created (there is no working local server to point the runner at). Static evidence (mechanism proof via grep across all 5 tracer routes + tsc/build clean, same discipline as 43-01/43-02) is the plan's own pre-authorized accepted evidence when live measurement is blocked by environment, not by code. Deferred to production confirmation post-deploy, same pattern as 43-01's D7 and 43-02's D6."

# Metrics
duration: ~20min
completed: 2026-08-03
status: complete
---

# Phase 43 Plan 03: Post + Case-Study Detail Cache + Phase Close Summary

**Post detail and case-study detail now read from the same `unstable_cache` layer as the rest of the tracer, completing all 5 routes named in 43-CONTEXT.md; live before/after measurement remains blocked by the session-wide local Neon connectivity issue and is deferred to production confirmation post-deploy, same as every other plan in this phase.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-03
- **Tasks:** 2/2 completed
- **Files modified:** 2 (route files) + WINDOWS.md (ledger entry)

## Accomplishments

- `getPost` (`"src/app/(frontend)/[locale]/blog/[slug]/page.tsx"`) now delegates to `getCachedPost(slug, locale)`, removing its own duplicated `payload.find` (previously run twice per request: once in `generateMetadata`, once in the page body).
- `getCaseStudy` (`"src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"`) now delegates to `getCachedCaseStudy(slug, locale)`, same pattern, same duplication removed.
- Both fetchers were already built and hardened in 43-01 (`overrideAccess: false`, `depth: 1` preserved) — this plan only wired real call sites into them, no changes needed inside `src/lib/cache.ts` itself.
- Final sitewide grep confirms all 5 tracer routes from 43-CONTEXT.md now route through `src/lib/cache.ts`:
  - Home (`page.tsx` + both Featured*Block components) → `getCachedPageBySlug` / `getCachedFeaturedContent`
  - Servicios index (`services-data.ts`) → `getCachedPageBySlug`
  - Blog listing (`blog/page.tsx` shell + `ArchiveBlock`) → `getCachedPageBySlug` / `getCachedArchive`
  - Post detail (`blog/[slug]/page.tsx`) → `getCachedPost`
  - Case-study detail (`case-studies/[slug]/page.tsx`) → `getCachedCaseStudy`
  - The only remaining raw `payload.find` calls on these route files are the two pre-existing, explicitly out-of-scope ones documented in 43-02-SUMMARY.md: `getServicePage` (individual service landing, not the index) and `ArchiveBlock`'s categories tab-filter list.
- `npx tsc --noEmit` clean and a real production build (`NEXT_PUBLIC_SERVER_URL=https://juan-tech.com npm run build`, Dokploy's exact invocation) completed cleanly — 32/32 pages generated, no circular-import TDZ errors, closing out the mandatory build-safety check for the phase.
- Reconfirmed current production baseline against the still-undeployed old code: 2 fresh `curl` runs against `https://juan-tech.com/` measured 2.79s and 2.54s response time, 282,724–282,810 bytes of HTML — consistent with 43-CONTEXT.md's documented pre-Phase-43 baseline (1.58–2.4s, 276–283KB). This is supplementary context only, not a before/after of this phase's changes, since none of Phase 43's code is deployed yet.

## Task Commits

Each task was committed atomically:

1. **Task 1: Post detail — cachear getPost** - `feeb7d5` (feat)
2. **Task 2: Case-study detail — cachear getCaseStudy + verificación final de fase** - `77bd98a` (feat)

_Note: Plan-metadata commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows separately per `<final_commit>`._

## Files Created/Modified

- `"src/app/(frontend)/[locale]/blog/[slug]/page.tsx"` - `getPost` delegates to `getCachedPost(slug, locale)`; removed direct `getPayload`/`config` imports (no longer needed).
- `"src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"` - `getCaseStudy` delegates to `getCachedCaseStudy(slug, locale)`; removed direct `getPayload`/`config` imports.
- `.planning/WINDOWS.md` - new `unrun-verify` entry (id 8) for the blocked live Lighthouse/timing comparison, deferred to production.

## Decisions Made

- Kept `getPost`/`getCaseStudy` as thin wrapper functions with the same name and `(locale, slug)` argument order as before, just re-ordering into the cache fetcher's `(slug, locale)` signature — `generateMetadata` and the page body both still call the same wrapper name, so no other code in either file needed to change.
- No `select` scoping was added to either detail fetcher — this matches 43-01's original design (detail views render the full `content`/richText, unlike card-only listing views) and this plan's own action note explicitly said not to apply select here.
- Live measurement (curl timing, HTML byte count, Lighthouse mobile regression check) was attempted once against a local standalone server per the plan's explicit instruction ("try once, don't loop"). It hit the same `read ECONNRESET` on Postgres connect that has blocked every live-verification attempt across this entire phase (WINDOWS.md ids 1-4, 6, 7). Rather than retry, this was documented as WINDOWS id 8 and deferred to production confirmation post-deploy, per the plan's own pre-authorized fallback clause. `lh-phase43-post.json` was not created since there was no working server to point the runner at — creating an empty or fabricated file would misrepresent the evidence.

## Deviations from Plan

None - plan executed exactly as written, including its own explicit fallback-to-static-evidence clause for the live measurement step.

## Issues Encountered

Local Neon Postgres connectivity failed again with the same session-wide `ECONNRESET` pattern documented in `.planning/WINDOWS.md` (ids 1-4, 6, 7 — spanning Phases 41-43) on the one live verification attempt for this plan:

```
[21:44:44] ERROR: Error: cannot connect to Postgres. Details: read ECONNRESET
    errno: -54, code: 'ECONNRESET', syscall: 'read'
```

Sequence: `node .next/standalone/server.js` (with `NEXT_PUBLIC_SERVER_URL=https://juan-tech.com`) started cleanly in 274ms; the first `curl` request to `/` hung and timed out at 20s with `HTTP 000`; the server log showed the Postgres connection failing during Payload's init path (triggered by the middleware's `/api/redirects-lookup` call, same failure point documented in 43-02's own issues section). Per this plan's explicit instruction, this was not retried further.

`lh-phase43-post.json` was NOT produced this plan — there was no working local server to run `scripts/lighthouse-mobile.mjs` against. This is logged as WINDOWS id 8 (`unrun-verify`), same class as ids 6/7 from 43-01/43-02.

Static evidence is the accepted primary evidence per this plan's own explicit acceptance criteria: `tsc --noEmit` clean, production build clean (32/32 pages), all grep acceptance criteria pass for both tasks, and the final cross-route grep confirms all 5 tracer routes are wired to cached fetchers with zero regressions to the security guard (`overrideAccess: false` preserved on both new call sites, inherited unchanged from the 43-01 fetchers).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 43's tracer (5 routes: Home, Servicios index, Blog listing, post detail, case-study detail) is fully wired end-to-end to `src/lib/cache.ts`. Three items remain open in `.planning/WINDOWS.md` (ids 6, 7, 8), all the same root cause (local Neon ECONNRESET blocking live verification across every plan in this phase), all deferred to a single consolidated live verification pass once local Neon connectivity stabilizes or against `https://juan-tech.com` post-deploy — covering:

- Home + Servicios + Blog listing before/after response-time and HTML-size (43-01/43-02's open items)
- Post detail + case-study detail cache-hit-is-faster verification (this plan's Task 1/2 acceptance criteria)
- Full Lighthouse mobile comparison of all 6 default routes against `lh-phase36-post.json` (`.planning/milestones/v1.7-phases/36-regression-gate/lh-phase36-post.json`)

Recommended single command sequence for that consolidated pass, once connectivity is confirmed (or run against production post-deploy):
```bash
npm run build && node .next/standalone/server.js &
curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000/   # 1st (cold)
curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000/   # 2nd (warm/cached)
curl -s http://localhost:3000/ | wc -c
node scripts/lighthouse-mobile.mjs --base-url http://localhost:3000 --out .planning/phases/43-performance-response-time-html-size/lh-phase43-post.json
```

Rollout to the remaining ~19 sitewide routes (deferred per 43-CONTEXT.md's own scope boundary) is a good candidate for a future phase once this tracer's live numbers are confirmed clean.

---
*Phase: 43-performance-response-time-html-size*
*Completed: 2026-08-03*

## Self-Check: PASSED

Both modified files (`"src/app/(frontend)/[locale]/blog/[slug]/page.tsx"`, `"src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"`) confirmed present on disk; both task commits (`feeb7d5`, `77bd98a`) confirmed present in `git log`.
