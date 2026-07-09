---
phase: 02-biling-e-seo
plan: 3
subsystem: i18n
tags: [next-intl, middleware, payload-local-api, redirects, json-ld, seo, edge-runtime]

# Dependency graph
requires:
  - phase: 02-biling-e-seo (02-01)
    provides: "src/i18n/routing.ts — locales, defaultLocale, localePrefix:'as-needed', localeDetection:false"
  - phase: 02-biling-e-seo (02-02)
    provides: "payload.config.ts localization block, redirectsPlugin already registered"
provides:
  - "src/middleware.ts — single composed middleware (next-intl locale routing + redirects-lookup delegation)"
  - "src/app/api/redirects-lookup/route.ts — Node.js Route Handler doing the actual Payload Local API redirects lookup"
  - "src/app/(frontend)/[locale]/layout.tsx and page.tsx — real [locale] route replacing Phase 1 scaffold"
  - "src/components/JsonLd.tsx — shared JSON-LD script component (JSON.stringify-based)"
  - "Verified URL parity: / = es unprefixed, /en = en prefixed, /es -> 301/307 to /, no Accept-Language override, /admin untouched"
affects: [02-04, 02-05, 06-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Middleware stays on default Edge runtime; any Payload Local API call needed from middleware is delegated to a same-origin fetch to a Node.js Route Handler (nodejs runtime middleware is canary-only on this project's pinned Next 15.4.11 line)"
    - "JSON-LD rendered via a shared <JsonLd data={...}/> component using JSON.stringify inside dangerouslySetInnerHTML — never string concatenation"
    - "[locale] segment pages query Payload's Local API directly (server components), with graceful placeholder fallback when no seed content exists yet"

key-files:
  created:
    - src/middleware.ts
    - src/app/api/redirects-lookup/route.ts
    - src/app/(frontend)/[locale]/layout.tsx
    - src/app/(frontend)/[locale]/page.tsx
    - src/components/JsonLd.tsx
  modified: []

key-decisions:
  - "Delegated the redirects-collection Payload Local API lookup out of middleware.ts into a Node.js Route Handler (src/app/api/redirects-lookup/route.ts), fetched same-origin from middleware — because experimental.nodeMiddleware (required for runtime='nodejs' middleware) throws CanaryOnlyError on stable Next, and this project is pinned to Next 15.4.11 for Payload 3.85.2 peer-dependency compatibility"

patterns-established:
  - "Pattern: middleware delegates any Node-only work (Payload Local API, db-postgres) to an internal Route Handler via same-origin fetch rather than requiring nodejs-runtime middleware"

requirements-completed: [I18N-01, I18N-05, I18N-06]

# Metrics
duration: 24min
completed: 2026-07-09
---

# Phase 02 Plan 3: [locale] routing, redirects middleware, JsonLd Summary

**Composed next-intl locale middleware with URL parity (es unprefixed, en prefixed, no Accept-Language override) plus a redirects-collection lookup delegated to a Node.js Route Handler, and a real `[locale]` home page with Person JSON-LD via JSON.stringify.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-07-09T20:14:00Z
- **Completed:** 2026-07-09T20:38:20Z
- **Tasks:** 2 completed
- **Files modified:** 7 (2 created for middleware/redirects, 3 created + 2 deleted for the [locale] restructure)

## Accomplishments
- URL parity verified end-to-end with live `npm run dev` + curl: `/` (200, Spanish, unprefixed), `/en` (200, English, prefixed), `/es` (307 -> `/`), Accept-Language: en-US on root still serves Spanish (`localeDetection:false` holds), `/admin` untouched (200, no locale rewrite)
- Redirects-collection execution plumbing is reachable end-to-end (`/api/redirects-lookup?from=/nonexistent` -> `{"target":null}`); full redirect-doc test deferred to 02-05 per plan scope
- Person JSON-LD renders on the home page via a shared, reusable `JsonLd` component using `JSON.stringify` (verified present in response body)
- Home page gracefully falls back to a locale-aware placeholder heading when no `pages` doc with slug `home` exists yet (no 404/throw)

## Task Commits

Each task was committed atomically:

1. **Task 1: Compose middleware — redirects execution + next-intl locale routing** - `13810e3` (feat)
2. **Task 2: [locale] restructure — layout, home page, shared JsonLd component** - `e0a94fd` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/middleware.ts` - Single composed middleware: next-intl `createIntlMiddleware(routing)` plus a same-origin fetch to `/api/redirects-lookup` for the redirects-collection check; `config.matcher` excludes `/admin`, `/api`, `/_next`, `/_vercel`, and any dotted path
- `src/app/api/redirects-lookup/route.ts` - Node.js Route Handler performing the actual Payload Local API `redirects` collection lookup and target resolution (custom URL or reference-based slug reconstruction); redirect target is read exclusively from admin-authored data (T-02-01)
- `src/app/(frontend)/[locale]/layout.tsx` - html/body root layout, `generateStaticParams` over `routing.locales`, `hasLocale` validation + `notFound()`, `setRequestLocale`, `NextIntlClientProvider`
- `src/app/(frontend)/[locale]/page.tsx` - Home page querying `pages` collection (slug=`home`, locale-scoped), `generateMetadata` reading the `seoPlugin`-injected `meta` group, locale-aware placeholder fallback, renders `<JsonLd data={personData} />`
- `src/components/JsonLd.tsx` - Shared `<script type="application/ld+json">` component using `JSON.stringify(data)` (T-02-02 injection mitigation)
- `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx` - Deleted (Phase 1 scaffold, superseded by the `[locale]` segment)

## Decisions Made
- Middleware delegates the Payload Local API redirects lookup to a Node.js Route Handler rather than running under `runtime='nodejs'` middleware directly — see Deviations below for the full rationale. This preserves identical external behavior (redirect executes before any page renders, admin-only write access, target never derived from request-controlled input) while staying compatible with the pinned stable Next release.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `runtime='nodejs'` middleware requires a canary-only Next.js flag, incompatible with the pinned stable Next line**
- **Found during:** Task 1 (Compose middleware), during live verification with `npm run dev`
- **Issue:** The plan specified `export const runtime = 'nodejs'` in `src/middleware.ts` so it could call Payload's Local API (`getPayload`) directly. On first `next dev` boot, Next.js requires `experimental.nodeMiddleware: true` in `next.config.mjs` to honor a `nodejs` runtime export in middleware. Enabling that flag caused an immediate crash: `CanaryOnlyError: The experimental feature "experimental.nodeMiddleware" can only be enabled when using the latest canary version of Next.js.` This project is pinned to `next@15.4.11` (stable) because `@payloadcms/next@3.85.2`'s `peerDependencies` explicitly exclude the entire `15.5.x` line (documented in STATE.md decisions from Phase 1) — upgrading further to a canary release would move even further outside Payload's tested range, a materially riskier architectural change than the plan anticipated.
- **Fix:** Kept `src/middleware.ts` on the default Edge runtime (next-intl's `createIntlMiddleware` is Edge-safe) and moved the actual `redirects` collection Payload Local API lookup into a new Node.js Route Handler, `src/app/api/redirects-lookup/route.ts` (Route Handlers always run on the Node.js runtime by default — no experimental flag needed). Middleware now does a same-origin `fetch('/api/redirects-lookup?from=' + pathname)` and issues the 308 redirect if a target comes back, otherwise falls through to `intlMiddleware(request)`. All threat-model mitigations from the plan (T-02-01: redirect target read exclusively from admin-authored `redirects` collection data, never from request-controlled input) are preserved unchanged in the route handler.
- **Files modified:** `src/middleware.ts`, `src/app/api/redirects-lookup/route.ts` (new, not in original `files_modified` list), `next.config.mjs` (edited then reverted to original — `experimental.nodeMiddleware` was added then removed once the delegation approach was implemented, so the final diff is a no-op)
- **Verification:** `npm run dev` starts cleanly with no runtime errors; full curl verification suite (URL parity, Accept-Language, /admin, JSON-LD) passes; `curl "http://localhost:3000/api/redirects-lookup?from=/nonexistent"` returns `{"target":null}` confirming the lookup path is reachable
- **Committed in:** `13810e3` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make the middleware boot at all on this project's pinned Next.js version. External behavior, security mitigations, and matcher scope are all unchanged from the plan's intent — only the internal mechanism for running the Payload Local API call moved from in-process middleware to a delegated Route Handler. No scope creep beyond the one new file this required.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `[locale]` routing, JSON-LD component, and redirects-lookup plumbing are ready for 02-04 (sitemap/robots/llms.txt, disjoint files) and 02-05 (blog/case-study pages reusing `JsonLd`, and the first real redirect-doc E2E test against `/api/redirects-lookup`)
- No blockers identified for downstream phases

---
*Phase: 02-biling-e-seo*
*Completed: 2026-07-09*

## Self-Check: PASSED

All created files verified present on disk (src/middleware.ts, src/app/api/redirects-lookup/route.ts, src/app/(frontend)/[locale]/layout.tsx, src/app/(frontend)/[locale]/page.tsx, src/components/JsonLd.tsx, this SUMMARY.md); Phase 1 scaffold files confirmed deleted (src/app/(frontend)/layout.tsx, src/app/(frontend)/page.tsx). All task commits (13810e3, e0a94fd) and the SUMMARY commit (fc45438) confirmed present in git log.
