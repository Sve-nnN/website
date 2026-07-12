---
phase: 16-hero-grainy-gradient-implementation
reviewed: 2026-07-12T00:00:00Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - src/components/HeroGrainGradient.tsx
  - src/blocks/Hero/Component.tsx
  - package.json
  - scripts/verify-hero-grain-gradient.mjs
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-07-12
**Depth:** deep (traced `@paper-design/shaders-react`/`@paper-design/shaders` runtime source in `node_modules` to verify the claimed error-boundary fallback behavior, not just the call site)
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the final, post-retune state of Phase 16 (`shape="blob"`, `colorBack="#0A0A0F"`, mouse-reactivity fully reverted). The revert itself is clean: `git diff 8e9c1c1 b7b7eaa` and a full `grep -rn "pointermove|onPointerMove|mousemove|offsetX|offsetY" src/` confirm zero leftover dead code, orphaned state, or commented-out remnants from the mouse-reactivity feature — the `ripple`-only `offsetX`/`offsetY` static constants were deleted outright in the `blob` commit, not left unused. No hardcoded secrets, no dangerous functions, no injection surface (this is a pure client-side decorative shader). `package.json`'s new dependency is minimal and verified clean (`npm ls @paper-design/shaders-react --all` → only `@paper-design/shaders`, no `three`/`@react-three` chain).

Two real issues found by tracing behavior across the module boundary into the shader library's own source, both Warnings (not Blockers — neither crashes the app or causes a visible defect today, but both represent broken/misleading safety or correctness mechanisms that should be fixed or the comments corrected): the `ShaderErrorBoundary` cannot actually catch the one failure mode it was built for, and the `isDark` state reintroduces the exact hydration-mismatch bug that was already found and fixed for `reducedMotion` in the same file. Three Info-level items round out the findings, including the explicitly-requested product judgment call on the near-black `blob` effect's perceptibility.

## Warnings

### WR-01: `ShaderErrorBoundary` cannot catch the WebGL-unsupported failure it was built for

**File:** `src/components/HeroGrainGradient.tsx:61-84` (boundary), `:118` (usage)
**Issue:** The class comment (`T-16-01`) and the UI-SPEC's Copywriting Contract both claim: "if `GrainGradient` fails to mount (e.g. WebGL unavailable), the Client Component must fall back to the current solid `bg-secondary` treatment silently" via this error boundary. Tracing the actual failure path in `node_modules/@paper-design/shaders/dist/shader-mount.js:64-66` shows `canvas.getContext('webgl2', ...)` failing throws `new Error("Paper Shaders: WebGL is not supported in this browser")` **synchronously inside the `ShaderMountVanilla` constructor**. But that constructor is invoked from `node_modules/@paper-design/shaders-react/dist/shader-mount.js:89-107`, inside an `async function initShader()` that is called *without* `await` or `.catch()` from a `useEffect`, and the constructor call happens *after* an `await processUniforms(...)` inside that async function. A throw after an `await` inside an un-awaited async call becomes an **unhandled promise rejection**, not a synchronous render/commit-phase error. React error boundaries explicitly do not catch errors in asynchronous code (per React's own documented boundary limitations) — `getDerivedStateFromError`/`componentDidCatch` will never fire for this case. In practice the page doesn't crash (the `<section>` in `Component.tsx:34-37` keeps `bg-secondary` as its own base class regardless of the shader), but: (1) the specific fallback UI this boundary renders (`<div className="bg-secondary" aria-hidden />`, line 80) is effectively unreachable dead code for the one scenario it documents itself as protecting against, and (2) the failure surfaces as an uncaught "Uncaught (in promise) Error: Paper Shaders: WebGL is not supported in this browser" in the browser console instead of the intentional, filtered `console.error` at line 75 — contradicting the `T-16-02` comment's claim that only the caught error object is ever logged.
**Fix:** Either (a) accept that the outer section's `bg-secondary` is the real fallback and correct the comments/UI-SPEC language to stop claiming the boundary handles this case, or (b) make the failure actually catchable: wrap the constructor call with a real try/catch inside a small wrapper around `GrainGradient` that sets its own error state on the rejected promise (e.g. detect WebGL support with `document.createElement('canvas').getContext('webgl2')` before mounting `GrainGradient` at all, and render the `bg-secondary` fallback div directly without relying on a React error boundary):
```tsx
// Cheap synchronous feature-detect avoids depending on an error boundary
// that cannot observe this library's async failure path.
const supportsWebGL2 = useMemo(() => {
  if (typeof document === 'undefined') return true // SSR: assume yes, corrected on client
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}, [])
```

### WR-02: `isDark` reintroduces the hydration-mismatch bug already fixed for `reducedMotion` in the same file

