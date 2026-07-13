# Project Research Summary

**Project:** Juan Carlos Angulo Portfolio (Payload rebuild) — Milestone v1.6
**Domain:** Second-pass component polish (motion + component visuals) + bulk bilingual content humanization on a live production Payload/Postgres consultant portfolio
**Researched:** 2026-07-13
**Confidence:** HIGH

## Executive Summary

Milestone v1.6 is really two independent workstreams stitched into one milestone: (1) a component-level visual/motion polish pass across ~9 shared components (navbar, secondary Hero variants, FAQ, client logos, testimonials, blog/case-study grids, CTA strip) using a new micro-animation library, and (2) a full-database bilingual content rewrite ("humanization") to give every piece of copy Juan's own voice, calibrated against two named competitors (Arianna Lupi, Aleyda Solis). Research strongly recommends `motion` (npm package `motion`, `12.42.2`, via `LazyMotion`+`m`+`domAnimation`) over GSAP or Anime.js — it's the lightest option that covers this milestone's actual needs (scroll-reveal, hover/tap, simple transitions) at ~19-20 KB gzipped, fits this codebase's declarative React/RSC idiom, and needs almost no wiring for `prefers-reduced-motion`. GSAP is fully free now (since April 2025) and has an official Claude Code skill, which is the one point genuinely in its favor — but its extra weight and imperative style aren't justified for this milestone's scope; keep it in reserve for a future milestone needing real timeline choreography.

The content-humanization workstream is the higher-risk half of this milestone, not the animation half. This project has a documented, three-times-repeated bug class — non-localized fields silently clobbered when a per-locale bulk write hits them (`CallToAction.richText`, `Header.navItems.url`, `TestimonialsCarousel.title`) — and one of those incidents (2026-07-12) actually destroyed production content, recovered only via Neon point-in-time restore, because a migration dropped a column before backfilling. A full-DB sweep touches an order of magnitude more fields than any prior seed script, so the probability of hitting more undiscovered non-localized fields is high; this research already found two new ones (`CaseStudies.services[].service`, and the open question of `Llms.llmsTxt/llmsFull`). There is no staging database — `DATABASE_URI` is the real Neon instance — so the recommended architecture builds a disposable Neon branch as ephemeral staging, a full-text snapshot/diff tool (not just id/updatedAt), a static field-localization audit script, and a runtime locale-parity collapse detector, all built and validated *before* any content is rewritten, then reused as a "dry-run on branch → verify → apply to prod → verify again" rhythm for every phase.

The two workstreams should stay architecturally separate even though they land in the same milestone: component/motion work is a code change with a build-time verification story (Lighthouse CLS, bundle-size diffs, hydration checks); content humanization is a data change against production with a different risk profile (locale-parity, SEO-string integrity, JSON-LD validity) requiring Juan's read-through and, for any schema reshape, his named approval before applying. Bundling them into the same phase would blur two very different review/regression gates for no benefit — the roadmap should treat them as parallel or sequential tracks with distinct phase boundaries, not interleaved phase-by-phase.

## Key Findings

### Recommended Stack

Single new dependency for this milestone: `motion` (`^12`), integrated via one shared `LazyMotion`+`MotionConfig` root client wrapper (paying the ~20 KB cost once, not per-component) and per-block leaf components importing `motion/react-m`. No animation library is needed beyond this — Tailwind's existing `transition-*`/`hover:` utilities (already wired to this project's `--motion-fast/base/slow` + `--ease-out/standard` tokens from Phase 7) should continue to handle simple hover states; Motion is reserved for scroll-reveal, gesture coordination, and cases CSS genuinely can't do alone.

