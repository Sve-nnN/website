---
phase: 42-meta-tags-completion
plan: 03
subsystem: seo
tags: [nextjs, metadata, canonical, hreflang, alternates]

# Dependency graph
requires:
  - phase: 42-meta-tags-completion (plan 02)
    provides: "buildAlternates(locale, esPath, enPath) generic helper in src/lib/canonical.ts, reused here without redefinition"
provides:
  - "alternates.canonical/alternates.languages wired into the last 6 of 15 direct-coverage gap routes: Blog post, Case Study, Author, Website detail templates + seo-tecnico-lima/seo-tecnico-madrid geo-pages"
  - "Sitewide zero-gap confirmation: all 19 public route types now emit alternates.canonical (15 direct via buildAlternates, 4 indirect via the pre-existing buildServiceAlternates for Servicios/Services)"
affects: [meta-tags-completion, seo-audit, ship-phase-42]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Detail-route canonical esPath/enPath is always derived from the exact same route slug param expression that route file's pre-existing buildOpenGraph({ url }) call already uses, never doc.slug ?? slug — guarantees canonical and og:url can never diverge for the same rendered page"

key-files:
  created: []
  modified:
    - "src/app/(frontend)/[locale]/blog/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/authors/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/websites/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx"
    - "src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx"

key-decisions:
  - "Reused Plan 42-02's buildAlternates helper unmodified — no new helper code needed, purely mechanical wiring across 6 files"
  - "Each detail route's esPath/enPath literal was taken from that file's own pre-existing url: computation (used by buildOpenGraph), not re-derived independently, so canonical and og:url can never point at two different URLs for the same page"
  - "Live curl verification (Task 3) deferred a second time in this sandbox — same session-wide local Neon Postgres connectivity blocker as Phase 41/Plan 42-01/42-02 recurred despite WINDOWS.md ids 1-3 being marked fixed earlier the same day; logged as new WINDOWS.md id 4 (open) rather than retried beyond the one bounded attempt the environment note specified"

patterns-established: []

requirements-completed: [META-01]

