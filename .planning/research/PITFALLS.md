# Pitfalls Research

**Domain:** Payload CMS 3.x platform migration — MongoDB → self-hosted PostgreSQL (Hostinger Node.js), Vercel Blob → Cloudinary media, with SEO/rankings preservation for a live portfolio site
**Researched:** 2026-07-09
**Confidence:** HIGH on migration + SEO pitfalls (verified against Payload docs, official migration discussions, and two production reference codebases — apturio, aprendoclub); MEDIUM on Cloudinary-adapter specifics and Hostinger runtime behavior (verified via current community sources, but exact package/panel state must be re-checked at build time)

## Critical Pitfalls

### Pitfall 1: URL/slug drift breaks existing rankings and inbound links

**What goes wrong:**
The new Postgres site serves the same content at even slightly different URLs than the live Mongo site — a changed locale prefix (`/es/blog/...` vs `/blog/...`), a trailing-slash policy flip, a renamed collection route (`/case-studies/` vs `/casos/`), or a slug that got regenerated during migration instead of copied verbatim. Google has those old URLs indexed; every drifted URL is a 404 or a soft-404 on cutover, and the accumulated ranking equity for that URL evaporates.

**Why it happens:**
Migration scripts often regenerate slugs from titles ("clean rebuild" mentality) rather than carrying the exact stored slug across. Locale routing is re-decided in the rebuild (next-intl `localePrefix` mode, default-locale handling) without auditing what the live site actually emits. Nobody diffs the old sitemap against the new one before cutover.

**How to avoid:**
Treat the current live site's URL set as a frozen contract. Before migration, crawl/export the full live URL inventory (from the current `sitemap.xml` and Ahrefs/GSC top-pages). Copy slugs **verbatim** in the migration script — never regenerate. Reproduce the exact locale-prefix strategy the live site uses (audit `JuanPortfolio`'s next-intl config, don't assume). After building the new site, diff its generated sitemap against the frozen inventory; every delta is either a bug to fix or a redirect to author.

**Warning signs:**
Migration script calls a `generateSlug()`/`slugify()` on write. New sitemap has a different count or different paths than the old one. `/es/` appears (or disappears) relative to the live site. GSC "Coverage" shows a spike in 404s after cutover.

**Phase to address:** Migration phase (slug fidelity) + a dedicated SEO/cutover phase (URL diff + redirects). Flag the URL-inventory export as a prerequisite before migration coding starts.

---

### Pitfall 2: No 301 redirect map for URLs that legitimately change

**What goes wrong:**
Some URL changes are unavoidable or intentional (a collection is renamed, a taxonomy path changes, `.html` suffixes dropped). Without 301 redirects from old → new, those pages lose all ranking equity and return 404, and Google slowly drops them from the index.

**Why it happens:**
Redirects are treated as an afterthought ("we'll add them if we notice 404s") rather than a migration deliverable. The `@payloadcms/plugin-redirects` exists but isn't wired, or redirects are authored in the CMS but the Next.js layer never actually reads and serves them.

**How to avoid:**
Build the old→new redirect map as a first-class artifact of the migration, derived from the URL diff in Pitfall 1. Wire `@payloadcms/plugin-redirects` (both reference codebases use it) AND confirm the frontend actually resolves them (a `next.config` redirects export or a catch-all that queries the redirects collection). Keep `createRedirectOnSlugChange`-style hooks so future editor slug edits auto-generate 301s. Use 301 (permanent), not 302, for equity transfer.

**Warning signs:**
Redirects collection exists in admin but hitting an old URL returns 404 instead of a 301. `next.config` has no redirects and no catch-all redirect resolver. Chains of redirects (A→B→C) instead of direct A→C.

**Phase to address:** SEO/cutover phase, blocked by the URL-diff output of the migration phase.

---

### Pitfall 3: `push: true` (schema auto-push) leaks into production Postgres

