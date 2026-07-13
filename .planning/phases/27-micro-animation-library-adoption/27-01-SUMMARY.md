---
phase: 27-micro-animation-library-adoption
plan: 01
subsystem: ui
tags: [motion, framer-motion, lazy-motion, reduced-motion, bundle-size, react, nextjs]

# Dependency graph
requires:
  - phase: 16-hero-grainy-gradient-implementation
    provides: "SSR-safe reduced-motion/dark-mode detection pattern (HeroGrainGradient.tsx) replicated verbatim in useReducedMotion()"
  - phase: 26
    provides: "Polished FAQ and TestimonialsCarousel components used as the 2 pilot integration points"
provides:
  - "motion (npm `motion@^12.42.2`) installed and wired via LazyMotion + m + domAnimation"
  - "Root MotionProvider in [locale] layout, paying the animation runtime cost once per route bundle"
  - "Reusable SSR-safe useReducedMotion() hook, framework-agnostic (not tied to Motion's API)"
  - "ScrollReveal and TestimonialCardMotion pilot leaf components proving the LazyMotion pattern end-to-end"
  - "Real measured bundle-size delta (+15KB First Load JS on routes using the pilots) replacing the research estimate"
affects: [28-micro-animation-rollout]

# Tech tracking
tech-stack:
  added: ["motion@^12.42.2"]
  patterns:
    - "LazyMotion + m.* + domAnimation for all future Motion usage (never the full `motion` component import)"
    - "Custom SSR-safe useReducedMotion() hook (useState(false) + useEffect + matchMedia + cleanup) for non-m.* logic, alongside Motion's own MotionConfig reducedMotion=\"user\" for m.* components"
    - "Motion-related client leaves stay small ('use client' wrapper divs); the wrapped content (details, Card) stays untouched — server components keep their server-only status"

key-files:
  created:
    - src/hooks/useReducedMotion.ts
    - src/components/MotionProvider.tsx
    - src/components/ScrollReveal.tsx
    - src/components/TestimonialCardMotion.tsx
  modified:
    - package.json
    - src/app/(frontend)/[locale]/layout.tsx
    - src/blocks/FAQ/Component.tsx
    - src/blocks/TestimonialsCarousel/Component.tsx

key-decisions:
  - "MotionProvider wraps inside NextIntlClientProvider, around SiteHeader/children/SiteFooter — smallest diff that still covers every route in the public frontend tree for Phase 28"
  - "LazyMotion's feature bundle (domAnimation) does NOT show up in 'First Load JS shared by all' — it's loaded as a route-specific chunk only on routes that actually render an m.* component, so the measured delta appears per-route (home, seo-tecnico-lima, seo-tecnico-madrid: +15KB), not in the global shared baseline"
  - "Reduced-motion branches collapse transitions to duration:0/empty animate objects rather than skipping the m.* wrapper entirely, keeping DOM structure identical regardless of the user's OS preference (same discipline as HeroGrainGradient's motionProps branch)"

patterns-established:
  - "Pattern: any future m.* pilot component must import from 'motion/react-m' (not 'motion/react') and consume useReducedMotion() for non-m.*-prop logic"
  - "Pattern: bundle-size verification for future Motion rollout (Phase 28) should measure route-specific First Load JS, not just the shared-by-all baseline, since LazyMotion code-splits per route"

requirements-completed: [MOTION-01, MOTION-02]

# Metrics
duration: 25min
completed: 2026-07-13
---

# Phase 27 Plan 01: Micro-animation Library Adoption Summary

