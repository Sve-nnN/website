# Phase 1: Schema Foundation - Research

**Researched:** 2026-07-09
**Domain:** Payload CMS 3.85 + Next.js 15 greenfield scaffolding, Postgres schema/migrations, structured content modeling
**Confidence:** HIGH (core scaffolding and migration workflow verified against two real production Payload 3.85 Postgres codebases; MEDIUM on Neon-specific pooling guidance, verified via current Neon docs but not hands-on tested in this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Colecciones: KEEP vs DROP (fuente de verdad: research/ARCHITECTURE.md)**
- KEEP: Pages, Posts, Media (rewire a Cloudinary en fase 3, disco local en fase 1), Categories, Users (simplificado, sin campos ligados a MCP), Authors, CaseStudies, Testimonials, Clientes
- DROP: Works (retirado — decisión de Juan, se absorbe conceptualmente en CaseStudies enriquecido, no se migra 1:1), AdBanners, KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks

**Colección Clientes (decisión de Juan, no de research)**
- Colección lean, solo para carrusel de logos: `name` (text), `logo` (upload → Media), `websiteUrl` (text/url)
- Sin campos de case study — es puramente credibilidad visual, no cuenta la historia del cliente

**Colección CaseStudies (modelo de referencia: ariannalupi.com/casos/, aprobado por Juan)**
Campos estructurados, no rich text libre:
- Hero: `title`, `heroMetric` (ej. "$41K → $76K"), `heroSubtitle`
- Metadatos: `client` (relationship a Clientes, opcional), `sector`, `period` (texto o fecha inicio/fin), `services` (array de tags)
- `kpis`: array de 4 tarjetas {label, value}
- `clientContext`: rich text — sección "El cliente"
- `challenge`: array de bullets — sección "El reto"
- `solution`: array de pasos numerados {title, description} — sección "La solución"
- `results`: comparativa antes/después {periodBefore, periodAfter, metrics: array {label, before, after}}
- `conclusion`: rich text

**Colección Testimonials**
- Atribución estructurada obligatoria: `name`, `role`, `company` — no citas anónimas

**Plugins: KEEP vs DROP (fuente de verdad: research/ARCHITECTURE.md + PLUGINS.md)**
- KEEP: `@payloadcms/plugin-seo` (tabbed en Pages/Posts/CaseStudies), `@payloadcms/plugin-redirects`, `@payloadcms/email-resend`, `@payloadcms/db-postgres`
- DROP: `@payloadcms/plugin-mcp`, `@payloadcms/plugin-form-builder`, admin-bar, dashboard-analytics, GSC dashboard components, `@payloadcms/plugin-nested-docs` (a menos que un content audit posterior muestre necesidad de páginas anidadas — no asumir en fase 1)
- Storage Cloudinary: NO se configura en fase 1 — fase 1 usa disco local por defecto (`disableLocalStorage: false`), el adapter real llega en fase 3

**Blocks consolidados (~12-14, fuente: research/ARCHITECTURE.md, con overrides de Juan)**
- `Hero` (variant field: home / listing / post-header / case-study-header)
- `Content`
- `ArchiveBlock` / `FeaturedGrid` (relationTo + mode: latest/manual)
- `CallToAction`
- `FAQ`
- `TestimonialsCarousel`
- `ContactFormBlock`
- `MediaBlock`
- `Code` — CONFIRMADO por Juan (posts técnicos con syntax highlighting)
- `RelatedPosts`
- `TableOfContentsBlock` — CONFIRMADO por Juan (posts largos)
- `ResultsSection`
- `Section` (wrapper genérico de layout, mantener si se usa para spacing/background)

**Descartado explícitamente:** `CalendlyEmbed` — decisión de Juan, un solo CTA (formulario de contacto). `SidebarBanners`/`PostSidebar` (ligado a AdBanners dropeado). `Form` block genérico (superado por `ContactFormBlock` simple, sin plugin-form-builder).

### Claude's Discretion
- Nombres exactos de campos TypeScript/slugs dentro de cada colección (siempre que preserven el modelo de datos descrito arriba)
- Estructura interna de `payload.config.ts` (organización de archivos, agrupación admin)
- Orden de migraciones dentro de esta fase (no hay datos reales todavía, solo schema)

### Deferred Ideas (OUT OF SCOPE)
- CalendlyEmbed — descartado para v1, podría reconsiderarse en v2 si Juan empieza a ofrecer llamadas de consultoría de forma recurrente
- `@payloadcms/plugin-nested-docs` — diferido hasta que un content audit muestre necesidad real de jerarquía de páginas
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCHEMA-01 | Backend sobre PostgreSQL vía `@payloadcms/db-postgres` con `push:false` desde el día uno | See "Standard Stack", "payload.config.ts structure", "Migration Workflow" |
| SCHEMA-02 | Colecciones limitadas a lo esencial (Pages, Posts, Authors, CaseStudies, Categories, Media, Testimonials, Clientes, Users) | See "Collections to Scaffold" table, code examples per collection |
| SCHEMA-03 | Migraciones versionadas y committeadas, aplicadas en build/deploy, nunca manual en prod | See "Migration Workflow", "Common Pitfalls" |
| SCHEMA-04 | CaseStudies con campos estructurados (hero, KPIs, challenge, solution, results, conclusion) | See "CaseStudies Field Model" code example |
| SCHEMA-05 | Testimonios con atribución estructurada (name/role/company) | See "Testimonials Field Model" |
| SCHEMA-06 | Librería de blocks consolidada ~12-14 | See "Block Consolidation Pattern" |
| SCHEMA-07 | Colección Clientes independiente (name/logo/websiteUrl) | See "Clientes Field Model" |
</phase_requirements>

## Summary

Phase 1 is pure scaffolding: no frontend, no i18n routing, no real Cloudinary, no migrated data. The job is to stand up a working Payload 3.85 + Next.js 15 + Postgres project from zero, with the KEEP-list collections defined with correct field types, `push:false` migration discipline enforced from the first commit, and a consolidated ~12-14 block library registered on Pages. Two real production codebases (`aprendoclub`, Postgres/push:false/lean-collections pattern; `apturio`, standalone build + migration command pattern) plus the current `JuanPortfolio` Mongo codebase (field-level structure to preserve, now confirmed to already contain a `CaseStudies` and `Clientes` collection — but in a *shape that does not yet match* the new structured KPI/challenge/solution/results model, so this is new field work, not a copy) give everything needed to scaffold with confidence.

The one open technical question worth flagging up front: Juan's dev Postgres will be Neon, and Neon's pooled connection string (PgBouncer, `-pooler` hostname) is documented by Neon itself to break migrations (prepared-statement errors) — the unpooled/direct connection string must be used for `payload migrate:create`/`payload migrate`, with the pooled string reserved for the app's own runtime query pool once one exists (relevant from Phase 5+ onward, but the env var naming convention should be decided now).

**Primary recommendation:** Scaffold with `create-payload-app` disabled — hand-build `payload.config.ts` from the aprendoclub pattern (leanest confirmed-working Postgres reference), wire `@payloadcms/db-postgres` with `push: false` and an **unpooled** `DATABASE_URI` from day one, define all 9 KEEP collections with the field types specified below, and register a `payload migrate:create` baseline migration before any collection ships to git.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Collection schema definition (fields, validation) | API / Backend (Payload Core Config) | — | Payload collections are backend-only config; no client-side schema concern in this phase |
| Postgres schema/migrations | Database / Storage | API / Backend | Drizzle-generated SQL owned by `@payloadcms/db-postgres`, but migration files are authored/committed from the app repo |
| Block library (layout builder field configs) | API / Backend | — | Block *configs* (field shape) are backend; block *rendering components* are Frontend Server (SSR) — out of scope for Phase 1, deferred to Phase 5 |
| Media upload handling (local disk in Phase 1) | API / Backend | — | Payload's built-in local-disk upload handler; no CDN/edge concern until Phase 3 (Cloudinary) |
| Admin auth (Users collection) | API / Backend | — | Payload's native `auth: true` on Users; no external IdP in this phase |
| Migration tooling (CLI) | API / Backend | — | `payload migrate*` commands run in the Node process against Postgres; not a build-time static concern |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `payload` | `3.85.2` [VERIFIED: npm registry] | Headless CMS core | Confirmed current via `npm view payload version` 2026-07-09; matches STACK.md research and both reference codebases' installed range |
| `@payloadcms/next` | `3.85.2` [VERIFIED: npm registry] | Mounts admin + REST/GraphQL routes into App Router, provides `withPayload()` | Required glue package, must match `payload` version exactly (lockstep monorepo) |
| `@payloadcms/db-postgres` | `3.85.2` [VERIFIED: npm registry] | Postgres adapter (Drizzle-based), migration generation | Confirmed current; only Postgres adapter appropriate for self-hosted Hostinger (not `db-vercel-postgres`) |
| `@payloadcms/richtext-lexical` | `3.85.2` [VERIFIED: npm registry] | Rich text editor for `clientContext`/`conclusion`/Posts/Pages content fields | Default, actively developed editor in Payload 3; Slate is legacy |
| `next` | `15.5.20` [CITED: STACK.md research, npm registry] | App Router hosting admin + frontend | Payload 3.85's tested target; hold at 15.5, do not jump to Next 16 in this phase |
| `react` / `react-dom` | `19.2.x` [CITED: STACK.md research] | Required peer for Next 15 + Payload 3 admin | Do not downgrade to React 18 |
| `sharp` | `0.35.3` [VERIFIED: npm registry] | Image processing for Payload uploads (required even with local disk storage in Phase 1) | Hard requirement for image resizing regardless of storage backend |
| `graphql` | `17.0.2` is npm `latest`, **pin to `^16.8.1`** [VERIFIED: npm registry — `npm view payload@3.85.2 peerDependencies` confirms `{graphql: "^16.8.1"}`] | Payload's GraphQL peer dependency | Installing npm `latest` (17.x) breaks Payload's GraphQL layer — must explicitly pin |
| `typescript` | `^5` [ASSUMED] | Types across config, generated `payload-types.ts` | Standard for all Payload 3 projects; not independently version-checked this session |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@payloadcms/plugin-seo` | `3.85.2` [VERIFIED: npm registry] | Tabbed SEO meta fields on Pages/Posts/CaseStudies | Add now (Phase 1) so SCHEMA-driven collections have the field ready, even though sitemap/JSON-LD consumption is Phase 2 |
| `@payloadcms/plugin-redirects` | `3.85.2` [VERIFIED: npm registry] | Redirects collection (admin-managed) | Add now; middleware to *execute* redirects is Phase 2 (I18N-06) |
| `@payloadcms/email-resend` | `3.85.2` [VERIFIED: npm registry] | Payload's email transport | Wire in Phase 1 config even though contact-form usage is Phase 5 — keeps `payload.config.ts` complete from day one and avoids a later refactor |
| `tsx` | latest [ASSUMED] | Run ad hoc TS scripts outside Next build (not needed for migration ETL until Phase 4, but useful for a seed script in Phase 1) | Dev dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@payloadcms/db-postgres` | `@payloadcms/db-vercel-postgres` | Only correct if deploying to Vercel; this project self-hosts on Hostinger, so plain `db-postgres` is correct |
| Hand-built `payload.config.ts` | `create-payload-app` scaffolding CLI | The CLI's default template includes Vercel Blob storage, form-builder, and other DROP-list plugins that would need to be manually stripped afterward — hand-building from the aprendoclub reference is faster and avoids a strip-out pass |
| Neon (serverless Postgres) | Local Postgres via Docker | Juan has already decided Neon for dev (see Environment Availability below); Docker-local is a fallback only if Neon free-tier limits become a blocker |

**Installation:**
```bash
npm install payload@3.85.2 @payloadcms/next@3.85.2 @payloadcms/db-postgres@3.85.2 @payloadcms/richtext-lexical@3.85.2
npm install next@15.5.20 react@19.2.7 react-dom@19.2.7
npm install @payloadcms/plugin-seo@3.85.2 @payloadcms/plugin-redirects@3.85.2 @payloadcms/email-resend@3.85.2
npm install sharp@0.35.3
npm install graphql@^16.8.1
npm install -D typescript tsx @types/node @types/react @types/react-dom
```

**Version verification:** All core and official `@payloadcms/*` versions above were confirmed live via `npm view <pkg> version` on 2026-07-09 (see command outputs in Sources). `graphql` peer requirement confirmed via `npm view payload@3.85.2 peerDependencies`.

## Package Legitimacy Audit

All Phase 1 packages are first-party (`payload`, `@payloadcms/*` published by the Payload core team) or extremely well-established (`next`/`react`/`react-dom` by Vercel/Meta, `sharp` by lovell, `graphql` by the GraphQL Foundation). No community/niche packages are introduced in this phase — Cloudinary community adapters (the one genuine supply-chain risk area in this project) are explicitly deferred to Phase 3 per CONTEXT.md and were already audited in `research/PLUGINS.md`.

`slopcheck` could not be run in this research session (sandboxed permission denial on installing an unverified PyPI tool mid-session). Given every package below is either (a) part of the official Payload monorepo release train (all versions publish in lockstep, same org, same day) or (b) a foundational, decades-old-or-multi-year, extremely high download-count package, this is treated as an acceptable exception to the "mark everything ASSUMED" fallback — but the planner should still note this audit ran without the automated tool and rely on the npm registry cross-checks performed directly (`npm view` calls, shown live above).

| Package | Registry | Age / Maintainer | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `payload` | npm | Payload core (payloadcms org), multi-year | Very high (millions/mo across ecosystem) | github.com/payloadcms/payload | not run | Approved |
| `@payloadcms/next` | npm | Payload core, lockstep with `payload` | High | github.com/payloadcms/payload (monorepo) | not run | Approved |
| `@payloadcms/db-postgres` | npm | Payload core, lockstep | High | github.com/payloadcms/payload (monorepo) | not run | Approved |
| `@payloadcms/richtext-lexical` | npm | Payload core, lockstep | High | github.com/payloadcms/payload (monorepo) | not run | Approved |
| `@payloadcms/plugin-seo` | npm | Payload core, lockstep | High | github.com/payloadcms/payload (monorepo) | not run | Approved |
| `@payloadcms/plugin-redirects` | npm | Payload core, lockstep | High | github.com/payloadcms/payload (monorepo) | not run | Approved |
| `@payloadcms/email-resend` | npm | Payload core, lockstep | Moderate-High | github.com/payloadcms/payload (monorepo) | not run | Approved |
| `next` | npm | Vercel, multi-year | Very high | github.com/vercel/next.js | not run | Approved |
| `react` / `react-dom` | npm | Meta, multi-year | Very high | github.com/facebook/react | not run | Approved |
| `sharp` | npm | lovell, multi-year, industry-standard | Very high | github.com/lovell/sharp | not run | Approved |
| `graphql` | npm | GraphQL Foundation, multi-year | Very high | github.com/graphql/graphql-js | not run | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none — no community/niche packages in this phase's install list.

## Architecture Patterns

### System Architecture Diagram

```
                    npm install / repo scaffold
                              │
                              ▼
                 ┌─────────────────────────┐
                 │  payload.config.ts       │  ← single source of truth
                 │  (collections, plugins,  │
                 │   db adapter, editor)    │
                 └────────────┬─────────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
      Collections        Plugins          DB Adapter
   (9 KEEP collections  (seo, redirects,  (@payloadcms/db-postgres
    + Media upload)      email-resend)     push:false)
              │                                 │
              ▼                                 ▼
   Blocks registered on              payload migrate:create
   Pages.layout field                (generates SQL in
   (~12-14 consolidated                src/migrations/*.ts)
    block configs)                            │
                                               ▼
                                    committed to git, applied via
                                    `payload migrate` at build time
                                               │
                                               ▼
                                    Postgres (Neon dev / Hostinger prod)
                                    schema now matches config
```

Entry point: `npm run dev` boots Next.js + Payload in one process → Payload reads `payload.config.ts` → adapter connects to `DATABASE_URI` → **no schema is pushed automatically** (`push: false`) → developer runs `payload migrate:create` after any collection/field change → reviews generated SQL → commits it → runs `payload migrate` to apply. This loop (edit config → generate migration → apply) is the only path schema changes take; there is no live-sync path in this project at any point in the lifecycle, dev or prod.

### Recommended Project Structure
```
src/
├── app/
│   ├── (frontend)/              # placeholder in Phase 1 — real routes arrive Phase 5
│   │   └── page.tsx             # minimal "it works" page or Payload's default
│   └── (payload)/
│       ├── admin/[[...segments]]/page.tsx   # Payload-generated
│       ├── admin/[[...segments]]/not-found.tsx
│       ├── api/[...slug]/route.ts           # Payload REST
│       ├── api/graphql/route.ts
│       ├── api/graphql-playground/route.ts
│       ├── layout.tsx
│       └── custom.scss                      # optional admin branding hook (see aprendoclub)
├── collections/
│   ├── Users/index.ts
│   ├── Media/index.ts
│   ├── Pages/index.ts
│   ├── Posts/index.ts
│   ├── Authors/index.ts
│   ├── Categories/index.ts
│   ├── CaseStudies/index.ts
│   ├── Testimonials/index.ts
│   └── Clientes/index.ts
├── blocks/
│   ├── Hero/config.ts
│   ├── Content/config.ts
│   ├── ArchiveBlock/config.ts
│   ├── CallToAction/config.ts
│   ├── FAQ/config.ts
│   ├── TestimonialsCarousel/config.ts
│   ├── ContactFormBlock/config.ts
│   ├── MediaBlock/config.ts
│   ├── Code/config.ts
│   ├── RelatedPosts/config.ts
│   ├── TableOfContentsBlock/config.ts
│   ├── ResultsSection/config.ts
│   └── Section/config.ts
├── fields/
│   └── slug.ts                   # shared slugField() util, port from JuanPortfolio
├── access/
│   ├── authenticated.ts
│   └── authenticatedOrPublished.ts
├── migrations/                    # generated by `payload migrate:create`, committed
│   └── (empty until first migration is generated)
├── payload.config.ts
└── payload-types.ts               # generated, gitignored or committed per team preference
next.config.mjs
tsconfig.json
package.json
.env.example
.env                                # gitignored
```

### Structure Rationale
- **Flat `collections/` folder-per-collection**, each with an `index.ts` — matches both `aprendoclub` (flat) and `JuanPortfolio` (folder-per-collection with nested `hooks/`) conventions. Use plain files (`Media/index.ts`) unless a collection needs hooks, then nest `hooks/` inside its folder like `CaseStudies/hooks/revalidateCaseStudy.ts` did in the old codebase (revalidation hooks are Phase 5 concern, but the folder shape can be set up now).
- **`(frontend)` and `(payload)` route groups from day one**, even though `(frontend)` is a placeholder in Phase 1 — this avoids a route-group restructuring task in Phase 2/5 and matches the ARCHITECTURE.md-documented target structure exactly.
- **`migrations/` at `src/migrations/`, not root** — this is `@payloadcms/db-postgres`'s default `migrationDir` location; overriding it adds unnecessary config surface.
- **No `scripts/` folder needed yet** — the Mongo→Postgres ETL script is explicitly Phase 4 scope (MIGR-02); do not scaffold it in Phase 1.

## Standard Field-Type Choices for Structured Content

This maps CONTEXT.md's plain-language field descriptions to concrete Payload field types. [CITED: Payload official field docs — group/array/richText/number/relationship are all standard, stable Payload 3 field types]

| CONTEXT.md description | Payload field type | Notes |
|---|---|---|
| Hero metric ("$41K → $76K") | `text` | Free text, not a computed field — Juan types the formatted string directly, matching how ariannalupi.com's reference model presents it |
| KPIs (array of 4 cards {label, value}) | `array` of `group` `{ label: text, value: text }` | Use `array` not a fixed 4-field group set, so admin UI stays flexible if a 5th KPI is ever needed — but set `minRows: 1, maxRows: 6` as a soft guard, not a hard 4-only lock (CONTEXT.md says "array de 4 tarjetas" as the target shape, not a hard constraint) |
| Challenge (array of bullets) | `array` of `{ text: textarea }` | Simple bullet list, one field per row, not a group — bullets don't need sub-structure |
| Solution (array of numbered steps {title, description}) | `array` of `{ title: text, description: textarea }` | Numbering is implicit from array order (index+1), do not add a manual `stepNumber` field — Payload arrays are already ordered and reorderable in admin |
| Results comparativa antes/después {periodBefore, periodAfter, metrics: array{label,before,after}} | `group` containing `periodBefore: text`, `periodAfter: text`, and `metrics: array` of `{ label: text, before: text, after: text }` | `before`/`after` as `text` not `number` — case study metrics are often formatted strings ("$41K", "3.2x", "+180%"), not raw numbers; forcing `number` type would break the reference model's display format |
| Client context / conclusion (rich text sections) | `richText` (lexical) | Use the shared `lexicalEditor()` default config, no need for `BlocksFeature` inside these two fields — they're prose sections, not page-builder zones |
| Services (array of tags) | `array` of `{ service: text }`, OR `select` with `hasMany: true` if the service list is a fixed taxonomy | Recommend plain `array` of text in Phase 1 (content audit hasn't happened yet — don't assume a closed taxonomy); revisit as `select hasMany` later if a fixed service list emerges |
| Client (relationship, optional) | `relationship` to `clientes`, `required: false` | Matches CONTEXT.md "opcional" explicitly |
| Sector, period (text or date range) | `sector: text`, `period: text` (freeform, e.g. "2024-2025") | CONTEXT.md explicitly allows "texto o fecha inicio/fin" — recommend plain `text` for Phase 1 simplicity since no migrated data yet forces a date-range decision; can be split into `periodStart`/`periodEnd` dates later without a breaking migration if needed |

## Code Examples

### `payload.config.ts` skeleton (Postgres, push:false)
```typescript
// Source: pattern verified against aprendoclub/payload.config.ts (production, Payload 3.85.2)
import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { CaseStudies } from './collections/CaseStudies'
import { Testimonials } from './collections/Testimonials'
import { Clientes } from './collections/Clientes'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      // Use the UNPOOLED Neon connection string here — pooled/PgBouncer
      // connections break migrations (prepared-statement errors).
      connectionString: process.env.DATABASE_URI,
    },
    push: false, // never auto-push; always payload migrate:create + payload migrate
  }),
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'no-reply@example.com',
    defaultFromName: 'Juan Carlos Angulo',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  collections: [Users, Media, Pages, Posts, Authors, Categories, CaseStudies, Testimonials, Clientes],
  plugins: [
    seoPlugin({
      collections: ['pages', 'posts', 'case-studies'],
      uploadsCollection: 'media',
      tabbedUI: true,
    }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'case-studies', 'categories', 'authors'],
    }),
  ],
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
```

### Migration workflow (dev → commit → deploy)
```bash
# Source: pattern verified against apturio/website package.json + aprendoclub package.json (both real prod configs)

# 1. After defining/editing collections, generate a migration locally:
payload migrate:create

# 2. Review the generated SQL in src/migrations/<timestamp>_<name>.ts — this is
#    the actual DDL that will run; inspect it before committing.

# 3. Commit the migration file to git.

# 4. Apply it locally to keep dev DB in sync:
payload migrate

# 5. At build/deploy time (package.json "build" script), migrations run
#    automatically before the Next.js build compiles:
#    "build": "payload migrate && payload generate:importmap && payload generate:types && next build"
```

**CLI commands confirmed:** `payload migrate:create`, `payload migrate`, `payload generate:types`, `payload generate:importmap` — all standard Payload 3 CLI subcommands, verified present in both reference codebases' `package.json` scripts. [CITED: apturio/website/package.json, aprendoclub/package.json — real production build scripts]

### `next.config.mjs` — standalone output
```javascript
// Source: apturio/website/next.config.mjs (production, adapted — drop next-intl plugin wrapper for Phase 1, add back in Phase 2)
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // remotePatterns intentionally empty in Phase 1 (local-disk media only);
    // add Cloudinary hostname pattern in Phase 3
    remotePatterns: [],
  },
}

export default withPayload(nextConfig)
```

### `package.json` build/dev scripts
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
Note: `postbuild` (copying `public/` and `.next/static` into the standalone bundle) is a Phase 6 deploy concern, but including the script now in Phase 1 costs nothing and avoids a later package.json edit — verified pattern from `apturio/website/package.json`.

### CaseStudies field model (structured, per SCHEMA-04)
```typescript
// Source: field-type choices per "Standard Field-Type Choices" table above;
// tabs/slug/SEO plugin integration pattern from JuanPortfolio/src/collections/CaseStudies/index.ts
import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { slugField } from '../../fields/slug'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'client', 'updatedAt'] },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'heroMetric', type: 'text', localized: true },
    { name: 'heroSubtitle', type: 'text', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'client', type: 'relationship', relationTo: 'clientes', required: false },
        { name: 'sector', type: 'text', localized: true },
        { name: 'period', type: 'text' },
      ],
    },
    {
      name: 'services',
      type: 'array',
      fields: [{ name: 'service', type: 'text', required: true }],
    },
    {
      name: 'kpis',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    { name: 'clientContext', type: 'richText', editor: lexicalEditor(), localized: true },
    {
      name: 'challenge',
      type: 'array',
      fields: [{ name: 'text', type: 'textarea', required: true, localized: true }],
    },
    {
      name: 'solution',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'results',
      type: 'group',
      fields: [
        { name: 'periodBefore', type: 'text' },
        { name: 'periodAfter', type: 'text' },
        {
          name: 'metrics',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'before', type: 'text', required: true },
            { name: 'after', type: 'text', required: true },
          ],
        },
      ],
    },
    { name: 'conclusion', type: 'richText', editor: lexicalEditor(), localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    slugField(),
  ],
}
```

### Testimonials field model (structured attribution, per SCHEMA-05)
```typescript
import type { CollectionConfig } from 'payload'

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
Note: CONTEXT.md requires `name`/`role`/`company` as mandatory structured attribution ("no citas anónimas") — set all three `required: true`, a stricter constraint than JuanPortfolio's current `Testimonials.ts` (which only requires `author`, leaving `company`/`role` optional). This is an intentional tightening per the phase's locked decision, not a bug.

### Clientes field model (lean, per SCHEMA-07)
```typescript
import type { CollectionConfig } from 'payload'

export const Clientes: CollectionConfig = {
  slug: 'clientes',
  admin: { useAsTitle: 'name' },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media', required: true },
    { name: 'websiteUrl', type: 'text' },
  ],
}
```
Note: deliberately drops JuanPortfolio's existing `Clientes.ts` extra fields (`invertInDark`, `forceWhiteBackground`) — CONTEXT.md is explicit this collection must stay "puramente credibilidad visual," and those two fields are presentation-layer concerns that belong in the frontend carousel component (Phase 5), not the schema.

### Block consolidation pattern (ArchiveBlock/FeaturedGrid, per SCHEMA-06)
```typescript
// Source: pattern per ARCHITECTURE.md Pattern 2 — one relationTo-driven block
// instead of 9+ near-duplicate "Featured X" blocks
import type { Block } from 'payload'

