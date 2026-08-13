---
phase: 26-ui-ux-polish-pass-low-risk-components
plan: 01
subsystem: frontend-blocks
tags: [ui-polish, tailwind, cta, faq, client-logos, testimonials]
dependency-graph:
  requires: []
  provides: [cta-container-fix, faq-card-grouping, client-logo-normalization, testimonials-edge-fade]
  affects: [src/blocks/CallToAction/Component.tsx, src/blocks/FAQ/Component.tsx, src/blocks/ClientLogosBlock/Component.tsx, src/blocks/TestimonialsCarousel/Component.tsx]
tech-stack:
  added: []
  patterns: [single-Container-per-block, lucide-react-icon-glyph, fixed-height-flex-cell-for-images, css-only-edge-fade-affordance]
key-files:
  created: []
  modified:
    - src/blocks/CallToAction/Component.tsx
    - src/blocks/FAQ/Component.tsx
    - src/blocks/ClientLogosBlock/Component.tsx
    - src/blocks/TestimonialsCarousel/Component.tsx
decisions: []
metrics:
  duration: 18min
  completed: 2026-07-13
---

# Phase 26 Plan 01: CTA Container Fix + FAQ/ClientLogos/Testimonials Visual Polish Summary

CallToAction now renders inside a single `Container` (killing the full-viewport-width card bleed Juan named directly), FAQ items became bordered/elevated cards with a `Plus` icon glyph, client logos normalize to a fixed-height flex cell instead of a distorting fixed box, and the testimonials scroll row gained a right-edge gradient fade affordance — all four fixes are pure Tailwind/JSX edits with zero schema/config/data-fetching changes.

## What Was Built

**Task 1 — CTA Container fix + FAQ visual grouping** (commit `a538949`)
- `CallToAction/Component.tsx`: the whole card section (`HeroGrainGradient`, gradient overlay, content) now lives inside a single outer `Container className="py-12 md:py-16"`. The former inner `Container` became a plain `div` with the same classes, so only one `Container` (one `max-w-6xl px-4 md:px-6`) applies in the tree. This is what makes the rounded card corners read as an intentional shape instead of edge-to-edge bleed.
- `FAQ/Component.tsx`: replaced the flat `divide-y divide-border` list with `space-y-3` + per-item `rounded-lg border border-border bg-card px-6 shadow-sm hover:shadow-md`. Swapped the bare `+` text glyph for lucide-react's `Plus` icon (`group-open:rotate-45` rotation preserved). Native `<details>`/`<summary>` semantics untouched.

**Task 2 — ClientLogos scale normalization + Testimonials scroll affordance** (commit `909e419`)
- `ClientLogosBlock/Component.tsx`: each logo now sits inside `div className="flex h-10 md:h-12 items-center"`, with the `Image`'s rendered size overridden to `h-full w-auto max-w-[140px]` (props kept at `width={160}/height={48}` for Next.js layout-shift prevention). Logos now normalize by height, not by a distorting fixed box.
- `TestimonialsCarousel/Component.tsx`: scroll row wrapped in a `relative` div with a sibling `pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent` fade, hinting more content is scrollable.

## Verification

- `npx tsc --noEmit -p tsconfig.json`: zero errors referencing any of the 4 touched files.
- `git status --short` on both commits: only the 4 `Component.tsx` files changed — zero `config.ts`/`payload-types.ts`/migration diffs.
- Live dev server (`npm run dev`, curl against `http://localhost:3000/` and `http://localhost:3000/en`): all 4 target class strings (`py-12 md:py-16`, `rounded-lg border border-border bg-card`, `h-10 md:h-12`, `bg-gradient-to-l`) confirmed present in both locales' rendered HTML. Direct inspection of the CTA section's surrounding markup confirmed it now nests inside a single `max-w-6xl` Container div, not edge-to-edge.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched the UI-SPEC's exact code contracts verbatim.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/blocks/CallToAction/Component.tsx
- FOUND: src/blocks/FAQ/Component.tsx
- FOUND: src/blocks/ClientLogosBlock/Component.tsx
- FOUND: src/blocks/TestimonialsCarousel/Component.tsx
- FOUND commit: a538949
- FOUND commit: 909e419