coverage:
  - id: D1
    description: "Blog post, Case Study, Author, and Website detail templates each emit a correct, slug-matched alternates.canonical mirroring their existing og:url"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json (exit 0) + grep -c 'buildAlternates(' per file (all 4 == 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "seo-tecnico-lima and seo-tecnico-madrid each emit a correct alternates.canonical with the same URL segment across locales (only /en prefix differs)"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json (exit 0) + grep -c 'buildAlternates(' per file (both == 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sitewide zero-gap confirmation: all 19 public route types emit alternates.canonical (15 direct + 4 indirect via services-data.ts)"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "comm -23 <(grep -rl generateMetadata src/app/(frontend)) <(grep -rl alternates src/app/(frontend)) -- lists exactly the 4 expected Servicios/Services files, zero unexpected entries"
        status: pass
    human_judgment: false
  - id: D4
    description: "Live curl sweep confirms canonical renders correctly across Home/static-page/geo-page/detail-page/Servicios route types with zero regression to Plan 42-01's favicon/manifest/theme-color work"
    requirement: "META-01"
    verification: []
    human_judgment: true
    rationale: "Task 3's own <verify> requires a live dev server + real Postgres connection. Local Neon Postgres connectivity failed again in this sandbox (npm run dev hung 15s+ on the middleware /api/redirects-lookup DB call, no response) -- same class of blocker as WINDOWS.md ids 1-3, now logged as id 4 (open). Static verification (tsc clean, grep confirms manifest/themeColor in layout.tsx, all 6 buildAlternates( calls present) is complete, but the plan's live-render acceptance criteria genuinely require a human/production re-run to confirm."

# Metrics
duration: 8min
completed: 2026-08-01
status: complete
---

# Phase 42 Plan 03: Detail Routes + Geo-Pages Canonical (Phase 42 Close-Out) Summary

**Wired `alternates.canonical`/`alternates.languages` into the last 6 gap routes (Blog post, Case Study, Author, Website detail templates + Lima/Madrid geo-pages) via the existing `buildAlternates` helper, closing META-01 sitewide — all 19 public route types now emit a correct canonical tag.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-08-01T15:44:00Z (approx)
- **Completed:** 2026-08-01T15:48:35Z
- **Tasks:** 3 completed (2 code tasks + 1 verification-only task)
- **Files modified:** 6

## Accomplishments
- Blog post, Case Study, Author, and Website detail templates each now return a locale-aware, slug-matched `alternates.canonical`/`alternates.languages` object, mirroring the exact `slug` route-param expression each file's pre-existing `buildOpenGraph({ url })` call already used
- `seo-tecnico-lima` and `seo-tecnico-madrid` geo-pages now return `alternates.canonical` using the same URL segment across locales (only the `/en` prefix differs), matching the Phase 20 URL decision already baked into those routes
- Sitewide gap check (`comm -23` of `generateMetadata` files vs. `alternates` files) confirms zero unexpected gaps — the only 4 remaining files are the Servicios/Services routes, which are covered indirectly via the pre-existing `buildServiceAlternates` mechanism in `src/lib/services-data.ts`
- All 19 public route types now emit `alternates.canonical`: 15 direct via `buildAlternates` (9 from Plan 42-02 + 6 from this plan) and 4 indirect via `buildServiceAlternates` — closing META-01 sitewide and ROADMAP Phase 42's remaining success criteria (pending live-render confirmation, see Issues Encountered)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire the 4 doc-backed detail routes (Blog post, Case Study, Author, Website)** - `7526e7d` (feat)
2. **Task 2: Wire the 2 geo-pages (Lima, Madrid) + sitewide zero-gap confirmation** - `caa805f` (feat)
3. **Task 3: Sitewide live verification sweep** - no code changes, verification-only (see Issues Encountered)

_No TDD tasks in this plan — plan frontmatter has `tdd="false"` on both code tasks._

## Files Created/Modified
- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` - Blog post detail: wired `alternates: buildAlternates(locale, \`/blog/${slug}\`, \`/en/blog/${slug}\`)`
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` - Case Study detail: wired `alternates: buildAlternates(locale, \`/case-studies/${slug}\`, \`/en/case-studies/${slug}\`)`
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` - Author detail: wired `alternates: buildAlternates(locale, \`/authors/${slug}\`, \`/en/authors/${slug}\`)`
- `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` - Website detail: wired `alternates: buildAlternates(locale, \`/websites/${slug}\`, \`/en/websites/${slug}\`)`
- `src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx` - Geo-page: wired `alternates: buildAlternates(locale, '/seo-tecnico-lima', '/en/seo-tecnico-lima')`
- `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx` - Geo-page: wired `alternates: buildAlternates(locale, '/seo-tecnico-madrid', '/en/seo-tecnico-madrid')`

## Decisions Made
- Reused `buildAlternates` from Plan 42-02 exactly as-is — no new helper code, purely mechanical wiring following the same read-first-then-mirror-the-url-line discipline as Plan 42-02.
- Each detail route's `esPath`/`enPath` was built from the raw route `slug` param (same expression as that file's existing `url:` line inside `buildOpenGraph`), explicitly not `doc.slug ?? slug` (which is only used for the `slug:` field passed to `buildOpenGraph`, a distinct concern) — this keeps canonical and `og:url` permanently in sync per plan instruction and the T-42-04 threat mitigation.

## Deviations from Plan

None - plan executed exactly as written for Tasks 1 and 2. Task 3's live curl sweep was blocked by environment (see Issues Encountered), consistent with the plan's own risk profile and the orchestrator's `<CRITICAL_environment_correction>` instruction to bound the retry and defer rather than loop.

## Issues Encountered
- **Task 3 live curl sweep blocked by local Neon Postgres connectivity, again.** Started `npm run dev`, waited 8s for compile, then curled `/seo-tecnico-lima` with a 15s timeout — got `HTTP_CODE=000` (no response). Dev server log showed the same signature as Phase 41 / Plan 42-01 / Plan 42-02: middleware's `/api/redirects-lookup` DB call hangs (pg SSL-mode deprecation warning logged, consistent with an in-flight/stuck Neon connection attempt, no crash). This recurred despite WINDOWS.md ids 1-3 being marked `fixed` earlier the same session (2026-08-01T15:13Z) — the "fix" evidently did not resolve local sandbox connectivity, only unblocked the prior findings via production evidence. Per the orchestrator's explicit `<CRITICAL_environment_correction>` (max ~1 attempt / 2 minutes on any DB-backed local curl check), did not retry. Killed the dev server (`pkill -f "next dev"`) and fell back to static verification: `tsc --noEmit` clean, all 6 `buildAlternates(` grep acceptance criteria pass, sitewide `comm -23` gap-check shows zero unexpected entries (only the 4 expected Servicios/Services files), and static grep confirms Plan 42-01's `manifest`/`themeColor` fields are still present in `src/app/(frontend)/[locale]/layout.tsx` (no regression). Logged as **WINDOWS.md id 4** (`unrun-verify`, phase 42, status `open`) — live canonical-tag rendering across all route types plus the favicon/manifest/theme-color regression check is deferred to a Neon-stable environment (local once connectivity is fixed, or production post-deploy per the established Phase 41/42-01/42-02 resolution pattern). Recommend Juan re-run: `npm run dev && curl -s http://localhost:3000/seo-tecnico-lima | grep canonical` (repeat per Task 3's full verify block) once local Neon connectivity is confirmed stable, or verify directly against https://juan-tech.com post-deploy.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 42 (meta-tags-completion) is now feature-complete: all 3 plans (42-01 favicon/manifest, 42-02 sitewide canonical for 9 routes, 42-03 sitewide canonical for the remaining 6 routes) are committed.
- META-01 is closed sitewide: all 19 public route types emit `alternates.canonical` (15 direct + 4 indirect).
- **Blocker for `/gsd-ship`:** WINDOWS.md now has 1 open entry (id 4, this plan's Task 3). The broken-windows ledger blocks `/gsd-ship` while `open_count > 0` — Juan needs to either re-run the deferred live-curl sweep once local Neon connectivity is confirmed stable (recommended command in Issues Encountered) and mark it fixed, or waive it with a reason if production evidence from a prior phase's equivalent check is judged sufficient.
- No code blockers — `tsc --noEmit` is clean across the whole plan, and static evidence strongly supports correctness (same pattern as Plans 42-01/42-02, both later confirmed via production evidence).

---
*Phase: 42-meta-tags-completion*
*Completed: 2026-08-01*

## Self-Check: PASSED

All 6 modified files found on disk; both task commits (7526e7d, caa805f) found in git log.
