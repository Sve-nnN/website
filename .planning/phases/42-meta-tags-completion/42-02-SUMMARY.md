---
phase: 42-meta-tags-completion
plan: 02
subsystem: seo
tags: [nextjs, metadata, canonical, hreflang, alternates]

# Dependency graph
requires:
  - phase: 41-opengraph-images
    provides: buildOpenGraph() already wired into the same 9 no-doc/Pages-collection routes, giving each route a locale-correct url/esPath/enPath pair to mirror for canonical
provides:
  - "src/lib/canonical.ts exports a new generic buildAlternates(locale, esPath, enPath) helper, sibling to the existing Servicios-only buildServiceAlternates"
  - "alternates.canonical/alternates.languages wired into Home, Contact, Privacy, Terms, Blog listing, Case Studies listing, Authors listing, Websites listing, Search (9 of the phase's 15 gap routes)"
affects: [42-03, meta-tags-completion, seo-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "buildAlternates(locale, esPath, enPath) generic sitewide canonical/hreflang helper for routes with a plain 1:1 es/en path pair — distinct from buildServiceAlternates' 4-to-2 collapsing pattern for Servicios"

key-files:
  created: []
  modified:
    - src/lib/canonical.ts
    - "src/app/(frontend)/[locale]/page.tsx"
    - "src/app/(frontend)/[locale]/contact/page.tsx"
    - "src/app/(frontend)/[locale]/privacy/page.tsx"
    - "src/app/(frontend)/[locale]/terms/page.tsx"
    - "src/app/(frontend)/[locale]/blog/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/page.tsx"
    - "src/app/(frontend)/[locale]/authors/page.tsx"
    - "src/app/(frontend)/[locale]/websites/page.tsx"
    - "src/app/(frontend)/[locale]/search/page.tsx"

key-decisions:
  - "buildAlternates is a new, separate sibling function to buildServiceAlternates rather than a generalization of it — Servicios' 4-physical-URL-to-2-canonical-target collapsing is structurally different from the other 9 routes' plain 1:1 es/en pairs, so keeping them as two functions avoids forcing an artificial common abstraction"
  - "Each route's esPath/enPath literal mirrors the exact same url const/inline value that route's own buildOpenGraph({ url }) call already uses, so canonical and og:url can never diverge for these 9 routes"
  - "Live DB-backed curl verification (localhost:3000) confirmed the same pre-existing local Neon Postgres connectivity issue already documented in Phase 41 and Plan 42-01 — deferred to production per established resolution pattern, not retried beyond one attempt"

requirements-completed: [META-01]

coverage:
  - id: D1
    description: "buildAlternates(locale, esPath, enPath) helper added to src/lib/canonical.ts, buildServiceAlternates left byte-identical"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "grep -c 'export function buildAlternates' src/lib/canonical.ts && grep -c 'buildServiceAlternates' src/lib/canonical.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Home, Contact, Privacy, Terms each emit a correct alternates.canonical/alternates.languages from generateMetadata"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json (exit 0) + grep -c 'buildAlternates(' per file"
        status: pass
    human_judgment: false
  - id: D3
    description: "Blog listing, Case Studies listing, Authors listing, Websites listing, Search each emit a correct alternates.canonical/alternates.languages from generateMetadata"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json (exit 0) + grep -c 'buildAlternates(' per file"
        status: pass
    human_judgment: true
    rationale: "Plan's own <verify> step requires live curl confirmation of the rendered <link rel=\"canonical\"> tag against a running dev server. Local Neon Postgres connectivity is broken in this sandbox (pre-confirmed, same as Phase 41/42-01), so the DB-backed route never renders locally — live confirmation must happen against production (https://juan-tech.com) post-deploy."
  - id: D4
    description: "Servicios/Services canonical mechanism (buildServiceAlternates, 4 route files, services-data.ts) left completely untouched"
    requirement: "META-01"
    verification:
      - kind: unit
        ref: "git status --short on servicios/, services/, services-data.ts — empty diff"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-08-01
status: complete
---

# Phase 42 Plan 02: Sitewide Canonical Tags (buildAlternates) Summary

**Generic buildAlternates(locale, esPath, enPath) helper added to canonical.ts and wired into the 9 no-doc/Pages-collection routes (Home, Contact, Privacy, Terms, Blog, Case Studies, Authors, Websites, Search), leaving the existing Servicios buildServiceAlternates mechanism untouched.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-08-01T15:36:00Z (approx)
- **Completed:** 2026-08-01T15:42:57Z
- **Tasks:** 2 completed
- **Files modified:** 10 (1 lib file + 9 route files)

## Accomplishments
- `src/lib/canonical.ts` now exports `buildAlternates(locale, esPath, enPath)`, a generic sitewide canonical/hreflang builder for routes with a plain 1:1 es/en path pair, sitting alongside the pre-existing `buildServiceAlternates` (unchanged, byte-identical)
- All 9 target routes (Home, Contact, Privacy, Terms, Blog listing, Case Studies listing, Authors listing, Websites listing, Search) now return a locale-aware, self-referencing `alternates.canonical`/`alternates.languages` object from `generateMetadata`, each mirroring the exact es/en path pair its own `buildOpenGraph({ url })` call already used (Phase 41), so canonical and `og:url` cannot diverge
- The 4 Servicios/Services routes and `services-data.ts` were confirmed untouched (`git status --short` empty diff) — no duplicate or conflicting canonical mechanism introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit + buildAlternates helper + wire Home, Contact, Privacy, Terms** - `6e1de7b` (feat)
2. **Task 2: Wire Blog, Case Studies, Authors, Websites, Search** - `9118322` (feat)

_No TDD tasks in this plan — plan frontmatter has `tdd="false"` on both tasks._

## Files Created/Modified
- `src/lib/canonical.ts` - added `buildAlternates(locale, esPath, enPath)` export
- `src/app/(frontend)/[locale]/page.tsx` - Home: wired `alternates: buildAlternates(locale, '/', '/en')`
- `src/app/(frontend)/[locale]/contact/page.tsx` - Contact: wired `alternates: buildAlternates(locale, '/contact', '/en/contact')`
- `src/app/(frontend)/[locale]/privacy/page.tsx` - Privacy: wired `alternates: buildAlternates(locale, '/privacy', '/en/privacy')`
- `src/app/(frontend)/[locale]/terms/page.tsx` - Terms: wired `alternates: buildAlternates(locale, '/terms', '/en/terms')`
- `src/app/(frontend)/[locale]/blog/page.tsx` - Blog listing: wired `alternates: buildAlternates(locale, '/blog', '/en/blog')`
- `src/app/(frontend)/[locale]/case-studies/page.tsx` - Case Studies listing: wired `alternates: buildAlternates(locale, '/case-studies', '/en/case-studies')`
- `src/app/(frontend)/[locale]/authors/page.tsx` - Authors listing: wired `alternates: buildAlternates(locale, '/authors', '/en/authors')`
- `src/app/(frontend)/[locale]/websites/page.tsx` - Websites listing: wired `alternates: buildAlternates(locale, '/websites', '/en/websites')`
- `src/app/(frontend)/[locale]/search/page.tsx` - Search: wired `alternates: buildAlternates(locale, '/search', '/en/search')`

## Decisions Made
- Kept `buildAlternates` as a separate sibling function rather than refactoring `buildServiceAlternates` to be parameterized — Servicios' 4-URL-to-2-canonical collapsing (`esPathFor`/`enPathFor` with an optional `current.slug`) is structurally different from the other 9 routes' fixed 1:1 es/en literal pairs; forcing a shared abstraction would have added indirection without benefit.
- `x-default` in `buildAlternates` points at the `es` URL, matching `buildServiceAlternates`'s existing rule (site's `defaultLocale: 'es'` per `routing.ts`).
- Each route's `esPath`/`enPath` literal was taken directly from that route's own pre-existing `url` computation (used by `buildOpenGraph`) rather than re-derived, per plan instruction — guarantees canonical and `og:url` never diverge.

