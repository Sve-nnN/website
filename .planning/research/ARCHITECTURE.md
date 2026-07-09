# Architecture Research

**Domain:** Payload CMS 3.x + Next.js 15 portfolio site — greenfield rebuild replicating existing MongoDB content on PostgreSQL, self-hosted on Hostinger Node.js
**Researched:** 2026-07-09
**Confidence:** HIGH (patterns verified against two real production codebases — apturio and aprendoclub — plus current source-of-truth codebase JuanPortfolio; MEDIUM on Hostinger process-management specifics, verified via web search of current community guides)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router (standalone)                │
├──────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────────┐  │
│  │ [locale]/(fe)  │  │ (payload)/    │  │ next-intl middleware     │  │
│  │ public routes  │  │ /admin panel  │  │ (locale prefix routing)  │  │
│  └───────┬────────┘  └──────┬────────┘  └─────────────┬────────────┘  │
│          │                  │                          │              │
├──────────┴──────────────────┴──────────────────────────┴──────────────┤
│                        Payload CMS Core (in-process)                  │
│  Collections (Pages, Posts, Authors, CaseStudies, Categories, Media,  │
│  Testimonials, Works/Clientes, Users) + Globals + Blocks + Plugins    │
│  (seo, redirects, nested-docs) + Local API (used by RSC server comps) │
├──────────────────────────────────────────────────────────────────────┤
│                    Postgres Adapter (Drizzle, push:false)             │
│  Schema owned by generated migrations — never live push in prod       │
├────────────────┬───────────────────────────────┬──────────────────────┤
│  PostgreSQL DB  │  Cloudinary (media storage)   │  Resend (email API)  │
│  (Hostinger DB  │  via community/custom adapter │  contact form only   │
│  or external)   │                                │                     │
└────────────────┴───────────────────────────────┴──────────────────────┘

           ▲ one-time / offline
           │
┌──────────┴──────────────────────────────────────────────────────────┐
│         Migration script (Node, run locally/CI — NOT in app)         │
│  MongoDB (JuanPortfolio, read-only) ──transform──▶ Postgres (new)    │
│  Uses Payload Local API on BOTH sides (source + target configs)      │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Next.js App Router (public) | Renders `[locale]/...` routes as RSC, calls Payload Local API directly (same process, no HTTP round-trip) | `app/(frontend)/[locale]/...` |
| Payload Admin | CMS editing UI, auth, live preview | `app/(payload)/admin/[[...segments]]/page.tsx` (Payload-generated) |
| Payload Core Config | Single source of truth for collections/globals/blocks/plugins/access control | `src/payload.config.ts` |
| Postgres Adapter | Schema definition + migration execution, connection pooling | `@payloadcms/db-postgres`, `migrationDir`, `push: false` in prod |
| Media Storage Adapter | Offloads uploads to Cloudinary instead of local disk/S3 | Community plugin or custom Payload storage adapter (no official Cloudinary adapter exists — verify before Media phase) |
| Migration Script | One-time ETL: read Mongo docs via old Payload Local API, transform shape, write via new Payload Local API against Postgres | Standalone Node script outside the Next.js app, run with `payload run` or `tsx` |
| SEO Plugin | Injects tabbed `meta` fields (title/description/OG image), feeds sitemap/meta rendering | `@payloadcms/plugin-seo` on `pages`/`posts`/`case-studies` |
| Sitemap Routes | Serve `sitemap.xml`, `sitemap-pages.xml`, etc. reading published docs via Local API | Next.js route handlers under `app/(frontend)/sitemap.xml/route.ts` or `next-sitemap` |

## Recommended Project Structure

