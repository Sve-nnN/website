# Technology Stack — Micro-Animation Library (v1.6 UI/UX Pro Max II)

**Project:** Juan Carlos Angulo Portfolio (Payload rebuild)
**Milestone:** v1.6 — Componentes, Motion y Voz
**Researched:** 2026-07-13

## Recommendation

**Use `motion` (npm package `motion`, current `12.42.2`) via the `LazyMotion` + `m` + `domAnimation` pattern**, imported from `motion/react` (leaf components use `motion/react-m`). Do not use the full `motion` component import, and do not reach for GSAP or Anime.js for this milestone's scope.

Real bundle cost for what this milestone actually needs (`whileInView` scroll-reveal, `whileHover`/`whileTap` micro-interactions, simple enter/exit variants — no drag, no layout animation, no SVG morphing):

| Import pattern | Gzipped cost |
|---|---|
| `LazyMotion` core + `m` component (base) | ~4.6 KB |
| `+ domAnimation` features (variants, exit animations, hover/tap/focus gestures, `whileInView`) | +~15 KB |
| **Total, one-time, shared across every animated component** | **~19-20 KB gzipped** |
| `useReducedMotion` hook alone (if used standalone) | ~1 KB |

This is a fixed cost paid once (the `LazyMotion`/`MotionConfig` provider lives in one root client wrapper), not per-component — every block in scope (navbar, CTA strip, hero variants, FAQ, client logos, testimonials, blog grids, case studies) reuses the same ~20 KB, they don't each add their own animation runtime.

## Why Motion Beats GSAP and Anime.js For This Specific Site

The site's whole value proposition is "performance and SEO are the demo" (PROJECT.md Core Value) — v1.3 already rejected three.js/ShaderGradient at ~150 KB+ for exactly this reason and shipped `@paper-design/shaders-react`'s `GrainGradient` at ~5 KB instead. The same discipline applies here: pick the lightest tool that still produces a "feels alive" result across ~8 unrelated components, not the most powerful one.

**1. Bundle size, real-world (not marketing) numbers**

| Library | Core alone | Realistic total for this milestone's needs | Notes |
|---|---|---|---|
| **Motion** (`motion/react`, `LazyMotion`+`m`+`domAnimation`) | 4.6 KB | **~19-20 KB gzipped** | One shared provider, tree-shaken feature set |
| GSAP core + ScrollTrigger | ~23 KB | **~30 KB gzipped** (core 23 KB + ScrollTrigger ~7 KB) | GSAP's older architecture means importing any part historically pulls more than tree-shaking alone suggests; ScrollTrigger is mandatory for scroll-reveal since GSAP core has no scroll-reveal primitive |
| Anime.js v4 | 3 KB (WAAPI-only) / 10 KB (full) | ~10-13 KB (core + `onScroll` utility) | Smallest raw *engine*, but its scroll utilities (`onScroll`, `ScrollObserver`) are the newest/least battle-tested part of the v4 rewrite, and it has no built-in gesture (hover/tap) primitives — those would be hand-rolled |

Anime.js technically wins on raw core-engine size, but has no hover/tap gesture handling or React bindings, so the realistic delta between Motion and Anime.js for this milestone's actual feature set (scroll-reveal + hover states) is small (~6-9 KB), while Motion is meaningfully lighter than GSAP+ScrollTrigger (~10 KB less) and far more idiomatic to wire across many components (see below). Confidence: MEDIUM — bundle numbers assembled from Motion's own docs (motion.dev) plus cross-checked third-party 2026 comparison articles (pkgpulse.com, devpick.co, lab.good-fella.com); Anime.js number from its own docs; not independently re-measured against this project's actual production bundler output.

**2. React/Next.js 15 App Router idiom fit**

