# Phase 39: Websites — Frontend Components & Routes - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 9 (new: WebsiteCard, FeaturedWebsitesBlock config+Component, breadcrumbs additions, routes x2; modified: ArchiveBlock config+Component, blockRegistry.tsx, Pages/index.ts, FeaturedContent global, sitemap-data.ts)
**Analogs found:** 9 / 9

The `Websites` collection schema (`src/collections/Websites/index.ts`) already exists from Phase 38 — confirmed fields: `title`, `role`, `industry`, `year`, `highlights[].text`, `stack[].tag`, `challenges[].text`, `screenshots[].image`, `lighthouse.{performance,accessibility,bestPractices,seo}`, `lighthouseCapturedAt`, `client` (→ clientes), `relatedCaseStudy` (→ case-studies), `slugField()`. This is the data source for every component below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/WebsiteCard.tsx` (new) | component | request-response (server render) | `src/components/CaseStudyCard.tsx` | exact |
| `src/blocks/FeaturedWebsitesBlock/config.ts` (new) | config (Payload Block) | CRUD (field schema) | `src/blocks/FeaturedCaseStudiesBlock/config.ts` | exact |
| `src/blocks/FeaturedWebsitesBlock/Component.tsx` (new) | component | request-response (server render, reads global) | `src/blocks/FeaturedCaseStudiesBlock/Component.tsx` | exact |
| `src/blocks/ArchiveBlock/config.ts` (modified) | config (Payload Block) | CRUD (field schema) | itself (existing `relationTo` options array) | exact |
| `src/blocks/ArchiveBlock/Component.tsx` (modified) | component | request-response (server render) | itself (existing `posts`/`case-studies` branch) | exact |
| `src/app/(frontend)/[locale]/websites/page.tsx` (new) | route | request-response | `src/app/(frontend)/[locale]/case-studies/page.tsx` | exact |
| `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` (new) | route | request-response | `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` | exact |
| `src/lib/breadcrumbs.ts` (modified) | utility | transform (pure) | itself (existing `Section`/`buildCaseStudiesTrail`) | exact |
| `src/lib/sitemap-data.ts` (modified) | utility | batch (build-time data aggregation) | itself (existing `SITEMAP_COLLECTIONS` entries) | exact |
| `src/blocks/blockRegistry.tsx` (modified) | config (registry) | n/a | itself (existing `featuredCaseStudiesBlock` entry) | exact |
| `src/collections/Pages/index.ts` (modified) | model (Payload CollectionConfig) | CRUD (block registration) | itself (existing `ArchiveBlock`/`FeaturedCaseStudiesBlock` imports + `blocks:` array) | exact |
| `src/globals/FeaturedContent/index.ts` (modified) | model (Payload GlobalConfig) | CRUD | itself (existing `featuredCaseStudies` field) | exact |

No new backend/service layer — this phase is purely rendering (components, blocks, routes) on top of the Phase 38 `Websites` collection. Every file listed above has an exact same-role, same-data-flow analog already in the codebase; no partial/no-analog files this phase.

## Pattern Assignments

### `src/components/WebsiteCard.tsx` (component, request-response)

**Analog:** `src/components/CaseStudyCard.tsx` (full file, 26 lines — read in one pass)

**Full analog source:**
```typescript
import Link from 'next/link'

import type { CaseStudy } from '@/payload-types'