```
src/
├── app/
│   ├── (frontend)/
│   │   └── [locale]/           # next-intl-prefixed public routes
│   │       ├── page.tsx        # home
│   │       ├── blog/
│   │       ├── case-studies/
│   │       ├── authors/
│   │       ├── contact/
│   │       ├── privacy/, terms/, search/
│   │       └── [slug]/         # generic Pages catch-all
│   ├── (payload)/
│   │   └── admin/[[...segments]]/  # Payload-generated admin
│   └── api/                    # llms.txt, robots.txt, sitemap routes if not file-based
├── collections/
│   ├── Pages/
│   ├── Posts/
│   ├── Authors/
│   ├── Categories/
│   ├── CaseStudies/
│   ├── Media/
│   ├── Testimonials/
│   ├── Works/ (or Clientes/ — pick ONE, current codebase has both, merge)
│   └── Users/
├── blocks/                     # minimal set, see Features/roadmap notes
│   ├── Hero/
│   ├── Content/
│   ├── CallToAction/
│   ├── FAQ/
│   ├── ArchiveBlock/           # generic listing (posts/case-studies)
│   ├── FeaturedGrid/           # consolidates FeaturedWorks/FeaturedBlog/FeaturedCaseStudies
│   ├── TestimonialsCarousel/
│   ├── ContactFormBlock/
│   └── MediaBlock/
├── globals/
│   ├── Header/, Footer/
│   ├── SiteSettings/
│   └── Llms/                   # llms.txt / llms-full.txt content source
├── i18n/                       # next-intl request config + routing
├── scripts/
│   └── migrate-from-mongo.ts   # ETL script, run offline
├── access/                     # authenticated, authenticatedOrPublished
├── fields/                     # slugField, shared field configs
├── utilities/                  # generatePreviewPath, getURL, etc.
└── payload.config.ts
```

### Structure Rationale

- **`collections/` flat, one folder per content type:** matches both aprendoclub (lean) and current JuanPortfolio pattern — keep the folder-per-collection convention, just delete the tooling ones (see KEEP/DROP table below).
- **`blocks/` consolidated to ~10-12 vs current ~35 folders:** current site has near-duplicate blocks (`FeaturedWorks`/`FeaturedBlog`/`FeaturedCaseStudies`/`FeaturedBlogPosts`/`FeaturedCaseStudies`/`LatestBlogPosts`/`LatestCaseStudies` are 7 blocks doing "show N items from a collection in a grid"). Consolidate into one generic `FeaturedGrid`/`ArchiveBlock` with a `relationTo` select field.
- **`scripts/migrate-from-mongo.ts` lives outside `app/`:** it is a one-time operational tool, not part of the running application. Never import it in Next.js routes or bundle it into the standalone build.
- **`i18n/` separate top-level folder:** next-intl needs its own request/routing config independent of Payload's `localization` block; keep them visually distinct even though both are "bilingual" concerns.

## Architectural Patterns

### Pattern 1: Local API for both migration and rendering (no REST/GraphQL round-trip)

