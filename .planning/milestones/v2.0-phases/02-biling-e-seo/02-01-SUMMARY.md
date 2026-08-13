---
phase: 02-biling-e-seo
plan: 01
subsystem: i18n
tags: [next-intl, i18n, routing, next.config]

# Dependency graph
requires:
  - phase: 01-schema-foundation
    provides: Working Next.js 15 + Payload 3.85 app with next.config.mjs and withPayload wrapper already in place
provides:
  - next-intl routing config (src/i18n/routing.ts) with locked locale/prefix/detection decisions
  - next-intl request config (src/i18n/request.ts) for message loading
  - Spanish and English UI message catalogs (messages/es.json, messages/en.json)
  - next.config.mjs wired with createNextIntlPlugin around withPayload
affects: [02-03 (middleware + [locale] pages), 02-04, 02-05]

# Tech tracking
tech-stack:
  added: [next-intl@^4.13.1]
  patterns: [locale-prefixed routing via next-intl defineRouting, message catalogs under project-root messages/]

key-files:
  created:
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - messages/es.json
    - messages/en.json
  modified:
    - next.config.mjs
    - package.json
    - package-lock.json

key-decisions:
  - "next-intl legitimacy checkpoint resolved by executor via npm view (publisher amann/amannn, version 4.13.1, repo github.com/amannn/next-intl matched RESEARCH.md) — no human interruption needed"
  - "defaultLocale 'es', localePrefix 'as-needed', localeDetection: false — locked per CONTEXT.md to preserve current unprefixed-Spanish-root SEO behavior"

patterns-established:
  - "Message catalogs live at project root (messages/{locale}.json), not under src/, to match ../../messages/${locale}.json import path from src/i18n/request.ts"

requirements-completed: [I18N-01]

# Metrics
duration: 12min
completed: 2026-07-09
---

# Phase 02 Plan 01: next-intl Routing Scaffold Summary

**next-intl@4.13.1 installed with defaultLocale 'es', localePrefix 'as-needed', and localeDetection disabled, wired into next.config.mjs alongside the existing withPayload wrapper**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-09T19:50:00Z
- **Completed:** 2026-07-09T20:02:09Z
- **Tasks:** 2 (1 checkpoint resolved automatically, 1 auto task)
- **Files modified:** 7

## Accomplishments
- Verified `next-intl` package legitimacy directly via `npm view` (publisher `amann <jan@amann.me>` / GitHub `amannn`, version 4.13.1, repo matches RESEARCH.md) — resolved the blocking checkpoint without interrupting Juan
- Installed `next-intl@^4.13.1`
- Scaffolded `src/i18n/routing.ts` and `src/i18n/request.ts` per the locked CONTEXT.md decisions (es/en locales, defaultLocale 'es', localePrefix 'as-needed', localeDetection: false)
- Created `messages/es.json` and `messages/en.json` with matching `nav`/`home`/`common` key structure
- Wired `next.config.mjs` to wrap `nextConfig` with both `withNextIntl` and `withPayload`
- Confirmed `npm run dev` boots cleanly with no next-intl plugin resolution errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify next-intl package legitimacy before install** - resolved via `npm view next-intl` (no code changes, no commit — checkpoint verification only)
2. **Task 2: Install next-intl and scaffold routing/request/messages/next.config.mjs** - `250cf86` (feat)

**Plan metadata:** pending (this SUMMARY.md commit)

## Files Created/Modified
- `src/i18n/routing.ts` - `defineRouting()` config: locales ['es','en'], defaultLocale 'es', localePrefix 'as-needed', localeDetection: false
- `src/i18n/request.ts` - `getRequestConfig()` loading `messages/{locale}.json`, copied verbatim from apturio reference shape
- `messages/es.json` - Spanish UI strings (nav, home, common)
- `messages/en.json` - English UI strings (nav, home, common)
- `next.config.mjs` - Added `createNextIntlPlugin('./src/i18n/request.ts')`, changed export to `withPayload(withNextIntl(nextConfig))`
- `package.json` / `package-lock.json` - Added `next-intl` dependency

## Decisions Made
- Resolved the Task 1 blocking checkpoint autonomously: RESEARCH.md tagged `next-intl` `[ASSUMED]` because slopcheck was unavailable during research. Ran `npm view next-intl name version dist-tags.latest maintainers repository.url time.modified` directly and confirmed publisher, version, and repo all match RESEARCH.md's prior findings, satisfying the acceptance criteria without needing Juan's manual npmjs.com/GitHub visit.
- Left `output: 'standalone'` and `images.remotePatterns: []` untouched in `next.config.mjs`, and did not port apturio's `async redirects()` block, per plan instructions (redirects are `@payloadcms/plugin-redirects` + middleware scope, not `next.config.mjs`).

## Deviations from Plan

None - plan executed exactly as written. The Task 1 checkpoint was resolved via the automated npm-registry verification path explicitly authorized by the orchestrator's `<important_context>`, rather than escalated to Juan.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `src/i18n/routing.ts` and `src/i18n/request.ts` are ready for Plan 02-03 to build `middleware.ts` and `[locale]` pages on top of.
- `messages/es.json` and `messages/en.json` currently only cover `nav`/`home`/`common` — 02-03/02-05 will need to extend these catalogs as more UI surfaces are built (placeholder heroTitle/heroSubtitle copy noted for real content in Phase 4/5).
- No blockers. This plan did not touch `payload.config.ts`, `middleware.ts`, or route files, keeping it isolated from the concurrently-executing 02-02 plan.

---
*Phase: 02-biling-e-seo*
*Completed: 2026-07-09*

## Self-Check: PASSED

All created files verified present on disk; both commits (`250cf86`, `782a5a4`) verified in git log.
