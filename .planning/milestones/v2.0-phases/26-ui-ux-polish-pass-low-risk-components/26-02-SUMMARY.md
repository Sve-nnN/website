---
phase: 26-ui-ux-polish-pass-low-risk-components
plan: 02
subsystem: ui
tags: [react, nextjs, client-component, usePathname, tailwind, aria]

# Dependency graph
requires:
  - phase: 25-live-site-fixes-and-polish
    provides: normalizeServiceHref locale-fix logic in SiteHeader, reused unchanged
provides:
  - SiteHeaderChrome client component owning scroll-state and active-route logic
  - CMSLink aria-current pass-through support
affects: [27-motion-polish, 28-hero-variants]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-fetch component delegates interactive rendering to a sibling 'use client' component receiving already-resolved props (same split as LocaleSwitcher.tsx precedent)"

key-files:
  created: [src/components/SiteHeaderChrome.tsx]
  modified: [src/components/SiteHeader.tsx, src/components/CMSLink.tsx]

key-decisions:
  - "Extended CMSLink with an optional aria-current prop (forwarded to the underlying next/link anchor) instead of duplicating link-rendering logic inside SiteHeaderChrome -- CMSLink was not in the plan's files_modified list but is required for the active-route indicator to reach the DOM"
  - "Active-route matching normalizes both the current pathname and each navItem's already-locale-corrected url by stripping known locale prefixes and trailing slashes, then does exact-string comparison (no prefix matching), per UI-SPEC's match rule"

patterns-established:
  - "Client subcomponent boundary for Server Component + browser API (usePathname, window.scrollY) needs -- SiteHeaderChrome mirrors LocaleSwitcher.tsx's existing precedent"

requirements-completed: [UIPOL-02]

duration: 8min
completed: 2026-07-13
---

# Phase 26 Plan 02: SiteHeader Scroll State + Active Route Summary

**SiteHeader now shifts to a 95%-opacity/blur/shadow-lg background past an 8px scroll threshold and shows a persistent ember underline + `aria-current="page"` on the nav item matching the current route, on both desktop and mobile Sheet nav, via a new `SiteHeaderChrome` client component.**

## Performance

- **Duration:** ~8 min (first commit to last commit)
- **Started:** 2026-07-13T00:26:50-05:00
- **Completed:** 2026-07-13T00:28:35-05:00
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Extracted all interactive header markup (scroll-state header classes, desktop nav, mobile Sheet nav, CTA, logo) from the async Server Component `SiteHeader` into a new `'use client'` `SiteHeaderChrome`, which owns a `window.scrollY` listener (passive, threshold 8px, cleaned up on unmount) and `usePathname()`-based active-route matching.
- `SiteHeader.tsx` is now a thin server-side data-fetching wrapper: unchanged `payload.findGlobal('header', ...)` call and unchanged `normalizeServiceHref` locale-fix mapping, delegating all rendering to `SiteHeaderChrome`.
- Active-route indicator (persistent `border-primary text-primary` + `aria-current="page"`) applied identically to both the desktop `NavigationMenuLink`/`CMSLink` and the mobile `Sheet` `CMSLink`, verified live on `/servicios` (es) and `/en/services` (en).
- Verified via `npx tsc --noEmit` (zero errors), `npm run build` (completes cleanly, no client/server boundary violations), and a live `npm run dev` check confirming `aria-current="page"` renders server-side on the matching nav item with no hydration-mismatch warnings in the dev log.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SiteHeaderChrome client component with scroll-state + active-route logic** - `eb4ddde` (feat)
2. **Task 2: Wire SiteHeader.tsx to delegate to SiteHeaderChrome + verify build** - `d485871` (feat)

_No separate plan-metadata commit -- orchestrator owns STATE.md/ROADMAP.md writes per this plan's instructions._

## Files Created/Modified
- `src/components/SiteHeaderChrome.tsx` - New client component: scroll-state boolean (window scroll listener), active-route matching (usePathname + locale-prefix/trailing-slash normalization), full header/nav/Sheet JSX moved here from SiteHeader.tsx
- `src/components/SiteHeader.tsx` - Reduced to async Server Component that fetches the `header` global, applies the existing `normalizeServiceHref` locale-fix, and renders `<SiteHeaderChrome navItems={...} ctaButton={...} logo={...} locale={...} />`
- `src/components/CMSLink.tsx` - Added optional `'aria-current'?: 'page' | boolean'` prop, forwarded to the rendered `next/link` anchor in both the plain-link and `appearance` (Button-wrapped) render paths

## Decisions Made
- **CMSLink extension (not in plan's files_modified):** the plan specified only `SiteHeader.tsx` and `SiteHeaderChrome.tsx` as modified files, but `CMSLink` had no mechanism to accept or forward `aria-current` to its rendered anchor -- without this, the active-route indicator's `aria-current="page"` attribute could never reach the DOM regardless of how `SiteHeaderChrome` computed the active state. Rule 3 (auto-fix blocking issue): added a minimal, backward-compatible optional prop rather than reimplementing link rendering inside `SiteHeaderChrome`.
- **Locale-prefix-stripping match rule:** implemented via `routing.locales` reduce (same pattern `LocaleSwitcher.tsx` already uses for its own prefix-swap logic), applied to both sides of the comparison (current pathname and each navItem's url) so the match is robust regardless of whether the stored url already carries a `/en` prefix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended CMSLink to accept and forward `aria-current`**
- **Found during:** Task 1 (SiteHeaderChrome creation)
- **Issue:** `CMSLinkProps` had no prop to pass `aria-current="page"` through to the rendered anchor; without it, the plan's required active-route `aria-current` attribute could not reach the DOM via the existing `CMSLink` component
- **Fix:** Added `'aria-current'?: 'page' | boolean` to `CMSLinkProps`, forwarded to the `next/link` `<Link>` element in both the plain and `appearance`-wrapped (Button asChild) render branches
- **Files modified:** `src/components/CMSLink.tsx`
- **Verification:** Live curl of `/servicios` and `/en/services` shows `aria-current="page"` present on the matching desktop nav anchor; `npx tsc --noEmit` and `npm run build` both pass
- **Committed in:** `eb4ddde` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the plan's own acceptance criteria (aria-current on the active nav item) to be achievable at all. No scope creep -- change is a minimal, additive, backward-compatible prop on an existing shared component.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `SiteHeader`'s Local API fetch and locale-fix logic remain byte-identical, confirmed unchanged in both `git diff` and live verification -- no risk to Phase 27-28 motion/Hero work that also touches nav-adjacent surfaces.
- Zero config.ts/schema/migration files touched (confirmed via `git diff --stat` across both commits).
- `SiteHeaderChrome` is a clean extension point if Phase 27 needs to add motion/animation to the header (scroll-state transition already uses the established `--duration-base`/`--ease-standard` tokens).

---
*Phase: 26-ui-ux-polish-pass-low-risk-components*
*Completed: 2026-07-13*

## Self-Check: PASSED

- FOUND: src/components/SiteHeaderChrome.tsx
- FOUND: src/components/SiteHeader.tsx
- FOUND: src/components/CMSLink.tsx
- FOUND: .planning/phases/26-ui-ux-polish-pass-low-risk-components/26-02-SUMMARY.md
- FOUND: commit eb4ddde
- FOUND: commit d485871
