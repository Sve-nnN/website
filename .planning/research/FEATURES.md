# Feature Research

**Domain:** Service-page UI/UX + breadcrumbs + home services showcase — solo technical consultant portfolio (software engineering + SEO), competing with independent SEO consultants and agencies for high-value/global clients, no pricing published
**Researched:** 2026-07-12 (v1.5 "UI/UX Pro Max" milestone — scopes the polish/competitiveness pass on Services + Home; the prior v1.1-era feature landscape lives in this file's git history and is not repeated here)
**Confidence:** MEDIUM-HIGH (codebase facts verified directly at HIGH; competitor patterns from 2 live direct-competitor fetches + 3 WebSearch passes cross-referenced, MEDIUM; breadcrumb schema/SEO impact figures single-sourced, LOW-MEDIUM)

## Codebase Baseline (verified directly, not researched)

Facts that constrain every feature below. These are what the roadmap builds on, not hypotheses.

- **Service landings already exist** as 5 `pages` docs (`services` index + `seo-technical-audit`, `seo-consulting`, `fullstack-development`, `ai-seo-geo`), driven by `src/lib/services-data.ts` (`SERVICE_SLUGS`) and thin route files under both `[locale]/services/` and `[locale]/servicios/`. This milestone **restyles and enriches existing pages**, it does not build the offering from scratch.
- **Service pages are built from existing blocks only:** `Hero` (name as H1 + pain framing), `Content` (rich text), `FAQ`, `CallToAction`. No `Services` collection — a new block or component must justify itself against reusing these (per PROJECT.md Key Decision D-01).
- **The Hero block already has a `breadcrumbs` field** (`src/blocks/Hero/config.ts:35`), added in Phase 10.8 — BUT `src/blocks/Hero/Component.tsx:46` only renders it `if (isListing && breadcrumbs...)`, i.e. **only on the `Listing` Hero variant.** Service landings use the default/hero variant, so breadcrumbs are authored-but-invisible there today. This is the single biggest lever for the breadcrumb feature: the plumbing exists, the render gate is the blocker.
- **No `BreadcrumbList` JSON-LD anywhere** — the existing Hero breadcrumb is presentational markup (`<nav aria-label="Breadcrumb">`), not structured data. GEO/SEO value (the reason breadcrumbs matter in 2026) requires adding the schema, which is net-new.
- **Home is a `home`-slug `pages` doc** rendered through `RenderBlocks`. A "services showcase on Home" is a new block (or a reused card-grid) inserted into that doc's `layout` array — it must be Payload-editable like every other block.
- **Reusable social-proof/showcase blocks already exist:** `ResultsSection` (KPI/metric cards), `TestimonialSection` + `TestimonialsCarousel`, `ClientLogosBlock`, `FeaturedCaseStudiesBlock`, `AboutSection`, `Section`. A service page that "looks premium" can be assembled largely from these rather than new components.
- **`CallToAction` already has a shader variant** (quick-task commits `f76678f`/`7e4c521`) — the premium final-CTA is a restyle/reuse, not a new build.
- Design system: shadcn "new-york" primitives, ember-orange `--primary` (`#FF5B1F`) + navy `--secondary`, Inter + Fraunces pairing. Card/CardContent + elevation tokens established in Phase 7/8/10.

## Competitor Evidence (concrete, cited)

| Competitor | Service pages? | Breadcrumbs? | Pricing? | Services showcase pattern | Social proof stack |
|-----------|----------------|--------------|----------|---------------------------|--------------------|
| **Arianna Lupi** (ariannalupi.com — Juan's named direct competitor) | **No** — single-page anchor nav (`#sobre`, `#marcas`, `#resultados`); services are 3 cards in a homepage "Consultoría" section, each with an inline CTA ("Hablemos") | **No** | No (contact-to-quote) | 3 service cards on home → single contact form as the one conversion gateway; case studies are separate `/casos/` pages with metric-in-headline | Media "Featured In" logos (Ahrefs, Google), 12 client logos, quantified metrics ($2M+ organic revenue), 12+ named testimonials w/ dates+locations, awards, speaking timeline |
| **Aleyda Solis** (aleydasolis.com — top-tier technical SEO consultant) | **No** — consulting lives in a homepage "Consultoría SEO" section pointing at her agency Orainti | **No** | No | Single "Consultoría SEO" section + "Marcas que confían" 6-logo strip; repeated "Solicita Consultoría SEO" CTA throughout | 5 detailed exec testimonials w/ specific results ("500% SEO traffic growth"), award badges, Forbes mention, "200+ conferences in 30 countries", 45K newsletter count |

**Reading of the evidence:** Both top direct competitors run flat single-page sites with **no dedicated service pages and no breadcrumbs.** That is not a gap Juan should copy — it is his opening. Dedicated, individually-URL'd service landings with breadcrumbs and `BreadcrumbList` schema are a **structural SEO/GEO differentiator** the competition is leaving on the table, and it's exactly the "SEO built into the code" story Juan sells. The polish target is: match their social-proof density (where Juan is currently thin) while beating their information architecture.

## Feature Landscape

### Table Stakes (Users Expect These)

A prospect evaluating a technical consultant penalizes a service page for missing these — they read as "unfinished" or "less serious than the competition."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Service-page anatomy: H1 → pain/problem → what's included → how I work (process) → proof → FAQ → final CTA | Validated landing-page convention and the structure Phase 19 already authored copy against; a page missing the "process" or "proof" beat reads like a brochure, not a consultant | LOW-MEDIUM | Section order already exists in seeded `Content` blocks; work is making each beat visually distinct (not one undifferentiated rich-text wall) using existing block styles |
| One primary CTA repeated top + bottom (mid-page if long), identical action/label | Landing-page best practice; a service page whose only CTA is buried at the bottom leaks intent. Both competitors repeat their contact CTA throughout | LOW | `CallToAction` block exists (incl. shader variant); ensure the Hero also carries a CTA link so the top of every service page has one |
| Value proposition answering "what / who / why-trust-me" in the first screen | The 4-question test (what is it, who needs it, why trust you) is the fastest qualifier; Juan's Hero subtitle carries pain framing but must also carry the trust hook | LOW | Restyle Hero subtitle + add a compact trust signal (years/credential/stack badge) near the H1 |
| Social proof on the service page itself (not only on Home) | Both competitors put testimonials/logos/metrics on the same surface as the offer; a service page with zero proof underperforms. E-E-A-T + buyer trust | MEDIUM | Reuse `TestimonialSection`, `ClientLogosBlock`, or `ResultsSection` inside the service page `layout` — content-model already supports it, needs seeding + placement |
| Breadcrumbs on Services index + each landing (visual trail near top) | Expected on any multi-level site section; orients the user and is a known SEO/GEO signal. Google removed *visual* mobile breadcrumbs Jan 2025 but increased reliance on the *data* for AI Overviews/crawlers | LOW-MEDIUM | The Hero `breadcrumbs` field exists but is gated to the `Listing` variant — either ungate it for service pages or render a dedicated breadcrumb component above the Hero. Home → Servicios → [Service] trail |
| `BreadcrumbList` JSON-LD structured data matching the visual trail | In 2026 the schema is the load-bearing part (GEO/AI Overviews); visual-only breadcrumbs miss most of the value. One cited case: losing breadcrumb schema dropped organic CTR ~40%, restored within 3 weeks | LOW | Net-new; emit JSON-LD from the service route (`position`/`name`/`item` triples). Pairs with the visual breadcrumb, single source of truth from the page's place in the hierarchy |
| A services showcase on Home linking to the 4 landings | With landings now existing, Home must surface them (Phase 21 added the nav link; a visual showcase is the on-page equivalent). Both competitors show services as a card cluster on home | LOW-MEDIUM | New Payload-editable block OR reuse the Phase-10 Card grid; 4 cards (name + 1-line + link). Anti-duplication: pull from `SERVICE_SLUGS`, don't hand-list |
| Mobile-first parity for all the above at 375px | Table stakes; breadcrumbs and card grids are the two patterns most likely to break/reflow badly on mobile | LOW-MEDIUM | Simplified mobile breadcrumb ("‹ Servicios") with the full path still in schema is the accepted 2026 pattern |

### Differentiators (Competitive Advantage)

Where Juan beats Arianna Lupi / Aleyda Solis rather than matching them. Should map to the Core Value: *proving* engineering + SEO expertise through the execution itself.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dedicated, individually-URL'd service landings **with** breadcrumbs + schema | Both top competitors run flat single-page sites with no service URLs and no breadcrumbs — Juan's per-service pages are a real IA/SEO/GEO edge and demonstrate the "SEO in the code" pitch tangibly | LOW (pages exist) | The differentiator is *already half-built*; polishing + schema turns an existing asset into a competitive weapon. Highest ROI item in the milestone |
| "SEO for AI/GEO" service page citing live `/llms.txt` + `/llms-full.txt` as proof | No competitor names GEO as a service line, let alone links working proof on their own domain. Show-don't-tell of the exact expertise being sold | LOW | Already seeded (Phase 19 D-05); polish = make the proof links visually prominent, not buried in prose |
| Process shown as an explicit numbered/stepped visual (discovery → audit → implementation → measurement) | Buyers "want to know what happens next"; a visual process beat separates a consultant from a freelancer. Competitors state services but rarely diagram the engagement | MEDIUM | Could be a light new component or a styled `Content`/`Section` treatment; keep it CSS-driven, no heavy JS (Core Value = performance) |
| Value framing that substitutes for price (scope/outcome/timeline signals) without listing a number | 3 of 4 audited competitors publish no price; the winning move is to reduce quote anxiety with "what an engagement looks like" instead of a table. Differentiates from agencies that hide everything | MEDIUM | Copy + light UI (e.g. an "engagement at a glance" card): typical duration, deliverables, who it's for — no currency figures (PROJECT.md hard rule) |
| Metric-in-headline case-study cards surfaced *from* the service page | Arianna's strongest pattern is the metric headline ($41K→$76K); linking a relevant case study directly from each service closes the proof loop competitors leave open | LOW-MEDIUM | `FeaturedCaseStudiesBlock` exists; wire a per-service related case study into each landing |
| Consistent premium visual system carried onto service pages (ember/navy, Fraunces display, elevation, shader CTA) | The site's own polish is the portfolio; a service page that looks templated undercuts a "senior engineer" claim more than thin copy does | MEDIUM | Reuse established tokens/blocks; the risk is inconsistency between Phase-19 fast-built pages and the Phase 7-10 polished ones |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Pricing tables / "from $X" tiers on service pages | "Transparency," easier lead qualification | Violates PROJECT.md hard rule (no prices); 3 of 4 competitors publish none because it commoditizes a bespoke technical engagement and invites price-shopping SMBs (not Juan's ICP) | Value-framing card (scope/outcome/timeline, no number) — see differentiators |
| A new `Services` collection to power the pages | Feels "more correct" than reusing `Pages` | Duplicates migration + admin UI + slug/meta/localization plumbing for zero functional gain; already rejected as Key Decision D-01 and would fight the existing seeded pages | Keep the `pages`-collection model; add blocks, not collections |
| A bespoke animation/scroll library for "premium feel" (framer-motion, GSAP, Lenis) | Modern sites feel animated; wants the pages to pop | Core Value says the site fails if performance fails; a heavy client-JS dependency for a marketing polish pass is a CWV regression risk (same reasoning that killed three.js in v1.3) | CSS transitions / `tailwindcss-animate` / IntersectionObserver micro-interactions only; budget-check anything heavier |
| Breadcrumbs on *every* page including Home and top-level pages | "Consistency" | Breadcrumbs on a root/1-level page are noise (a Home crumb pointing at itself); they earn their place only in a real hierarchy like Servicios → [Service] | Scope breadcrumbs to the Services section (and later Blog/Case-Studies sub-pages), not sitewide-flat pages |
| A full mega-menu / dropdown listing all services in the header | Competitors have rich nav; wants discoverability | Over-engineered for 4 services on a solo portfolio; adds a nav component to maintain and a mobile-menu complication for little gain over the Home showcase + `/services` index | Single "Servicios" nav link (already added Phase 21) → index page + Home showcase block |
| Rewriting all service copy during a *visual* polish pass | Pages could always read better | Scope creep; Phase 19 already authored grounded, differentiator-aware copy in both locales. Re-authoring risks regressions and blows the milestone | Restyle/reflow existing copy into distinct visual beats; only touch copy where a section genuinely lacks a required beat (e.g. missing trust hook) |

## Feature Dependencies

```
Service landings exist (Phase 19) ──enables──> Home services showcase (needs real URLs to link)
                                  ──enables──> Breadcrumbs on service pages
                                  ──enables──> Per-service related case-study card

Visual breadcrumb (ungate Hero field OR new component)
        └──requires──> decision: reuse gated Hero.breadcrumbs vs dedicated component
        └──pairs-with──> BreadcrumbList JSON-LD (same hierarchy source)

Home services showcase block
        └──requires──> SERVICE_SLUGS as single source (no hand-listed cards)
        └──reuses────> Phase-10 Card grid + elevation tokens

Premium service-page look
        └──reuses────> ResultsSection / TestimonialSection / ClientLogosBlock / shader CallToAction
        └──requires──> social-proof content seeded onto the service docs
```

### Dependency Notes

- **Home showcase requires real service URLs:** already satisfied (Phase 19 shipped them); this is why the showcase belongs in v1.5, not earlier.
- **Visual breadcrumb + JSON-LD share one hierarchy source:** build the crumb trail once (Home → Servicios → [Service]) and feed both the `<nav>` and the schema from it, to avoid drift (the drift is itself an SEO bug).
- **Reusing the gated Hero.breadcrumbs field vs a new component is the key roadmap fork:** ungating (rendering breadcrumbs on the hero variant, not just Listing) is lower-effort and keeps them Payload-editable, but touches a shared block used everywhere — regression-check other Hero usages. A dedicated breadcrumb component above the Hero is more isolated but adds a component and a second breadcrumb authoring surface.
- **Social-proof-on-service-page requires content, not just layout:** the blocks exist, but the testimonials/logos/metrics have to be placed into each service doc's `layout` and seeded — a content task riding on a component task.

## MVP Definition

### Launch With (v1.5 first phases — Home + Services, per PROJECT.md priority)

- [ ] Breadcrumbs (visual + `BreadcrumbList` JSON-LD) on Services index + 4 landings — highest-ROI differentiator, half-built already
- [ ] Home services showcase block (4 cards from `SERVICE_SLUGS` → landings) — the Home-side of the Phase-19 offering
- [ ] Service-page visual polish: distinct H1/pain/includes/process/proof/FAQ/CTA beats using existing blocks + tokens
- [ ] Social proof surfaced on service pages (reuse TestimonialSection/ClientLogos/ResultsSection) — closes the biggest gap vs Arianna/Aleyda
- [ ] Repeated primary CTA (Hero top + shader CallToAction bottom) on every service landing

### Add After Validation (later v1.5 phases)

- [ ] Explicit visual "process/engagement" component (numbered steps) — trigger: after core service pages look premium and the beat still reads flat
- [ ] Value-framing "engagement at a glance" card (scope/outcome/timeline, no price) — trigger: if contact-form intent from service pages is low
- [ ] Per-service related case-study card via `FeaturedCaseStudiesBlock` — trigger: once matching case studies are confirmed to exist

### Future Consideration (subsequent milestones — flagged, not built now)

- [ ] Polish pass on Case Studies / Blog / Author templates — explicitly deferred to later phases in PROJECT.md; flag opportunities during the Services pass, don't build
- [ ] Breadcrumbs extended to Blog/Case-Studies sub-pages — same schema mechanism, different section
- [ ] Dark-mode brand-token fix (v1.1 finding: `.dark` still ships generic shadcn grays) — carry-over debt, out of Services/Home scope

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Breadcrumbs (visual + JSON-LD) on service pages | HIGH | LOW-MEDIUM | P1 |
| Home services showcase block | HIGH | LOW-MEDIUM | P1 |
| Service-page beat/visual-hierarchy polish | HIGH | MEDIUM | P1 |
| Social proof on service pages | HIGH | MEDIUM | P1 |
| Repeated primary CTA on service pages | MEDIUM | LOW | P1 |
| Visual process/engagement component | MEDIUM | MEDIUM | P2 |
| Value-framing (no-price) card | MEDIUM | MEDIUM | P2 |
| Per-service related case-study card | MEDIUM | LOW-MEDIUM | P2 |
| Case-Studies/Blog/Author polish | MEDIUM | HIGH | P3 (later milestone) |

## Competitor Feature Analysis

| Feature | Arianna Lupi | Aleyda Solis | Our Approach |
|---------|--------------|--------------|--------------|
| Dedicated service pages | Homepage cards only, no URLs | Homepage section only, no URLs | **Individually-URL'd landings (already built)** — our IA edge |
| Breadcrumbs | None | None | Visual + `BreadcrumbList` schema — a differentiator, not a copy |
| Pricing | Contact-to-quote | Contact-to-quote | No price (match) + value-framing card instead of a table |
| Home services showcase | 3 cards → contact form | 1 section → agency | 4 cards from `SERVICE_SLUGS` → dedicated landings |
| Social proof density | Very high (logos, 12 testimonials, metrics, awards) | Very high (exec testimonials w/ %s, awards, conf count) | **Match on the service pages** via existing blocks — current weakest spot |
| GEO/AI-search proof | None | None (has tools) | "SEO for AI/GEO" page linking live `/llms.txt` — unique |
| Nav to services | Anchor scroll | Anchor scroll | Real "Servicios" nav link (Phase 21) + index page |

## Sources

- ariannalupi.com — live fetch 2026-07-12 (Juan's named direct competitor): single-page anchor nav, 3-card services section, no breadcrumbs, no pricing, high social-proof density, `/casos/` metric-headline case studies — MEDIUM
- aleydasolis.com — live fetch 2026-07-12 (top-tier technical SEO consultant): homepage "Consultoría SEO" section, no dedicated service pages, no breadcrumbs, no pricing, exec testimonials with quantified results — MEDIUM
- involve.me / rankmath.com / taap.bio service-page & landing-page anatomy guidance (WebSearch 2026-07-12): hero→UVP→benefits→social-proof→process→CTA structure, repeat-CTA rule, 4-question value test — MEDIUM
- Breadcrumb UX/SEO 2026 guidance (searchengineland.com, yotpo.com, seranking.com via WebSearch 2026-07-12): near-top horizontal placement, JSON-LD `BreadcrumbList` (`position`/`name`/`item`), Jan-2025 mobile visual removal but increased schema reliance for AI Overviews/GEO, simplified-mobile-crumb-with-full-schema pattern, ~40% CTR drop case on schema loss — LOW-MEDIUM (CTR figure single-sourced)
- Developer/engineer portfolio guidance (hostinger.com, resumly.ai, freecodecamp.org via WebSearch 2026-07-12): 3-5 curated projects, case studies with problem/process/outcome, testimonials, availability CTA, minimalist clarity over excess — MEDIUM
- Direct codebase inspection (HIGH): `src/lib/services-data.ts`, `src/blocks/Hero/config.ts:35` + `Component.tsx:46` (breadcrumbs gated to Listing variant), `src/blocks/` inventory, `.planning/milestones/v1.4-phases/19-service-pages/19-CONTEXT.md` (Phase 19 decisions D-01..D-07), `.planning/PROJECT.md` (v1.5 goal, no-price hard rule, Key Decisions)

---
*Feature research for: v1.5 UI/UX Pro Max — service pages, breadcrumbs, home services showcase*
*Researched: 2026-07-12*