- **Motion**: fully declarative. `<m.div whileInView={{opacity: 1, y: 0}} initial={{opacity: 0, y: 12}} viewport={{once: true, amount: 0.3}}>` reads like a prop, matching how every other shadcn/Radix component in this codebase already works. No refs, no manual cleanup, no imperative lifecycle code. The one App Router rule: `motion`/`m` components use hooks internally, so any file rendering them needs `'use client'` — the exact pattern this codebase already follows for `HeroGrainGradient.tsx`. You wrap the small leaf component (e.g. `<ScrollReveal>`), not whole pages, keeping the Server Component tree mostly intact.
- **GSAP**: imperative by nature — animations are created via `gsap.to()`/`gsap.timeline()` inside `useGSAP()` (the official `@gsap/react` hook), which requires `'use client'`, a `containerRef`, and understanding `gsap.context()` scoping so animations revert on unmount. It's a well-solved pattern (GSAP's own React guide documents it and `useGSAP` automates cleanup), but it's more boilerplate to repeat consistently across 8 unrelated components (navbar, CTA strip, hero, FAQ, client logos, testimonials, blog grids, case studies) than dropping declarative props onto existing JSX.
- **Anime.js v4**: no official React bindings — same imperative `useEffect`/ref pattern as GSAP, but without a maintained helper hook equivalent to `useGSAP`, so cleanup is fully hand-rolled per component.

**3. Scroll-reveal (IntersectionObserver-based)**

- **Motion**: `whileInView` (declarative prop) and `useInView` (hook) both use `IntersectionObserver` internally — confirmed directly in Motion's own docs. `viewport={{once: true, amount: 0.3}}` is the entire API surface needed for "reveal once when 30% visible," covering every scroll-reveal need in this milestone's scope.
- **GSAP**: `ScrollTrigger` does **not** use `IntersectionObserver` — it computes scroll position itself against the DOM/viewport. It's powerful (scrubbing, pinning, complex triggers) but that power goes unused for simple reveal-on-scroll, and it's a separate plugin import (+~7 KB) purely to get what Motion includes as one prop.
- **Anime.js v4**: added `onScroll`/`ScrollObserver` in the v4 rewrite (confirmed via animejs.com docs) — genuinely new (2025-2026), with smaller docs/community track record than Motion's `whileInView` or GSAP's ScrollTrigger for production use.

**4. `prefers-reduced-motion`**

None of the three libraries disables animations automatically by default — all three require the app to read the media query and pass it into the animation config. The difference is how much wiring that takes:

- **Motion**: ships `useReducedMotion()` — a one-line hook returning a boolean — and `<MotionConfig reducedMotion="user">`, which, set once at the app root, automatically disables layout/transform animation sitewide for users who prefer reduced motion, without touching individual components. Least code of the three.
- **GSAP**: no built-in hook — the documented pattern is `gsap.matchMedia()` wrapping each animation in a media-query branch, written by hand per animation or per component.
- **Anime.js v4**: same manual pattern — v4's `Scope` API exposes `mediaQueries` so you can branch, but nothing sets it automatically; every animation's duration/params still needs manual gating.

