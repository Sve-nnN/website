# Phase 28: Component Motion Rollout + Hero Variants + Blog Grids - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Mode:** Manual (Skill tool unavailable this session — autonomous run via gsd-* agents)

<domain>
## Phase Boundary

Hero block variants (`listing`/`post-header`/`case-study-header`) become visually distinguishable from each other; blog grid (`/blog`, `FeaturedPostsBlock`) gets polished visual treatment with scroll-reveal/hover consistent with existing Motion pattern; every animated component across Phases 26-28 consistently uses `useReducedMotion()`; closes with a Lighthouse/CWV mobile regression gate (same pattern as v1.5 Phase 25).

Requirements: UIPOL-03, UIPOL-07, UIPOL-08, MOTION-03, MOTION-04.

</domain>

<decisions>
## Implementation Decisions

### Hero variant scope: MINIMAL (Juan, 2026-07-13)
`post-header`/`case-study-header` are not wired into any live route today (`blog/[slug]` and `case-studies/[slug]` hand-roll their own hero sections, bypassing the `Hero` block entirely — confirmed in research, matches Phase 26 UI-SPEC note at `26-UI-SPEC.md:375`).

Decision: differentiate the 3 variants **inside `src/blocks/Hero/Component.tsx` only**, via CSS (padding scale, overlay opacity/gradient, accent border color drawn from existing `--primary`/`--secondary` tokens) — no new fields on `HeroBlock`/`config.ts`, no rewiring of `blog/[slug]` or `case-studies/[slug]` to consume the Hero block. This satisfies the ROADMAP's literal "visually distinguishable" criterion at low regression risk (no live JSON-LD/H1-bearing page touched).

Explicitly OUT of scope for Phase 28: migrating `blog/[slug]`/`case-studies/[slug]` hand-rolled heroes onto the `Hero` block, and extending `HeroBlock` schema with `heroMetric`/category fields.

### Motion pattern: reuse exactly, do not reinvent
Any new `m.*` usage (blog grid entrance/hover) must reuse the existing `ScrollReveal`/`TestimonialCardMotion` pattern: `motion/react-m` import, render inside the existing single `MotionProvider` (no second provider), `useReducedMotion()` gating. `PostCard.tsx` already has a CSS-only hover (`group-hover:scale-105`) — Phase 28 should decide whether to keep it CSS-only or migrate to `whileHover` `m.div`, not both.

### Bundle-cost baseline (carried from Phase 27)
The `+15KB` Motion/LazyMotion cost is already paid sitewide by every Pages/RenderBlocks-template route (static-import driven), not additively per new pilot — so adding ScrollReveal to `ArchiveBlock`/`FeaturedPostsBlock` (both RenderBlocks-reachable) does not add further route-scoped cost beyond what Phase 27 already paid. No new bundle-size measurement needed for in-scope work; only re-verify if Motion gets wired into `blog/[slug]`/`case-studies/[slug]` (out of scope per above).

### CWV/regression gate: reuse Phase 25 tooling verbatim
`scripts/capture-service-page-snapshot.mjs` + `scripts/lighthouse-mobile.mjs` (both already exist, used in v1.5 Phase 25 at `.planning/milestones/v1.5-phases/25-service-page-visual-polish/`) — capture baseline before changes, re-capture after, diff with the same thresholds (H1 count/text/BreadcrumbList identical; Performance score drop >5pts = FAIL; any CWV metric LCP/CLS/TBT crossing into a worse band = FAIL). Deliverable: `28-REGRESSION-DIFF.md` with explicit PASS/FAIL verdict, same as `25-REGRESSION-DIFF.md`.

Representative routes: `/en`, `/es`, `/en/blog` (Hero listing + ArchiveBlock + FeaturedPostsBlock touched), plus any other route rendering the Hero block in `listing` variant (services index, GEO pages).

</decisions>

<code_context>
## Existing Code Insights

Full research report from gsd-phase-researcher (2026-07-13), key files:
- `src/blocks/Hero/Component.tsx` (91 lines), `src/blocks/Hero/config.ts` — confirmed pixel-identical across `listing`/`post-header`/`case-study-header` except breadcrumbs.
- `src/blocks/ArchiveBlock/Component.tsx` — actual blog grid (category tabs + 3-col grid of PostCard/CaseStudyCard).
- `src/blocks/FeaturedPostsBlock/Component.tsx` — plain grid, no motion yet.
- `src/components/PostCard.tsx` — shadcn Card, existing CSS-only hover (`group-hover:scale-105`).
- `src/hooks/useReducedMotion.ts`, `src/components/MotionProvider.tsx`, `src/components/ScrollReveal.tsx`, `src/components/TestimonialCardMotion.tsx` — Phase 27 pattern to replicate exactly.
- `src/app/globals.css` — tokens: `--primary` (#F7581E light / #FF7A45 dark), `--primary-text`, `--secondary` (#12141C navy, current Hero bg for non-home variants), `--secondary-foreground`.
- `src/lib/breadcrumbs.ts` — `buildTrail()`/`buildCaseStudiesTrail()`/`buildBreadcrumbJsonLd()`, reuse if breadcrumb work touches case-study routes (not expected given minimal scope).
- `scripts/capture-service-page-snapshot.mjs`, `scripts/lighthouse-mobile.mjs` — reusable verbatim for the closing gate.
- Phase 26 convention: every content block wraps in `Container`; reuse Phase 7/10 duration/elevation tokens, don't invent new spacing/shadow scales.

</code_context>

<specifics>
## Specific Ideas

Lowest-risk Hero differentiation path (researcher recommendation, adopted): vary padding scale (`py-12`/`py-10`/`py-14`), background overlay opacity/gradient direction, and/or a top/bottom accent border color drawn from `--primary` per variant. `listing` keeps its breadcrumb nav as its already-implemented distinguishing feature; could also drop the image-overlay pattern in favor of a flat `--secondary` background (Blog's seeded Hero has no `media` set today).

</specifics>

<deferred>
## Deferred Ideas

- Rewiring `blog/[slug]`/`case-studies/[slug]` to consume the real `Hero` block (would need `HeroBlock` schema extension for `heroMetric`/category fields) — deferred, not in Phase 28 scope per Juan's decision.

</deferred>
