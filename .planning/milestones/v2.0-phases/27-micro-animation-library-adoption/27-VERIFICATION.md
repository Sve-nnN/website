---
phase: 27-micro-animation-library-adoption
verified: 2026-07-13T00:00:00Z
status: passed
score: 3/3 truths verified (all core); documentation-accuracy gap in bundle-size narrative closed 2026-07-13 (SUMMARY.md corrected to static-import/RenderBlocks-level cost, not per-instance)
overrides_applied: 0
gaps:
  - truth: "El costo real de bundle (diff de next build antes/después) queda medido y documentado — no solo estimado por el research"
    status: partial
    reason: >
      The raw KB numbers in the SUMMARY table (158kB before → 173kB after, +15KB on /[locale]) are
      independently reproduced and accurate. However the SUMMARY's causal narrative is factually wrong
      and was verified false against a real re-built baseline: it claims "Routes without these blocks
      (e.g. /services, /contact) show zero bundle growth" and that LazyMotion "code-splits the
      domAnimation feature set into a per-route chunk that only loads on routes actually rendering an
      m.* component." A from-scratch `next build` at the pre-motion commit (909e419) versus the current
      HEAD shows /services and /contact BOTH grew from 158kB→173kB (own size 2.07kB→2.32kB) — the exact
      same +15KB delta as the homepage — even though neither page's actual CMS content renders a
      FAQ or Testimonials block instance. The real mechanism is static-import code-splitting at the
      `RenderBlocks` module-graph level (every Pages-template route statically imports every block
      component, including FAQComponent → ScrollReveal and TestimonialsCarouselComponent →
      TestimonialCardMotion, so all of them pay the LazyMotion/domAnimation chunk cost), not
      per-instance runtime code-splitting based on whether an m.* component actually renders on that
      page. Only routes with genuinely separate templates that bypass RenderBlocks (/authors, /blog/[slug],
      /case-studies, /search) stayed at their pre-motion size.
    artifacts:
      - path: ".planning/phases/27-micro-animation-library-adoption/27-01-SUMMARY.md"
        issue: "Bundle-Size Measurement section and 'Next Phase Readiness' both assert a per-route/per-instance code-splitting mechanism and specifically name /services and /contact as unaffected routes; both claims are contradicted by a real rebuilt baseline."
    missing:
      - "Correct the SUMMARY (or a follow-up note) to state that the +15KB is paid by every route rendered through the Pages/RenderBlocks template (i.e. sitewide for that template family), not selectively by routes whose content happens to include a FAQ/Testimonials block instance."
      - "Phase 28 planning should account for this being a static-import-driven, not instance-driven, cost, since more m.* pilot components added to RenderBlocks-reachable blocks will compound this the same way regardless of per-page content."
---

# Phase 27: Micro-animation Library Adoption Verification Report

