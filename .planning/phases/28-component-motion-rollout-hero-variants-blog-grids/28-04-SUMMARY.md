---
phase: 28-component-motion-rollout-hero-variants-blog-grids
plan: 04
subsystem: ui
tags: [motion, regression-gate, lighthouse, reduced-motion, cwv, playwright, seo]

# Dependency graph
requires:
  - phase: 28-02
    provides: "Hero variant CSS differentiation (listing/post-header/case-study-header) — one of two axes under regression test"
  - phase: 28-03
    provides: "ScrollReveal-wrapped ArchiveBlock/FeaturedPostsBlock grid items + PostCard whileHover motion — the other axis under regression test"
provides:
  - "scripts/verify-reduced-motion-phase28.mjs — reusable headless Playwright reduced-motion consistency checker (hydration errors + ScrollReveal opacity assertion), generalizable to future phases"
  - "28-REGRESSION-DIFF.md — Phase 28's closing gate artifact, explicit FAIL verdict with root-caused findings"
  - "Root-caused, documented (not yet fixed) LCP regression in ScrollReveal.tsx's SSR opacity:0 initial state"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reduced-motion headless verification pattern: reducedMotion:'reduce' page context + console/pageerror listeners attached before navigation + per-element scrollIntoViewIfNeeded before opacity assertion (scripts/verify-reduced-motion-phase28.mjs)"
    - "Lighthouse reproducibility protocol on flagged regressions: 3 isolated re-runs on a clean-process production build, plus a control-route baseline to distinguish real regression from lab noise (same discipline as Phase 25's 25-04)"

key-files:
  created:
    - scripts/verify-reduced-motion-phase28.mjs
    - .planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-post-content.json
    - .planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-reduced-motion-check.json
    - .planning/phases/28-component-motion-rollout-hero-variants-blog-grids/lh-phase28-post.json
    - .planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-REGRESSION-DIFF.md
  modified: []

key-decisions:
  - "ScrollReveal opacity assertion scrolls each element into view before checking (rather than only checking elements already in the initial viewport) — exercises the real whileInView reveal path regardless of a route's above/below-fold layout"
  - "Did not silently auto-fix the discovered ScrollReveal SSR-opacity:0 LCP regression inline in this plan — per Juan's explicit instruction and this plan's own scope (measurement/diffing, not component authorship), documented as a FAIL with full root cause and flagged as a required follow-up, matching Phase 25's 25-04 precedent of recording a real FAIL before a later dedicated gap-closure pass"
  - "Used caffeinate -u to keep the Mac's display awake during Lighthouse captures after discovering display-sleep silently breaks headless Chrome-for-Testing's compositor (NO_FCP errors) — an environment/tooling gotcha, not a Phase 28 code issue"

requirements-completed: []

# Metrics
duration: ~90min
completed: 2026-07-13
---

# Phase 28 Plan 04: Component Motion Rollout Regression Gate Summary

**Phase 28's closing regression gate: reduced-motion consistency and H1/JSON-LD integrity both pass cleanly (6/6 routes), but the Lighthouse CWV re-run surfaces a real, reproduced, root-caused LCP regression on 2 of 6 routes (`/en`, `/en/blog`) traced to `ScrollReveal`'s SSR-rendered `opacity:0` initial state — top-line verdict is FAIL, documented honestly per Juan's instruction, not silently marked done.**

## Performance

- **Duration:** ~90 min (includes diagnosing and reproducing a Lighthouse environment issue — display sleep breaking headless Chrome — before the real CWV regression could even be measured)
- **Tasks:** 2 (both auto)
- **Files modified:** 5 (all created, 0 modified)

## Accomplishments

- Built `scripts/verify-reduced-motion-phase28.mjs`, a new headless Playwright script modeled on `verify-hero-grain-gradient.mjs`'s reduced-motion pattern, checking all 6 representative Phase 28 routes under `reducedMotion: 'reduce'` emulation for (a) zero hydration-mismatch console/page errors and (b) every `[data-testid="scroll-reveal"]` element settling at `opacity:1` after being scrolled into view — **6/6 routes PASS, exit code 0**.
- Re-captured H1/JSON-LD content snapshot (`28-post-content.json`) and diffed programmatically against the 28-01 baseline — **zero H1 or BreadcrumbList regressions on any of the 6 routes**.
- Re-ran Lighthouse mobile (production build, `npx next build` per project CLAUDE.md, never `npm run build`) against all 6 routes and diffed against the 28-01 baseline — found and **reproduced across 3 isolated clean-environment re-runs** a real Performance-score drop (`/en/blog`: 82 -> 73/75/76) and LCP band crossings (`/en/blog` and `/en` both cross from `needs-improvement` to `poor`).
- Root-caused both LCP findings to `src/components/ScrollReveal.tsx` (28-03): direct `curl` of the SSR HTML shows every scroll-reveal wrapper rendered server-side with `style="opacity:0;transform:translateY(16px)"`, which delays Lighthouse's Largest Contentful Paint measurement until Motion's client JS hydrates and the `whileInView` reveal fires — measurable and consistent, not lab noise (confirmed against a tight-variance control route).
- Wrote `28-REGRESSION-DIFF.md` with an explicit top-line `## Phase 28 Regression Gate: FAIL` verdict, per-route tables for both checks, the reproducibility evidence, the root-cause analysis, and a named required follow-up.

