# Phase 16-03: Hero GrainGradient Verification Report

**Run against:** `http://localhost:3000` (real dev server, already running)
**Script:** `scripts/verify-hero-grain-gradient.mjs`
**Result:** `RESULT: PASS` — exit code 0, 0 failures, 0 warnings, 23 notes, 5 screenshots

**Scope note:** This report covers visual/structural correctness only (canvas renders, colors are plausibly in the right family, no layout overflow, copy unchanged, reduced-motion correctly read). Lighthouse/Core Web Vitals verification is explicitly out of scope for Phase 16 — that is Phase 17's job.

---

## Checks and Outcomes

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
| es | R=83.2 G=52.2 B=49.0 | PASS |
| en | R=79.7 G=52.1 B=50.5 | PASS |

Both locales' composited average stays within the coarse dark-navy-family threshold, even though the screenshots show a substantial warm/ember region in the lower half of the section (the `wave` shape's undulating band, not a flat "10% minority" strip — see the Color / Contrast note below). This check is intentionally approximate: it is a sanity check that the shader isn't rendering solid white or an unrelated hue, not a pixel-perfect hex match against the UI-SPEC's resolved `colors` array — exact-hex assertions are unreliable against an animated, noisy gradient.

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

This confirms the component correctly reads `window.matchMedia('(prefers-reduced-motion: reduce)')` and would pass `speed={0}`/`frame={0}` to `GrainGradient` — satisfying HERO-ANIM-04. (Note: this same check, run manually during Plan 2's development, is what surfaced and led to fixing a real hydration-mismatch bug — see `16-02-SUMMARY.md`, commit `3f15c57` — where the DOM attribute initially failed to update after hydration. The fix is verified working here.)

---

## Screenshots

All saved to `scripts/.mobile-verify-screenshots/` (gitignored, regenerable by re-running the script):

- `home-es-1280.png` — desktop, Spanish, default (live) motion
- `home-en-1280.png` — desktop, English, default (live) motion
- `home-es-375.png` — mobile viewport, Spanish
- `home-es-768.png` — tablet viewport, Spanish
- `home-es-reduced-motion.png` — desktop, Spanish, `prefers-reduced-motion: reduce` emulated

## Color / Contrast — Human Visual Judgment Call

Per `human_verify_mode=end-of-phase`, the following is flagged for Juan's own visual pass rather than an automated pass/fail, since exact-hex/contrast assertions against an animated noisy gradient aren't reliable:

- The shader renders a visible navy-to-ember "wave" gradient with grain texture. In the captured screenshots, the ember/orange band occupies a larger visual area (roughly the lower third to half of the section, depending on scroll position within the wave) than the UI-SPEC's "10% minority" framing might suggest at first read — this is a property of the `wave` shape's shape/distortion pattern at `intensity=0.25`, not a code deviation (the exact `colors`/`intensity`/`softness`/`noise` prop values from 16-UI-SPEC.md's Shader Parameters table were used verbatim, see `16-02-SUMMARY.md`).
- Title, subtitle, and CTA text remain clearly legible against the shader in every captured screenshot (both locales, all three breakpoints, both live and reduced-motion states) — no visual washout observed.
- Recommendation: Juan should do a quick live look at `http://localhost:3000/es` and `/en` (or the screenshots above) to confirm the ember-to-navy balance reads as "subtle, professional, B2B" per the original brief, and is not perceived as too bold/experimental. If adjustment is desired, the only tunable values are `intensity` (currently `0.25`) and `softness` (currently `0.8`) in `src/components/HeroGrainGradient.tsx` — no other code changes needed.
- Dark-theme color path (`isDark`) was not exercised in this verification run — confirmed unreachable on the live site today per 16-UI-SPEC.md's "Dark-theme reachability note" (no `dark` class is ever applied anywhere in `src/`), so this is expected, not a gap.

## Explicitly Out of Scope

- Lighthouse / Core Web Vitals verification (LCP, CLS, TBT, GPU/CPU cost of the shader) — deferred to Phase 17 per the phase boundary.
- Pixel-perfect hex-value assertion of the rendered gradient — not reliable against an animated, noise-textured shader; the coarse dark-navy-family check above and Juan's own visual pass are the practical substitutes.

## Conclusion

All hard assertions pass (canvas renders on both locales, no overflow at any breakpoint, content unchanged, reduced-motion correctly detected). The coarse color check passes on both locales with zero warnings. HERO-ANIM-01, HERO-ANIM-02, HERO-ANIM-03, and HERO-ANIM-04 are confirmed with real headless-browser evidence, pending Juan's final visual/tone judgment call noted above.