**Phase Goal:** La librería de micro-animaciones queda decidida, instalada y validada contra un build de producción real antes de aplicarse a ningún componente — decisión técnica real (motion vs GSAP vs Anime.js), no asumida.
**Verified:** 2026-07-13
**Status:** gaps_found (documentation-accuracy gap only — no code/wiring defect)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `motion` package installed and consumed via `LazyMotion`+`m`+`domAnimation`, never a naive full-bundle `motion` component import | ✓ VERIFIED | `package.json` has `"motion": "^12.42.2"`; `node_modules/motion/package.json` version `12.42.2` matches exactly (genuinely installed, not just declared). `grep -rn "from 'motion/react'"` across `src/` returns only `MotionProvider.tsx`'s `LazyMotion, domAnimation, MotionConfig` import — zero `import { motion } from 'motion/react'` (the naive full-component import) anywhere in `src/`. Both pilot leaves import `* as m from 'motion/react-m'` (the LazyMotion-compatible entrypoint). |
| 2 | A single `MotionProvider` wraps the app root exactly once in `[locale]/layout.tsx`, so the runtime cost is paid once, not per component | ✓ VERIFIED | `src/app/(frontend)/[locale]/layout.tsx` renders `<MotionProvider>` wrapping `SiteHeader`/`{children}`/`SiteFooter`, nested inside `NextIntlClientProvider`. `grep -rln "MotionProvider" src/` returns only the layout and the provider's own definition file — no duplicate/nested providers elsewhere. |
| 3 | `useReducedMotion()` is a custom SSR-safe hook matching `HeroGrainGradient.tsx`'s exact pattern | ✓ VERIFIED | Read both files side by side. `src/hooks/useReducedMotion.ts`: `'use client'`, `useState(false)` initial (matches SSR, no `window`), real `matchMedia('(prefers-reduced-motion: reduce)')` read + `change` listener inside `useEffect`, `removeEventListener` cleanup on unmount — line-for-line the same shape as `HeroGrainGradient.tsx`'s own `reducedMotion` `useState`+`useEffect` block. |
| 4 | FAQ items reveal (fade+rise) on first scroll into view via `whileInView` (IntersectionObserver-backed), not a hand-rolled scroll listener | ✓ VERIFIED | `src/components/ScrollReveal.tsx` renders `<m.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true, amount:0.3}}>`. `src/blocks/FAQ/Component.tsx` wraps each `<details>` item in `<ScrollReveal key={i}>`. No manual scroll event listeners found in either file. Live curl of `/en/seo-tecnico-lima` confirms 4 rendered `<details>` elements inside `ScrollReveal` wrappers. |
| 5 | Testimonial cards show a hover micro-interaction (lift) via `whileHover` | ✓ VERIFIED | `src/components/TestimonialCardMotion.tsx` renders `<m.div whileHover={reducedMotion ? {} : {y:-4}}>`. `src/blocks/TestimonialsCarousel/Component.tsx` wraps each `Card` in `<TestimonialCardMotion key={testimonial.id}>`. |
| 6 | Real First Load JS bundle delta from adding `motion` is measured via raw `next build` (not `npm run build`) and written into SUMMARY.md with actual KB numbers | ⚠ PARTIAL | Independently re-ran `npx next build` at HEAD: `/[locale]` shows 2.32 kB own / 173 kB First Load JS / 101 kB shared-by-all — matches the SUMMARY's claimed numbers exactly. Independently rebuilt a clean baseline at the pre-motion commit (`909e419`, via `git worktree`) and reran `next build` there: `/[locale]` was 2.07 kB / 158 kB / 101 kB. Real delta = +15KB, confirming the SUMMARY's headline number. **However**, the SUMMARY's explanation of *which routes pay the cost* is factually wrong (see Gaps below) — it claims per-instance code-splitting ("routes without these blocks show zero bundle growth", naming `/services`/`/contact` specifically) but the re-built baseline shows those exact routes also grew by the same +15KB, because the cost is paid by every route rendered through the Pages/`RenderBlocks` template (static-import driven), not by whether that page's actual content includes a FAQ/Testimonials block instance. |

**Score:** 5/6 truths fully verified, 1 truth (bundle measurement) verified on the numeric claim but with a documentation-accuracy gap on the causal narrative.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/useReducedMotion.ts` | SSR-safe reduced-motion hook | ✓ VERIFIED | Exists, exports `useReducedMotion`, matches HeroGrainGradient pattern exactly |
| `src/components/MotionProvider.tsx` | Root LazyMotion + MotionConfig wrapper | ✓ VERIFIED | Exists, `'use client'`, exports `MotionProvider`, uses `LazyMotion`+`domAnimation`+`MotionConfig reducedMotion="user"` |
| `src/components/ScrollReveal.tsx` | Generic scroll-reveal leaf | ✓ VERIFIED | Exists, uses `motion/react-m`, `whileInView`, calls `useReducedMotion()` |
| `src/components/TestimonialCardMotion.tsx` | Generic hover-lift leaf | ✓ VERIFIED | Exists, uses `motion/react-m`, `whileHover`, calls `useReducedMotion()` |
| `package.json` | `motion` dependency pinned to `^12.42.2` | ✓ VERIFIED | `"motion": "^12.42.2"` present; `node_modules/motion` installed version is exactly `12.42.2` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `[locale]/layout.tsx` | `MotionProvider.tsx` | wraps `{children}` once at root | ✓ WIRED | Confirmed by direct read of layout.tsx — single wrap, no duplicates elsewhere in `src/` |
| `FAQ/Component.tsx` | `ScrollReveal.tsx` | each FAQ item wrapped | ✓ WIRED | Confirmed by direct read + live curl showing 4 rendered `<details>` inside ScrollReveal on `/en/seo-tecnico-lima` |
| `TestimonialsCarousel/Component.tsx` | `TestimonialCardMotion.tsx` | each Card wrapped | ✓ WIRED | Confirmed by direct read |
| `ScrollReveal.tsx` | `useReducedMotion.ts` | reads reducedMotion for transition | ✓ WIRED | Confirmed |
| `TestimonialCardMotion.tsx` | `useReducedMotion.ts` | reads reducedMotion for whileHover | ✓ WIRED | Confirmed |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npx tsc --noEmit -p tsconfig.json` passes | `npx tsc --noEmit -p tsconfig.json` | zero output, exit 0 | ✓ PASS |
| `npx next build` succeeds and reproduces claimed numbers | `npx next build` at HEAD | `/[locale]` 2.32kB/173kB/101kB shared — matches SUMMARY exactly | ✓ PASS |
| Baseline rebuild at pre-motion commit reproduces "before" numbers | `git worktree` at `909e419` + `next build` | `/[locale]` 2.07kB/158kB/101kB shared — matches SUMMARY's "before" row | ✓ PASS |
| No `import { motion } from 'motion/react'` (naive full import) anywhere | `grep -rn "from 'motion/react'" src/` | only `MotionProvider.tsx`'s named `LazyMotion/domAnimation/MotionConfig` import | ✓ PASS |
| Dev server renders FAQ + Testimonials pilot pages on both locales with zero hydration-mismatch warnings | `npx next dev`, curl `/en`, `/es`, `/en/seo-tecnico-lima` | server log shows zero `hydrat`/`mismatch`/error matches; `/es` returns expected 307→`/` (next-intl "as-needed" default-locale redirect, not a bug); FAQ `<details>` markup (4 items) confirmed rendered | ✓ PASS |
| Route-level bundle-growth claim ("routes without these blocks show zero growth") | Baseline diff of `/services`, `/contact` before vs after | Both grew 158kB→173kB, same delta as home — contradicts SUMMARY's specific claim | ✗ FAIL (documentation gap, not code defect) |

