---
phase: 08-shadcn-primitives-global-chrome
plan: 01
subsystem: ui
tags: [tailwind, shadcn, cva, design-tokens, box-shadow, transition]

requires:
  - phase: 07-design-token-foundation
    provides: "--shadow-sm/md/lg/focus, --motion-fast/base/slow, --ease-out/standard CSS vars wired into tailwind.config.ts theme.extend"
provides:
  - "All 12 shadcn primitives (button, input, textarea, select, badge, tabs, card, sheet, navigation-menu, separator, skeleton, avatar) resolve elevation/motion through Phase 7's named tokens instead of Tailwind's bare/unnamed shadow and untimed transitions"
affects: [09, 10, site-header, site-footer]

tech-stack:
  added: []
  patterns:
    - "cva() base/variant strings use shadow-sm/md/lg/focus (never bare `shadow`) and duration-fast/base/slow + ease-out/standard for all interactive and elevation surfaces"

key-files:
  created: []
  modified:
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/textarea.tsx
    - src/components/ui/select.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/card.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/navigation-menu.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/avatar.tsx

key-decisions:
  - "skeleton.tsx received no functional change (animate-pulse is a tailwindcss-animate keyframe, not part of the --motion-* family) — added a code comment documenting this is intentional, not missed"
  - "FAQ's plain (non-Radix) accordion implementation is out of scope for this plan per 08-CONTEXT.md discretion clause — flagged as a candidate for a later phase, not acted on here"

requirements-completed: [UI-04]

duration: 15min
completed: 2026-07-10
---

# Phase 08 Plan 01: shadcn Primitive Token Refinement Summary

**Replaced every bare/unnamed `shadow` and untimed `transition-colors`/`transition-all` across all 12 shadcn primitives with Phase 7's named `shadow-sm/md/lg/focus` and `duration-fast/base/slow` + `ease-out/standard` tokens, closing the real gap where `theme.extend.boxShadow` has no `DEFAULT` key.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-10T06:44:50Z
- **Completed:** 2026-07-10
- **Tasks:** 2/2 completed
- **Files modified:** 12

## Accomplishments
- All interactive controls (button, input, textarea, select, badge, tabs) now show CSS-only hover/focus/press treatment driven by named tokens, with `focus-visible:shadow-focus` layered on top of (not replacing) the existing accessible ring
- All elevation-bearing primitives (card, sheet, navigation-menu viewport, avatar, skeleton, separator) resolve box-shadow through named `--shadow-sm/md/lg` tokens instead of Tailwind's default unnamed `shadow`
- Zero new npm dependencies, zero `cva()` variant key/prop-interface/Radix-import changes — pure className token substitution

## Task Commits

1. **Task 1: Token-driven hover/focus/press on interactive controls** - `1b34795` (feat)
2. **Task 2: Token-driven elevation on structural/overlay primitives** - `36fc47d` (feat)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `src/components/ui/button.tsx` - transform-only active press, hover:shadow-md, focus-visible:shadow-focus, timed transitions
- `src/components/ui/input.tsx` - shadow-focus on focus, timed color/box-shadow transition
- `src/components/ui/textarea.tsx` - same as input
- `src/components/ui/select.tsx` - SelectTrigger gets shadow-focus + timed transition; SelectContent gets duration-fast alongside existing animate-in/out
- `src/components/ui/badge.tsx` - shadow-sm on default/destructive, timed transition-colors
- `src/components/ui/tabs.tsx` - TabsTrigger timed transition, active state shadow-sm
- `src/components/ui/card.tsx` - shadow-sm resting elevation with hover:shadow-md lift
- `src/components/ui/sheet.tsx` - hardcoded duration-300/500 replaced with duration-base/slow tokens
- `src/components/ui/navigation-menu.tsx` - viewport shadow-md, trigger style timed transition
- `src/components/ui/separator.tsx` - added transition-colors duration-fast for future color states
- `src/components/ui/skeleton.tsx` - comment-only, documents intentional no-shadow/motion surface
- `src/components/ui/avatar.tsx` - added shadow-sm + timed transition-shadow

## Decisions Made
- Kept skeleton.tsx functionally unchanged (its `animate-pulse` keyframe is outside the `--motion-*` transition-duration family) and documented why via inline comment, per plan instruction.
- Left FAQ's non-Radix accordion untouched — not one of the 12 named primitives, and adding `@radix-ui/react-accordion` would violate the "no new dependencies" constraint; noted as a Phase 10 candidate per 08-CONTEXT.md's discretion clause.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 12 primitives are ready for 08-02 (SiteHeader/SiteFooter restyle) to consume as-is — no further prop/API changes needed, only styling landed. `npx tsc --noEmit` passes clean; `git diff --stat HEAD~2 HEAD -- src/components/ui/` confirms exactly the 12 planned files changed, no others; `package.json` diff is empty (no new dependency).

---
*Phase: 08-shadcn-primitives-global-chrome*
*Completed: 2026-07-10*
