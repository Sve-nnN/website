# Feature Research

**Domain:** Developer/technical-consultant "work I've built" portfolio showcase (distinct from client-results case studies)
**Researched:** 2026-07-14
**Confidence:** MEDIUM (WebSearch-verified across multiple sources; no single authoritative spec exists for this pattern — it's a community convention, not a standard)

## Context: What This Is Distinct From

Juan already has `CaseStudies` (challenge/solution/results/KPIs, sometimes anonymized — the *storytelling/results* angle) and `Clientes` (logo-only credibility strip). The gap he's naming is a **technical build showcase**: "I personally built this, here's the stack, here's the real Lighthouse score, here's a real screenshot." This is the developer-portfolio pattern (Brittany Chiang-style "Projects" grids, agency "Our Work" showcases), not the case-study pattern. The research below treats `Websites` as its own content type with its own conventions, cross-linked to `Clientes`/`CaseStudies` rather than duplicating their fields.

## Feature Landscape

### Table Stakes (Users Expect These)

Fields/sections visitors assume exist on any "projects built" showcase. Missing these makes it read as a résumé bullet list, not a portfolio.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live URL / link to the actual site | The entire point of a build showcase is "go look at it yourself" — no live link reads as unverifiable | LOW | Already planned (`liveUrl`). Should open in new tab, and ideally get a small "visit site ↗" affordance, not just a bare hyperlink. |
| Real screenshot(s) of the site | Visitors judge design/craft visually before reading anything; text-only listings underperform | LOW–MEDIUM | Already planned. Recommend at least hero/above-fold + one more (mobile view or a key page) — a single screenshot feels thin for a dev-focused audience that will zoom into UI details. |
| Tech stack tags | Recruiters/prospects scan for stack fit in seconds — "a tidy, honest stack section tells a visitor at a glance whether you fit" | LOW | Already planned (`stack` as tags). Render as visual badges (icons/pills), not a paragraph — scanability is the value, not prose. |
| Short description of what was built / for whom | Bare links with no context force the visitor to reverse-engineer the site's purpose | LOW | Needs a `summary`/`description` field distinct from `challenges` — one or two sentences of "what it is," separate from the deeper technical narrative. |
| Project title + client/brand name | Baseline identification — can't scan a grid of unlabeled screenshots | LOW | Site name as the entry title; optional client name shown even when the `Clientes` link isn't set (some sites won't have a formal client, e.g. Juan's own properties). |
| Year / launch date | Visitors calibrate "is this current work or legacy" — an unlabeled older project reads as stale if mistaken for recent | LOW | Already planned (año de lanzamiento). Sort listing by this descending by default. |
| Role on the project | Disambiguates "I designed and coded this end-to-end" vs. "I was the dev on someone else's design" — credibility depends on this being explicit | LOW | Already planned (rol). Keep as a small enum (e.g. Design+Dev+SEO / Dev only / Dev+SEO), rendered as a badge near the title. |
| Grid/listing page with detail pages | Standard portfolio IA: overview grid → click into full detail. Users expect two clicks (grid → live demo), not one wall of text | LOW–MEDIUM | Matches what's already planned (listing + detail page), consistent with the existing `case-studies`/`posts` patterns in the codebase. |

### Differentiators (Competitive Advantage)

Not universal, but this is exactly where a technical-SEO-consultant-who-also-codes gets to stand out — most agency portfolios don't have real, verifiable performance data, and most solo-dev portfolios don't connect the build to a business outcome.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real Lighthouse scores (Performance/Accessibility/Best Practices/SEO) | This is Juan's actual differentiator — almost no dev or SEO consultant portfolio publishes real, current Lighthouse numbers per project. A concrete, falsifiable performance claim is rare and credible | LOW–MEDIUM | Already planned. Render as 4 scored gauges/badges (matching the PageSpeed Insights UI convention visitors already recognize). **Caveat:** scores decay — add a `scoresCapturedAt` date field so stale numbers aren't presented as current. |
| Technical highlights (SSR/ISR/headless/edge/etc.) | Speaks directly to the dev-hiring audience — "how" it was built, not just "what" — reinforces the engineering-expertise core value of the whole site | LOW | Already planned. Present as a short bullet list or tag row, separate from generic `stack` tags (stack = tools used, highlights = architectural decisions made). |
| Challenges array (same pattern as CaseStudies.challenge) | Turns a static portfolio entry into a mini engineering narrative — "here's a real problem I solved," which is what technical hiring managers/prospects actually probe for | LOW (pattern reuse) | Already planned, reuses an existing schema pattern — low implementation risk since the array-field shape already exists in `CaseStudies`. |
| Cross-link to `Clientes` (optional) | Lets a visitor go from "cool site" → "who's the client" → into the logo carousel/credibility context, without forcing every Website to have a formal client | LOW | Optional relationship, nullable — Juan's own properties (e.g. juan-tech.com) won't have a client. |
| Cross-link to `CaseStudies` (optional) | The single highest-leverage differentiator: a visitor reading "I built this site" can jump directly to "and here's the measurable business result it produced" — bridges the technical-build story and the results story without merging the two collections | LOW–MEDIUM | This is the connective tissue Juan is implicitly asking for ("¿cómo lo hacen los demás?") — most agency sites either merge these into one bloated collection or never link them at all. Keeping them separate-but-linked is the differentiator. |
| Industry/niche tag | Lets a visitor mentally filter ("has this person built for X industry before") — valuable for prospects self-qualifying | LOW | Already planned (industria/nicho). Don't over-engineer into a filterable UI for only 6 entries — a plain tag/badge is enough at this volume (see Anti-Features). |
| Filterable/sortable listing (by stack or industry) | Agencies with dozens of projects use this to help prospects self-serve to relevant examples | MEDIUM | **Defer.** Valuable at scale (20+ entries), but with only 6 real websites at launch, client-side filtering adds engineering cost for zero practical benefit — a plain grid with visible tags already satisfies scanability. Revisit if the collection grows past ~12-15 entries. |
| GitHub repo link | Standard on dev-portfolio sites when the codebase is open source or the code itself is worth showing | LOW | Optional field, likely null for most/all of Juan's 6 sites since these are client/personal production sites, not open-source demos. Include the field but don't force population. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|----------------|------------------|-------------|
| Merging `Websites` into `CaseStudies` (one mega-collection) | Feels like less duplication, "why have two similar collections" | Conflates two different reader intents — "prove you get results" (case study) vs. "prove you can build well" (technical showcase). Forcing both into one schema either bloats every case study with irrelevant Lighthouse/stack fields, or bloats every website entry with results/KPI fields that don't apply (not every built site has a measurable business result, e.g. personal projects) | Keep them as separate collections with an optional bidirectional relationship field — exactly what's already planned. This mirrors the existing, already-validated decision to keep `Clientes` (logos) separate from `CaseStudies` (narrative). |
| Live embedded iframe preview of each site instead of a static screenshot | Feels "more real" than a screenshot | Real performance/security cost: iframing arbitrary third-party sites can break (`X-Frame-Options`), tanks the showcase page's own Lighthouse score (a page about performance that itself loads slowly), and adds no real information over a well-chosen screenshot plus a live link | Static screenshot(s) (already planned) + the real `liveUrl` link for anyone who wants to click through and experience it live |
| Auto-fetching live Lighthouse scores on every page load (real-time API call) | "Always up to date" sounds appealing | Violates the project's explicit "no live SEO tooling / dashboards" architectural boundary (CLAUDE.md Out of Scope), adds an external API dependency plus latency plus failure modes to a public page, and turns a marketing/portfolio field into a fragile integration | Capture Lighthouse scores manually/periodically as static editorial data (already the plan) with a `scoresCapturedAt` timestamp so the number's freshness is transparent, not silently stale |
| Full case-study-style KPI/results section on every Website entry | Symmetry with CaseStudies feels tidy | Most personal/technical builds don't have attributable business KPIs (e.g., Juan's own juan-tech.com has no "client revenue lift" to report) — forcing the field either produces fake-feeling metrics or a lot of empty/N/A fields in admin | Leave results/KPI storytelling in `CaseStudies` where it belongs; `Websites` stays technical-build-focused. Use the optional `CaseStudies` relation to point to a KPI story when one legitimately exists for that site. |
| Tag-based filter UI, star ratings, "featured" badges, testimonials-per-project, pricing-per-project | Common in generic portfolio-builder templates/plugins | Over-engineering for 6 launch entries; testimonials/pricing duplicate what `Clientes`/`Testimonials`/`Services` already do elsewhere on the site; adds admin surface and design work disproportionate to the content volume | Plain grid, visible metadata badges, and the optional cross-links already specified — resist adding filtering/rating UI until volume genuinely warrants it |

