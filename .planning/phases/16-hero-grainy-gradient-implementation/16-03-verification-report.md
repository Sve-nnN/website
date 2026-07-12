# Phase 16-03: Hero GrainGradient Verification Report

**Run against:** `http://localhost:3000` (real dev server, already running)
**Script:** `scripts/verify-hero-grain-gradient.mjs`
**Result:** `RESULT: PASS` — exit code 0, 0 failures, 0 warnings, 23 notes, 5 screenshots

**Scope note:** This report covers visual/structural correctness only (canvas renders, colors are plausibly in the right family, no layout overflow, copy unchanged, reduced-motion correctly read). Lighthouse/Core Web Vitals verification is explicitly out of scope for Phase 16 — that is Phase 17's job.

**Revision note (this version):** This report was re-run after a post-implementation retune (see `16-CONTEXT.md`'s "Revisión post-implementación"). The original Plan 16-03 execution verified the `wave` shape. Juan then requested a redesign (single curved ribbon, near-black backdrop), which went through `wave` → `ripple` → **`blob`** (final, per Juan's explicit live preference). The findings below reflect the final `blob` implementation, re-verified against a live dev server after every shape change, most recently after switching from `ripple` to `blob`.

---

## Checks and Outcomes (final `blob` implementation)

### 1. Shader wrapper + default motion state (`/es`, `/en` at 1280x800)

| Locale | `[data-testid="hero-grain-gradient"]` present | `data-motion` (default) |
|--------|-----------------------------------------------|--------------------------|
| es | PASS | `"live"` |
| en | PASS | `"live"` |

### 2. Canvas actually painted (non-blank, non-zero size)

| Locale | Canvas present | Bounding box |
|--------|-----------------|--------------|
| es | PASS | 1280 x 426 px |
| en | PASS | 1280 x 367 px |

Confirms the shader mounted a real WebGL canvas and painted an area matching the Hero section's height (not an empty/collapsed DOM node).

### 3. Coarse color sanity check (WARN-only, not a hard assertion)

| Locale | Average RGB (cropped to Hero section) | In dark-navy-family range (<90)? |
|--------|-----------------------------------------|-----------------------------------|
| es | R=24.9 G=23.6 B=28.0 | PASS |
| en | R=26.3 G=24.7 B=28.9 | PASS |

Both locales' composited average is now much darker than the earlier `wave`/`ripple` iterations (R/G/B all in the low-to-mid 20s, vs. 50-90 previously) — consistent with `blob`'s much more minimal, near-black rendering at these tuned parameters. This check is intentionally approximate: it is a sanity check that the shader isn't rendering solid white or an unrelated hue, not a pixel-perfect hex match — exact-hex assertions are unreliable against an animated, noisy gradient.

### 4. Horizontal overflow (`/es`, all three breakpoints)

| Viewport | scrollWidth | Overflow? |
|----------|-------------|-----------|
| 375px | 375px | PASS (none) |
| 768px | 768px | PASS (none) |
| 1280px | 1280px | PASS (none) |

### 5. Content-unchanged check (HERO-ANIM-03)

| Locale | Title | Subtitle | CTA |
|--------|-------|----------|-----|
| es | "Juan Carlos Angulo: Ingeniero de Software y Experto SEO" — PASS | "Arquitecturas de alto rendimiento y estrategias de crecimiento orgánico" — PASS | "Ver case studies" visible — PASS |
| en | "Juan Carlos Angulo: Software Engineer & SEO Expert" — PASS | "High-performance architectures and organic growth strategies" — PASS | "View Case Studies" visible — PASS |

No home-Hero breadcrumbs exist (breadcrumbs are `listing`-variant only, per `Component.tsx`), consistent with the plan's scoping — not checked here.

### 6. `prefers-reduced-motion: reduce` emulation

| Check | Result |
|-------|--------|
| `data-motion` flips to `"reduced"` under Playwright's `reducedMotion: 'reduce'` context emulation | PASS |