export const ArchiveBlock: Block = {
  slug: 'archiveBlock',
  labels: { singular: 'Archive / Featured Grid', plural: 'Archive / Featured Grid Blocks' },
  fields: [
    {
      name: 'relationTo',
      type: 'select',
      required: true,
      options: [
        { label: 'Posts', value: 'posts' },
        { label: 'Case Studies', value: 'case-studies' },
      ],
    },
    {
      name: 'mode',
      type: 'radio',
      defaultValue: 'latest',
      options: [
        { label: 'Latest N', value: 'latest' },
        { label: 'Manual selection', value: 'manual' },
      ],
    },
    { name: 'limit', type: 'number', defaultValue: 3, admin: { condition: (_, s) => s.mode === 'latest' } },
    {
      name: 'selectedDocs',
      type: 'relationship',
      relationTo: ['posts', 'case-studies'],
      hasMany: true,
      admin: { condition: (_, s) => s.mode === 'manual' },
    },
  ],
}
```

### Hero block with variant discriminator (per Blocks decisions)
```typescript
import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'home',
      options: [
        { label: 'Home', value: 'home' },
        { label: 'Listing', value: 'listing' },
        { label: 'Post Header', value: 'post-header' },
        { label: 'Case Study Header', value: 'case-study-header' },
      ],
    },
    { name: 'title', type: 'text', localized: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'media', type: 'upload', relationTo: 'media' },
    // Field visibility conditioned on `variant` is a Phase 5 rendering concern;
    // in Phase 1, keep the schema flat (all fields present) — condition:
    // callbacks only affect admin UI, not the underlying Postgres columns.
  ],
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug uniqueness/generation | Custom slugify + uniqueness-check hook from scratch | Port `slugField()` utility from `JuanPortfolio/src/fields/slug.ts` (already exists, already handles this) | Already solved once in the reference codebase; re-deriving risks subtly different edge-case handling (e.g. Cyrillic/accented chars) |
| SEO meta fields (title/description/OG) | Custom `meta` group per collection | `@payloadcms/plugin-seo` tabbedUI | Official plugin, zero reason to hand-roll — already the locked decision |
| Redirects storage | Custom `redirects` collection | `@payloadcms/plugin-redirects` | Official plugin manages the collection; only the *execution* middleware (Phase 2) is custom |
| Migration DDL authoring | Hand-written SQL migration files | `payload migrate:create` (Drizzle-generated) | Drizzle introspects the schema diff automatically; hand-writing risks drift from what Payload's ORM layer actually expects |