## Feature Dependencies

```
Websites collection (schema)
    └──requires──> Media collection + Cloudinary adapter (already exists)
                       └──screenshots stored as Media relation/upload

Websites.stack (tags)
    └──enhances──> Websites listing scanability (badge rendering)

Websites.clienteRelation (optional)
    └──requires──> Clientes collection (already exists)

Websites.caseStudyRelation (optional)
    └──requires──> CaseStudies collection (already exists)

Websites listing page + Home section
    └──follows pattern of──> FeaturedCaseStudiesBlock / FeaturedContent global (already exists)

Filterable/sortable listing UI ──deferred until──> collection grows past ~12-15 entries

Lighthouse scores (static fields)
    └──conflicts with──> live SEO tooling / real-time API integration (explicitly Out of Scope per CLAUDE.md)
```

### Dependency Notes

- **Websites requires Media/Cloudinary:** screenshots must go through the same Cloudinary-backed upload path already built for the rest of the site — no new storage work needed, just new Media relations on the new collection.
- **Websites.clienteRelation / caseStudyRelation are both optional, not required:** several of Juan's 6 real sites (his own properties) will have no formal client and possibly no linked case study. The schema must allow both relations to be null without breaking the detail page layout — the template needs conditional rendering, not required fields.
- **Listing/Home pattern reuses FeaturedCaseStudiesBlock:** minimizes new UI patterns; Juan already has an established "featured X on Home + full listing + detail page" convention across Posts and CaseStudies — Websites should follow it exactly rather than invent a new IA.
- **Lighthouse scores conflict with live tooling:** this is a hard architectural boundary already set for the whole rebuild (no GSCMetrics/dinorank-style live dashboards). Scores must be captured and stored as static editorial data at population time, not fetched live.