**What:** Payload's Local API (`payload.find()`, `payload.create()`, etc.) runs in-process against whichever DB adapter is configured. Both the frontend RSC pages and the migration script use it directly — never hit the collection via HTTP.
**When to use:** Always for server-rendered pages (avoids network hop + auth headaches) and for the migration script (source: instantiate a Payload instance pointed at Mongo + JuanPortfolio's actual `payload.config.ts`; target: instantiate a second Payload instance pointed at the new Postgres config).
**Trade-offs:** Requires running two separate Payload configs side by side during migration (memory/complexity), but avoids re-implementing auth/validation and guarantees data goes through the same hooks/access-control the app itself uses.

**Example:**
```typescript
// scripts/migrate-from-mongo.ts
import { getPayload } from 'payload'
import sourceConfig from '../../JuanPortfolio/src/payload.config' // old Mongo config, read-only
import targetConfig from '../src/payload.config' // new Postgres config

const source = await getPayload({ config: sourceConfig })
const target = await getPayload({ config: targetConfig })

const { docs: posts } = await source.find({ collection: 'posts', locale: 'all', limit: 0 })
for (const post of posts) {
  await target.create({ collection: 'posts', data: transformPost(post), locale: 'es' })
}
```

### Pattern 2: Generic `ArchiveBlock`/relationship-driven grids instead of per-content-type "Featured X" blocks

**What:** One block config with a `relationTo` (select: posts | case-studies | works) + `mode` (manual selection vs "latest N") + `limit` field, instead of 7 near-identical blocks.
**When to use:** Any "show a grid of N items from collection Y" need — covers current `FeaturedWorks`, `FeaturedClients`, `FeaturedBlog`, `FeaturedBlogPosts`, `FeaturedCaseStudies`, `LatestBlogPosts`, `LatestCaseStudies`, `PostsGrid`, `CaseStudiesGrid`, `WorkCards`.
**Trade-offs:** Slightly more complex block config (conditional fields based on `relationTo`) but collapses ~9 blocks into 1-2, which is the single biggest bloat reduction available in the page-builder layer.

### Pattern 3: Env-var-gated storage adapter (conditional plugin registration)

**What:** Register the Cloudinary/S3 storage plugin only when its required env vars are present; otherwise Payload falls back to local-disk uploads. Verified in both apturio (`hasS3` boolean gate) and current JuanPortfolio (`enabled: !!process.env.BLOB_READ_WRITE_TOKEN`).
**When to use:** Always, for any external storage integration — makes local dev work without cloud credentials and makes prod config a pure env-var concern, not a code branch.
**Trade-offs:** None significant; this is strictly better than hardcoding the adapter.

**Example:**
```typescript
const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
// ...
plugins: [...corePlugins, ...(hasCloudinary ? [cloudinaryStorage({ collections: { media: true } })] : [])]
```

## Data Flow

### Migration Flow (Mongo → Postgres, one-time, offline)

```
JuanPortfolio (Mongo, read-only during migration)
    ↓ Payload Local API (source config, unmodified)
scripts/migrate-from-mongo.ts
    ↓ transform (strip SEO-tooling relationships, remap block types,
    ↓            remap Cloudinary/Blob media URLs, remap locale shape)
    ↓ Payload Local API (target config, new Postgres schema)
New Postgres DB (juan-payload)
```

Key transform concerns to flag for roadmap:
- **Media**: current site uses Vercel Blob; new site uses Cloudinary. Migration script must re-upload media binaries to Cloudinary (or bulk-import via Cloudinary's API) and rewrite `media` doc URLs — this is NOT a simple field copy.
- **Block-type remapping**: since blocks are being consolidated (Pattern 2), the migration script must map old block types (e.g., `FeaturedBlogPosts`, `LatestBlogPosts`) to the new consolidated block shape, not copy 1:1.
- **Relationship fields pointing at dropped collections** (`primaryKeyword`/`semanticKeywords` → `keyword-metrics`, GSC fields) must be dropped, not migrated.
- **Localization**: current Mongo collections use Payload's native `localized: true` fields with `es` as `defaultLocale`. New site should preserve the same localization strategy (see Integration Points below) so migrated locale data maps 1:1 without a routing-model change.

### Runtime Request Flow (post-migration, production)

```
Browser → Next.js (standalone server.js) → [locale] middleware (next-intl)
    ↓
RSC page component → payload.find()/findByID() (Local API, in-process)
    ↓
Postgres (via Drizzle adapter, pooled connection)
    ↓
Rendered HTML (SSR) ← image URLs point to Cloudinary (no proxy needed)
```

Admin writes flow separately: `Browser → /admin UI → Payload REST (internal) → hooks (revalidate, redirects) → Postgres`, with `afterChange` hooks triggering `revalidatePath`/`revalidateTag` for the corresponding frontend route (pattern already present in JuanPortfolio's `revalidatePage`/`revalidateCaseStudy` hooks — keep this).

### Key Data Flows

1. **Content authoring:** Editor changes a doc in `/admin` → `afterChange` hook revalidates the corresponding Next.js path → next request re-renders fresh (no full rebuild needed, since deploy is a persistent Node server, not static export).
2. **Migration (one-time):** Mongo → transform script → Postgres, run once per environment (dev, staging, prod), NOT part of the CI/CD deploy pipeline — a manual/scripted operational task.
3. **Media:** New uploads go directly to Cloudinary via the storage adapter at write time; `.next/static` (Next.js's own JS/CSS bundle assets, unrelated to Payload media) is served by the Node process itself or by a reverse proxy — these are two independent asset pipelines that must not be conflated.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|---------------------------|
| Personal portfolio (current target) | Single Node process, single Postgres instance, no queueing needed. This is the right scale for the whole build. |
| Moderate traffic growth | Add Next.js response caching (`revalidate` intervals) and a CDN in front of Hostinger for static/image assets if Cloudinary alone isn't enough; consider PM2 cluster mode (multiple Node instances) behind the same reverse proxy. |
| High traffic (unlikely for this project) | Not a realistic near-term concern — do not over-engineer for this. |

### Scaling Priorities

1. **First bottleneck (realistic):** Postgres connection pool exhaustion if Hostinger's managed Postgres has a low max-connections limit — mirror apturio's pattern of `pool: { max: 3-5 }` and verify Hostinger's plan limits before deploy (flagged as open constraint in PROJECT.md).
2. **Second bottleneck (unlikely to matter):** Single Node process CPU-bound during SSR spikes — PM2 cluster mode is the standard mitigation if it ever becomes relevant.

## Anti-Patterns

### Anti-Pattern 1: Porting the SEO-tooling collections "just in case"

**What people do:** Copy `AdBanners`, `BrokenLinks`, `GSCMetrics`, `KeywordMetrics`, `PageMetrics` into the new config because they exist in the source and "might be useful later."
**Why it's wrong:** This is explicitly the clutter the rebuild exists to remove (per PROJECT.md Out of Scope). It also drags in dependent code: GSC dashboard components, `mcpPlugin` integration, `dinorank` cron jobs, keyword-scoring hooks on Pages/Posts — a whole parallel internal-tooling subsystem.
**Do this instead:** Do not migrate these collections' data or config. If Juan wants SEO metrics dashboards later, that is a separate future project, not baked into the CMS content schema.

### Anti-Pattern 2: One block per "variation" of a content-grid

**What people do:** Add a new block type every time a grid needs a slightly different data source (Featured vs Latest, Posts vs Case Studies vs Works).
**Why it's wrong:** Current codebase has 9+ blocks that are functionally "grid of N cards from collection X, optionally curated" — this is the single largest source of the "~25 blocks" bloat and increases both admin cognitive load and migration-script mapping complexity.
**Do this instead:** One configurable `ArchiveBlock`/`FeaturedGrid` block with `relationTo`, `populateBy` (collection vs selection), and `limit` fields (Payload's own website template already ships this exact pattern via `ArchiveBlock` — current codebase already has this block, just underused).

### Anti-Pattern 3: Running the migration script inside the Next.js app or as an API route

**What people do:** Expose a `/api/migrate` route or run the ETL as part of `next build`/deploy.
**Why it's wrong:** It's a one-time, stateful, potentially long-running operation with two DB connections (Mongo + Postgres) — bundling it into the production app risks accidental re-runs, bloats the standalone build, and couples deploy tooling to migration tooling.
**Do this instead:** Standalone script run manually or via a one-off CI job (`payload run scripts/migrate-from-mongo.ts` or `tsx`), executed once per environment, never part of the app's request-handling code path.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|----------------------|-------|
| PostgreSQL (Hostinger-managed or external) | `@payloadcms/db-postgres`, `push: false` in prod, migrations committed to repo | Verify Hostinger Postgres connection-limit before finalizing pool `max` — flagged constraint in PROJECT.md |
| Cloudinary | No official Payload storage adapter exists (verified: only official adapters are S3, Azure, GCS, Vercel Blob, uploadthing). Requires a community plugin (search npm for `payload-cloudinary` / `@payload-enchants/cloudinary`) or a small custom `StorageAdapter` implementing Payload's `generateURL`/`handleUpload`/`handleDelete` interface | **Flag for roadmap:** this needs a dedicated research/spike phase before committing — do not assume a drop-in adapter exists without verifying current npm state at build time |
| Resend | `@payloadcms/email-resend`, already used in both JuanPortfolio and apturio | Direct config port, no changes needed |
| next-intl | Locale-prefixed routing (`[locale]/...`) + UI string translations, layered on top of Payload's native field localization | Confirmed pattern: apturio uses BOTH next-intl (routing/UI copy) AND Payload `localization` (content fields) simultaneously — they are complementary, not competing, tools |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| Frontend RSC pages ↔ Payload Core | Local API (in-process, no HTTP) | Never call Payload's own REST API from within the same Next.js process — adds latency for no benefit |
| Admin UI ↔ Payload Core | Payload's internal REST/GraphQL (auto-generated) | Standard, no custom work needed |
| Migration script ↔ Mongo source / Postgres target | Two independent Payload Local API instances, each with its own config | Source config should be the actual (unmodified) JuanPortfolio config imported read-only; do not hand-write a parallel Mongo schema — reuse the real one to guarantee field-shape fidelity |
| Blocks ↔ Collections | `relationTo` fields inside block configs (e.g., `ArchiveBlock.relationTo: ['posts', 'case-studies']`) | Keep blocks collection-agnostic where possible to minimize duplication |
| SEO plugin ↔ Sitemap routes | Both read the same `meta`/`publishedAt`/`slug` fields via Local API | Sitemap route handlers should query `_status: 'published'` docs only, same access pattern as `authenticatedOrPublished` |

---

## Collections: KEEP vs DROP (source of truth for roadmap Phase 1)

| Collection (JuanPortfolio/Mongo) | Decision | Rationale |
|---|---|---|
| `Pages` | KEEP | Core content, page-builder driven |
| `Posts` | KEEP | Blog content |
| `Media` | KEEP (rewire storage adapter to Cloudinary) | Core, but swap Vercel Blob → Cloudinary |
| `Categories` | KEEP | Used by Posts/CaseStudies taxonomy |
| `Users` | KEEP (simplify — drop MCP-related fields/access if any) | Auth required for admin |
| `Authors` | KEEP | Blog byline data, has listing page per PROJECT.md |
| `Works` | MERGE with `Clientes` or KEEP as distinct — clarify during Phase 1: current site has both `Works` (portfolio projects) and `Clientes` (client logos); PROJECT.md refers to "Works/Clientes" as one concept. Recommend keeping as two collections (Works = case-study-adjacent project entries, Clientes = logo/testimonial-source entities) since aprendoclub models this exact split (`ClientesTrabajados` distinct from `TeamMembers`/`Testimonios`) | Needs a Phase 1 content-audit decision, not purely architectural |
| `CaseStudies` | KEEP | Explicit requirement, has listing page |
| `Testimonials` | KEEP | Explicit requirement |
| `AdBanners` | **DROP** | Internal SEO-tooling clutter, explicit Out of Scope |
| `KeywordMetrics` | **DROP** | Internal SEO-tooling clutter |
| `PageMetrics` | **DROP** | Internal SEO-tooling clutter (Core Web Vitals dashboard) |
| `GSCMetrics` | **DROP** | Internal SEO-tooling clutter (Search Console integration) |
| `BrokenLinks` | **DROP** | Internal SEO-tooling clutter |

## Plugins: KEEP vs DROP

| Plugin (JuanPortfolio) | Decision | Rationale |
|---|---|---|
| `@payloadcms/plugin-seo` | KEEP | Explicit requirement, tabbed UI on Pages/Posts/CaseStudies |
| `@payloadcms/db-postgres` (new) | ADD | Replaces `@payloadcms/db-mongodb` |
| `@payloadcms/plugin-redirects` | KEEP (add — currently JuanPortfolio doesn't show it in this config snippet but aprendoclub/apturio both use it) | Needed for slug-change 301s, already has custom hook equivalent (`createRedirectOnSlugChange`) — plugin is cleaner |
| `@payloadcms/email-resend` | KEEP | Explicit requirement, direct port |
| Cloudinary storage adapter | ADD (needs research spike — no official adapter) | Replaces `@payloadcms/storage-vercel-blob` |
| `@payloadcms/plugin-mcp` | **DROP** | Internal tooling, exposes collections (including the ones being dropped) via MCP server — not a public-site concern |
| `@payloadcms/plugin-nested-docs` | Consider only if Pages need hierarchical URLs (aprendoclub includes it with empty `collections: []`, i.e., wired but unused) — likely **DROP** unless Phase 1 content audit shows nested page structure | Avoid speculative plugins |
| `@payloadcms/plugin-form-builder` | **DROP per PROJECT.md** | Explicit Out of Scope — contact form uses simple custom logic + Resend instead |
| Admin bar, dashboard-analytics | **DROP per PROJECT.md** | Explicit Out of Scope |
| GSC dashboard components (`beforeDashboard`, `afterNavLinks`, custom views) | **DROP** | Tied to dropped `GSCMetrics`/`KeywordMetrics` collections |

## Blocks: Minimal Set to Replicate Current Pages

Current JuanPortfolio has ~35 block folders. Recommended consolidation to ~12-14 blocks that cover the same visual surface:

| New block | Replaces / covers |
|---|---|
| `Hero` (variant field for home vs listing vs post/case-study header) | `HeroHome`, `ListingHero`, `PostArticleHeader`, `CaseStudyHeader`, `BlogArchiveHeader`, `PostHero` |
| `Content` | `Content`, `Intro`, `AboutSection`, `AboutWithFeatures` |
| `ArchiveBlock` / `FeaturedGrid` (relationTo + mode: latest/manual) | `ArchiveBlock`, `FeaturedWorks`, `FeaturedClients`, `FeaturedBlog`, `FeaturedBlogPosts`, `FeaturedCaseStudies`, `LatestBlogPosts`, `LatestCaseStudies`, `PostsGrid`, `CaseStudiesGrid`, `WorkCards` |
| `CallToAction` | `CallToAction`, `SimpleCTA` |
| `FAQ` | `FAQ` |
| `TestimonialsCarousel` / `TestimonialSection` (keep as one, pick one name) | `TestimonialsCarousel`, `TestimonialSection` |
| `ContactFormBlock` | `ContactFormBlock` |
| `MediaBlock` | `MediaBlock`, `Banner` |
| `Code` | `Code` (if technical blog posts need code samples — keep if Posts richtext uses it) |
| `RelatedPosts` | `RelatedPosts`, `RelatedPostsBlock` |
| `TableOfContentsBlock` | `TableOfContentsBlock` (if long-form posts need it) |
| `ResultsSection` | Case-study-specific metrics section — keep if case studies show before/after numbers |
| `Section` | Generic layout/nesting wrapper — keep if used for spacing/background control |

**Drop entirely (no direct roadmap requirement):** `CalendlyEmbed` (unless Juan books calls from the site — confirm), `SidebarBanners`/`PostSidebar` (tied to dropped `AdBanners`), `Form` block (superseded by simple `ContactFormBlock`, since `plugin-form-builder` is out of scope).

## Deployment Architecture (Hostinger Node.js hosting)

- **Build command:** `payload migrate && payload generate:importmap && payload generate:types && next build` (verified pattern from apturio) — migrations run automatically at build/deploy time, before `next build`, ensuring schema is always in sync before the new server starts.
- **`postbuild` step:** `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/` — required because `output: 'standalone'` only traces JS dependencies, not static assets or the `public/` folder (confirmed pattern from apturio's `package.json`).
- **Process management:** Hostinger's "Node.js Web App" hosting product does not natively use Passenger for Node (unlike its PHP hosting); for VPS/Cloud plans, PM2 is the community-standard process manager (`pm2 start .next/standalone/server.js --name juan-portfolio`) with PM2's `startup`/`save` for reboot persistence, and Nginx as reverse proxy from :80/:443 to the Node port. If using Hostinger's managed "Node.js Web App" panel feature specifically, it may run its own supervisor — confirm which Hostinger product tier is actually provisioned before finalizing (flagged as MEDIUM confidence — verify against Hostinger's current panel docs at deploy-planning time, not assumed here).
- **Env vars:** `.env` file on the server (not committed) holding `DATABASE_URI`, `PAYLOAD_SECRET`, `CLOUDINARY_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_SERVER_URL` — same pattern as both reference codebases (`.env.example` committed, `.env` gitignored).
- **Static asset serving:** `.next/static` and `public/` are served by the Node process itself (Next.js standalone server handles this natively) — Cloudinary only serves user-uploaded Media collection assets, not the app's own JS/CSS/font bundles. These are two separate, non-overlapping asset pipelines; do not attempt to route `.next/static` through Cloudinary or a CDN unless a later performance phase specifically adds one in front of Nginx.
- **Migrations at deploy time:** `payload migrate` (not `push: true`) must run as part of every deploy — this is why `push: false` is set in the Postgres adapter config in both reference codebases; schema changes are only ever applied via committed migration files, never via live introspection in production.

## Sources

- `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub/payload.config.ts` (lean collection/plugin reference, HIGH confidence — real production config)
- `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/payload.config.ts` and `package.json` (Postgres + standalone deploy pattern, S3/Cloudflare R2 conditional storage pattern, next-intl + Payload localization combined, HIGH confidence)
- `/Users/juan/Documents/Codigo/Arianna/apturio/website/next.config.mjs` (standalone output config, HIGH confidence)
- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/payload.config.ts` and `src/collections/*` (source of truth for what to keep/drop, HIGH confidence)
- `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/PROJECT.md` (project constraints and requirements, HIGH confidence)
- Web search: Hostinger Node.js/VPS Next.js deployment community guides (PM2 + Nginx reverse-proxy pattern) — MEDIUM confidence, verify against actual provisioned Hostinger product before deploy phase: [How To Deploy Your Next.js App On Hostinger VPS](https://medium.com/@muhammadrokon/how-to-deploy-your-next-js-app-on-hostinger-vps-quick-tips-f109d39680ba), [How to Deploy Next.js to Hostinger VPS - Complete Guide](https://ayyaztech.com/blog/how-to-deploy-nextjs-to-hostinger-vps-complete-guide-2025), [How to add a Node.js Web App in Hostinger (official support doc)](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- Training-data knowledge of Payload CMS 3.x storage adapter API (official adapters list: S3, Azure, GCS, Vercel Blob, uploadthing — no official Cloudinary adapter) — LOW-MEDIUM confidence, flagged explicitly for a dedicated verification spike before the Media phase

---
*Architecture research for: Payload CMS 3.x + Next.js 15 portfolio rebuild (Mongo→Postgres migration, Hostinger self-hosted)*
*Researched: 2026-07-09*