import { Card, CardContent } from '@/components/ui/card'

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const client = typeof caseStudy.client === 'object' ? caseStudy.client : null

  return (
    <Link href={`/case-studies/${caseStudy.slug}`} className="group block">
      <Card>
        <CardContent className="p-6">
          {client && <p className="text-label text-muted-foreground">{client.name}</p>}
          <h3 className="font-heading text-heading mt-1">{caseStudy.title}</h3>
          {caseStudy.sector && <p className="mt-1 text-body text-muted-foreground">{caseStudy.sector}</p>}
          {caseStudy.heroMetric && (
            <p className="mt-4 font-heading text-heading font-semibold text-primary-text">
              {caseStudy.heroMetric}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Field-mapping for `WebsiteCard`** (per 39-UI-SPEC.md Component Contract Detail):

| `CaseStudyCard` | `WebsiteCard` |
|---|---|
| `href={/case-studies/${caseStudy.slug}}` | `href={/websites/${website.slug}}` |
| `client.name` label | same — `typeof website.client === 'object' ? website.client : null`, `.name` |
| `caseStudy.title` heading | `website.title` |
| `caseStudy.sector` subtitle | `website.industry` |
| `caseStudy.heroMetric` (accent, bold, conditional) | `website.lighthouse?.performance` formatted as `` `${n} Performance` `` — hide the whole `<p>` when `lighthouse.performance` is null/undefined, exactly like `heroMetric`'s conditional |

Prop name convention: analog uses `{ caseStudy }: { caseStudy: CaseStudy }` — follow the same single-named-prop shape: `{ website }: { website: Website }` (not `websiteData`, to match the analog's exact naming convention; `Website` type comes from `@/payload-types` once `payload generate:types` is re-run after Phase 38's collection).

---

### `src/blocks/FeaturedWebsitesBlock/config.ts` (config, CRUD field schema)

**Analog:** `src/blocks/FeaturedCaseStudiesBlock/config.ts` (full file, 28 lines)

```typescript
import type { Block } from 'payload'

/**
 * Reads FeaturedContent.featuredCaseStudies at render time — same single-
 * curation-surface rationale as FeaturedPostsBlock.
 */
export const FeaturedCaseStudiesBlock: Block = {
  slug: 'featuredCaseStudiesBlock',
  interfaceName: 'FeaturedCaseStudiesBlock',
  labels: { singular: 'Featured Case Studies', plural: 'Featured Case Studies Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Section heading — editable per page instance.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
    },
  ],
}
```

Copy byte-for-byte, renaming: `slug: 'featuredWebsitesBlock'`, `interfaceName: 'FeaturedWebsitesBlock'`, `labels: { singular: 'Featured Websites', plural: 'Featured Websites Blocks' }`. Field shape (`title` localized text + `limit` number default 3 min 1 max 6) is unchanged per 39-UI-SPEC.md ("byte-for-byte field shape clone").

---

### `src/blocks/FeaturedWebsitesBlock/Component.tsx` (component, request-response)

**Analog:** `src/blocks/FeaturedCaseStudiesBlock/Component.tsx` (full file, 37 lines)

```typescript
import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { FeaturedCaseStudiesBlock as FeaturedCaseStudiesBlockProps, CaseStudy } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { CaseStudyCard } from '@/components/CaseStudyCard'

export async function FeaturedCaseStudiesBlockComponent(props: FeaturedCaseStudiesBlockProps) {
  const { title, limit } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  const featuredContent = await payload.findGlobal({
    slug: 'featured-content',
    depth: 1,
    locale,
  })

  const caseStudies = (featuredContent.featuredCaseStudies ?? [])
    .filter((cs): cs is CaseStudy => typeof cs === 'object')
    .slice(0, limit ?? 3)

  if (caseStudies.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((cs) => (
          <CaseStudyCard key={cs.id} caseStudy={cs} />
        ))}
      </div>
    </Container>
  )
}
```

Copy byte-for-byte with these substitutions: `FeaturedWebsitesBlockProps` type, `featuredContent.featuredWebsites` (new global field, see FeaturedContent section below), `Website` type import, `WebsiteCard` component import, `websites.map((w) => <WebsiteCard key={w.id} website={w} />)`. `depth: 1` and the `findGlobal` call shape stay identical — no new logic needed.

---

### `src/blocks/ArchiveBlock/config.ts` (modified, CRUD field schema)

**Analog:** itself — existing `relationTo` select + `selectedDocs` relationship fields (full file, 71 lines, already read)

**`relationTo` options array to extend** (lines 12-20):
```typescript
{
  name: 'relationTo',
  type: 'select',
  required: true,
  options: [
    { label: 'Posts', value: 'posts' },
    { label: 'Case Studies', value: 'case-studies' },
  ],
},
```
Add `{ label: 'Websites', value: 'websites' }` as a third option. The file's own comment (line 8) is the explicit instruction for this exact edit: *"Any future 'grid of N items from a collection' need MUST extend this select's options — never spawn a new block slug."*

**`selectedDocs` relationship to extend** (lines 36-42):
```typescript
{
  name: 'selectedDocs',
  type: 'relationship',
  relationTo: ['posts', 'case-studies'],
  hasMany: true,
  admin: { condition: (_, siblingData) => siblingData.mode === 'manual' },
},
```
Add `'websites'` to the `relationTo` array: `relationTo: ['posts', 'case-studies', 'websites']`.

**`enableCategoryFilter` admin condition — do NOT touch** (lines 43-51): stays gated on `siblingData?.relationTo === 'posts'` only. Per 39-UI-SPEC.md, websites (like case-studies) get no category filter UI — this field's condition is already correct and needs zero change.

---

### `src/blocks/ArchiveBlock/Component.tsx` (modified, request-response)

**Analog:** itself — existing `posts`/`case-studies` type union and render branch (full file, 127 lines, already read)

**Type union to broaden** (line 4 and line 37):
```typescript
import type { ArchiveBlock as ArchiveBlockProps, Post, CaseStudy, Category } from '@/payload-types'
...
let docs: (Post | CaseStudy)[] = []
```
Add `Website` to both: `import type { ..., Website } from '@/payload-types'` and `let docs: (Post | CaseStudy | Website)[] = []`.

**`selectedDocs` manual-mode cast** (line 41):
```typescript
docs = selectedDocs.flatMap((d) => (typeof d.value === 'object' ? [d.value as Post | CaseStudy] : []))
```
Broaden the cast: `[d.value as Post | CaseStudy | Website]`.

**Render branch to extend** (lines 115-119):
```typescript
{relationTo === 'posts' ? (
  <PostCard post={doc as Post} priority={isAboveFold} />
) : (
  <CaseStudyCard caseStudy={doc as CaseStudy} />
)}
```
Add a third branch: `relationTo === 'posts' ? <PostCard .../> : relationTo === 'websites' ? <WebsiteCard website={doc as Website} /> : <CaseStudyCard caseStudy={doc as CaseStudy} />`. Import `WebsiteCard` from `@/components/WebsiteCard` alongside the existing `PostCard`/`CaseStudyCard` imports (lines 8-9).

**Everything else unchanged:** the `payload.find({ collection: relationTo, ... })` call (lines 67-77) already works generically since `relationTo` is a string union — no changes needed there. `ScrollReveal`/`isAboveFold` wrapper (lines 112-121) carries over unchanged, per 39-UI-SPEC.md.

---

### `src/app/(frontend)/[locale]/websites/page.tsx` (new route, request-response)

**Analog:** `src/app/(frontend)/[locale]/case-studies/page.tsx` (full file, 87 lines)

```typescript
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { JsonLd } from '@/components/JsonLd'
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'

async function getCaseStudies(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
    locale: locale as 'es' | 'en',
    limit: 50,
  })
  return docs
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Casos de éxito' : 'Case Studies',
  }
}

export default async function CaseStudiesListPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const caseStudies = await getCaseStudies(locale)
  const trail = buildCaseStudiesTrail(locale as 'es' | 'en')

  return (
    <main>
      <Container className="py-16">
        <nav aria-label="Breadcrumb" className="mb-4">
          {/* ... breadcrumb <ol> mapping trail, unchanged shape — copy verbatim ... */}
        </nav>
        <h1 className="font-display text-display">
          {locale === 'es' ? 'Casos de éxito' : 'Case Studies'}
        </h1>

        {caseStudies.length === 0 ? (
          <div className="mt-12 text-center py-16">
            <p className="font-heading text-heading">
              {locale === 'es' ? 'Próximamente' : 'Coming soon'}
            </p>
            <p className="mt-2 text-body text-muted-foreground">
              {locale === 'es'
                ? 'Estamos preparando nuevos casos de éxito. Vuelve pronto.'
                : "We're preparing new case studies. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map((cs) => (
              <CaseStudyCard key={cs.id} caseStudy={cs} />
            ))}
          </div>
        )}
      </Container>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
```

Structural clone substitutions: `collection: 'websites'`, `buildWebsitesTrail` (new export, see breadcrumbs.ts section), `<h1>`/`<title>` copy → "Websites"/"Sitios web" (per 39-UI-SPEC.md Copywriting Contract), empty-state copy → "Coming soon"/"Próximamente" + "We're preparing new website case studies..."/"Estamos preparando nuevos casos de sitios web..." (also per UI-SPEC), `WebsiteCard` component + `website` prop instead of `caseStudy`. `Container className="py-16"`, breadcrumb `<nav>` markup, and grid classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`) copy verbatim — no new spacing/layout values.

---

### `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` (new route, request-response)

**Analog:** `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` (full file, 258 lines)

**Imports pattern** (lines 1-16):
```typescript
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Author } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { AuthorByline } from '@/components/AuthorByline'
import { AuthorCard } from '@/components/AuthorCard'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { CaseStudyResultsChart } from '@/components/CaseStudyResultsChart'
```
For Websites, drop `Author`/`AuthorByline`/`AuthorCard` (no author field), `getFallbackHeroImage` (no `heroImage` field on Websites per 39-UI-SPEC.md — hero stays text-only), `RenderBlocks`/`RichTextRenderer` (no `testimonialSection`/`clientContext`/`conclusion` richtext on Websites), `CaseStudyResultsChart` (no `results` field). Add `Badge` from `@/components/ui/badge` (stack tag chips) and `next/image` stays for the screenshots grid.

**Data-fetch pattern** (lines 18-28):
```typescript
async function getCaseStudy(locale: string, slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: slug } },
    locale: locale as 'es' | 'en',
    depth: 1,
    limit: 1,
  })
  return docs[0]
}
```
Copy verbatim with `collection: 'websites'` — `depth: 1` is required to resolve `client`, `relatedCaseStudy`, and `screenshots[].image` relationships/uploads.

**`generateMetadata` pattern** (lines 30-48): copy verbatim; Websites has no `heroSubtitle`, so fall back to `doc.role ?? doc.industry` for `description` per 39-UI-SPEC.md's JSON-LD `about` mapping (`meta?.description ?? doc.role ?? doc.industry ?? ''`).

**`copy` object pattern** (lines 50-67) — extend per 39-UI-SPEC.md's Detail section labels:
```typescript
const copy = {
  es: {
    lighthouse: 'Puntuaciones de Lighthouse',
    highlights: 'Destacados',
    challenges: 'Retos',
    stack: 'Stack Tecnológico',
    screenshots: 'Capturas de pantalla',
    relatedCaseStudy: 'Ver caso de estudio relacionado',
  },
  en: {
    lighthouse: 'Lighthouse Scores',
    highlights: 'Highlights',
    challenges: 'Challenges',
    stack: 'Tech Stack',
    screenshots: 'Screenshots',
    relatedCaseStudy: 'View related case study',
  },
}
```

**Hero section pattern** (lines 98-147) — reuse the `<section className="bg-secondary text-secondary-foreground">` + breadcrumb `<nav>` + chips row + `<h1 className="font-display text-display">` structure, but drop the `<Image>`/`aspect-[21/9]` band (no `heroImage` field exists on Websites — 39-UI-SPEC.md is explicit: "not faked"). Chips row becomes `client.name` / `industry` / `year` (was `client.name`/`sector`/`period`); `heroSubtitle` → `role` as subtitle paragraph; no `heroMetric` display in hero (Lighthouse scores render in their own grid below, not inline in hero).

**KPI-grid pattern → Lighthouse score grid** (lines 149-162, exact structural analog):
```typescript
{doc.kpis && doc.kpis.length > 0 && (
  <Container className="py-12">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {doc.kpis.map((kpi, i) => (
        <div key={kpi.id ?? i} className="rounded-lg bg-secondary text-secondary-foreground p-6 text-center">
          <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
            {kpi.value}
          </p>
          <p className="mt-1 text-label uppercase tracking-wide opacity-70">{kpi.label}</p>
        </div>
      ))}
    </div>
  </Container>
)}
```
Replace the dynamic `.map` over `doc.kpis` with 4 fixed cards reading `doc.lighthouse.{performance,accessibility,bestPractices,seo}` — same `grid-cols-2 md:grid-cols-4 gap-6` container and same `rounded-lg bg-secondary text-secondary-foreground p-6 text-center` card treatment, labels are the 4 fixed strings (Performance/Accessibility/Best Practices/SEO, localized) rather than a per-doc `kpi.label`.

**Bullet-list section pattern → reuse verbatim twice (Highlights, Challenges)** (lines 175-184):
```typescript
{doc.challenge && doc.challenge.length > 0 && (
  <section>
    <h2 className="font-heading text-heading mt-10 mb-4">{t.challenge}</h2>
    <ul className="list-disc pl-6 space-y-2 text-body">
      {doc.challenge.map((item, i) => (
        <li key={item.id ?? i}>{item.text}</li>
      ))}
    </ul>
  </section>
)}
```
Copy this exact block twice: once for `doc.highlights` (heading `t.highlights`), once for `doc.challenges` (heading `t.challenges`, field is plural on Websites vs singular `challenge` on CaseStudies — confirmed via `src/collections/Websites/index.ts` line 37).

**Sections to omit entirely** (no Websites field exists): `clientContext` (lines 165-173), `solution` (lines 186-201), `testimonialSection`/`RenderBlocks` (lines 203-205), `results`/`CaseStudyResultsChart` (lines 207-235), `conclusion` (lines 237-241), `author`/`AuthorByline`/`AuthorCard` (lines 243-250). Do not render empty/placeholder versions — per 39-UI-SPEC.md, "simply omitted from the Website detail template."

**New sections with no direct analog (compose from existing primitives already cataloged above):**
- **Stack** — `Badge` chips: `<div className="flex flex-wrap gap-2">{doc.stack.map((s, i) => <Badge key={s.id ?? i}>{s.tag}</Badge>)}</div>` (Badge import from `src/components/ui/badge.tsx`, already an installed shadcn primitive used elsewhere in the app per 39-UI-SPEC.md Registry Safety table).
- **Screenshots** — responsive image grid: `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{doc.screenshots.map((s, i) => <Image key={s.id ?? i} src={(s.image as Media).url} alt={(s.image as Media).alt ?? doc.title} width={...} height={...} sizes="(min-width: 640px) 50vw, 100vw" />)}</div>` — reuses the same `next/image` import already present in the analog (line 1) for the hero band; only the container/grid changes.
- **Related case study link** — conditional, only if `doc.relatedCaseStudy` populated: `<Link href={/case-studies/${relatedCaseStudy.slug}} className="text-primary-text underline underline-offset-2">{t.relatedCaseStudy}</Link>`, reuses the `Link` import (line 2) and the app's existing accent-link text treatment (`text-primary-text`, same token used for `heroMetric`/KPI numbers).

**JSON-LD pattern** (lines 91-96, 253-254):
```typescript
const creativeWorkData = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: doc.title,
  about: doc.heroSubtitle,
}
...
<JsonLd data={creativeWorkData} />
<JsonLd data={buildBreadcrumbJsonLd(trail)} />
```
Copy verbatim with `about: doc.role ?? doc.industry` (Websites has no `heroSubtitle`) — `@type` stays `'CreativeWork'`, explicitly NOT `'SoftwareApplication'` per 39-UI-SPEC.md success-criterion #5. `trail` comes from `buildWebsitesTrail(locale, { slug: doc.slug ?? slug, title: doc.title })`.

---

### `src/lib/breadcrumbs.ts` (modified, transform/pure)

**Analog:** itself — existing `Section` union, `SECTION_LABELS`/`SECTION_SEGMENTS` maps, and `buildCaseStudiesTrail` wrapper (full file, 123 lines, already read)

**`Section` union to extend** (line 34):
```typescript
type Section = 'services' | 'case-studies'
```
→ `type Section = 'services' | 'case-studies' | 'websites'`

**`SECTION_LABELS` to extend** (lines 36-39):
```typescript
const SECTION_LABELS: Record<Section, Record<Locale, string>> = {
  services: { es: 'Servicios', en: 'Services' },
  'case-studies': { es: 'Casos de éxito', en: 'Case Studies' },
}
```
Add: `websites: { es: 'Sitios web', en: 'Websites' },`

**`SECTION_SEGMENTS` to extend** (lines 45-48, note the file's own comment above this block confirming case-studies is NOT locale-prefixed — same precedent applies):
```typescript
const SECTION_SEGMENTS: Record<Section, Record<Locale, string>> = {
  services: { es: 'servicios', en: 'services' },
  'case-studies': { es: 'case-studies', en: 'case-studies' },
}
```
Add: `websites: { es: 'websites', en: 'websites' },` (English segment kept in both locales, per 39-UI-SPEC.md's explicit instruction).

**New wrapper export, sibling to `buildCaseStudiesTrail`** (lines 93-104):
```typescript
export function buildCaseStudiesTrail(
  locale: Locale,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  return buildSectionTrail(locale, 'case-studies', current)
}
```
Add, matching signature/doc-comment style exactly:
```typescript
/**
 * Builds the breadcrumb trail for the Websites index page (2 levels) or one
 * of its individual detail pages (3 levels, when `current` is provided).
 * Sibling to `buildCaseStudiesTrail()`, sharing the same internal
 * `buildSectionTrail()` so URL/locale logic is never duplicated across
 * sections (UIPOL-09).
 */