## MVP Definition

### Launch With (v1 — this milestone, v1.9)

- [ ] `Websites` collection: slug, `liveUrl`, `stack` (tags), `summary`/description, screenshots (Media, at least 1, ideally 2+), `challenges` (array), Lighthouse scores (4 metrics) + `scoresCapturedAt`, año de lanzamiento, rol, industria/nicho, technical highlights (tags/bullets), optional relation to `Clientes`, optional relation to `CaseStudies` — this is essentially what Juan already scoped; the research confirms every field is table-stakes-or-differentiator, none is scope creep
- [ ] Listing page (`/websites` or `/proyectos`, dual-locale consistent with the `/servicios`+`/services` pattern) — why essential: no showcase without a browsable index
- [ ] Detail page per site — why essential: this is where the technical narrative (challenges, stack, highlights, scores) actually lives; the grid alone can't carry that content
- [ ] Home section (featured subset, following the `FeaturedCaseStudiesBlock` pattern) — why essential: Juan explicitly wants this visible on Home, matching how case studies/posts already surface
- [ ] Populate with the 6 real sites, stack confirmed interactively per Juan's explicit instruction — why essential: stated requirement, and accuracy here is the whole credibility point of the feature

### Add After Validation (v1.x)

- [ ] GitHub repo link field population (where applicable/open-source) — trigger: only if/when a future site is open-sourced or a code sample is worth linking
- [ ] Re-audit cadence for Lighthouse scores (quarterly manual refresh) — trigger: once scores are live and Juan wants to keep them from visibly aging
- [ ] Cross-link surfacing on `CaseStudies` detail pages back to the related `Websites` entry (currently the relation could be one-directional in UI even if bidirectional in schema) — trigger: once both collections are populated and the reverse-link value is validated with real traffic/behavior

### Future Consideration (v2+)