This codebase already has a global CSS-level `@media (prefers-reduced-motion: reduce)` block in `src/app/globals.css` (lines 122-131) that zeroes out all *CSS* transitions/animations — but that rule cannot reach animations driven by JS/WAAPI (which is how Motion, GSAP, and Anime.js all actually animate under the hood). Motion's `<MotionConfig reducedMotion="user">` at the root client wrapper is the cleanest way to make the JS-driven layer match the existing CSS-driven layer's behavior with a single line, instead of re-deriving the check in every new animated component. `HeroGrainGradient.tsx` already hand-rolls its own `matchMedia` listener for this same reason (it predates this milestone's library choice) — new components added in this milestone should use Motion's built-in mechanism instead of repeating that pattern.

**5. Licensing**

GSAP became **100% free, including every previously-paid Club GreenSock plugin (ScrollTrigger, SplitText, MorphSVG, DrawSVG, etc.), for commercial use, since April 2025**, following Webflow's 2024 acquisition of GreenSock — confirmed via GSAP's own pricing page, Webflow's announcement, and CSS-Tricks' coverage. This removes what used to be GSAP's biggest practical objection for a commercial site; licensing is no longer a differentiator between the three libraries. Motion (MIT license, always free) and Anime.js (MIT license, always free) were never a licensing concern either. Confidence: HIGH (multiple corroborating official/press sources, all dated April 2025).

**6. Core Web Vitals / real-world risk**

- **CLS risk**: all three are equally safe *if used correctly* — animate `opacity`/`transform` only (never `top`/`left`/`width`/`height`), and always set the resting/hidden state before hydration so there's no pre-animation flash. This is a usage discipline, not a library property; none of the three libraries prevents CLS automatically.
- **TBT risk**: Motion's default engine runs on the Web Animations API (hardware-accelerated, off the main thread for transform/opacity) — the same mechanism the existing `tailwindcss-animate` plugin already uses for Radix enter/exit animations in this codebase, so Motion's runtime characteristics are a natural extension of what's already shipping, not a new risk category. GSAP's core also targets transforms and is well-optimized but drives its tween engine on the main thread via `requestAnimationFrame` by default rather than WAAPI (lower TBT risk than most main-thread JS animation, but not zero like pure WAAPI). Anime.js v4 can run WAAPI-only mode (the 3 KB variant) for the same off-main-thread benefit, but doesn't do so by default for all effect types.
- This site already has one measured Lighthouse baseline that includes a WebGL shader (`HeroGrainGradient`, accepted Δ-3 points per the v1.3 milestone). Any addition here should be held to a *stricter* budget than the hero shader, not a looser one — reinforcing staying on the smallest sufficient tool (Motion) over GSAP's larger, timeline-oriented toolkit built for effects this milestone doesn't need.

## Claude Code Skill / MCP — Explicit Answer

**Yes for GSAP, no for Motion or Anime.js.**

GreenSock (GSAP's own maintainer, now under Webflow) publishes an **official** Agent Skills repository at `github.com/greensock/gsap-skills` — 8 skill files (`gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-react`, `gsap-performance`, `gsap-frameworks`) in the standard `SKILL.md` format, explicitly built for coding agents including Claude Code, installable via `npx skills add https://github.com/greensock/gsap-skills` or Claude Code's marketplace integration. It is actively maintained (11.4k GitHub stars, recent commits) and directly documents GSAP's React integration (`useGSAP`) and ScrollTrigger patterns. Confidence: HIGH — verified directly against the GitHub repo, official GreenSock org.

There is **no equivalent official skill or MCP server from Motion (motiondivision/motion.dev) or from the Anime.js maintainer**. Several *unofficial, third-party* MCP servers and skill listings for GSAP exist on community marketplaces (lobehub, mcpmarket, glama, playbooks) of varying and unverified quality/maintenance — not evaluated here since the official GreenSock repo supersedes them, and no project skill directory currently exists in this repo (`.claude/skills/`, etc. are all empty per root `CLAUDE.md`).

**Net effect on the recommendation:** this is the one point genuinely in GSAP's favor, worth naming explicitly to Juan — if the milestone later needs real choreography (e.g. a multi-step case-study scroll sequence, SVG line-drawing), GSAP's official skill would make that phase faster to build correctly. But for *this* milestone's actual scope (scroll-reveal + hover states + light transitions across static content blocks), that complexity ceiling isn't being reached, so it doesn't outweigh Motion's smaller footprint and more idiomatic fit. If a future milestone needs GSAP-tier choreography specifically, add GSAP + its official skill then, incrementally, rather than adopting it now for headroom this milestone doesn't use.

## Integration Pattern for This Codebase (Next.js 15 App Router)

1. Install: `npm install motion` (resolves to `12.42.2` at time of research; no special peer requirement beyond React 18+, and this project is on React 19.2 per root `CLAUDE.md` STACK.md).
2. Add one root-level Client Component wrapping the app (or the relevant locale layout) with the shared feature set, so the ~20 KB cost is paid once, not per-block:
   ```tsx
   // src/components/MotionProvider.tsx
   'use client'
   import { LazyMotion, domAnimation, MotionConfig } from 'motion/react'

   export function MotionProvider({ children }: { children: React.ReactNode }) {
     return (
       <LazyMotion features={domAnimation} strict>
         <MotionConfig reducedMotion="user">{children}</MotionConfig>
       </LazyMotion>
     )
   }
   ```
   `reducedMotion="user"` reads the OS-level `prefers-reduced-motion` preference automatically and disables layout/transform-driven animation for those users sitewide — no per-component wiring needed, consistent with the existing global CSS rule in `globals.css`.
3. Per-block animated leaf components import from `motion/react-m` (the `m` component, not `motion`) to stay inside the lazy-loaded feature set:
   ```tsx
   'use client'
   import * as m from 'motion/react-m'

   export function ScrollReveal({ children }: { children: React.ReactNode }) {
     return (
       <m.div
         initial={{ opacity: 0, y: 16 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true, amount: 0.3 }}
         transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // matches --ease-out already in tailwind.config.ts
       >
         {children}
       </m.div>
     )
   }
   ```
   Note the `ease` value: this project already defines `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` and `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)` in `globals.css`/`tailwind.config.ts` from Phase 7, plus `--motion-fast/base/slow` duration tokens — reuse those exact curves and durations in Motion's `transition.ease`/`transition.duration` so JS-driven motion matches the CSS-driven motion already in the design system, rather than inventing new timing values.
4. Server Components stay untouched — only the small leaf components that actually render `m.*` need `'use client'`, following the exact same boundary pattern already established by `HeroGrainGradient.tsx` in this codebase (a small client leaf, not a client-ified page).
5. For hover states specifically (CTA buttons, card hovers), prefer Tailwind's existing `transition-*`/`hover:` utilities (already wired to the `--motion-fast/base/slow` + `--ease-out/standard` tokens and to `tailwindcss-animate`) where a simple CSS transition suffices — reserve Motion's `whileHover`/`whileTap` for cases needing spring physics, staggered children, or coordination with `whileInView` state, so the JS animation layer is added only where CSS genuinely can't do the job.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not (for this milestone) |
|----------|-------------|-------------|-------------------------------|
| Micro-animation engine | `motion` (`motion/react`, LazyMotion+m+domAnimation) | `gsap` + `@gsap/react` + `ScrollTrigger` | ~10 KB heavier for this scope, more imperative/boilerplate-per-component fit, ScrollTrigger's power (scrubbing/pinning) is unused for simple reveal-on-scroll. Keep in the back pocket for a future milestone that needs real choreography — GSAP has an official Claude Code skill ready if that day comes. |
| Micro-animation engine | `motion` | `animejs` v4 | Smallest raw engine, but no React bindings/hooks (imperative refs + manual cleanup like GSAP, without GSAP's `useGSAP` convenience), no built-in gesture (hover/tap) handling, and its scroll utilities are the newest/least proven part of the v4 rewrite. The size delta vs. Motion for this milestone's actual needs is small once hover-gesture code is hand-rolled. |
| Full bundle vs. lazy | `LazyMotion` + `m` (4.6 KB + domAnimation 15 KB) | Plain `motion` component import | The full `motion` component is ~34 KB on its own with no code-splitting benefit — no reason to pay that when `LazyMotion`+`m` gives identical animation capability for this scope at roughly half the cost. |
| Hover micro-interactions | Tailwind `transition-*`/`hover:` (existing tokens) + Motion only where needed | Motion `whileHover` everywhere | Simple color/shadow/scale hovers are already covered by this project's existing `--motion-fast/base/slow` + `--ease-out/standard` CSS transition tokens (Phase 7) and `tailwindcss-animate` — adding Motion's JS layer for every hover would be redundant weight for zero visual gain over CSS. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Plain `motion` component import (`import { motion } from 'motion/react'`) | ~34 KB, no code-splitting — pays for the full feature set even where only `whileInView`/`whileHover` is used | `LazyMotion` + `m` from `motion/react-m` |
| `gsap` + `ScrollTrigger` as the default for this milestone's scope | ~10 KB heavier, imperative boilerplate per component, its scrubbing/pinning power is unused for simple reveal-on-scroll | `motion` (see above); revisit GSAP only if a future milestone needs real timeline choreography |
| Hand-rolled `IntersectionObserver` + custom React hook for scroll-reveal | Reinvents what `whileInView`/`useInView` already provide, with none of Motion's built-in `viewport`/`once`/`amount` ergonomics or reduced-motion integration | Motion's `whileInView` |
| Re-deriving `prefers-reduced-motion` checks per component (the pattern `HeroGrainGradient.tsx` uses out of necessity, predating this library choice) | Duplicated logic across every new animated component, easy to forget on one of them | `<MotionConfig reducedMotion="user">` once at the root client wrapper |

## Sources

- https://motion.dev/docs/react-reduce-bundle-size — `LazyMotion`/`m`/`domAnimation` sizes (4.6 KB base, +15 KB `domAnimation`, +25 KB `domMax`), official Motion docs — HIGH
- https://motion.dev/docs/react-use-in-view and https://motion.dev/docs/inview — confirms `whileInView`/`useInView` use `IntersectionObserver` internally — HIGH
- https://motion.dev/docs/gsap-vs-motion — official Motion-authored comparison (used as one data point, cross-checked against independent sources below since it's not neutral) — MEDIUM
- https://www.pkgpulse.com/compare/framer-motion-vs-gsap , https://devpick.co/framer-motion-vs-gsap , https://lab.good-fella.com/blog/gsap-vs-framer-motion-vs-react-spring — independent 2026 bundle-size comparisons corroborating Motion vs GSAP numbers — MEDIUM
- https://gsap.com/pricing/ , https://webflow.com/updates/gsap-becomes-free , https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/ — GSAP 100% free since April 2025, all plugins included — HIGH
- https://gsap.com/resources/React/ and `@gsap/react` npm page — `useGSAP()` hook pattern, `'use client'` requirement, automatic `gsap.context()` cleanup on unmount — HIGH
- https://animejs.com/ and https://animejs.com/documentation/events/onscroll/ — Anime.js v4 bundle sizes (3 KB WAAPI-only / 10 KB full), `onScroll`/`ScrollObserver` scroll utilities, `Scope.mediaQueries` for reduced-motion — MEDIUM (official docs, but v4's scroll API is recent so less independently corroborated)
- https://github.com/greensock/gsap-skills — official GreenSock Agent Skills repo (Claude Code / Cursor / Copilot compatible `SKILL.md` files), confirms no equivalent exists for Motion or Anime.js — HIGH (direct repo verification)
- npm registry (queried live, 2026-07-13): `motion@12.42.2`, `framer-motion@12.42.2` (legacy alias package, same version, kept for backward compatibility — install `motion`, not `framer-motion`), `gsap@3.15.0`, `animejs@4.5.0` — HIGH
- Read directly: `src/components/HeroGrainGradient.tsx` (existing client-leaf-component boundary pattern, existing hand-rolled `prefers-reduced-motion` handling via `matchMedia`), `tailwind.config.ts` + `src/app/globals.css` (existing `--motion-fast/base/slow`, `--ease-out`/`--ease-standard` tokens from Phase 7, existing global CSS `prefers-reduced-motion` block, existing `tailwindcss-animate` plugin), `.planning/PROJECT.md` (Core Value, v1.3 hero-shader precedent, v1.6 milestone scope) — HIGH (primary source, this codebase)
