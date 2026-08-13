---
phase: 11-verificacion-cruzada-final
plan: 01
subsystem: ui
tags: [wcag, contrast, accessibility, oklch, css-variables, tailwind, i18n-audit, schema-diff]

requires:
  - phase: 07-tokens-shadow-motion-rebrand
    provides: ".dark theme WCAG-verified palette + check-dark-contrast.ts base script"
  - phase: 08-shadcn-primitives-chrome
    provides: "primitive components consuming the token set (Badge, Button, Card)"
provides:
  - "scripts/check-wcag-contrast-full.ts: reusable both-theme (light + dark) WCAG AA contrast checker with oklch() support"
  - "4 fixed light-theme WCAG AA contrast failures in src/app/globals.css (--primary, --primary-foreground, --muted-foreground, --border)"
  - "Confirmed zero hardcoded-content and zero schema-drift across the full 2e22e9b..HEAD milestone range"
affects: [12-deploy-cutover]

tech-stack:
  added: []
  patterns:
    - "OKLab->linear-sRGB conversion (CSS Color 4 matrix) for contrast-checking oklch() tokens, reusing existing hex/rgba WCAG math verbatim"

key-files:
  created:
    - scripts/check-wcag-contrast-full.ts
    - .planning/phases/11-verificacion-cruzada-final/11-01-contrast-report.md
  modified:
    - src/app/globals.css

key-decisions:
  - "Fixed light-theme --primary-foreground by swapping to dark navy (#12141C) rather than darkening --primary further, mirroring the already-WCAG-verified .dark theme's dark-text-on-primary pattern — smaller visual delta than the alternative of darkening the brand orange enough for white text to pass."
  - "Left --input unchanged (only --border was in the tested pair list) to keep the fix minimal-scope, per plan's smallest-possible-change guidance."
  - "SiteHeader.tsx's hardcoded 'Juan Carlos Angulo' logo-fallback string investigated and confirmed pre-existing (Phase 5, not touched by Phase 7-10 commits) — left as-is, out of scope for this audit."

patterns-established:
  - "Both-theme WCAG contrast checking as a standard pre-close gate for any future token change"

requirements-completed: [UI-11, UI-13]

duration: 8min
completed: 2026-07-10
---

# Phase 11 Plan 01: WCAG Contrast + Hardcoded-Content + Schema-Drift Audit Summary

**Both-theme WCAG AA contrast checker found and fixed 4 real light-theme failures (unverified since shadcn scaffold); zero hardcoded content and zero schema drift confirmed across the full milestone diff.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-10T08:32:53Z
- **Completed:** 2026-07-10T08:37:09Z
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created script, 1 modified CSS, 1 created report)

## Accomplishments
- Built `scripts/check-wcag-contrast-full.ts`, extending Phase 7's dark-only checker with an `oklch()`-to-sRGB conversion (CSS Color 4 OKLab matrix), covering all 10 token pairs in both `:root` (light) and `.dark` palettes — 20 total checks.
- Discovered 4 genuine light-theme WCAG AA failures that had never been checked: `muted-foreground/muted` (4.35 vs 4.5), `primary-foreground/primary` (2.97 vs 4.5), `primary/background` (2.97 vs 3.0), `border/background` (1.20 vs 3.0).
- Fixed all 4 via minimal token-value adjustments in `src/app/globals.css`; dark theme confirmed unchanged/still-passing (10/10, matches Phase 7).
- Ran the final hardcoded-content grep across every Phase 7-10 touched source file: zero genuine violations found.
- Confirmed zero `config.ts`/`payload-types.ts` diff across the full milestone range (`2e22e9b..HEAD`, Phase 5 close through current HEAD).

## Task Commits

1. **Task 1: Build and run the both-theme WCAG contrast checker** - `46110fb` (feat)
2. **Task 2: Final hardcoded-content grep + full-milestone-range config/types diff** - `d50a554` (docs)

## Files Created/Modified
- `scripts/check-wcag-contrast-full.ts` - Both-theme (light+dark) WCAG AA contrast checker with oklch() parsing
- `src/app/globals.css` - `:root` light-theme token fixes: `--primary` `#FF5B1F`->`#F7581E`, `--primary-foreground` `#FAFAF7`->`#12141C`, `--muted-foreground` oklch L `0.556`->`0.54`, `--border` oklch L `0.922`->`0.63`
- `.planning/phases/11-verificacion-cruzada-final/11-01-contrast-report.md` - Full pass/fail table, grep findings, schema-diff confirmation

## Decisions Made
- `--primary-foreground` fix mirrors the `.dark` theme's already-verified dark-text-on-primary pattern instead of further darkening the brand orange (smaller, more consistent visual delta).
- `--input` left untouched — not in the tested pair list, kept fix scope minimal.
- SiteHeader.tsx's logo-fallback text confirmed pre-existing (Phase 5), not a Phase 7-10 regression — left as-is.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 4 light-theme WCAG AA contrast failures**
- **Found during:** Task 1 (both-theme contrast checker build)
- **Issue:** `--muted-foreground`, `--primary-foreground`, `--primary`, and `--border` in the light `:root` theme all failed WCAG AA — these shadcn-scaffold defaults and the brand primary color pairing had never been contrast-checked since Phase 7 only verified `.dark`.
- **Fix:** Adjusted 4 CSS custom property values in `src/app/globals.css` `:root` block (see Files Created/Modified above); all consumers read these via Tailwind CSS-variable tokens, so no component code changes were needed (confirmed via grep of `bg-primary`/`primary-foreground` usages).
- **Files modified:** `src/app/globals.css`
- **Verification:** `node_modules/.bin/tsx scripts/check-wcag-contrast-full.ts` — 20/20 PASS after fix.
- **Committed in:** `46110fb` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1, contrast bug — 4 token values)
**Impact on plan:** Fix necessary for WCAG AA correctness; zero component/JSX changes required since the design system already composes tokens correctly. No scope creep.

## Issues Encountered
None beyond the contrast fixes documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both themes now pass WCAG AA on every checked token pair; safe baseline for Plan 11-02/11-03's remaining checks.
- Full-milestone schema-drift and hardcoded-content audits both clean — no blockers for closing the milestone's UI/UX polish scope.

---
*Phase: 11-verificacion-cruzada-final*
*Completed: 2026-07-10*