### Anti-Patterns Found

None. Scanned all 7 touched/created files (`useReducedMotion.ts`, `MotionProvider.tsx`, `ScrollReveal.tsx`, `TestimonialCardMotion.tsx`, `FAQ/Component.tsx`, `TestimonialsCarousel/Component.tsx`, `[locale]/layout.tsx`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/empty-implementation patterns — zero matches.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| MOTION-01 | 27-01-PLAN.md | `motion` adopted as sole animation dependency via LazyMotion+m+domAnimation, real bundle cost verified against production build | ⚠ PARTIAL | Installation/pattern/wiring fully verified. Bundle cost *is* measured for real (numbers reproduce independently) but the SUMMARY's documentation of *which routes* pay that cost is factually incorrect per re-built baseline evidence — see gap above. |
| MOTION-02 | 27-01-PLAN.md | Shared `useReducedMotion()` hook, SSR-safe, no hydration mismatch, consistent `prefers-reduced-motion` respect | ✓ SATISFIED | Hook matches HeroGrainGradient pattern exactly; live dev-server check shows zero hydration-mismatch warnings on both pilot components across both locales. |

### Human Verification Required

None. All checks in this phase were verifiable programmatically (grep, tsc, real build re-execution, live dev-server log inspection). No visual/UX judgment call was needed since Phase 27 explicitly does not ship visible rollout beyond the 2 pilots already spot-checked here.

### Gaps Summary

The phase's core infrastructure goal is genuinely achieved: `motion` is a real dependency (verified against `node_modules`, not just `package.json`), the `LazyMotion`+`m`+`domAnimation` pattern is used correctly with zero naive full-bundle imports anywhere in `src/`, the root `MotionProvider` wraps the app exactly once, `useReducedMotion()` is a faithful line-for-line replication of the proven `HeroGrainGradient` SSR-safe pattern, and both pilot components (FAQ scroll-reveal, Testimonials hover-lift) are wired and render correctly with zero hydration-mismatch warnings on both locales.

The one gap is in the accuracy of the bundle-size *narrative* written into 27-01-SUMMARY.md, which will matter for Phase 28 planning. The raw KB numbers Juan will see in the SUMMARY table are correct and reproducible (independently confirmed: +15KB First Load JS, 158kB→173kB on `/[locale]`, shared-by-all baseline unchanged at 101kB). But the SUMMARY draws an incorrect conclusion from those numbers — it explicitly claims the cost is scoped to "routes that actually render an m.* component" and names `/services`/`/contact` as examples of routes that see "zero bundle growth." A from-scratch rebuild at the pre-motion commit shows this is false: `/services` and `/contact` (neither of which has FAQ/Testimonials content) grew by the identical +15KB, because the cost is paid by every route that goes through the `Pages`/`RenderBlocks` template family (a static-import graph cost), not selectively by page content. Only routes on genuinely separate templates that don't import `RenderBlocks` (`/authors`, `/blog/[slug]`, `/case-studies`, `/search`) were unaffected.

This is a documentation-accuracy issue, not a functional defect — nothing is broken, mis-wired, or stubbed. It does not block Phase 28 from starting, but the SUMMARY's per-route framing should be corrected before Phase 28 relies on it to reason about further bundle growth, since more `m.*` components added to `RenderBlocks`-reachable blocks will compound sitewide (across the whole Pages-template family) rather than selectively per page content, as currently documented.

**This looks like an unintentional research/measurement error rather than a deliberate deviation**, so no override is suggested — recommend a quick correction note in the SUMMARY (or accept as a known, tracked gap) before Phase 28 planning references this bundle-size finding.

---

_Verified: 2026-07-13_
_Verifier: Claude (gsd-verifier)_
