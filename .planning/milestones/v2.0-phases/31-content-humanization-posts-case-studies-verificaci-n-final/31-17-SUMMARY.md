---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 17
subsystem: verification
tags: [lighthouse, cwv, regression-gate, milestone-close, voice, seo]

# Dependency graph
requires:
  - phase: 31-16
    provides: post-sweep snapshot, historical diff, reindex-search, extended locale-parity/JSON-LD verification over all Track B routes
  - phase: 31-01
    provides: "lh-phase31-pre.json — the fresh 'before' Lighthouse baseline for blog/case-studies routes"
provides:
  - "lh-phase31-post.json — fresh 'after' Lighthouse mobile capture across 10 routes representing both v1.6 tracks"
  - "31-REGRESSION-DIFF.md — programmatic diff vs both baselines, RESULT: PASS"
  - "31-VERIFICATION.md — Phase 31's 5 ROADMAP success criteria verified true with evidence, closing VOICE-06/VOICE-07"
  - "ROADMAP.md/STATE.md updated to reflect milestone v1.6 (Phases 26-31, Track A + Track B) CERRADO"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-baseline regression diff: same route set diffed against two different baselines depending on which track/phase originally captured them (Phase 32's baseline for Track A routes, this phase's own 31-01 pre-capture for Track B routes) — same threshold rule (>5pt perf drop or worse CWV band) applied uniformly"
    - "Noise-vs-regression triage: an anomalous first-pass reading is re-measured with 2-3 clean, isolated re-runs before being trusted, same as Phase 28's precedent — confirmed noise here on 2/10 routes"

key-files:
  created:
    - .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/lh-phase31-post.json
    - .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-REGRESSION-DIFF.md
    - .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-VERIFICATION.md
  modified:
    - .planning/ROADMAP.md
    - .planning/STATE.md

key-decisions:
  - "First-pass Lighthouse readings for / (perf 62, TBT 1506ms) and /seo-tecnico-madrid (perf 79, TBT 384ms) were confirmed as measurement noise via 2 clean re-runs each (both routes returned to their known baseline-consistent scores), not a real regression — lh-phase31-post.json was corrected with the reproducible values before the diff was computed"
  - "Diffed the 6 Track A routes against Phase 32's pre-existing baseline and the 4 Track B routes against this phase's own 31-01 pre-capture, rather than a single shared baseline — matching the plan's explicit dual-baseline design since no single prior snapshot covers all 10 routes"
  - "Did not touch REQUIREMENTS.md — v1.6's requirements (including VOICE-06/VOICE-07) were never migrated into that file (unlike v1.8/v1.9); they live directly in ROADMAP.md's per-phase sections and are formally closed via 31-VERIFICATION.md instead"

requirements-completed: [VOICE-06, VOICE-07]

coverage:
  - id: D1
    description: "Fresh 'after' Lighthouse mobile capture exists for all 10 representative routes (6 Track A + 4 Track B), no errors"
    requirement: "VOICE-07"
    verification:
      - kind: other
        ref: "node scripts/lighthouse-mobile.mjs --base-url http://localhost:3046 --out lh-phase31-post.json --routes-only <10 routes> (10/10 routes captured, 0 errors; 2 routes re-measured after first-pass noise)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No route shows a real regression vs. its correct baseline (Phase 32 for Track A, 31-01 for Track B) using the same threshold rule as Phase 36's Regression Gate"
    requirement: "VOICE-07"
    verification:
      - kind: other
        ref: "31-REGRESSION-DIFF.md — RESULT: PASS, 10/10 routes clean, zero performance drop >5pt, zero CWV band regression"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase 31's 5 ROADMAP success criteria all verified true with concrete evidence, closing VOICE-06/VOICE-07"
    requirement: "VOICE-06, VOICE-07"
    verification:
      - kind: other
        ref: "31-VERIFICATION.md — all 5 criteria verified true, citing 31-02..31-15 SUMMARYs, 31-HISTORICAL-DIFF.md, 31-16-SUMMARY.md coverage items, and this plan's 31-REGRESSION-DIFF.md"
        status: pass
    human_judgment: false
  - id: D4
    description: "ROADMAP.md and STATE.md reflect Phase 31 and milestone v1.6 as complete"
    requirement: "VOICE-06, VOICE-07"
    verification:
      - kind: other
        ref: "grep -c '\\[x\\] \\*\\*Phase 31' .planning/ROADMAP.md == 1; v1.6 CERRADO closure note added to Overview + progress line; STATE.md Session Continuity/Operator Next Steps updated"
        status: pass
    human_judgment: false

# Metrics
duration: ~50min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 17: Final Lighthouse/CWV Gate + Phase 31/Milestone v1.6 Close-out Summary

