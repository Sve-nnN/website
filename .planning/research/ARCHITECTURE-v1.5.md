# Architecture Research — v1.5 (UI/UX Pro Max)

**Domain:** Payload CMS (v3.85) blocks architecture + Next.js 15 App Router, bilingual EN/ES with dual URL segments — integrating a shared Breadcrumbs component and a new `ServicesShowcase` block
**Researched:** 2026-07-12
**Confidence:** HIGH (verified against the real codebase, not training data)

> Scoped to the v1.5 milestone. The v1 project-level architecture lives in `ARCHITECTURE.md` (do not clobber). This file mirrors the `STACK-v1.5.md` naming convention.

## Standard Architecture

This milestone slots into an **already-established** two-layer content pipeline. Nothing here is greenfield — the job is to add one shared UI component (Breadcrumbs) and one new block (ServicesShowcase) into existing, well-defined seams.

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  ROUTING LAYER — src/app/(frontend)/[locale]/                          │
│  next-intl: defaultLocale 'es' (unprefixed), 'en' prefixed (/en/...)   │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ services/  │ │ servicios/ │ │ services/    │ │ servicios/       │  │
│  │ page.tsx   │ │ page.tsx   │ │ [slug]/page  │ │ [slug]/page      │  │
│  │ (EN index) │ │ (ES index) │ │ (EN landing) │ │ (ES landing)     │  │
│  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ └────────┬─────────┘  │
│        └──────────────┴───────────────┴──────────────────┘            │
│                    all call ↓ (shared data layer)                     │
├──────────────────────────────────────────────────────────────────────┤
│  DATA LAYER — src/lib/services-data.ts                                 │
│  SERVICE_SLUGS (4 fixed) · getServicesIndexPage() · getServicePage()   │
│  → Payload Local API (getPayload) → pages collection @ locale          │
├──────────────────────────────────────────────────────────────────────┤
│  RENDER LAYER — src/blocks/RenderBlocks.tsx                            │
│  blockType → Component map. Reads pages.content.layout[] blocks array. │
│  ┌──────┐ ┌────────┐ ┌─────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Hero │ │Content │ │ FAQ │ │ CallToAction │ │ *ServicesShowcase* │  │
│  └──────┘ └────────┘ └─────┘ └──────────────┘ └────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  CMS LAYER — Payload pages collection (src/collections/Pages/index.ts) │
│  content.layout: blocks[] (17 registered blocks) · slugField()         │
│  Globals: FeaturedContent (curation), Header/Footer                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `src/lib/services-data.ts` | Single source of truth for the 4 service slugs + fetch helpers | `SERVICE_SLUGS`, `getServicePage`, `getServicesIndexPage` — **extend here** for showcase + breadcrumb labels |
| `src/blocks/RenderBlocks.tsx` | Maps `blockType` → React renderer | `blockComponents` record — **add one line** for `servicesShowcase` |
| `src/collections/Pages/index.ts` | Declares which blocks are allowed in `content.layout` | `blocks: [...]` array — **add one import + one entry** |
| `src/blocks/Hero/{config,Component}` | Hero block; **already has a manual `breadcrumbs` array field** on `listing` variant | Precedent for breadcrumb visual markup — but not the recommended path (see below) |
| Page `.tsx` files under `[locale]/services*` | Fetch doc, render blocks, emit JSON-LD | **Mount point** for the shared Breadcrumbs component |
| `src/lib/sitemap-data.ts` | Enumerates docs → URLs with es/en alternates | Already encodes the dual-segment rule — **new blocks do NOT affect it** |

## Recommended Project Structure

