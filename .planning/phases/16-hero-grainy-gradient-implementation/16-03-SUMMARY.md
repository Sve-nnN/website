---
phase: 16-hero-grainy-gradient-implementation
plan: 03
subsystem: testing
tags: [playwright, verification, webgl, canvas, screenshot, sharp]

requires:
  - phase: 16-02
    provides: "HeroGrainGradient component + Hero wiring, data-testid/data-motion contract"
provides:
  - "Reusable Playwright verification script for the Hero shader"
  - "Written verification report with pass/fail findings + screenshots for end-of-phase human review"
affects: []

tech-stack:
  added: []
  patterns:
    - "Reused verify-mobile-viewport.mjs / check-hero-overlay-contrast.ts patterns (chromium.launch, BASE_URL override, sharp raw-buffer average-color sampling)"

key-files:
  created:
    - scripts/verify-hero-grain-gradient.mjs
    - .planning/phases/16-hero-grainy-gradient-implementation/16-03-verification-report.md
  modified: []

key-decisions:
  - "16-03: color sanity check implemented as a WARN (not a hard FAIL) since exact-hex assertions against an animated noise-textured shader are inherently unreliable — matches the plan's explicit guidance"
  - "16-03: dark-theme (isDark) color path intentionally not exercised in verification — confirmed unreachable on the live site today (no dark class ever applied), consistent with 16-UI-SPEC.md's reachability note"

patterns-established: []

requirements-completed: [HERO-ANIM-01, HERO-ANIM-02, HERO-ANIM-03, HERO-ANIM-04]

duration: 20min
completed: 2026-07-11
---

# Phase 16 Plan 03: Verify Hero GrainGradient Summary

**Real Chromium-headless run confirms the shader canvas actually paints (non-blank, correct-height bounding box) on both `/es` and `/en`, with zero horizontal overflow at 375/768/1280px, unchanged title/subtitle/CTA copy, and `prefers-reduced-motion` correctly flipping the component's `data-motion` attribute — script exits 0 with 0 failures and 0 warnings.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-11
- **Completed:** 2026-07-11
- **Tasks:** 2/2 complete
- **Files modified:** 2 (both created: `scripts/verify-hero-grain-gradient.mjs`, `16-03-verification-report.md`)

## Accomplishments

- Built `scripts/verify-hero-grain-gradient.mjs`, modeled on `scripts/verify-mobile-viewport.mjs`'s structure and `scripts/check-hero-overlay-contrast.ts`'s `sharp`-based average-color sampling pattern. Checks per locale: wrapper presence + default `data-motion="live"`, canvas presence + non-zero bounding box, coarse dark-navy-family color sanity (WARN-only), content-unchanged (title/subtitle/CTA), overflow at 375/768/1280px, and a dedicated `reducedMotion: 'reduce'` Playwright-context run confirming `data-motion="reduced"`.
- Ran the script against the real dev server already running on `localhost:3000`: **RESULT: PASS**, 0 failures, 0 warnings, 23 informational notes, 5 screenshots captured.
- Wrote `.planning/phases/16-hero-grainy-gradient-implementation/16-03-verification-report.md` documenting every check's outcome, the coarse color-check numbers for both locales, and an explicit "Color / Contrast — Human Visual Judgment Call" section flagging the shader's visual weighting for Juan's own final look (per `human_verify_mode=end-of-phase`), plus explicit scoping-out of Lighthouse/CWV (Phase 17).

## Deviations from Plan

None — plan executed exactly as written. The script's structure, checks, and thresholds all follow the plan's `<action>` specification verbatim.

## Verification Evidence (see full report for details)

- Canvas bounding boxes: 1280x426 (es), 1280x367 (en) — real paint area, not zero-size.
- Coarse color check: both locales' average RGB stayed under the 90-per-channel dark-navy-family threshold (es: R=83.2/G=52.2/B=49.0; en: R=79.7/G=52.1/B=50.5).
- Zero overflow at 375/768/1280px.
- Title/subtitle/CTA text confirmed present and unchanged in both locales.
- `data-motion` correctly flips `"live"` → `"reduced"` under Playwright's `prefers-reduced-motion: reduce` context emulation.

## Commits

- d85d233: feat(16-03): add Playwright verification script for hero shader

## Self-Check: PASSED

- FOUND: scripts/verify-hero-grain-gradient.mjs
- FOUND: .planning/phases/16-hero-grainy-gradient-implementation/16-03-verification-report.md
- FOUND: commit d85d233 in git log

## Addendum: Re-run After Post-Implementation Retune

After Plan 16-02's `wave` shape went through the `ripple` → `blob` retune (see `16-02-SUMMARY.md`'s addendum and `16-CONTEXT.md`'s "Revisión post-implementación"), `scripts/verify-hero-grain-gradient.mjs` was re-run against the final `blob` implementation without any script changes needed — same script, same checks, same hard-assertion set.

**Result: unchanged — RESULT: PASS, 0 failures, 0 warnings.** Only the coarse color-check numbers moved (now much darker: es R=24.9/G=23.6/B=28.0, en R=26.3/G=24.7/B=28.9, down from the original wave-shape's ~50-90 range), consistent with `blob`'s more minimal, near-black rendering. `16-03-verification-report.md` was rewritten in place to reflect the final implementation and document the full shape-decision history (wave → ripple → blob, plus the mouse-reactivity build-and-revert) for Juan's record. Commits: `8e9c1c1` (ripple retune), `b7b7eaa` (blob final).
