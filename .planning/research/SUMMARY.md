# Project Research Summary

**Project:** Juan Carlos Angulo Portfolio (Payload rebuild) — v1.5 "UI/UX Pro Max: Polish y Competitividad"
**Domain:** Service-page UI/UX polish + breadcrumbs + home services showcase, on an existing shipped Payload 3.85 + Next.js 15 bilingual (EN/ES) marketing/portfolio site
**Researched:** 2026-07-12
**Confidence:** HIGH

## Executive Summary

This milestone is a restyle-and-harden pass, not a greenfield build. The service landing pages, the Home page, the Payload blocks system, and the design token/component library all already exist and are production-quality — the job is to make Services look and convert as well as the rest of the site, surface those services from Home, and add breadcrumbs. Research across stack, features, architecture, and pitfalls converges on one thesis: **reuse what's built, add almost nothing new, and use this pass to close two latent SEO gaps (missing canonical/hreflang, unschematized breadcrumbs) that the redesign will otherwise touch anyway.** Competitor analysis (Arianna Lupi, Aleyda Solis — Juan's named direct competitors) shows both run flat single-page sites with no dedicated service URLs and no breadcrumbs; Juan's individually-URL'd service landings are already a structural SEO/GEO edge that this milestone should sharpen, not abandon.

The recommended approach: zero new runtime dependencies (the shadcn/Radix/Tailwind/lucide system already covers breadcrumbs, comparison content, cards, sticky CTAs, and scroll-reveal via CSS); one new shared component (`Breadcrumbs.tsx` + `lib/breadcrumbs.ts`, path-derived, not a Payload field) feeding both the visual nav and `BreadcrumbList` JSON-LD from a single source of truth; one new Payload block (`ServicesShowcase`) built as a purely additive block reading the existing fixed `SERVICE_SLUGS` set, ideally with no schema migration at all. Visual polish reuses existing blocks (`Hero`, `Content`, `FAQ`, `CallToAction`, `TestimonialSection`, `ClientLogosBlock`, `ResultsSection`, `FeaturedCaseStudiesBlock`) rather than inventing new ones.

