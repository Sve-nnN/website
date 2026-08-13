# Phase 2: Bilingüe + SEO - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 15
**Analogs found:** 13 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/i18n/routing.ts` | config | request-response | `apturio/website/src/i18n/routing.ts` | exact (values differ, shape identical) |
| `src/i18n/request.ts` | config | request-response | `apturio/website/src/i18n/request.ts` | exact |
| `src/middleware.ts` | middleware | request-response | `JuanPortfolio/src/middleware.ts` (behavior) + `apturio/website/src/middleware.ts` (next-intl shape) | role-match, composite |
| `next.config.mjs` (modify) | config | request-response | `apturio/website/next.config.mjs` (next-intl wiring) + current `juan-payload/next.config.mjs` (base) | exact |
| `messages/es.json`, `messages/en.json` | config | request-response | none in-repo — new pattern | no analog |
| `src/payload.config.ts` (modify: add `localization`) | config | CRUD | `apturio/website/src/payload.config.ts:132-139` | exact |
| `src/collections/Media/index.ts` (modify: `alt` → `localized: true`) | model | CRUD | current `juan-payload/src/collections/CaseStudies/index.ts` (localized text field convention) | exact (in-repo) |
| `src/payload.config.ts` (modify: `seoPlugin` generateTitle/generateDescription) | config | CRUD | `apturio/website/src/payload.config.ts:59-67` | exact |
| `src/app/sitemap.ts` | route | request-response | `JuanPortfolio/src/utilities/sitemap.ts` + `JuanPortfolio/src/app/(frontend)/(sitemaps)/*` (structure to replace) | role-match, being simplified per RESEARCH.md Pattern 4 |
| `src/app/robots.ts` | route | request-response | `JuanPortfolio/src/app/robots.txt` + `src/globals/Robots` (being simplified to native convention, no plugin) | role-match |
| `src/globals/Llms/index.ts` | model (global) | CRUD | `aprendoclub/aprendoclub/globals/Llms.ts` | exact |
| `src/app/llms.txt/route.ts` | route | request-response | `aprendoclub/aprendoclub/app/llms.txt/route.ts` + `JuanPortfolio/src/app/(frontend)/llms.txt/route.ts` | exact |
| `src/app/llms-full.txt/route.ts` | route | request-response | same as above, `llmsFull` field variant | exact |
| JSON-LD components (Person/Article/Breadcrumb) | component | request-response | none in-repo — new pattern, RESEARCH.md Pattern 6 inline example is the reference | no analog |
| `redirects` collection execution step inside `src/middleware.ts` | middleware | event-driven | none in-repo — new pattern (plugin only manages the collection, RESEARCH.md Pitfall 3/4) | no analog |

## Pattern Assignments

### `src/i18n/routing.ts` (config, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/i18n/routing.ts`

Full file (8 lines):
```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // Both domains point to the same Vercel deployment; keep /en/ explicit.
  localePrefix: 'always',
})
```

**Do NOT copy `localePrefix: 'always'` or `defaultLocale: 'en'`** — those are apturio's business decision, not this project's. This project's locked values (CONTEXT.md):
```typescript
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: false, // CRITICAL — see RESEARCH.md Pitfall 1, apturio does not set this
})
```
Copy the *shape* (single `defineRouting` call, no other exports) from apturio; copy the *values* from RESEARCH.md Pattern 1 / CONTEXT.md.

---

### `src/i18n/request.ts` (config, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/i18n/request.ts`

Full file (14 lines) — copy verbatim, only the relative import path to `messages/{locale}.json` needs to match this project's structure:
```typescript
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```
No changes needed beyond this — apturio's file is already locale-agnostic (doesn't hardcode `en`/`es`).

---

### `src/middleware.ts` (middleware, request-response — composite: locale routing + redirects execution)

**Two analogs, different responsibilities:**

1. **URL-prefix behavior to preserve** — `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/middleware.ts` (84 lines, full file read). This is the CURRENT hand-rolled logic being replaced/simplified, not copied as-is. Key behavioral contract to preserve (RESEARCH.md confirms `localePrefix: 'as-needed'` + `localeDetection: false` reproduces this natively):
   - Static/`/admin`/`/api`/`/sitemap*` excluded via matcher (lines 13-26)
   - `/es` or `/es/*` → 301 redirect to unprefixed (lines 31-36) — next-intl's `as-needed` mode does this automatically, no custom code needed
   - `/` → internally serves the `es` (default) tree without exposing a prefix (lines 56-64) — native `as-needed` behavior
   - Any other unprefixed path → served as `es` internally (lines 69-76) — native `as-needed` behavior
   - Matcher excludes `_next|api|admin|favicon.ico|sitemap|.*-sitemap.xml|.*\.` (lines 79-84)

2. **next-intl composition shape** — `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/middleware.ts` (19 lines, full file read):
```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    '/',
    '/((?!admin|api|_next|_vercel|pay-per-use|add-ons|strategy-call|privacy-policy|terms-of-service|thank-you|checkout|demo-spanish|.*\\..*).*)',
  ],
}
```
Copy the matcher shape (exclude `admin|api|_next|_vercel|.*\.` — drop apturio's project-specific marketing-route exclusions, they don't apply here). Add `sitemap`/`llms.txt`/`robots.txt` to the exclusion list per JuanPortfolio's matcher since this project also hand-builds those as top-level routes outside `[locale]`.

**New composition** (not present in either analog — RESEARCH.md Pattern 1 is the reference for wiring the redirects-lookup step before `intlMiddleware(request)`, since Next.js allows only one `middleware.ts` file — see Pitfall 3):
```typescript
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export const runtime = 'nodejs' // Payload Local API is not Edge-compatible — RESEARCH.md Pitfall 4

const intlMiddleware = createIntlMiddleware(routing)

export default async function middleware(request: NextRequest) {
  // 1. redirects collection lookup (new — no in-repo analog, see RESEARCH.md Pattern 1/Pitfall 3-4)
  // 2. fall through to intlMiddleware(request)
}
```

---

### `next.config.mjs` (config, modify)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/apturio/website/next.config.mjs` (35 lines, full file read) for the `createNextIntlPlugin` wrapper; current `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/next.config.mjs` (13 lines, full file read) is the base to modify.

**Wrapper pattern to add** (apturio lines 1-5, 35):
```javascript
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
// ...nextConfig unchanged...
export default withPayload(withNextIntl(nextConfig))
```
Current file's `output: 'standalone'` and `images.remotePatterns: []` (Cloudinary comes in Phase 3) stay untouched — only the export line and the new import/wrapper are added. Do NOT copy apturio's `async redirects()` block — that's their project-specific legacy-URL 301s; this project's redirects are handled by `@payloadcms/plugin-redirects` + middleware instead (CONTEXT.md locked decision).

---

### `src/payload.config.ts` (config, modify — add `localization` block + `seoPlugin` generate functions)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/payload.config.ts` lines 132-139 (localization) and lines 59-67 (seoPlugin), both read directly.

**Localization block** (copy shape, NOT `defaultLocale: 'en'`):
```typescript
// apturio/website/src/payload.config.ts:132-139
localization: {
  locales: [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ],
  defaultLocale: 'en', // this project uses 'es' — CONTEXT.md locked decision
  fallback: true,
},
```
This project's version (values from CONTEXT.md, order matches existing `Users, Media, Pages...` collection array style already in `juan-payload/src/payload.config.ts:46`):
```typescript
localization: {
  locales: [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ],
  defaultLocale: 'es',
  fallback: true,
},
```

**seoPlugin generate functions** (apturio lines 59-67):
```typescript
seoPlugin({
  collections: ['posts', 'pages'],
  uploadsCollection: 'media',
  // The plugin's default meta fields (title/description/image) are already
  // `localized: true`, so the injected `meta` group is fully localized.
  generateTitle: ({ doc }: { doc: { title?: string } }) => doc?.title ?? '',
  generateDescription: ({ doc }: { doc: { excerpt?: string } }) =>
    doc?.excerpt ?? '',
}),
```
Current `juan-payload/src/payload.config.ts:48-52` already has the bare `seoPlugin({ collections: ['pages','posts','case-studies'], uploadsCollection: 'media', tabbedUI: true })` — add `generateTitle`/`generateDescription` following apturio's shape, extended to include `case-studies` doc fields (`heroSubtitle` per RESEARCH.md Pattern 3 example) since apturio doesn't have a case-studies-equivalent collection.

---

### `src/collections/Media/index.ts` (model, CRUD — modify: `alt` field)

**Analog (in-repo):** `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/src/collections/CaseStudies/index.ts:23-25` (already read in full as part of Pages/CaseStudies grep) — shows the project's own `localized: true` convention on simple text fields:
```typescript
{ name: 'title', type: 'text', required: true, localized: true },
{ name: 'heroMetric', type: 'text', localized: true },
```

**Current gap** — `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/src/collections/Media/index.ts:16-22` (full file read):
```typescript
fields: [
  {
    name: 'alt',
    type: 'text',
    required: true,
  },
],
```
**Fix (RESEARCH.md Pitfall 6, CONTEXT.md explicitly anticipates this):**
```typescript
fields: [
  {
    name: 'alt',
    type: 'text',
    required: true,
    localized: true,
  },
],
```

---

### `src/app/sitemap.ts` (route, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/utilities/sitemap.ts` and `src/app/(frontend)/(sitemaps)/*` — this is the OLD multi-file pattern (separate `pages-sitemap.xml`, `posts-sitemap.xml`, `authors-sitemap.xml`, `categories-sitemap.xml` route segments plus a shared `sitemap.ts` utility) being **replaced/simplified** per RESEARCH.md Pattern 4 and the "Don't Hand-Roll" table — do not replicate the multi-route-segment structure; use a single `app/sitemap.ts` returning `MetadataRoute.Sitemap`.

**Reference implementation** (RESEARCH.md Pattern 4, not yet in either codebase as a single-file version):
```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 0,
    locale: 'all',
  })
  return pages.map((page) => {
    const slug = page.slug === 'home' ? '' : page.slug
    return {
      url: `${SITE_URL}/${slug}`,
      lastModified: page.updatedAt,
      alternates: { languages: { es: `${SITE_URL}/${slug}`, en: `${SITE_URL}/en/${slug}` } },
    }
  })
  // repeat/merge for posts, case-studies, authors, categories per I18N-03
}
```
Merge in analogous queries for `posts`, `case-studies`, `authors`, `categories` collections (all now exist in `juan-payload` from Phase 1, unlike JuanPortfolio's older schema) — same `payload.find` + `alternates.languages` shape per entry.

---

### `src/app/robots.ts` (route, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/app/robots.txt` + `src/globals/Robots` — OLD pattern used a Payload global to make robots.txt admin-editable. RESEARCH.md explicitly says this phase uses the **native Next.js convention instead, no plugin/global** (~10 lines):
```typescript
// src/app/robots.ts — RESEARCH.md Pattern 5
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'}/sitemap.xml`,
  }
}
```
Do not create a `src/globals/Robots` global in this project — that was JuanPortfolio's approach, explicitly superseded per CONTEXT.md/RESEARCH.md ("no plugin needed").

---

### `src/globals/Llms/index.ts` (model/global, CRUD)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/globals/Llms.ts` (47 lines, full file read) — this is the exact pattern CONTEXT.md names as reference.

```typescript
// aprendoclub/aprendoclub/globals/Llms.ts (Spanish-admin-labels variant — aprendoclub is a Spanish-only project)
import type { GlobalConfig } from 'payload'
import { LLMS_TXT_SEED, LLMS_FULL_SEED } from '../lib/llms/seed'

export const Llms: GlobalConfig = {
  slug: 'llms',
  label: 'llms.txt',
  admin: {
    group: 'Sitio',
    description: 'Archivos para agentes de IA (estándar llms.txt). Editables acá; se publican en /llms.txt y /llms-full.txt.',
  },
  fields: [
    { name: 'llmsTxt', type: 'textarea', required: true, label: 'llms.txt (índice conciso)', defaultValue: LLMS_TXT_SEED, admin: { rows: 22, description: '...' } },
    { name: 'llmsFull', type: 'textarea', required: true, label: 'llms-full.txt (contenido completo)', defaultValue: LLMS_FULL_SEED, admin: { rows: 30, description: '...' } },
  ],
}
export default Llms
```
Copy this shape directly. The `defaultValue: LLMS_TXT_SEED` pattern (seeding from a separate `lib/llms/seed.ts` constants file) is optional — for this phase, per CONTEXT.md ("contenido de prueba/placeholder"), a simple inline placeholder string or omitting `defaultValue` (relying on `required: true` + manual admin entry) is acceptable; RESEARCH.md's own inline example (lines 461-489) omits `defaultValue` entirely, which is the simpler variant to follow for placeholder-content-only scope.

**Note on labels:** this project is bilingual EN/ES with the admin UI already in English-first conventions (`juan-payload/src/collections/*` use English field labels/admin descriptions per Phase 1), unlike aprendoclub which is Spanish-only — follow this project's own established admin-label language, not aprendoclub's Spanish labels verbatim.

---

### `src/app/llms.txt/route.ts` and `src/app/llms-full.txt/route.ts` (route, request-response)

**Analog:** `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/app/llms.txt/route.ts` (16 lines, full file read):
```typescript
import { getPayloadClient } from "@/lib/payload";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getPayloadClient();
  const llms = await payload.findGlobal({ slug: "llms" });
  return new Response(llms.llmsTxt ?? "", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```
**Adapt import** — this project doesn't have a `getPayloadClient()` wrapper (aprendoclub-specific helper); use the direct `getPayload({ config })` + `@payload-config` pattern already established in Phase 1's `src/app/(payload)/api/[...slug]/route.ts` convention (Payload's own scaffolded pattern) and confirmed in RESEARCH.md Code Examples section:
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const llms = await payload.findGlobal({ slug: 'llms' })
  return new Response(llms.llmsTxt ?? '', {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
```
For `llms-full.txt/route.ts`, same shape reading `llms.llmsFull` instead — confirmed pattern from `aprendoclub/app/llms-full.txt/route.ts` (not re-read, same file family, field-name swap only per CONTEXT.md/RESEARCH.md).

---

### JSON-LD components (Person/Article/Breadcrumb) — no analog

No existing JSON-LD/schema.org code found in `juan-payload`, `apturio`, or `JuanPortfolio` repos searched. RESEARCH.md's own inline examples (Architecture Pattern 6) are the only reference — hand-written `<script type="application/ld+json">` Server Components reading already-fetched Payload doc fields (`title`, `excerpt`, `heroImage`, plugin-seo `meta` group). Planner should treat RESEARCH.md Pattern 6 as the primary source, not a codebase analog.

---

### Redirects execution step — no analog

No existing middleware-based redirect-collection lookup exists in any of the three repos searched (`@payloadcms/plugin-redirects` only ships the admin collection, confirmed in RESEARCH.md). RESEARCH.md Pattern 1 (composed into `src/middleware.ts`, see above) and Pitfalls 3-4 are the only reference — no in-repo or reference-repo precedent for this specific composition (live Local API query from `runtime: 'nodejs'` middleware).

## Shared Patterns

### Locale-aware URL construction (`alternates.languages`)
**Source:** RESEARCH.md Pattern 4 (`src/app/sitemap.ts` example)
**Apply to:** `sitemap.ts` entries, JSON-LD `url` fields, any `<link rel="alternate" hreflang>` tags added to page `generateMetadata()`
```typescript
alternates: {
  languages: {
    es: `${SITE_URL}/${slug}`,
    en: `${SITE_URL}/en/${slug}`,
  },
},
```

### `localized: true` field convention
**Source:** `juan-payload/src/collections/CaseStudies/index.ts:23-25`, `Pages/index.ts:44-48`, `Posts/index.ts:35-46` (already-established in-repo convention from Phase 1)
**Apply to:** `Media.alt` fix (this phase), any new field added to Pages/Posts/CaseStudies during this phase
```typescript
{ name: 'fieldName', type: 'text', required: true, localized: true },
```

### `dynamic = 'force-dynamic'` for admin-editable routes
**Source:** `aprendoclub/aprendoclub/app/llms.txt/route.ts:4`, `JuanPortfolio/src/app/(frontend)/llms.txt/route.ts` (implicit via `Cache-Control` headers)
**Apply to:** `llms.txt/route.ts`, `llms-full.txt/route.ts` — NOT `sitemap.ts`/`robots.ts` (those can use Next.js's default static/ISR behavior since they're queried at request time via `MetadataRoute` conventions, no explicit `force-dynamic` needed per Next.js docs referenced in RESEARCH.md)

### Payload Local API access pattern (route handlers)
**Source:** RESEARCH.md Code Examples section, consistent across `sitemap.ts`/`llms.txt/route.ts` examples
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
```
**Apply to:** `sitemap.ts`, `llms.txt/route.ts`, `llms-full.txt/route.ts`, and the redirects-lookup step in `middleware.ts` (with `runtime = 'nodejs'` — RESEARCH.md Pitfall 4).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `messages/es.json`, `messages/en.json` | config | request-response | No existing next-intl message catalogs in `juan-payload`; apturio's `messages/` directory exists but wasn't read (key structure is Claude's Discretion per CONTEXT.md, project-specific UI strings, not a copyable pattern) |
| JSON-LD components (`PersonJsonLd`, `ArticleJsonLd`, `BreadcrumbJsonLd`) | component | request-response | No JSON-LD code exists in any of the three searched repos; RESEARCH.md Pattern 6 inline examples are the only reference |
| Redirects-lookup composition in `middleware.ts` | middleware | event-driven | `@payloadcms/plugin-redirects` only manages the admin collection; no repo has execution-side middleware code — RESEARCH.md Pattern 1 (unimplemented reference) and Pitfalls 3-4 are the guidance |

## Metadata

**Analog search scope:**
- `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/src` (current project, Phase 1 scaffold)
- `/Users/juan/Documents/Codigo/Arianna/apturio/website/src` (next-intl + Payload localization production reference)
- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src` (URL-parity behavior to replicate/simplify)
- `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub` (llms.txt global + route pattern)

**Files scanned:** 15 target files classified; 9 analog source files read in full, 2 analog files grep-located + partial read (`apturio/website/src/payload.config.ts`)
**Pattern extraction date:** 2026-07-09
</content>
