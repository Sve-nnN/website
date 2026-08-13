---
phase: 07-design-token-foundation
plan: 01
subsystem: ui
tags: [css, tailwind, design-tokens, dark-mode, accessibility, wcag]

# Dependency graph
requires:
  - phase: 05-frontend-pages
    provides: locked light-mode color palette (05-UI-SPEC.md) used as the hue-family source for the .dark rebrand
provides:
  - Shadow elevation tokens (--shadow-sm/md/lg/focus) mapped to Tailwind boxShadow
  - Motion timing tokens (--motion-fast/base/slow, --ease-out/--ease-standard) mapped to Tailwind transitionDuration/transitionTimingFunction
  - Global prefers-reduced-motion safety net (unscoped, applies to any element)
  - Ember/navy .dark palette replacing generic shadcn gray, with automated WCAG AA verification
affects: [08-shadcn-primitives, 09-hero-kpi, 10-cards]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom properties in :root for design tokens, consumed by Tailwind theme.extend via var(--name) references"
    - "Global unscoped @media (prefers-reduced-motion: reduce) rule outside @layer base, neutralizing all transitions/animations without per-component opt-in"
    - "Standalone Node/TS verification scripts (scripts/*.ts) with zero external deps, run via tsx, exit 0/1 for CI gating"

key-files:
  created:
    - scripts/check-dark-contrast.ts
  modified:
    - src/app/globals.css
    - tailwind.config.ts

key-decisions:
  - "Widened --border/--sidebar-border alpha from rgba(...,0.12) to rgba(...,0.35) in .dark — the originally planned value failed the WCAG 1.4.11 non-text 3.0 threshold (measured 1.39); 0.35 passes at 3.13 while keeping the same off-white/ember-tinted hue"
  - "Contrast script hardcodes .dark token values rather than parsing globals.css at runtime, per plan instruction, for self-containment and speed — kept in sync via code comment"

patterns-established:
  - "Elevation/motion tokens: define as CSS custom properties in :root, map 1:1 into Tailwind theme.extend (boxShadow/transitionDuration/transitionTimingFunction), never hardcode raw box-shadow/duration values in components"

requirements-completed: [UI-01, UI-02, UI-03]

# Metrics
duration: 12min
completed: 2026-07-10
---

# Phase 7 Plan 01: Design-Token Foundation Summary

**Shadow/motion CSS token layer wired into Tailwind, a global prefers-reduced-motion safety net, and an ember/navy `.dark` rebrand verified by a self-written WCAG AA contrast script (all 10 checked pairs pass, script exits 0).**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-10T06:21:00Z
- **Completed:** 2026-07-10T06:33:02Z
- **Tasks:** 3 completed
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments
- Added `--shadow-sm/md/lg/focus` and `--motion-fast/base/slow`/`--ease-out`/`--ease-standard` CSS custom properties to `:root`, mapped into `tailwind.config.ts` as `boxShadow`/`transitionDuration`/`transitionTimingFunction` Tailwind utilities.
- Added a global, unscoped `@media (prefers-reduced-motion: reduce)` rule outside `@layer base` that neutralizes `animation-duration`, `animation-iteration-count`, `transition-duration`, and `scroll-behavior` for any existing or future element.
- Rebranded the entire `.dark` block from generic shadcn `oklch(0...)` gray values to an ember/navy palette derived from the locked light-mode hues (`#12141C` navy, `#FAFAF7` off-white, `#FF5B1F`/`#FF7A45` ember). Confirmed zero `next-themes`/`useTheme`/`ThemeToggle` references anywhere in `src/` — no toggle UI exists or was added.
- Wrote `scripts/check-dark-contrast.ts`, a standalone, dependency-free WCAG AA contrast verifier (hex + rgba parsing with alpha compositing, relative-luminance, contrast-ratio) covering all 10 required `.dark` token pairs. Final run: all pairs pass, script exits 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Elevation + motion token layer, mapped to Tailwind, with reduced-motion safety net** - `d5b37df` (feat)
2. **Task 2: Rebrand .dark block to ember/navy palette** - `eab5cd3` (feat)
3. **Task 3: Automated WCAG AA contrast verification for the new .dark tokens** - `9daef33` (feat)

**Plan metadata:** (this commit, see below)

