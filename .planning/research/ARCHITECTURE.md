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

---

# Milestone v1.1 — UI/UX Polish Pass: Design-Token Architecture

**Domain:** Design-token refinement for the now-existing Next.js App Router + Payload CMS + Tailwind + shadcn/ui site (visual polish milestone, no data-model changes)
**Researched:** 2026-07-10
**Confidence:** HIGH (grounded directly in this repo's current files as built through Phase 5, not generic best practice)

## Current State (verified by direct inspection)

Phase 5 is complete and the token layer already exists in the shadcn/ui-standard two-file split:

| File | Role today |
|------|------------|
| `src/app/globals.css` | Semantic CSS custom properties in `:root` / `.dark` (shadcn defaults: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, plus unused `--chart-*` / `--sidebar-*` sets shadcn scaffolds by default) |
| `tailwind.config.ts` | Maps those CSS vars into Tailwind's `theme.extend.colors` (`background`, `foreground`, `primary`, etc.), plus a **hand-authored `fontSize` scale** (`body`/`label`/`heading`/`display`, with `clamp()` for the two display sizes) that encodes 05-UI-SPEC.md's "exactly 4 sizes" rule directly in Tailwind, and `borderRadius` mapped from `--radius` |
| Component files (16 `src/blocks/*/Component.tsx`, `src/components/ui/*.tsx`, `src/components/SiteHeader.tsx` / `SiteFooter.tsx`) | Consume tokens **exclusively via Tailwind utility classes** in `className` strings (`bg-primary`, `text-foreground`, `font-display`) — confirmed zero CSS Modules anywhere in `src/` (`find src -iname "*.module.css"` → empty) |

Two token categories from this milestone's own goal list are **not yet present** anywhere in the codebase and must be added, not just "refined":
- **Elevation/shadow** — no `--shadow-*` vars, no `boxShadow` extension in `tailwind.config.ts`. Any shadow used today is Tailwind's un-themed default (`shadow-sm`, `shadow-md` from Tailwind core) or absent.
- **Animation/motion timing** — `tailwindcss-animate` plugin is installed (drives shadcn's `Sheet`/`Tabs` open/close), but there are no custom `--motion-*` duration/easing tokens and no `transitionDuration` / `transitionTimingFunction` theme extension. Hover/transition timing in components today is whatever Tailwind's defaults are (`transition-colors` etc.), applied ad hoc.

Color and typography and spacing are **already specified and locked** by `.planning/phases/05-frontend-pages/05-UI-SPEC.md` (editorial-tech direction: Inter/Fraunces, navy `#12141C`/off-white `#FAFAF7`/ember `#FF5B1F`, 4-size type budget, 4px-multiple spacing scale using Tailwind's built-in spacing utilities directly, no separate spacing token file). This milestone is a *refinement pass* on that spec's execution, not a redesign — do not reopen those decisions without cause.

## Sibling Project Comparison (`auditor/apps/web/app/tokens.css`)

The auditor project's `tokens.css` uses a **primitives → semantic** two-tier pattern inside a
single file: raw color ramps (`--slate-100`...`--slate-950`, `--lime-300`...`--lime-700`),
raw spacing/type/radius/z-index/motion scales, then a semantic layer (`--bg`, `--surface`,
`--text`, `--accent`, `--shadow-sm`, `--motion-fast`) that references the primitives, with a
`[data-theme="light"]` override block for its dark-first theme. Component CSS Modules in that
project reference **only** the semantic layer, never a primitive or raw hex directly.

**What transfers to this project and what doesn't:**

| Auditor pattern | Transfers? | Why |
|---|---|---|
| Primitives → semantic two-tier naming discipline | **Yes — adopt the principle** | Prevents component code from hardcoding hex/oklch, keeps a single source of truth for re-theming |
| A single `tokens.css` file, imported at the top of `globals.css` | **Yes — same shape fits here** | This project already has the equivalent split (`:root` blocks in `globals.css` + `tailwind.config.ts` mapping); it's cleaner to formalize it as one visually-scannable token block than to invent a new file |
| Dark-first `[data-theme="light"]` override | **No — do not adopt** | This project is light-first (editorial-tech, off-white dominant per UI-SPEC) with no dark mode requirement in scope. Adding a second theme surface is new scope, not polish. `tailwind.config.ts` already has `darkMode: ['class']` wired for future use — leave the plumbing, don't build the theme now. |
| Full primitive color *ramps* (11-step slate scale, 5-step lime scale) | **No — oversized for this palette** | UI-SPEC locks exactly 4 brand colors (dominant/secondary/accent/destructive) plus neutrals shadcn already provides via `oklch` grays. Building an 11-step ramp for a palette that intentionally uses 4 signal colors adds indirection with no consumer. Keep primitives to what's actually needed: shadow/motion primitives (which genuinely don't exist yet) — not a speculative color ramp. |
| Component styling reads *only* semantic tokens via CSS Modules (`var(--surface)`) | **Partially — adopt the rule, not the mechanism** | This codebase has no CSS Modules and should not introduce one now (see Anti-Pattern below). The equivalent enforceable rule here is: components use Tailwind *utility classes* that are themselves backed by CSS vars (`shadow-md`, `duration-base`) — never inline `style={{ boxShadow: '...' }}` or arbitrary-value Tailwind (`shadow-[0_4px_12px_rgba(0,0,0,.1)]`) scattered across files. |
| Motion tokens as CSS vars, safety-netted by a global `prefers-reduced-motion` rule | **Yes — adopt both** | This project has no `prefers-reduced-motion` handling today; worth adding alongside the new motion tokens since `tailwindcss-animate` already introduces enter/exit animation on shadcn components (`Sheet`, `Tabs`) that should respect it. |

## Recommended Token Architecture (this milestone)

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│  src/app/globals.css  — single source of truth, two @layer blocks  │
├───────────────────────────────────────────────────────────────────┤
│  @layer base { :root { ... } }                                     │
│                                                                      │
│   PRIMITIVES (new, theme-agnostic — additive only)                 │
│    --shadow-color: 220 20% 10%        (HSL channel triplet)        │
│    --motion-fast: 150ms  --motion-base: 250ms  --motion-slow: 400ms│
│    --ease-out: cubic-bezier(0.22,1,0.36,1)                         │
│    --ease-standard: cubic-bezier(0.4,0,0.2,1)                      │
│                                                                      │
│   SEMANTIC (existing shadcn vars, kept; elevation vars added)      │
│    --background --foreground --card --primary --secondary          │
│    --muted --accent --destructive --border --input --ring --radius │
│    --shadow-sm / --shadow-md / --shadow-lg / --shadow-focus  (NEW)  │
├───────────────────────────────────────────────────────────────────┤
│  tailwind.config.ts  — theme.extend maps CSS vars → utilities      │
│   colors: { background, primary, ... }         (unchanged, exists)│
│   fontSize: { body, label, heading, display }   (unchanged, exists)│
│   boxShadow: { sm, md, lg, focus }              (NEW — from vars)  │
│   transitionDuration: { fast, base, slow }      (NEW — from vars)  │
│   transitionTimingFunction: { out, standard }   (NEW — from vars)  │
├───────────────────────────────────────────────────────────────────┤
│  Consumption layer — Component.tsx files (16 blocks + ui/ + Site*) │
│   className="shadow-md duration-base ease-out ..."                 │
│   NEVER: inline hex, inline boxShadow style, arbitrary [] values   │
│   NEVER: new props, new Payload field reads, new block registry    │
│   entries — those are Phase 5 territory, out of scope here          │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Layer | Responsibility | Where it lives |
|-------|-----------------|-----------------|
| Primitives | Raw, reusable values with no semantic meaning yet (durations, easing curves, a shadow color channel) | New CSS custom properties added to the existing `:root` block in `src/app/globals.css` |
| Semantic tokens | Named-by-purpose values components actually reference (`--shadow-md`, `--primary`) | Existing `:root`/`.dark` blocks in `globals.css`, extended with elevation vars; typography/color/spacing semantics stay as already locked by 05-UI-SPEC.md |
| Tailwind theme mapping | Bridges CSS vars into utility-class names so components never write raw CSS | `tailwind.config.ts` `theme.extend` — extend `boxShadow`, `transitionDuration`, `transitionTimingFunction`; `colors`/`fontSize`/`borderRadius` extensions already exist, leave structurally as-is |
| Consumption | Applies tokens visually via `className` | The 16 `src/blocks/*/Component.tsx` files, `src/components/ui/*.tsx` (shadcn primitives), `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx` |

## Integration Points (precise)

| File | New or Modified | What changes |
|------|------------------|---------------|
| `src/app/globals.css` | **Modified** | Add elevation primitives + semantic `--shadow-sm/md/lg/focus` vars to `:root` (and `.dark` if/when dark mode is ever activated — not required this milestone since dark mode isn't in active scope). Add motion primitives (`--motion-fast/base/slow`, `--ease-out`, `--ease-standard`). Add a `@media (prefers-reduced-motion: reduce)` global safety rule (new — doesn't exist today). No color/typography var changes unless UI-SPEC values prove wrong in the visual audit — if so, that's a value tweak within the existing var names, not new architecture. |
| `tailwind.config.ts` | **Modified** | Add `boxShadow: { sm, md, lg, focus }`, `transitionDuration: { fast, base, slow }`, `transitionTimingFunction: { out, standard }` to `theme.extend`, each referencing the new CSS vars (mirrors how `colors`/`borderRadius` already reference `var(--...)`). Do not touch `darkMode`, `content`, or `plugins` — no new Tailwind plugin needed for this milestone. |
| `src/components/ui/*.tsx` (shadcn primitives: `button`, `card`, `badge`, `input`, `select`, `tabs`, `sheet`, `navigation-menu`, `separator`, `skeleton`, `textarea`, `avatar`) | **Modified in place** | Refine `cva()` variant classNames (already the pattern in `button.tsx`, `badge.tsx`, `sheet.tsx`, `navigation-menu.tsx`) to reference new shadow/motion utilities. No new variants added unless the visual audit specifically calls for a state that doesn't exist (e.g., an elevated card variant) — and even then, add via existing `cva()` variant maps, not new components. |
| `src/blocks/*/Component.tsx` (16 files: Hero, Content, CallToAction, FAQ, MediaBlock, Code, Section, ArchiveBlock, TestimonialsCarousel, RelatedPosts, TableOfContentsBlock, ResultsSection, FeaturedPostsBlock, FeaturedCaseStudiesBlock, ClientLogosBlock, ContactFormBlock) | **Modified in place, one at a time** | `className` adjustments only — spacing rhythm (already-existing Tailwind spacing scale per UI-SPEC), typography class usage (already-existing `font-display`/`heading`/`body`/`label` classes), new shadow/motion utility classes where the audit calls for elevation or transition polish. **Do not touch `src/blocks/*/config.ts` files** — those define the Payload field schema and are explicitly out of scope. Do not change the props/interfaces these components receive from `RenderBlocks.tsx`. |
| `src/blocks/RenderBlocks.tsx` | **Untouched** | The block-slug → component registry map is a data-wiring concern, not a visual one. No block is added, removed, or renamed by this milestone. |
| `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx` | **Modified in place** | Same rule as blocks — visual/className only. These read from the `Header`/`Footer` Payload globals (`src/globals/Header`, `src/globals/Footer`); the global field schemas are untouched. |
| `src/globals/Header/*`, `src/globals/Footer/*` (Payload global config) | **Untouched** | Confirmed out of scope per milestone context — no new fields, no schema changes. |
| Any `payload-types.ts`, migrations, collection/block `config.ts` | **Untouched** | This milestone touches zero Payload schema. If a visual pass reveals a genuinely missing field (e.g., an editor needs to toggle a new visual variant), that is a scope escalation to flag back to Juan, not something to quietly add. |

## Architectural Patterns

### Pattern 1: CSS-var-backed Tailwind theme extension (already established here, extend it)

**What:** Every design-relevant value is a CSS custom property in `globals.css`; `tailwind.config.ts` re-exposes it as a themed utility (`bg-primary`, `shadow-md`, `duration-base`); components use only the utility class, never the raw var or a literal value.
**When to use:** Any token that needs to be swappable without touching component code (which is every token in scope for this milestone).
**Trade-offs:** Slightly more indirection than inline Tailwind values, but it's the existing convention (colors/typography/radius already work this way) — extending it for shadow/motion keeps the codebase internally consistent rather than introducing a second styling paradigm.

**Example (shadow token, following the existing `--radius` → `borderRadius` precedent):**
```css
/* globals.css :root */
--shadow-sm: 0 1px 2px oklch(0 0 0 / 0.06);
--shadow-md: 0 4px 12px oklch(0 0 0 / 0.08);
--shadow-lg: 0 12px 32px oklch(0 0 0 / 0.12);
```
```ts
// tailwind.config.ts theme.extend
boxShadow: {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
}
```
```tsx
// src/blocks/ResultsSection/Component.tsx
<div className="rounded-lg bg-card shadow-md">
```

### Pattern 2: Primitives → semantic naming discipline without a full ramp system

**What:** Adopt the auditor project's naming *discipline* (raw value → purpose-named token → component) without importing its full color-ramp apparatus, since this project's palette is intentionally small (4 signal colors, UI-SPEC-locked) rather than a multi-shade system.
**When to use:** For the two genuinely-missing categories this milestone must add — elevation and motion. Both need a primitive tier (raw duration/easing/shadow-color values) because they'll be reused across many unrelated components (cards, buttons, nav, form fields) and having one named source avoids each `Component.tsx` inventing its own `duration-200` vs `duration-300` inconsistently.
**Trade-offs:** Slightly less "complete" than the sibling project's system, but avoids building unused indirection — a ramp with only one consumer (this palette) is architecture theater, not polish.

### Pattern 3: Component.tsx as the sole styling touchpoint, config.ts as the sole schema touchpoint

**What:** Within a block folder (`src/blocks/Hero/`), `Component.tsx` owns visual rendering and `config.ts` owns the Payload field schema. This milestone only ever edits the former.
**When to use:** Always, for this milestone. It's the enforcement mechanism for the Phase 5 hard rule ("everything Payload-editable stays editable") — if a change requires touching `config.ts`, it has silently become a data-model change and must be flagged, not made.
**Trade-offs:** None — this is a guardrail, not a design trade-off.

## Data Flow

### Token resolution flow (build + runtime)

```
globals.css :root (CSS vars)
    ↓ (Tailwind reads at build time via theme.extend's var() references)
tailwind.config.ts theme.extend (utility class generation)
    ↓ (className string authored per component)
Component.tsx (16 blocks + ui primitives + Site Header/Footer)
    ↓ (rendered by RenderBlocks.tsx registry — unchanged)
Browser (CSS var resolved at paint time, so runtime theme swaps — e.g.
future dark mode — need no component code changes, only new :root/.dark values)
```

### Content flow (unchanged by this milestone — shown for contrast)

```
Payload collection/global (Postgres) → Local API / REST →
page.tsx server component → RenderBlocks.tsx → Component.tsx props
```
The token-refinement work only touches the last box (`Component.tsx` styling); the arrow into
it (props sourced from Payload) is untouched.

## Anti-Patterns

### Anti-Pattern 1: Introducing CSS Modules to mirror the auditor project literally

**What people do:** Copy the auditor project's `*.module.css` + `tokens.css` file pair verbatim because "the sibling project does it this way."
**Why it's wrong:** This project has zero CSS Modules today (verified) and is fully committed to the Tailwind-utility-class + shadcn convention, including `cva()` variant management in `src/components/ui/*.tsx`. Introducing a second styling mechanism mid-project for only the polish pass creates two parallel systems, doubles the places a future contributor must check for a given style, and provides no benefit the CSS-var + Tailwind-theme approach doesn't already give.
**Do this instead:** Keep the primitives → semantic *principle*, express it entirely through `globals.css` vars + `tailwind.config.ts theme.extend`, consumed via Tailwind utility classes.

### Anti-Pattern 2: Reopening color/typography/spacing decisions as part of "polish"

**What people do:** Treat a visual audit as license to re-litigate the palette, font pairing, or type scale that 05-UI-SPEC.md already locked (editorial-tech, Inter+Fraunces, 4-size budget, navy/off-white/ember).
**Why it's wrong:** Those are Phase 5 decisions already implemented and validated in the running site; re-deriving them mid-polish risks scope creep into a full redesign and contradicts "refined in place rather than replaced" from the milestone brief.
**Do this instead:** Treat color/typography/spacing values as fixed inputs; this milestone's new architecture surface is specifically elevation + motion (genuinely absent) plus *execution* refinement (consistent application, missing hover/focus states, spacing rhythm gaps) of the existing tokens — not new token categories in those three areas.

### Anti-Pattern 3: Editing `config.ts` "just to add a variant flag" for a visual pass

**What people do:** Add a new Payload `select` field to a block's `config.ts` (e.g., "card style: flat / elevated") to let editors toggle a new visual treatment, because it feels more flexible.
**Why it's wrong:** This milestone is explicitly CSS/component-visual only, per project instructions; new fields are a data-model change requiring migration + type regeneration + admin UI review, which is out of scope and risks destabilizing the Phase 5 schema baseline mid-polish.
**Do this instead:** Pick one consistent visual treatment per component type as part of the audit and apply it uniformly via `className`. If Juan later wants editor-controlled visual variants, that's a new milestone request, not an implicit expansion of this one.

### Anti-Pattern 4: Ad hoc arbitrary-value Tailwind classes for new shadow/motion values

**What people do:** Reach for `shadow-[0_4px_12px_rgba(0,0,0,0.08)]` or `duration-[280ms]` inline in a single `Component.tsx` because it's faster than touching `tailwind.config.ts`.
**Why it's wrong:** Defeats the entire point of a token layer — the next component that needs "the same" shadow will invent a slightly different arbitrary value, and there's no single place to adjust elevation intensity across the site later.
**Do this instead:** Always add the value to `globals.css` + `tailwind.config.ts theme.extend` first (even a single new shadow tier), then reference it as a named utility (`shadow-md`).

## Confirmation: Payload-Editability Hard Rule Is Unaffected

Verified against the actual files this milestone will touch:
- `RenderBlocks.tsx`'s `blockComponents` registry (16 entries) is untouched — no block added/removed/renamed.
- Every `src/blocks/*/config.ts` (Payload field schema per block) is untouched — confirmed as an explicit non-goal above.
- `src/globals/Header`, `src/globals/Footer` Payload global schemas are untouched.
- No new collection, no new field, no new migration, no `payload generate:types` run is required by this milestone — the change surface is `globals.css`, `tailwind.config.ts`, and `className` strings inside existing `Component.tsx` files only.
- Component prop interfaces (the shape of data each `Component.tsx` receives from Payload via `RenderBlocks.tsx`) are unchanged — a component that received `{ heading, subheading, ctaLabel }` before this milestone still receives exactly that after.

This satisfies the milestone's non-negotiable constraint: "every visual section/component must
be modeled as Payload-editable content... never hardcoded" remains true because *no content* is
being touched — only how already-editable content is styled.

## Suggested Build Order

1. **Foundation/token pass (do first, once):**
   a. Extend `src/app/globals.css` `:root` with the new elevation primitives+semantics (`--shadow-sm/md/lg/focus`) and motion primitives (`--motion-fast/base/slow`, `--ease-out`, `--ease-standard`).
   b. Add the global `@media (prefers-reduced-motion: reduce)` safety rule.
   c. Extend `tailwind.config.ts theme.extend` with `boxShadow`, `transitionDuration`, `transitionTimingFunction` mapped to those vars.
   d. Sanity-check the existing color/typography/spacing mappings against 05-UI-SPEC.md — confirm no drift has crept in since Phase 5 (e.g., `fontSize.display` clamp still matches spec), fix only if wrong, don't redesign.
   e. Verify build (`next build` or `next dev`) picks up the new Tailwind utilities before touching any component.

2. **Component-by-component pass (in this order, using the 16-block registry as the concrete checklist):**
   - shadcn primitives first (`src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `sheet.tsx`, `navigation-menu.tsx`, `separator.tsx`, `skeleton.tsx`, `textarea.tsx`, `avatar.tsx`) — these are the lowest-level primitives every block composes from; getting shadow/motion/spacing right here cascades benefit to every block automatically.
   - `SiteHeader.tsx` / `SiteFooter.tsx` — global chrome visible on every page, high visual impact, low risk (no dynamic per-page content).
   - `Hero/Component.tsx` — highest-visibility block (every page's first impression).
   - `Section/Component.tsx`, `Content/Component.tsx` — generic layout primitives many pages compose with; fixing these has broad reach.
   - `ArchiveBlock`, `FeaturedPostsBlock`, `FeaturedCaseStudiesBlock`, `RelatedPosts` — card-grid/listing patterns, likely to share the same elevation/spacing treatment (do these as a batch for consistency).
   - `ResultsSection`, `TestimonialsCarousel`, `ClientLogosBlock` — case-study-specific, Juan's core differentiator content per PROJECT.md's case-study model; worth extra attention to KPI-card elevation and metric typography.
   - `CallToAction`, `FAQ`, `ContactFormBlock`, `TableOfContentsBlock`, `Code`, `MediaBlock` — remaining lower-traffic or utility blocks, lowest risk, do last.

3. **Cross-cutting verification pass (after all components touched):**
   - Grep for any remaining arbitrary-value Tailwind (`shadow-[`, `duration-[`, inline `style={{`) introduced accidentally during the pass — should be zero.
   - Confirm `src/blocks/*/config.ts` and `payload-types.ts` have zero diffs (proves the hard rule held).
   - Visual QA pass across both locales (`/en`, `/es`) since typography/spacing changes affect both equally but content length differs.

## Sources

- Direct repository inspection: `src/app/globals.css`, `tailwind.config.ts`, `src/blocks/RenderBlocks.tsx`, `src/blocks/*/Component.tsx` (16 files), `src/components/ui/*.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`, `src/globals/Header`, `src/globals/Footer` — HIGH confidence (read, not inferred)
- `/Users/juan/Documents/Codigo/Personal/juantech/auditor/apps/web/app/tokens.css` — sibling reference project, read in full — HIGH confidence
- `.planning/phases/05-frontend-pages/05-UI-SPEC.md` — locked design contract this milestone refines — HIGH confidence
- `.planning/PROJECT.md` — milestone scope and constraints — HIGH confidence

---
*Architecture research for: v1.1 UI/UX Polish Pass milestone (design-token layer refinement)*
*Researched: 2026-07-10*