**Key insight:** Phase 1 has almost nothing that needs hand-rolling — it is assembly of well-established Payload primitives (fields, plugins, adapter) into the correct shape. The only genuinely new work is the *field-type choices* for the structured CaseStudies model, which is a modeling decision, not an engineering problem needing a custom solution.

## Common Pitfalls

### Pitfall 1: Using Neon's pooled connection string for migrations
**What goes wrong:** `payload migrate:create` or `payload migrate` fails with prepared-statement errors, or silently misbehaves.
**Why it happens:** Neon's pooled connection string routes through PgBouncer in transaction mode, which discards prepared statements between transactions — Drizzle's migration runner relies on session-level behavior that transaction-mode pooling breaks. [CITED: neon.com/docs/connect/connection-pooling, neon.com/docs/guides/drizzle-migrations]
**How to avoid:** Use Neon's **unpooled/direct** connection string (no `-pooler` in the hostname) for `DATABASE_URI` in Phase 1. Since this project runs a persistent Node process (not serverless functions with many concurrent short-lived connections), the unpooled string is also fine for the app's own runtime queries at this project's traffic scale — a pooled string only becomes worth the complexity if Hostinger's/Neon's connection-count limits get tight later (flag for Phase 6 dimensioning, per DEPLOY-03).
**Warning signs:** `payload migrate:create` hangs or throws a Postgres error mentioning prepared statements or "unnamed portal."