```
src/
├── components/
│   └── Breadcrumbs.tsx          # NEW — shared visual <nav> trail (server component)
├── lib/
│   ├── services-data.ts         # MODIFY — add getServicesShowcaseData(locale)
│   └── breadcrumbs.ts           # NEW — buildTrail(locale, segments) + buildBreadcrumbJsonLd()
├── blocks/
│   ├── ServicesShowcase/        # NEW block (mirrors FeaturedCaseStudiesBlock layout)
│   │   ├── config.ts            #   Block schema (slug 'servicesShowcase')
│   │   └── Component.tsx        #   Server renderer — reads 4 services at locale
│   └── RenderBlocks.tsx         # MODIFY — register servicesShowcase in blockComponents
├── collections/Pages/index.ts   # MODIFY — import + add ServicesShowcase to blocks[]
└── app/(frontend)/[locale]/
    ├── services/page.tsx         # MODIFY — mount <Breadcrumbs> + BreadcrumbList JSON-LD
    ├── services/[slug]/page.tsx  # MODIFY — same
    ├── servicios/page.tsx        # MODIFY — same (ES segment)
    └── servicios/[slug]/page.tsx # MODIFY — same (ES segment)
```

### Structure Rationale

- **`components/Breadcrumbs.tsx` (not a Payload field):** the service set is fixed (`SERVICE_SLUGS`) and labels come from the page `title`. A template-owned component means editors never hand-type breadcrumb URLs — exactly the class of bug already hit twice on this project (Header.navItems id collision, CallToAction non-localized). Path-based trails cannot drift out of sync with routing.
- **`lib/breadcrumbs.ts`:** the `BreadcrumbList` JSON-LD is currently duplicated inline in `case-studies/[slug]/page.tsx:93` and `authors/[slug]/page.tsx:163`. Centralizing here lets the new Services pages reuse it (and optionally lets those two be refactored to call it — out of scope unless the polish pass touches them).
- **`ServicesShowcase/` mirrors `FeaturedCaseStudiesBlock/`:** two files (`config.ts` + `Component.tsx`), same as every other block. Consistency with the existing 17-block pattern beats inventing a new shape.

## Architectural Patterns

### Pattern 1: Three-touchpoint block registration (MANDATORY for ServicesShowcase)

**What:** Every Payload block requires edits in exactly three places, plus type regen.
**When to use:** Adding `ServicesShowcase`.
**Trade-offs:** Slightly ceremonial, but the `RenderBlocks` warning path (`RenderBlocks.tsx:77`) makes a missed registration loud in dev.

**Steps:**
```ts
// 1. src/blocks/ServicesShowcase/config.ts
export const ServicesShowcase: Block = {
  slug: 'servicesShowcase',
  interfaceName: 'ServicesShowcaseBlock',
  labels: { singular: 'Services Showcase', plural: 'Services Showcases' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'title', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    // No service-list field: the 4 services are fixed (SERVICE_SLUGS).
    // Only editorial framing is per-instance, like FeaturedCaseStudiesBlock.
  ],
}

// 2. src/collections/Pages/index.ts — import + add to blocks: [...]
// 3. src/blocks/RenderBlocks.tsx — blockComponents.servicesShowcase = ServicesShowcaseComponent
// 4. `payload generate:types` then `payload migrate:create` (additive) → `payload migrate`
```

### Pattern 2: Fixed-set data block reading a source of truth at render time

**What:** `FeaturedCaseStudiesBlock`/`FeaturedPostsBlock` read the `FeaturedContent` global at render; they store only framing (title/limit) on the block. ServicesShowcase should do the same but read the **fixed** `SERVICE_SLUGS` (no global needed — the set never changes).
**When to use:** ServicesShowcase Component.
**Trade-offs:** The showcase auto-reflects the 4 service pages' titles/subtitles; editors can't reorder without touching `SERVICE_SLUGS`. That's the correct constraint for a fixed offering.

**Example:**
```ts
// src/lib/services-data.ts (add)
export async function getServicesShowcaseData(locale: 'es' | 'en') {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { in: SERVICE_SLUGS as unknown as string[] } },
    locale, depth: 1, limit: SERVICE_SLUGS.length,
  })
  // Return in SERVICE_SLUGS order; component builds locale-correct hrefs.
  return SERVICE_SLUGS.map((s) => docs.find((d) => d.slug === s)).filter(Boolean)
}
```