The key risks are not "will this look good" but "will this quietly break what already works." The project has a documented, real production incident: an unattended migration that localized `CallToAction.richText` and dropped the Home CTA copy without backfilling (recovered via Neon point-in-time restore). The dual `/servicios`↔`/services` URL segments currently resolve identically with no canonical/hreflang anywhere in `<head>` — a redesign that re-touches these exact templates without fixing that turns "prettier" into "prettier duplicate content." And the project has a repeat history of EN/ES parity bugs (empty labels, non-localized shared fields) that a fast visual pass is prone to reintroduce. Mitigations: additive-only migrations with SQL read before apply (destructive changes need Juan's named approval per the DB-safety rule), canonical/hreflang added as an explicit success criterion of the Services phase, and live bilingual verification baked into every phase's definition of done.

## Key Findings

### Recommended Stack

No new runtime dependencies for the milestone's core. The project already ships a complete shadcn/ui-style design system (Radix primitives, CVA/clsx/tailwind-merge, lucide-react, full CSS-variable token system) sufficient for breadcrumbs, comparison content, cards, sticky CTAs, and social proof. The one addition is a shadcn *source file* (`breadcrumb.tsx`, copied in via `npx shadcn add breadcrumb`, zero new packages since its deps are already installed). Framework versions (Next 15.4.11, Tailwind 3.4.19, React 19) are held steady — this is explicitly out of scope for a version bump. An optional, non-default addition (`@number-flow/react`) exists for animated stat counters but should only be added if Juan explicitly wants that motion; a static bold number is the default.

**Core technologies (already installed, reused):**
- Radix primitives (`avatar`, `dialog`, `navigation-menu`, `select`, `separator`, `slot`, `tabs`) — cover every interactive need
- `lucide-react` 1.24.0 — breadcrumb chevrons, check/x, service icons; do not add a second icon library
- CVA/clsx/tailwind-merge + CSS-variable design tokens — WCAG-AA-audited (Phase 11); new components must consume tokens, never hardcode hex/px
- `shadcn breadcrumb.tsx` (new source file) — accessible `<nav aria-label="breadcrumb">` pattern, composes existing deps

**Hard guardrails (Core Web Vitals):** no `framer-motion`/`motion` (30–60KB, hydration cost), no `embla-carousel-react` (repo already does carousels via CSS scroll-snap), no second icon or component library, no Tailwind v4 upgrade, no heavy table libs. The site's entire value proposition is impeccable performance and SEO — every new dependency is a liability against that.

### Expected Features

Both named direct competitors (Arianna Lupi, Aleyda Solis) run flat single-page sites: services as homepage card sections, no dedicated service URLs, no breadcrumbs, no pricing, contact-to-quote only. Juan's individually-URL'd service landings (already built in Phase 19) are a real IA/SEO/GEO differentiator neither competitor has — the milestone's job is to polish and harden that asset, not copy the competitors' flatter structure. Where Juan is currently thin relative to both competitors is social-proof density on the service pages themselves (they lean heavily on logos, quantified testimonials, awards).

**Must have (table stakes):**
- Full service-page anatomy: H1 → pain → what's included → process → proof → FAQ → CTA, with each beat visually distinct (not one rich-text wall)
- Repeated primary CTA (Hero top + shader `CallToAction` bottom), identical action/label
- Breadcrumbs (visual + `BreadcrumbList` JSON-LD) on Services index + all 4 landings
- Social proof reused onto service pages (`TestimonialSection`, `ClientLogosBlock`, `ResultsSection`) — closes the biggest competitive gap
- Home services showcase (4 cards from `SERVICE_SLUGS`, not hand-listed) linking to the landings
- Mobile-first parity for all of the above at 375px

**Should have (competitive differentiators):**
- Breadcrumbs + schema themselves — neither competitor has this at all
- "SEO for AI/GEO" service page citing live `/llms.txt`/`/llms-full.txt` as tangible proof — no competitor names GEO as a service line
- Visual process/engagement diagram (discovery → audit → implementation → measurement)
- Value-framing "engagement at a glance" card (scope/outcome/timeline) as a substitute for pricing
- Metric-in-headline related case-study card surfaced per service

**Defer (v2+ / anti-features):**
- Pricing tables — violates the project's hard no-price rule and would commoditize a bespoke engagement
- A new `Services` Payload collection — already rejected (Key Decision D-01); extend the existing `pages` model with blocks instead
- Any animation/scroll library (framer-motion, GSAP, Lenis) for "premium feel" — CWV regression risk, same reasoning that killed three.js in v1.3
- Sitewide breadcrumbs on Home/root pages — noise on a 1-level page, scope to the Services hierarchy
- A mega-menu/dropdown nav for 4 services — over-engineered; the Home showcase + `/services` index already solve discoverability
- Rewriting Phase-19 service copy during a visual pass — scope creep, risks regressing grounded copy

### Architecture Approach

The milestone slots into an established two-layer pipeline (routing → data layer `src/lib/services-data.ts` → `RenderBlocks.tsx` block-registry → Payload `pages` collection) with two additions: a shared, path-derived `Breadcrumbs` component (not a Payload field) and a new `ServicesShowcase` block following the existing three-touchpoint registration pattern (block config → collection registration → `RenderBlocks` entry). Both additions reuse existing seams rather than inventing new architecture. The dual-locale, dual-URL-segment rule (`es`→`/servicios` unprefixed, `en`→`/en/services`, identical DB slug) must be derived through one shared helper everywhere — never hand-typed — because this exact pattern has already produced two shipped bilingual bugs on this project.

**Major components:**
1. `src/components/Breadcrumbs.tsx` + `src/lib/breadcrumbs.ts` — server component + `buildTrail()`/`buildBreadcrumbJsonLd()` helpers; single source of truth for both the visual `<nav>` and the JSON-LD, fed by route params + already-fetched page titles (no extra query)
2. `src/blocks/ServicesShowcase/{config,Component}.tsx` — new Payload block mirroring `FeaturedCaseStudiesBlock`'s shape; reads the fixed `SERVICE_SLUGS` at render time rather than storing a per-instance service list
3. Four Services route files (`services/`, `servicios/`, both `[slug]` variants) — modified to mount `<Breadcrumbs>` + emit `BreadcrumbList` JSON-LD via the existing `<JsonLd>` component
4. `src/collections/Pages/index.ts` + `src/blocks/RenderBlocks.tsx` — the two files every new block must touch (plus `payload generate:types`)

Explicit anti-patterns flagged by the architecture research: do not model breadcrumbs as a per-page hand-typed Payload field (URLs/locale drift risk — the exact failure mode of two prior shipped bugs); do not install `@payloadcms/plugin-nested-docs` for a flat 4-item hierarchy; a new block does not require touching `sitemap-data.ts` or `plugin-seo` (blocks live inside `content.layout`, sitemap enumerates docs).

### Critical Pitfalls

1. **Dual-slug `/servicios`↔`/services` duplicate content, no canonical anywhere** — `generateMetadata` across the whole site sets only title/description; `alternates`/`canonical` exist only in `sitemap.xml`, never in page `<head>`. All 4 locale×segment combinations render identical content today. Fix: extract the URL-building logic already in `sitemap-data.ts` into a shared helper and emit `alternates.canonical` + `alternates.languages` in every service page's `generateMetadata`. Make this an explicit success criterion of the Services redesign phase, not an afterthought.

2. **Breadcrumb JSON-LD missing or drifting from the visible trail** — either shipping the visual nav with no schema (zero SEO benefit on an SEO-demonstration site) or shipping schema with wrong-locale URLs/mismatched names. Fix: derive both the `<nav>` and the `BreadcrumbList` JSON-LD from the same `buildTrail()` source; verify with Google's Rich Results Test on both locales; item URLs must equal the page's canonical.

3. **Non-additive `ServicesShowcase` migration repeats the Phase-19 CTA data-loss incident** — that incident localized `CallToAction.richText` and `DROP COLUMN`'d live Home CTA copy without backfill (recovered via Neon PITR; this is a real, documented production event, not hypothetical). Fix: design `ServicesShowcase` as a brand-new block appended to `blocks` (additive `CREATE TABLE` only); prefer a read-only design needing zero schema change (it can just read the 4 existing service pages); read generated migration SQL before applying; anything touching an existing column needs Juan's named approval per the project's DB-safety rule.

4. **Core Web Vitals regression from the polish itself** — heavier hero/card imagery, animations, new client components pushing LCP/CLS/INP up on a site with an already-thin performance budget (v1.3 spent -3 Performance points on the WebGL Hero). Fix: baseline Lighthouse mobile before the pass, treat it as a regression gate per phase, `next/image` with explicit dimensions everywhere, keep interactivity in small client islands not page-root `'use client'`.

5. **EN/ES parity gaps in new components** — this repo has a documented repeat history of exactly this bug class (empty ES labels, non-localized shared `Header.navItems`, non-localized `CallToAction.richText`). Fix: every new UI string gets both `es`/`en` next-intl messages; every new Payload content field gets a deliberate localization decision and is populated in both locales before a phase is called done; live-check `/` and `/en` for every new component.

## Implications for Roadmap

Based on research, suggested phase structure (Home + Services priority per PROJECT.md):

### Phase 1: Breadcrumbs (visual + schema)
**Rationale:** Zero schema risk, fully reversible, no DB touch — the safest place to start, and it's the foundation the Services redesign and the showcase both build on. The Hero block's existing (gated, presentational-only) `breadcrumbs` field is a trap to avoid reusing directly.
**Delivers:** `src/components/Breadcrumbs.tsx` + `src/lib/breadcrumbs.ts`, mounted on all four Services route files (both locale segments), rendering locale-correct visual trail + valid `BreadcrumbList` JSON-LD.
**Addresses:** Breadcrumbs (visual + JSON-LD) — highest-ROI differentiator per FEATURES.md, half-built already.
**Avoids:** Pitfall 2 (schema/visual drift) — build both from one source of truth; validate with Rich Results Test on both locales before marking done.

### Phase 2: Canonical + hreflang hardening on Services
**Rationale:** The Services templates are about to be re-touched anyway for the redesign; this is the natural (and per PITFALLS.md, only sane) moment to close the dual-slug duplicate-content gap before it compounds under a prettier, more-linked page.
**Delivers:** `alternates.canonical` + `alternates.languages` in `generateMetadata` for all 4 service URL shapes, built from a shared helper extracted from `sitemap-data.ts`; optionally guard/redirect the "wrong" locale+segment combination.
**Addresses:** Pitfall 1 directly (dual-slug duplicate content with no canonical).
**Avoids:** Fragmenting ranking equity across up to 4 URLs per service right as the pages get more competitive.

### Phase 3: ServicesShowcase block (Home)
**Rationale:** Requires real service URLs to link to (satisfied — Phase 19 shipped them) and is the Home-side complement to Breadcrumbs/canonical work already stabilizing the Services surface. Ordered after the Services-page hardening so the showcase links into pages that are already SEO-correct.
**Delivers:** New Payload block (`config.ts` + `Component.tsx`) reading `SERVICE_SLUGS` at render time, registered via the three-touchpoint pattern, inserted into the Home `pages` doc's layout in both locales.
**Uses:** Existing Card/Badge/Button primitives, lucide icons, `tailwind-merge` tokens (STACK-v1.5.md — zero new dependencies).
**Implements:** Architecture Pattern 2 (fixed-set data block reading a source of truth at render time), mirroring `FeaturedCaseStudiesBlock`.
**Avoids:** Pitfall 3 — design as additive-only, read-only if possible (no schema change), migration SQL read before apply, Juan's named approval only if it turns out to touch existing data.

### Phase 4: Service-page visual polish + social proof
**Rationale:** Comes last because it's the highest-surface-area, highest-regression-risk phase (touches shared blocks, most likely to disturb H1/JSON-LD/heading hierarchy) and benefits from the routing/schema layer beneath it already being correct and stable.
**Delivers:** Distinct H1/pain/includes/process/proof/FAQ/CTA visual beats on all 4 service landings using existing blocks (`Hero`, `Content`, `FAQ`, `CallToAction`) plus reused social-proof blocks (`TestimonialSection`, `ClientLogosBlock`, `ResultsSection`) seeded onto each service doc.
**Addresses:** Table-stakes anatomy + social proof (FEATURES.md P1 items); optionally the P2 differentiators (process diagram, value-framing card, related case-study card) if time allows within the phase.
**Avoids:** Pitfall 4 (CWV regression — Lighthouse baseline/gate per touched page), Pitfall 5 (EN/ES parity — live-check both locales), Pitfall 6 (dropped H1/JSON-LD — diff heading outline and `<head>` against pre-pass baseline).

### Phase Ordering Rationale

- Breadcrumbs first because it is schema-only, reversible, and zero-DB-risk — establishes the shared locale/URL-derivation helper that every later phase (canonical, showcase links, polish) depends on, preventing drift.
- Canonical/hreflang second because it re-touches the same templates breadcrumbs just touched, and because leaving it for last would mean shipping a prettier version of a duplicate-content problem.
- ServicesShowcase third because it needs the Services URLs to be stable and correct (satisfied by phases 1–2) before Home starts linking to them at volume, and its DB risk (however minimized) is isolated to its own phase rather than mixed with the highest-regression visual-polish phase.
- Visual polish last because it is architecturally the riskiest (touches shared blocks used elsewhere, most likely to regress H1/JSON-LD per PITFALLS.md Pitfall 6) and most benefits from a stable, already-correct SEO/routing foundation underneath it.
- This order also naturally sequences DB risk from none (Phase 1) → low/none (Phase 2, frontend-only) → additive-only (Phase 3) → none (Phase 4, pure markup/Tailwind), keeping the one phase with any schema risk isolated and reviewable on its own.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (ServicesShowcase):** the "reuse gated Hero.breadcrumbs field vs standalone component" fork was flagged MEDIUM confidence in STACK-v1.5.md and resolved architecturally, but the exact Payload migration shape (additive fields on the block config) should be re-verified against `payload generate:types` output before writing the migration — confirm zero destructive statements are generated for the specific field set chosen.
- **Phase 4 (visual polish):** "propose scope to Juan before touching shared components used by other templates" is explicitly called out in ARCHITECTURE-v1.5.md's suggested build order — any component reused outside Services (e.g., `Hero`, `CallToAction`) needs a regression check against its other call sites, which may warrant a short research/scoping pass at plan time.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Breadcrumbs):** pattern is fully specified (shadcn source file, path-derived trail, existing `JsonLd` component) — implementation-ready from research as-is.
- **Phase 2 (canonical/hreflang):** the URL-building logic to extract already exists verbatim in `sitemap-data.ts` — this is a refactor-and-reuse task, not new research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified live against npm registry 2026-07-12; "add nothing new" thesis cross-checked against installed `package.json` and existing component inventory |
| Features | MEDIUM-HIGH | Codebase facts verified directly (HIGH); competitor patterns from 2 live direct-competitor fetches + WebSearch cross-referencing (MEDIUM); breadcrumb SEO-impact figures single-sourced (LOW-MEDIUM), flagged as such |
| Architecture | HIGH | Verified against the real codebase (block registration pattern, dual-slug routing, existing JSON-LD emission), not training data |
| Pitfalls | HIGH | Grounded in this repo's actual source (grepped for canonical/hreflang absence, read the dual-slug route files directly) and this project's own documented incident history (Phase-19 CTA data loss, v1.2/v1.4 localization bugs, v1.4 H1 fixes) |

**Overall confidence:** HIGH

### Gaps to Address

- **Breadcrumb-source decision (standalone component vs. Hero field):** both viable per STACK-v1.5.md; architecture research resolved this toward a standalone path-derived component, but confirm during Phase 1 planning that this doesn't strand the existing Hero `breadcrumbs` field awkwardly for other Listing-variant pages that may still use it.
- **Breadcrumb CTR/schema-impact figures:** the ~40% CTR-drop-on-schema-loss case cited in FEATURES.md/PITFALLS.md is single-sourced (LOW-MEDIUM) — treat as directional motivation, not a hard target, when scoping Phase 1/2 acceptance criteria.
- **Exact ServicesShowcase field set and whether it truly needs zero migration:** research recommends a read-only design (reading existing service pages, storing only editorial framing fields like eyebrow/title/intro); confirm at plan time whether even those framing fields require new columns or can be hardcoded/next-intl-driven instead, to further minimize DB risk.
- **Scope boundary for Phase 4 shared-component edits:** which specific shared blocks (Hero, CallToAction) get touched, and how their other call sites (case studies, blog, author pages) are regression-tested, is not fully specified — needs a scoping conversation with Juan before Phase 4 execution, per ARCHITECTURE-v1.5.md's own recommendation.

## Sources

### Primary (HIGH confidence)
- Project source, read directly 2026-07-12: `src/lib/services-data.ts`, `src/blocks/Hero/{config,Component}.tsx`, `src/blocks/RenderBlocks.tsx`, `src/collections/Pages/index.ts`, `src/lib/sitemap-data.ts`, `src/components/JsonLd.tsx`, `src/app/(frontend)/[locale]/{services,servicios}/**`, `src/i18n/routing.ts`, `src/payload.config.ts`, `tailwind.config.ts`, `src/app/globals.css`, `package.json`
- npm registry (live, queried 2026-07-12) — version verification for all stack recommendations and rejected alternatives
- `.planning/PROJECT.md` and root `CLAUDE.md` — v1.5 goal, no-price hard rule, Key Decision D-01, DB-safety rule, documented Phase-19 CTA data-loss incident and Neon PITR recovery

### Secondary (MEDIUM confidence)
- ariannalupi.com, aleydasolis.com — live fetches 2026-07-12, competitor IA/social-proof/pricing patterns
- involve.me / rankmath.com / taap.bio (service/landing-page anatomy), hostinger.com / resumly.ai / freecodecamp.org (developer portfolio conventions) — WebSearch 2026-07-12

### Tertiary (LOW confidence)
- searchengineland.com / yotpo.com / seranking.com breadcrumb UX/SEO guidance, including the single-sourced ~40% CTR-drop case on breadcrumb schema loss — needs validation, not a hard target

---
*Research completed: 2026-07-12*
*Ready for roadmap: yes*