**File:** `src/components/HeroGrainGradient.tsx:94-97`
**Issue:** `const [isDark] = useState(() => { if (typeof document === 'undefined') return false; return document.documentElement.classList.contains('dark') })` reads `document` inside a `useState` lazy initializer — this is the exact anti-pattern the `3f15c57` commit (documented in `16-02-SUMMARY.md`) found and fixed for `reducedMotion`: the lazy initializer runs during the client's hydration render pass, so if `document.documentElement` ever has the `dark` class at hydration time, the client's first render computes `isDark=true` while the server always rendered `isDark=false` (`typeof document === 'undefined'` guard), producing an unpatched attribute/content hydration mismatch identical in kind to the one already diagnosed and fixed a few lines above for `reducedMotion` (see comment at lines 87-92 explaining exactly this risk). The `16-02-SUMMARY.md` documents this as an accepted, intentional gap ("dark mode confirmed unreachable on this site today — no toggle, no OS-preference wiring"), and a repo-wide grep confirms no `next-themes`/`ThemeProvider`/`.dark` class-toggling code exists anywhere in `src/` today, so it is not currently reachable. But the fix pattern for the sibling bug is sitting three lines away in the same file, unapplied here — if/when dark mode is wired up later, this will silently reproduce the same class of bug that was just fixed, and nothing here would catch that regression (no lint rule, no test).
**Fix:** Apply the same pattern already used for `reducedMotion`: initialize `isDark` to `false` and read it inside `useEffect`, e.g.
```tsx
const [isDark, setIsDark] = useState(false)
useEffect(() => {
  setIsDark(document.documentElement.classList.contains('dark'))
}, [])
```
Or, if the "genuinely unreachable today" reasoning is accepted long-term, leave a `// TODO(dark-mode): apply the reducedMotion hydration fix pattern here before wiring next-themes` marker so a future implementer doesn't have to rediscover the bug from scratch.

## Info

### IN-01: `verify-hero-grain-gradient.mjs` has stale comments from the pre-retune `wave` implementation

**File:** `scripts/verify-hero-grain-gradient.mjs:35-40`
**Issue:** The `COLOR_WARN_THRESHOLD` comment block still says "the shader's dominant/mid stops are all `#12141C`/`#23283A`/`#3A4159`-family dark navy" and "animated noise + the `wave` shape's undulation make exact assertions unreliable." Both are stale: the shape is now `blob` (not `wave`), and `#12141C` is no longer one of the component's colors (`LIGHT_COLORS`/`DARK_COLORS`/`NEAR_BLACK` in the current `HeroGrainGradient.tsx` never include `#12141C`). `16-03-SUMMARY.md`'s addendum confirms the script itself was intentionally left unchanged across the retune ("same script, same checks... without any script changes needed") — reasonable for the assertions, but the explanatory comments were not updated to match, which will mislead the next person who reads this script to understand why the threshold exists.
**Fix:** Update the comment to reference the current shape (`blob`) and drop the now-incorrect `#12141C` reference, or generalize the wording to avoid needing updates on every shape retune (e.g., "the shader's stops are all in a dark-navy/near-black family regardless of shape/preset in use").

### IN-02: Screenshot output directory name is copy-pasted and misleading

**File:** `scripts/verify-hero-grain-gradient.mjs:31`
**Issue:** `const SCREENSHOT_DIR = path.join(__dirname, '.mobile-verify-screenshots')` — this script is for the Hero grain gradient, not mobile-viewport verification. `16-03-SUMMARY.md` confirms the script was "modeled on `scripts/verify-mobile-viewport.mjs`'s structure," and this constant name appears to have been copied along with the pattern without renaming. It still works (any directory name would), but it's confusing for anyone browsing the screenshots folder expecting hero-shader output and finding a `.mobile-verify-screenshots` directory, and it risks colliding with actual mobile-viewport-script output if both scripts are ever run against the same working directory naming convention.
**Fix:** Rename to something like `.hero-grain-gradient-screenshots`.

### IN-03: Product judgment call — near-black `blob` may be visually indistinguishable from a static solid background

**File:** `src/components/HeroGrainGradient.tsx:33-51` (flagging only, not a defect to fix)
**Issue:** This is explicitly a product/design judgment call, not a bug — flagging per the review request, not asking for a code change. The component's own in-code comment states outright: "`blob`'s orbiting hotspots essentially never cross into full color visibility, leaving a near-black textured surface with only a faint living shimmer." The independent verification evidence backs this up quantitatively: `16-VERIFICATION.md` measured average RGB of `R=24.9/G=23.6/B=28.0` (es) and `R=26.3/G=24.7/B=28.9` (en) against a `colorBack` of `#0A0A0F` (≈ R=10/G=10/B=15) — i.e., the *average* rendered pixel is barely lighter than the flat background color itself, consistent with a shader whose ember/navy gradient stops rarely become visible at all. The verification methodology (canvas non-zero bounding box + coarse average-RGB-under-threshold) is structurally incapable of distinguishing "a subtle, working shader" from "a shader that never meaningfully departs from its own `colorBack`" — both produce the same pass result. Worth Juan's own eyes-on judgment: is the WebGL canvas (continuous `requestAnimationFrame` draw loop, GPU-backed, ~5KB JS + shader compile) earning its cost for an effect that, per the component's own documentation, is close to imperceptible to a typical visitor — versus, for example, a static/no-JS CSS gradient achieving the same "casi negro con un poco de textura" look at zero runtime cost. Not blocking this review since Juan already reviewed real screenshots and explicitly chose `blob` over the bolder `ripple` alternative (`16-CONTEXT.md`, `16-VERIFICATION.md` truth #1) — this is a re-flag for confirmation now that the numbers are in front of a reviewer, not a claim that the decision was uninformed.
**Fix:** N/A (judgment call). If desired: A/B-style comparison of `blob` at current values vs. a plain static `bg-[#0A0A0F]` div side by side would settle whether the shader is contributing anything perceptible in normal (non-screenshot-diffed) viewing conditions.

---

_Reviewed: 2026-07-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