### Pattern 3: Locale-derived URL segment (the dual-slug rule — DO NOT hardcode)

**What:** ES is unprefixed with segment `/servicios`; EN is `/en/services`. The **DB slug is identical** across locales (English-based, e.g. `seo-technical-audit`); only the parent segment + locale prefix differ. `sitemap-data.ts:102-106` already encodes this exact rule.
**When to use:** Every breadcrumb URL and every ServicesShowcase card link.
**Trade-offs:** Must be derived, never typed. A single helper prevents divergence.

**Example:**
```ts
// src/lib/breadcrumbs.ts
const servicesSegment = (locale: 'es' | 'en') => (locale === 'es' ? 'servicios' : 'services')
const withLocale = (locale: 'es' | 'en', path: string) =>
  locale === 'es' ? path : `/en${path}`   // matches next-intl 'as-needed' + defaultLocale 'es'
// index:   withLocale(locale, `/${servicesSegment(locale)}`)
// landing: withLocale(locale, `/${servicesSegment(locale)}/${slug}`)
```

## Data Flow

### Breadcrumb trail (path-based, no CMS field)

```
route params (locale, slug)
    ↓
lib/breadcrumbs.buildTrail(locale, ['home','services', slug?])
    ↓ (labels: home = t.home; services = index page title; slug = service page title)
<Breadcrumbs items={trail} />  (visual <nav><ol>)   +   <JsonLd data={buildBreadcrumbJsonLd(trail)} />
```

Labels resolve from the already-fetched `doc.title` (the page fetch happens anyway in `page.tsx`), so **no extra query** is needed for the landing crumb; the index crumb reuses `getServicesIndexPage` title or a next-intl string.

### ServicesShowcase render

```
Home page.tsx → getHomePage(locale) → doc.content.layout[] (includes servicesShowcase block)
    ↓
RenderBlocks → ServicesShowcaseComponent(blockProps)
    ↓
getServicesShowcaseData(locale) → 4 service pages @ locale
    ↓
cards: title/subtitle + href = withLocale(locale, `/${segment}/${slug}`)
```

## Anti-Patterns

### Anti-Pattern 1: Modeling breadcrumbs as a Payload field per page

**What people do:** Reuse Hero's manual `breadcrumbs` array (`Hero/config.ts:34`) and hand-enter label+URL for every service page in admin.
**Why it's wrong:** URLs are locale/segment-dependent; a hand-typed `/services/...` on the ES doc breaks parity, and localized labels must be entered twice. This is the exact failure mode of the two shipped bilingual-routing bugs on this project.
**Do this instead:** Path-based `Breadcrumbs` component fed by route params + fetched titles. Leave Hero's `breadcrumbs` field untouched (it may still serve listing pages elsewhere) but do **not** use it for Services.

### Anti-Pattern 2: Installing `@payloadcms/plugin-nested-docs` for breadcrumbs

**What people do:** Add nested-docs to derive parent/child trails.
**Why it's wrong:** It's not installed, the service hierarchy is a flat fixed set of 4, and adding it means a schema migration on the shared `pages` collection (breadcrumb/parent columns) plus localized-parent plumbing — real data-migration risk (see the phase-19 CTA data-loss incident) for zero benefit at this scale.
**Do this instead:** Static path-based trail. Revisit nested-docs only if a genuine multi-level page tree emerges.

### Anti-Pattern 3: Assuming a new block touches SEO/sitemap

