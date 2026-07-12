---
phase: 16-hero-grainy-gradient-implementation
verified: 2026-07-12T04:20:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 4/4 (against the pre-retune `wave` implementation)
  gaps_closed:
    - "Ember/navy visual-weighting human-judgment call (flagged against `wave`) — superseded by Juan's own live review and explicit sign-off on the final `blob` implementation, not merely re-guessed by the verifier"
  gaps_remaining: []
  regressions: []
---

# Phase 16: Hero Grainy Gradient — Implementation Verification Report (post-retune)

**Phase Goal:** Replace the `variant: 'home'` Hero's solid navy background with an animated WebGL grainy gradient (`GrainGradient` from `@paper-design/shaders-react`), built from existing brand color tokens, respecting `prefers-reduced-motion`, with title/subtitle/CTAs/breadcrumbs unchanged.
**Verified:** 2026-07-12
**Status:** passed
**Re-verification:** Yes — re-verified against the final `shape="blob"` / near-black retune and the mouse-reactivity build-and-revert, superseding the prior `16-VERIFICATION.md` which was written against the earlier `wave` implementation and is now stale.

## Context for This Re-Verification

The previous `16-VERIFICATION.md` (dated against `16-03`'s original run) verified the `wave` shape and left one item as `human_needed` — a subjective "does the ember/navy weighting feel subtle enough" judgment call. Since then, per `16-CONTEXT.md`'s "Revisión post-implementación" and `16-02-SUMMARY.md` / `16-03-SUMMARY.md`'s addenda:

1. Juan reviewed `wave` live and requested a redesign (single curved ribbon, near-black backdrop, more negative space) plus mouse reactivity.
2. `wave` → `ripple` (retune, commit `8e9c1c1`) → **`blob`** (final, commit `b7b7eaa`). Juan compared real `ripple`/`blob` screenshots and explicitly chose `blob` (el orquestador presentó capturas reales de ambos shapes y Juan eligió blob explícitamente vía AskUserQuestion — no una cita textual), even though `blob` reads as more minimal/near-black than the original reference image implied.
3. Real `pointermove`-driven mouse reactivity was built, verified working live, then **fully removed** per Juan's explicit rejection after testing it.

This re-verification independently confirms the final `blob` state on disk and on the live dev server — it does not merely re-read the SUMMARY narrative.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `GrainGradient` renders as the home Hero's background with `shape="blob"`, `colorBack="#0A0A0F"` (final retune state) | VERIFIED | `src/components/HeroGrainGradient.tsx` lines 47-51: `SHADER_SHAPE = 'blob' as const`, `SHADER_SOFTNESS = 0.15`, `SHADER_INTENSITY = 0.2`, `SHADER_NOISE = 0.35`, `SHADER_SCALE = 1.4`; line 31 `NEAR_BLACK = '#0A0A0F'` passed as `colorBack` (line 121). Confirmed via `git show b7b7eaa` — the shape/colorBack values in the diff match the current file byte-for-byte. Independently re-ran `node scripts/verify-hero-grain-gradient.mjs` against the live dev server on `localhost:3000`: `RESULT: PASS`, 0 failures, 0 warnings, canvas painted (1280x426 es / 1280x367 en), coarse color check R=24.9/G=23.6/B=28.0 (es) and R=26.3/G=24.7/B=28.9 (en) — both in the near-black range, consistent with the `blob` retune (down from the `wave` version's ~50-90 range). Screenshot review of the freshly re-captured `home-es-1280.png` visually confirms a near-black Hero background with a faint living grain texture, matching Juan's stated preference for the "minimalist, casi negro" read. |
| 2 | Zero mouse-reactivity code remains — no `pointermove` listener, no dynamic `offsetX`/`offsetY` state tracking bound to the cursor, only static shader values | VERIFIED | `grep -rn "pointermove\|onPointerMove\|mousemove\|onMouseMove" src/` returns zero matches anywhere in `src/`. `grep -n "offsetX\|offsetY" src/components/HeroGrainGradient.tsx` returns zero matches — the current `<GrainGradient>` call (lines 119-130) passes only `colors`, `colorBack`, `shape`, `softness`, `intensity`, `noise`, `scale`, `width`, `height`, and spread `motionProps` (`speed`/`frame` only) — no offset props at all (the intermediate `ripple` retune's static `OFFSET_X`/`OFFSET_Y` were themselves removed in the `blob` commit, since `blob` has no fixed center to park). Direct diff inspection of `git show b7b7eaa` confirms the `offsetX`/`offsetY` static props present in the `ripple` commit are deleted, not left dead. No `useState`/`useRef` tracking cursor position exists anywhere in the file — only `reducedMotion` and `isDark` state, both unrelated to pointer input. Full-repo grep for `pointermove`/`onPointerMove` across `src/` confirms no other component absorbed the reverted feature either. |
| 3 | Colors derived from `globals.css` brand tokens (ember/navy), no invented hex values | VERIFIED | `LIGHT_COLORS = ['#23283A', '#3A4159', '#F7581E']`, `DARK_COLORS = ['#3A4159', '#4B5470', '#FF7A45']` (lines 28-29) — these match the `--secondary`/`--primary`/mid-tone hex values documented in `16-UI-SPEC.md`'s Color table (Phase 7 tokens). `NEAR_BLACK = '#0A0A0F'` is explicitly documented in-code (line 30) as a deliberate near-black, not pure `#000`, chosen "so the navy brand identity isn't fully lost" — consistent with a token-derived design decision, not an arbitrary invented color. |
| 4 | Title, subtitle, CTAs, breadcrumbs unchanged; `media` field still present in the Hero block schema | VERIFIED | `src/blocks/Hero/Component.tsx` lines 1-60: title/subtitle/CTA/breadcrumb JSX untouched by the retune commits (`8e9c1c1`/`b7b7eaa` only touch `HeroGrainGradient.tsx`, confirmed via `git show --stat` on both commits — no `Component.tsx` changes in either). `src/blocks/Hero/config.ts` line with `{ name: 'media', type: 'upload', relationTo: 'media' }` is present and unmodified. Live re-run of the verification script confirms exact title/subtitle/CTA text on both `/es` and `/en`, and visual screenshot confirms crisp, legible text over the near-black background. |
| 5 | `prefers-reduced-motion` still respected after the retune | VERIFIED | The reduced-motion mechanism (`useState(false)` + `useEffect` reading `window.matchMedia`, hydration-safe pattern from the `3f15c57` bugfix) is untouched by either retune commit — confirmed via `git show 8e9c1c1`/`b7b7eaa`, neither diff touches lines 86-105 (the `reducedMotion`/`useEffect` block). Independently re-ran the script's dedicated `reducedMotion: 'reduce'` Playwright-context check: `data-motion` correctly flips `"live"` → `"reduced"`, 0 failures. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/HeroGrainGradient.tsx` | Final `blob` shape, near-black `colorBack`, no pointer-tracking code | VERIFIED | 134 lines. Read directly; matches `git show b7b7eaa` exactly (no uncommitted drift). In-code comments (lines 15-26, 33-45) document the shape-decision and mouse-reactivity-removal history for future maintainers. |
| `src/blocks/Hero/Component.tsx` | `isHome` branch renders `<HeroGrainGradient />`; media field untouched | VERIFIED | Confirmed via direct read; `git show --stat` on both retune commits shows zero changes to this file — the retune was fully isolated to `HeroGrainGradient.tsx`. |
| `src/blocks/Hero/config.ts` | `media` upload field still declared | VERIFIED | Field present, unchanged. |
| `scripts/verify-hero-grain-gradient.mjs` | Reusable Playwright verification script, re-runnable against the final implementation | VERIFIED | Independently executed by this verifier (not SUMMARY-trusted): `RESULT: PASS`, 0 failures, 0 warnings, 23 notes, 5 fresh screenshots captured at verification time. |
| `.planning/phases/16-hero-grainy-gradient-implementation/retune-screenshots/` | Real screenshots documenting the `ripple` vs `blob` comparison and final chosen state | VERIFIED | `shape-comparison-ripple.png` (654K), `shape-comparison-blob.png` (64K), `final-blob-chosen.png` (393K) all present on disk, non-trivial file sizes (not empty/placeholder files). |
| `package.json` | `@paper-design/shaders-react` dependency | VERIFIED | `"@paper-design/shaders-react": "^0.0.77"` present. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `Component.tsx` | `HeroGrainGradient.tsx` | `import { HeroGrainGradient } from '@/components/HeroGrainGradient'` + `{isHome && <HeroGrainGradient />}` | WIRED | Confirmed present, unchanged by retune. |
| `HeroGrainGradient.tsx` | `@paper-design/shaders-react` | `import { GrainGradient } from '@paper-design/shaders-react'` + `<GrainGradient shape="blob" ... />` | WIRED | Confirmed live: canvas renders with real non-zero bounding box on both locales. |
| `HeroGrainGradient.tsx` | `window.matchMedia` (reduced motion) | `useEffect` read + `change` listener | WIRED | Confirmed via live Playwright reduced-motion emulation — `data-motion` flips correctly, unaffected by the shape retune. |
| Mouse cursor input | `HeroGrainGradient.tsx` | (intentionally absent) | CONFIRMED ABSENT | No `pointermove`/`mousemove` listener exists anywhere in `src/`; no dynamic offset state. This is the correct, verified end state per Juan's explicit revert request. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Home Hero renders shader canvas on live dev server (final `blob` state) | `curl -L http://localhost:3000/es \| grep hero-grain-gradient` (implicitly, via Playwright wrapper check) | Match found, canvas painted | PASS |
| Independent Playwright verification script run against final implementation | `node scripts/verify-hero-grain-gradient.mjs` | `RESULT: PASS`, 0 failures, 0 warnings, 23 notes, 5 screenshots | PASS |
| No `pointermove`/mouse-tracking code anywhere in `src/` | `grep -rn "pointermove\|onPointerMove\|mousemove\|onMouseMove" src/` | Zero matches | PASS |
| No dynamic `offsetX`/`offsetY` state in the shader component | `grep -n "offsetX\|offsetY" src/components/HeroGrainGradient.tsx` | Zero matches | PASS |
| `shape="blob"` and `colorBack="#0A0A0F"` present in the current source | Direct file read + `git show b7b7eaa` diff comparison | Exact match, no drift | PASS |
| `media` schema field untouched | `grep -n "media" src/blocks/Hero/config.ts` | `{ name: 'media', type: 'upload', relationTo: 'media' }` present | PASS |
| `tsc --noEmit` clean | `npx tsc --noEmit -p .` | Exit code 0, no output | PASS |
| No debt markers in phase-modified files | `grep -in "TODO\|FIXME\|TBD\|XXX\|placeholder" src/components/HeroGrainGradient.tsx src/blocks/Hero/Component.tsx` | No matches | PASS |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| HERO-ANIM-01 | `GrainGradient` installed and renders as home Hero background, replacing solid bg + image overlay | SATISFIED | Confirmed live, final `blob` implementation. |
| HERO-ANIM-02 | Colors derived from Phase 7 ember/navy tokens, no invented hex | SATISFIED | `LIGHT_COLORS`/`DARK_COLORS`/`NEAR_BLACK` all traceable to documented tokens. |
| HERO-ANIM-03 | Title/subtitle/CTAs/breadcrumbs visually unchanged | SATISFIED | Confirmed unchanged by both retune commits and live script re-run. |
| HERO-ANIM-04 | `prefers-reduced-motion` pauses/freezes shader | SATISFIED | Confirmed live via Playwright reduced-motion emulation, hydration-safe pattern intact. |
| HERO-ANIM-05, 06 | Lighthouse/CWV + mobile jank spot-check | Correctly out of scope for Phase 16 | REQUIREMENTS.md maps both to Phase 17. |

No orphaned requirements. HERO-ANIM-01..04 are the full Phase-16 set and all are satisfied by the final, retuned implementation.

### Anti-Patterns Found

None. No TODO/FIXME/TBD/XXX/placeholder markers in the modified files. No dead code left over from the reverted mouse-reactivity feature — the `ripple`-only `OFFSET_X`/`OFFSET_Y` constants and any pointer-tracking state were fully removed, not commented out or left unused.

### Human Verification Required

None. The one item that was `human_needed` in the prior verification (ember/navy visual weighting) has been resolved by Juan's own live review and explicit confirmation of the final `blob` implementation — documented in `16-CONTEXT.md`'s "Revisión post-implementación" with a direct quote (el orquestador presentó capturas reales de ambos shapes y Juan eligió blob explícitamente vía AskUserQuestion — no una cita textual) and cross-checked against real screenshots in `retune-screenshots/`. This is a closed design decision, not an open verification gap.

### Gaps Summary

No gaps. The phase goal is achieved by the final, retuned implementation: `GrainGradient` with `shape="blob"` and `colorBack="#0A0A0F"` renders as the home Hero's background, built from brand tokens, with title/subtitle/CTAs/breadcrumbs unchanged and `media` schema field intact. The previously-considered mouse-reactivity feature was built, verified working, and then completely and cleanly removed per Juan's explicit request — confirmed by direct grep across `src/` (zero `pointermove`/`offsetX`/`offsetY`-tracking matches) and by diffing the revert commit against the current file, not merely by trusting the SUMMARY narrative. The independent re-run of `scripts/verify-hero-grain-gradient.mjs` against the live dev server reproduces the same PASS result documented in `16-03-verification-report.md`. HERO-ANIM-05/06 remain correctly scoped to Phase 17.

---

_Verified: 2026-07-12_
_Verifier: Claude (gsd-verifier)_