## Deviations from Plan

None - plan executed exactly as written. The plan's own environment note ("Neon connectivity confirmed resolved") did not hold in this sandbox; the orchestrator's `<CRITICAL_environment_correction>` pre-flagged this and directed a single bounded verification attempt + static fallback, which is what happened (see Issues Encountered).

## Issues Encountered
- **Live curl verification blocked by local Neon Postgres connectivity.** Started `npm run dev`, waited 10s, and curled `/blog`, `/en/blog`, `/case-studies` on `localhost:3000`. All three DB-backed routes never returned a response in the allotted window (dev server was still compiling/connecting; logs showed the pg SSL-mode deprecation warning consistent with an in-flight Neon connection attempt, no crash). This matches the pre-confirmed, known local-sandbox limitation independently hit by Plan 42-01's executor and closed via live production evidence in Phase 41. Per the orchestrator's explicit instruction, did not retry beyond this single attempt — verified statically instead (`tsc --noEmit` clean, `grep -c "buildAlternates("` == 1 per route file) and killed the dev server. Live canonical-tag rendering confirmation is deferred to production (https://juan-tech.com) post-deploy, same resolution pattern as Phase 41 and 42-01.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/lib/canonical.ts` now exposes the reusable `buildAlternates` helper Plan 42-03 needs for the remaining 6 of the phase's 15 gap routes.
- 9 of 15 gap routes are done; Servicios' existing mechanism (4 routes) plus this plan's 9 routes leaves 6 routes still pending canonical coverage for Plan 42-03 (likely individual doc-based routes: blog posts, case study details, author details, website details, and any remaining slug routes per the phase's original 15-route audit).
- Live canonical-tag rendering for all 9 routes wired in this plan (both locales) needs confirmation against production after next deploy — no blocker to proceeding, same deferred-verification pattern already accepted in Phase 41/42-01.

---
*Phase: 42-meta-tags-completion*
*Completed: 2026-08-01*

## Self-Check: PASSED

All 10 modified files found on disk (canonical.ts + 9 route files); both task commits (6e1de7b, 9118322) found in git log.
