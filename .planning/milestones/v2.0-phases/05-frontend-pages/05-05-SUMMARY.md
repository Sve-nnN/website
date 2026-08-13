---
phase: 05-frontend-pages
plan: 05
subsystem: ui
tags: [react, next-intl, e-e-a-t, cloudinary]

requires:
  - phase: 05-01
    provides: Container/shadcn primitives
  - phase: 05-02
    provides: Header/Footer globals, Authors E-E-A-T fields
provides:
  - SiteHeader/SiteFooter wired into every [locale] route
  - AuthorByline (compact) / AuthorCard (expanded E-E-A-T)
  - getFallbackHeroImage(slug) deterministic hero-image fallback utility
affects: [05-06, 05-07, 05-08, 05-09, 05-10]

tech-stack:
  added: []
  patterns:
    - "LocaleSwitcher is a small client component (usePathname) carved out of the otherwise-async server SiteHeader, preserving the current path across locale switches"
    - "Social platform icons (linkedin/github/x/website) use generic lucide-react substitutes (Link2/Code2/AtSign/Globe) consistently across SiteFooter, AuthorCard, and ContactFormBlock, since lucide-react ships no brand icons"
    - "getFallbackHeroImage uses FNV-1a hash mod 53 for deterministic slug-to-fallback-image mapping"

key-files:
  created:
    - src/components/SiteHeader.tsx
    - src/components/SiteFooter.tsx
    - src/components/LocaleSwitcher.tsx
    - src/components/AuthorByline.tsx
    - src/components/AuthorCard.tsx
    - src/lib/heroImageFallback.ts
  modified:
    - src/app/(frontend)/[locale]/layout.tsx

key-decisions:
  - "Added LocaleSwitcher.tsx (not in the plan's declared file list) as a Rule 2 addition — a correct locale-preserving switcher requires a client-side usePathname read, which the async server SiteHeader can't do inline"
  - "Reused the Link2/Code2/AtSign/Globe generic icon substitution pattern from 05-04's ContactFormBlock for consistency across all social-link renderers"

patterns-established:
  - "AuthorByline/AuthorCard are the canonical E-E-A-T components — 05-08/05-09/05-10 must import these, not build divergent author presentations"

requirements-completed: [CONT-01, CONT-02]

duration: 30min
completed: 2026-07-09
---

# Phase 5 Plan 05: Site Chrome + E-E-A-T Author Components + Hero Fallback Summary

**SiteHeader/SiteFooter rendering the Header/Footer globals site-wide, AuthorByline/AuthorCard E-E-A-T components, and a deterministic FNV-1a hero-image fallback replicating the old site's 53-image Cloudinary pool behavior.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3 completed
- **Files modified:** 7

## Accomplishments
- `SiteHeader`/`SiteFooter` now render on every `[locale]` route, sourced entirely from the `Header`/`Footer` globals (logo, navItems, ctaButton, columns, socialLinks, legalLinks, copyrightText)
- Locale switcher preserves the current path across `/es` ↔ `/en`
- `AuthorByline` (compact) and `AuthorCard` (expanded E-E-A-T: credentials, yearsExperience with locale-aware label, socialLinks) built as the shared components later post/case-study/author page plans will import
- `getFallbackHeroImage(slug)` deterministically maps any slug to one of the 53 known-reachable Cloudinary fallback images, verified stable across repeated calls

## Task Commits

1. **Task 1: SiteHeader + SiteFooter, wired into locale layout** - `cc95b53` (feat)
2. **Task 2: AuthorByline + AuthorCard** - `7734a35` (feat)
3. **Task 3: Deterministic hero-image fallback utility** - `3e1983c` (feat)

## Files Created/Modified
- `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx` - global-sourced site chrome
- `src/components/LocaleSwitcher.tsx` - path-preserving locale switch (Rule 2 addition)
- `src/components/AuthorByline.tsx`, `src/components/AuthorCard.tsx` - E-E-A-T components
- `src/lib/heroImageFallback.ts` - deterministic fallback utility
- `src/app/(frontend)/[locale]/layout.tsx` - wired SiteHeader/SiteFooter around `{children}`

## Decisions Made
- Added `LocaleSwitcher.tsx` as a small client component to correctly preserve the current path when switching locale (the plan's "preserve current path" requirement can't be satisfied from a purely async server `SiteHeader` without either this or new i18n navigation plumbing)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added LocaleSwitcher.tsx for correct path-preserving locale switching**
- **Found during:** Task 1 (SiteHeader)
- **Issue:** The plan requires the locale switcher to "preserve the current path," which needs a client-side `usePathname` read — not achievable inline in the async server `SiteHeader` component
- **Fix:** Extracted a small `'use client'` `LocaleSwitcher` component that strips/rebuilds the locale prefix per `routing.ts`'s `localePrefix: 'as-needed'`
- **Files modified:** src/components/LocaleSwitcher.tsx, src/components/SiteHeader.tsx
- **Committed in:** cc95b53

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary for the locale switcher to actually satisfy its stated requirement. No scope creep — single small component, same file-count neighborhood as the plan's declared list.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Every `[locale]` page now has consistent site chrome. Wave 4 page plans (05-08/05-09/05-10 especially) should import `AuthorByline`/`AuthorCard` directly rather than building their own author presentation, and 05-08 should call `getFallbackHeroImage` wherever `post.heroImage` is falsy.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