_Note: Task 3 folded its RED/GREEN iteration into a single commit — the script was written, run, found one failing pair (border/background), the failing CSS variable was adjusted in the same task per the plan's explicit "adjust the failing token, re-run until pass" instruction, and committed once passing._

## Files Created/Modified
- `src/app/globals.css` - Added shadow/motion primitives to `:root`, added global `prefers-reduced-motion` rule, rebranded `.dark` block to ember/navy hex/rgba values (including the contrast-driven `--border`/`--sidebar-border` alpha widening)
- `tailwind.config.ts` - Added `boxShadow`, `transitionDuration`, `transitionTimingFunction` to `theme.extend`, mapped to the new CSS vars
- `scripts/check-dark-contrast.ts` - New standalone contrast-verification script (hex/rgba parser, WCAG luminance + contrast-ratio functions, hardcoded `.dark` pair table, formatted pass/fail table output, exit 0/1)

## Final Contrast Verification Output

```
Pair                              Ratio   Threshold  Result
-----------------------------------------------------------
foreground / background           17.58         4.5  PASS
muted-foreground / background      8.13         4.5  PASS
muted-foreground / muted           6.98         4.5  PASS
card-foreground / card            15.88         4.5  PASS
primary-foreground / primary       7.11         4.5  PASS
secondary-foreground / secondary  13.98         4.5  PASS
accent-foreground / accent        13.98         4.5  PASS
destructive / background           6.64         4.5  PASS
primary / background               7.11         3.0  PASS
border / background                3.13         3.0  PASS

All .dark token pairs meet WCAG AA contrast requirements.
```
(exit code 0)

## Decisions Made
- Widened `--border`/`--sidebar-border` alpha from `0.12` to `0.35` in the `.dark` block after the contrast script measured the originally-planned value at 1.39 (below the WCAG 1.4.11 non-text 3.0 threshold). Kept the same off-white, ember-tinted-adjacent hue family — only the opacity changed, per Task 3's "adjust only the specific failing CSS variable's lightness... keep the same hue family" instruction.
- Contrast script hardcodes `.dark` token literals rather than parsing `globals.css` at runtime, exactly as specified in the plan, with a code comment flagging the sync requirement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, within Task 3's own instructions] Widened `--border`/`--sidebar-border` alpha to pass WCAG AA**
- **Found during:** Task 3 (contrast verification script)
- **Issue:** The plan's Task 2 specified `--border: rgba(250, 250, 247, 0.12)`. Running the Task 3 contrast script against this value produced a 1.39:1 ratio against `--background`, failing the WCAG 1.4.11 non-text 3.0:1 threshold.
- **Fix:** Increased alpha to `0.35` (same rgb channel values, same hue), which produces a 3.13:1 ratio, passing with a small margin. Applied to both `--border` and `--sidebar-border` (identical value, same design token used in two contexts) for visual consistency, even though only `--border` is directly exercised by the script.
- **Files modified:** `src/app/globals.css`, `scripts/check-dark-contrast.ts` (value literal kept in sync)
- **Verification:** Re-ran `node_modules/.bin/tsx scripts/check-dark-contrast.ts` — all 10 pairs pass, exit 0.
- **Committed in:** `9daef33` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix, explicitly anticipated and pre-authorized by the plan's own Task 3 instructions: "If any pair fails its threshold... adjust only the specific failing CSS variable's lightness... then re-run the script until all pairs pass").
**Impact on plan:** Necessary for correctness (WCAG AA compliance is the plan's own success criterion). No scope creep — only the one failing token's alpha changed; all other `.dark` values are untouched from Task 2.

## Issues Encountered
None beyond the expected contrast-script iteration documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shadow/motion Tailwind utilities (`shadow-sm/md/lg/focus`, `duration-fast/base/slow`, `ease-out/ease-standard`) are ready for Phase 8 (shadcn primitives) and later phases to consume directly in `className`.
- The rebranded `.dark` palette is WCAG AA-verified and ready for use, though no toggle UI exists to activate it yet — activation (if ever added) is out of scope for this phase per the plan and CONTEXT decisions.
- No blockers.

---
*Phase: 07-design-token-foundation*
*Completed: 2026-07-10*

## Self-Check: PASSED

All created/modified files found on disk. All 3 task commit hashes (d5b37df, eab5cd3, 9daef33) found in git log.