**Final Lighthouse/CWV gate over 10 routes representing both v1.6 tracks came back RESULT: PASS with zero regression, closing Phase 31's 5 success criteria and formally closing milestone v1.6 (Phases 26-31, Track A + Track B, 20/20 requirements) — including a real noise-vs-regression triage on 2 routes that resolved as measurement noise, not a real performance drop.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-07-17T06:35:00Z (approx)
- **Completed:** 2026-07-17T06:44:00Z
- **Tasks:** 3 (all plan tasks)
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- **Fresh 10-route Lighthouse capture (Task 1):** production build + `next start` on port 3046, `scripts/lighthouse-mobile.mjs` run against all 10 routes covering Track A (home ES/EN + 4 geo-page locale combos) and Track B (blog + case-studies, both locales). First-pass anomalies on `/` and `/seo-tecnico-madrid` (implausibly low performance / high TBT) were investigated per the plan's noise-triage instruction: 2 clean re-runs each confirmed both routes are actually stable and consistent with their known baselines — the corrected values were written to `lh-phase31-post.json`. Server + `caffeinate` torn down cleanly, port 3046 confirmed free.
- **Dual-baseline programmatic diff (Task 2):** `31-REGRESSION-DIFF.md` diffs the 6 Track A routes against Phase 32's `lh-phase32-baseline.json` and the 4 Track B routes against this phase's own `lh-phase31-pre.json` (from Plan 31-01), applying the identical >5pt-drop / worse-CWV-band threshold rule Phase 36 used. **Verdict: RESULT: PASS** — 10/10 routes clean, one route (`/blog/tech-seo-guide`) even improved its LCP out of the "poor" band.
- **Phase 31 + milestone v1.6 close-out (Task 3):** `31-VERIFICATION.md` verifies all 5 of Phase 31's ROADMAP success criteria against concrete evidence from the phase's other 16 plans (72/72 posts + 7/7 case-studies rewritten, historical diff vs. the VOICE-04 baseline, 3 reindex-search re-runs, 160-route live JSON-LD sweep with zero broken structured data, and this plan's Lighthouse PASS). `ROADMAP.md` updated: Phase 31 checked off (17/17 plans, 4 waves), v1.6 closure note added to the Overview paragraph and the phase-order progress line. `STATE.md` Session Continuity + Operator Next Steps updated to reflect v1.6 fully closed and point to Phase 6 (Deploy + Cutover) as the only remaining open milestone item.
- **3 non-blocking follow-up items formally documented** (not fixed, all pre-existing and outside VOICE-06/VOICE-07's scope): 8 posts with zero English content (translation-authorship gap), 6 Posts + 6 Case Studies still unpublished drafts (Juan's editorial decision), 50 of 160 routes with empty `meta.description` (pre-existing SEO gap already flagged by Phase 30 for Pages).

## Task Commits

1. **Task 1: Fresh "after" Lighthouse capture across all 10 representative routes** - `02c6de4` (feat)
2. **Task 2: Programmatic diff against both baselines + verdict doc** - `e930f0a` (docs)
3. **Task 3: Close out Phase 31 and milestone v1.6** - `373b218` (docs)

_No separate plan-metadata commit — Task 3's commit already covers `31-VERIFICATION.md` + `ROADMAP.md` + `STATE.md` together, matching the plan's explicit instruction to commit all of Task 3's outputs in one commit._

## Files Created/Modified

- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/lh-phase31-post.json` - Fresh mobile Lighthouse scores for the 10 representative routes (post-sweep, production build)
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-REGRESSION-DIFF.md` - Per-route before/after tables (both baselines), noise-triage writeup, explicit `RESULT: PASS`
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-VERIFICATION.md` - Phase 31's 5 success criteria verified against concrete evidence; formal VOICE-06/VOICE-07 + milestone v1.6 close-out
- `.planning/ROADMAP.md` - Phase 31 checkbox + plan list marked complete; v1.6 CERRADO closure note added to Overview and phase-order progress line; Phase 31 progress table row updated
- `.planning/STATE.md` - Frontmatter (status, current_phase_name, progress counters), Session Continuity, and Operator Next Steps updated to reflect v1.6 fully closed

## Decisions Made

See `key-decisions` in frontmatter. Summary: confirmed 2 anomalous first-pass Lighthouse readings as measurement noise via clean re-runs rather than reporting a false regression; used a dual-baseline diff design matching the plan's explicit instruction (no single prior snapshot covers all 10 routes); left `REQUIREMENTS.md` untouched since v1.6's requirements were never tracked there (they live in `ROADMAP.md` per-phase sections, closed formally via `31-VERIFICATION.md`).

## Deviations from Plan

None beyond the plan's own explicitly-anticipated noise-triage step (Task 1's "if any route reports an anomalous delta... reproduce with 2-3 clean re-runs"), which is not a deviation but the plan's designed behavior. No Rule 1/2/3/4 auto-fixes were needed — this was a pure measurement + documentation plan and the gate result was a clean PASS with no gap-closure work required.

## Issues Encountered

First Lighthouse pass returned implausible outlier scores on 2 of 10 routes (cold-start Chrome/CPU contention on the first run of the session). Resolved via 2 clean, isolated re-runs per route confirming the true stable values, per the plan's own precedent from Phase 28. No further issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Milestone v1.6 is fully closed.** No further plans are queued under v1.6 — Track A (motion/UI, Phases 26-28) and Track B (content humanization, Phases 29-31) are both complete, 20/20 requirements verified.
- All of v1.2, v1.3, v1.4, v1.5, v1.6, v1.7, v1.8 (Phase 37), and v1.9 (Phases 38-40) are now CERRADO. The only remaining open item in the entire roadmap is Phase 6 (Deploy + Cutover to Hostinger), which stays paused awaiting Juan's separate go-ahead — `RESEND_API_KEY` in `.env` is still a placeholder and must be replaced with a real key before that phase can verify contact-form email delivery in production.
- 3 non-blocking follow-up items are documented in `31-VERIFICATION.md` and `STATE.md`'s Operator Next Steps for Juan's future decision: (1) a dedicated translation-authoring plan for 8 posts with zero English content, (2) a publish decision for 6 Posts + 6 Case Studies currently in draft (content already humanized, ready to go live), (3) a scoped SEO content task to fill the 50 routes with empty `meta.description`.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*


## Self-Check: PASSED
