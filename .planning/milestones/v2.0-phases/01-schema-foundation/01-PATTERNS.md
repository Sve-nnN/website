# Phase 1: Schema Foundation - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 27
**Analogs found:** 25 / 27

**Note on codebase state:** This is a greenfield repo (`juan-payload`) with no prior source files. All analogs below come from three external reference codebases:
- `aprendoclub` (`/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub`) — clean production Payload 3.85 + Postgres, `push:false`, lean collections. Best source for `payload.config.ts` shape and simple lean collections (Media, Testimonials, Clientes).
- `apturio/website` (`/Users/juan/Documents/Codigo/Arianna/apturio/website`) — production Next.js 15 standalone scaffold. Best source for `next.config.mjs` and build/postbuild scripts.
- `JuanPortfolio` (`/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio`) — the site being rebuilt, Mongo-era. Best source for field-*naming*/admin-UX conventions (tabs, slug util, access utils, block config shapes) — **explicitly NOT a field-shape source of truth for CaseStudies/Testimonials/Clientes** (see Pitfall 2 in RESEARCH.md — its CaseStudies is just `heroImage` + one richText blob, does not match the new structured KPI/challenge/solution/results model).

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `payload.config.ts` | config | request-response | `aprendoclub/payload.config.ts` | exact (strip nested-docs, vercel-blob; add email-resend) |
| `next.config.mjs` | config | request-response | `apturio/website/next.config.mjs` | role-match (strip next-intl wrapper for Phase 1) |
| `package.json` (scripts) | config | batch | `apturio/website/package.json` | exact (build/postbuild scripts) |
| `src/access/authenticated.ts` | utility | request-response | `JuanPortfolio/src/access/authenticated.ts` | exact — port verbatim |
| `src/access/authenticatedOrPublished.ts` | utility | request-response | `JuanPortfolio/src/access/authenticatedOrPublished.ts` | exact — port verbatim |
| `src/fields/slug.ts` | utility | transform | `JuanPortfolio/src/fields/slug.ts` | exact — port verbatim per "Don't Hand-Roll" |
| `src/collections/Users/index.ts` | model | CRUD | `aprendoclub/payload.config.ts` inline `Users` (minimal) + `JuanPortfolio/src/collections/Users/index.ts` (auth pattern, tabs) | role-match, needs heavy simplification |
| `src/collections/Media/index.ts` | model | file-I/O | `aprendoclub/collections/Media.ts` | exact (local-disk phase, public read, imageSizes) |
| `src/collections/Pages/index.ts` | model | CRUD | `JuanPortfolio/src/collections/Pages/index.ts` | exact (blocks layout field, access, versions/drafts, SEO tab) |
| `src/collections/Posts/index.ts` | model | CRUD | `JuanPortfolio/src/collections/Posts/index.ts` (structure), `aprendoclub/collections/BlogPost.ts` (Postgres-proven alternative) | role-match |
| `src/collections/Authors/index.ts` | model | CRUD | `JuanPortfolio/src/collections/Authors/index.ts` | role-match, needs field trimming |
| `src/collections/Categories/index.ts` | model | CRUD | `JuanPortfolio/src/collections/Categories.ts` + `aprendoclub/collections/Category.ts` | role-match |
| `src/collections/CaseStudies/index.ts` | model | CRUD | RESEARCH.md code example (primary source) + `JuanPortfolio/src/collections/CaseStudies/index.ts` (tabs/slug/SEO wiring pattern only) | no field-shape analog — new modeling work |
| `src/collections/Testimonials/index.ts` | model | CRUD | `aprendoclub/collections/Testimonios.ts` | role-match (tighten required fields per CONTEXT) |
| `src/collections/Clientes/index.ts` | model | CRUD | `aprendoclub/collections/ClientesTrabajados.ts` | exact (lean shape, swap `orden`→`websiteUrl`) |
| `src/blocks/Hero/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/HeroHome/config.ts` | role-match (add `variant` discriminator, drop CTA groups per RESEARCH) |
| `src/blocks/Content/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/Content/config.ts` | exact |
| `src/blocks/ArchiveBlock/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/ArchiveBlock/config.ts` | exact — extend `relationTo` options, don't fork |
| `src/blocks/CallToAction/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/CallToAction/config.ts` | exact |
| `src/blocks/FAQ/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/FAQ/config.ts` | exact |
| `src/blocks/TestimonialsCarousel/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/TestimonialsCarousel/config.ts` | exact |
| `src/blocks/ContactFormBlock/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/ContactFormBlock/config.ts` | exact |
| `src/blocks/MediaBlock/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/MediaBlock/config.ts` | exact (drop `animationField` dependency) |
| `src/blocks/Code/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/Code/config.ts` | exact |
| `src/blocks/RelatedPosts/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/RelatedPostsBlock/config.ts` | exact |
| `src/blocks/TableOfContentsBlock/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/TableOfContentsBlock/config.ts` | exact |
| `src/blocks/ResultsSection/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/ResultsSection/config.ts` | exact |
| `src/blocks/Section/config.ts` | config (block) | transform | `JuanPortfolio/src/blocks/Section/config.ts` | exact (update inner `blocks` array to new consolidated set) |
| `src/migrations/*.ts` | migration | batch | `aprendoclub/migrations/*.ts` (naming: `YYYYMMDD_HHMMSS_name.ts` + sibling `.json`) | exact — generated by CLI, not hand-written |