## Task Commits

Each task was committed atomically:

1. **Task 1: Headless reduced-motion consistency pass + H1/JSON-LD diff** — `e6de9df` (test) — new script, `28-post-content.json`, `28-reduced-motion-check.json`, initial `28-REGRESSION-DIFF.md` with Task 1 findings (PASS)
2. **Task 2: Lighthouse mobile re-run + regression gate verdict** — `8c2ad9e` (test) — `lh-phase28-post.json`, `28-REGRESSION-DIFF.md` updated with Task 2 findings and final top-line verdict (FAIL)

_No plan-metadata commit was made by this agent — the orchestrator/parent conversation owns STATE.md/ROADMAP.md updates and the final metadata commit._

## Files Created/Modified

- `scripts/verify-reduced-motion-phase28.mjs` — new headless Playwright reduced-motion consistency checker (6 routes, hydration errors + ScrollReveal opacity)
- `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-post-content.json` — post-change H1/JSON-LD snapshot (6 routes)
- `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-reduced-motion-check.json` — structured per-route reduced-motion check results
- `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/lh-phase28-post.json` — post-change Lighthouse mobile scores (6 routes)
- `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-REGRESSION-DIFF.md` — closing gate artifact, full findings + FAIL verdict

## Regression Gate Verdict: FAIL

**`.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-REGRESSION-DIFF.md`**

- **Reduced-motion consistency (MOTION-03):** PASS, 6/6 routes. Zero hydration-mismatch console/page errors on any route; every `[data-testid="scroll-reveal"]` element (35 total across `/en`, `/es`, `/en/blog`, `/en/seo-tecnico-lima`) settles at `opacity:1` under `prefers-reduced-motion: reduce` emulation.
- **H1 / BreadcrumbList integrity:** PASS, 6/6 routes. Byte-identical H1 text and deep-equal `BreadcrumbList` `itemListElement` on every route versus the 28-01 baseline.
- **CWV / Lighthouse (MOTION-04):** **FAIL, 2/6 routes.**
  - `/en/blog`: Performance 82 -> 73 (official run) / 75-76 (3 clean re-runs), a consistent 6-9pt drop over the 5pt threshold. LCP 3799ms -> 4424-4943ms across all 4 runs, crossing from `needs-improvement` into `poor`.
  - `/en`: Performance actually improved (+20pts, driven by a large TBT improvement), but LCP crept from 3810ms baseline to a consistent 3938-4097ms (4 runs), crossing the 4000ms `poor` threshold in 3 of 4 runs — a smaller, boundary-straddling instance of the same root cause.
  - Both findings reproduced via 3 isolated re-runs each on a clean-process production build (port 3035), plus a control-route (`/en/services`) re-run showing this environment's real noise floor is <15ms LCP / 0pt Performance — confirming these are genuine regressions, not lab jitter.
- **Root cause:** `src/components/ScrollReveal.tsx` (authored in 28-03) renders its `initial={{ opacity: 0, y: 16 }}` state into the SSR HTML (`style="opacity:0;transform:translateY(16px)"`, confirmed via direct `curl`), so any route where reveal-wrapped content is at or near the fold has its Largest Contentful Paint delayed until Motion's client JS hydrates and the `whileInView`/IntersectionObserver reveal fires.
- **Not fixed in this plan.** Per this plan's own scope (measurement/diffing, not component authorship) and Juan's explicit instruction to document a FAIL honestly rather than paper over it, the fix is named as a required follow-up rather than patched inline here.

## Decisions Made

- Scrolled every `ScrollReveal` element into view before asserting its opacity, rather than only checking elements already in the initial viewport — this makes the reduced-motion check meaningful regardless of a route's fold layout and is what actually surfaced the SSR-`opacity:0` finding that fed the CWV root-cause analysis.
- Followed Phase 25's 25-04 reproducibility discipline exactly: when a Lighthouse threshold trips, re-run 3x in a verified clean-process environment plus a control route, before concluding it's a real regression versus noise.
- Recorded the FAIL verdict plainly rather than attempting an inline fix, matching this plan's own threat-model mitigation (T-28-07) and the explicit instruction not to fabricate a PASS.

## Deviations from Plan

### Auto-fixed Issues

None — no code deviations were auto-fixed. The plan's own artifacts (script, snapshots, diff doc) were produced exactly as specified.

