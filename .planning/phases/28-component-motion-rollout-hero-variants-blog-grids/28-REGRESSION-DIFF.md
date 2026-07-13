# Phase 28 Regression Gate: FAIL (see below)

Diff of the post-change site (Plans 28-02/28-03) against the Plan 28-01 baseline, across all 6 representative routes. Same measurement scripts as 28-01, re-run verbatim, plus a new reduced-motion headless pass (`scripts/verify-reduced-motion-phase28.mjs`).

## Task 1: Reduced-Motion Consistency + H1 / JSON-LD Integrity

Source: `28-reduced-motion-check.json` (new, this plan) and `28-post-content.json` (post-change, this plan) vs `28-baseline-content.json` (pre-change, 28-01). Reduced-motion check via `scripts/verify-reduced-motion-phase28.mjs --base-url http://localhost:3000` against the running dev server. H1/BreadcrumbList diff via inline `node -e` (Phase 25's 25-04 pattern).

### Reduced-motion consistency (prefers-reduced-motion: reduce emulation)

| Route | Hydration console/page errors | ScrollReveal elements found | ScrollReveal opacity check |
|---|---|---|---|
| /en | PASS (0 hydration errors) | 8 | PASS (all 8 at opacity:1) |
| /es | PASS (0 hydration errors) | 8 | PASS (all 8 at opacity:1) |
| /en/blog | PASS (0 hydration errors) | 15 | PASS (all 15 at opacity:1) |
| /servicios | PASS (0 hydration errors) | 0 | N/A (no ScrollReveal on this route — Hero-only) |
| /en/services | PASS (0 hydration errors) | 0 | N/A (no ScrollReveal on this route — Hero-only) |
| /en/seo-tecnico-lima | PASS (0 hydration errors) | 4 | PASS (all 4 at opacity:1) |

**Script result:** `RESULT: PASS (all hard assertions OK)` — exit code 0, 6/6 routes, zero failures. Every `[data-testid="scroll-reveal"]` element (35 total across the 3 routes that have any) was scrolled into view and settled at computed `opacity:1` under reduced-motion emulation; zero hydration-mismatch console or page errors were observed on any route.

### H1 / BreadcrumbList integrity

| URL | H1 count/text | BreadcrumbList itemListElement |
|---|---|---|
| /en | PASS (1, byte-identical: "Juan Carlos Angulo: Software Engineer &amp; SEO Expert") | N/A (no BreadcrumbList on this route, matches baseline) |
| /es | PASS (1, byte-identical: "Juan Carlos Angulo: Ingeniero de Software y Experto SEO") | N/A (no BreadcrumbList on this route, matches baseline) |
| /en/blog | PASS (1, byte-identical: "Blog") | N/A (no BreadcrumbList on this route, matches baseline) |
| /servicios | PASS (1, byte-identical: "Servicios") | PASS (deep-equal) |
| /en/services | PASS (1, byte-identical: "Services") | PASS (deep-equal) |
| /en/seo-tecnico-lima | PASS (1, byte-identical: "Technical SEO in Lima") | N/A (no BreadcrumbList on this route, matches baseline) |

**Programmatic diff result:** `PASS: H1 text unchanged on all routes present in baseline` (exact script output from `28-04-PLAN.md`'s Task 1 verify block) — 6/6 routes, zero H1 regressions. Full BreadcrumbList `itemListElement` deep-equality also confirmed for both routes that carry a BreadcrumbList (`/servicios`, `/en/services`).

**Task 1 verdict: PASS on all axes (6/6 routes).** Hero variant CSS differentiation (28-02) and blog-grid/PostCard motion (28-03) introduced zero hydration-mismatch errors, zero stuck-at-opacity:0 ScrollReveal elements under reduced-motion emulation, and zero H1/BreadcrumbList drift from the 28-01 baseline.

## Task 2: Lighthouse Mobile (production build, port 3034/3035)

Source: `lh-phase28-baseline.json` (pre-change, 28-01) vs `lh-phase28-post.json` (post-change, this plan, production build port 3034 via `npx next build` -> `PORT=3034 npx next start`, never `npm run build` per project CLAUDE.md). Same script (`scripts/lighthouse-mobile.mjs`), same production-build/kill-PID pattern as 28-01 Task 2 / Phase 25 precedent. Background servers confirmed killed after capture (`lsof -i :3034`, `lsof -i :3035`, `ps aux | grep next` all clear, no orphan process).

**Environment note (process hygiene finding, not a code issue):** the first Lighthouse attempts on port 3034 all failed with `NO_FCP` ("the page did not paint any content... keep the browser window in the foreground"). Root cause: the Mac's display had gone to sleep (`system_profiler SPDisplaysDataType` showed `Display Asleep: Yes`), which starves headless Chrome-for-Testing's compositor even with `--headless=new --no-sandbox`. Fixed by running `caffeinate -u` to wake/hold the display for the duration of each Lighthouse batch — not a Phase 28 regression, a pre-existing machine-state gotcha in this measurement tooling worth noting for future runs.

Threshold per `28-04-PLAN.md`: flag if `performance` drops more than 5 points, or any CWV metric (LCP/CLS/TBT) crosses into a worse Lighthouse lab band than its baseline value (LCP good <=2500ms / needs-improvement <=4000ms / poor above; CLS good <=0.1 / needs-improvement <=0.25 / poor above; TBT good <=200ms / needs-improvement <=600ms / poor above).

| Route | Perf baseline -> post (delta) | LCP baseline -> post (band) | CLS baseline -> post (band) | TBT baseline -> post (band) | Verdict |
|---|---|---|---|---|---|
| /en | 64 -> 84 (+20) | 3810ms -> 4097ms (needs-improvement -> **poor**) | 0 -> 0 (good, no change) | 1086ms -> 161ms (poor -> good) | **FAIL (LCP band crossing)** |
| /es | 72 -> 84 (+12) | 4097ms -> 4261ms (poor, no change) | 0 -> 0 (good, no change) | 566ms -> 155ms (needs-improvement -> good) | PASS |
| /en/blog | 82 -> 73 (**-9**) | 3799ms -> 4943ms (needs-improvement -> **poor**) | 0 -> 0 (good, no change) | 34ms -> 15ms (good, no change) | **FAIL (perf drop > 5pt threshold + LCP band crossing)** |
| /servicios | 86 -> 89 (+3) | 3668ms -> 3830ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 234ms -> 53ms (needs-improvement -> good) | PASS |
| /en/services | 89 -> 89 (0) | 3623ms -> 3783ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 115ms -> 37ms (good, no change) | PASS |
| /en/seo-tecnico-lima | 90 -> 89 (-1) | 3627ms -> 3777ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 43ms -> 59ms (good, no change) | PASS |

**Automated verify script result:** `1 Lighthouse regressions found` — `/en/blog: performance dropped 9 points` (exact output from `28-04-PLAN.md`'s Task 2 verify block, script exits non-zero). The verify script only checks the `>5pt Performance drop` threshold; the LCP band-crossing check on `/en` (which does NOT trip that script, since `/en`'s performance score *improved* +20) was caught by the separate per-route band-comparison pass documented above, per this plan's full must-have wording ("no CWV metric crosses into a worse lab band").

**Reproducibility check (not routing around the failures, confirming they are real — same discipline as Phase 25's 25-04):** re-ran a fresh, clean production build (port 3035, zero competing Node/Chrome processes verified via `ps aux` before starting) with 3 isolated re-runs each for the two flagged routes, plus 2 re-runs of an already-passing control route (`/en/services`) to establish this environment's baseline noise floor:

| Route | Run 1 | Run 2 | Run 3 | Spread |
|---|---|---|---|---|
| /en/blog (flagged) — performance | 75 | 76 | 75 | 1 pt |
| /en/blog (flagged) — LCP | 4508ms | 4424ms | 4424ms | 84ms, all in **poor** band |
| /en (flagged) — performance | 84 | 85 | 85 | 1 pt |
| /en (flagged) — LCP | 3938ms | 4089ms | 4090ms | 152ms, straddling the 4000ms boundary (2/3 runs poor, 1/3 needs-improvement) |
| /en/services (control) — performance | 89 | 89 | — | 0 pt |
| /en/services (control) — LCP | 3780ms | 3791ms | — | 11ms |

**`/en/blog` verdict: confirmed real regression, not noise.** Performance is tightly clustered at 75-76 across 4 total runs (official + 3 repro), consistently 6-9 points below the 82 baseline. LCP is tightly clustered at 4424-4943ms across all 4 runs, consistently in the **poor** band versus baseline's **needs-improvement** (3799ms). The control route's variance (0pt / 11ms) confirms this environment is not generically noisy — a 6-9pt, ~600-1100ms LCP delta this consistent on one specific route is a genuine, root-caused regression (see below), not lab-benchmark jitter.

**`/en` verdict: borderline, same root cause, lower confidence but still a real (small) LCP increase.** Performance improved dramatically (+20pts, driven by TBT dropping from 1086ms to ~130-220ms — likely an unrelated improvement from Motion's smaller runtime footprint vs. whatever synchronous work TBT was measuring at 28-01 baseline time). But LCP itself increased from 3810ms baseline to a consistent 3938-4097ms range (4 runs, avg ~4054ms) — a genuine ~150-290ms increase, not the ~11ms noise floor the control route showed. Because the baseline (3810ms) was already only 190ms below the 4000ms poor threshold, this small real increase is enough to cross the band in 3 of 4 runs. Flagged as FAIL per the plan's strict band-crossing threshold, but noted as the less severe of the two findings — the underlying performance category score improved substantially on this route despite the LCP micro-regression.

**Root cause (both findings): `ScrollReveal`'s SSR-rendered `opacity:0` initial state delays LCP on any route where reveal-wrapped content contributes to the largest paint.** Direct evidence: `curl http://localhost:3035/en/blog | grep scroll-reveal` shows every `[data-testid="scroll-reveal"]` wrapper server-rendered with `style="opacity:0;transform:translateY(16px)"` (from `src/components/ScrollReveal.tsx`'s `initial={{ opacity: 0, y: 16 }}`, added in 28-03). This inline style is present in the raw SSR HTML *before* any client JS runs, meaning Lighthouse's Largest Contentful Paint measurement — which only counts a paint once the element is actually visible — cannot record these elements as painted until Motion's JS hydrates, mounts the `whileInView`/`IntersectionObserver` machinery, and the reveal transition completes. `/en/blog` has 15 ScrollReveal-wrapped post cards from `ArchiveBlock` (28-03), several of which sit above or near the fold and are very likely the LCP candidate (a post card's title text or thumbnail image) — hence the large, consistent ~600-1100ms LCP delay. `/en` has 8 ScrollReveal-wrapped elements too (case-study/testimonial cards further down the page), producing the smaller, boundary-straddling effect there since its LCP element (the Hero title, per Task 1's `verify-hero-grain-gradient.mjs` precedent) is likely not itself ScrollReveal-wrapped, but overall page paint timing/ordering still shifts.

**Not fixed in this plan — flagged for a required follow-up.** Per this plan's own scope (measurement/diffing, not component authorship) and Juan's explicit instruction not to silently paper over a FAIL, this regression is being surfaced here rather than patched inline. The fix belongs in `src/components/ScrollReveal.tsx` (28-03's own file) — the likely correct approach is to not SSR the `opacity:0` initial state for content that Motion's own `whileInView` would immediately reveal on mount anyway (e.g. gate the hidden initial style behind a client-only flag, or use Motion's `viewport={{ once: true }}` in a way that doesn't suppress the SSR paint), verified with a before/after LCP re-measurement on `/en/blog` and `/en` specifically.

## Phase 28 Regression Gate: FAIL (see below)

**4 of 6 routes PASS cleanly** on reduced-motion consistency, H1/JSON-LD integrity, and Lighthouse performance/CWV thresholds (`/es`, `/servicios`, `/en/services`, `/en/seo-tecnico-lima`). **2 of 6 routes (`/en`, `/en/blog`) FAIL** the Lighthouse LCP band-crossing threshold — `/en/blog` additionally fails the >5pt Performance-drop threshold. Both failures were reproduced across 3 isolated clean-environment re-runs each (not a one-off noisy sample) and root-caused to a specific, identifiable code change: `ScrollReveal`'s (28-03) SSR-rendered `opacity:0` initial state delaying Largest Contentful Paint on routes where reveal-wrapped content is at or near the fold.

**This is not being silently glossed over.** Per this plan's threat-model mitigation (T-28-07) and Juan's explicit instruction, this FAIL is surfaced as the closing verdict of Phase 28's regression gate rather than marked done. MOTION-04 (no CWV regression) is not satisfied as written for `/en` and `/en/blog` — the specific failing metric is LCP (both routes) plus the aggregate Performance category score (`/en/blog` only). MOTION-03 (consistent `useReducedMotion()` usage / reduced-motion correctness) is fully satisfied — Task 1's reduced-motion pass is a clean 6/6 PASS, and the H1/JSON-LD integrity check is also a clean 6/6 PASS. The defect is isolated to LCP timing caused by the SSR-hidden `ScrollReveal` initial state, not to reduced-motion handling, hydration correctness, or content/SEO integrity.

**Required next step:** a follow-up plan (or gap-closure pass, same pattern as Phase 25's 25-04 -> Gap-Closure) should fix `src/components/ScrollReveal.tsx`'s SSR-visible-content LCP delay and re-run this same measurement suite (`scripts/verify-reduced-motion-phase28.mjs` + `scripts/capture-service-page-snapshot.mjs` + `scripts/lighthouse-mobile.mjs`) against `/en` and `/en/blog` at minimum to confirm the fix closes both gaps without breaking the now-passing reduced-motion / H1 / JSON-LD checks.

---

## Gap-Closure Attempt (2026-07-13)

Per the required next step above, this gap-closure pass investigated the actual Lighthouse-identified LCP element on `/en` and `/en/blog` (rather than assuming), fixed the confirmed root causes in `src/components/ScrollReveal.tsx` and `src/components/PostCard.tsx`, re-ran the full gate, and is reporting the result honestly — **the gate is still FAIL**, though for a partially different, now more precisely diagnosed reason than 28-04's original writeup.

### Root-cause investigation (direct LCP-element inspection)

28-04 assumed the LCP-relevant content was ScrollReveal-wrapped based on indirect page-timing evidence. This gap-closure ran Lighthouse's `lcp-breakdown-insight` / `lcp-discovery-insight` audits directly (Lighthouse 13's replacement for the removed `largest-contentful-paint-element` audit) against a clean production build to identify the actual LCP DOM node on each route:

- **`/en/blog`:** LCP element confirmed to be the **first `PostCard`'s thumbnail `<img>`** (`div.rounded-xl > div.relative > div.h-full > img.object-cover`, "Tablas hash: Estructuras clave..." post). This image was SSR-rendered with **`loading="lazy"`** — `next/image` was never passed a `priority` prop in `PostCard.tsx`, so even the first, above-the-fold grid item was explicitly opted into lazy-loading. This is a genuine, separate LCP-correctness bug on top of 28-04's original ScrollReveal finding, both compounding on the same element (it's also ScrollReveal-wrapped).
- **`/en`:** LCP element confirmed to be the **`AboutSection` intro paragraph** (`div.grid > div.md:col-span-12 > div.mt-4 > p.text-body`) — this text block is **not** ScrollReveal-wrapped at all (only `ArchiveBlock`/`FeaturedPostsBlock`/`FAQ` use `ScrollReveal`). So 28-04's root-cause theory (ScrollReveal SSR-opacity) does not directly apply to `/en`'s specific LCP node; the `/en` LCP increase is better explained by overall page paint-ordering/hydration cost shifting slightly with more Motion content on the page, not a single suppressed element.

### Fix applied (commit `7be700c`)

1. **`ScrollReveal.tsx`:** added a `priority` prop. Tested (and rejected) `initial={false}` first — direct SSR HTML diffing proved Motion's `whileInView` still emits a hidden `opacity:0` style by default even with `initial={false}`, because it cannot know server-side whether the element is already in the viewport. The working fix instead **skips the Motion wrapper entirely** when `priority` is set, rendering plain always-visible markup with the same `data-testid="scroll-reveal"` (so the reduced-motion assertion script — which counts these — still finds the same total element counts as 28-04's baseline: 8/8/15/0/0/4 across the 6 routes).
2. **`PostCard.tsx`:** added a `priority` prop threaded to `next/image`'s `priority`.
3. **`ArchiveBlock.tsx` / `FeaturedPostsBlock.tsx`:** mark the first grid row (`index < 3`, matching `lg:grid-cols-3` — above the fold on every breakpoint this grid renders at) as `priority` on both `ScrollReveal` and `PostCard`.

**Verified via direct SSR HTML diff (clean production build):** the first 6 `[data-testid="scroll-reveal"]` elements on `/en/blog` (3 from `FeaturedPostsBlock` + 3 from `ArchiveBlock`) now render with **no `style` attribute at all** (previously `style="opacity:0;transform:translateY(16px)"` on every instance), the first-row `PostCard` images now render **without `loading="lazy"`** and are correctly emitted as `<link rel="preload" as="image">` in `<head>` (previously `loading="lazy"` on every image including the first). H1 text and reduced-motion consistency (6/6 routes, same element counts) confirmed unchanged after the fix.

### Re-run result: LCP gate is STILL FAIL on `/en` and `/en/blog`

Full 6-route Lighthouse mobile re-run (`lh-phase28-gapclosure.json`, clean production build, port 3038, `caffeinate -u` held throughout):

| Route | Baseline (28-01) LCP | 28-04 (post-28-03, pre-fix) LCP | Gap-closure (post-fix) LCP | Verdict |
|---|---|---|---|---|
| /en | 3810ms (needs-improvement) | 3938-4097ms (poor, 3/4 runs) | 4087, 4232, 4235, 4235ms — **poor, 4/4 runs** | **STILL FAIL** |
| /es | 4097ms (poor, unchanged from baseline) | 4261ms (poor, no change) | 4377ms (poor, no change vs baseline — was already poor) | PASS (no new regression) |
| /en/blog | 3799ms (needs-improvement) | 4424-4943ms (poor, 4/4 runs) | 4437, 4444, 4479, 4506ms — **poor, 4/4 runs** | **STILL FAIL** |
| /servicios | 3668ms | 3830ms (needs-improvement, no change) | 3785ms (needs-improvement, no change) | PASS |
| /en/services | 3623ms | 3783ms (needs-improvement, no change) | 3788ms (needs-improvement, no change) | PASS |
| /en/seo-tecnico-lima | 3627ms | 3777ms (needs-improvement, no change) | 3832ms (needs-improvement, no change) | PASS |

The fix measurably eliminated the specific defects it targeted (SSR-hidden opacity, lazy-loaded LCP image) — confirmed via direct SSR HTML diffing, not inferred — but total LCP on `/en` and `/en/blog` did **not** drop below the 4000ms `poor` threshold. Investigating why:

**New finding: `/en/blog`'s server response time (TTFB) itself is the dominant cost, and it is NOT something this plan's scope (Motion/ScrollReveal) touches.** Direct `curl` timing against the same production server, repeated after warm-up to rule out cold-start noise:

| Route | TTFB (curl `time_total`, warm, 3-6 reps) |
|---|---|
| /en/blog | consistently 2.1-2.4s (one-off spikes to 4-6s seen on the very first hit after a server restart) |
| /en | ~0.27-0.29s |
| /en/services | ~0.26-0.28s |
| /en/case-studies (also uses `ArchiveBlock`) | ~0.25-0.27s after warm-up |

`/en/blog` is the only route with multi-second TTFB even under repeated warm requests — every other `ArchiveBlock`-using route (`/en/case-studies`) responds in ~250ms. The build output marks `/[locale]/blog` as `●` (SSG), but its measured runtime behavior does not match static serving; the page component consumes `searchParams` (for the category-tab filter), which is a strong candidate for opting the route out of static caching and forcing per-request re-execution of `ArchiveBlock`'s category-filter `payload.find` query, the posts `payload.find`, and `FeaturedPostsBlock`'s `payload.findGlobal` — three sequential DB round-trips on every request, unique to this route's block composition. Lighthouse's mobile-preset network/CPU throttling amplifies this multi-second TTFB further in the simulated-throttled LCP number.

**This is a pre-existing, out-of-scope issue — not caused by Phase 28's Motion work.** It was already present at the 28-01 baseline measurement time (baseline LCP of 3799ms on `/en/blog` already reflects this same TTFB cost; the data-fetching code in `ArchiveBlock`/`FeaturedPostsBlock` was not touched by 28-02 or 28-03). It only became gate-failing once 28-03's ScrollReveal/lazy-image overhead pushed the already-borderline baseline (3799ms, just 201ms under the 4000ms threshold) over the line — and now that those specific overheads are fixed, the pre-existing TTFB latency is what's keeping both routes just over 4000ms.

**Not fixed in this gap-closure pass.** Per this task's explicit scope (fix the Motion/ScrollReveal-caused LCP regression, keep the fix minimal, don't introduce new patterns) and Rule 4 (architectural changes require a decision, not an auto-fix), root-causing and fixing `/en/blog`'s TTFB — likely a missing cache/revalidation strategy for the category-filter query, or removing the `searchParams` dependency from the static path — is out of scope here and is flagged as a new, distinct required follow-up.

### Gap-Closure Verdict: STILL FAIL (2/6 routes: `/en`, `/en/blog`) — root cause partially corrected, new blocking factor identified

- **Confirmed fixed (verified via SSR HTML diff, not assumed):** ScrollReveal's SSR-`opacity:0` hiding of above-the-fold grid content, and the missing `priority` on the first-row `PostCard` LCP image on `/en/blog`.
- **Still failing:** LCP on `/en` and `/en/blog` remains in the `poor` band (>4000ms), now dominated by a distinct, pre-existing, out-of-scope issue — `/en/blog`'s per-request TTFB (~2.1-2.4s warm, unique to this route among `ArchiveBlock` consumers, most likely caused by `searchParams` forcing dynamic rendering + 3 sequential DB queries) — rather than the client-side render-suppression this plan's scope covers.
- **Reduced-motion consistency (MOTION-03) and H1/JSON-LD integrity:** still clean 6/6 PASS after the fix, confirming no regression was introduced by this gap-closure's changes.
- **Required next step:** a new, separately-scoped investigation into `/en/blog`'s TTFB — specifically whether `searchParams` usage in `src/app/(frontend)/[locale]/blog/page.tsx` is forcing dynamic rendering of an otherwise-static page, and whether `ArchiveBlock`'s category-filter query and `FeaturedPostsBlock`'s global fetch can be cached/parallelized/deferred. This is a data-fetching/caching architecture question, not a Motion/animation one, and needs its own scoped plan.