## Pattern Assignments

### `payload.config.ts` (config, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/payload.config.ts`

**Full pattern** (lines 1-92, use as structural template):
```typescript
import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

// ... collection imports ...

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: 'users' },
  collections: [Users, Media, Pages, Posts, Authors, Categories, CaseStudies, Testimonials, Clientes],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Producción: las migraciones son la única fuente de cambios de schema.
    // Nunca auto-push. Correr `payload migrate:create` tras cambios de schema.
    push: false,
  }),
  plugins: [
    seoPlugin({ collections: ['pages', 'posts', 'case-studies'], uploadsCollection: 'media', tabbedUI: true }),
    redirectsPlugin({ collections: ['pages', 'posts', 'case-studies', 'categories', 'authors'] }),
  ],
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
```

**Deviations from aprendoclub for this phase:**
- DROP `nestedDocsPlugin` (deferred per CONTEXT.md), `vercelBlobStorage` (Hostinger self-hosts, not Vercel — Phase 1 uses local disk, Phase 3 wires Cloudinary).
- ADD `resendAdapter` email config (aprendoclub doesn't have it wired, but RESEARCH.md locks `@payloadcms/email-resend` as KEEP for Phase 1).
- `Users` should be its own file (`src/collections/Users/index.ts`), not inlined like aprendoclub's minimal inline object — RESEARCH.md's recommended project structure uses folder-per-collection.
- Comment `push: false` decision inline exactly as aprendoclub does — this is a documented, load-bearing comment other engineers will read.

---

### `src/collections/Media/index.ts` (model, file-I/O)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/collections/Media.ts` (full file, 41 lines — this is the Phase 1 target: local disk, no Cloudinary)

```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Sitio público: las imágenes deben ser legibles sin login.
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*', 'video/mp4'],
    imageSizes: [
      { name: 'thumbnail', width: 300, height: undefined },
      { name: 'card', width: 768, height: undefined },
      { name: 'hero', width: 1600, height: undefined },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
  ],
}
```

**Do NOT copy from:** `JuanPortfolio/src/collections/Media.ts` — that file is already wired to Cloudinary (`disableLocalStorage: true`, custom `upload-cloudinary` endpoints, `cloudinaryService`), which is explicitly Phase 3 scope per CONTEXT.md ("Storage Cloudinary: NO se configura en fase 1"). Reference it only in Phase 3 planning, not here.

**Security note (ASVS V5):** restrict `mimeTypes` to images (RESEARCH.md Security Domain flags unrestricted upload as a DoS/Tampering risk even on local disk) — aprendoclub's `image/*` + `video/mp4` pattern is a reasonable Phase 1 default; Juan's portfolio likely doesn't need video, so `image/*` alone may be tighter and preferred.

---

### `src/collections/Clientes/index.ts` (model, CRUD)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/collections/ClientesTrabajados.ts` (full file, 45 lines)

```typescript
import type { CollectionConfig } from 'payload'

export const Clientes: CollectionConfig = {
  slug: 'clientes',
  admin: {
    useAsTitle: 'name',
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media', required: true },
    { name: 'websiteUrl', type: 'text' },
  ],
}
```

**Deviation:** aprendoclub's version uses `nombre`/`orden` (Spanish field name + manual sort order field) with `revalidatePath` hooks tied to its own frontend routes — Phase 1 has no frontend yet (Phase 5 concern), so drop the `hooks.afterChange`/`afterDelete` revalidation block entirely for now. Field names: CONTEXT.md specifies `name`/`logo`/`websiteUrl` (English), matching RESEARCH.md's code example exactly, not aprendoclub's Spanish naming.

**Do NOT copy from:** `JuanPortfolio/src/collections/Clientes/index.ts` — CONTEXT.md explicitly drops that file's `invertInDark`/`forceWhiteBackground` presentation fields (Pitfall 2 in RESEARCH.md).

---

### `src/collections/Testimonials/index.ts` (model, CRUD)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/collections/Testimonios.ts` (full file, 63 lines) for admin/structure shape; RESEARCH.md code example for the exact required-field set.

```typescript
// Structure pattern from aprendoclub (admin.useAsTitle, defaultColumns, upload relation):
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'company', 'role'] },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true, localized: true },
    { name: 'company', type: 'text', required: true },
    { name: 'testimonial', type: 'textarea', required: true, localized: true },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
  ],
}
```

**Deviation from aprendoclub:** CONTEXT.md requires `name`/`role`/`company` all `required: true` ("no citas anónimas") — aprendoclub's `Testimonios.ts` only requires `nombre`/`quote`, leaves `rol`/`ubicacion` optional. This is an intentional tightening, not a bug. Also drop aprendoclub's `featuredOnHome`/`orden`/`revalidatePath` hooks — those are frontend-display concerns for Phase 5, not schema.

---

### `src/collections/CaseStudies/index.ts` (model, CRUD)

**No field-shape analog exists** — this is new modeling work per RESEARCH.md. Use the full code example already present in `01-RESEARCH.md` under "CaseStudies field model" (lines 396-471) as the primary source — it is the authoritative target shape (KPIs array, challenge array, solution array, results group with before/after metrics, client relationship to `clientes`).

**Pull ONLY these patterns from** `JuanPortfolio/src/collections/CaseStudies/index.ts`:
- Tabs wiring convention (`type: 'tabs'`, SEO as a separate tab) — see Pages/Authors pattern below.
- `slugField()` usage and placement (sidebar position, at end of fields array).
- SEO plugin tab integration pattern (`seoFields()` spread inside a `{ label: 'SEO', fields: [...seoFields()] }` tab) — though Phase 1 uses `@payloadcms/plugin-seo`'s own `tabbedUI: true` instead of a hand-rolled `seoFields()` utility, so this is a naming-convention reference only, not a literal copy.

**Explicit pitfall (RESEARCH.md Pitfall 2):** Do not copy `JuanPortfolio`'s actual CaseStudies fields — that collection is just `heroImage` + one `richText` blob, predates the ariannalupi.com-reference structured model this phase requires.

---

### `src/collections/Pages/index.ts` (model, CRUD)

**Analog:** `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/collections/Pages/index.ts` (310 lines — read in full)

**Imports pattern** (lines 1-47): access utils + every block config imported individually, plus `slugField`, hooks (`populatePublishedAt`, `revalidatePage`, `createRedirectOnSlugChange`).

**Access pattern** (lines 51-56):
```typescript
access: {
  create: authenticated,
  delete: authenticated,
  read: authenticatedOrPublished,
  update: authenticated,
},
```

**Blocks-layout field pattern** (lines 150-200) — this is the core pattern for SCHEMA-06 (blocks registered on `Pages.layout`):
```typescript
{
  name: 'content',
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      blocks: [ /* full consolidated block list goes here */ ],
      required: true,
      admin: { initCollapsed: true },
    },
  ],
  label: 'Content',
},
```

**Versions/drafts pattern** (lines 301-309):
```typescript
versions: {
  drafts: {
    autosave: { interval: 100 },
    schedulePublish: true,
  },
  maxPerDoc: 50,
},
```

**Deviation for Phase 1:** strip all GSC/keyword/index-status UI fields (`gscClicks`, `keywordScorePanel`, `indexingControl`, `indexStatus`, `primaryKeyword`, `semanticKeywords`) — these are the dropped KeywordMetrics/GSCMetrics/PageMetrics collections' UI hooks (DROP list per CONTEXT.md). Strip `syncKeywordsAfterPostSave` hook. Keep `slugField`, `populatePublishedAt`, `revalidatePage`/`createRedirectOnSlugChange` hook *shapes* but revalidation logic is inert until Phase 5 has real routes to revalidate — may be simplified/deferred in Phase 1 if no frontend routes exist yet (planner's call).

