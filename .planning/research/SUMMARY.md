# Project Research Summary

**Project:** Juan Carlos Angulo — Portfolio (Payload rebuild) — Milestone v1.1: UI/UX Polish Pass
**Domain:** Visual/UX refinement of an already-shipped, content-populated, bilingual (EN/ES) Payload CMS 3.85 + Next.js 15 + Tailwind v3 + shadcn/ui portfolio site
**Researched:** 2026-07-10
**Confidence:** HIGH

## Executive Summary

This milestone is not a rebuild or a redesign — it is a scoped restyling pass on a working, QA-passed site. Phase 5 already delivered 16 Payload-editable blocks, a locked design contract (`05-UI-SPEC.md`: Inter/Fraunces, navy/off-white/ember palette, 4-size type scale, 4px spacing rhythm), and a shadcn "new-york" component library on Tailwind v3.4.19. The research across all four files converges on the same shape of work: fix execution gaps in the already-decided system (inconsistent spacing, weak typographic hierarchy, an unbranded dark-mode token set, understated trust/KPI signals) rather than reopening any decided token (color, font pairing, spacing scale). Two genuinely new architectural surfaces are needed — elevation (box-shadow) and motion (duration/easing) tokens — because neither exists in the codebase today; everything else is refinement, not addition.

The recommended approach layers cleanly: extend the existing CSS-var-backed Tailwind theme (`globals.css` → `tailwind.config.ts theme.extend` → utility classes) with shadow and motion primitives, then work block-by-block starting with shadcn primitives (highest leverage, cascades to every block) through to low-traffic utility blocks last. For interactivity, add two small, well-chosen dependencies — `motion` (ex-Framer Motion, for orchestrated scroll-reveals/gestures) and `embla-carousel-react` (via shadcn's own `Carousel` wrapper, for the two currently-unstyled carousel blocks) — while defaulting to plain CSS transitions for anything CSS can already express. Both integrate without breaking the RSC data-fetching boundary: Payload blocks stay async Server Components calling `getPayload()`, and only thin client-component wrappers (`Reveal`, `Carousel`) take `'use client'`.

The dominant risk is not technical unfamiliarity — it's regression of things that already pass: WCAG contrast, Core Web Vitals (the site's entire value proposition is "impeccable performance and SEO"), Spanish-locale layout robustness (ES runs 15-25% longer than EN), the Payload-editability hard rule, and SEO-relevant markup semantics. Every pitfall identified is a "looks fine, silently breaks something already validated" pattern, not a "how do I build this" unknown. Mitigation is procedural: verify every touched block against boundary-condition Payload content (not just today's real content), re-run contrast/Lighthouse checks per-change rather than once at the end, test every layout change in `/es` with real long-form content, and grep diffs for hardcoded strings or changed HTML tags before merging.

## Key Findings

### Recommended Stack

The core Payload/Next/Postgres/Cloudinary/Resend stack from the original build is untouched by this milestone. The v1.1 addendum is additive only, layered on top of what's already installed and confirmed by direct repo scan (Tailwind 3.4.19, shadcn "new-york," `tailwindcss-animate@1.0.7`, `cva`/`clsx`/`tailwind-merge`, per-component Radix installs, Inter+Fraunces via `next/font/google`, 16 async-Server-Component blocks).

**Core additions:**
- `motion` (`^12.42.2`, ex-Framer Motion, import from `motion/react`) — declarative scroll-reveal/gesture animation with native React 19 and RSC-boundary support; wrap only thin client leaves, never entire blocks.
- `embla-carousel-react` (`^8.6.0`, via `npx shadcn add carousel`) — powers `TestimonialsCarousel` and `ClientLogosBlock`, which currently render as plain unstyled `overflow-x-auto` divs.

**Supporting additions (conditional on audit findings):** `@radix-ui/react-tooltip`, `@radix-ui/react-accordion` (only if FAQ isn't already using Radix), `@radix-ui/react-scroll-area` (only if native scrollbars look inconsistent), `sonner` (contact-form toast feedback, the shadcn-recommended replacement for the deprecated `Toast`/`useToast`).

**Explicitly avoid:** replacing shadcn/Tailwind wholesale, CSS-in-JS, `tw-animate-css` (Tailwind v4-only, would break on this v3 project), GSAP, pre-built "animated component kit" registries (Aceternity/Magic UI/etc. — these bypass the Payload-editability rule by hardcoding content), and any Tailwind v4 migration (a separate, later, build-tooling decision, not part of a polish pass).

### Expected Features

**Must have (v1.1 launch bar), ordered by leverage/cost:**
- Spacing/rhythm audit and fix across all 16 blocks — cheapest, highest-leverage, do first since everything else sits on top of layout
- Typographic hierarchy utilities (size+weight-driven, Inter/Fraunces roles clarified), applied site-wide
- Brand-correct dark-mode token set in `globals.css` — the single biggest table-stakes gap identified directly in the codebase (`.dark` block still carries generic shadcn gray tokens, never received the ember/navy palette)
- KPI/metric hero restyle in `ResultsSection` (largest-element treatment, reinforcing the case-study trust-signal pattern already decided in PROJECT.md)
- Author credibility restyle (`AuthorByline`/`AuthorCard`) — direct E-E-A-T payoff, low cost
- Micro-interactions (hover/focus/press) on button/card/input/nav — CSS-only, no new dependency
- Mobile responsive pass at 375px for every restyled block

**Should have (if time allows within milestone):** scroll-reveal on case-study sections, KPI count-up animation, a signature accent motif reused across Hero/CTA/ResultsSection, client-logo carousel restyled as a trust strip (grayscale-to-color hover).

**Explicitly defer/avoid:** full parallax/3D/WebGL hero treatments, autoplaying video backgrounds, gamified interactions, site-wide GSAP/heavy motion orchestration — all wrong-register for a technical/SEO-consultant audience and in direct tension with the site's Core Web Vitals mandate.

### Architecture Approach

No data-model or schema changes in this milestone. The token architecture extends the existing two-tier pattern (CSS custom properties in `globals.css` → `theme.extend` mapping in `tailwind.config.ts` → Tailwind utility classes in `className`) with two genuinely new categories — elevation (`--shadow-sm/md/lg/focus`) and motion (`--motion-fast/base/slow`, `--ease-out/standard`) — plus a global `prefers-reduced-motion` safety rule that doesn't exist today. Color/typography/spacing values stay as locked by `05-UI-SPEC.md`; this is refinement of application, not new token categories in those three areas.

**Major components (all pre-existing, restyled not rebuilt):**
1. `src/app/globals.css` + `tailwind.config.ts` — single source of truth for the token layer; extended, never replaced
2. `src/components/ui/*.tsx` (shadcn primitives) — lowest-level consumers, restyled first since fixes cascade to every block
3. `src/blocks/*/Component.tsx` (16 files) — visual-only edits; `config.ts` (Payload field schema) in each block folder stays untouched, enforcing the editability hard rule
4. `SiteHeader.tsx`/`SiteFooter.tsx` — global chrome, high visual impact, restyled early
5. `RenderBlocks.tsx` registry and all Payload globals/collections — explicitly out of scope, zero diffs expected

### Critical Pitfalls

1. **Token/block refactor silently breaks layout for boundary-condition content** — restyling against today's real content only (not the full schema range: empty optional fields, min/max repeater counts, longest ES titles) ships blocks that look great but break the first time an editor enters an edge case. Avoid by rendering every touched block against boundary-condition Payload data, not just production content.
2. **Color-token changes reintroduce WCAG contrast failures** the site already passed QA on — especially secondary/muted text, borders, and composited backgrounds (hero overlays). Avoid by re-running contrast checks per token change, in both locales, not batched at milestone end.
3. **Spanish content breaks layouts tightened/tested against English copy** — ES runs 15-25% longer; tighter "editorial" spacing and single-line truncation are the most likely casualties. Avoid by designing for the longer-language case and verifying every typography/spacing change in `/es` with real longest-title content, not placeholder text.
4. **Animation additions regress Core Web Vitals** on a site whose entire value proposition is technical performance — INP from main-thread JS, CLS from layout-affecting animation, LCP delay if hero elements are animated. Avoid by defaulting to CSS transitions, animating only `transform`/`opacity`, never animating the LCP candidate, and running mobile Lighthouse after each animated component, not once at the end.
5. **"Just visual" edits quietly reintroduce hardcoded content**, violating the Phase 5 hard rule that everything stays Payload-editable — a dev's placeholder string during layout iteration ships unreverted, or a new visual element (badge, stat, icon) gets added without a backing Payload field. Avoid with an explicit grep-for-literal-strings check on every touched-block PR.

(A sixth pitfall — SEO/structured-data markup silently degrading via heading-tag downgrades, lost `alt` propagation, or `<a>`→`<div onClick>` swaps during restyling — is also flagged as needing a markup/semantic diff check, not just a visual look, on any phase touching headers, blog body, or card/link components.)

## Implications for Roadmap

Based on combined research, suggested phase structure for v1.1:

### Phase 1: Design-Token Foundation (elevation + motion + audit)
**Rationale:** Every subsequent visual change composes on top of the token layer; both FEATURES.md and ARCHITECTURE.md independently identify this as the correct starting point (cheapest, unblocks everything else). Also the only phase that introduces genuinely new architecture (shadow/motion tokens don't exist yet).
**Delivers:** Extended `globals.css`/`tailwind.config.ts` with `--shadow-*`/`--motion-*`/`--ease-*` tokens mapped to `boxShadow`/`transitionDuration`/`transitionTimingFunction` Tailwind utilities; a global `prefers-reduced-motion` rule; a sanity-check of existing color/typography/spacing mappings against `05-UI-SPEC.md` (fix drift only, no redesign); the ember/navy `.dark` token set built out (currently generic shadcn gray).
**Addresses:** Table-stakes dark-mode gap, spacing/rhythm audit precondition (FEATURES.md).
**Avoids:** Pitfall 2 (WCAG contrast) — bake a contrast re-check into this phase's own verification since it's the phase most likely to touch color tokens.

### Phase 2: shadcn Primitives + Global Chrome Restyle
**Rationale:** ARCHITECTURE.md's suggested build order — primitives cascade to every block, so fixing shadow/motion/spacing here first has the widest leverage before touching individual blocks. `SiteHeader`/`SiteFooter` are high-visibility, low-risk (no dynamic per-page content), good second target.
**Delivers:** Refined `cva()` variants in `button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `sheet.tsx`, `navigation-menu.tsx`, `separator.tsx`, `skeleton.tsx`, `textarea.tsx`, `avatar.tsx`; restyled header/footer.
**Uses:** New shadow/motion tokens from Phase 1; existing Tailwind spacing/typography utilities.
**Implements:** "Component.tsx as sole styling touchpoint, config.ts untouched" architectural pattern.

### Phase 3: High-Visibility Content Blocks (Hero, Section, Content, ResultsSection)
**Rationale:** Hero is every page's first impression (highest visibility); Section/Content are generic layout primitives many pages compose with (broad reach); ResultsSection is the project's core differentiator per PROJECT.md's case-study model.
**Delivers:** KPI/metric hero restyle (largest-element treatment), section rhythm fixes, editorial typography for long-form content leveraging Fraunces.
**Addresses:** Table-stakes KPI hero, typographic hierarchy; differentiator KPI count-up animation (P2, if budget allows).
**Avoids:** Pitfall 6 (SEO/markup regression) — this phase touches the pages most likely to have heading-hierarchy or hero-overlay-contrast issues; needs explicit markup diff + contrast check on composited backgrounds.

### Phase 4: Card-Grid/Listing Blocks (ArchiveBlock, FeaturedPostsBlock, FeaturedCaseStudiesBlock, RelatedPosts) + Author Credibility
**Rationale:** These share the same card-grid pattern and should be restyled as a batch for visual consistency; `AuthorByline`/`AuthorCard` restyle is low-cost, high E-E-A-T payoff and thematically adjacent (both are "trust/credibility surface" work).
**Delivers:** Consistent card elevation/spacing treatment across all listing blocks; visibly prominent author credentials/years/social links.
**Avoids:** Pitfall 3 (Spanish layout breakage) — card grids with title truncation are exactly where ES text-length overflow shows up; mandatory `/es` pass with longest real migrated titles before sign-off. Pitfall 1 (boundary-condition content) — repeater-count edge cases (1 vs 6 items) most relevant here.

### Phase 5: Interactive/Motion Additions (Carousels, Scroll-Reveal, Micro-interactions)
**Rationale:** Sequenced last because it's the only phase introducing new dependencies (`motion`, `embla-carousel-react`) and carries the CWV regression risk (Pitfall 4) — safest to add once the static visual foundation is already solid, so any Lighthouse regression is attributable to a small, isolated diff.
**Delivers:** `TestimonialsCarousel`/`ClientLogosBlock` restyled with shadcn's `Carousel` (Embla-backed); scroll-triggered reveals via a thin `Reveal` client wrapper (`motion`, `whileInView`); hover/focus/press micro-interactions on remaining interactive elements; contact-form `sonner` toast feedback.
**Uses:** `motion`, `embla-carousel-react`, shadcn `add tooltip/sonner/carousel` CLI additions.
**Avoids:** Pitfall 4 (CWV regression) — mandatory mobile Lighthouse run after each animated component ships, never batched; never animate the LCP hero element; `prefers-reduced-motion` fallback from the first animation added.

### Phase 6: Cross-Cutting Verification Pass
**Rationale:** PITFALLS.md and ARCHITECTURE.md both call for a final sweep distinct from per-phase verification, since some regressions (hardcoded strings, arbitrary-value Tailwind, config.ts drift) are only reliably caught by grepping the full diff at the end.
**Delivers:** Grep for `shadow-[`, `duration-[`, inline `style={{`; confirm zero diffs in `src/blocks/*/config.ts` and `payload-types.ts`; full bilingual (`/en`, `/es`) visual QA across all touched pages; a final mobile Lighthouse pass site-wide.
**Addresses:** Pitfall 5 (hardcoded content) as a cross-cutting final check, on top of the per-PR checks already required in every earlier phase.

### Phase Ordering Rationale

- Token foundation must precede component work — every later phase consumes the shadow/motion utilities Phase 1 creates (dependency, not preference).
- Primitives-then-blocks ordering (Phase 2 before 3/4) matches ARCHITECTURE.md's explicit "Suggested Build Order," maximizing leverage: fixing `button.tsx`/`card.tsx` once benefits all 16 blocks that compose from them.
- Motion/animation work is sequenced last (Phase 5) specifically to isolate CWV risk — the pitfall research is unanimous that incremental Lighthouse checks per component are the only reliable way to attribute a regression, which is easiest when the animation work is a clean final layer on an already-stable visual base.
- A dedicated cross-cutting verification phase exists because several pitfalls (hardcoded strings, semantic markup, ES layout) are diff-level concerns that both per-phase spot checks and a final full-diff review are needed to catch reliably.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Interactive/Motion Additions):** `motion`'s RSC-boundary integration pattern (Reveal wrapper) and Embla/shadcn Carousel wiring are new to this codebase — worth a focused implementation-pattern check even though the library choice itself is HIGH confidence.
- **Phase 1 (Dark-mode token set):** Designing a genuinely brand-correct `.dark` palette (desaturated ember, correct surface-elevation grays) is a design decision requiring its own scoped exploration, not just a mechanical token-mapping task.

Phases with standard patterns (skip research-phase):
- **Phase 2 (shadcn primitives):** Well-documented `cva()` variant pattern already established in this exact codebase; extending it is mechanical.
- **Phase 3/4 (block restyling):** Component.tsx-only edits following an already-verified architectural boundary (config.ts untouched); no new patterns to research.
- **Phase 6 (verification):** Procedural checklist execution, not a research question.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against live npm registry (2026-07-10) and direct repo scan of `package.json`/`components.json`/`tailwind.config.ts`; every "already installed" claim is a file read, not inference |
| Features | MEDIUM | WebSearch-verified across 6+ queries with 2+ sources per claim, but design-trend research inherently softer than API/library facts; codebase-baseline facts (existing blocks, missing dark-mode tokens) are HIGH within the overall MEDIUM |
| Architecture | HIGH | Grounded directly in this repo's Phase-5-complete files (`globals.css`, `tailwind.config.ts`, all 16 block components), not generic best practice; cross-checked against a real sibling project (`auditor`) for pattern comparison |
| Pitfalls | MEDIUM-HIGH | Synthesized from established WCAG/CWV/i18n sources (several HIGH-confidence official docs: web.dev, MDN, W3C, shadcn docs) plus MEDIUM-confidence community/blog sources on refactor post-mortems and animation performance; project-specific risk framing (PROJECT.md constraints) is HIGH |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact dark-mode token values** (specific OKLCH/HSL numbers for the ember/navy `.dark` palette) are not yet designed — Phase 1 needs a concrete design pass, not just the architectural slot for it. Flag for validation once drafted, before it cascades to every restyled block.
- **Whether `FAQ` block already uses Radix accordion primitives** is unverified (FEATURES.md/STACK.md both flag this as "check during audit" rather than confirmed fact) — resolve early in Phase 1/2 since it determines whether `@radix-ui/react-accordion` is actually needed.
- **Hostinger/production Lighthouse baseline** isn't captured in this research — the CWV regression-prevention strategy (Pitfall 4) assumes a known-good baseline to diff against; capture one before Phase 5 starts animating anything.
- **Longest real Spanish content strings** (titles, nav labels) for use as the boundary-condition test set in Phases 3/4 aren't enumerated here — pull the actual longest ES titles from the 72 migrated posts/case studies before those phases' verification steps, per PITFALLS.md's explicit recommendation.

## Sources

### Primary (HIGH confidence)
- Direct repository inspection: `package.json`, `components.json`, `tailwind.config.ts`, `src/app/globals.css`, `src/blocks/*/Component.tsx` (16 files), `src/blocks/RenderBlocks.tsx`, `src/components/ui/*.tsx`, `src/components/SiteHeader.tsx`/`SiteFooter.tsx`, `src/globals/Header`/`Footer` — read directly, not inferred
- npm registry (live, queried 2026-07-10): `motion@12.42.2`, `embla-carousel-react@8.6.0`, `tailwindcss-animate@1.0.7`, `@radix-ui/react-*` current versions, `sonner@2.0.7`
- `.planning/phases/05-frontend-pages/05-UI-SPEC.md` — locked design contract this milestone refines
- `.planning/PROJECT.md` — milestone scope, Core Value (performance/SEO), editability hard rule, bilingual scope
- web.dev: prefers-reduced-motion, MDN: prefers-reduced-motion, W3C WCAG 2.3.3, shadcn/ui Theming docs

### Secondary (MEDIUM confidence)
- motion.dev docs — package rename/import path, React 19 support
- Portfolio/design-trend research (Colorlib, Envato, Sitebuilder Report, Figma resource library) — feature landscape and competitor analysis
- E-E-A-T/author-bio SEO sources (Sangfroid, Fractl, HYF Web) — author credibility feature rationale
- CWV/animation-performance sources (Framer Community, reactlibraries.com comparison)
- Text-expansion/i18n sources (SimpleLocalize, Argo Translation, i18nagent.ai)
- /Users/juan/Documents/Codigo/Personal/juantech/auditor/apps/web/app/tokens.css — sibling-project comparison for token architecture pattern

### Tertiary (LOW confidence)
- None flagged at LOW for this milestone's research — all findings cross-referenced at MEDIUM or better.

---
*Research completed: 2026-07-10*
*Ready for roadmap: yes*