**Core technologies:**
- `motion` (`motion/react`, `LazyMotion`+`m`+`domAnimation`) — scroll-reveal + hover/tap micro-interactions — lightest option (~20 KB) that fits this codebase's declarative RSC pattern and has built-in `useReducedMotion`/`MotionConfig` reduced-motion support
- No new library for content humanization — reuses existing project tooling (Payload Local API, `tsx` seed-script pattern, Neon CLI for ephemeral branches)
- `neonctl` (Neon CLI, already available to the project's Postgres provider) — creates disposable branch DBs as ephemeral staging for dry-running every rewrite script before it touches production

### Expected Features

**Must have (table stakes — the "not template-default" bar):**
- CTA strip wrapped in `Container` (fixes the full-bleed "card touching viewport edges" complaint) — zero risk, do first
- Breadcrumbs unified across Services AND Case Studies (extend v1.5's `buildTrail()`/`Breadcrumbs.tsx`, which Case Studies currently bypasses with a drifted schema-only implementation)
- Navbar scroll-state treatment (blur/shadow on scroll) + active-route indication
- FAQ visual grouping/icon polish (style only, keep native `<details>`)
- Client-logo scale normalization; testimonials-row scroll affordance (fade-edge/hint)
- PostCard metadata badges (date/category) on blog grid + `FeaturedPostsBlock`
- Baseline scroll-reveal/hover animation system, `prefers-reduced-motion` respected everywhere, Lighthouse-gated
- Voice-calibrated humanization pass across DB copy (Home/Services partially done in v1.5 — extend to Blog/Case Studies/Testimonials/FAQ/CTA)

**Should have (differentiators vs. Arianna Lupi / Aleyda Solis, neither of whom runs any of these):**
- Distinct visual identity per Hero variant (`listing` vs `post-header` vs `case-study-header` currently render pixel-identical)
- Restrained, CWV-budgeted motion language extended beyond the homepage shader to secondary pages
- Voice profile grounded in named-competitor analysis: first-person like Arianna Lupi (not third-person like Aleyda Solis), direct-quantified credential claims, collaborative-imperative CTAs ("Hablemos", "Trabajemos juntos"), neutral Spanish (no voceo)

**Defer (later in milestone or future milestones):**
- Case-studies listing routed through `ArchiveBlock` for grid parity — only if touched anyway
- KPI-card background integration on case-study detail — only if Hero-variant work touches that page anyway
- Breadcrumbs extended to Blog, author-page polish, third-person press-kit copy variants — explicitly out of this milestone's named scope

**Anti-features (explicitly rejected):** JS carousel libraries (embla/swiper) for testimonials, Radix Accordion replacing native `<details>` for FAQ, GSAP/Framer as a heavyweight default, marquee auto-scroll for client logos, bundling copy restructuring into the visual-polish pass, adopting Aleyda's third-person voice for Juan's first-person site.

### Architecture Approach

Two-track architecture. Track A (motion/components): small `'use client'` leaf wrapper components consuming server-fetched props/children, mirroring the existing `HeroGrainGradient.tsx` boundary pattern — never lift `'use client'` to a data-fetching Server Component. Track B (content humanization): a five-phase, safety-net-first pipeline — Phase 0 builds the snapshot/audit/parity tooling and resolves known schema traps before any content moves; Phases 1-4 rewrite collection-groups in ascending risk order (globals/lean collections → core pages → services/geo pages → posts/case-studies); Phase 5 is close-out verification (snapshot diff for Juan's read-through, live curl sweep, Lighthouse/CWV regression gate, JSON-LD re-validation).

**Major components:**
1. `MotionProvider` (root client wrapper) — hosts `LazyMotion`+`MotionConfig`, paid once, consumed by every animated leaf component
2. Neon ephemeral branch — disposable copy-on-write fork of production DB, the dry-run target for every content-rewrite script before it touches prod
3. `content-text-snapshot.ts` / `verify-locale-parity.ts` / `audit-localized-fields.ts` (new scripts) — the safety net: full before/after text dump, runtime es/en collapse detector, static field-localization audit
4. Per-collection-group seed/rewrite scripts (globals+lean, core pages, services+geo, posts+case-studies) — idempotent, reusing the established `reapplyIds()`/refetch-in-loop pattern from `seed-phase25-service-landings.ts` for block-based Pages docs
5. `reindex-search.ts` (existing) — must re-run after any bulk `update()` pass touching Posts/CaseStudies/Authors, since `plugin-search`'s hook doesn't backfill retroactively

### Critical Pitfalls

1. **Non-localized field clobbered by per-locale bulk write (3rd+ occurrence in this project)** — audit every touched field's `localized: true` status before writing, diff ES vs EN raw API values post-write; this is the single highest-probability failure mode for this milestone given the scale of the sweep.
2. **Schema reshape drops data before backfill (repeat of the 2026-07-12 incident)** — any migration adding `localized: true` to an existing column must backfill both locales before `DROP COLUMN`; hand-read every generated migration's statement order; Juan's named approval required, no exceptions, even under time pressure.
3. **Id collision on shared non-localized arrays** (already shipped once — Header nav showing wrong-locale label) — any bulk script touching array/block fields must read-merge-write preserving existing ids, never blind-append; self-check by running twice and diffing (must be a no-op).
4. **Partial-failure mid-sweep leaves DB in a mixed state** — no transactional wrapper across a full-DB sweep; make every rewrite script idempotent/resumable with a processed-id log, since this project's relaxed DB-safety rule means the sweep runs unattended and the script itself must be the safety net.
5. **Client Component boundary leak + CLS/hydration-mismatch from animation retrofits** — three related pitfalls (boundary too high breaking server-only imports; entrance animations shifting layout; browser-only state read outside `useEffect`) all have a proven in-repo fix already (`HeroGrainGradient.tsx`'s pattern) that must be deliberately repeated for every one of the ~9 newly-animated components, not assumed.

## Implications for Roadmap

Based on research, suggested phase structure. Track A (motion/components) and Track B (content) are independent — sequence Track B's Phase 0 early since it has no dependency on Track A, and interleave or parallelize the rest based on Juan's risk tolerance for touching production content early vs. late in the milestone.

### Phase 1: CTA Container fix + navbar/breadcrumb/FAQ/logo/testimonial polish (Track A, low-risk items)
**Rationale:** Zero-to-low risk, no new dependency, no schema/content touch — safest way to open the milestone and deliver Juan's named complaint (CTA edge-to-edge) immediately.
**Delivers:** CTA `Container` fix, unified Case-Studies breadcrumbs (reusing v1.5's `buildTrail()`), navbar scroll-state + active-route, FAQ visual grouping, client-logo normalization, testimonials scroll affordance.
**Addresses:** Table-stakes items from FEATURES.md.v1.6 with LOW/LOW-MEDIUM complexity.
**Avoids:** Pitfall 7 (boundary leak) is not yet in play here since none of this needs `'use client'` beyond what may already exist for the mobile nav Sheet.

### Phase 2: Micro-animation library adoption (Track A)
**Rationale:** Must land before any per-component motion work so every subsequent touch uses one consistent primitive instead of ad hoc CSS; also gates PostCard metadata + Hero-variant differentiation if those get motion treatment.
**Delivers:** `motion` installed, root `MotionProvider`, shared `useReducedMotion` decision (library's own vs. project's existing hook — document the choice), baseline scroll-reveal applied to 2-3 pilot components, bundle-size gate (`next build` diff) before wider rollout.
**Uses:** `motion` 12.x per STACK-v1.6.md's LazyMotion+m+domAnimation pattern.
**Implements:** Small client-leaf wrapper components per Pitfall 7's prevention pattern, mirroring `HeroGrainGradient.tsx`.

### Phase 3: Component motion + PostCard metadata + Hero-variant differentiation rollout (Track A)
**Rationale:** With the library and pattern validated in Phase 2, extend motion + visual differentiation across the remaining target components.
**Delivers:** Scroll-reveal/hover states across navbar, FAQ, client logos, testimonials, blog/case-study grids; PostCard date/category badges; distinct Hero visual treatment per variant (`listing`/`post-header`/`case-study-header`).
**Addresses:** Differentiator features from FEATURES.md.v1.6 (motion system, Hero-variant IA edge).
**Avoids:** Pitfalls 8/9/10 (CLS, reduced-motion consistency, hydration mismatch) via the closing per-component checklist plus a headless reduced-motion verification script across all touched components.

### Phase 4: Content-humanization safety net (Track B, Phase 0 from ARCHITECTURE-v1.6.md)
**Rationale:** Nothing gets rewritten before this exists — the ordering constraint that overrides all others. Can start in parallel with Track A since it has zero dependency on it.
**Delivers:** `content-text-snapshot.ts`, `verify-locale-parity.ts`, `audit-localized-fields.ts`; `pre-humanize` snapshot taken; Trap 1 (`CaseStudies.services[].service`) and Trap 2 (`Llms` localization — needs Juan's decision) resolved as reviewed, backfilled migrations with Juan's named approval; `TestimonialsCarousel.title` strategy decided; first Neon dry-run branch validated end-to-end.
**Addresses:** Pitfalls 1-4 (non-localized clobber, schema-drop, id collision, partial-failure) directly, as mandatory pre-flight tasks.
**Avoids:** A repeat of the 2026-07-12 CTA data-loss incident.

### Phase 5: Content humanization — globals/lean → core pages → services/geo → posts/case-studies (Track B)
**Rationale:** Ascending risk/blast-radius order (per ARCHITECTURE-v1.6.md's suggested build order) validates the dry-run/snapshot/parity toolchain on low-stakes collections before trusting it against the highest-stakes, most SEO-visible prose (Posts/CaseStudies).
**Delivers:** Voice-calibrated copy (per the synthesized Voice Profile: first-person, direct-quantified credentials, collaborative CTAs, neutral Spanish) written across Header/Footer/Llms/Authors/Testimonials/Clientes/SpeakingEvents/Categories, then Home/Contact/Privacy/Terms, then Services+geo pages, then Posts+CaseStudies.
**Implements:** The refetch-inside-locale-loop + `reapplyIds()` pattern for block-based Pages docs; SEO-field exclusion (meta.title/description, targetKeyword) from the free-form prose pass per Pitfall 5.
**Avoids:** Pitfalls 5-6 (SEO-string regression, JSON-LD breakage) via explicit field scoping and a `seo-schema` re-validation gate.

### Phase 6: Close-out verification (Track B, and joint regression gate for both tracks)
**Rationale:** No automated check substitutes for Juan's own read-through of the humanized copy diff; both tracks share a final CWV/Lighthouse regression gate since either could plausibly shift CLS (humanized copy changes text length; animation changes layout timing).
**Delivers:** `post-humanize` snapshot diffed against `pre-humanize` for Juan's review; full live curl es/en sweep; `reindex-search.ts` re-run; `seo-schema` JSON-LD validation; Lighthouse/CWV baseline-vs-recheck across both tracks' touched pages.
**Addresses:** The milestone's own stated "zero-regression gate" commitment.

### Phase Ordering Rationale

- Track A's low-risk component fixes come first because they're independent, quick wins that deliver Juan's named complaint immediately, building momentum before the higher-risk content track begins.
- The animation library must be selected and validated (Phase 2) before wider component rollout (Phase 3) — this is a hard dependency called out in both STACK-v1.6.md and PITFALLS.md (Pitfall 11: bundle-creep must be gated at selection time, not discovered after rollout).
- Track B's safety-net phase (Phase 4) is a hard prerequisite for any content write — this is the single most emphasized constraint across both ARCHITECTURE-v1.6.md and PITFALLS.md, directly motivated by this project's own incident history (three repeats of the same bug class, one causing real data loss).
- Content-humanization sub-phases are ordered by ascending blast radius (globals → core pages → services → posts/case-studies) specifically to validate the Neon-branch-dry-run + snapshot + parity-check toolchain cheaply before trusting it against the highest-stakes, most SEO-visible collections.
- Close-out verification is placed last and treated as a joint gate for both tracks since either could independently regress Lighthouse/CWV — the milestone's Core Value ("Core Web Vitals en verde") is non-negotiable across both workstreams.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (animation library adoption):** STACK-v1.6.md flags MEDIUM confidence on bundle-size numbers (not independently re-measured against this project's actual bundler output) — worth a real `next build` measurement early in this phase rather than trusting the research doc's estimates blind.
- **Phase 4 (safety net):** The `Llms` localization decision (Trap 2) is explicitly flagged as an open question requiring Juan's input, not a research-answerable item — surface this as an early blocking question, not a mid-phase surprise.
- **Phase 5 (content humanization, posts/case-studies sub-phase):** Highest individual-string volume in the milestone (richText bodies) — if Posts has more than a handful of docs, this sub-phase may need its own finer-grained plan/script split, per ARCHITECTURE-v1.6.md's own suggestion.

Phases with standard patterns (skip research-phase):
- **Phase 1 (low-risk component polish):** Pure Tailwind/JSX changes to existing, already-inspected components — no new pattern needed.
- **Phase 3 (component motion rollout):** Once Phase 2 validates the library pattern, this is mechanical repetition of an established shape (`HeroGrainGradient.tsx`-style leaf components).
- **Phase 6 (close-out verification):** Directly reuses established project patterns (Phase 22's `seo-schema` validation, Phase 25's Lighthouse/CWV gate, the existing curl-sweep discipline).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (recommendation) / MEDIUM (bundle-size numbers) | `motion` version and API confirmed against npm registry and official docs; comparative bundle-size figures are cross-checked against multiple third-party 2026 sources but not independently re-measured against this project's own build output |
| Features | HIGH (codebase baseline) / MEDIUM (voice profile) | Every component in scope read directly from source; voice profile is based on a single live fetch each of two competitor sites, cross-referenced against v1.5's prior structural findings |
| Architecture | HIGH | Based on direct inspection of every collection/global/block config file plus two existing snapshot/verification scripts already built for a prior milestone — not inferred |
| Pitfalls | HIGH | Grounded directly in this project's own documented incident history (three repeats of the same bug class, one real production data-loss event), not generic advice |

**Overall confidence:** HIGH

### Gaps to Address

- **`Llms.llmsTxt`/`llmsFull` localization decision:** Genuinely undecided — needs Juan's explicit choice (single-locale canonical doc vs. localize+backfill) before Phase 4 can close; flag as a direct question early rather than assuming.
- **Animation bundle-size figures:** MEDIUM confidence, not measured against this project's actual bundler output — validate with a real `next build` comparison in Phase 2 before committing further component work to the chosen library.
- **`SpeakingEvents.location` field:** Low-severity, unresolved watch item — needs a quick manual check of actual stored values to confirm whether any contain translatable descriptive text (not just bare place names) before deciding if a schema change is warranted.
- **Posts collection doc count:** Not established in this research pass — determines whether Phase 5's posts/case-studies sub-phase needs splitting into multiple smaller scripts for reviewability.
- **`prefers-reduced-motion` hook choice:** Whether to use Motion's own `useReducedMotion`/`MotionConfig` or extract the project's existing `HeroGrainGradient.tsx`-derived hook is left as an explicit decision for Phase 2, not pre-resolved by research — document whichever choice is made so all 9 components use it consistently.

## Sources

### Primary (HIGH confidence)
- https://motion.dev/docs/react-reduce-bundle-size, https://motion.dev/docs/react-use-in-view, https://motion.dev/docs/inview — official Motion docs on LazyMotion sizing and `whileInView`/`useInView` IntersectionObserver internals
- https://gsap.com/pricing/, https://webflow.com/updates/gsap-becomes-free, https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/ — GSAP licensing change (April 2025)
- https://github.com/greensock/gsap-skills — official GreenSock Agent Skills repo, confirms no Motion/Anime.js equivalent
- npm registry (live, 2026-07-13): `motion@12.42.2`, `gsap@3.15.0`, `animejs@4.5.0`
- Direct codebase inspection (2026-07-13): every `src/collections/*/index.ts`, `src/globals/*/index.ts`, `src/blocks/*/config.ts`, `src/blocks/CallToAction/`, `src/components/SiteHeader.tsx`, `src/components/HeroGrainGradient.tsx`, `src/blocks/TestimonialsCarousel/Component.tsx`, plus every component named in FEATURES.md.v1.6's scope
- `node_modules/@payloadcms/plugin-seo/dist/fields/{MetaTitle,MetaDescription}/index.js` — verified `localized: true` directly in installed package source
- `scripts/content-freeze-snapshot.ts`, `scripts/seed-phase25-service-landings.ts`, `scripts/reindex-search.ts` — existing project patterns to extend/reuse
- `.planning/PROJECT.md`, `.planning/STATE.md`, root `CLAUDE.md` (Database Safety section) — incident history and hard constraints (2026-07-12 CTA data-loss incident, Phase 16/19/21/25 bug history)

### Secondary (MEDIUM confidence)
- https://www.pkgpulse.com/compare/framer-motion-vs-gsap, https://devpick.co/framer-motion-vs-gsap, https://lab.good-fella.com/blog/gsap-vs-framer-motion-vs-react-spring — independent 2026 bundle-size comparisons
- https://animejs.com/, https://animejs.com/documentation/events/onscroll/ — Anime.js v4 docs (recent rewrite, less independently corroborated)
- ariannalupi.com, aleydasolis.com — live competitor fetches 2026-07-13, single-pass voice extraction each

### Tertiary (LOW confidence)
- None flagged — all findings in this milestone's research trace to either official docs, direct codebase reads, or corroborated multi-source comparisons.

---
*Research completed: 2026-07-13*
*Ready for roadmap: yes*
