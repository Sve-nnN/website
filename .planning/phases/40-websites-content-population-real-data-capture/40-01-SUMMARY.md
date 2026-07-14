---
phase: 40-websites-content-population-real-data-capture
plan: 01
subsystem: content-seed
tags: [payload, local-api, playwright, lighthouse, cloudinary, websites]

# Dependency graph
requires:
  - phase: 38-websites-schema-collection-design
    provides: Websites collection schema (title/role/industry/highlights/stack/challenges/screenshots/lighthouse/lighthouseCapturedAt/client/relatedCaseStudy)
  - phase: 39-websites-frontend
    provides: Public /websites and /websites/[slug] routes rendering Websites docs
provides:
  - 6 real Websites documents (ariannalupi-com, aprendoclub-com, estylopia-com, drmanuelvargashidalgo-com, apturio-com, juan-tech-com) with real screenshots and 5/6 with real Lighthouse scores
  - scripts/seed-phase40-websites.ts, an idempotent-by-slug seed script reusable for future one-off recaptures
affects: [40-content-population-follow-up, milestone-v1.9-closeout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Localized array field id-reuse across locale writes (withReusedIds) — array structure/ids are shared across locales, only nested localized fields differ; each locale write must reuse existing item ids or it orphans the other locale's data (same class of bug as seed-phase19-service-pages.ts's reapplyIds)."
    - "Sequential, continue-on-failure execution of per-site network capture (Playwright screenshot + Lighthouse audit) against live external domains, tracking failures without aborting the batch."

key-files:
  created: [scripts/seed-phase40-websites.ts]
  modified: []

key-decisions:
  - "juan-tech.com's Lighthouse capture failed because the live site currently returns HTTP 402 'DEPLOYMENT_DISABLED' from Vercel (external site outage, not a script bug) — cleared the resulting fake 0/0/0/0 scores to null rather than leaving misleading data; lighthouseCapturedAt kept at the last attempt timestamp since the schema requires a value."
  - "Fixed a real bug found during the live run: highlights/challenges localized array text was being orphaned on the `en` locale write because item ids weren't reused from the `es` creation — applied the same reapplyIds/withReusedIds fix pattern already documented in seed-phase19-service-pages.ts, then re-ran the idempotent script to repair all 6 docs' es text without re-triggering any screenshot/Lighthouse capture."

patterns-established:
  - "withReusedIds() helper for localized-array id reuse across locale writes — reusable pattern for any future seed script touching Websites/CaseStudies-style localized arrays."

requirements-completed: [WEB-12, WEB-13, WEB-14, WEB-15, WEB-16]

# Metrics
duration: 25min
completed: 2026-07-14
---

# Phase 40 Plan 01: Websites Content Population Summary

**6 real Websites documents populated via a new idempotent seed script — 5 with real Playwright screenshots + real Lighthouse mobile scores from live external sites, 1 (juan-tech.com) with a real screenshot but no Lighthouse score because the live site is currently down (HTTP 402 from Vercel).**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-14T17:15:00Z (approx)
- **Completed:** 2026-07-14T17:41:00Z
- **Tasks:** 2 of 3 (Task 3 is this human-verify checkpoint)
- **Files modified:** 1 (`scripts/seed-phase40-websites.ts`)

## Accomplishments
- Wrote `scripts/seed-phase40-websites.ts`: ports `lighthouse-mobile.mjs`'s Chrome-for-Testing download/launch + Lighthouse mobile runner, adds a Playwright full-page screenshot capture, and upserts 6 hardcoded `SITES` (stack tags + client ids from `40-CONTEXT.md`) into the `websites` collection via the Local API.
- Ran the script once against all 6 live production domains: 6/6 Playwright screenshots uploaded to Cloudinary via the Media pipeline, 5/6 real Lighthouse mobile audits captured.
- Found and fixed a real bug during the live run (localized array id orphaning) and re-ran the idempotent script to repair it without re-triggering any network capture.
- Corrected juan-tech.com's Lighthouse fields from a misleading fake `0/0/0/0` (an artifact of `Math.round(null * 100)`) to honestly empty (`null`) after confirming via `curl` that the live site is down.

## Task Commits

1. **Task 1: Write scripts/seed-phase40-websites.ts** - `da7f790` (feat)
2. **Task 2: Run the script once against the 6 live sites** - `2891fa2` (fix — id-reuse bug found and corrected during the run; the actual Websites/Media data lives in Postgres/Cloudinary, not git)