export function buildWebsitesTrail(
  locale: Locale,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  return buildSectionTrail(locale, 'websites', current)
}
```
`buildBreadcrumbJsonLd` (lines 111-122) needs zero changes — it's already generic over any `BreadcrumbItem[]` trail.

---

### `src/lib/sitemap-data.ts` (modified, batch)

**Analog:** itself — existing `SITEMAP_COLLECTIONS` array entries + `SitemapEntry['group']` union + `SITEMAP_GROUP_LABELS` (full file, 141 lines, already read)

**`SitemapCollection.collection` union to extend** (line 28):
```typescript
type SitemapCollection = {
  collection: 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories'
  ...
}
```
→ add `| 'websites'`

**`SITEMAP_COLLECTIONS` entry to add** (lines 34-40, pattern from the `case-studies` entry which is the simplest — no `hasDrafts: false` special case, no URL-branching exception like Services):
```typescript
{ collection: 'case-studies', prefix: 'case-studies', hasDrafts: true, group: 'case-studies' },
```
Add: `{ collection: 'websites', prefix: 'websites', hasDrafts: true, group: 'websites' },`

**`SitemapEntry['group']` union to extend** (line 48):
```typescript
group: 'pages' | 'blog' | 'case-studies' | 'authors' | 'categories'
```
→ add `| 'websites'`

**`SITEMAP_GROUP_LABELS` to extend** (lines 68-74):
```typescript
export const SITEMAP_GROUP_LABELS: Record<SitemapGroup, string> = {
  pages: 'Pages',
  blog: 'Blog',
  'case-studies': 'Case Studies',
  authors: 'Authors',
  categories: 'Categories',
}
```
Add: `websites: 'Websites',`

**No URL-branching needed** — per 39-UI-SPEC.md, `/websites` and `/websites/{slug}` follow the generic `prefix/slug` path already handled inside `getSitemapEntries()`'s `else` branch (lines 107-113); do not add an `isWebsites...` special case analogous to `isServicesIndex`/`isServiceLanding` (lines 93-96), since Websites has no locale-varying URL segment (same reasoning as `case-studies`).

---

### `src/blocks/blockRegistry.tsx` (modified, registry)

**Analog:** itself — existing `featuredCaseStudiesBlock`/`archiveBlock` entries (full file, 67 lines, already read)

**Import to add** (alongside line 16):
```typescript
import { FeaturedCaseStudiesBlockComponent } from '@/blocks/FeaturedCaseStudiesBlock/Component'
```
Add: `import { FeaturedWebsitesBlockComponent } from '@/blocks/FeaturedWebsitesBlock/Component'`

**Registry map entry to add** (alongside line 58):
```typescript
featuredCaseStudiesBlock: FeaturedCaseStudiesBlockComponent,
```
Add: `featuredWebsitesBlock: FeaturedWebsitesBlockComponent,` — no change needed to `archiveBlock: ArchiveBlockComponent` (line 52), that renderer already handles the new `relationTo: 'websites'` branch internally per the ArchiveBlock section above.

---

### `src/collections/Pages/index.ts` (modified, block registration)

**Analog:** itself — existing `ArchiveBlock`/`FeaturedCaseStudiesBlock` imports and `blocks:` array registration

**Import to add** (alongside line 22):
```typescript
import { FeaturedCaseStudiesBlock } from '@/blocks/FeaturedCaseStudiesBlock/config'
```
Add: `import { FeaturedWebsitesBlock } from '@/blocks/FeaturedWebsitesBlock/config'`

**`blocks:` array entry to add** (alongside line 85, inside the layout field's `blocks: [...]`):
```typescript
blocks: [
  ...
  ArchiveBlock,       // line 73 — needs no new entry, extended in place (see ArchiveBlock section)
  ...
  FeaturedCaseStudiesBlock,  // line 85
],
```
Add `FeaturedWebsitesBlock` to this array (position: append near `FeaturedCaseStudiesBlock`, consistent with the existing grouping of `Featured*` blocks together).

---

### `src/globals/FeaturedContent/index.ts` (modified, model)

**Analog:** itself — existing `featuredCaseStudies` relationship field (full file, 32 lines, already read)

```typescript
{
  name: 'featuredCaseStudies',
  type: 'relationship',
  relationTo: 'case-studies',
  hasMany: true,
  admin: {
    description: 'Drives the Home page "Featured Case Studies" section.',
  },
},
```
Add a sibling field, byte-for-byte shape clone:
```typescript
{
  name: 'featuredWebsites',
  type: 'relationship',
  relationTo: 'websites',
  hasMany: true,
  admin: {
    description: 'Drives the Home page "Featured Websites" section.',
  },
},
```
This is an additive-only schema change (`ADD COLUMN`/new join table for the relationship) — per project's Database Safety rule, additive migrations do not require pausing for confirmation; generate with `payload migrate:create`, read the generated SQL, then run `payload migrate` if purely additive.

---

## Shared Patterns

### Container + grid layout (identical across all listing/featured surfaces)
**Source:** `src/blocks/FeaturedCaseStudiesBlock/Component.tsx` line 28, `src/blocks/ArchiveBlock/Component.tsx` line 106, `src/app/(frontend)/[locale]/case-studies/page.tsx` line 77
```typescript
<Container className="py-12">  {/* or py-16 for the standalone listing page */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```
**Apply to:** `FeaturedWebsitesBlock`, `ArchiveBlock` websites branch, `/[locale]/websites/page.tsx` — verbatim, no new breakpoints per 39-UI-SPEC.md.

### Breadcrumb `<nav>` markup (identical across case-studies list + detail)
**Source:** `src/app/(frontend)/[locale]/case-studies/page.tsx` lines 39-60 (light-background variant), `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` lines 112-133 (dark/secondary-background variant with `/70` opacity muted text)
```typescript
<nav aria-label="Breadcrumb" className="mb-4">
  <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
    {trail.map((crumb, i) => {
      const isLast = i === trail.length - 1
      return (
        <li key={crumb.url} className="flex items-center gap-x-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          {isLast ? (
            <span aria-current="page">{crumb.label}</span>
          ) : (
            <Link href={crumb.url} className="hover:text-foreground underline-offset-2 hover:underline">
              {crumb.label}
            </Link>
          )}
        </li>
      )
    })}
  </ol>