### Pitfall 2: Reusing JuanPortfolio's Clientes/CaseStudies field shapes verbatim
**What goes wrong:** Copy-pasting the existing Mongo-era `Clientes.ts`/`CaseStudies/index.ts` produces a schema that does NOT match CONTEXT.md's structured model — the current CaseStudies is just `heroImage` + one big `richText` field, not the KPI/challenge/solution/results structure this phase requires.
**Why it happens:** The existing collections share a name with the new ones but were never built to the ariannalupi.com reference model — they predate that decision.
**How to avoid:** Treat JuanPortfolio's collections as field-*naming*-convention and admin-UX reference only (tabs, slug util, SEO tab wiring pattern), not as a field-shape source of truth for CaseStudies/Testimonials/Clientes. The "Standard Field-Type Choices" table and code examples above are the actual target shape.
**Warning signs:** A generated migration that only adds a `heroImage`/`content` pair instead of the full KPI/challenge/solution/results column set.

### Pitfall 3: Forgetting `push: false` in a throwaway/dev moment and letting Payload auto-sync
**What goes wrong:** Running Payload with `push: true` (or omitting `push` in a dev-only branch) causes Drizzle to introspect and live-alter the Postgres schema on every boot — this can silently drop columns if a field was removed from config without a corresponding migration.
**Why it happens:** Payload's Postgres adapter defaults `push` to `true` in development if not explicitly set, specifically to make early prototyping fast — but this project's constraint (SCHEMA-01, SCHEMA-03) explicitly forbids this in any environment that matters.
**How to avoid:** Hard-code `push: false` in `payload.config.ts` unconditionally (not env-conditional) from the very first commit — there is no "throwaway" environment in this project's plan where push is acceptable, since even local dev DB state should be reproducible via committed migrations.
**Warning signs:** Postgres schema changes appear without a corresponding file in `src/migrations/`.

