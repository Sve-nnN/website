---
phase: 16-hero-grainy-gradient-implementation
plan: 02
subsystem: ui
tags: [webgl, shader, hero, animation, react, next, prefers-reduced-motion]

requires:
  - phase: 16-01
    provides: "@paper-design/shaders-react installed and cleared"
provides:
  - "GrainGradient WebGL shader as the home Hero's background"
  - "HeroGrainGradient reusable Client Component with reduced-motion + error-boundary handling"
affects: [16-03]

tech-stack:
  added: []
  patterns:
    - "Client Component isolation for interactive/animated layers, rest of tree stays Server Component"
    - "SSR-safe media-query reads: initialize state to the SSR-matching value, do the real matchMedia() read inside useEffect (not a useState lazy initializer) to avoid unpatched hydration mismatches"

key-files:
  created: [src/components/HeroGrainGradient.tsx]
  modified: [src/blocks/Hero/Component.tsx]

key-decisions:
  - "16-02: colors/colorBack hardcoded as build-time constants (LIGHT_/DARK_ prefixed) copied verbatim from globals.css tokens per UI-SPEC, not re-derived at runtime"
  - "16-02: isDark read once via document.documentElement.classList.contains('dark') in a useState lazy initializer (no MutationObserver) since dark mode is confirmed unreachable on this site today (no toggle, no OS-preference wiring) — forward-compatible but intentionally not live-updated"
  - "16-02 (Rule 1 bug fix): reducedMotion must NOT be read inside a useState lazy initializer — that produces a client/server hydration mismatch React explicitly does not patch after hydration (confirmed live via Playwright: data-motion stayed 'live' with prefers-reduced-motion: reduce emulated). Fixed by initializing to false (matching SSR) and doing the real matchMedia read inside useEffect."

patterns-established:
  - "SSR-safe matchMedia pattern: useState(false) + useEffect read, not useState(() => matchMedia...)"

requirements-completed: [HERO-ANIM-01, HERO-ANIM-02, HERO-ANIM-03, HERO-ANIM-04]

duration: 25min
completed: 2026-07-11
---

# Phase 16 Plan 02: Build and Wire HeroGrainGradient Summary

**Home Hero's solid navy background replaced by a live WebGL `GrainGradient` shader (navy-to-ember wave gradient with grain), built from a new isolated Client Component and wired only into the `isHome` branch — non-home variants, title/subtitle/CTAs/breadcrumbs, and `prefers-reduced-motion` handling all verified unchanged/working via a real headless-browser run.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-11
- **Completed:** 2026-07-11
- **Tasks:** 2/2 complete
- **Files modified:** 2 (1 created: `src/components/HeroGrainGradient.tsx`; 1 modified: `src/blocks/Hero/Component.tsx`)

## Accomplishments

