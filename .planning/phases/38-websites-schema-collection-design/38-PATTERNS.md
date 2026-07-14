# Phase 38: Websites — Schema & Collection Design - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 2 (1 new, 1 modified)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/collections/Websites/index.ts` (new) | model (Payload CollectionConfig) | CRUD | `src/collections/CaseStudies/index.ts` | exact |
| `src/payload.config.ts` (modified) | config | CRUD (registration) | itself (existing collection-registration blocks) | exact |

No controllers/services/routes are involved — Payload collection configs are declarative schema objects; "role" here is best understood as "model" and there is no separate service/controller layer to touch for this phase (frontend/content is Phase 39/40).

## Pattern Assignments

### `src/collections/Websites/index.ts` (model, CRUD)

**Analog:** `src/collections/CaseStudies/index.ts` (full file, 105 lines — read in one pass)

**Imports pattern** (CaseStudies lines 1-7):
```typescript
import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { TestimonialSection } from '@/blocks/TestimonialSection/config'
```
For `Websites`, drop the `lexicalEditor`/`TestimonialSection` imports (CONTEXT.md decisions don't call for richText or blocks fields on Websites) unless a future decision adds one. Keep the `authenticated`, `authenticatedOrPublished`, and `slugField` imports — all three are required by CONTEXT.md decisions.

**Collection shell + access + admin + versions pattern** (CaseStudies lines 9-22):
```typescript
export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'client', 'updatedAt'] },
  versions: {
    drafts: { autosave: { interval: 100 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  fields: [ /* ... */ ],
}
```
Copy verbatim except: `slug: 'websites'`, `labels: { singular: 'Website', plural: 'Websites' }`, and `admin.defaultColumns: ['title', 'client', 'year', 'updatedAt']` per CONTEXT.md decision (adds `'year'` vs CaseStudies' three columns).

**`challenges` array pattern — reuse CaseStudies' `challenge` shape exactly** (CaseStudies lines 51-55):
```typescript
{
  name: 'challenge',
  type: 'array',
  fields: [{ name: 'text', type: 'textarea', required: true, localized: true }],
},
```
CONTEXT.md explicitly says "reusar el shape de `CaseStudies.challenge`" — for Websites, name the field `challenges` (plural, per CONTEXT.md field list) but keep the identical inner shape: `{ name: 'text', type: 'textarea', required: true, localized: true }`.

**`stack` array pattern (simple text-tag array) — no existing exact analog, closest is `CaseStudies.services`** (CaseStudies lines 36-39):
```typescript
{
  name: 'services',
  type: 'array',
  fields: [{ name: 'service', type: 'text', required: true }],
},
```
CONTEXT.md specifies `stack` as `{ name: 'tag', type: 'text', required: true }` inside the array — same "single required text sub-field, not localized" shape as `services`, just renamed. Also cross-check against `SpeakingEvents.coSpeakers` (`src/collections/SpeakingEvents/index.ts` lines ~53-61) which uses the same single-text-field-in-array pattern with `{ name: 'name', type: 'text', required: true }`.

**`screenshots` array-of-upload pattern — nested upload field inside an array, analog is `Authors.education[].logo`** (`src/collections/Authors/index.ts` lines 91-108):
```typescript
{
  name: 'institution',
  type: 'text',
  localized: true,
  required: true,
},
{
  name: 'logo',
  type: 'upload',
  relationTo: 'media',
},
```
This confirms the codebase pattern for putting an `upload → media` field inside an `array`'s `fields` list. No collection currently has an array whose *only* purpose is a repeatable upload, so for `screenshots` combine this nested-upload precedent with `CaseStudies.heroImage`'s single-upload syntax (line 97):
```typescript
{ name: 'heroImage', type: 'upload', relationTo: 'media' },
```
Recommended shape for Websites:
```typescript
{
  name: 'screenshots',
  type: 'array',
  fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
},
```

**Lighthouse `group` + `number` fields — no single existing analog combines both; compose from two separate precedents**

`group` field precedent, `src/collections/Pages/index.ts` lines 58-62 (structural shape only, contents differ — Pages uses `group` for a blocks layout, not for scalar metrics):
```typescript
{
  name: 'content',
  type: 'group',
  label: 'Content',
  fields: [ /* ... */ ],
},
```
`number` field precedent, `src/collections/Authors/index.ts` lines 179-183:
```typescript
{
  name: 'yearsExperience',
  type: 'number',
  label: { en: 'Years of experience', es: 'Años de experiencia' },
},
```
`number` field precedent #2 (with different context), `src/collections/SpeakingEvents/index.ts` line 83 — same bare `type: 'number'` shape, no min/max used anywhere in codebase today. This phase is the first to need `min`/`max` bounds; use Payload's standard `number` field validation options (`min: 0, max: 100`) — no in-repo precedent to copy for the bounds themselves, this is new but standard Payload API.

Recommended shape for Websites, composing both precedents:
```typescript
{
  name: 'lighthouse',
  type: 'group',
  label: 'Lighthouse',
  fields: [
    { name: 'performance', type: 'number', min: 0, max: 100 },
    { name: 'accessibility', type: 'number', min: 0, max: 100 },
    { name: 'bestPractices', type: 'number', min: 0, max: 100 },
    { name: 'seo', type: 'number', min: 0, max: 100 },
  ],
},
{ name: 'lighthouseCapturedAt', type: 'date', required: true },
```
Per CONTEXT.md, `lighthouseCapturedAt` sits at the same level as the `lighthouse` group (sibling field), not nested inside it — "al mismo nivel del grupo".

**Relationship field pattern** (CaseStudies line 30, inside a `row`):
```typescript
{ name: 'client', type: 'relationship', relationTo: 'clientes', required: false },
```
Copy directly for `Websites.client` (same target collection `clientes`, same `hasMany: false` implicit default, same `required: false`). For `relatedCaseStudy`, same shape targeting `case-studies` instead:
```typescript
{ name: 'client', type: 'relationship', relationTo: 'clientes', hasMany: false, required: false },
{ name: 'relatedCaseStudy', type: 'relationship', relationTo: 'case-studies', hasMany: false, required: false },
```
Also confirmed unidirectional-relationship precedent already exists: CaseStudies' own `client` relationship to `clientes` has no back-reference field defined on `Clientes` — same pattern CONTEXT.md wants for `relatedCaseStudy` (no back-reference added to `CaseStudies`).

**`slugField()` pattern** (CaseStudies line 103, and helper source `src/fields/slug.ts` full file, 30 lines):
```typescript
slugField(),
```
`slugField()` defaults to slugifying from `title` (its `fieldToUse` default param), auto-lowercases and dashes on `beforeValidate`, and is `unique: true, index: true`, admin-sidebar positioned. Websites uses `title` as its title field too, so call it with no arguments exactly like CaseStudies: `slugField()`.

**Localized text fields pattern** (CaseStudies lines 24-33, 60-61, etc.):
```typescript
{ name: 'title', type: 'text', required: true, localized: true },
...
{ name: 'sector', type: 'text', localized: true },
```
Apply `localized: true` to Websites' `title`, `role`, `industry`, and `highlights` fields per CONTEXT.md — same convention as every editorial text field in CaseStudies/Authors/SpeakingEvents.

---

### `src/payload.config.ts` (config, registration)

**Analog:** itself — existing collection-registration pattern (same file, three separate places, all already read in full, 167 lines)

**Import pattern** (line 23):
```typescript
import { CaseStudies } from './collections/CaseStudies'
```
Add: `import { Websites } from './collections/Websites'`

**Collections array registration** (lines 77-88):
```typescript
collections: [
  Users,
  Media,
  Pages,
  Posts,
  Authors,
  Categories,
  CaseStudies,
  Testimonials,
  Clientes,
  SpeakingEvents,
],
```
Add `Websites` to this array (CONTEXT.md doesn't specify exact position; append after `SpeakingEvents` or group near `CaseStudies` — either is consistent with existing ordering which has no strict semantic order).

**seoPlugin registration** (lines 91-92):
```typescript
seoPlugin({
  collections: ['pages', 'posts', 'case-studies', 'authors'],
  ...
```
Add `'websites'` to this array per CONTEXT.md decision: `collections: ['pages', 'posts', 'case-studies', 'authors', 'websites']`.

**Note on other plugins:** `redirectsPlugin`, `searchPlugin`, and `mcpPlugin` collection arrays (lines 111-113, 114-120, 141-160) are NOT mentioned in CONTEXT.md's integration points for Websites — CONTEXT.md only calls out `payload.config.ts` collections array + `seoPlugin`. Do not add `websites` to `redirectsPlugin`/`searchPlugin`/`mcpPlugin` unless a future phase/decision requires it; flag this as a scope boundary for the planner rather than silently including or excluding it.

---

## Shared Patterns

### Access control (identical across all editorial collections)
**Source:** `src/access/authenticated.ts` (8 lines, full file) and `src/access/authenticatedOrPublished.ts` (7 lines, full file)
```typescript
// src/access/authenticated.ts
export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}

// src/access/authenticatedOrPublished.ts
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```
**Apply to:** `Websites.access` — `create`/`delete`/`update: authenticated`, `read: authenticatedOrPublished` (exact CONTEXT.md decision, matches CaseStudies).

### Versions/drafts (identical across CaseStudies and Pages)
**Source:** `src/collections/CaseStudies/index.ts` lines 19-22
```typescript
versions: {
  drafts: { autosave: { interval: 100 }, schedulePublish: true },
  maxPerDoc: 50,
},
```
**Apply to:** `Websites.versions` verbatim (CONTEXT.md: "mismo patrón que CaseStudies").

### Slug field helper
**Source:** `src/fields/slug.ts` (full file, 30 lines) — `slugField(fieldToUse = 'title', overrides = {})`, produces a sidebar-positioned, unique, indexed `text` field that auto-derives from `title` on `beforeValidate` if empty.
**Apply to:** `Websites` — call as `slugField()` with no args (title field is named `title`, matching the default).

## No Analog Found

| File/Pattern | Role | Data Flow | Reason |
|---|---|---|---|
| Lighthouse `number` field with `min`/`max` bounds | field-config | n/a | No collection in the repo currently sets `min`/`max` on a `number` field — this is new but standard Payload API, not a repo convention to deviate from. Use CONTEXT.md's spec directly (0-100 range, 4 metrics + required `lighthouseCapturedAt` date sibling). |
| `screenshots` as a pure array-of-upload (no other sub-fields) | field-config | n/a | Every existing upload field is either a single top-level `upload` (e.g. `CaseStudies.heroImage`) or an `upload` nested among other text/date fields inside an array (e.g. `Authors.education[].logo`). No existing array is dedicated solely to repeatable uploads. Composed recommendation above from the two closest precedents. |

## Metadata

**Analog search scope:** `src/collections/` (CaseStudies, Authors, SpeakingEvents, Pages, Testimonials, Clientes, Posts), `src/access/`, `src/fields/`, `src/payload.config.ts`
**Files scanned:** 9 collection files (full or targeted reads), 2 access files, 1 field helper, 1 config file
**Pattern extraction date:** 2026-07-14