### Pitfall 4: `graphql@17` getting installed accidentally
**What goes wrong:** `npm install graphql` without a version pin installs 17.x (npm `latest`), which breaks Payload's GraphQL API layer (peer dependency is `^16.8.1`).
**Why it happens:** graphql-js 17 was released as a major bump and is now the unqualified `latest` tag, but Payload 3.85 has not moved its peer dependency yet.
**How to avoid:** Always install with the explicit range: `npm install graphql@^16.8.1`. Verify post-install with `npm ls graphql`.
**Warning signs:** GraphQL playground/API throwing type-resolution errors at boot, or npm peer-dependency warnings during install.

### Pitfall 5: Blocks with 1:1 near-duplicate "Featured X" configs re-emerging via new collection needs
**What goes wrong:** A future content need (e.g., "featured testimonials on the home page") triggers creating a brand-new `FeaturedTestimonials` block instead of extending `ArchiveBlock`'s `relationTo` options.
**Why it happens:** It's locally easier to copy an existing block than to generalize an existing one, which is exactly how JuanPortfolio ended up with ~35 blocks.
**How to avoid:** Any new "grid of N items from a collection" need in Phase 1 or later must extend `ArchiveBlock.relationTo`'s option list, never spawn a new block slug. Document this constraint directly in `ArchiveBlock/config.ts`'s code comments so future-Claude (Phase 5+) doesn't repeat the anti-pattern.
**Warning signs:** A new block folder whose fields are >70% identical to `ArchiveBlock`'s.

