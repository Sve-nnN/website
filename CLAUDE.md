<!-- GSD:project-start source:PROJECT.md -->

## Project

**Juan Carlos Angulo — Portfolio (Payload rebuild)**

Sitio portfolio personal de Juan Carlos Angulo, ingeniero de software y experto SEO, reconstruido en Payload CMS sobre un backend limpio (sin herramientas internas de SEO tooling, dashboards de métricas ni integraciones experimentales que sí tiene el sitio Next.js actual en `JuanPortfolio`). Mismo contenido y mismas páginas que el sitio actual en localhost:3001, pero servido desde un CMS mantenible, con Resend para email, Cloudinary para medios, y desplegado en Hostinger (Cloud/Business con soporte Node.js).

**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en el contenido (case studies, blog) como en la ejecución técnica (rendimiento y SEO impecables). Si el rendimiento o el SEO fallan, el sitio no cumple su propósito.

### Constraints

- **Hosting**: Hostinger Cloud/Business con soporte Node.js (confirmado por Juan) — arquitectura debe seguir el patrón standalone de apturio, no asumir capacidades de Vercel (ISR, edge functions, ni ejecución serverless nativa)
- **Base de datos**: PostgreSQL — Hostinger ofrece DB gestionada en estos planes; validar límites de conexión (igual que Neon pooler en apturio) durante research/roadmap
- **Storage**: Cloudinary para medios — Payload no tiene adapter oficial para Cloudinary; investigar plugin de comunidad o integración custom antes de planear la fase de media
- **Email**: Resend vía `@payloadcms/email-resend`
- **Contenido**: debe ser réplica 1:1 del contenido/páginas actuales — no es un rediseño de información, es una migración de plataforma con backend limpio
- **Idiomas**: EN + ES, mismo alcance que el sitio actual

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `payload` | 3.85.x (`^3.85`) | Headless CMS running in-process inside Next.js — collections, globals, blocks, auth, Local API | Payload 3 is a native Next.js app (installs into the App Router), so admin + frontend + API share one process and one deploy — ideal for a single self-hosted Node server on Hostinger. This is the version line the whole `@payloadcms/*` suite is published in lockstep with. |
| `next` | 15.5.x (`15.5.20`, the maintained `next-15` line) | App Router framework hosting both the public site and the Payload admin | Payload 3.85 is built and tested against Next 15's App Router. Next 16 is now `latest` on npm, but staying on the 15.5 backport line keeps you on Payload's most-tested target and matches the ARCHITECTURE.md decision. Upgrade to 16 only after Payload publishes explicit 16 support. |
| `react` / `react-dom` | 19.2.x (`^19.2`) | UI runtime for RSC + admin | Next 15 and Payload 3 both require React 19. Do not pin React 18 — the admin panel and Server Components assume 19. |
| `@payloadcms/next` | 3.85.x | Glue package that mounts Payload's admin routes and REST/GraphQL handlers into the App Router | Required by Payload 3 — provides `withPayload()` for `next.config` and the `/admin` + `/api` route handlers. Must match the `payload` version exactly. |
| `@payloadcms/db-postgres` | 3.85.x | Postgres database adapter (Drizzle-based) | The Postgres target for this project. Uses Drizzle ORM under the hood, generates SQL migrations. Run with `push: false` in production and commit generated migrations — never live-push schema to a Hostinger Postgres in prod. |
| `@payloadcms/richtext-lexical` | 3.85.x | Rich-text editor + serializer for content fields | Default (and actively developed) rich-text engine for Payload 3; `richtext-slate` is legacy. Provides the Lexical editor in admin and JSX/HTML converters for the frontend. |
| `postgresql` | 15 or 16 (server) | Relational datastore | Target DB for the rebuild. Hostinger can host Postgres, or use an external managed Postgres (Neon/Supabase/Railway) reachable over the network — the adapter only needs a connection string. Postgres 15+ is safe for Drizzle's generated DDL. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-intl` | 4.13.x (`^4`) | Locale-prefixed routing + message catalogs for the public site | The i18n layer for `[locale]/...` routes. Runs independently of Payload's own `localization` config (Payload localizes *content*; next-intl localizes *UI strings + routing*). Both are needed for a bilingual site. |
| `@payloadcms/email-resend` | 3.85.x | Payload email transport backed by Resend | Wire this as Payload's `email` adapter so admin flows (password reset, verification) and any programmatic sends go through Resend. Pairs with the raw `resend` SDK for the contact form. |
| `resend` | 6.17.x (`^6`) | Resend API SDK | Use directly in the contact-form submit handler / server action for the one transactional email the site sends. |
| `payload-cloudinary` | 2.3.x (`^2.3`) | Community storage adapter that offloads Media uploads to Cloudinary | Recommended Cloudinary integration — actively maintained (last publish 2026-06) and built on `@payloadcms/plugin-cloud-storage`. **Caveat:** its `peerDependencies` still declares `payload: ^2.0.0` (stale metadata), but its runtime `dependencies` pull `@payloadcms/plugin-cloud-storage@^3.25.0`, confirming Payload 3 support. Install with `--legacy-peer-deps` or an override if npm complains, and validate against 3.85 during the Media phase. |
| `@payloadcms/plugin-seo` | 3.85.x | Adds a tabbed `meta` group (title/description/OG image) to chosen collections | On `pages`, `posts`, `case-studies` — feeds `<head>` meta and sitemap rendering. Official plugin, kept in lockstep with core. |
| `@payloadcms/plugin-redirects` | 3.85.x | Managed redirect table editable from admin | Preserve inbound links/SEO equity from the old site's URLs during the rebuild. |
| `@payloadcms/plugin-nested-docs` | 3.85.x | Parent/child hierarchy + breadcrumbs for docs/pages | Only if the Pages collection needs hierarchical URLs; otherwise skip. |
| `@payloadcms/plugin-form-builder` | 3.85.x | Admin-editable forms + submission storage | Optional — use if the contact form should be editable in admin rather than hardcoded. For a single fixed contact form, a plain server action + `resend` is simpler. |
| `sharp` | 0.35.x | Image processing for Payload uploads (resize/format variants) | Required by Payload for image resizing. Must be installed and must run on the Hostinger Node runtime — verify the platform allows native `sharp` binaries (a known self-host gotcha). |
| `graphql` | ^16.8.1 (pin to 16, NOT 17) | GraphQL runtime Payload's API depends on | Payload's peer dependency is `^16.8.1`. npm `latest` is 17.x — do **not** install 17 or Payload's GraphQL layer will break. Pin `graphql@^16`. |
| `drizzle-orm` | pulled transitively by `db-postgres` | SQL query builder / migration engine | Do not add directly — it comes with `@payloadcms/db-postgres`. Listed here for awareness when reading generated migrations. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `typescript` | Types across Payload config, collections, generated types | Payload generates `payload-types.ts`; run `payload generate:types` after schema changes. Use TS ^5. |
| `tsx` | Run standalone TS scripts (the Mongo→Postgres migration ETL) | Run the migration script (`scripts/migrate-from-mongo.ts`) with `payload run` or `tsx` outside the Next build. |
| `payload` CLI | `migrate:create`, `migrate`, `generate:types`, `generate:importmap`, `run` | Use `payload migrate:create` to author DDL locally, commit it, and `payload migrate` on deploy. Never rely on `push` in prod. |
| `dotenv` / Next env loading | Env-var-gated adapters (Cloudinary, Resend) | Follow the env-gate pattern from ARCHITECTURE.md: register the Cloudinary/Resend plugins only when their vars are present, so local dev works without cloud credentials. |
| Process manager (PM2 or systemd) | Keep the standalone Node server alive on Hostinger | Hostinger Node hosting does not manage the process for you — run `next start` (or the standalone `server.js`) under PM2/systemd with restart-on-crash. Verify Node 20+ is available. |

