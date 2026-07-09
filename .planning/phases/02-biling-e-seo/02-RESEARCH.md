# Phase 2: Bilingüe + SEO - Research

**Researched:** 2026-07-09
**Domain:** next-intl routing + Payload CMS native localization + SEO plumbing (sitemap/robots/JSON-LD/redirects/llms.txt) on Payload 3.85 + Next.js 15.4 App Router
**Confidence:** HIGH (URL-prefix behavior, plugin APIs, and Next.js file conventions verified via official docs/registry; MEDIUM on exact locale-cookie interaction and plugin-seo + localization edge cases, flagged inline)

## Summary

The phase combines two independent, complementary systems: **next-intl** (routing + UI strings) and **Payload's native `localization` block** (content fields) — this is not a design choice to re-litigate, it is the confirmed pattern already running in production at apturio. The critical constraint is URL parity: Spanish must be served unprefixed at `/` and English must be served at `/en/...`, exactly matching the current `JuanPortfolio` site's hand-rolled middleware. The good news verified in this research: **next-intl's built-in `localePrefix: 'as-needed'` mode produces this exact behavior natively** — the custom rewrite logic in `JuanPortfolio/src/middleware.ts` (about 80 lines of manual `NextResponse.rewrite`/`redirect` handling) can be replaced by `defineRouting({ locales: ['es','en'], defaultLocale: 'es', localePrefix: 'as-needed' })` + `createMiddleware(routing)`, roughly 10 lines total. The one behavior that must be explicitly configured to match the old site is **`localeDetection: false`** — without it, next-intl's default Accept-Language sniffing would redirect Spanish-preferring bots/users away from the unprefixed root in a way the current site never does, which is a real SEO-parity risk if left on defaults.

`payload.config.ts` currently has **no `localization` block at all** — this must be added in this phase. Several collections already have `localized: true` on the right fields (Pages, Posts, CaseStudies, Testimonials.role/testimonial, Authors.jobTitle/bio, Categories), but `Media.alt` is NOT localized, which is a real content-parity gap (alt text is user-facing/SEO content and differs per language) — flag this for the planner to fix as part of I18N-01. `Clientes` and `Testimonials.name/company` intentionally stay unlocalized (proper nouns, brand names — not user-facing translated copy).

`@payloadcms/plugin-redirects` only manages a `redirects` collection in the admin — it does not execute anything at runtime. No official Payload documentation ships example middleware code; the standard pattern (used by Payload's own website template and confirmed via docs) is a Next.js middleware or route handler that queries the collection and issues the actual redirect. Since next-intl already owns `middleware.ts` for locale routing, the redirects-execution logic must be composed into the SAME middleware function (next-intl's `createMiddleware` result is a function you can wrap/chain), not a second competing middleware file — Next.js only supports one `middleware.ts` per app.

`app/sitemap.ts` and `app/robots.ts` are native Next.js 15 file-convention APIs (`MetadataRoute.Sitemap` / `MetadataRoute.Robots`), no plugin needed, both confirmed via current Next.js docs (v16.2.10 docs, APIs unchanged from 15.x) — including the exact `alternates.languages` shape needed for the EN/ES hreflang pair.

