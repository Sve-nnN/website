---
phase: 30-content-humanization-globals-core-pages-services-geo
plan: 04
subsystem: testing
tags: [payload-local-api, locale-parity, jsonld, seo-meta, verification-scripts, next-intl]

# Dependency graph
requires:
  - phase: 30-01
    provides: Header/Footer globals + lean collections (Authors/Testimonials/SpeakingEvents/Categories) rewritten in Juan's voice, both locales, ctaButton.label and legalLinks[2] locale bugs fixed
  - phase: 30-02
    provides: Home/Contact/Privacy/Terms pages rewritten in Juan's voice, both locales
  - phase: 30-03
    provides: Services index + 4 landings + 2 geo-pages rewritten in Juan's voice, both locales
provides:
  - Post-sweep content snapshot (tag post-sweep-phase30) for Phase 31's before/after diff
  - Reusable locale-parity verification script (scripts/verify-locale-parity.ts) covering pages/authors/testimonials/speaking-events/categories + header/footer globals
  - Reusable live JSON-LD + meta verification script (scripts/verify-live-jsonld-meta.mjs) covering every Phase 30-touched route, both locales
  - Confirmation both named Plan 30-01 regressions (Header.ctaButton.label collapse, Footer.legalLinks[2] missing en) are fixed in live data
  - Surfaced (not fixed) pre-existing meta.description gap unrelated to this phase, for a future scoped task
affects: [31-content-humanization-posts-case-studies]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "locale:'all' generic {es,en}-shape detection for parity checks: Payload only returns the {es,en} object shape for genuinely localized fields when read with locale:'all', so a generic recursive walk that flags any {es,en}-shaped node as one localized field automatically reproduces the 29-FIELD-AUDIT.md allowlist without hand-enumerating every block type's field paths"
    - "asymmetric-vs-both-empty distinction: a parity failure is only raised when one locale has content and the other doesn't (real collapse); fields legitimately unset in both locales are not flagged, avoiding false positives on optional fields (Hero.cityName/inlineStat outside local-landing variant, Authors.education[].description, unset meta.description)"

key-files:
  created:
    - scripts/verify-locale-parity.ts
    - scripts/verify-live-jsonld-meta.mjs
  modified: []

key-decisions:
  - "Locale-parity check implemented via generic recursive {es,en}-shape detection rather than a hardcoded per-block-type field allowlist — functionally equivalent to and more complete than manually walking 29-FIELD-AUDIT.md's table, since non-localized fields never take the {es,en} shape under locale:'all' and therefore can never be mis-flagged"
  - "meta.description empty-content finding (20/22 routes) is reported as a pre-existing, out-of-Phase-30-scope gap and NOT auto-fixed, per this plan's explicit read-only verification mandate — confirmed via pre-sweep snapshot diff that these fields were already null before Plans 30-01/02/03 ran, and all three of those plans' own SUMMARYs confirm meta.title/meta.description/targetKeyword were never touched"
  - "Dev server (npm run dev, port 3000) was not already running; started it for Task 2's live verification and stopped it cleanly afterward rather than leaving a background process running"

requirements-completed: [VOICE-07]

coverage:
  - id: D1
    description: "Post-sweep snapshot (tag post-sweep-phase30) captured and diffed against pre-sweep-phase30 — only Phase-30-touched collections/globals show content deltas, doc counts unchanged everywhere, out-of-scope collections (posts/case-studies/websites/clientes) show zero delta"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/content-humanization-snapshot.ts --tag post-sweep-phase30 (exit 0); manual char-count diff vs pre-sweep-phase30-2026-07-14T20:38:02.242Z.json"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/verify-locale-parity.ts created; walks pages/authors/testimonials/speaking-events/categories + header/footer with locale:'all', 0 asymmetric parity failures across 299 localized field instances checked, both named regression checks (Header.ctaButton.label.es != 'Get in Touch', Footer.legalLinks[2].label.en non-empty) pass"
    requirement: VOICE-07
    verification:
      - kind: integration
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/verify-locale-parity.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "scripts/verify-live-jsonld-meta.mjs created; live-curls all 22 Phase-30-touched routes (both locales), confirms JSON-LD parses validly with expected @type (Person on Home, BreadcrumbList on Services index/landings, none expected/found elsewhere) and non-empty <title> on every route"
    requirement: VOICE-07
    verification:
      - kind: integration
        ref: "node scripts/verify-live-jsonld-meta.mjs --base-url http://localhost:3000 (JSON-LD + title checks: pass on all 22 routes)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Live check also surfaced that meta.description is empty on 20/22 routes (all except Home) — confirmed pre-existing (unchanged before/after this phase, never touched by Plans 30-01/02/03) rather than a Phase 30 regression; reported to Juan as a deferred, separately-scoped SEO content gap rather than fixed inline"
    verification: []
    human_judgment: true
    rationale: "Whether/how to populate meta.description across these Pages docs is a content/product decision outside this plan's read-only verification scope and outside Plans 30-01/02/03's explicit no-touch boundary on SEO meta fields — needs Juan's call on prioritization, not an automated fix"