_Note: the run itself (Task 2's core action) produced database/Cloudinary writes, not file changes — the only file-level commit for Task 2 is the bug fix discovered while verifying the run's output._

## Files Created/Modified
- `scripts/seed-phase40-websites.ts` - Idempotent-by-slug seed script: Playwright screenshot capture, Lighthouse mobile audit (adapted from `lighthouse-mobile.mjs`), Media/Cloudinary upload, and `websites` doc upsert with `withReusedIds()` for correct localized-array handling across `es`/`en` writes.

## Decisions Made
- juan-tech.com Lighthouse capture: left `lighthouseCapturedAt` at the last real attempt's timestamp (schema requires a value) but cleared the 4 score fields to `null` instead of leaving fabricated `0/0/0/0` — see "Known Issues" below for the required follow-up.
- Did not delete/recreate the juan-tech-com doc or its screenshot to attempt a "clean" capture, per the project's Database Safety rule (`CLAUDE.md`): delete operations against the unguarded production Neon DB require Juan's explicit named approval, and this correction was achievable via an additive `update` instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Localized array text orphaned on locale write**
- **Found during:** Task 2 (verifying the run's output — spot-checked `es` locale data and found `highlights`/`challenges` `text` fields empty, only `id`s present)
- **Issue:** `highlights`/`challenges` are arrays where only the nested `text` field is localized; the array structure/ids are shared across locales. The original `upsertWebsite()` wrote the `en` locale update with fresh `{ text }` objects (no `id`), so Payload minted new array items for that write — orphaning the `es` locale's saved `text` values on the old ids. Same bug class documented in `scripts/seed-phase19-service-pages.ts`'s `reapplyIds()`, which this script initially failed to apply.
- **Fix:** Added `withReusedIds()` and fetch the doc's current array item ids via `payload.findByID` before every locale write; both `es` and `en` writes now reuse the same ids, so only the localized `text` value differs per locale, never the item identity.
- **Files modified:** `scripts/seed-phase40-websites.ts`
- **Verification:** Re-ran the idempotent script (all 6 sites hit "Skipped, already exists" — no re-capture) and confirmed via a direct Local API read that all 6 docs have complete, correct `highlights`/`challenges` text in both `es` and `en`, with consistent item ids across locales.
- **Committed in:** `2891fa2`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correctness fix — without it, 5 of 6 sites' Spanish highlights/challenges copy would have silently rendered empty on the live `/es/websites/[slug]` pages. No scope creep; the fix only touches the locale-write logic already present in the plan.

## Issues Encountered

**juan-tech.com is currently down (external, not fixable from this repo).** `curl -sI https://juan-tech.com` returns `HTTP/2 402` with header `x-vercel-error: DEPLOYMENT_DISABLED` and body `Payment required / DEPLOYMENT_DISABLED` — the old Next.js site's Vercel deployment appears suspended (billing lapse or an intentional pause ahead of the Payload migration). Confirmed reproducibly (4 separate Lighthouse attempts, all failing with `ERRORED_DOCUMENT_REQUEST` / status 402).

Effects on the `juan-tech-com` Websites doc:
- The screenshot (media id 57, 13.6 KB — an order of magnitude smaller than the other 5 sites' 600 KB–1.5 MB captures) is a real Playwright capture, but of the Vercel "Payment required" error page, not real juan-tech.com content.
- Lighthouse could not audit the page (non-2xx navigation) — `lighthouse.{performance,accessibility,bestPractices,seo}` are now `null` (corrected from a misleading fake `0/0/0/0`), and `lighthouseCapturedAt` reflects the last failed attempt (`2026-07-14T17:31:00.221Z`), not a real audit.

**This does not satisfy the plan's must-have truths for the `juan-tech-com` doc** ("real screenshot", "real Lighthouse scores"). Per the plan's continue-on-failure design (T-40-01 in the threat model anticipates exactly this), the other 5 docs are fully real and complete.

**Resolved at the Task 3 checkpoint — Juan reviewed and approved (2026-07-14):**
1. `juan-tech-com` stays as-is: `title`/`stack`/`highlights`/`challenges` populated, `lighthouse` fields `null` (honest, not fake zeros), screenshot documented as non-representative of real site content. No re-attempt, no delete.
2. The other 5 sites (`ariannalupi-com`, `aprendoclub-com`, `estylopia-com`, `drmanuelvargashidalgo-com`, `apturio-com`) approved as-is, no changes requested.

No other issues encountered — the 5 other sites captured cleanly on the first attempt with plausible, varied Lighthouse scores (55-100 across categories, not uniform placeholders).

## Known Stubs / Known Issues

| Field | Doc | Reason |
|---|---|---|
| `screenshots[0].image` | `juan-tech-com` (id 6, media id 57) | Real Playwright capture, but of Vercel's "Payment required" page — juan-tech.com is currently down, not the site's real content. |
| `lighthouse.{performance,accessibility,bestPractices,seo}` | `juan-tech-com` (id 6) | `null` (honestly empty) — Lighthouse could not audit a non-2xx page. Needs re-capture once the live site is restored. |

These are flagged for Juan's review at the Task 3 checkpoint below, not silently left in a misleading state.

## User Setup Required
None - no external service configuration required. (The juan-tech.com follow-up above is a content/ops action, not a config/env step.)

## Next Phase Readiness
- 5 of 6 Websites documents are fully real and complete, ready for the `/websites` and `/websites/[slug]` frontend (Phase 39) to render correctly in both locales.
- `juan-tech-com` needs a follow-up recapture once the live site is back up — tracked above, not blocking the other 5 sites or the milestone's public-facing content.
- `scripts/seed-phase40-websites.ts` is idempotent and safe to re-run; it will skip all 6 sites' capture unless a doc is removed (requires Juan's explicit approval per the Database Safety rule) or the script is extended with a targeted re-capture flag.

---
*Phase: 40-websites-content-population-real-data-capture*
*Completed: 2026-07-14*

## Self-Check: PASSED

- FOUND: scripts/seed-phase40-websites.ts
- FOUND: .planning/phases/40-websites-content-population-real-data-capture/40-01-SUMMARY.md
- FOUND: commit da7f790
- FOUND: commit 2891fa2
