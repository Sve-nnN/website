# Architecture Research

**Domain:** New `Websites` portfolio collection integration into an existing Payload 3 + Next.js 15 codebase (v1.9 milestone)
**Researched:** 2026-07-14
**Confidence:** HIGH (grounded in direct read of the real code — `src/collections/CaseStudies`, `src/blocks/ArchiveBlock`, `src/blocks/FeaturedCaseStudiesBlock`, `src/globals/FeaturedContent`, `src/lib/breadcrumbs.ts`, `src/app/(frontend)/[locale]/case-studies/*` — not inferred from training data)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Payload Admin (schema)                       │
│  src/collections/Websites/index.ts  (NEW)                            │
│  src/collections/Clientes, CaseStudies  (existing, cross-referenced) │
├───────────────────────────────────────────────────────────────────────┤
│                         Global curation layer                        │
│  src/globals/FeaturedContent  → add `featuredWebsites` field (NEW)    │
├───────────────────────────────────────────────────────────────────────┤
│                         Block layer (rendering)                      │
│  ┌───────────────────────┐   ┌────────────────────────────────────┐  │
│  │ FeaturedWebsitesBlock │   │ ArchiveBlock (extend relationTo)    │  │
│  │ (NEW, Home-only)      │   │ (MODIFY, generic grid, reused for   │  │
│  │                       │   │  /websites listing page if desired) │  │
│  └───────────────────────┘   └────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────┤
│                         Route layer (App Router)                     │
│  /[locale]/websites            (NEW, listing)                        │
│  /[locale]/websites/[slug]     (NEW, detail)                         │
├───────────────────────────────────────────────────────────────────────┤
│                         Cross-reference layer                        │
│  Websites.client → Clientes (optional)                                │
│  Websites.relatedCaseStudy → CaseStudies (optional)                   │
│  CaseStudies could optionally back-reference Websites (NOT required)  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation (this codebase's convention) |
|-----------|----------------|------------------------|
| `Websites` collection | Owns all website-portfolio data (stack, screenshots, Lighthouse, challenges, links) | New file `src/collections/Websites/index.ts`, registered in `src/payload.config.ts` `collections: []` array, same shape as `CaseStudies` |
| `FeaturedContent` global | Manual curation of what shows in "featured" sections on Home | Add one `featuredWebsites` relationship field (`hasMany: true`, `relationTo: 'websites'`), mirroring `featuredCaseStudies`/`featuredPosts` |
| `FeaturedWebsitesBlock` | Dedicated Home-only rendering of curated websites | New block dir `src/blocks/FeaturedWebsitesBlock/{config.ts,Component.tsx}`, structurally a clone of `FeaturedCaseStudiesBlock` reading `featuredContent.featuredWebsites` |
| `ArchiveBlock` | Generic "grid of N docs from a collection" reusable across Pages | MODIFY: add `'websites'` to the `relationTo` select options and to `selectedDocs.relationTo` array — do not create `WebsitesArchiveBlock` |
| `/websites` route | Full listing page (all published websites, not just curated) | New `page.tsx`, same pattern as `/case-studies/page.tsx`: `payload.find({ collection: 'websites' })` + breadcrumb trail + JSON-LD |
| `/websites/[slug]` route | Detail page per website | New `page.tsx`, same pattern as `/case-studies/[slug]/page.tsx`: fetch by slug, render sections, emit JSON-LD |
| `WebsiteCard` component | Card used in grids (Home block, Archive grid, listing page) | New `src/components/WebsiteCard.tsx`, sibling to `CaseStudyCard`/`PostCard` |
| `breadcrumbs.ts` | Single source of trail-building logic | MODIFY: add `'websites'` to the `Section` union, `SECTION_LABELS`, `SECTION_SEGMENTS`, and export `buildWebsitesTrail()` as a third thin wrapper around `buildSectionTrail()` |

## Recommended Project Structure

```
src/
├── collections/
│   └── Websites/
│       └── index.ts                       # NEW — collection config
├── globals/
│   └── FeaturedContent/
│       └── index.ts                       # MODIFY — add featuredWebsites field
├── blocks/
│   ├── FeaturedWebsitesBlock/
│   │   ├── config.ts                      # NEW
│   │   └── Component.tsx                  # NEW
│   ├── ArchiveBlock/
│   │   ├── config.ts                      # MODIFY — extend relationTo options
│   │   └── Component.tsx                  # MODIFY — extend docs union type + card switch
│   └── blockRegistry.tsx                  # MODIFY — register featuredWebsitesBlock slug
├── components/
│   └── WebsiteCard.tsx                    # NEW — sibling to CaseStudyCard/PostCard
├── lib/
│   └── breadcrumbs.ts                     # MODIFY — add 'websites' Section + buildWebsitesTrail()
├── app/(frontend)/[locale]/
│   ├── websites/
│   │   ├── page.tsx                       # NEW — listing
│   │   └── [slug]/
│   │       └── page.tsx                   # NEW — detail
└── payload.config.ts                      # MODIFY — register Websites collection, seoPlugin collections[]
```

### Structure Rationale

- **`src/collections/Websites/`:** Mirrors the `CaseStudies` collection's own directory shape (a folder with `index.ts`), not a flat file — matches existing sibling collections that have grown fields over time (`CaseStudies`, `Clientes`).
- **`src/blocks/FeaturedWebsitesBlock/`:** The codebase has an established, explicit convention (see code comment in `FeaturedContent/index.ts` and the existing `FeaturedCaseStudiesBlock`/`FeaturedPostsBlock` pair) that curated Home sections get their OWN small dedicated block reading a `FeaturedContent` relationship field — never a generic block. `Websites` must follow this, not deviate into a one-off inline Home section.
- **`ArchiveBlock` modification, not a new block:** The project has a code comment that is effectively a binding convention: *"Any future 'grid of N items from a collection' need MUST extend this select's options — never spawn a new block slug (RESEARCH.md Pitfall 5)."* Adding `Websites` as a third `relationTo` option is required by that precedent, mirroring how `enableCategoryFilter` was added as a conditional sibling field for the `posts` case in phase 05-03.
- **`src/lib/breadcrumbs.ts`:** Already generalized into a private `buildSectionTrail()` with two public thin wrappers (`buildTrail` for services, `buildCaseStudiesTrail` for case studies). Adding `buildWebsitesTrail()` is a 3-line addition, following the exact established pattern — do not hand-roll breadcrumb logic inline in the new pages.

## Architectural Patterns

### Pattern 1: FeaturedContent-driven dedicated Home block

**What:** A global (`FeaturedContent`) holds editor-curated relationship fields per content type. Each field is consumed by exactly one small, purpose-built block component that queries `findGlobal` and renders a fixed grid — it is NOT a configurable/generic block with a `relationTo` selector.
**When to use:** Any time a new content type needs a hand-picked (not "latest N") showcase on Home.
**Trade-offs:** More files (one block per content type) vs. one generic block, but each block stays trivial (~35 lines) and the curation UX in admin is a single global doc editors already know. This is the established, explicit convention here — do not fight it with a "smarter" unified block.

**Example (adapted from `FeaturedCaseStudiesBlock/Component.tsx`):**
```typescript
export async function FeaturedWebsitesBlockComponent(props: FeaturedWebsitesBlockProps) {
  const { title, limit } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  const featuredContent = await payload.findGlobal({ slug: 'featured-content', depth: 1, locale })
  const websites = (featuredContent.featuredWebsites ?? [])
    .filter((w): w is Website => typeof w === 'object')
    .slice(0, limit ?? 3)

  if (websites.length === 0) return null
  // render grid of WebsiteCard
}
```

### Pattern 2: Extend `ArchiveBlock` for a new collection type instead of new block slug

**What:** `ArchiveBlock` is a Payload `Block` with a `relationTo` select (`posts` | `case-studies`) plus `mode` (latest/manual), `selectedDocs` relationship (multi-collection), and per-type conditional admin fields (e.g. `enableCategoryFilter` gated on `relationTo === 'posts'`). The renderer (`Component.tsx`) branches on `relationTo` to pick the right card component.
**When to use:** Whenever a Pages document (or any block-consuming doc) needs an editor-configurable grid of N docs from `websites` — e.g. if Juan wants a "Featured Websites" section embeddable inside an arbitrary Page, not just the fixed Home slot.
**Trade-offs:** Every new `relationTo` option means updating: the `options` array, the `selectedDocs.relationTo` array, the TS union in `Component.tsx` (`(Post | CaseStudy | Website)[]`), and adding a `WebsiteCard` branch. This is more central-file churn than a standalone block, but it is the codebase's explicit, documented convention — deviating creates a second, competing "archive" pattern.

**Example (diff sketch of `config.ts`):**
```typescript
options: [
  { label: 'Posts', value: 'posts' },
  { label: 'Case Studies', value: 'case-studies' },
  { label: 'Websites', value: 'websites' },   // NEW
],
// ...
relationTo: ['posts', 'case-studies', 'websites'],  // selectedDocs, NEW
```

### Pattern 3: Section-trail breadcrumbs via shared `buildSectionTrail()`

**What:** A private generic `buildSectionTrail(locale, section, current?)` builds a 2- or 3-level breadcrumb array from per-section label/segment lookup tables. Public functions (`buildTrail`, `buildCaseStudiesTrail`) are thin, byte-compatible wrappers so call sites never duplicate URL/locale logic.
**When to use:** Any new top-level content section with an index + detail page (exactly the `Websites` shape: `/websites` + `/websites/[slug]`).
**Trade-offs:** None significant — purely additive, no runtime cost, keeps SEO-critical `BreadcrumbList` JSON-LD and visible breadcrumbs from drifting apart (a bug class the codebase already hit and fixed once, see `buildBreadcrumbJsonLd` comment).

**Example:**
```typescript
type Section = 'services' | 'case-studies' | 'websites'  // add 'websites'

const SECTION_LABELS: Record<Section, Record<Locale, string>> = {
  // ...
  websites: { es: 'Sitios web', en: 'Websites' },
}
const SECTION_SEGMENTS: Record<Section, Record<Locale, string>> = {
  // ...
  websites: { es: 'websites', en: 'websites' },  // no locale-specific segment needed, matches case-studies precedent
}

export function buildWebsitesTrail(locale: Locale, current?: { slug: string; title: string }) {
  return buildSectionTrail(locale, 'websites', current)
}
```

## Data Flow

### Request Flow (detail page)

```
GET /[locale]/websites/[slug]
    ↓
page.tsx → payload.find({ collection: 'websites', where: { slug }, locale, depth: 1 })
    ↓                                              ↓
Website doc (stack, screenshots, lighthouse,   client (Clientes, optional, depth 1)
challenges array, relatedCaseStudy relation)   relatedCaseStudy (CaseStudies, optional)
    ↓
Render: hero (screenshot + liveUrl + role badge) → stack tags → Lighthouse score cards
  → challenges list (same array-of-text-items pattern as CaseStudies.challenge)
  → optional "related case study" CTA card (reuse RelatedCaseStudyBlock pattern if it already
    renders a CaseStudy summary card — check before building a new component)
  → optional client logo/link (from Clientes)
    ↓
JsonLd: SoftwareApplication (see recommendation below) + BreadcrumbList (buildWebsitesTrail)
```

### Featured / Home Flow

```
Editor curates FeaturedContent.featuredWebsites (Payload admin)
    ↓
Home page's Pages doc includes a `featuredWebsitesBlock` in its `layout`/`blocks` array
  (or the block renders unconditionally on Home if it follows the exact FeaturedCaseStudiesBlock
  precedent, which IS embedded as a page block, not hardcoded into the Home route — verify by
  reading src/app/(frontend)/[locale]/page.tsx and the Home Pages doc's blocks array before
  assuming either)
    ↓
FeaturedWebsitesBlockComponent → findGlobal('featured-content') → filter/slice → WebsiteCard grid
```

### Key Data Flows

1. **Curated Home showcase:** `FeaturedContent` global → `FeaturedWebsitesBlock` → `WebsiteCard[]`. Manual, editor-controlled, independent of publish recency.
2. **Full listing / generic archive:** `Websites` collection queried directly (either the dedicated `/websites` route with `sort: '-publishedAt'`-equivalent, or an embedded `ArchiveBlock` with `relationTo: 'websites'` inside any Page). Both paths read the same collection; no duplication of query logic if the listing route reuses `ArchiveBlockComponent`'s query shape (recommend reusing, not reimplementing, the `payload.find` call structure).
3. **Cross-reference enrichment:** `Websites.client` → `Clientes` (optional, same relationship pattern as `CaseStudies.client`) and `Websites.relatedCaseStudy` → `CaseStudies` (optional, one-directional — do NOT add a reverse `Website` relationship field on `CaseStudies` unless a concrete UI need for it emerges; the codebase's own `Clientes` doc comment explicitly warns against symmetric back-references it doesn't need: *"that relationship lives on CaseStudies pointing back to Clientes, not the other way around"*).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 6 real websites (current target) | No pagination needed anywhere; `limit: 50` (as used in `/case-studies`) is more than sufficient. Single flat grid, no category/stack filtering UI required at launch. |
| 15-30 websites (plausible future growth) | Consider a `stack` tag filter on the `/websites` listing, mirroring the existing `enableCategoryFilter` pattern already built for `posts` in `ArchiveBlock` — same conditional-admin-field approach, applied to `websites` if/when this becomes real. |
| 100+ websites | Unlikely for a personal portfolio; not worth designing for now. If it happened, it would need real pagination (`page` param) which none of `posts`/`case-studies` currently implement either — a project-wide gap, not `Websites`-specific. |

### Scaling Priorities

1. **First bottleneck:** none at target scale (6 items). No action needed.
2. **Second bottleneck:** if stack/tag filtering is requested later, extend the same `enableCategoryFilter`-style conditional field rather than inventing a new mechanism.

## Anti-Patterns

### Anti-Pattern 1: New generic "PortfolioArchiveBlock" for Websites

**What people do:** Build a new dedicated block that duplicates `ArchiveBlock`'s grid/mode/limit logic but scoped to `websites`.
**Why it's wrong:** Directly contradicts the codebase's own documented convention (comment in `ArchiveBlock/config.ts`, referencing "RESEARCH.md Pitfall 5") to extend the existing `relationTo` select instead of spawning new block slugs. Creates two parallel "grid of N docs" mechanisms editors have to understand.
**Do this instead:** Add `'websites'` to `ArchiveBlock`'s `relationTo` options and `selectedDocs.relationTo` array; branch the renderer's card selection on `relationTo === 'websites'`.

### Anti-Pattern 2: Hardcoding the Featured Websites section into the Home route instead of a block

**What people do:** Since `Websites` is a "new concept," build its Home appearance as a one-off inline JSX section in `page.tsx` rather than a page block.
**Why it's wrong:** Breaks the FeaturedContent-driven block pattern that both `FeaturedCaseStudiesBlock` and `FeaturedPostsBlock` follow — loses editor control over placement/ordering within Home's `blocks` layout, and loses the `title`/`limit` admin-configurable fields those sibling blocks expose.
**Do this instead:** Build `FeaturedWebsitesBlock` as a real Payload block (config + Component), register it in `blockRegistry.tsx`, and let the Home `Pages` doc's blocks array include it like its siblings.

### Anti-Pattern 3: Symmetric bidirectional relationship between Websites and CaseStudies

**What people do:** Add a `relatedWebsite` field on `CaseStudies` in addition to `relatedCaseStudy` on `Websites`, "for convenience/discoverability both ways."
**Why it's wrong:** The codebase explicitly rejected this exact shape for `Clientes ↔ CaseStudies` (one-directional by design, documented in a code comment) to avoid two collections both owning the same conceptual edge and needing to stay in sync. `CaseStudies` schema is also already large; adding fields to it for a feature that only needs to be navigable one way (Website detail page linking out to its case study) is unnecessary churn to a document type outside this milestone's scope.
**Do this instead:** Keep the relationship one-directional: `Websites.relatedCaseStudy → case-studies`. If a case study ever needs to show "this became a full website," query it as `payload.find({ collection: 'websites', where: { relatedCaseStudy: { equals: caseStudy.id } } })` at render time — no schema change needed.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudinary (existing media pipeline) | `Websites.screenshots` field as `upload`/`array of upload` → `media` collection, same as `CaseStudies.heroImage` | No new integration — reuses the already-wired Cloudinary storage adapter on `Media`. Real screenshots for the 6 sites need to be captured/uploaded manually or via a small script (not part of architecture, but flag as a build-order dependency: screenshots must exist before seeding). |
| Lighthouse scores | Static editorial number fields (`performance`, `accessibility`, `bestPractices`, `seo`), NOT a live API integration | Consistent with the project's hard "no live SEO tooling" constraint (CLAUDE.md: dinorank/GSC integrations are out of scope as *live* integrations). Scores are captured once (Juan runs Lighthouse manually or via CLI per site) and entered as data, same treatment as `targetKeyword` in v1.2. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `Websites` ↔ `Clientes` | Payload `relationship` field, `hasMany: false`, optional | Same shape as `CaseStudies.client`. |
| `Websites` ↔ `CaseStudies` | Payload `relationship` field (`relatedCaseStudy`), one-directional, optional | See Anti-Pattern 3 — do not add reverse field on `CaseStudies`. |
| `FeaturedContent` global ↔ `FeaturedWebsitesBlock` | `findGlobal('featured-content')` at render time, depth 1 | Mirrors `FeaturedCaseStudiesBlockComponent` exactly. |
| `ArchiveBlock` ↔ `Websites` | `payload.find({ collection: 'websites', ... })` inside the existing shared component, gated by `relationTo === 'websites'` | Requires a `WebsiteCard` render branch alongside the existing `PostCard`/`CaseStudyCard` branches. |
| `seoPlugin` ↔ `Websites` | Add `'websites'` to `seoPlugin({ collections: [...] })` in `payload.config.ts` | Needed for the `meta` tab (title/description/OG) on Website detail pages, matching how `case-studies` and `authors` were added to this list in earlier phases. |
| `sitemap` ↔ `Websites` | Extend whatever sitemap-data source already enumerates `posts`/`case-studies`/`authors` (see `src/lib/sitemap-data.ts`, imported by `breadcrumbs.ts` as `SITE_URL`) to include `websites` URLs | Not yet inspected in this research pass — flag as a concrete follow-up check during implementation (the file exists and is already the sitemap's data source; confirm its shape before extending). |

## JSON-LD Type Recommendation

**Recommendation: `SoftwareApplication` is the wrong fit. Use `CreativeWork`, matching the existing `CaseStudies` precedent — with `WebSite` considered only as a secondary/nested entity, not the primary type.**

Reasoning:
- `SoftwareApplication` (schema.org) is meant for downloadable/installable software (apps, plugins, SaaS products with `applicationCategory`, `operatingSystem` properties) — a *website Juan built for a client* is not "an application," it is a creative/professional work product. Using it would be schema misuse likely to confuse Google's structured-data validators and does not match how dev-portfolio case-study pages typically markup this content type.
- `CaseStudies` in this exact codebase already uses `{'@type': 'CreativeWork', name, about}` for conceptually the same kind of entity (a project Juan did). Websites are the same category of "thing Juan produced," just with a stack/dev framing instead of a results/story framing. Consistency with the established `CreativeWork` pattern is both simpler and defensible.
- `WebSite` (schema.org) is the correct type for describing *the live site itself* as an entity (it has `url`, and pairs with `SearchAction` for sitelinks-searchbox — irrelevant here). It could be used as a nested/secondary node (e.g. inside `CreativeWork.about` or a separate small `WebSite` JSON-LD block pointing at `liveUrl`), but should not replace `CreativeWork` as the primary type for the detail page, since the *page itself* is Juan's portfolio content describing the site, not the site's own home page being marked up.

**Recommended shape** (extending the existing `creativeWorkData` pattern from `case-studies/[slug]/page.tsx`):
```typescript
const websiteWorkData = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: doc.title,
  about: doc.industry ?? doc.stack?.map((s) => s.value).join(', '),
  url: doc.liveUrl,
  creator: { '@type': 'Person', name: 'Juan Carlos Angulo' },
}
```
Confidence: MEDIUM — this is a reasoned schema.org-fit judgment (not verified against a live Google Rich Results test), consistent with the codebase's own established `CreativeWork` precedent for the conceptually nearest existing collection (`CaseStudies`). Flag for validation via Google's Rich Results Test tool during implementation, same as any new structured-data type added to this project.

## Suggested Build Order

1. **`Websites` collection** (`src/collections/Websites/index.ts`) — register in `payload.config.ts` `collections[]` and `seoPlugin({ collections: [...] })`. Generate types (`payload generate:types`). This unblocks everything downstream.
2. **`slugField()`** reuse (same as `CaseStudies`) for the collection's URL slug.
3. **`WebsiteCard` component** (`src/components/WebsiteCard.tsx`) — needed by both the block and the routes; build once, reuse in all three consumers.
4. **`/websites` + `/websites/[slug]` routes** — mirror `case-studies` route pair exactly (query pattern, `generateMetadata`, JSON-LD, breadcrumbs). Extend `breadcrumbs.ts` with `buildWebsitesTrail()` first (small, additive, needed by both routes).
5. **`ArchiveBlock` extension** — add `'websites'` to `relationTo`/`selectedDocs` options, extend the `Component.tsx` union type and card-selection branch. Independent of steps 3-4 but benefits from `WebsiteCard` already existing.
6. **`FeaturedContent` global** — add `featuredWebsites` relationship field. Small, additive, no migration risk (new nullable relationship field).
7. **`FeaturedWebsitesBlock`** (config + Component) — depends on step 6 (reads the global field) and step 3 (`WebsiteCard`). Register in `blockRegistry.tsx`.
8. **Sitemap extension** — confirm `src/lib/sitemap-data.ts` shape, add `websites` enumeration.
9. **Content seeding** — populate the 6 real sites (ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com), confirming stack per site interactively with Juan as the milestone note requires, plus real screenshots (Cloudinary upload) and real Lighthouse scores — this depends on steps 1-2 (schema must exist) but can run in parallel with steps 3-8 once the collection is live, since it's a Local API / admin-UI data-entry task, not a code change.

Steps 1-2 are a hard prerequisite for everything else. Steps 3-8 have some internal ordering (noted above) but are otherwise parallelizable across phases. Step 9 (content) should not block steps 3-8 (code) — schema-then-seed is safe because `Websites` is a brand-new collection (no existing rows, no migration risk of the kind flagged in the Database Safety incident from v1.4).

## Sources

- Direct code read (this repository, 2026-07-14): `src/collections/CaseStudies/index.ts`, `src/collections/Clientes/index.ts`, `src/blocks/ArchiveBlock/config.ts`, `src/blocks/ArchiveBlock/Component.tsx`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx`, `src/globals/FeaturedContent/index.ts`, `src/blocks/blockRegistry.tsx`, `src/lib/breadcrumbs.ts`, `src/app/(frontend)/[locale]/case-studies/page.tsx`, `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx`, `src/payload.config.ts` — HIGH confidence, these are the actual conventions in force, not inferred.
- `.planning/PROJECT.md` (this project) — milestone scope, target features, Key Decisions log (esp. the Clientes/CaseStudies one-directional relationship precedent) — HIGH.
- schema.org type reasoning (`CreativeWork` vs `SoftwareApplication` vs `WebSite`) — MEDIUM, reasoned judgment consistent with existing codebase precedent, not verified against Google's live Rich Results Test tool; flag for validation during implementation.

---
*Architecture research for: Websites Portfolio Section (v1.9 milestone)*
*Researched: 2026-07-14*