**Block list for `layout`:** use only the ~12-14 consolidated blocks from CONTEXT.md's Blocks decision, not JuanPortfolio's full ~35-block list shown in this file (lines 156-193) — that list is exactly the "before" state RESEARCH.md's State of the Art table documents as superseded.

---

### `src/collections/Users/index.ts` (model, CRUD)

**Analog (minimal shape):** aprendoclub's inline `Users` object in `payload.config.ts` (lines 29-36):
```typescript
const Users = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [],
}
```

**Analog (auth/access pattern only):** `JuanPortfolio/src/collections/Users/index.ts` (281 lines) — pull only:
- `auth: true` placement and `admin.useAsTitle`/`defaultColumns` shape (lines 71-84).
- Access pattern using `admins`/`adminsAndUser` (lines 73-79) — or simplify to plain `authenticated` access per Phase 1's simplified-Users decision.

**Explicit strip list (CONTEXT.md: "simplificado, sin campos ligados a MCP"):** do NOT port `expertise`, `education`, `experience`, `credentials` (already marked deprecated in-file), `liveUrl` UI field, `primaryKeyword` relationship to `keyword-metrics` (KeywordMetrics is DROP-listed), or the `ensureUniqueSlug` custom hook (lines 9-66, tied to a `users`-scoped slug uniqueness check that's overkill for a single-admin Users collection). Keep only: `name`, `bio`, `avatar`, `slugField()` if an author-facing profile is still needed — but note CONTEXT.md's Authors collection already covers the public-facing author profile, so Users may need only `name`/`email`(auth)/`role` for admin login purposes.

---

### `src/collections/Categories/index.ts` (model, CRUD)

**Analog:** `JuanPortfolio/src/collections/Categories.ts` (133 lines) for tabs/SEO structure; `aprendoclub/collections/Category.ts` for a Postgres-proven simpler alternative (not read in full this session — flagged as secondary, lower priority than the primary JuanPortfolio analog since JuanPortfolio's field-naming convention already matches this project's target English-first slugs).

**Core pattern** (lines 105-132 of JuanPortfolio/Categories.ts):
```typescript
export const Categories: CollectionConfig = {
  slug: 'categories',
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: { useAsTitle: 'title' },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Categoría', fields: [ /* title, description, slugField */ ] },
      { label: 'SEO', fields: [...seoFields()] },
    ]},
  ],
}
```

**Strip for Phase 1:** `liveUrl` UI field, `primaryKeyword`/`indexingControl`/`indexStatus` (GSC/keyword-metrics UI, DROP-listed), and the hand-rolled `faqs` array field (Phase 1's `FAQ` block already covers this need at the page-builder level — no need to duplicate on Categories).

---

### `src/collections/Authors/index.ts` (model, CRUD)

**Analog:** `JuanPortfolio/src/collections/Authors/index.ts` (187 lines, full file read) — already close to Phase 1's target: public `read: () => true`, no auth fields, `slugField('name')`.

**Strip for Phase 1:** `education`/`experience`/`socialMedia`/`expertise` arrays are heavy E-E-A-T-oriented fields from a later content-audit phase of the old site — CONTEXT.md's Authors decision doesn't call for this level of detail ("Authors" is just KEEP-listed with no elaborated field spec, so Claude's Discretion applies per CONTEXT.md's discretion section — recommend trimming to `name`, `bio`, `avatar`, `slugField('name')`, and an SEO tab, matching the lean pattern used for Clientes/Testimonials elsewhere in this phase).

---

### `src/access/authenticated.ts` and `src/access/authenticatedOrPublished.ts` (utility, request-response)

**Analog:** port verbatim from `JuanPortfolio/src/access/authenticated.ts` (22 lines) and `JuanPortfolio/src/access/authenticatedOrPublished.ts` (27 lines) — both are already minimal, dependency-free, standard Payload `Access`/`AccessArgs` typed functions with no MCP/legacy coupling.

```typescript
// authenticated.ts
import type { AccessArgs } from 'payload'
import type { User } from '@/payload-types'

type isAuthenticated = (args: AccessArgs<User>) => boolean

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}
```

```typescript
// authenticatedOrPublished.ts
import type { Access } from 'payload'

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

Applies to: Pages, Posts, CaseStudies (read/create/update/delete access per Security Domain table in RESEARCH.md).

---

### `src/fields/slug.ts` (utility, transform)

**Analog:** port verbatim from `JuanPortfolio/src/fields/slug.ts` (36 lines) per RESEARCH.md's "Don't Hand-Roll" table — already solves slugify + uniqueness admin UX in one small utility.

```typescript
import type { Field } from 'payload'
import { deepMerge } from '../utilities/deepMerge'

type Slug = (fieldToUse?: string, overrides?: Partial<Field>) => Field

export const slugField: Slug = (fieldToUse = 'title', overrides = {}) =>
  deepMerge<Field, Partial<Field>>(
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      index: true,
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          async ({ value, originalDoc, data }) => {
            if (typeof value === 'string') return value.toLowerCase().replace(/ /g, '-')
            const useData = data || originalDoc
            if (useData && typeof useData?.[fieldToUse] === 'string') {
              return useData?.[fieldToUse]?.toLowerCase().replace(/ /g, '-')
            }
            return value
          },
        ],
      },
    },
    overrides,
  )
