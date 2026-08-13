---
phase: 28-component-motion-rollout-hero-variants-blog-grids
plan: 02
subsystem: ui
tags: [hero, css, tailwind, design-tokens, variant-differentiation]

# Dependency graph
requires:
  - phase: 28-01
    provides: "Pre-change regression baseline (Lighthouse mobile, production build) to compare against"
provides:
  - "variantStyles lookup in src/blocks/Hero/Component.tsx differentiating listing/post-header/case-study-header via padding, overlay opacity, and accent border"
  - "Confirmed CSS-only scope boundary held (config.ts/payload-types.ts untouched)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "variantStyles: Record<NonNullable<HeroBlockProps['variant']>, {...}> module-level lookup for per-variant className composition, keeping the `home` conditional branch byte-identical"

key-files:
  created: []
  modified:
    - src/blocks/Hero/Component.tsx

key-decisions:
  - "listing variant renders zero image-overlay div (flat bg-secondary only) even if media were ever set, per the plan's table — implemented via an explicit !isListing guard in the overlay's conditional render, not just a null overlayOpacity value, so the intent is self-documenting in the JSX"
  - "home branch's className ternary and HeroGrainGradient render kept as a literal string (not variantStyles-driven) to guarantee byte-identical output — confirmed via git diff showing zero line changes inside the isHome branch"

requirements-completed: [UIPOL-03]

# Metrics
duration: 15min
completed: 2026-07-13
---

# Phase 28 Plan 02: Hero Variant Differentiation Summary

**`src/blocks/Hero/Component.tsx` now renders 4 visually distinct Hero treatments via a single `variantStyles` lookup (padding scale, overlay opacity, accent border per variant), with the `home` branch left byte-identical and zero schema changes.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 (1 auto with commit, 1 verification-only)
- **Files modified:** 1

## Accomplishments
- Added `variantStyles` module-level lookup keyed by all 4 `HeroBlockProps['variant']` values (`home`, `listing`, `post-header`, `case-study-header`), each carrying `padding`, `overlayOpacity`, and `border` per the plan's spec table
- `listing`: `py-10 md:py-14`, no image overlay (flat `bg-secondary`), `border-b-4 border-primary`
- `post-header`: `py-12 md:py-16` (unchanged padding value), `opacity-30` overlay when `media` set, `border-t-4 border-primary`
- `case-study-header`: `py-14 md:py-20` (largest), `opacity-45` overlay when `media` set, `border-t-8 border-primary` (double post-header's border width)
- `home` branch's className ternary and `HeroGrainGradient` render path untouched — `git diff` on the commit shows only additions around the new lookup and the non-home branch, zero modified lines inside the `isHome` conditional
- Live-verified `/en` (home, unchanged), `/en/blog` (listing variant: `py-10 md:py-14 border-b-4 border-primary`, breadcrumb `<nav>` present, `<h1>Blog</h1>` present, no overlay div rendered)

## Task Commits

1. **Task 1: Differentiate Hero variants via variantStyles lookup** — `deda1e3` (feat) — `src/blocks/Hero/Component.tsx` only
2. **Task 2: Live verification across all 4 variants** — no commit (verification-only task, zero files touched, per the plan's own `<files>None</files>` declaration)

## Files Created/Modified
- `src/blocks/Hero/Component.tsx` - Added `variantStyles` lookup; restructured the non-home `<section>` className and the image-overlay conditional to read from `variantStyles[variant]`; `isHome` branch untouched

## Verification Evidence

- `npx tsc --noEmit -p tsconfig.json` — zero errors
- `git diff --stat` on the Task 1 commit — only `src/blocks/Hero/Component.tsx` changed (26 insertions, 3 deletions), confirming zero `config.ts`/`payload-types.ts`/migration changes
- `git diff --name-only -- src/blocks/Hero/config.ts` — empty (PASS: config.ts untouched)
- Live dev-server fetch (`npm run dev`, port 3000):
  - `GET /en` → 200, hero `<section>` className is `relative bg-secondary text-secondary-foreground py-16 md:py-24 overflow-hidden` (byte-identical to pre-change), `<h1>Juan Carlos Angulo: Software Engineer & SEO Expert</h1>` renders
  - `GET /en/blog` → 200, hero `<section>` className is `relative bg-secondary text-secondary-foreground py-10 md:py-14 border-b-4 border-primary`, breadcrumb `<nav aria-label="Breadcrumb">` renders, `<h1>Blog</h1>` renders, no `absolute inset-0 opacity-*` overlay div present (listing correctly suppresses it)
  - `GET /servicios` → 200, `GET /en/services` → 200 (both reachable; neither route renders the `hero` block directly today, consistent with `28-CONTEXT.md`'s note — Services pages don't consume this Hero block)
- `post-header`/`case-study-header` variants have no live CMS-authored instance on any route today (per `28-CONTEXT.md`), so their branches were exercised via TypeScript's exhaustiveness check on `variantStyles` (all 4 keys required, verified by `tsc --noEmit` passing) and manual code review, not a live route fetch — this matches the plan's own Task 2 fallback instruction.

## Decisions Made
- Implemented the `listing` overlay suppression as an explicit `!isListing` guard in the JSX condition (rather than relying solely on `overlayOpacity: null` for listing) so a future variant added to the table with a real overlay can't accidentally inherit listing's flat-background behavior by omission.
- Left the `home` branch's className as a literal ternary string rather than routing it through `variantStyles.home` for the render output, to make the "zero risk to home" guarantee mechanically verifiable via `git diff` (the `home` entry in `variantStyles` exists only for type-completeness/exhaustiveness, its values aren't consumed by the home render path).

## Deviations from Plan

None - plan executed exactly as written. Task 2 required no code changes (verification-only), consistent with its own `<files>None</files>` declaration.

## Issues Encountered

None. Dev server started cleanly, all 4 fetched routes returned 200, no hydration warnings observed in the dev log during this verification pass.

## User Setup Required

None - no external service configuration required, no new dependencies.

## Next Phase Readiness

- `variantStyles` pattern is ready to extend if a 5th Hero variant is ever added — just add a key to the `Record`.
- `post-header`/`case-study-header` variants remain unwired to any live route (per `28-CONTEXT.md`, `blog/[slug]`/`case-studies/[slug]` hand-roll their own heroes) — a future phase that wires them into the Hero block would be the first live visual check of those two branches.

---
*Phase: 28-component-motion-rollout-hero-variants-blog-grids*
*Completed: 2026-07-13*

## Self-Check: PASSED

`src/blocks/Hero/Component.tsx` verified present on disk with `variantStyles` grep-matching; commit `deda1e3` verified present in `git log`.