- Built `src/components/HeroGrainGradient.tsx` (`'use client'`): wraps `GrainGradient` from `@paper-design/shaders-react`, theme-aware colors (light/dark constants copied from `globals.css` tokens per 16-UI-SPEC.md), `prefers-reduced-motion` handling (`speed=0`/`frame=0` when reduced, live-updates on media query `change`), `ShaderErrorBoundary` (class component) falling back to a plain `bg-secondary` div if WebGL context creation throws.
- Wired `HeroGrainGradient` into `src/blocks/Hero/Component.tsx`'s `isHome` branch: `bg-secondary` kept on the section (SSR/pre-hydration background, zero flash), `overflow-hidden` added to the `isHome` className, the image-overlay block gated to non-home variants only (`!isHome && image?.url`), title/subtitle/CTAs/breadcrumbs markup completely untouched.
- Confirmed with real `tsc --noEmit`: zero errors across both files.
- Confirmed visually with a real Chromium instance (Playwright, ad-hoc scripts during this plan — the reusable script is Plan 3's deliverable): shader renders a genuine navy/ember wave gradient with visible grain, canvas mounts with real non-zero dimensions (1280x425 at 1280px viewport), no horizontal overflow at 375/768/1280px, works on both `/es` and `/en`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unpatched hydration mismatch on `prefers-reduced-motion` read**
- **Found during:** Task 1 visual verification (this plan; the fix was applied before committing Task 1's work as final)
- **Issue:** `reducedMotion` state was initialized via a `useState` lazy initializer that called `window.matchMedia(...)` directly. Since the server always renders with `reducedMotion=false` (no `window` during SSR) but the client's initial hydration render could compute `true`, this produced a client/server hydration mismatch. Confirmed live via Playwright with `reducedMotion: 'reduce'` emulation: React logged "A tree hydrated but some attributes... didn't match... This won't be patched up," and the DOM's `data-motion` attribute stayed `"live"` even though the component's internal state was correctly `"reduced"` — React does not patch attribute-level hydration mismatches after the initial commit.
- **Fix:** `reducedMotion` now initializes to `false` (matching what SSR always renders), and the real `matchMedia` read happens inside `useEffect` (a genuine post-mount state update, which React does correctly apply to the DOM) instead of during the render/hydration pass.
- **Files modified:** `src/components/HeroGrainGradient.tsx`
- **Verified:** Re-ran the same Playwright reduced-motion-emulation check — `data-motion` now correctly reads `"reduced"`, no hydration-mismatch console error.
- **Commit:** 3f15c57

## Visual Verification (ad-hoc, pre-Plan-3)

Performed directly against the real dev server (already running on :3000) via Playwright, to confirm the shader isn't blank/broken before considering this plan done:
- `/es` home Hero screenshot at 1280px: shader renders a visible navy-to-ember wave gradient with grain texture, title ("Juan Carlos Angulo: Ingeniero de Software y Experto SEO"), subtitle, and CTA ("Ver case studies") all remain crisp and readable on top.
- Canvas element confirmed present with real bounding box (1280x425.6px), not a zero-size/empty node.
- No horizontal overflow at 375/768/1280px viewports.
- `/en` route confirmed to also render the shader wrapper.
- `prefers-reduced-motion: reduce` emulation confirmed `data-motion="reduced"` after the Rule 1 fix above.
- Dark-theme color path (`isDark`) not visually exercised — confirmed unreachable on the live site today (no `dark` class ever applied, per 16-UI-SPEC.md's "Dark-theme reachability note"), code path present but untested against a real dark-mode render.

Plan 3 builds the reusable, permanent version of this verification as `scripts/verify-hero-grain-gradient.mjs`.

## Commits

- 5bbc405: feat(16-02): build HeroGrainGradient client component
- 29d48ab: feat(16-02): wire HeroGrainGradient into Hero home variant
- 3f15c57: fix(16-02): avoid hydration mismatch on prefers-reduced-motion read

## Self-Check: PASSED

- FOUND: src/components/HeroGrainGradient.tsx
- FOUND: src/blocks/Hero/Component.tsx modified (HeroGrainGradient imported and rendered in isHome branch)
- FOUND: commit 5bbc405 in git log
- FOUND: commit 29d48ab in git log
- FOUND: commit 3f15c57 in git log

## Addendum: Post-Implementation Retune (same day, after Juan saw the live result)

After Juan reviewed the `wave`-shape version above live (with a reference image), he requested a different look: a single curved light ribbon (ember→navy) over a near-black backdrop, with much more negative space, plus mouse reactivity. This went through two further iterations before landing — see `.planning/phases/16-hero-grainy-gradient-implementation/16-CONTEXT.md`'s "Revisión post-implementación" section for the full decision record, and commits `8e9c1c1`/`b7b7eaa` for the final code.

Summary of what changed vs. this SUMMARY's original content:
- `shape`: `wave` → `ripple` (first retune, commit `8e9c1c1`) → **`blob`** (final, commit `b7b7eaa`, per Juan's explicit live preference: "me gusta mas blob que ripple"). `ripple` gave a bolder, more graphic single arc; `blob` — even at the library's own official preset values — renders as a much more subtle near-black grain texture with this package version and our tonally-close brand palette (verified via real pixel sampling with `sharp`, not just visual inspection, before concluding this is genuine shader behavior and not a parameter mistake). Juan preferred `blob`'s calmer, more minimal read.
- `colorBack`: solid navy (`--secondary`) → near-black (`#0A0A0F`) — kept across both shape iterations
- `offsetX`/`offsetY`: added for the `ripple` iteration only (to park its center outside the frame); removed again for the final `blob` version, which has no single fixed center to park
- Mouse reactivity: implemented for real (verified working via Playwright — the ribbon's position visibly changed as the cursor moved), then **removed entirely** per Juan's explicit rejection after live testing. No pointer/cursor tracking remains anywhere in this component or is planned elsewhere.
- `reducedMotion`/hydration-safety pattern from the original implementation (the Rule 1 fix documented above) is unchanged and still in effect.

`HERO-ANIM-01..04` remain satisfied under the final `blob` implementation — same component boundary, same reduced-motion mechanism, same token-derived colors (just a different near-black `colorBack` and different `colors` array values, still sourced from `globals.css` navy/ember tones, no invented hues).