## State of the Art

| Old Approach (JuanPortfolio/Mongo) | Current Approach (this phase) | When Changed | Impact |
|--------------------------------------|-------------------------------|---------------|--------|
| `@payloadcms/db-mongodb` + `mongooseAdapter` | `@payloadcms/db-postgres` + `postgresAdapter`, `push: false` | This rebuild | No live schema push ever; all schema changes reviewable as committed SQL diffs |
| CaseStudies as `heroImage` + one `richText` blob | Structured fields (KPIs array, challenge array, solution array, results group) | This phase | Enables consistent rendering/design per-section instead of arbitrary rich text layout; matches ariannalupi.com reference model |
| ~35 near-duplicate blocks | ~12-14 consolidated blocks, `ArchiveBlock` covers 9+ former grid variants | This phase | Smaller admin surface, smaller migration-mapping surface for Phase 4 ETL |
| `mcpPlugin`, GSC dashboard components, AdBanners/KeywordMetrics/PageMetrics/GSCMetrics/BrokenLinks collections | Removed entirely | This phase | Backend surface reduced to only public-content-facing collections |

**Deprecated/outdated:**
- `@payloadcms/richtext-slate`: not used in this project at all — Lexical is the only editor wired.
- Vercel Blob storage adapter (`@payloadcms/storage-vercel-blob`): not used — Phase 1 uses local disk (`disableLocalStorage: false`, Payload default), Phase 3 wires Cloudinary.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `typescript@^5` and `tsx` latest are appropriate dev-tool versions | Standard Stack | Low — these are generic dev tooling, any reasonably current version works; would only matter if a specific TS 5.x feature were required, which none are in this phase |
| A2 | `services` field on CaseStudies should be a plain `array` of text rather than a fixed `select hasMany` taxonomy | Standard Field-Type Choices | Low-Medium — if Juan later wants a closed, filterable services taxonomy, this requires a follow-up migration to convert array→relationship/select; flagged explicitly as a Phase 1 discretion call, not a locked decision |
| A3 | `period`/`sector` on CaseStudies should be plain `text` rather than split date-range fields | Standard Field-Type Choices | Low — CONTEXT.md explicitly allows either shape ("texto o fecha inicio/fin"); text is simpler for Phase 1 with zero migrated data yet, but if Phase 4 migration data reveals real date sorting/filtering needs, this field would need to change shape before the ETL script writes to it |
| A4 | `kpis` array should allow 1-6 rows (soft guard) rather than a hard-locked 4 | Standard Field-Type Choices | Low — CONTEXT.md describes "array de 4 tarjetas" as the target content shape, but hard-locking to exactly 4 in schema (`minRows: 4, maxRows: 4`) would block a case study that only has 3 strong metrics; recommend the planner confirm with Juan whether exactly-4 should be enforced at the schema level or left as an editorial convention |

