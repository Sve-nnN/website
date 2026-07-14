# Project Research Summary — v1.9 Websites Portfolio Section

**Project:** Juan Carlos Angulo Portfolio (Payload rebuild) — milestone v1.9
**Domain:** New Payload collection for a developer/technical "Websites I've built" showcase, distinct from the existing `CaseStudies` (results narrative) and `Clientes` (logo credibility) collections
**Researched:** 2026-07-14
**Confidence:** HIGH (stack and architecture grounded in direct code read; features MEDIUM via community-convention research; pitfalls MEDIUM-HIGH)

## Executive Summary

v1.9 adds a `Websites` collection to showcase six real, live sites Juan built, each with real stack tags, real Lighthouse scores, and real screenshots. This is the technical-execution counterpart to `CaseStudies` (which tells the results/story angle) — the research confirms these should stay separate, optionally cross-linked collections, matching the precedent already set by the `Clientes`/`CaseStudies` split. No new npm packages are needed: `lighthouse`, `chrome-launcher`, `@puppeteer/browsers`, `playwright`, and the existing Cloudinary media pipeline are already installed and already proven end-to-end by working scripts in this repo (`scripts/lighthouse-mobile.mjs`, `scripts/spike-cloudinary-upload.ts`).

The recommended approach is almost entirely additive: a new collection (`src/collections/Websites/`) following the exact shape of `CaseStudies`, a dedicated `FeaturedWebsitesBlock` for the Home curated section (never a hardcoded inline JSX section), an extension of the existing `ArchiveBlock`'s `relationTo` options (never a new "PortfolioArchiveBlock"), a new listing+detail route pair mirroring `/case-studies`, and a `CreativeWork` JSON-LD type (not `SoftwareApplication`, which is schema.org misuse for a marketing/client site). Content population (screenshots + Lighthouse capture for the 6 real sites) is a one-time manual/scripted task, run once — not a live monitoring or auto-refresh system, which would violate the project's explicit "no live SEO tooling" architectural boundary.

Key risks: (1) Lighthouse scores and screenshots captured once but displayed as if permanently current — mitigated by a mandatory `capturedAt` date field on both; (2) `Websites` and `CaseStudies` drifting into duplicated or contradictory facts for the same site with no cross-link — mitigated by an explicit content rule (which collection owns which facts) decided before seeding; (3) wrong relationship cardinality (`client`/`caseStudy` fields must be optional, `hasMany: false`) since several of the 6 sites are Juan's own/agency properties with no formal client; (4) shipping the wrong JSON-LD type on a site whose entire core value proposition is SEO correctness. All four are cheap to prevent in the schema/collection-design phase and expensive to retrofit once real content exists.

## Key Findings

### Recommended Stack

Zero new packages. Everything is already installed and already validated end-to-end by existing scripts in this repo.

**Core technologies:**
- `payload` 3.85.2 — new `Websites` collection config, same modeling pattern as `CaseStudies` (tags, arrays, relationships) — no new API surface
- `lighthouse` 13.4.0 + `chrome-launcher` 1.2.1 + `@puppeteer/browsers` 3.0.6 — programmatic real Lighthouse audits against each site's live URL, cloning the proven pattern in `scripts/lighthouse-mobile.mjs`
- `playwright` 1.61.1 (chromium already downloaded/cached) — real full-page screenshots of each external live site, more robust than scraping/hosted screenshot APIs
- Existing `Media` collection + `cloudinaryAdapter` — screenshots upload through the same proven Cloudinary path as `scripts/spike-cloudinary-upload.ts`, no new storage integration

### Expected Features

**Must have (table stakes):**
- Live URL link, real screenshot(s), tech-stack tags (rendered as badges), short summary/description, project title, launch year, role on project, listing + detail page pair

**Should have (competitive differentiators):**
- Real Lighthouse scores (4 metrics) — Juan's actual market differentiator, almost no dev/SEO consultant portfolio publishes real current numbers — with a mandatory `scoresCapturedAt` field
- Technical highlights (architecture decisions, distinct from generic stack tags)
- Challenges array (reuses the existing `CaseStudies.challenge` array pattern — low implementation risk)
- Optional cross-link to `Clientes` and optional cross-link to `CaseStudies` — the highest-leverage differentiator, bridges "I built this" with "and here's the measurable result," while keeping the two collections separate