- [ ] Filterable/sortable listing UI by stack or industry — defer until the collection meaningfully exceeds ~12-15 entries; not worth the engineering cost for 6
- [ ] Live embedded previews / interactive demos — explicitly avoided per Anti-Features, revisit only if a strong concrete use case emerges (unlikely)
- [ ] Per-project testimonial or rating widget — defer indefinitely; duplicates existing `Testimonials`/`Clientes` mechanisms

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `Websites` collection core schema (liveUrl, stack, summary, screenshots) | HIGH | LOW | P1 |
| Lighthouse scores + capture date | HIGH (Juan's real differentiator) | LOW | P1 |
| Challenges array | HIGH | LOW | P1 |
| Rol / año / industria fields | MEDIUM | LOW | P1 |
| Optional Clientes/CaseStudies relations | HIGH (connective differentiator) | LOW–MEDIUM | P1 |
| Listing + detail pages | HIGH | MEDIUM | P1 |
| Home featured section | MEDIUM–HIGH | LOW (pattern reuse) | P1 |
| GitHub repo link | LOW | LOW | P3 |
| Filterable/sortable listing UI | LOW at current volume | MEDIUM | P3 |
| Live/real-time Lighthouse integration | LOW (violates scope) | HIGH | Rejected |
| Embedded iframe previews | LOW | MEDIUM–HIGH | Rejected |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Solo-dev portfolios (e.g. Brittany Chiang-style) | Agency "Our Work" showcases | Our Approach |
|---------|---------------------------------------------------|------------------------------|--------------|
| Live link + screenshot | Standard, near-universal | Standard, often with case-study framing bundled in | Standard, kept lean (no bundling with results narrative) |
| Real performance data (Lighthouse) | Rare — most solo-dev portfolios skip this entirely | Almost never published per-project | Included and made prominent — the actual gap in the market Juan is positioned to fill |
| Tech stack tags | Standard | Sometimes present, often vague ("modern stack") | Explicit, specific tags per site — reinforces engineering-expertise core value |
| Client/results tie-in | Rare (solo portfolios often don't have "clients") | Standard, but usually merged into one case-study format (no separation of build-showcase vs. results-story) | Deliberately separated: `Websites` = technical build proof, `CaseStudies` = results proof, linked but distinct — matches the earlier validated `Clientes` vs. `CaseStudies` split decision |
| Filterable grid | Uncommon at small scale, common at agency scale (20+ projects) | Standard at agency scale | Deferred — 6 entries doesn't justify it yet |

## Sources

- [12 Software Developer Portfolio Examples (2026)](https://sitesplaced.com/software-developer-portfolio-examples) — MEDIUM confidence
- [Top 10 Tips to Evaluate Freelance Developer Portfolios](https://www.index.dev/blog/evaluate-freelance-developer-portfolio) — MEDIUM confidence
- [Developer Portfolio Guide 2026 — Hakia](https://hakia.com/skills/building-portfolio/) — MEDIUM confidence
- [Freelance portfolio that wins for software engineers in 2026 — Resumly](https://www.resumly.ai/blog/freelance-portfolio-that-wins-for-software-engineers-in-2026) — MEDIUM confidence
- [SEO Case Studies, SEO Portfolio & SEO Pricing — Coalition Technologies](https://coalitiontechnologies.com/portfolio) — MEDIUM confidence
- [SEO Portfolios: 15+ Well-Designed Examples (2026) — Sitebuilder Report](https://www.sitebuilderreport.com/inspiration/seo-portfolios) — MEDIUM confidence
- [9 Best SEO Portfolio Examples — Jay Search](https://jaysearch.com/blog/seo-portfolio-examples) — MEDIUM confidence
- [SEO Portfolio Guide: Build Skills, Case Studies & Proof of Success — AI for Marketings](https://aiformarketings.com/blog/seo-portfolio-guide/) — LOW-MEDIUM confidence (single-source claims about portfolio structure)
- Existing project context: `.planning/PROJECT.md` — established `Clientes` vs. `CaseStudies` separation decision (HIGH confidence, internal source) — used as precedent for the `Websites` vs. `CaseStudies` split recommendation

---
*Feature research for: developer/technical-consultant portfolio "websites built" showcase*
*Researched: 2026-07-14*