## Installation

# Core (versions lockstep at 3.85.x — let npm resolve the matching minor)

# Official plugins

# i18n + email + media

# Image processing (required by Payload uploads)

# Pin GraphQL to 16 to satisfy Payload's peer (avoid 17.x)

# Dev

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `payload-cloudinary` | `@jhb.software/payload-cloudinary-plugin` (0.4.0) | If `payload-cloudinary` shows problems against 3.85, this is a second community Cloudinary adapter. Lower version/maturity, but a viable fallback. Evaluate both during the Media phase. |
| `payload-cloudinary` | `@payloadcms/storage-s3` (official) + Cloudinary S3-compatible bucket, or migrate media to an S3/R2 bucket instead | If Cloudinary integration proves fragile, the officially-maintained S3 adapter is the most robust storage path. Only choose this if you're willing to drop Cloudinary for S3/R2 (Cloudinary is a user-specified requirement, so treat S3 as a fallback, not default). |
| `@payloadcms/db-postgres` | `@payloadcms/db-vercel-postgres` | Only if deploying to Vercel (this project self-hosts on Hostinger, so plain `db-postgres` with a standard connection string is correct). |
| Next 15.5 | Next 16.2 (`latest`) | Once Payload publishes explicit Next 16 support. Don't lead the upgrade — the CMS admin is the fragile surface. |
| `next-intl` | Payload `localization` alone (no route prefixing) | If UI-string i18n and locale-prefixed URLs aren't needed and content localization suffices. For a public bilingual marketing site, you want `next-intl` for the `[locale]` routing. |
| Plain server action + `resend` | `@payloadcms/plugin-form-builder` | Use the plugin only if the client needs to edit form fields in admin. A fixed contact form is leaner as a hardcoded server action. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@payloadcms/db-mongodb` | This is a rebuild *off* MongoDB onto Postgres; keeping Mongo defeats the migration goal (it's only used read-only by the one-time ETL script against the OLD config). | `@payloadcms/db-postgres` |
| `graphql@17` | Payload's peer is `^16.8.1`; 17.x is npm `latest` and will be installed by accident, breaking Payload's GraphQL layer. | `graphql@^16` (pin it) |
| `@payloadcms/richtext-slate` | Legacy editor, no longer the default; new features and converters target Lexical. | `@payloadcms/richtext-lexical` |
| `push: true` in production | Drizzle live-push can silently alter/drop columns on the Hostinger Postgres — data-loss risk on a production DB. | Generated migrations (`payload migrate:create` → commit → `payload migrate`) with `push: false` |
| Mixing `@payloadcms/*` versions | The suite is published in lockstep (all 3.85.x today); mismatched minors cause subtle type/runtime breakage. | Keep every `@payloadcms/*` package on the same version |
| Local-disk uploads in production | Hostinger Node dynos/containers may not persist local disk across restarts/deploys — uploaded media would vanish. | Cloudinary storage adapter (env-gated) |
| Serverless-only assumptions (Edge runtime, Vercel Blob) | The old site used Vercel Blob; the new target is a persistent Node process on Hostinger, not serverless/Edge. | Node runtime + Cloudinary; keep Payload routes on the Node runtime, not Edge |

## Stack Patterns by Variant

- Use a local/socket or `localhost` connection string, small pool size.
- Because a portfolio's traffic is low; a large connection pool wastes the shared host's memory.
- Require SSL in the connection string (`?sslmode=require`) and a modest `max` pool.
- Because managed providers enforce TLS and cap connections; pooling misconfig is the top self-host Postgres failure.
- Set Payload image sizes conservatively and confirm `sharp` installs/runs before building collections.
- Because `sharp` is a hard requirement for image uploads; a broken binary blocks the entire Media phase.
- Rely on `afterChange` hooks calling `revalidatePath`/`revalidateTag` (persistent server, no rebuild).
- Because the deploy is a long-lived Node server, not a static export — ISR-style revalidation works without redeploying.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `payload@3.85.x` | `@payloadcms/next@3.85.x`, `@payloadcms/db-postgres@3.85.x`, all `@payloadcms/plugin-*@3.85.x` | Lockstep versioning — always match the minor across the whole suite. |
| `payload@3.85.x` | `next@15.5.x` | Payload 3 targets Next 15 App Router. Next 16 works for many but is not the tested target yet — hold at 15.5. |
| `next@15.5.x` | `react@19.2.x`, `react-dom@19.2.x` | Next 15 requires React 19; do not downgrade to 18. |
| `payload@3.85.x` | `graphql@^16.8.1` | Peer dep is 16.x — pin, since npm `latest` is 17. |
| `payload-cloudinary@2.3.x` | `@payloadcms/plugin-cloud-storage@^3.25`, `cloudinary@^2.5` | Peer metadata falsely says `payload@^2`; runtime deps confirm Payload 3. Install may need `--legacy-peer-deps`. Validate against 3.85 in the Media phase (MEDIUM confidence). |
| `@payloadcms/db-postgres@3.85.x` | `drizzle-orm@0.45.x` (transitive), Postgres 15/16 server | Don't install `drizzle-orm` directly; it ships with the adapter. |
| `sharp@0.35.x` | Node 20+ on Hostinger | Native binary — must be verified on the deploy target, common self-host failure point. |

## Sources

- npm registry (live, queried 2026-07-09) — verified current versions: `payload` 3.85.2, `next` 15.5.20 (next-15 line) / 16.2.10 (latest), `@payloadcms/*` 3.85.2, `next-intl` 4.13.1, `resend` 6.17.2, `react`/`react-dom` 19.2.7, `graphql` 17.0.2 (latest) vs Payload peer `^16.8.1`, `payload-cloudinary` 2.3.0, `@jhb.software/payload-cloudinary-plugin` 0.4.0 — HIGH
- `npm view payload@3.85.2 peerDependencies` → `{ graphql: '^16.8.1' }` — HIGH (basis for the graphql-16 pin)
- `npm view payload-cloudinary peerDependencies / dependencies` → peer `payload@^2.0.0` but dep `@payloadcms/plugin-cloud-storage@^3.25.0` — MEDIUM (stale peer metadata; Payload-3 support inferred from runtime dep + 2026-06 publish date)
- `.planning/research/ARCHITECTURE.md` (this project) — architectural decisions on Local API, env-gated storage adapter, Postgres `push:false`, Cloudinary-vs-Blob media, Hostinger persistent-Node deploy model — HIGH (verified against real production codebases apturio/aprendoclub + current JuanPortfolio)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

## Database Safety (manual — not GSD-managed, do not overwrite)

There is no separate dev/staging database. `DATABASE_URI` in `.env` points at the real Neon Postgres used in production. Any `payload migrate` run here writes to real data — there is no sandbox to catch a mistake before it lands.

**Hard rule:** never run `payload migrate` (or execute a migration's `up()` directly against the DB) as an unattended/autonomous step — including inside `/gsd:execute-phase` or `/gsd:autonomous` — without a human reading the migration SQL first. This applies especially to any migration containing `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, or a field changing from non-localized to localized (or vice versa) — those are the patterns that silently destroy existing rows/columns instead of just adding structure.

If a plan requires a schema migration: generate it with `payload migrate:create`, then stop and show Juan the generated SQL (up and down) before running `payload migrate`. If the migration touches an existing column with data in it (localizing a field, narrowing a type, dropping/renaming a column), the migration must explicitly back-fill the data into the new shape before dropping anything — never assume Payload does this for you.

**Incident (2026-07-12):** an autonomous phase-19 run generated `20260712_202954_phase19_calltoaction_localized.ts` to localize `CallToAction.richText`, applied it unattended against production, and it `DROP COLUMN`'d the old `rich_text` without copying existing values into the new locale rows first — wiped the Home page's CTA copy. Recovered via Neon point-in-time restore. The migration file has since been fixed to back-fill both locales before dropping the column — see the file for the corrected pattern.

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