**`motion` installed via LazyMotion+domAnimation with a root provider paid once per route, a reusable SSR-safe `useReducedMotion()` hook, and 2 working pilots (FAQ scroll-reveal, testimonial hover-lift) with a real +15KB First Load JS delta measured against `next build`.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3 (1 checkpoint pre-cleared by orchestrator, 2 auto)
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments
- `motion@^12.42.2` installed after package-legitimacy verification (cleared by orchestrator: official `motiondivision` repo, maintained by Motion/Framer Motion's creator, no deprecation)
- `MotionProvider` (`LazyMotion` + `domAnimation` + `MotionConfig reducedMotion="user"`) wraps the entire public frontend tree exactly once, in `[locale]/layout.tsx`
- `useReducedMotion()` hook replicates `HeroGrainGradient.tsx`'s exact SSR-safe pattern (initial `false`, real `matchMedia` read in `useEffect`, listener cleanup) — reusable outside Motion's own API
- `ScrollReveal` (whileInView fade+rise, IntersectionObserver-backed) wraps every FAQ item
- `TestimonialCardMotion` (whileHover lift) wraps every testimonial `Card`
- Real bundle-size measurement via 3 raw `next build` captures (before / mid-provider / after-pilots), replacing the research's ~19-20KB estimate with an actual measured +15KB First Load JS on the routes that use the pilots

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy check — `motion`** — pre-cleared by orchestrator before this agent was spawned (verified via `npm view motion version repository homepage maintainers`), no separate commit
2. **Task 2: Install motion, create MotionProvider + useReducedMotion, wire root layout** - `2510df6` (feat)
3. **Task 3: Pilot components (FAQ scroll-reveal, Testimonials hover) + final bundle-size diff** - `f2bb1b5` (feat)

_No plan-metadata commit — orchestrator owns STATE.md/ROADMAP.md updates and will make the final metadata commit itself._

## Files Created/Modified
- `src/hooks/useReducedMotion.ts` - SSR-safe reduced-motion hook, reusable by any future animated component
- `src/components/MotionProvider.tsx` - Root LazyMotion + MotionConfig wrapper (`'use client'`)
- `src/components/ScrollReveal.tsx` - Generic scroll-reveal leaf (`motion/react-m`, `whileInView`)
- `src/components/TestimonialCardMotion.tsx` - Generic hover-lift leaf (`motion/react-m`, `whileHover`)
- `package.json` - `motion` dependency pinned to `^12.42.2`
- `src/app/(frontend)/[locale]/layout.tsx` - `MotionProvider` wraps `SiteHeader`/`children`/`SiteFooter` inside `NextIntlClientProvider`
- `src/blocks/FAQ/Component.tsx` - Each FAQ `<details>` item wrapped in `<ScrollReveal>`
- `src/blocks/TestimonialsCarousel/Component.tsx` - Each testimonial `Card` wrapped in `<TestimonialCardMotion>`

## Bundle-Size Measurement (real, via raw `next build`)

Command used throughout: `npx next build` (never `npm run build`, which runs `payload migrate` against the live production Neon DB first — irrelevant and unsafe for a pure frontend change).

| Stage | `/[locale]` route own size | `/[locale]` First Load JS | First Load JS shared by all |
|---|---|---|---|
| Before `motion` | 2.08 kB | 158 kB | 101 kB |
| After provider wired (no pilots yet) | 2.08 kB | 158 kB | 101 kB |
| After pilots (ScrollReveal + TestimonialCardMotion) | 2.32 kB | 173 kB | 101 kB |

**Real delta: +15KB First Load JS**, applied only to routes that actually render an `m.*` component (home `/`, `/seo-tecnico-lima`, `/seo-tecnico-madrid` — everywhere FAQ or Testimonials render). Routes without these blocks (e.g. `/services`, `/contact`) show **zero** bundle growth.

Compared to STACK-v1.6.md's ~19-20KB gzip estimate: the measured **+15KB is lower than the research estimate**, and — notably — **it does not land in the shared-by-all bundle at all**. `LazyMotion` code-splits the `domAnimation` feature set into a per-route chunk that only loads on routes actually rendering an `m.*` component, rather than adding to the global 101 kB shared baseline paid by every route (including ones with zero animation, e.g. `/admin`, `/api/*`). This is a more favorable result than the flat "~20KB paid once sitewide" framing in the research: the real cost is paid only by routes that use motion, and it's smaller than expected.

This is a finding worth carrying into Phase 28: as more routes adopt `m.*` components, watch whether Next's chunking keeps sharing this feature-set chunk across those routes (likely, since it's the same dynamic import target) or whether each route pulls its own copy — re-measure after 2-3 more rollout components land.

## Decisions Made
- `MotionProvider` placement: inside `NextIntlClientProvider`, wrapping `SiteHeader`/`{children}`/`SiteFooter` — smallest diff to `layout.tsx` while still covering every route Phase 28 will touch.
- Kept both `MotionConfig reducedMotion="user"` (Motion's own OS-preference gate, applies automatically to every `m.*` component) AND the standalone `useReducedMotion()` hook (for future logic that doesn't go through `m.*` at all, per MOTION-02's explicit reusability requirement) rather than picking one over the other — they serve different call sites.
- Reduced-motion branches in both pilots collapse transitions to `duration: 0` / empty animate targets instead of conditionally skipping the `m.*` wrapper, so DOM structure is identical in both motion states.

## Deviations from Plan

None - plan executed exactly as written. Task 1's checkpoint was pre-cleared by the orchestrator (documented in the plan's own task block as an already-resolved gate) before this execution agent was spawned, so no separate checkpoint pause was needed inside this run.

## Issues Encountered

None specific to this plan's files. One unrelated pre-existing error was observed in the dev server log during live verification (`TypeError: Cannot read properties of undefined (reading 'call')` on `/blog/pilas-y-colas`) — this is a blog-slug route this plan does not touch, out of scope per the deviation-rules scope boundary, not fixed, not blocking. FAQ and Testimonials render cleanly on `/en`, `/es`, `/en/seo-tecnico-lima`, `/en/seo-tecnico-madrid` with zero hydration-mismatch warnings in the dev log.

## User Setup Required

None - no external service configuration required. `motion` is a plain npm dependency with no API keys or dashboard setup.

## Next Phase Readiness

Phase 28 (full Motion rollout to Hero variants, blog grids, remaining Phase 26 components) can proceed without re-litigating the library choice or re-deriving the SSR-safe reduced-motion pattern:
- `MotionProvider` already covers every route in the public frontend tree.
- `useReducedMotion()` is ready to reuse as-is.
- The `motion/react-m` + `LazyMotion` import discipline is proven end-to-end on 2 real components.
- Re-measure bundle size after 2-3 more Phase 28 components land motion, to confirm whether the `domAnimation` feature chunk is shared across routes or duplicated per route (open question noted above).

---
*Phase: 27-micro-animation-library-adoption*
*Completed: 2026-07-13*

## Self-Check: PASSED

All created files verified present on disk; both task commits (2510df6, f2bb1b5) verified present in git log.