```

**Note:** this utility depends on a `deepMerge` helper (`../utilities/deepMerge`) — port that small helper alongside it, or inline a simpler merge if the planner wants to avoid the extra utility file for Phase 1's minimal footprint.

---

### Block configs (all: config role, transform data flow)

All 12 block configs below follow one shared shape — `import type { Block } from 'payload'`, `export const X: Block = { slug, interfaceName?, fields: [...], labels?: {...} }`. Port near-verbatim from JuanPortfolio; every one was read in full this session.

**FAQ** — analog `JuanPortfolio/src/blocks/FAQ/config.ts` (34 lines, exact copy candidate — `title` + `faqs` array of `{question, answer:richText}`).

**Code** — analog `JuanPortfolio/src/blocks/Code/config.ts` (33 lines, exact copy candidate — `language` select + `code` field type).

**TableOfContentsBlock** — analog `JuanPortfolio/src/blocks/TableOfContentsBlock/config.ts` (60 lines, exact copy candidate — position/sticky/minHeadingLevel controls).

**MediaBlock** — analog `JuanPortfolio/src/blocks/MediaBlock/config.ts` (17 lines) — drop the `animationField()` import/call (that's a presentation-layer field for a later phase's motion system, not needed for Phase 1 schema).

**ContactFormBlock** — analog `JuanPortfolio/src/blocks/ContactFormBlock/config.ts` (116 lines, exact copy candidate — already matches CONTEXT.md's "ContactFormBlock simple, sin plugin-form-builder" decision precisely: eyebrow/title/description/submitLabel/sidebar fields + `contactInfo` array with icon select).

**CallToAction** — analog `JuanPortfolio/src/blocks/CallToAction/config.ts` (44 lines) — keep the `richText` + `linkGroup()` shape; the `animationField()` call can be dropped same as MediaBlock if the planner wants zero presentation-layer fields in Phase 1 schema (Claude's Discretion — CONTEXT.md doesn't prohibit it, low risk either way since it's just an extra field).

**TestimonialsCarousel** — analog `JuanPortfolio/src/blocks/TestimonialsCarousel/config.ts` (35 lines, exact copy candidate — title/showRating/limit, pulls from the `testimonials` collection at render time, no config-side relationship needed).

**ResultsSection** — analog `JuanPortfolio/src/blocks/ResultsSection/config.ts` (65 lines, exact copy candidate — title/description/`stats` array minRows:1 maxRows:6/backgroundColor select).

**Content** — analog `JuanPortfolio/src/blocks/Content/config.ts` (83 lines, exact copy candidate — `columns` array with size/richText/enableLink/link).

**RelatedPosts** — analog `JuanPortfolio/src/blocks/RelatedPostsBlock/config.ts` (53 lines, exact copy candidate — title/posts relationship/autoSelect/limit).

**ArchiveBlock** — analog `JuanPortfolio/src/blocks/ArchiveBlock/config.ts` (94 lines). **Structural pattern to extend, not copy verbatim** — RESEARCH.md's own code example (lines 508-546) already shows the target consolidated shape (`relationTo` select with `posts`+`case-studies` options, `mode: latest/manual` radio replacing JuanPortfolio's `populateBy: collection/selection`). Use JuanPortfolio's file for the `admin.condition` callback pattern (conditionally showing `limit` vs `selectedDocs` based on a sibling field) — that exact conditional-field technique is the one part worth copying directly:
```typescript
admin: {
  condition: (_, siblingData) => siblingData.populateBy === 'collection',
},
```
**Critical constraint from RESEARCH.md Pitfall 5:** any future "grid of N items" need must extend this block's `relationTo` options, never spawn a new block slug — document this constraint as a code comment in the new `ArchiveBlock/config.ts`.

**Section** — analog `JuanPortfolio/src/blocks/Section/config.ts` (101 lines, exact copy candidate for the wrapper mechanics — container/paddingY/backgroundStyle row, conditional backgroundColor/backgroundMedia, `anchorId`/`className`, nested `blocks` field). **Update the nested `blocks` array** (line 94 in the analog) to reference only the new consolidated block set (`CallToAction`, `Content`, `MediaBlock`, `ArchiveBlock`) instead of the old `Form`/`Intro`/`WorkCards`/`FeaturedClients` set — those originals are DROP-listed or superseded per CONTEXT.md.

**Hero** — analog `JuanPortfolio/src/blocks/HeroHome/config.ts` (118 lines) — **role-match only, not exact**. RESEARCH.md's own code example (lines 548-575) is the primary source for the new consolidated `Hero` block's shape (adds a `variant` select discriminator: home/listing/post-header/case-study-header — a field HeroHome doesn't have, since in the old codebase these were 4+ separate block slugs). Pull from `HeroHome/config.ts` only the `badge`/`title`/`subtitle`/`primaryCta`/`secondaryCta` group shapes as sub-field inspiration if the planner wants richer Hero fields than RESEARCH.md's minimal example — but the `variant` field itself and the "keep schema flat, no condition callbacks" instruction come from RESEARCH.md, not this analog.

---

### `src/blocks/Pages` block-registration pattern (cross-cutting)

**Source:** `JuanPortfolio/src/collections/Pages/index.ts` lines 152-199 — every block gets imported individually at the top of the file and listed by name in the `layout.blocks` array. Follow this exact import-and-array-literal convention, not a barrel/index re-export — matches existing project convention and keeps tree-shaking/type-inference simple.

---

### `next.config.mjs` (config, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/apturio/website/next.config.mjs` (36 lines, full file read)