**What goes wrong:**
Payload's Postgres adapter can auto-introspect and push schema changes (`push: true`, the dev default). Left on in production, a config change silently ALTERs the live database — dropping columns, renaming tables, losing data — with no migration file, no review, and no rollback path. This is the single most destructive Postgres-specific footgun in Payload.

**Why it happens:**
`push: true` is convenient in dev and is the default behavior; developers forget it's environment-sensitive. Postgres (unlike Mongo's schemaless model) enforces a real schema, so schema drift becomes destructive rather than lenient.

**How to avoid:**
Set `push: false` in the Postgres adapter for production (both reference codebases do). All schema changes go through committed migration files (`payload migrate:create`), applied via `payload migrate` at deploy time — never via live introspection. Make `payload migrate && ... && next build` the deploy build command (verified apturio pattern).

**Warning signs:**
Adapter config has no explicit `push` setting, or `push: true` unguarded by `NODE_ENV`. Deploy pipeline has no `payload migrate` step. Schema changes appear in prod without a corresponding file in `migrations/`.

**Phase to address:** Postgres/schema foundation phase (set `push: false` from day one) + deployment phase (migrate-at-deploy command).

---

### Pitfall 4: Mongo→Postgres shape mismatch corrupts arrays, blocks, groups, and localized fields

**What goes wrong:**
Mongo stores nested arrays/blocks/groups as embedded JSON; Postgres explodes them into separate relational tables (arrays → child tables, blocks → per-block tables, localized fields → `_locales` tables). A naive field-by-field copy that ignores this either fails on write or produces malformed rows — rich text blocks that don't render, empty localized fields, dropped array items, broken relationship IDs (Mongo ObjectId strings vs Postgres integer/UUID keys).

**Why it happens:**
Developers assume the two adapters store data the same way. They copy documents raw instead of writing through the target Payload Local API (which handles the relational decomposition). Relationship fields hold Mongo ObjectIds that have no meaning in the new Postgres keyspace.

**How to avoid:**
Migrate **through the target Payload Local API** (`target.create()`), never by writing raw rows to Postgres — let Payload handle the relational decomposition and validation (this is the ARCHITECTURE.md Pattern 1 decision). Migrate in dependency order (Media → Authors/Categories → Posts/CaseStudies that reference them) so relationships resolve to new IDs. Maintain an old-ObjectId → new-ID lookup map and remap every relationship field. Use `locale: 'all'` on read and write locale-aware on create to preserve bilingual content. Validate rich text/blocks render on a sample before bulk-running.

**Warning signs:**
Migration writes directly to Postgres tables or via SQL. Relationship fields in migrated docs still contain 24-char hex ObjectIds. Localized fields only populate one language. Blocks array is empty or throws on render. Migration "succeeds" but pages render blank sections.

**Phase to address:** Migration phase — this is the core technical risk of the whole project.

---

### Pitfall 5: Media migration is a re-upload, not a URL copy — and old Blob URLs rot

**What goes wrong:**
Media docs in Mongo point at Vercel Blob URLs. Copying those URL strings into Postgres leaves the new site serving images from the old Blob store (which will be decommissioned), and no assets actually live in Cloudinary. When Blob is torn down, every image 404s. Additionally, image URLs embedded inside rich-text/blocks (not just the Media collection) are missed entirely.

**Why it happens:**
Media is treated as a simple field copy. The distinction between "the Media collection's URL field" and "the binary asset itself" is missed. Cloudinary has no official Payload adapter, so the storage wiring is unfamiliar and under-tested.