## Open Questions

1. **Should `results.metrics` rows enforce exactly N items, or stay freeform array length?**
   - What we know: CONTEXT.md's reference model shows "array {label, before, after}" without specifying a count.
   - What's unclear: Whether the ariannalupi.com reference model always shows the same number of before/after metrics per case study.
   - Recommendation: Leave freeform (no `minRows`/`maxRows`) in Phase 1 — this is the safer default and costs nothing to loosen later; tightening later is a migration, loosening later is free.

2. **`period` field type (text vs. date range) — final call needed before Phase 4 ETL writes real migrated data**
   - What we know: CONTEXT.md allows either shape; recommending `text` for Phase 1 simplicity (see A3).
   - What's unclear: Whether Phase 4's migration script (reading from the old `Works`/current site content) will have clean, parseable date data or only freeform period strings like "Q3 2024 - Q1 2025."
   - Recommendation: Defer the final decision to Phase 4 planning once the actual content-audit data is visible; `text` is the safe default that doesn't block Phase 1 from shipping.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Payload/Next runtime | Not verified this session (no local project yet) | Requires Node 20+ per STACK.md sharp compatibility note | Confirm `node --version` ≥ 20 before scaffolding; if older, use `nvm`/`fnm` to install 20 LTS |
| npm registry access | Package installation | ✓ (verified live during this research session via `npm view`) | — | — |
| Neon Postgres (dev) | `DATABASE_URI` for `@payloadcms/db-postgres` | Not verified this session (Juan's account, not inspected) | — | If Neon free-tier proves insufficient, fall back to local Postgres via Docker (`postgres:16` image) — no code changes needed, only connection string swap |
| Neon unpooled connection string | Migrations (`payload migrate:create`/`payload migrate`) | Must be confirmed by Juan when provisioning the Neon project — Neon's dashboard shows both pooled and unpooled strings per branch | — | None — this is a hard requirement per Pitfall 1; using the pooled string for migrations is not a viable fallback, it actively breaks the workflow |

**Missing dependencies with no fallback:** none blocking — the Neon unpooled string is a configuration choice Juan makes when creating the Neon project, not a missing capability.

**Missing dependencies with fallback:** Neon itself (fallback: local Docker Postgres) if free-tier limits or account setup become a blocker.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Payload's built-in `auth: true` on the `Users` collection (bcrypt password hashing, session/JWT cookie handling) — do not hand-roll auth logic |
| V3 Session Management | Yes | Payload's default cookie-based session handling for admin auth — no custom session store needed in Phase 1 |
| V4 Access Control | Yes | Collection-level `access` functions (`authenticated`, `authenticatedOrPublished` patterns from JuanPortfolio, port these utilities) — every collection except public-read ones (Media read, Clientes read) should default to `authenticated` for create/update/delete |
| V5 Input Validation | Yes | Payload's built-in field-level validation (`required`, `type` coercion, `minRows`/`maxRows` on arrays) — no separate validation library needed for schema-level constraints in this phase |
| V6 Cryptography | Partial | `PAYLOAD_SECRET` env var used internally by Payload for JWT signing — must be a high-entropy secret, never committed; no other crypto surface in this phase (Cloudinary signing is Phase 3) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Overly-permissive collection `access` (e.g., leaving `create`/`update` open on `Testimonials`/`CaseStudies`) | Elevation of Privilege | Explicit `access: { create: authenticated, update: authenticated, delete: authenticated, read: authenticatedOrPublished }` on every content collection except `Media`/`Clientes` (which need public `read` for the public site to render logos/images) |
| `PAYLOAD_SECRET` committed to git or left as a weak default | Information Disclosure / Spoofing | `.env` gitignored (already the pattern in both reference codebases), `.env.example` committed with a placeholder, generate a real high-entropy secret before first deploy (not in Phase 1 scope to deploy, but the `.env.example` should model this correctly now) |
| Unrestricted file upload on `Media` (arbitrary file types/sizes) | Denial of Service / Tampering | Payload's `upload` config supports `mimeTypes` restriction — recommend restricting to image MIME types in Phase 1 even though Cloudinary isn't wired yet, since local disk storage is still a real attack surface if left fully open |
| Postgres connection string with plaintext credentials in shell history / logs | Information Disclosure | Standard `.env` file pattern, never pass `DATABASE_URI` as an inline shell arg in scripts/CI |

## Sources

### Primary (HIGH confidence)
- `npm view payload version` / `npm view @payloadcms/* version` / `npm view payload@3.85.2 peerDependencies` — direct registry queries run live in this research session (2026-07-09)
- `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/payload.config.ts` — real production Postgres + push:false config, read directly
- `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/package.json` — real build scripts (`payload generate:importmap && payload migrate && next build`)
- `/Users/juan/Documents/Codigo/Arianna/apturio/website/next.config.mjs`, `package.json` — standalone output + `postbuild` copy pattern, real production config
- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/collections/CaseStudies/index.ts`, `Clientes/index.ts`, `Testimonials.ts`, `Users/index.ts`, `Media.ts` — read directly, used to confirm what NOT to copy verbatim (Pitfall 2) and what admin-UX/utility patterns to port (slugField, access utils)
- `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/research/ARCHITECTURE.md`, `STACK.md`, `PLUGINS.md` — this project's own prior research, used as primary source per task instructions, not re-derived

### Secondary (MEDIUM confidence)
- [Connection pooling - Neon Docs](https://neon.com/docs/connect/connection-pooling) — confirms PgBouncer transaction-mode pooling breaks prepared statements
- [Schema migration with Neon Postgres and Drizzle ORM - Neon Docs](https://neon.com/docs/guides/drizzle-migrations) — confirms unpooled connection string required for migrations
- [Get Started with Drizzle and Neon - Drizzle ORM](https://orm.drizzle.team/docs/get-started/neon-new) — corroborates the pooled/unpooled split pattern

### Tertiary (LOW confidence)
- None — all findings in this research were either verified directly against project files/npm registry or cited from official Neon/Drizzle docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version confirmed live via npm registry during this session
- Architecture/scaffolding: HIGH — verified against two real production Payload 3.85 Postgres codebases plus the project's own prior ARCHITECTURE.md research
- CaseStudies/Testimonials/Clientes field modeling: MEDIUM — field-type choices are sound Payload patterns, but the exact shape is a first-time design (no existing reference implements CONTEXT.md's structured model verbatim), flagged via Assumptions Log where discretion was exercised
- Neon pooling guidance: MEDIUM — verified via current official Neon/Drizzle docs, but not hands-on tested against this specific project's Neon account in this session

**Research date:** 2026-07-09
**Valid until:** 30 days (Payload/Next ecosystem moves fast; re-verify versions if planning is delayed past early August 2026)

---
*Research for: Phase 1 — Schema Foundation (Payload 3.85 + Next.js 15 + Postgres greenfield scaffold)*
*Researched: 2026-07-09*