# Metrics
duration: 15min
completed: 2026-07-17
status: complete
---

# Phase 30 Plan 4: Post-Sweep Safety Net — Locale Parity + Live JSON-LD/Meta Verification Summary

**Two new reusable verification scripts (locale-parity + live JSON-LD/meta) confirm Phase 30's content rewrite introduced zero locale collapse and zero structured-data/title regressions across all 22 touched routes, while surfacing one pre-existing (not Phase-30-caused) SEO meta-description gap for a future scoped task.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-17T02:58:00Z (approx.)
- **Completed:** 2026-07-17T03:12:24Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- Post-sweep content snapshot (`post-sweep-phase30-2026-07-17T03:01:23.033Z.json`) captured and sanity-diffed against the pre-sweep snapshot from Plan 30-01: only Header/Footer/lean-collections/Home/Contact/Privacy/Terms/Services/geo-pages show content deltas; `posts`, `case-studies`, `websites`, `clientes` show exactly zero delta (out of this phase's rewrite scope, confirmed untouched); no document counts changed anywhere.
- New `scripts/verify-locale-parity.ts` — generic, reusable locale-parity gate over every collection/global this phase touched. 0 asymmetric parity failures across 299 checked `{es,en}` field instances; both named regression checks from Plan 30-01 (`Header.ctaButton.label` no longer collapsed to "Get in Touch", `Footer.legalLinks[2].label.en` no longer missing) pass.
- New `scripts/verify-live-jsonld-meta.mjs` — live curl-based check across all 22 routes touched by Plans 30-01/02/03 (both locales). Every JSON-LD block parses as valid JSON with the expected `@type` (`Person` on Home, `BreadcrumbList` on Services index + 4 landings, none expected on Contact/Privacy/Terms/geo-pages — confirmed pre-existing app behavior, those templates render no `<JsonLd>` at all). Every route has a non-empty `<title>`.
- Surfaced (without silently fixing) a real but pre-existing SEO gap: `meta.description` is empty on 20 of 22 routes. Confirmed via the pre-sweep snapshot that this was already the case before Plan 30-01 ever ran, and all three prior plans' SUMMARYs explicitly confirm `meta.title`/`meta.description`/`targetKeyword` were never in scope or touched. Not a Phase 30 regression — reported to Juan as a separate, future scoped task.

## Task Commits

Each task was committed atomically:

1. **Task 1: Post-sweep snapshot + locale-parity verification script** - `096f83b` (feat)
2. **Task 2: Live JSON-LD and meta.title/meta.description verification** - `693b887` (feat)

**Plan metadata:** (this commit) `docs(30-04): complete post-sweep verification plan`

## Files Created/Modified
- `scripts/verify-locale-parity.ts` - Generic `locale:'all'` recursive walker over `pages`/`authors`/`testimonials`/`speaking-events`/`categories` + `header`/`footer` globals; flags any `{es,en}`-shaped field where one locale is empty and the other isn't; asserts the two named Plan 30-01 regression fixes explicitly; exits non-zero on any failure.
- `scripts/verify-live-jsonld-meta.mjs` - Curl-based live checker for all 22 Phase-30-touched routes; validates JSON-LD `JSON.parse` success + expected `@type` per route, and non-empty `<title>`/meta description; exits non-zero on any problem.

## Decisions Made
- Built the locale-parity check as a generic `{es,en}`-shape detector instead of hand-enumerating every block type's localized field paths from 29-FIELD-AUDIT.md. Under `locale: 'all'`, Payload returns the `{es, en}` object shape ONLY for fields that are actually `localized: true` — non-localized fields (URLs, proper nouns, ids) come back as plain scalars. This means the generic walk is provably equivalent to (and more complete than) a hardcoded allowlist: it can never flag a non-localized field, and it can never miss a localized one, including deeply nested ones inside `pages.content.layout` blocks that would have required enumerating ~15 block-type schemas by hand.
- Treated "both locales empty" as a pass, not a failure, distinct from "asymmetric" (one populated, one empty). This is the real definition of a locale collapse — the two bugs this phase's Plan 30-01 fixed (`ctaButton.label`, `legalLinks[2]`) were both asymmetric cases. Fields that are legitimately unset in both locales (e.g. `Hero.cityName`/`inlineStat` outside the local-landing variant, `Authors.education[].description`, and — as it turns out — `meta.description` on most pages) are correctly not flagged as regressions.
- Did not fix the pre-existing `meta.description` gap found by Task 2's live check. This plan is explicitly read-only verification; the gap predates this phase, was never in Plans 30-01/02/03's scope (all three explicitly document never touching `meta.title`/`meta.description`/`targetKeyword`), and populating SEO meta content across ~10 pages is a distinct, larger piece of work that deserves its own scoped plan rather than an inline fix buried in a verification task.
- Started the local dev server (`npm run dev`, port 3000) for Task 2 since nothing was listening on 3000/3001 beforehand, and stopped it cleanly after the verification run completed rather than leaving a background process running.

## Deviations from Plan

None — plan executed exactly as written for both tasks. The `meta.description` finding in Task 2 is not a deviation from this plan's instructions (the script correctly implements the plan's literal spec: "exit non-zero... [on] an empty title/meta description") — it is the verification correctly detecting a real, pre-existing condition. No unplanned code changes were made; the finding is documented here per the plan's own read-only-verification framing rather than silently patched.