This confirms the component correctly reads `window.matchMedia('(prefers-reduced-motion: reduce)')` and would pass `speed={0}`/`frame={0}` to `GrainGradient` — satisfying HERO-ANIM-04. (Note: this same check, run manually during Plan 2's development, is what surfaced and led to fixing a real hydration-mismatch bug — see `16-02-SUMMARY.md`, commit `3f15c57` — where the DOM attribute initially failed to update after hydration. The fix is verified working here, unaffected by the later shape retune.)

---

## Screenshots

All saved to `scripts/.mobile-verify-screenshots/` (gitignored, regenerable by re-running the script). Also archived non-gitignored copies of the shape-comparison and final decision in `.planning/phases/16-hero-grainy-gradient-implementation/retune-screenshots/`:

- `home-es-1280.png` — desktop, Spanish, default (live) motion (final `blob` shape)
- `home-en-1280.png` — desktop, English, default (live) motion
- `home-es-375.png` — mobile viewport, Spanish
- `home-es-768.png` — tablet viewport, Spanish
- `home-es-reduced-motion.png` — desktop, Spanish, `prefers-reduced-motion: reduce` emulated
- `retune-screenshots/shape-comparison-ripple.png` — the `ripple` candidate Juan compared against
- `retune-screenshots/shape-comparison-blob.png` — an early `blob` candidate from the comparison
- `retune-screenshots/final-blob-chosen.png` — the final tuned `blob` implementation

## Design History — Shape Decision (for Juan's record)

1. **`wave`** (original Plan 16-02 implementation): functionally correct, but Juan reviewed it live with a reference image and requested a single curved ribbon over a near-black backdrop with much more negative space, plus mouse reactivity.
2. **`ripple`** (first retune): a bolder, graphic single curved arc, achieved by parking the ripple's fixed concentric-ring center outside the frame via static `offsetX`/`offsetY`. Verified working (RESULT: PASS).
3. **Mouse reactivity**: implemented for real (`pointermove` listener, rAF-throttled, `offsetX`/`offsetY` bound to cursor position, reduced-motion and touch aware) and verified working via Playwright (the ribbon's position visibly changed as the cursor moved across three tested positions). Juan tried it live and explicitly rejected it — removed entirely, no pointer/cursor tracking remains anywhere in the component or is planned elsewhere.
4. **`blob`** (final, per Juan's explicit preference: "me gusta mas blob que ripple"): even at the shader library's own official preset values, `blob` renders as a much more subtle, near-black grain texture with this package version and the brand's tonally-close navy/ember palette — extensively investigated (multiple `intensity`/`softness`/`scale`/`offset` combinations, confirmed via real pixel-value sampling with `sharp`, not just visual inspection) before concluding this is genuine shader behavior, not a parameter mistake. Juan compared this calmer, more minimal read against `ripple`'s bolder arc and preferred `blob`.

## Explicitly Out of Scope

- Lighthouse / Core Web Vitals verification (LCP, CLS, TBT, GPU/CPU cost of the shader) — deferred to Phase 17 per the phase boundary.
- Pixel-perfect hex-value assertion of the rendered gradient — not reliable against an animated, noise-textured shader; the coarse dark-navy-family check above is the practical substitute, cross-checked with real pixel sampling during the shape investigation.

## Conclusion

All hard assertions pass (canvas renders on both locales, no overflow at any breakpoint, content unchanged, reduced-motion correctly detected) against the final `blob` implementation. The coarse color check passes on both locales with zero warnings, now reading much darker/more minimal than earlier iterations, consistent with Juan's preference. HERO-ANIM-01, HERO-ANIM-02, HERO-ANIM-03, and HERO-ANIM-04 are confirmed with real headless-browser evidence. Mouse reactivity was built, verified working, and then explicitly removed per Juan's direct rejection — not a gap, a deliberate reversal.