**Defer (v2+):**
- Filterable/sortable listing by stack or industry (not worth it at 6 entries; revisit past ~12-15)
- Live embedded iframe previews (real perf/security cost, rejected)
- Live/real-time Lighthouse API integration (violates the project's "no live SEO tooling" boundary)
- GitHub repo link population, quarterly re-audit cadence, bidirectional cross-link UI surfacing — all fine to add later, none block launch

### Architecture Approach

Purely additive to an already-established convention set. New `Websites` collection registered in `payload.config.ts` and `seoPlugin`'s `collections[]`; a dedicated `FeaturedWebsitesBlock` reading a new `featuredWebsites` field on the `FeaturedContent` global (never hardcoded into the Home route); `ArchiveBlock` extended with a `'websites'` `relationTo` option (never a new block slug — this is an explicit, documented convention in this codebase); new `/websites` + `/websites/[slug]` routes mirroring the `case-studies` route pair exactly, including a `buildWebsitesTrail()` breadcrumb wrapper; relationships to `Clientes` and `CaseStudies` kept optional and one-directional (no symmetric back-references, following the same precedent already set for `Clientes` ↔ `CaseStudies`).

**Major components:**
1. `Websites` collection (`src/collections/Websites/index.ts`) — owns all website-portfolio data; hard prerequisite for everything else
2. `WebsiteCard` component — shared across the Home block, `ArchiveBlock` grid, and listing page
3. `FeaturedWebsitesBlock` + `FeaturedContent.featuredWebsites` — curated Home showcase, following the exact `FeaturedCaseStudiesBlock` pattern
4. `/websites` + `/websites/[slug]` routes with `CreativeWork` JSON-LD (not `SoftwareApplication`) + `buildWebsitesTrail()` breadcrumbs

### Critical Pitfalls

1. **Lighthouse scores/screenshots captured once, presented as current forever** — add a mandatory `capturedAt` date field to both, render it visibly in the UI, never build live/scheduled re-audit infra for a 6-entry portfolio.
2. **Automated/recurring screenshot capture of external live sites (ToS/rate-limit/client-relations risk)** — capture manually, once, as static Cloudinary assets; never fetch `liveUrl` live at request time (no iframe, no live screenshot API call).
3. **`Websites` and `CaseStudies` drifting into duplicated or contradictory facts** — write the content rule before seeding (which collection is source of truth for shared facts), cross-link both directions in the UI once both exist for a site.
4. **Wrong relationship cardinality** — `client` and `relatedCaseStudy` must be optional, `hasMany: false`; several of the 6 real sites (Juan's own/agency properties) will have no client. Verify at least one seeded doc proves optionality renders correctly.
5. **Wrong/missing JSON-LD type** — use `CreativeWork`, not `SoftwareApplication` (that type is for downloadable/installable apps, not client marketing sites); validate with Google's Rich Results Test before the milestone's audit gate.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Schema & Collection Design
**Rationale:** Everything downstream (block, routes, seeding) depends on the `Websites` collection existing with the right field shapes, cardinalities, and dates. This is also where the cheapest-to-prevent pitfalls (missing `capturedAt`, wrong relationship cardinality, content-duplication rule) must be locked in — expensive to retrofit once real docs exist.
**Delivers:** `src/collections/Websites/index.ts` registered in `payload.config.ts` + `seoPlugin`, `payload generate:types` run, `Clientes`/`CaseStudies` relationship fields set optional/`hasMany:false`, `lighthouseCapturedAt`/screenshot-captured-date fields added.
**Addresses:** Core schema fields from FEATURES.md (liveUrl, stack, summary, challenges, Lighthouse+date, year, role, industry, technical highlights, optional relations).
**Avoids:** Pitfall 1 (stale-scores-as-current), Pitfall 3 (content duplication — write the rule here), Pitfall 4 (wrong relationship cardinality).

### Phase 2: Frontend Components & Routes
**Rationale:** Once the schema exists, build the reusable rendering layer (card, block, routes) that all consumers share — following the codebase's established extend-don't-fork conventions (ArchiveBlock, FeaturedContent-driven blocks, shared breadcrumb builder).
**Delivers:** `WebsiteCard`, `FeaturedWebsitesBlock` (config+Component, registered in `blockRegistry.tsx`), `ArchiveBlock` extended with `'websites'` relationTo, `/websites` + `/websites/[slug]` routes with `buildWebsitesTrail()` breadcrumbs and `CreativeWork` JSON-LD, sitemap extension.
**Uses:** Stack elements from STACK.md are irrelevant here (no new packages) — this phase is pure code reuse of existing Payload/Next.js patterns.
**Implements:** Architecture components 2-4 (WebsiteCard, FeaturedWebsitesBlock, routes+JSON-LD).

### Phase 3: Content Population (Real Data Capture)
**Rationale:** Content seeding is independent of the code phases once the schema is live (Local API / admin data-entry task, not a code change) but should run last so the manual capture work (screenshots, Lighthouse) targets a stable, already-typed schema, and so the content-duplication check against existing `CaseStudies` docs happens with the cross-link field already available.
**Delivers:** 6 real `Websites` docs (ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com) with real stack (confirmed interactively with Juan), real screenshots uploaded via Cloudinary/Media, real Lighthouse scores with capture dates, cross-links to `Clientes`/`CaseStudies` populated where applicable.
**Uses:** `lighthouse`+`chrome-launcher`+`@puppeteer/browsers` (cloned from `scripts/lighthouse-mobile.mjs`) and `playwright` (new capture script following `scripts/spike-cloudinary-upload.ts`'s Local-API-create → Cloudinary-upload pattern).
**Delivers:** the actual credibility payload of the milestone — accuracy here is the whole point.

### Phase Ordering Rationale

- Schema must exist before any code that queries it (routes, block, card) or any content that fills it — hard dependency, confirmed by ARCHITECTURE.md's suggested build order.
- Frontend components before content population is a soft preference, not a hard dependency — content seeding is a Local API task independent of the frontend code, but sequencing it last means capture scripts and cross-link decisions are made against a UI that's already rendering, making it easy to visually verify each seeded doc immediately.
- This ordering surfaces Pitfall 1, 3, and 4 in Phase 1 (schema-time, cheap fix) rather than Phase 3 (content-time, expensive retrofit) — consistent with PITFALLS.md's own phase-mapping recommendation.
- Pitfall 2 (screenshot ToS/automation risk) and Pitfall 5 (JSON-LD type) are explicitly scoped to Phase 3 and Phase 2 respectively by PITFALLS.md's own "Phase to address" column.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Content Population):** LOW confidence specifically on per-site ToS status of the 6 target external sites for screenshot capture (PITFALLS.md flags this as needing a manual judgment call from Juan, not further research) — confirm before scripting the capture loop, and confirm Payload 3.85's `join` field support if a reverse-lookup UI ("case studies related to this website") is wanted instead of manual querying.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema):** Directly mirrors the already-proven `CaseStudies` collection shape — no new Payload concepts.
- **Phase 2 (Frontend/Routes):** Directly mirrors the already-proven `case-studies` route pair, `ArchiveBlock` extension pattern, and `FeaturedCaseStudiesBlock` pattern — all read from real code in this repo, HIGH confidence.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages; every tool already installed, versioned, and proven working by existing scripts (`lighthouse-mobile.mjs`, `spike-cloudinary-upload.ts`) in this exact repo |
| Features | MEDIUM | WebSearch-verified across multiple developer/agency portfolio sources, but no single authoritative spec exists for this content-type pattern — it's community convention, not a standard |
| Architecture | HIGH | Grounded in direct read of real code in this repo (`CaseStudies`, `ArchiveBlock`, `FeaturedCaseStudiesBlock`, `FeaturedContent`, `breadcrumbs.ts`), not inferred |
| Pitfalls | MEDIUM-HIGH | Strong on schema/architecture pitfalls (grounded in PROJECT.md + real code); MEDIUM specifically on screenshot-ToS legality (industry-blog sources, not legal authority) and per-site ToS status (needs Juan's manual judgment, not research) |

**Overall confidence:** HIGH

### Gaps to Address

- Per-site ToS/client-relationship status for screenshot capture of the 6 external sites — flag for Juan's own judgment call before the capture script runs (not resolvable by research).
- Payload 3.85's `join` field type availability for reverse-lookup UI (case studies pointing back to a related website) — verify against official Payload docs during Phase 1 if a bidirectional-feeling UI is desired without duplicating the relationship field.
- `src/lib/sitemap-data.ts`'s exact shape was not directly inspected in ARCHITECTURE.md's research pass — confirm its structure before extending it with `websites` URLs in Phase 2.
- Schema.org `CreativeWork` JSON-LD choice is a reasoned judgment, not verified against Google's live Rich Results Test tool — validate during Phase 2 before the milestone's audit gate.

## Sources

### Primary (HIGH confidence)
- Direct code read (this repo, 2026-07-14): `src/collections/CaseStudies/index.ts`, `src/collections/Clientes/index.ts`, `src/blocks/ArchiveBlock/*`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx`, `src/globals/FeaturedContent/index.ts`, `src/blocks/blockRegistry.tsx`, `src/lib/breadcrumbs.ts`, `src/app/(frontend)/[locale]/case-studies/*`, `src/payload.config.ts`
- Local repo inspection: `package.json`, `scripts/lighthouse-mobile.mjs`, `scripts/spike-cloudinary-upload.ts`, `src/lib/cloudinary-adapter.ts`
- `npm view` live registry query (2026-07-14): confirmed current versions of `lighthouse`, `playwright`, `chrome-launcher`, `@puppeteer/browsers`, `cloudinary` match what's installed
- `.planning/PROJECT.md` — milestone v1.9 scope, `Clientes`/`CaseStudies` precedent, non-localized-field bug history
- schema.org/CreativeWork, schema.org/SoftwareApplication — authoritative type definitions

### Secondary (MEDIUM confidence)
- Developer/SEO portfolio feature-landscape research (sitesplaced.com, index.dev, hakia.com, resumly.ai, coalitiontechnologies.com, sitebuilderreport.com, jaysearch.com) — community convention, no single authoritative spec
- Screenshot legality industry blogs (screenshotone.com, capturekit.dev) — consistent with general ToS/copyright consensus, not a legal authority

### Tertiary (LOW confidence)
- Per-site ToS status of the 6 real target sites for screenshot capture — needs manual verification/judgment by Juan, not resolvable via research
- Payload 3.85 `join` field type support for reverse relationship lookups — general knowledge, not independently re-verified against official Payload 3.85 docs this session

---
*Research completed: 2026-07-14*
*Ready for roadmap: yes*