## Issues Encountered

**`meta.description` empty on 20/22 touched routes.** `scripts/verify-live-jsonld-meta.mjs` exits non-zero when run today because most Pages docs (everything except `home`) have `meta.description: null` in both locales. Investigated via the pre-sweep snapshot (`pre-sweep-phase30-2026-07-14T20:38:02.242Z.json`): these fields were already `null` before Plan 30-01 started, so this is NOT something Plans 30-01/02/03 broke — it's an existing content gap (the `@payloadcms/plugin-seo` meta tab is wired up and editable per Phase 18/32/38's work, it's simply never been filled in for these pages except Home). Flagging clearly for Juan rather than fixing inline, per this plan's read-only-verification scope. Recommend a future scoped task ("populate SEO meta.title/meta.description across Pages") separate from the humanization tramo.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 30 (VOICE-06/VOICE-07, part 1 of 2) is closed out: content rewrite across Header/Footer/lean collections/Home/Contact/Privacy/Terms/Services/geo-pages is verified locale-safe and JSON-LD/title-safe.
- Phase 31 has both a `pre-sweep-phase30` and `post-sweep-phase30` snapshot pair to diff against for its own before/after presentation to Juan, plus two reusable verification scripts (`verify-locale-parity.ts`, `verify-live-jsonld-meta.mjs`) it can extend for the higher-volume Posts/Case Studies sweep.
- Blocker/note for Juan (not blocking this phase's completion): `meta.description` is empty on nearly every non-Home page. Worth a scoped decision on whether/when to fill it in — out of this tramo's scope but relevant to the site's SEO completeness goal from PROJECT.md.

---
*Phase: 30-content-humanization-globals-core-pages-services-geo*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: scripts/verify-locale-parity.ts
- FOUND: scripts/verify-live-jsonld-meta.mjs
- FOUND commit: 096f83b
- FOUND commit: 693b887