### Environment issue diagnosed and worked around (not a deviation from plan scope, but worth recording)

**[Rule 3 - Blocking issue] Lighthouse `NO_FCP` failures caused by the Mac's display sleeping.** All 6 routes initially failed with `Audit "largest-contentful-paint" did not return a numeric value` / `NO_FCP` / "keep the browser window in the foreground" errors on the first production-build Lighthouse pass. Diagnosed via `system_profiler SPDisplaysDataType` showing `Display Asleep: Yes` — macOS's headless Chrome-for-Testing compositor stalls when the physical display is asleep, even with `--headless=new --no-sandbox`. Fixed by running `caffeinate -u` to wake/hold the display for the duration of each Lighthouse batch; also killed a batch of orphaned Chrome-for-Testing helper processes left over from an unrelated prior session before retrying. Not a Phase 28 code issue — a machine-state gotcha in the measurement tooling itself, worth carrying forward as a note for future Lighthouse runs on this machine.

## Issues Encountered

The Lighthouse CWV regression described above (`/en`, `/en/blog` LCP band crossings, `/en/blog` Performance drop) is the substantive finding of this plan — see "Regression Gate Verdict: FAIL" above for full detail. It is a real, reproduced, root-caused defect in 28-03's `ScrollReveal.tsx`, not an issue with this plan's own measurement tooling.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 28 is **not** verifiably done as measured. A required follow-up (gap-closure pass, same shape as Phase 25's 25-04 -> Gap-Closure Resolution) needs to:
1. Fix `src/components/ScrollReveal.tsx`'s SSR-visible-content LCP delay — likely by not suppressing the SSR paint of already-in-viewport content, while preserving the below-fold reveal animation.
2. Re-run `scripts/verify-reduced-motion-phase28.mjs` + `scripts/lighthouse-mobile.mjs` against `/en` and `/en/blog` at minimum, to confirm the fix closes the LCP gap without regressing the now-passing reduced-motion / H1 / JSON-LD checks.
3. Update `28-REGRESSION-DIFF.md` with a final verdict once the fix is verified, per the Phase 25 precedent of appending a "Gap-Closure Resolution" section rather than editing the original FAIL record.

---

## Gap-Closure Update (2026-07-13)

The required follow-up above was attempted (commits `7be700c`, `3bd4d7a`). Full detail lives in `28-REGRESSION-DIFF.md`'s "Gap-Closure Attempt" section; summary here:

**Root cause was more precise than originally diagnosed.** Direct inspection of Lighthouse's `lcp-breakdown-insight`/`lcp-discovery-insight` audits (this plan's original FAIL only inferred the root cause from SSR HTML `curl`, not from the actual LCP-element audit) found:
- `/en/blog`'s real LCP element is the first `PostCard` thumbnail image — which was both (a) ScrollReveal-SSR-hidden as originally diagnosed, AND (b) missing `priority` on `next/image`, so it was also explicitly `loading="lazy"` in the SSR HTML. A second, compounding bug this plan didn't catch.
- `/en`'s real LCP element is the `AboutSection` intro paragraph, which is **not** ScrollReveal-wrapped at all — this plan's root-cause theory didn't directly apply to `/en`'s actual LCP node.

**Fix applied and verified working as intended:** `ScrollReveal.tsx` gained a `priority` prop that skips the Motion wrapper entirely for above-the-fold content (an `initial={false}` approach was tried first and rejected — verified via SSR diffing that Motion's `whileInView` still hides content by default even with `initial={false}`). `PostCard.tsx` gained a matching `priority` prop wired to `next/image`. `ArchiveBlock`/`FeaturedPostsBlock` mark their first grid row as `priority`. Confirmed via SSR HTML diff: no more `opacity:0` style and no more `loading="lazy"` on the first-row grid items.

**Gate is still FAIL.** Even with both confirmed defects fixed, LCP on `/en` and `/en/blog` remains in the `poor` band (>4000ms). The residual cause: `/en/blog`'s server response time (TTFB) is ~2.1-2.4s even warm — every other `ArchiveBlock`-consuming route responds in ~250ms. This is a pre-existing, out-of-scope data-fetching/caching issue (likely `searchParams` forcing the page out of static rendering, re-running 3 sequential Payload queries per request), not caused by Phase 28's Motion work, and was already present (just under the 4000ms threshold) at the 28-01 baseline. Flagged as a new, separately-scoped required follow-up — not a Motion/animation task.

---
*Phase: 28-component-motion-rollout-hero-variants-blog-grids*
*Completed: 2026-07-13*

## Self-Check: PASSED

All 5 created files verified present on disk (`scripts/verify-reduced-motion-phase28.mjs`, `28-post-content.json`, `28-reduced-motion-check.json`, `lh-phase28-post.json`, `28-REGRESSION-DIFF.md`); both task commits (`e6de9df`, `8c2ad9e`) verified present in `git log --oneline --all`.