**Primary recommendation:** Install `next-intl@^4.13`, add `payload.config.ts` → `localization: { locales: [{code:'es',label:'Español'},{code:'en',label:'English'}], defaultLocale: 'es', fallback: true }`, build `src/i18n/routing.ts` with `localePrefix: 'as-needed'` + `localeDetection: false`, replace `src/middleware.ts` entirely with next-intl's `createMiddleware`, and layer a small redirects-lookup step into that same middleware function. Fix `Media.alt` to `localized: true` as part of the Phase 2 collection audit.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Locale-prefixed URL routing (`/`, `/en/...`) | Frontend Server (SSR) — `middleware.ts` | — | next-intl middleware runs at the Next.js edge/middleware layer, rewriting/redirecting before any RSC render |
| UI string translation (nav, buttons, labels) | Frontend Server (SSR) | Browser / Client | `next-intl`'s `useTranslations`/`getTranslations` resolve server-side in RSC; client components needing strings get them via props or `NextIntlClientProvider` |
| Content field translation (titles, rich text, SEO meta) | API / Backend (Payload) | — | Payload's native `localized: true` fields, resolved via Local API `locale` param — owned entirely by the CMS, not next-intl |
| SEO meta tabs (title/desc/OG) | API / Backend (Payload) | Frontend Server (rendering `generateMetadata`) | `@payloadcms/plugin-seo` injects fields into Payload; Next.js `generateMetadata()` in each route reads them via Local API |
| Sitemap/robots generation | Frontend Server (SSR) | API / Backend (data source) | `app/sitemap.ts`/`app/robots.ts` are Next.js route handlers that query Payload's Local API in-process — no separate service |
| Redirect execution | Frontend Server (SSR) — `middleware.ts` | API / Backend (Payload, stores the collection) | Plugin only manages data; middleware (frontend tier) is the only place that can intercept a request early enough to issue a 301 before rendering |
| JSON-LD structured data | Frontend Server (SSR) | API / Backend (data source) | Hand-written `<script type="application/ld+json">` in Server Components, sourced from Payload fields already fetched for the page |
| llms.txt / llms-full.txt | Frontend Server (SSR) — route handler | API / Backend (Payload global) | Route handler at `app/llms.txt/route.ts` reads the `Llms` global via Local API, `dynamic = 'force-dynamic'` so admin edits appear without redeploy |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- `defaultLocale: 'es'`, `locales: ['es', 'en']` — same as JuanPortfolio (`src/payload.config.ts:103-113`)
- URL prefix strategy "as-needed": Spanish WITHOUT prefix (`/`, `/blog/...`), English WITH prefix (`/en/`, `/en/blog/...`) — confirmed in `JuanPortfolio/src/middleware.ts` (rewrites `/es/*` to `/*` internally, never exposes `/es/` to the user). This is a URL-parity constraint (PROJECT.md), not a design preference — changing this would break the URL inventory frozen in Phase 4 to preserve rankings.
- next-intl handles: `[locale]` segment routing, UI/interface strings (buttons, labels, nav)
- Payload localization (`localized: true` on fields) handles: editorial content (titles, rich text, per-language SEO metas)
- Confirmed working pattern at apturio (real production reference), not theoretical
- `@payloadcms/plugin-seo` tabbed on Pages, Posts, CaseStudies only — Authors/Categories/Testimonials/Clientes do NOT need it
- No official sitemap plugin — `app/sitemap.ts` (or route handler for cache-bypass) querying Payload Local API directly, with `alternates` for the EN/ES pair
- `app/robots.ts` — native Next.js 15 convention, ~10 lines, no plugin
- JSON-LD hand-written per content type (Person for site-wide/home, Article for posts, potentially CreativeWork/breadcrumb for case studies) — reuses the same fields plugin-seo already manages, no new dependency
- `@payloadcms/plugin-redirects` manages the redirects admin collection; it does NOT execute redirects — an explicit middleware/route handler is required at runtime
- This phase's scope for redirects: the plumbing (collection + working middleware with at least one test redirect). The real bulk redirect map is generated in Phase 4 (MIGR-06) and consumed here
- llms.txt/llms-full.txt: Payload global (`Llms`, same pattern as aprendoclub) + route handler serving plain text — same concept as JuanPortfolio's static files but generated dynamically from the global

### Claude's Discretion