**What people do:** Worry that adding `ServicesShowcase` to Home changes canonical/sitemap output.
**Why it's wrong:** Blocks live inside `pages.content.layout`; `sitemap-data.ts` enumerates **docs**, not blocks, and `plugin-seo` operates on the doc `meta` group. A new block adds columns to the layout, nothing else.
**Do this instead:** Add the block freely. No sitemap/SEO change. The only DB effect is additive columns (safe, no confirmation needed per the project's DB rule).

## Integration Points

### New files

| File | Purpose |
|------|---------|
| `src/components/Breadcrumbs.tsx` | Shared visual `<nav><ol>` trail (server component) |
| `src/lib/breadcrumbs.ts` | `buildTrail()`, `buildBreadcrumbJsonLd()`, locale/segment helpers |
| `src/blocks/ServicesShowcase/config.ts` | Block schema (`slug: 'servicesShowcase'`) |
| `src/blocks/ServicesShowcase/Component.tsx` | Server renderer reading 4 services @ locale |
| `src/migrations/<ts>_services_showcase.ts` | Additive migration for the new block's columns |

### Modified files

| File | Change |
|------|--------|
| `src/collections/Pages/index.ts` | Import + add `ServicesShowcase` to `blocks: [...]` |
| `src/blocks/RenderBlocks.tsx` | Add `servicesShowcase: ServicesShowcaseComponent` |
| `src/lib/services-data.ts` | Add `getServicesShowcaseData(locale)` |
| `src/app/(frontend)/[locale]/services/page.tsx` | Mount `<Breadcrumbs>` + BreadcrumbList JSON-LD |
| `src/app/(frontend)/[locale]/services/[slug]/page.tsx` | Same |
| `src/app/(frontend)/[locale]/servicios/page.tsx` | Same (ES segment) |
| `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx` | Same (ES segment) |
| `src/payload-types.ts` | Regenerated via `payload generate:types` |

### DB / migration impact

- **Additive only** — new block = new nullable columns/tables in the `pages` layout. Per the project DB rule this runs without confirmation. Generate with `payload migrate:create`, read the SQL (confirm no DROP/reshape), then `payload migrate`.
- Breadcrumbs are **zero-schema** — pure frontend, no migration.

## Suggested Build Order (Home + Services priority)

1. **Breadcrumbs first (zero schema risk).** Build `Breadcrumbs.tsx` + `lib/breadcrumbs.ts`, mount on all four Services route files (both segments). Verify `/servicios`, `/en/services`, `/servicios/<slug>`, `/en/services/<slug>` render correct labels + locale-correct hrefs + valid `BreadcrumbList` JSON-LD. No DB touch, fully reversible.
2. **ServicesShowcase block second.** Three-touchpoint registration + `getServicesShowcaseData` + additive migration + `generate:types`. Populate the Home `pages` doc's layout with the block in both locales. Verify links resolve to the locale-correct segment.
3. **Visual polish pass third (no schema).** Refine Hero `listing` variant, Content, CallToAction, FAQ on the service landings for competitiveness. Pure Tailwind/markup; propose scope to Juan before touching shared components used by other templates.

**Dual-locale/dual-slug risk gate (applies to steps 1–2):** every URL must be derived from `locale` + `SERVICE_SLUGS` via the shared helper — never hand-typed. Confirm hreflang/canonical parity stays consistent with `sitemap-data.ts` (es→`/servicios`, en→`/en/services`). Test all four URL shapes per locale before marking done.

## Sources

- Real codebase (read 2026-07-12): `src/collections/Pages/index.ts`, `src/blocks/RenderBlocks.tsx`, `src/blocks/Hero/{config,Component}.tsx`, `src/lib/services-data.ts`, `src/lib/sitemap-data.ts`, `src/i18n/routing.ts`, `src/app/(frontend)/[locale]/{services,servicios}/**`, `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx`, `src/components/JsonLd.tsx`, `src/globals/FeaturedContent` — HIGH (primary source)
- `.planning/PROJECT.md` — dual-segment decision (Phase 19), DB-safety incident context — HIGH

---
*Architecture research for: Payload blocks + App Router bilingual routing — Breadcrumbs & ServicesShowcase integration (v1.5)*
*Researched: 2026-07-12*
