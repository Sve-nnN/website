---
phase: 09-hero-resultados-kpi-tipografia
plan: 01
subsystem: ui
tags: [tailwind, wcag, contrast, hero, sharp, cloudinary]

requires:
  - phase: 07-design-token-foundation
    provides: locked color tokens (--secondary, --secondary-foreground) and type scale (text-display/text-heading) reused here unchanged
provides:
  - Hero title/subtitle typographic hierarchy strengthened (tracking-tight, muted subtitle, mt-6 rhythm)
  - scripts/check-hero-overlay-contrast.ts — repeatable WCAG check of the Hero's image+navy composited background against all 53 real Cloudinary fallback images plus a synthetic white worst case
affects: [09-02, 09-03, 11-cross-cutting-verification]

tech-stack:
  added: []
  patterns:
    - "Composited-background WCAG verification: sample real image assets with sharp, alpha-composite over a design token, check WCAG ratio — extends the flat-token pattern from scripts/check-dark-contrast.ts to image-backed surfaces"

key-files:
  created:
    - scripts/check-hero-overlay-contrast.ts
  modified:
    - src/blocks/Hero/Component.tsx

key-decisions:
  - "No overlay adjustment was needed — worst real-image contrast is 7.72:1 and the synthetic pure-white worst case is 6.53:1, both well above the 4.5:1 normal-text threshold, so opacity-30 was left unchanged"

patterns-established:
  - "Composited-background contrast checks live alongside flat-token checks in scripts/, following the same self-contained hex/rgba/WCAG-math pattern with hardcoded values kept in sync via inline comments"

requirements-completed: [UI-06]

duration: 15min
completed: 2026-07-10
---

# Phase 9 Plan 01: Hero Typography + Overlay Contrast Verification Summary

**Strengthened Hero title/subtitle hierarchy with tracking-tight/muted-subtitle tokens, and added an automated WCAG contrast script that samples all 53 real Cloudinary fallback images (worst case 7.72:1) confirming the existing opacity-30 overlay already passes without adjustment.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 completed
- **Files modified:** 2 (1 modified, 1 created)

## Accomplishments
- Hero `<h1>` gains `tracking-tight` at both `text-display` (home) and `text-heading` (other variants) sizes
- Hero `<p>` subtitle recedes visually via `text-secondary-foreground/80` and increased `mt-6` vertical rhythm
- New `scripts/check-hero-overlay-contrast.ts` fetches and samples all 53 real fallback images with `sharp`, composites each over navy `--secondary` at the exact `opacity-30` used in the component, and checks WCAG contrast at 3:1 (large text) and 4.5:1 (normal text) against `--secondary-foreground`
- Script confirms zero failures across all 54 candidates (53 real + 1 synthetic pure-white worst case)

## Task Commits

1. **Task 1: Strengthen Hero typographic hierarchy** - `2bae0d7` (feat)
2. **Task 2: Automated WCAG contrast verification against 53-image pool** - `8d8ec9e` (test)

**Plan metadata:** (pending — final docs commit)

## Files Created/Modified
- `src/blocks/Hero/Component.tsx` - h1 gains tracking-tight, subtitle muted + mt-6 rhythm
- `scripts/check-hero-overlay-contrast.ts` - standalone WCAG contrast verification script against the real 53-image Cloudinary fallback pool + synthetic white worst case

## Decisions Made
- Kept the image-opacity compositing model as "image rendered at 30% opacity over navy background" (matching the actual DOM structure — an `opacity-30` wrapper div around the `<Image>`, not a separate scrim layer) rather than treating it as a flat-color overlay atop the image.
- No overlay/opacity change was required since all real images and the synthetic worst case clear both WCAG thresholds with large margin (worst ratio 6.53:1 vs 4.5:1 required).

## Deviations from Plan

None - plan executed exactly as written. The contrast script did not fail, so the conditional "apply minimal overlay fix" branch in Task 2 was not triggered.

## Issues Encountered
None.

## Next Phase Readiness
- Hero typography and overlay contrast are verified against real production image data; no blockers for 09-02/09-03.
- `scripts/check-hero-overlay-contrast.ts` can be re-run any time the fallback pool or overlay opacity changes.

---
*Phase: 09-hero-resultados-kpi-tipografia*
*Completed: 2026-07-10*

## Self-Check: PASSED
