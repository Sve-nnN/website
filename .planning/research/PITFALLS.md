# Pitfalls Research

**Domain:** Retrofitting micro-animations onto an existing Next.js/Payload site + bulk-rewriting bilingual CMS content against live production Postgres
**Researched:** 2026-07-13
**Confidence:** HIGH (grounded directly in this project's own incident history — v1.3/v1.4/v1.5, Phases 16/19/21/25 — not generic advice)

## Critical Pitfalls

### Pitfall 1: Non-localized field clobbered by a per-locale bulk write (3rd+ occurrence)

**What goes wrong:**
A bulk humanization sweep writes new copy per locale (ES pass, then EN pass, or vice versa) to a Payload doc. Any field on that doc missing `localized: true` is NOT locale-scoped in Postgres — it's one shared row. The last locale's `update()` call wins and silently overwrites the other locale's value for that field, even though the *localized* sibling fields (title, richText, label) look correct per locale.

**Why it happens:**
This project has hit this exact bug **three separate times** across two milestones: `CallToAction.richText` (Phase 19, v1.4 — caused the DROP-COLUMN data-loss incident below), `Header.navItems.url` and `Content` block `link.url` (found out-of-phase during v1.5 Phase 25), and `TestimonialsCarousel.title` (Phase 25). Each time it was a *different* field on a *different* block/global. There is no single systemic guard yet — each was fixed ad hoc after being found live. A full-database humanization sweep touches orders of magnitude more fields than any single prior seed script, so the probability of hitting an as-yet-undiscovered non-localized field is high, not low.

**How to avoid:**
- Before writing the bulk-rewrite script, grep every collection/global/block config (`src/collections`, `src/globals`, `src/blocks/**/config.ts`) for every text/richText field the humanizer will touch and confirm `localized: true` is present. Do not assume — the last 3 bugs were all fields that "looked like they should obviously be localized."
- Build a one-time audit script that reads each doc's raw API response in both locales side-by-side and flags any text field where the ES and EN values are byte-identical outside expected shared values (URLs, slugs, icon names) — a same-value signal on a field that should differ post-humanization is the fastest live detector.
- Any field found non-localized that needs distinct per-locale copy is a schema change (`localized: true` reshape), which falls under this project's hard Database Safety rule — requires Juan's named approval and a backfill-before-drop migration (see Pitfall 2).
- Write locale updates through a helper that reads the full current doc first, merges only the intended field, and writes back — never a partial/naive `update()` that could blow away a sibling non-localized field's last-written value from the *other* locale's pass.

**Warning signs:**
A post-sweep diff shows ES and EN identical for a field that was supposed to be humanized differently, or a field silently reverted after the "other locale" pass ran later.

**Phase to address:**
Content-humanization phase — as a mandatory pre-flight audit task before any bulk write starts, not a bugfix task discovered after.

---

### Pitfall 2: Schema/column-level reshape drops data before backfilling (repeat of the Phase 19 incident)

**What goes wrong:**
Fixing a field found non-localized (Pitfall 1) requires a real schema migration: adding `localized: true` to a Postgres-backed text/richText column reshapes storage (single shared column → per-locale rows/columns depending on Payload's Drizzle strategy). If the generated migration's `DROP COLUMN` runs before a backfill `INSERT...SELECT` copies existing values into both locale slots, all existing content in that field is destroyed the instant the migration applies — with no way to recover except point-in-time restore.

**Why it happens:**
This already happened for real: Phase 19's first migration attempt for `CallToAction.richText` dropped the old column before backfilling, wiping the Home page's CTA copy in production (no staging DB exists — `DATABASE_URI` is the real Neon instance). Recovered only via Neon point-in-time restore. The corrected pattern (backfill `INSERT...SELECT...unnest(ARRAY['es','en'])` before `DROP COLUMN`) is documented in the fixed migration file, but a bulk-humanization milestone is exactly the kind of high-volume, time-pressured work where a rushed migration could repeat the mistake at larger scale (multiple fields reshaped at once instead of one).

**How to avoid:**
- Any migration touching an existing column with data (localizing a field, narrowing a type, renaming/dropping) must be generated with `payload migrate:create`, then hand-read in full before applying — this is already a hard rule in root `CLAUDE.md` and must not be bypassed for schema changes surfaced during this milestone just because most of the milestone's writes are "additive."
- If multiple non-localized fields are found (per Pitfall 1's audit), reshape them in one reviewed migration with an explicit backfill step per column, not N separate rushed migrations under deadline pressure.
- These reshape migrations always require Juan's named, explicit approval before applying — per the (relaxed but still-active) Database Safety rule: additive writes/migrations don't need confirmation, but anything that could lose existing data does.
- Prefer: run the backfill migration and verify row counts / spot-check both locales' values *before* telling the orchestrator the migration is "done" — don't rely on "no errors" as success signal, verify the actual data landed correctly.

**Warning signs:**
A generated migration file contains `DROP COLUMN` above/before any `INSERT`/`UPDATE` statement that references the same column — read migrations top-to-bottom for statement order, not just presence of a backfill statement anywhere in the file.

**Phase to address:**
Content-humanization phase, specifically any task that requires a schema reshape (should be rare — most humanization is content-only, not schema — but must be gated identically to Phase 19's fix if it recurs).

---

### Pitfall 3: Shared non-localized array — id collision when array items are rewritten per locale

**What goes wrong:**
Arrays like `Header.navItems` are non-localized containers where only a nested sub-field (`link.label`) is localized. Writing the array once per locale (ES pass appends/updates items, then EN pass does the same) causes Payload to regenerate array-item ids on each write. If the ES and EN writes don't reuse the *same* ids for the *same* logical item, the second locale's write either orphans the first locale's item or creates a duplicate, and the array ends up showing the wrong locale's item (this exact bug shipped live: Home's nav showed "Servicios" in English because the `en` write collided ids with the `es` write, Phase 21).

**Why it happens:**
Payload full-replaces array/block collections on `update()` by default; if a seed/rewrite script doesn't explicitly preserve existing sub-document ids across locale writes (by reading the doc first and reusing ids, or filtering-then-appending instead of blind-appending), the ids drift and the array's shared (non-localized) values get clobbered by whichever locale wrote last.

**How to avoid:**
- Any bulk-rewrite script touching array/block fields (not just top-level text fields) must read the full existing document first, mutate only the localized sub-fields in place by matching on stable identity (id or a stable key like `href`/`slug`), and write the array back with ids intact — never regenerate/blind-append.
- Reuse the existing `normalizeServiceHref`-style pattern already extracted in this codebase (`src/lib/service-slugs.ts`) as the model: pure helpers with no Payload import, applied at render time as a defense-in-depth layer in case a data-level bug slips through again.
- Add an idempotency self-check to any bulk script: run it twice against the same doc and diff before/after — if the second run isn't a no-op, the id-reuse logic is wrong.

**Warning signs:**
Nav/link arrays or other shared arrays showing the wrong locale's label/url after a sweep, or a doc's array growing in length after repeated runs (a sign of blind-appending instead of matching-and-updating).

**Phase to address:**
Content-humanization phase, for any array/block-shaped field it touches (nav items, FAQ arrays, feature lists, testimonial arrays) — flag this class of field for extra script review before running against production.

---

### Pitfall 4: Partial-failure mid-sweep leaves the DB in a mixed humanized/non-humanized state

**What goes wrong:**
A full-database sweep across many collections (Pages, Posts, CaseStudies, Authors, globals) run as one long script or one long agent session can fail partway through (network hiccup, a validation error on one doc's field, a rate limit, an unhandled exception) after successfully writing N of M documents. Because there's no staging DB and no transactional wrapper across the whole sweep, this leaves production content in an inconsistent state — some pages fully humanized, others still in the old voice, with no clear record of which is which.

**Why it happens:**
Payload's Local API writes are per-document REST/DB operations, not wrapped in one giant transaction across the whole sweep by default. Prior seed scripts in this project were narrow (one page, a handful of fields) so partial failure was low-risk and easy to eyeball; a full-DB sweep is the first time this project attempts bulk writes at a scale where partial failure is likely and hard to detect by inspection alone.

**How to avoid:**
- Make the sweep script idempotent and resumable: track processed doc ids (a simple JSON/CSV log written as it goes, or a `humanizedAt` marker if adding a field is acceptable) so a re-run skips already-done docs instead of re-processing or, worse, double-applying humanization to already-humanized text.
- Process and commit one document (or one small batch) at a time with its own try/catch and logging, rather than batching multiple docs into a single unchecked loop — a failure on doc 40 of 120 should not silently abort the other 80.
- After the sweep, run a completeness audit: enumerate every doc in every touched collection/global and confirm each was actually touched (compare against the processed-id log), not just "the script exited 0."
- Given Juan's relaxed Database Safety rule (no confirmation needed for additive/non-destructive writes), this sweep can run unattended — but "unattended" means the *script* must be the safety net (resumable, logged, idempotent), since there's no human in the loop pausing before each write.

**Warning signs:**
Script exits with an error mid-run; spot-checking a few random docs post-sweep shows some are humanized and others aren't with no pattern; the processed-id log is shorter than the total doc count in a collection.

**Phase to address:**
Content-humanization phase — build the resumable/logged harness as the first task, before writing any actual humanized content, since every subsequent task depends on it being safe to re-run.

---

### Pitfall 5: SEO-critical strings (meta title/description, targetKeyword) get humanized without re-verifying search intent

**What goes wrong:**
`@payloadcms/plugin-seo` adds `meta.title`/`meta.description` fields on Pages/Posts/Authors, and this project also has an editorial `targetKeyword` field (en/es) populated from real keyword research (Phase 14, `KEYWORD-RESEARCH.md`). A blanket humanizer pass over "all copy in the DB" risks touching these fields too (directly, or indirectly if any generator function derives them from body copy) and rewriting them for voice/tone without preserving the exact keyword phrases and character-length constraints that were deliberately chosen for search performance. This is exactly the kind of SEO regression the project's Core Value statement explicitly calls a failure condition ("Si el rendimiento o el SEO fallan, el sitio no cumple su propósito").

**Why it happens:**
A generic "humanize all text content" instruction doesn't inherently know which fields are voice/prose (safe to rewrite freely) versus which are structured SEO assets (title length ~50-60 chars, description ~150-160 chars, must contain the locked target keyword) where humanization must be constrained, not free-form.

**How to avoid:**
- Explicitly scope the humanization sweep to exclude `meta.title`, `meta.description`, `targetKeyword`, slugs, and any JSON-LD-only fields from the "rewrite for voice" pass by default — these are structured SEO surfaces, not prose.
- If Juan wants meta titles/descriptions humanized too, treat that as a separate, narrower task with its own constraint set (keep target keyword present, respect length bounds, verify against `plugin-seo`'s preview) rather than folding it into the same bulk pass as body copy.
- Before running the sweep, snapshot current `meta.title`/`meta.description`/`targetKeyword` values for every doc (a simple export) as a rollback reference independent of Neon PITR, since PITR restores the whole DB (losing any *other* legitimate work done in the same window), not just one field.

**Warning signs:**
Post-sweep diff shows the locked target keyword phrase from `KEYWORD-RESEARCH.md` no longer present verbatim in a page's meta description, or meta title/description length has drifted outside SEO-safe bounds.

**Phase to address:**
Content-humanization phase — define field scope (prose vs. SEO-structured) as an explicit pre-flight decision before the sweep runs, not discovered after.

---

### Pitfall 6: JSON-LD embeds copy fields directly — humanized text can silently break structured data

**What goes wrong:**
This codebase renders JSON-LD via `src/components/JsonLd.tsx` on Home, Author pages, Servicios index/detail, Blog posts, Case Studies — several of which pull copy fields (bio text, richText excerpts, testimonial titles) directly into `Person`/`Article`/`BreadcrumbList`/`FAQPage`-style structured data. A humanizer rewrite could (a) introduce characters that need escaping (quotes, special punctuation) that a naive string interpolation doesn't handle — this project already found and fixed a real `JsonLd.tsx` escaping bug in Phase 22 (comment incorrectly claimed `JSON.stringify` escapes `</script>`, it doesn't escape `<`/`>`/`&`) — or (b) change field length/content in a way that breaks a JSON-LD field's expected shape (e.g., an FAQ answer field expected to be plain text getting rewritten with markdown-ish punctuation the humanizer skill might introduce).

**Why it happens:**
JSON-LD generation code was written once against the original copy's shape/characteristics and not re-tested against arbitrary future rewrites. A bulk content change is effectively a fuzz test against every JsonLd-consuming component at once.

**How to avoid:**
- After the sweep, re-run this project's existing `seo-schema` validation pattern (already used in Phase 22, invoked as a subagent) against all URL types that render JSON-LD — not just the pages the humanizer explicitly targeted, since shared blocks (testimonials, FAQ) feed JSON-LD from multiple page types.
- Spot check that `JsonLd.tsx`'s escaping fix (Phase 22) still holds against any new punctuation/character patterns the humanizer introduces (em/en dashes are explicitly banned by the humanizer skill already, which helps, but quotes/ampersands in rewritten prose are still a risk).
- Treat "JSON-LD still validates" as a hard gate before closing the content-humanization phase, matching the same zero-regression gate pattern already used in Phase 25 (Lighthouse/CWV + H1/JSON-LD baseline-then-recheck).

**Warning signs:**
`seo-schema` validation returns new failures post-sweep that weren't present in the pre-sweep baseline; any JSON-LD field renders visibly broken (unescaped quote breaking the `<script>` block) when viewed via "View Page Source."

**Phase to address:**
Content-humanization phase — as part of its closing regression gate, not a separate follow-up.

---

### Pitfall 7: Client Component boundary leak from adding animation to shared Server Components

**What goes wrong:**
Retrofitting scroll-reveal/hover animations onto shared components (`SiteHeader`, blocks like `FAQ`, `TestimonialsCarousel`, `ClientLogosBlock`, listing Hero variants) that are currently Server Components requires adding `'use client'` at some boundary. Done carelessly, this either (a) forces the *entire* component tree above the animated element to become client-rendered (losing RSC's server-only data-fetching and shipping unnecessary JS), or (b) is applied at too coarse a boundary, pulling Payload Local API calls or other server-only code into a client bundle, which breaks the build or silently increases bundle size far beyond just the animation library.

**Why it happens:**
The path of least resistance when "the whole component needs to animate" is to slap `'use client'` at the top of the file that already does data-fetching, rather than splitting the component into a server-fetching wrapper + a small client-only "animated shell" that receives already-fetched data/children as props. This project's existing pattern (`HeroGrainGradient.tsx`) already demonstrates the correct shape — it's a small, isolated `'use client'` leaf component consumed by a server-rendered Hero block — but that discipline needs to be repeated deliberately for every new animated component in this milestone, not assumed.

**How to avoid:**
- For every component slated for animation in the target list (navbar, Hero variants, FAQ, ClientLogosBlock, TestimonialsCarousel, blog/case-study grids), keep data-fetching in the existing Server Component and push only the visual animation wrapper (scroll-reveal container, hover-state button) into a new, small, leaf `'use client'` component that takes pre-fetched content as children/props — mirror `HeroGrainGradient.tsx`'s shape exactly.
- After each component's animation work, diff the client bundle size (`next build` output route sizes) against the pre-change baseline — a jump disproportionate to "one small animation wrapper" signals a boundary was drawn too high.
- Never add `'use client'` to a file that also calls Payload's Local API (`getPayload`, collection `find`/`findByID`) — that combination is what actually breaks (server-only code can't ship to the client), not just a style smell.

**Warning signs:**
Build errors referencing Node-only modules (`payload`, `pg`, `fs`) inside a client bundle; unexpectedly large new client-side JS chunk for a route that only got a hover effect added; a component that used to stream/render on the server now shows a loading flash it didn't have before.

**Phase to address:**
Animation phase — as an explicit per-component boundary check task, since the target list spans nearly every shared component in the site.

---

### Pitfall 8: Cumulative Layout Shift from animated entrance states

**What goes wrong:**
Scroll-reveal animations commonly start elements at `opacity-0` with a transform offset (`translateY`), then animate to final position on scroll-into-view. If the initial "hidden" state collapses the element's box (e.g., via `display: none` or an animation library that removes it from layout before JS hydrates), or if the animation library's CSS loads after first paint, the element's arrival shifts surrounding content — a direct CLS regression on a site whose Core Value is explicitly "Core Web Vitals en verde."

**Why it happens:**
Animation libraries frequently ship examples that fade+translate elements using inline styles set only after a JS-driven "in view" observer fires, meaning the pre-JS/pre-hydration paint shows either nothing (still reserving space, safe) or the element at full size with the animation class not yet applied (also usually safe) — but a naive implementation that toggles `opacity-0 -translate-y-4` via a client-only class *without* reserving the element's layout box up front, or that applies `transform` in a way that changes computed height, produces a real shift the moment the observer fires and re-triggers layout.

**How to avoid:**
- Use `opacity`/`transform` only for the animated properties (both are compositor-only, don't trigger layout) — never animate `height`, `margin`, or anything that changes box dimensions for entrance reveals.
- Reserve the final layout box from first paint (the element occupies its full final space even while `opacity: 0`) so scroll-into-view triggering never shifts anything else on the page.
- Re-run Lighthouse CLS specifically (not just the aggregate score) on every page in the animation target list before/after, using the same baseline-then-recheck pattern this project already used in Phase 17 (Δ-3 Performance threshold) and Phase 25 (regression gate) — CLS is the metric most likely to regress silently since it's not always visually obvious in a quick manual look.

**Warning signs:**
Lighthouse CLS score increases even when Performance score looks stable; visually, content "jumps" on scroll on a slower device/throttled connection even though it looks fine on a fast dev machine.

**Phase to address:**
Animation phase — bake into the same zero-regression gate this milestone already commits to ("Baseline de regresión (Lighthouse/CWV + H1/JSON-LD) antes de tocar nada, gate de cero regresión al cerrar").

---

### Pitfall 9: `prefers-reduced-motion` respected in one component but not consistently across all new animated components

**What goes wrong:**
Phase 16 already proved this project can correctly implement `prefers-reduced-motion` (via a `useEffect` + `matchMedia` pattern in `HeroGrainGradient.tsx`, avoiding hydration mismatch — see Pitfall 10). But that fix covers exactly one component. This milestone's target list is ~9 distinct component families (navbar, 3 Hero variants, FAQ, ClientLogosBlock, TestimonialsCarousel, blog grid, case-study listing/detail). If the reduced-motion check is re-implemented ad hoc per component instead of shared, it's easy for later components to skip it, especially if a different animation library (gsap/motion/animejs) is chosen that has its own reduced-motion affordance that isn't wired the same way as `HeroGrainGradient`'s custom hook.

**Why it happens:**
There is no shared reduced-motion hook/utility in this codebase yet (`HeroGrainGradient.tsx` inlines its own `useState`+`useEffect`+`matchMedia` logic locally). Copy-pasting that pattern nine times invites at least one component to be added later without it, especially under time pressure near the end of the phase.

**How to avoid:**
- Extract a single shared `useReducedMotion()` hook (same SSR-safe `false`-then-`useEffect` pattern already proven in `HeroGrainGradient.tsx`) into `src/lib/` or `src/hooks/` as this milestone's first animation task, before touching any of the 9 target components — every subsequent component consumes the same hook, not a reimplementation.
- If the chosen animation library (gsap/motion/animejs) has its own built-in reduced-motion respect (e.g., Motion's `useReducedMotion`), decide explicitly whether to use the library's or the existing project hook, and document the choice — don't let some components use one and others use the other inconsistently.
- Add reduced-motion to the same automated verification script pattern this project already used in Phase 16 (`scripts/verify-mobile-viewport.mjs`-style headless check) — assert every animated component's `data-motion` (or equivalent) attribute resolves to `reduced` when `prefers-reduced-motion: reduce` is emulated, across all 9 target components in one script run, not spot-checked manually per component.

**Warning signs:**
A newly-animated component still visibly animates in a browser/DevTools emulation with reduced-motion forced on, while others in the same page correctly go static.

**Phase to address:**
Animation phase — the shared hook is a prerequisite task before per-component animation work begins; the cross-component verification script is a closing gate task.

---

### Pitfall 10: Hydration mismatch from client-only animation state (proven failure mode, Phase 16)

**What goes wrong:**
Any animation state that depends on browser-only APIs (`matchMedia`, `window`, `document`, viewport size, intersection observer results) differs between what the server can render (nothing — SSR has no `window`) and what the client's first paint would show if read eagerly. Initializing that state via a `useState` lazy initializer that reads `window`/`document` directly causes React to render different HTML on the server pass vs. the client's first hydration pass, producing a real hydration mismatch — a bug this project already hit and fixed once for `reducedMotion` in `HeroGrainGradient.tsx`.

**Why it happens:**
It's tempting to write `useState(() => window.matchMedia(...).matches)` for a "one-line" solution, but React hydration compares the server-rendered markup against the client's *first* render before any effects run — effects run after hydration completes, but a lazy initializer runs *during* that first client render, before hydration reconciliation, causing the mismatch. The documented fix (already in this codebase, see `HeroGrainGradient.tsx` lines 144-150) is: initialize state to the SSR-safe default (`false`), and only set the real value inside `useEffect`, which runs strictly after hydration.

**How to avoid:**
- Reuse the exact pattern already proven in `HeroGrainGradient.tsx` for every new component that needs any browser-only read for animation purposes (scroll position, intersection-observer "in view" state, viewport width breakpoints for conditional animation intensity): initialize to the server-safe default, read the real value inside `useEffect`, never inside a `useState` lazy initializer or during render.
- If using a third-party animation/scroll library with its own hooks (e.g., `useInView` from Motion, ScrollTrigger from gsap), verify during evaluation (this milestone's own "research + selección de librería" task) whether that hook is SSR-safe by default or requires the same manual guard — don't assume a popular library handles this correctly out of the box; check its docs/source explicitly.
- Treat any new `useState` that reads a browser global as a code-review flag requiring the SSR-safe-default-plus-effect pattern, mirroring the comment already left in `HeroGrainGradient.tsx` as the canonical in-repo example to point new code at.

**Warning signs:**
React DevTools/console hydration warnings ("Hydration failed because the server rendered HTML didn't match the client"); a component that flickers/pops on first load in production but not in an already-hydrated dev reload.

**Phase to address:**
Animation phase — as a mandatory pattern check on every new animated component, referencing `HeroGrainGradient.tsx` as the in-repo canonical example during the library-selection/research task and again during implementation review.

---

### Pitfall 11: Animation-library bundle-size creep from importing more than needed

**What goes wrong:**
Pulling in a general-purpose animation library (gsap's full build, or importing an entire motion/animejs package without tree-shaking) for what's actually a handful of primitives (fade-in-on-scroll, a hover scale/lift) can add tens to hundreds of KB of client JS across every page that uses the shared navbar/footer/blocks — directly threatening the Lighthouse/CWV budget this milestone explicitly commits to protecting, and repeating the exact tradeoff this project already reasoned through once in v1.3 (rejecting three.js/ShaderGradient at ~150KB+ in favor of a ~5KB shader lib for the Hero background).

**Why it happens:**
Full-featured animation libraries are the default recommendation in most tutorials/examples, and it's easy to import the whole package (`import gsap from 'gsap'`) rather than the specific plugin/primitive actually needed, especially when multiple components each pull their own imports without a shared, minimal wrapper.

**How to avoid:**
- During the milestone's own "research + selección de librería" task, evaluate candidates explicitly by shipped bundle weight for *only the primitives needed* (scroll-reveal, hover states, simple transitions) — not full feature set. CSS-only or Framer Motion's `LazyMotion`-with-minimal-features pattern, or even native CSS `@starting-style`/`animation-timeline: view()` (no JS at all) are legitimate candidates worth comparing against a JS library, given this project's proven bias toward the lightest option that meets the visual bar (same reasoning as the v1.3 shader choice).
- Centralize the animation primitives behind one shared wrapper module so every consuming component imports from that module, not directly from the library — makes it possible to swap/tree-shake later without touching 9 components.
- Gate the choice with a real `next build` bundle-size comparison (shared JS chunk before/after) as part of the library-selection task, not just a subjective "feels fast" check.

**Warning signs:**
Shared/common JS chunk size grows noticeably after adding the animation library, even before any component-specific animation code is written; Lighthouse Performance score drops on the baseline-vs-recheck gate specifically attributable to increased JS parse/execute time rather than CLS/LCP shifts.

**Phase to address:**
Animation phase — library-selection task must include a bundle-size comparison gate before committing to a library, and the closing regression gate (already planned per PROJECT.md's milestone description) must catch any residual creep.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Re-implementing reduced-motion check per component instead of a shared hook | Faster to ship one component | Inconsistent accessibility coverage, exactly the failure mode this research flags (Pitfall 9) | Never — extract the hook first |
| Running the humanization sweep as one long unattended script without per-doc logging | Simpler script, faster to write | Partial-failure state is invisible and hard to recover from (Pitfall 4) | Never for a full-DB sweep against a production-only DB with no staging |
| Humanizing meta title/description alongside body copy in the same pass | One less task to plan | Risk of losing locked target-keyword phrases, direct SEO regression (Pitfall 5) | Only if explicitly scoped as its own constrained task with keyword/length checks, never folded silently into the general prose pass |
| Adding `'use client'` at the top of an existing data-fetching Server Component to get an animation working quickly | Fastest path to "it animates" | Bundle bloat, possible server-only import breakage (Pitfall 7) | Never — always split into a small client leaf component |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Payload localization + bulk scripts | Writing a field per-locale without checking `localized: true` first | Audit field config before any bulk write touching that field (Pitfall 1) |
| Payload array/block fields + locale writes | Blind-append or full-replace regenerating ids per locale write | Read-merge-write preserving existing ids, matched by stable key (Pitfall 3) |
| `@payloadcms/plugin-seo` + humanizer | Treating meta fields as generic prose to rewrite freely | Exclude SEO-structured fields from the free-form pass by default (Pitfall 5) |
| JSON-LD components (`JsonLd.tsx`) + rewritten copy | Assuming existing escaping/shape handling is future-proof against arbitrary new text | Re-run `seo-schema` validation across all JSON-LD routes post-sweep (Pitfall 6) |
| Neon Postgres (no staging) + bulk migrations | Applying a generated migration without reading statement order | Hand-read every migration for `DROP` position; backfill before drop, always (Pitfall 2) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full animation library import for a handful of primitives | Shared JS chunk grows disproportionately | Bundle-size gate during library selection (Pitfall 11) | Immediately measurable in `next build` output, doesn't need scale |
| Scroll-reveal without reserved layout box | CLS increases | Animate only `opacity`/`transform`, reserve final box from first paint (Pitfall 8) | On any connection slower than dev machine's; visible in Lighthouse CLS immediately |
| `'use client'` boundary drawn too high | Larger-than-expected route JS, possible server-only import breakage | Small leaf client components consuming server-fetched props (Pitfall 7) | Immediately on build/bundle inspection |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Running the full-DB humanization sweep with elevated Local API access (`overrideAccess: true` by default) without an explicit publish-status filter | Could humanize/expose draft-only content, or (inverse of Phase 24's bug) accidentally leak unpublished docs' content into a public-facing render path if any new component reads via Local API without `overrideAccess: false` | Explicit `_status: published` filter (or `overrideAccess: false`) on every Local API read the sweep or any new component performs, mirroring the fix already applied in Phase 24 for `services-data.ts` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Animation inconsistency across the 9 target components (some feel snappy, some sluggish, different easing curves) | Site feels less polished/professional — undermines the "demonstrate engineering pericia" Core Value | Centralize timing/easing tokens (duration-fast/base/slow, ease-out/standard already exist in this codebase from Phase 7/8 — reuse them for animation timing too, don't invent new ad hoc values per component) |
| Humanized copy drifting into inconsistent terminology across pages that should match (e.g., how "SEO técnico" or a service name is phrased differs page to page after independent humanization passes) | Confuses readers/search engines about whether two pages are describing the same offering | Keep a running terminology/glossary reference (locked keyword phrases, service names, Juan's specific phrasing choices) that every humanization pass checks against, not independent per-page rewrites with no cross-reference |

## "Looks Done But Isn't" Checklist

- [ ] **Reduced-motion support:** Often verified on the first animated component only — verify via automated headless check across ALL 9 target components, not a manual spot-check on one
- [ ] **Localized field writes:** Often assumed correct because the *localized* sibling field (title/richText) looks right — verify every touched field's `localized: true` status in config, and diff ES vs EN raw API values post-write
- [ ] **Bulk sweep completeness:** Often assumed complete because the script "ran without errors" — verify against a doc-count/processed-id log, not exit code alone
- [ ] **JSON-LD after copy rewrite:** Often assumed fine because the page "looks right" visually — verify via `seo-schema` validation and View Source, since escaping bugs are invisible in the rendered UI
- [ ] **Animation bundle impact:** Often assumed fine because "it's just a small library" — verify via actual `next build` route JS size diff, not a vibe check

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Column dropped before backfill (schema reshape gone wrong) | HIGH | Neon point-in-time restore to just before the migration applied (proven path, used in Phase 19); re-verify all content in both locales afterward, not just the one field that broke |
| Non-localized field clobbered by locale write | LOW-MEDIUM | If the old value is still recoverable from the other locale's last-known-good write, restore it via a corrective non-destructive update script (as done for `Header.navItems` in Phase 21); if genuinely lost, restore from Neon PITR |
| Partial-failure mid-sweep | LOW if resumable/logged (Pitfall 4 prevention in place) | Re-run the script; idempotent design means already-humanized docs are skipped and the remainder completes |
| SEO regression from over-eager meta-field rewrite | MEDIUM | Restore locked meta fields from the pre-sweep snapshot export (Pitfall 5's prevention), re-verify against `KEYWORD-RESEARCH.md` |
| CLS/Lighthouse regression from animation | LOW | Isolated to CSS/animation-trigger code, not data — revert the specific component's animation implementation, no DB involvement |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Non-localized field clobbered by locale write | Content-humanization phase (pre-flight audit task, first task in phase) | Raw API diff ES vs EN post-write for every touched field |
| Schema reshape drops data before backfill | Content-humanization phase (only if a reshape is needed) | Hand-read migration statement order; Juan's named approval before apply |
| Id collision on shared non-localized arrays | Content-humanization phase (any array/block field touched) | Idempotency self-check: re-run script twice, diff must be empty |
| Partial-failure mid-sweep | Content-humanization phase (harness-building task, before any content task) | Processed-id log count matches total doc count per collection |
| SEO-critical strings humanized without keyword/length check | Content-humanization phase (scope-definition task, before sweep starts) | Diff `targetKeyword`/`meta.title`/`meta.description` pre vs. post sweep |
| JSON-LD breaks from rewritten copy | Content-humanization phase (closing regression gate) | `seo-schema` validation re-run across all JSON-LD routes |
| Client Component boundary leak | Animation phase (per-component task) | `next build` output — no server-only imports in client chunks; bundle size sane per component |
| CLS from animated entrances | Animation phase (closing regression gate) | Lighthouse CLS specifically, baseline vs. recheck, all target pages |
| Inconsistent `prefers-reduced-motion` coverage | Animation phase (shared-hook task before per-component work; verification task at close) | Automated headless check, reduced-motion emulated, across all 9 target components |
| Hydration mismatch from client-only animation state | Animation phase (pattern applied per new component, reviewed against `HeroGrainGradient.tsx`) | No hydration warnings in console/devtools on any animated route |
| Animation library bundle-size creep | Animation phase (library-selection task) | `next build` shared-chunk size diff before/after library adoption |

## Sources

- `.planning/PROJECT.md` — Milestone Anterior sections v1.2 through v1.5, Key Decisions table (Database Safety rule), Context section — HIGH confidence, primary source of every incident cited
- `.planning/STATE.md` — Phase notes for Phase 16 (16-02 hydration fix), Phase 19 (CTA richText incident + Database Safety rule origin), Phase 21 (Header.navItems id collision), Phase 25 (TestimonialsCarousel.title non-localized bug, RelatedCaseStudyBlock depth bug, accessibility regression) — HIGH confidence
- `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/CLAUDE.md` — Database Safety section (hard rule text, incident description) — HIGH confidence
- `src/components/HeroGrainGradient.tsx` — direct source of the proven SSR-safe reduced-motion/hydration pattern (lines 142-191) and the shader bundle-size reasoning already applied once in this codebase — HIGH confidence
- Direct grep of `src/collections`, `src/globals`, `src/blocks`, `src/payload.config.ts` for `localized: true` usage and JSON-LD-consuming routes — HIGH confidence, confirms the scope of fields/routes this milestone's pitfalls apply to

---
*Pitfalls research for: v1.6 milestone — micro-animation retrofit + bulk DB content humanization on juan-payload*
*Researched: 2026-07-13*