</nav>
```
**Apply to:** `/[locale]/websites/page.tsx` (light variant, `text-muted-foreground`/`hover:text-foreground`) and `/[locale]/websites/[slug]/page.tsx` (dark variant, `text-secondary-foreground/70`/`hover:text-secondary-foreground`) — copy each verbatim from its respective analog.

### JSON-LD wiring
**Source:** `src/components/JsonLd.tsx` (component consumed, not modified this phase) + `src/lib/breadcrumbs.ts` `buildBreadcrumbJsonLd()`
```typescript
<JsonLd data={creativeWorkData} />
<JsonLd data={buildBreadcrumbJsonLd(trail)} />
```
**Apply to:** `/[locale]/websites/[slug]/page.tsx` detail route — `@type: 'CreativeWork'` per explicit UI-SPEC success criterion (not `SoftwareApplication`).

### `payload.find()` locale + limit pattern
**Source:** `src/app/(frontend)/[locale]/case-studies/page.tsx` lines 10-18, `.../[slug]/page.tsx` lines 18-28
```typescript
const { docs } = await payload.find({
  collection: 'case-studies',
  locale: locale as 'es' | 'en',
  limit: 50,   // listing
})
// or, detail:
where: { slug: { equals: slug } }, depth: 1, limit: 1,
```
**Apply to:** both new `/websites` routes and `FeaturedWebsitesBlock`/`ArchiveBlock` websites branch — same `getPayload({ config })` + typed-locale pattern throughout the codebase, no deviation.

## No Analog Found

None — every file in this phase's scope has an exact, same-role, same-data-flow analog already in the codebase (CaseStudies' equivalent frontend layer). The only genuinely new visual elements (Lighthouse score grid, Stack badges, Screenshots grid, related-case-study link) are compositions of existing primitives already cataloged in Pattern Assignments above (KPI-grid card treatment, `Badge` component, `next/image` responsive pattern, accent `Link` styling) — not undocumented territory.

## Metadata

**Analog search scope:** `src/components/`, `src/blocks/FeaturedCaseStudiesBlock/`, `src/blocks/ArchiveBlock/`, `src/app/(frontend)/[locale]/case-studies/`, `src/lib/breadcrumbs.ts`, `src/lib/sitemap-data.ts`, `src/blocks/blockRegistry.tsx`, `src/blocks/RenderBlocks.tsx`, `src/collections/Pages/index.ts`, `src/globals/FeaturedContent/index.ts`, `src/collections/Websites/index.ts` (Phase 38 schema, data source)
**Files scanned:** 12 files (full reads, all ≤ 258 lines — single-pass reads throughout, no re-reads)
**Pattern extraction date:** 2026-07-14