```javascript
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [], // empty in Phase 1 — local-disk media only; add Cloudinary pattern in Phase 3
  },
}

export default withPayload(nextConfig)
```

**Deviation:** apturio wraps `withPayload()` with `createNextIntlPlugin()` (`withNextIntl(nextConfig)`) for i18n routing — that's explicitly Phase 2 scope per CONTEXT.md's phase boundary ("No incluye: routing i18n"). Drop the `next-intl` plugin wrapper and the `async redirects()` block (apturio's is app-specific legacy-URL redirects, not applicable here) for Phase 1.

---

### `package.json` scripts (config, batch)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/apturio/website/package.json` scripts block (lines 6-18)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "payload migrate && payload generate:importmap && payload generate:types && next build",
    "postbuild": "cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/",
    "start": "next start",
    "start:standalone": "node .next/standalone/server.js",
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap"
  }
}
```
This is an exact-copy candidate per RESEARCH.md's own "package.json build/dev scripts" code example — the two sources agree verbatim.

---

## Shared Patterns

### Migration discipline (`push: false`)
**Source:** `aprendoclub/payload.config.ts` line 62, comment included
**Apply to:** the single `db: postgresAdapter({ ... push: false })` call in `payload.config.ts` — this is the one place this pattern lives, but it governs every collection file's schema-change workflow (RESEARCH.md Pitfall 3: never let this become env-conditional or default to `true`).

### Access control tiering
**Source:** `JuanPortfolio/src/access/authenticated.ts` + `authenticatedOrPublished.ts`
**Apply to:** Pages, Posts, CaseStudies (all three: `create/delete/update: authenticated`, `read: authenticatedOrPublished`); Media and Clientes get `read: () => true` instead (public assets/logos, per `aprendoclub/collections/Media.ts` and `ClientesTrabajados.ts` patterns) — Authors also `read: () => true` per `JuanPortfolio/src/collections/Authors/index.ts` (public author profile, no private data).

### Slug field convention
**Source:** `JuanPortfolio/src/fields/slug.ts`
**Apply to:** every collection with a public URL — Pages, Posts, Authors, Categories, CaseStudies. NOT Testimonials or Clientes (no standalone public page for either, per CONTEXT.md's collection scope).

### Tabs + SEO-tab admin convention
**Source:** `JuanPortfolio/src/collections/Pages/index.ts` (tabs with named sub-objects) and `Categories.ts`/`Authors/index.ts` (simpler 2-tab pattern: content tab + SEO tab)
**Apply to:** Pages, Posts, CaseStudies (per CONTEXT.md's `@payloadcms/plugin-seo` tabbedUI decision — the plugin auto-injects its own SEO tab when `tabbedUI: true` is set in `payload.config.ts`, so collections don't need a hand-rolled `seoFields()` tab like JuanPortfolio's — that's the one place Phase 1 diverges from the JuanPortfolio pattern in favor of the official plugin, per CONTEXT.md's locked "KEEP: `@payloadcms/plugin-seo`" decision).

### Block config shape (`Block` type, `slug` + `interfaceName` + `fields`)
**Source:** every block file in `JuanPortfolio/src/blocks/*/config.ts` (12 read this session, all consistent)
**Apply to:** all 13 new block config files listed above — this is the single most consistent, copy-ready pattern found in the entire pattern search.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/collections/CaseStudies/index.ts` (field shape only — admin/tabs wiring has an analog) | model | CRUD | No existing codebase implements CONTEXT.md's structured KPI/challenge/solution/results model verbatim (confirmed MEDIUM confidence in RESEARCH.md's own Metadata section) — RESEARCH.md's code example is the authoritative source, not a codebase analog |
| `src/migrations/<timestamp>_initial.ts` | migration | batch | Generated by `payload migrate:create`, not hand-authored — no meaningful "analog" beyond aprendoclub's migration *file naming convention*, which is already noted in the classification table |

## Metadata

**Analog search scope:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub` (collections/, payload.config.ts, migrations/), `/Users/juan/Documents/Codigo/Arianna/apturio/website` (next.config.mjs, package.json), `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src` (collections/, blocks/, access/, fields/)
**Files read directly this session:** 27 (payload.config.ts x1, collections x8, blocks x12, access x2, fields x1, next.config.mjs x1, package.json x1, migrations dir listing x1)
**Pattern extraction date:** 2026-07-09