- Internal structure of i18n files (`src/i18n/request.ts`, `messages/es.json`, `messages/en.json` — key count, organization)
- Exact implementation of the next-intl middleware (as long as it preserves "es unprefixed, en prefixed")
- Exact JSON-LD format (as long as valid schema.org, using fields already defined on collections)
- Test/placeholder content used to validate bilingual routing this phase (no real migrated content yet — that's Phase 4)

### Deferred Ideas (OUT OF SCOPE)

- Real bilingual content — arrives in Phase 4 (migration) and Phase 5 (public pages). This phase only proves the technical plumbing.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-01 | Bilingual EN/ES site with next-intl for routing/UI and native Payload localization for content fields, full parity per content type | `routing.ts`/`request.ts`/`middleware.ts` patterns below; collection audit identifies `Media.alt` gap; `payload.config.ts` `localization` block spec |
| I18N-02 | `@payloadcms/plugin-seo` enabled (tabbed) on Pages, Posts, CaseStudies — meta, OG, canonical | Section "SEO Plugin Config", confirmed API + localization interaction caveat |
| I18N-03 | XML sitemaps (pages/posts/authors/categories) and `robots.txt` generated dynamically, no sitemap plugin | Section "Sitemap & Robots", exact `MetadataRoute.Sitemap`/`MetadataRoute.Robots` types + `alternates.languages` pattern |
| I18N-04 | `llms.txt`/`llms-full.txt` maintained for GEO/AI-search discoverability | Section "llms.txt / llms-full.txt", concrete pattern from aprendoclub |
| I18N-05 | Hand-written JSON-LD (Person, Article, BreadcrumbList) on relevant pages | Section "JSON-LD Patterns" |
| I18N-06 | `@payloadcms/plugin-redirects` installed with middleware/route handler that executes redirects | Section "Redirects: Plugin + Execution", composed into the same middleware as next-intl |

## Project Constraints (from CLAUDE.md)

- **Hosting**: Hostinger Cloud/Business Node.js — standalone Next.js output, no Vercel-only features (ISR/edge functions/serverless) may be assumed
- **Database**: PostgreSQL, connection-limit validation deferred to deploy phase
- **Storage**: Cloudinary (Phase 3, not this phase)
- **Email**: Resend via `@payloadcms/email-resend` (already wired, not this phase)
- **Content**: must be a 1:1 replica of current pages — this phase validates plumbing only, not real content
- **Languages**: EN + ES, same scope as current site — directly governs this phase

None of these directives conflict with the recommended approach below.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next-intl` | `4.13.1` [VERIFIED: npm registry — `npm view next-intl version` → 4.13.1, 2026-07-09] | Locale-prefixed routing (`[locale]` via middleware, not folder segment required) + UI message catalogs | De facto standard i18n library for Next.js App Router, already proven in production at apturio (uses `4.13.0`) |
| `@payloadcms/plugin-seo` | `3.85.2` [VERIFIED: npm registry, confirmed already installed in `package.json`] | Tabbed `meta` field group (title/description/OG image) on Pages/Posts/CaseStudies | Official Payload package, kept in lockstep with core `payload` version; already the confirmed decision in PLUGINS.md |
| `@payloadcms/plugin-redirects` | `3.85.2` [VERIFIED: npm registry, already installed] | Admin-managed `redirects` collection | Official Payload package; confirmed it does NOT execute redirects (verified via official docs, see Pitfall below) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | No additional packages needed for sitemap/robots/JSON-LD/llms.txt | All four are hand-written using native Next.js file conventions + Payload Local API — confirmed no official or credible community plugin exists for any of them (per PLUGINS.md, re-verified against current Next.js 15/16 docs in this research) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl `localePrefix: 'as-needed'` (built-in) | Hand-rolled middleware (current `JuanPortfolio` approach) | Hand-rolled gives full control but is ~80 lines of custom rewrite/redirect logic to maintain; next-intl's built-in mode is the exact same URL behavior in ~10 lines, officially maintained, and integrates with next-intl's own `Link`/`useRouter` navigation APIs for free. No reason to hand-roll given the built-in mode matches requirements exactly. |
| Composing redirects-lookup into next-intl's middleware | A second `middleware.ts` file | Not possible — Next.js only executes one middleware file per app. Must chain/compose logic inside the single exported `middleware` function. |
| `app/sitemap.ts` (single file) | Nested `sitemap.ts` per route segment or `generateSitemaps()` for very large sites | Only relevant at 50,000+ URL scale (Google's per-sitemap cap); this portfolio site's page/post/case-study/author/category count is far below that threshold — single `app/sitemap.ts` is sufficient |

**Installation:**
```bash
npm install next-intl@^4.13
```
(`@payloadcms/plugin-seo` and `@payloadcms/plugin-redirects` are already installed at `3.85.2` per current `package.json` — no reinstall needed, only configuration.)

**Version verification:** `npm view next-intl version` → `4.13.1`, confirmed current as of 2026-07-09. `npm view payload version` → `3.85.2`, matches installed `@payloadcms/*` suite (all lockstep at 3.85.2, confirmed in prior STACK.md research).

## Package Legitimacy Audit

> slopcheck was not available in this research environment (`pip install slopcheck` failed silently, `command -v slopcheck` returned nothing). Per the graceful-degradation protocol, the one net-new package below is tagged `[ASSUMED]` and MUST be gated behind a `checkpoint:human-verify` task before install, even though it is a very well-known, high-download package.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `next-intl` | npm | 5+ yrs (first published ~2021, per training knowledge) [ASSUMED — not independently re-verified via GitHub in this session] | High-volume, official docs site at next-intl.dev, actively maintained (v4.13.1 published matches npm registry query) | github.com/amannn/next-intl | N/A — slopcheck unavailable | `[ASSUMED]` — planner must add `checkpoint:human-verify` before `npm install next-intl` |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck did not run)
**Packages flagged as suspicious [SUS]:** none flagged by tooling — but see `[ASSUMED]` disposition above

`@payloadcms/plugin-seo` and `@payloadcms/plugin-redirects` are already present in the committed `package.json`/lockfile from a prior phase's install — no new legitimacy check needed for this phase, only configuration.

## Architecture Patterns

### System Architecture Diagram

```
Browser request
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/middleware.ts  (single file — next-intl createMiddleware,    │
│ wrapped with a redirects-lookup step)                            │
│                                                                    │
│  1. Skip /admin, /api, static files (matcher exclusion)          │
│  2. Query `redirects` collection (Payload Local API or a cached  │
│     lookup) for an exact pathname match → if found, 301 NOW      │
│  3. Otherwise: next-intl locale resolution                       │
│     - path has /en prefix?      → serve English, no rewrite      │
│     - path unprefixed (e.g. /)  → serve Spanish (defaultLocale)  │
│       via internal rewrite, URL stays unprefixed                 │
│     - localeDetection: false    → NEVER redirect root based on   │
│       Accept-Language (matches old site's always-es-at-root)     │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
app/[locale]/... (App Router RSC tree)
    │
    ├─ generateMetadata() ─────► payload.findByID/find (Local API)
    │                             reads plugin-seo `meta` group
    │                             (localized fields, `locale` param)
    │
    ├─ JSON-LD <script> ───────► same Local API fetch, mapped to
    │                             schema.org Person/Article/Breadcrumb
    │
    └─ page body ───────────────► content fields via `localized: true`

Separate, parallel routes (not under [locale]):
  app/sitemap.ts   ──► payload.find({ collection, locale: 'all', where: published })
                        → MetadataRoute.Sitemap with alternates.languages per URL
  app/robots.ts    ──► static MetadataRoute.Robots + sitemap URL
  app/llms.txt/route.ts, app/llms-full.txt/route.ts
                   ──► payload.findGlobal({ slug: 'llms' }), dynamic = 'force-dynamic'
```

### Recommended Project Structure
```
src/
├── i18n/
│   ├── routing.ts        # defineRouting() — locales, defaultLocale, localePrefix, localeDetection
│   └── request.ts        # getRequestConfig() — loads messages/{locale}.json
├── middleware.ts          # createMiddleware(routing) + redirects-lookup composition
├── messages/
│   ├── es.json            # UI strings (nav, buttons, labels) — es is defaultLocale, no prefix
│   └── en.json
├── app/
│   ├── (frontend)/
│   │   └── [locale]/      # all public routes live here now
│   │       └── ...
│   ├── (payload)/
│   │   └── admin/[[...segments]]/
│   ├── sitemap.ts          # NOT under [locale] — single site-wide sitemap
│   ├── robots.ts           # NOT under [locale]
│   ├── llms.txt/route.ts   # NOT under [locale]
│   └── llms-full.txt/route.ts
├── globals/
│   └── Llms/index.ts       # Payload global, textarea fields, admin-editable
├── collections/
│   └── Media/index.ts      # FIX: add `localized: true` to `alt` field this phase
└── payload.config.ts        # ADD: localization block
```

### Pattern 1: `localePrefix: 'as-needed'` replicates the current hand-rolled middleware exactly

**What:** next-intl's routing config has three `localePrefix` modes: `'always'` (every locale prefixed, apturio's choice), `'as-needed'` (default locale unprefixed, others prefixed), `'never'` (no prefixes at all, routing handled purely by cookie/detection). `'as-needed'` with `defaultLocale: 'es'` is the exact URL shape `JuanPortfolio/src/middleware.ts` currently hand-builds via manual rewrites.
**When to use:** Always for this phase — it is the locked decision.
**Example:**
```typescript
// src/i18n/routing.ts
// Source: https://next-intl.dev/docs/routing/configuration
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  // CRITICAL: without this, next-intl's default Accept-Language sniffing
  // can redirect the unprefixed root away from `es` for English-preferring
  // browsers/bots — the old site NEVER does this (see Pitfall 1 below).
  localeDetection: false,
})
```

```typescript
// src/i18n/request.ts
// Source: https://next-intl.dev/docs/getting-started/app-router
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

```typescript
// src/middleware.ts
// Source: https://next-intl.dev/docs/routing/middleware, adapted to compose redirects lookup
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export default async function middleware(request: NextRequest) {
  // 1. Check the redirects collection FIRST — a matched redirect should never
  //    fall through to locale routing (it must 301 before rendering anything).
  //    Implementation detail (Claude's discretion): either query Payload's
  //    Local API directly here (works since middleware runs in the same
  //    Node process for a non-Edge middleware config) or maintain a small
  //    in-memory/edge-cached map refreshed via a Payload afterChange hook —
  //    evaluate both during planning; Local API in middleware requires
  //    `export const runtime = 'nodejs'` since Payload's Local API is not
  //    Edge-compatible.
  // const redirect = await checkRedirects(request.nextUrl.pathname)
  // if (redirect) return NextResponse.redirect(new URL(redirect.to, request.url), redirect.type)

  // 2. Fall through to next-intl locale routing.
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/',
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
  ],
}
```

### Pattern 2: Payload `localization` block, added to `payload.config.ts`

**What:** Native Payload field-level translation. Must be added — it does not currently exist in `src/payload.config.ts`.
**When to use:** Required for I18N-01.
**Example:**
```typescript
// src/payload.config.ts — ADD inside buildConfig({...})
// Source: apturio/website/src/payload.config.ts:132-139 (production reference)
localization: {
  locales: [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ],
  defaultLocale: 'es',
  fallback: true,
},
```
Note apturio's own config uses `defaultLocale: 'en'` (their business default) — this project's locked decision is `defaultLocale: 'es'`, matching next-intl's `routing.ts` `defaultLocale`. **These two `defaultLocale` values (next-intl's and Payload's) must be kept in sync** — they are independent config keys in two different systems and nothing enforces that they match automatically.

### Pattern 3: SEO plugin config, unchanged from PLUGINS.md decision, verified API

**What:** `seoPlugin({ collections, uploadsCollection, tabbedUI, generateTitle, generateDescription })`.
**When to use:** Pages, Posts, CaseStudies only.
**Example:**
```typescript
// src/payload.config.ts
// Source: https://payloadcms.com/docs/plugins/seo
seoPlugin({
  collections: ['pages', 'posts', 'case-studies'],
  uploadsCollection: 'media',
  tabbedUI: true,
  generateTitle: ({ doc }) => (doc?.title ? `${doc.title} | Juan Carlos Angulo` : 'Juan Carlos Angulo'),
  generateDescription: ({ doc }) => doc?.excerpt ?? doc?.heroSubtitle ?? '',
}),
```
**Confirmed via official docs:** the plugin's default `meta` field group (title/description/image) is already `localized: true` out of the box (confirmed both by apturio's inline comment and Payload's plugin source behavior) — no extra work needed to get per-locale SEO metas once `localization` is enabled on the config as a whole. `tabbedUI: true` auto-wraps the collection's other fields into a `Content` tab if the collection doesn't already use tabs (Pages/Posts/CaseStudies currently use flat field arrays, not tabs — the plugin handles this transformation automatically per docs, but visually verify in admin during implementation since this changes existing collections' admin UI shape).

### Pattern 4: Sitemap with hreflang alternates

**What:** `app/sitemap.ts` returning `MetadataRoute.Sitemap`, each entry carrying `alternates.languages` for the ES/EN pair.
**Example:**
```typescript
// src/app/sitemap.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
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
    locale: 'all', // fetch both locale variants of slug/title in one query
  })

  return pages.map((page) => {
    const slug = page.slug === 'home' ? '' : page.slug
    return {
      url: `${SITE_URL}/${slug}`,
      lastModified: page.updatedAt,
      alternates: {
        languages: {
          es: `${SITE_URL}/${slug}`,
          en: `${SITE_URL}/en/${slug}`,
        },
      },
    }
  })
  // repeat/merge for posts, case-studies, authors, categories per I18N-03
}
```

### Pattern 5: robots.ts

```typescript
// src/app/robots.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'}/sitemap.xml`,
  }
}
```

### Pattern 6: JSON-LD, hand-written in Server Components

**What:** `<script type="application/ld+json">` inside the relevant page's Server Component, `dangerouslySetInnerHTML` with `JSON.stringify` of a schema.org object built from already-fetched Payload fields.
**Example:**
```tsx
// src/app/(frontend)/[locale]/page.tsx (home) — Person schema
export function PersonJsonLd({ locale }: { locale: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Juan Carlos Angulo',
    jobTitle: locale === 'es' ? 'Ingeniero de Software y Experto SEO' : 'Software Engineer & SEO Expert',
    url: process.env.NEXT_PUBLIC_SERVER_URL,
    sameAs: [], // social profile URLs, populate from SiteSettings global
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```
```tsx
// src/app/(frontend)/[locale]/blog/[slug]/page.tsx — Article schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.excerpt,
  datePublished: post.publishedAt,
  author: { '@type': 'Person', name: post.author.name },
  image: post.heroImage?.url,
}
```
Reuses fields already surfaced by `plugin-seo` and the collection schema — no new Payload fields required for I18N-05.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale-prefixed URL rewriting (`/` → es, `/en/*` → en) | Custom `NextResponse.rewrite`/`redirect` middleware logic (the current `JuanPortfolio` pattern) | next-intl's `createMiddleware(routing)` with `localePrefix: 'as-needed'` | The exact same URL contract in ~10 lines vs ~80, officially maintained, integrates with next-intl's typed `Link`/`useRouter` for free |
| Sitemap XML generation | Hand-writing an XML string / a `next-sitemap` config | `app/sitemap.ts` with `MetadataRoute.Sitemap` | Native Next.js convention, typed, zero extra dependency, already the confirmed decision |
| SEO meta/OG field management | Custom `meta` group fields hand-added to each collection | `@payloadcms/plugin-seo` tabbed | Official, already the confirmed decision, and fields are auto-localized once `localization` is on |

**Key insight:** Every "Don't Hand-Roll" item in this phase already has a locked decision in CONTEXT.md — the risk here is not choosing the wrong tool, it's misconfiguring the right tool (see Pitfalls below).

## Common Pitfalls

### Pitfall 1: next-intl's default `localeDetection` breaks SEO URL parity

**What goes wrong:** By default, next-intl's middleware negotiates the locale for unprefixed requests using, in order: existing locale prefix → `NEXT_LOCALE` cookie → `Accept-Language` header → `defaultLocale`. If left on defaults, a browser or crawler sending `Accept-Language: en-US` could get redirected/served English at the unprefixed root — a behavior the current `JuanPortfolio` site never exhibits (it always serves `es` unprefixed at root, full stop, no negotiation).
**Why it happens:** `localeDetection: true` is the next-intl default; it's easy to copy a routing config from a general-purpose tutorial (or even from apturio's own config, which doesn't set this explicitly) without realizing the implication for a site with a hard URL-parity requirement.
**How to avoid:** Explicitly set `localeDetection: false` in `routing.ts`. Verify with `curl -H "Accept-Language: en-US" https://site/` returns Spanish content at the unprefixed root, not a redirect to `/en`.
**Warning signs:** Root `/` returns different content/status depending on the request's `Accept-Language` header during manual testing.

### Pitfall 2: Two `defaultLocale` settings that can silently drift apart

**What goes wrong:** next-intl's `routing.ts` `defaultLocale` and Payload's `payload.config.ts` `localization.defaultLocale` are independent settings in two unrelated systems. If one is changed without the other (e.g., during a later locale addition), the site could render Spanish UI chrome around English content or vice versa.
**Why it happens:** Nothing in either library enforces cross-system consistency — this is a project-specific invariant, not a library-guaranteed one.
**How to avoid:** Document the invariant with a code comment in both files pointing at each other. Consider a shared constant module (`src/i18n/locales.ts` exporting `DEFAULT_LOCALE = 'es'`) imported by both `routing.ts` and referenced (not directly importable into `payload.config.ts` due to build-time constraints, but can be documented/tested).
**Warning signs:** Admin UI shows content correctly per-locale but the public site's default rendering language doesn't match.

### Pitfall 3: Only one `middleware.ts` — redirects execution and next-intl routing must be composed, not run as separate files

**What goes wrong:** Next.js only invokes a single `middleware.ts` per app. A naive implementation might try to add a second middleware file for redirects-plugin execution, which Next.js will simply ignore (or error, depending on version).
**Why it happens:** The redirects-plugin docs and next-intl docs are written independently, each showing a complete `middleware.ts` in isolation — neither shows how to combine both concerns.
**How to avoid:** Compose both concerns inside one exported `middleware` function (see Pattern 1's example): check the redirects collection first, then fall through to `intlMiddleware(request)`.
**Warning signs:** Redirects configured in `/admin` never fire in the browser; only locale routing works.

### Pitfall 4: Payload Local API is not Edge-compatible — middleware redirect lookups need `runtime = 'nodejs'`

**What goes wrong:** If the redirects-lookup step inside `middleware.ts` calls `payload.find({ collection: 'redirects', ... })` directly, and the middleware is deployed under the default Edge runtime, the Local API (which depends on Node-only APIs and the Postgres driver) will fail at runtime.
**Why it happens:** Next.js middleware defaults to the Edge runtime unless explicitly configured otherwise; Payload's Local API and `db-postgres` adapter are Node-only.
**How to avoid:** Either (a) export `export const runtime = 'nodejs'` from `middleware.ts` (supported since Next.js 15.x for standalone/self-hosted deploys — this project is self-hosted on Hostinger, not Vercel Edge, so this is safe), or (b) avoid querying Payload directly from middleware and instead maintain a small serializable redirect map refreshed via an `afterChange`/`afterDelete` hook on the `redirects` collection (e.g., written to a KV/file/env-cache) that middleware reads without touching Payload's Local API. Given this is a low-volume personal site (not Vercel Edge-first), option (a) — `runtime: 'nodejs'` — is the simpler, recommended default; flag as MEDIUM confidence pending a quick spike, since `nodejs` middleware runtime is newer in Next.js and worth confirming works cleanly with this project's standalone build output.
**Warning signs:** Redirects work in `next dev` but fail or silently no-op after `next build && next start` on the deploy target.

### Pitfall 5: `plugin-seo`'s `tabbedUI: true` changes existing collections' admin field layout

**What goes wrong:** Pages/Posts/CaseStudies currently use flat (non-tabbed) field arrays. Enabling `tabbedUI: true` auto-wraps existing fields into a `Content` tab and adds an `SEO` tab — this is a real, visible admin UI change to collections that already exist from Phase 1, not a purely additive change.
**Why it happens:** The plugin needs a tab structure to inject the SEO tab into, and if the collection isn't already tabbed, it creates one around all existing fields.
**How to avoid:** After adding the plugin, generate types (`payload generate:types`) and manually verify each collection's admin UI in `/admin` — confirm all existing fields are still present and correctly grouped under "Content", and that draft/versions/scheduling admin behavior (already configured on Pages/Posts/CaseStudies) still works as expected.
**Warning signs:** Fields that existed before appear to be "missing" in admin post-plugin-install (they're likely just moved under a new tab, not deleted, but this must be visually confirmed).

### Pitfall 6: `Media.alt` is not currently `localized: true` — silent content-parity gap

**What goes wrong:** Alt text is user-facing, SEO-relevant copy that should differ by language (accessibility + image SEO). The current `Media` collection (`src/collections/Media/index.ts`) has `alt` as a plain `required: true` text field, NOT localized — meaning today it would be shared across both locales, violating I18N-01's "paridad completa" requirement.
**Why it happens:** Likely an oversight from Phase 1, where the `localization` block itself didn't exist yet on `payload.config.ts`, so localizing fields wasn't yet meaningful.
**How to avoid:** Add `localized: true` to `Media.alt` as part of this phase's collection audit (explicitly anticipated in CONTEXT.md: "revisar cuáles faltan marcar — puede requerir un ajuste menor a colecciones existentes").
**Warning signs:** None visible until real bilingual content is migrated in Phase 4 and alt text is found identical across locales.

## Code Examples

See inline examples under Architecture Patterns 1-6 above — all sourced from official next-intl docs (next-intl.dev), official Next.js docs (nextjs.org), official Payload docs (payloadcms.com), and the apturio production reference codebase.

### llms.txt / llms-full.txt

```typescript
// src/globals/Llms/index.ts
// Source: /Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/globals/Llms.ts (production reference)
import type { GlobalConfig } from 'payload'

export const Llms: GlobalConfig = {
  slug: 'llms',
  label: 'llms.txt',
  admin: {
    group: 'Site',
    description: 'Files for AI agents (llms.txt standard). Editable here; published at /llms.txt and /llms-full.txt.',
  },
  fields: [
    {
      name: 'llmsTxt',
      type: 'textarea',
      required: true,
      label: 'llms.txt (concise index)',
      admin: { rows: 22 },
    },
    {
      name: 'llmsFull',
      type: 'textarea',
      required: true,
      label: 'llms-full.txt (full content)',
      admin: { rows: 30 },
    },
  ],
}
```

```typescript
// src/app/llms.txt/route.ts
// Source: aprendoclub production reference, adapted
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic' // reflects /admin edits without redeploy

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
(Repeat for `app/llms-full.txt/route.ts` reading `llms.llmsFull`.) **Open question (Claude's discretion, not resolved by CONTEXT.md):** whether llms.txt content should itself be locale-aware (e.g., `app/[locale]/llms.txt`) or stay a single global regardless of locale — AI crawlers consuming this file typically don't navigate via browser locale negotiation, so a single non-localized global (matching the aprendoclub reference exactly) is the pragmatic default; flag for the planner to confirm with Juan if bilingual llms.txt content becomes a stated requirement later.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Hand-rolled `NextResponse.rewrite`/`redirect` middleware for locale prefix logic (`JuanPortfolio/src/middleware.ts`) | next-intl `createMiddleware(routing)` with `localePrefix: 'as-needed'` | next-intl has supported `as-needed` mode for multiple major versions; not a recent change, but the current codebase (JuanPortfolio) predates adopting it for this exact URL shape | ~80 lines of custom logic replaced by ~10 lines of officially-maintained routing config; reduces surface area for subtle bugs in the SEO-critical URL-parity requirement |
| `useRouter`/`Link` from `next/navigation` for locale-aware links | next-intl's own typed `Link`/`useRouter`/`usePathname` (from `src/i18n/navigation.ts`, not built in this research pass but standard next-intl companion file) | N/A — always been next-intl's recommended pattern for App Router | Not required for Phase 2's plumbing-only scope, but flagged for Phase 5 (public pages) since hand-writing locale-prefixed hrefs everywhere is exactly the kind of hand-rolling next-intl exists to prevent |

**Deprecated/outdated:** None identified specific to this phase's stack — `next-intl@4.x`, Next.js 15 file conventions, and Payload 3.85's `localization` block are all current, actively-maintained APIs as of this research date (2026-07-09).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `next-intl` package name/legitimacy — confirmed to exist and match training-data expectation via `npm view`, but not verified via Context7 or slopcheck (unavailable) | Package Legitimacy Audit | Low — next-intl is an extremely well-known, high-traffic package; risk is near-zero but protocol requires the tag since verification wasn't done via an authoritative source in this session |
| A2 | Payload's Local API works from Next.js middleware under `runtime: 'nodejs'` on a self-hosted standalone build | Pitfall 4 | Medium — if this doesn't work cleanly, redirects-lookup must move to a cached/precomputed map instead of live Local API queries; would change the middleware implementation approach materially |
| A3 | `tabbedUI: true` auto-wraps existing flat field arrays without data loss (based on plugin doc description, not hands-on tested in this research session) | Pattern 3 / Pitfall 5 | Medium — if the wrap behaves unexpectedly, a collection's admin UI could look broken (not data loss, since fields aren't deleted, just regrouped) until manually fixed |
| A4 | llms.txt/llms-full.txt should be a single non-localized global (not per-locale) | Code Examples section | Low — if wrong, simply means adding a second field pair or duplicate route later; no destructive risk |

## Open Questions

1. **Should llms.txt content be locale-specific?**
   - What we know: CONTEXT.md specifies a single global (matching aprendoclub's pattern), doesn't mention locale-awareness
   - What's unclear: whether AI crawlers/agents benefit from a Spanish vs English variant given the site's bilingual content
   - Recommendation: Ship single non-localized global this phase (matches locked decision literally); revisit only if explicitly requested later

2. **Redirects-lookup implementation: live Local API query in middleware vs cached map via hook**
   - What we know: Local API is Node-only; `runtime: 'nodejs'` middleware is supported in Next.js 15+ for self-hosted deploys
   - What's unclear: whether a live DB query on every middleware invocation (every request) introduces unacceptable latency for a low-traffic personal site — probably negligible given a single Postgres connection pool already sized small (`max: 3-5` per ARCHITECTURE.md), but not benchmarked
   - Recommendation: Start with live Local API query (simpler, always-fresh); the planner should size a Wave/task to spike this and fall back to a cached map only if latency proves to be a real problem

3. **Pages collection slug for the home page**
   - What we know: `Pages.slug` field exists, no explicit `home`/`index` convention documented in current collection code
   - What's unclear: how `app/sitemap.ts` and the `[locale]/[slug]` catch-all route should special-case the home page (empty-string vs literal `home` slug)
   - Recommendation: Planner should confirm the home-page slug convention as part of task breakdown — likely resolved when the actual `[locale]/page.tsx` (home) vs `[locale]/[slug]/page.tsx` (generic Pages) route split is implemented

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | Not touched by this phase (Payload auth already exists, unmodified) |
| V3 Session Management | No | Not touched by this phase |
| V4 Access Control | Yes (marginal) | Middleware must not accidentally expose `/admin` or `/api` routes to locale-rewrite logic — confirmed via `matcher` exclusion in Pattern 1's example |
| V5 Input Validation | Yes | Redirect-lookup pathname matching must not allow open-redirect injection — the `to` field on the `redirects` collection should be validated as an internal path or fully-qualified same-origin URL, not arbitrary attacker-controlled input (mitigated: `redirects` collection is admin-write-only, not user-submitted, so risk is low but worth a code comment) |
| V6 Cryptography | No | Not applicable to this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Open redirect via `redirects` collection `to` field | Tampering / Spoofing | Since `redirects` collection is only editable by authenticated admin users (Payload's default access control on collections not marked `read: () => true` for write), external attacker cannot inject arbitrary redirect targets — no additional mitigation needed beyond existing Payload auth on the collection; document this assumption when the collection is created in this phase |
| Middleware matcher misconfiguration exposing `/admin` to locale rewrite | Tampering | Explicit `matcher` exclusion list (`!admin`, `!api`) as shown in Pattern 1 — verify with a manual request to `/admin` post-implementation to confirm no locale prefix/rewrite is applied |

## Sources

### Primary (HIGH confidence)
- [Routing configuration – next-intl](https://next-intl.dev/docs/routing/configuration) — `defineRouting`, `localePrefix` modes (`always`/`as-needed`/`never`), `pathnames`, `domains`
- [Proxy / middleware – next-intl](https://next-intl.dev/docs/routing/middleware) — `createMiddleware`, matcher patterns, `localeDetection` default/disable behavior
- [sitemap.xml – Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) — `MetadataRoute.Sitemap` type, `alternates.languages` localized sitemap example, `generateSitemaps` for scale
- [robots.txt – Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) — `MetadataRoute.Robots` type
- [Redirects Plugin – Payload docs](https://payloadcms.com/docs/plugins/redirects) — confirmed plugin manages collection only, does not execute redirects
- [SEO Plugin – Payload docs](https://payloadcms.com/docs/plugins/seo) — `seoPlugin` config API (`collections`, `uploadsCollection`, `tabbedUI`, `generateTitle`, `generateDescription`, `generateImage`, `generateURL`, `fields`)
- `npm view next-intl version` → `4.13.1` (registry query, 2026-07-09)
- `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/i18n/routing.ts`, `request.ts`, `middleware.ts`, `next.config.mjs`, `payload.config.ts` — production reference (though note: apturio uses `localePrefix: 'always'` and `defaultLocale: 'en'`, differing from this project's locked `as-needed`/`es` decision — pattern shape is reusable, exact config values are not)
- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/middleware.ts` — current hand-rolled URL-parity behavior to replicate
- `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/globals/Llms.ts` and `app/llms.txt/route.ts` — production llms.txt pattern reference
- `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/src/payload.config.ts`, `src/collections/*` — current state, confirmed no `localization` block exists yet and `Media.alt` gap

### Secondary (MEDIUM confidence)
- WebSearch cross-referencing `localePrefix: 'as-needed'` and `localeDetection` behavior against multiple community guides, consistent with official docs findings

### Tertiary (LOW confidence)
- None used as a basis for any recommendation in this document

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — next-intl version verified via live npm registry, Payload plugin versions already installed and confirmed
- Architecture (URL routing behavior): HIGH — `localePrefix`/`localeDetection` behavior confirmed directly from official next-intl docs, cross-checked against the exact current hand-rolled middleware it replaces
- Pitfalls: MEDIUM-HIGH — Pitfalls 1-3, 5, 6 are HIGH confidence (directly observed in code or confirmed via official docs); Pitfall 4 (`runtime: 'nodejs'` in middleware for Local API) is MEDIUM, flagged as A2 in Assumptions Log and recommended as a planner spike

**Research date:** 2026-07-09
**Valid until:** 30 days (stable, actively-maintained libraries; re-verify next-intl/Payload versions if planning is delayed past early August 2026)