**How to avoid:**
The migration must re-upload each binary to Cloudinary (via the chosen storage adapter or Cloudinary's upload API) and rewrite Media doc URLs to the new Cloudinary URLs. Also scan rich-text/block fields for embedded old asset URLs and rewrite them. Verify the community Cloudinary adapter choice in a spike **before** the media phase — multiple community packages exist (`payload-storage-cloudinary`, `@pemol/payload-cloudinary`, `payload-cloudinary`, `@jhb.software/payload-cloudinary-plugin`); none is official, maintenance/quality varies, and a beta official adapter may or may not be ready — pick and pin one deliberately, or write a minimal custom `StorageAdapter`.

**Warning signs:**
Migrated Media docs still have `*.public.blob.vercel-storage.com` URLs. Cloudinary dashboard is empty after migration. Images render now (from Blob) but the plan is to shut Blob down. Chosen Cloudinary package hasn't been updated for current Payload 3.x.

**Phase to address:** Dedicated Cloudinary spike phase (adapter selection) → media migration phase. Do not fold media into the generic content migration.

---

### Pitfall 6: `noindex`/staging robots settings leak to production

**What goes wrong:**
During the rebuild the new site runs on a staging URL with `noindex`, a `Disallow: /` robots.txt, or basic-auth. On cutover those blockers ship to production, Google recrawls, sees `noindex`/blocked, and de-indexes the entire site — catastrophic ranking loss that can take weeks to recover.

**Why it happens:**
The staging-protection mechanism is env-driven but the env flip is forgotten, or `noindex` is hardcoded rather than gated. The SEO plugin's meta or a global robots setting carries the staging value.

**How to avoid:**
Gate all indexing-blockers on an explicit env var (e.g., `NEXT_PUBLIC_IS_PRODUCTION`/`ROBOTS_ALLOW`). Add a cutover checklist item: verify production `robots.txt` allows crawling and no page emits `<meta name="robots" content="noindex">`. Verify with a live fetch of the production URL post-deploy, not just a code read.

**Warning signs:**
`robots.txt` returns `Disallow: /` on the production domain. View-source shows `noindex` on the homepage. GSC "Coverage" reports "Excluded by noindex tag" climbing after launch.

**Phase to address:** Deployment/cutover phase — explicit go-live checklist gate.

---

### Pitfall 7: Postgres connection-pool exhaustion on Hostinger managed DB

**What goes wrong:**
Hostinger's managed Postgres (or a low-tier plan) caps max connections low. Payload/Drizzle opens a pool per Node process; a default pool size plus PM2 cluster mode (multiple instances) plus the migration script's own connections exceeds the cap. The app throws "too many connections" / "remaining connection slots reserved" and pages fail intermittently.

**Why it happens:**
The pool `max` is left at a library default sized for a beefy managed provider, not a shared-hosting Postgres. Connection limits aren't checked before deploy (flagged as an open constraint in PROJECT.md).

**How to avoid:**
Verify Hostinger's actual `max_connections` for the provisioned plan before deploy. Set the adapter pool `max` conservatively (apturio uses `max: 3-5`). Account for PM2 instance count × pool size ≤ DB limit, and don't run the migration against prod while the app is also connected at full pool.

**Warning signs:**
Intermittent `too many clients already` / `remaining connection slots` errors under mild load. Errors appear only in prod, never in single-process dev. PM2 cluster mode multiplies the problem.

**Phase to address:** Postgres foundation phase (pool config) + deployment phase (verify plan limits).

---

### Pitfall 8: `output: 'standalone'` deploy ships without static assets or migrations

**What goes wrong:**
Next.js `output: 'standalone'` only traces JS dependencies — it does NOT copy `public/` or `.next/static` into the standalone bundle. Deploy the bundle as-is and the site loads with no CSS, no fonts, no favicons, broken images (all the app's own assets 404). Separately, if `payload migrate` isn't part of deploy, the new server boots against a schema that doesn't match the config.

**Why it happens:**
Standalone output's asset-tracing limitation is non-obvious. Teams coming from Vercel (which handles all this) don't realize self-hosting requires manual asset copying and a migrate step.

**How to avoid:**
Add the `postbuild` copy step (verified apturio pattern): `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/`. Make `payload migrate` run before `next build` in the deploy command. Serve `.next/static` and `public/` from the Node process (standalone `server.js` handles it) — Cloudinary only serves user Media, never the app bundle.

**Warning signs:**
Production site renders unstyled (no CSS/fonts). `public/` assets 404. Server boots but schema errors on first query. Working on Vercel-style assumptions about asset handling.

**Phase to address:** Deployment phase — build/postbuild command definition.

---

### Pitfall 9: Cutover timing loses content authored on the live site mid-migration

**What goes wrong:**
Migration is run, tested for days, then cutover happens — but editors kept publishing on the live Mongo site during that window. Those new/edited posts never made it into Postgres and are silently lost at cutover.

**Why it happens:**
Migration is treated as a one-shot copy with no content freeze and no delta re-sync. The gap between "migration run" and "DNS/cutover" isn't accounted for.

**How to avoid:**
Declare a content freeze on the live site immediately before the final migration run, or run migration as close to cutover as possible and re-run a delta for anything changed after the last run. Since migration is idempotent-through-Local-API and run once per environment, schedule the production run tightly against go-live.

**Warning signs:**
Days elapse between the prod migration run and DNS cutover with no freeze. Editors report "where did my post go" after launch. `updatedAt` timestamps on the live site are newer than the migration run.

**Phase to address:** Cutover phase — operational runbook, not code.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy Media URL strings instead of re-uploading binaries to Cloudinary | Migration "works" instantly, images show | Site breaks entirely when Vercel Blob is decommissioned; silent time-bomb | Never for prod cutover; OK only for a throwaway visual smoke-test |
| `push: true` in prod to skip writing migrations | No migration files to author | Destructive silent schema drift, no rollback, potential data loss | Never in production; dev only |
| Regenerate slugs from titles during migration | Cleaner-looking URLs | Breaks every indexed URL + inbound link; ranking loss | Never — slugs are a frozen SEO contract |
| Skip the redirect map ("add 404s later") | Ships faster | Lost equity on every changed URL, slow de-indexing | Only if URL set is provably 1:1 identical (verify, don't assume) |
| Default Drizzle pool size on Hostinger | Nothing to configure | Connection exhaustion under load in prod | Never on constrained managed Postgres; verify limits first |
| Migrate raw docs (skip Local API) to go faster | Simpler script | Broken relational shape, malformed blocks/localized fields | Never — decomposition must go through Payload |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cloudinary storage | Assuming an official drop-in adapter exists | No official adapter — pick/pin a community package or write a minimal custom `StorageAdapter`; verify current npm state in a spike before the media phase |
| Cloudinary | Only rewriting the Media collection URLs | Also rewrite asset URLs embedded in rich-text/blocks; re-upload the binaries, don't copy URLs |
| Postgres (Hostinger) | Leaving `push: true` / default pool size | `push: false`, migrations at deploy, conservative pool `max` sized to plan's `max_connections` |
| Mongo source | Hand-writing a parallel Mongo schema for the read side | Import JuanPortfolio's actual unmodified `payload.config` read-only as the source to guarantee field-shape fidelity |
| next-intl + Payload localization | Confusing the two, or changing locale routing during rebuild | They are complementary (next-intl = routing/UI copy, Payload `localization` = content fields); replicate the live site's exact locale-prefix behavior |
| Resend email | Rebuilding contact logic from scratch | Direct config port of `@payloadcms/email-resend` (already used in both JuanPortfolio and apturio) |
| `@payloadcms/plugin-redirects` | Wiring it in admin but not serving redirects in the frontend | Confirm the Next.js layer actually resolves and serves 301s (next.config export or catch-all resolver) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Postgres connection-pool exhaustion | Intermittent `too many clients` errors in prod only | Conservative pool `max`, verify plan limit, account for PM2 instance count | At modest concurrency on a low-tier managed Postgres |
| Missing image optimization after Blob→Cloudinary swap | LCP regresses, oversized images, CWV drop | Use Cloudinary transformations (`f_auto,q_auto`, responsive sizes) via the adapter; verify Next.js `<Image>` still optimizes | Immediately visible in Core Web Vitals — a stated core-value requirement |
| Serving app bundle assets through a proxy/CDN meant for media | Broken/stale JS/CSS, cache mismatches | Keep `.next/static`+`public/` on the Node process; Cloudinary serves only user Media | On any misconfigured reverse-proxy/CDN layering |
| No response caching on a persistent Node server | Every request hits Postgres via SSR | Use `revalidate` intervals + `afterChange` revalidation hooks (already in JuanPortfolio) | Under traffic spikes on a single Node process |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing `.env` (DB URI, `PAYLOAD_SECRET`, Cloudinary/Resend keys) to the repo | Full DB + media + email compromise | `.env` gitignored, `.env.example` committed only; secrets live on the server |
| Reusing the same `PAYLOAD_SECRET` across environments or regenerating it | Invalidates sessions / weakens auth | Distinct, stable, high-entropy secret per environment |
| Exposing dropped SEO-tooling collections via `plugin-mcp` | Leaks internal data/endpoints publicly | Drop `plugin-mcp` (Out of Scope) — it exposes collections over an MCP server |
| Unrestricted Cloudinary upload preset / exposed API secret client-side | Media store abuse, unsigned uploads | Signed server-side uploads only; Cloudinary secret stays server-side env |
| Migration script left runnable as an app route (`/api/migrate`) | Accidental re-run wipes/duplicates prod data | Keep migration as a standalone offline script, never an app endpoint |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Bilingual content half-migrated (one locale empty) | Visitors hit blank ES or EN pages; looks broken/unprofessional | Migrate with `locale: 'all'`, verify both locales render on sampled pages before cutover |
| Broken images post-cutover (Blob torn down) | Portfolio looks unfinished — directly undermines the site's purpose | Re-upload to Cloudinary and verify every image resolves before decommissioning Blob |
| Consolidated blocks render differently than the old site | Visual regressions vs the "1:1 replica" requirement | Diff rendered pages against localhost:3001; block consolidation must preserve visual output, not just data |
| Admin editors confused by remapped/consolidated blocks | Content edits break layout post-launch | Document the new block set; verify migrated pages use valid new block shapes |

## "Looks Done But Isn't" Checklist

- [ ] **Slugs/URLs:** Often silently regenerated — verify new sitemap is byte-for-byte path-identical to the frozen live inventory (or every delta has a 301)
- [ ] **Redirects:** Often authored but not served — verify hitting an old URL returns a real 301 in production, not a 404
- [ ] **Media:** Often still pointing at Vercel Blob — verify Cloudinary actually hosts every asset and no `blob.vercel-storage.com` URLs remain (incl. inside rich text)
- [ ] **robots/noindex:** Often carries staging value — verify production `robots.txt` allows crawl and no page emits `noindex` (fetch the live prod URL)
- [ ] **Both locales:** Often one-sided — verify EN and ES both fully populate on sampled pages
- [ ] **Static assets:** Often missing from standalone bundle — verify prod site is styled, fonts/favicons/`public` load
- [ ] **Migrations at deploy:** Verify `payload migrate` runs in the deploy command and `push: false` in prod
- [ ] **Sitemap/canonical/llms.txt:** Verify `sitemap.xml`, canonicals, and `llms.txt`/`llms-full.txt` are present and correct on the new domain (existing site has them — parity required)
- [ ] **Connection pool:** Verify pool `max` fits Hostinger's `max_connections` under PM2 instance count
- [ ] **Content freeze/delta:** Verify no live-site edits happened between the prod migration run and cutover

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Broken URLs / lost rankings after cutover | HIGH | Author 301s from old→new fast, resubmit sitemap in GSC, request re-index of top pages; recovery takes weeks — prevention is far cheaper |
| `noindex`/robots leaked to prod | HIGH | Remove blocker immediately, fetch-and-request-indexing in GSC for key pages; de-indexing can take weeks to reverse |
| `push: true` destroyed prod schema/data | HIGH | Restore Postgres from backup (ensure backups exist first!), set `push: false`, re-migrate delta — data since last backup may be unrecoverable |
| Media still on Blob, Blob decommissioned | HIGH | Re-run media re-upload to Cloudinary from source binaries if still available; if Blob is gone and no source copy exists, assets are lost |
| Connection-pool exhaustion in prod | LOW | Lower pool `max`, reduce PM2 instances, restart — reversible config change |
| Half-migrated locale / broken blocks | MEDIUM | Fix transform mapping, re-run migration for affected collections (idempotent through Local API) into a fresh DB |
| Content authored during migration window lost | MEDIUM | Re-run delta migration for docs with `updatedAt` after the migration timestamp, if the live Mongo source is still intact |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| URL/slug drift | Migration (verbatim slugs) + prerequisite URL-inventory export | New sitemap diff == frozen live inventory |
| Missing 301 redirect map | SEO/cutover (blocked by URL diff) | Old URL → 301 in prod, no chains |
| `push: true` in prod | Postgres foundation | Adapter has `push:false`; deploy runs `payload migrate` |
| Mongo→Postgres shape mismatch | Migration (Local API, dependency order, ID remap) | Sampled pages render blocks + relationships; both locales populate |
| Media re-upload vs URL copy | Cloudinary spike → media migration | No Blob URLs remain; Cloudinary hosts all assets |
| noindex/robots leak | Deployment/cutover checklist | Live prod `robots.txt` + meta verified by fetch |
| Connection-pool exhaustion | Postgres foundation + deployment | Pool `max` ≤ plan limit under PM2 count; load test |
| Standalone missing assets | Deployment (postbuild copy) | Prod site fully styled; `public`/`static` load |
| Cutover content loss | Cutover runbook | No live edits between migration run and DNS switch |

## Sources

- [Payload — Migrations](https://payloadcms.com/docs/database/migrations) (official; `push:false` + migrate-at-deploy discipline) — HIGH
- [Payload — Postgres adapter](https://payloadcms.com/docs/database/postgres) (relational decomposition of arrays/blocks/localized fields) — HIGH
- [Payload Discussion #9711 — Migrating from MongoDB to Postgresql](https://github.com/payloadcms/payload/discussions/9711) (community migration approach: dual instances, batch through Local API) — MEDIUM
- [Payload Discussion #625 — Data migrations](https://github.com/payloadcms/payload/discussions/625) — MEDIUM
- Cloudinary community adapters (no official adapter; verify at build time): [payload-storage-cloudinary](https://www.npmjs.com/package/payload-storage-cloudinary), [@pemol/payload-cloudinary](https://www.npmjs.com/package/@pemol/payload-cloudinary), [payload-cloudinary (SyedMuzamilM)](https://github.com/SyedMuzamilM/payload-cloudinary), [@jhb.software/payload-cloudinary-plugin](https://www.npmjs.com/package/@jhb.software/payload-cloudinary-plugin), [official cloud-storage plugin blog](https://payloadcms.com/posts/blog/plugin-cloud-storage) — MEDIUM (state changes; re-verify)
- Reference production codebases: `/Users/juan/Documents/Codigo/Arianna/apturio/website` (standalone deploy, postbuild asset copy, pool `max`, migrate-at-deploy, `push:false`) and `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub` (lean Postgres config, redirects plugin) — HIGH
- Source-of-truth codebase `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio` (existing slugs/locale routing/media URLs/llms.txt to preserve) — HIGH
- Sibling research: `.planning/research/ARCHITECTURE.md` (migration Pattern 1 via Local API, Cloudinary adapter flag, Hostinger deploy specifics, connection-limit constraint) — HIGH
- General SEO-migration best practice (URL parity, 301 equity transfer, avoid noindex leak, sitemap resubmit) — HIGH (well-established, not version-sensitive)

---
*Pitfalls research for: Payload CMS Mongo→Postgres + Cloudinary migration with SEO preservation, self-hosted on Hostinger*
*Researched: 2026-07-09*
