# Project Research Summary

**Project:** Juan Carlos Angulo — Portfolio (Payload rebuild)
**Domain:** Payload CMS 3.x + Next.js 15 bilingual portfolio/personal-brand site — greenfield platform migration (MongoDB → self-hosted PostgreSQL, Vercel Blob → Cloudinary), self-hosted on Hostinger Node.js
**Researched:** 2026-07-09
**Confidence:** HIGH

## Executive Summary

This is a platform migration disguised as a rebuild: same content, same pages, same bilingual (EN/ES) scope as the live `JuanPortfolio` site, but on a clean Payload 3.85 + Next.js 15 stack with PostgreSQL instead of MongoDB, Cloudinary instead of Vercel Blob, and self-hosted on Hostinger instead of Vercel. Experts building this kind of site (verified against two real production codebases, apturio and aprendoclub, plus six competitor portfolio sites) converge on a consistent pattern: a single Node process running Payload in-process inside Next.js's App Router, content rendered via Payload's Local API (no HTTP round-trip), Postgres schema owned exclusively by committed migrations (`push: false`), and a page-builder of ~12-14 consolidated blocks instead of the ~35 near-duplicate blocks the current site has accumulated. Feature research reinforces the PROJECT.md instinct: the highest-leverage credibility feature for an engineer/SEO-expert portfolio is structured case studies with a headline metric (problem → approach → metric → stack), not testimonials or funnels — and the site should actively resist re-adding the internal SEO-tooling clutter (GSC dashboards, keyword trackers, broken-link checkers) that this rebuild exists to eliminate.

The recommended stack is unambiguous on its core (Payload 3.85.x, Next 15.5.x, React 19.2.x, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, all in HIGH confidence, verified live against npm) but carries one real open question: Cloudinary has no official Payload storage adapter. Dedicated plugin research resolved this from "investigate" to "two credible, correctly-versioned community candidates" — `payload-storage-cloudinary` (nlvcodes) and `@jhb.software/payload-cloudinary-plugin` — both targeting Payload 3.x correctly, neither battle-tested at scale, with a documented custom-adapter fallback (~100-150 lines, following the official S3/R2 adapter shape) if both fail a spike. This is the single item that must be resolved with a time-boxed spike before committing to the Media phase, not assumed.

The dominant risk category, per pitfalls research, is not technical build risk but **migration/cutover risk**: because this is a live, ranking site, URL/slug drift, missing 301 redirects, `push: true` corrupting the production schema, Mongo→Postgres shape mismatches (arrays/blocks/localized fields decompose relationally and must go through the target Payload Local API, never raw SQL), and staging `noindex` leaking to production are all HIGH-severity, well-documented failure modes with real recovery cost (weeks of lost rankings in the worst case). These are prevention-cheap, recovery-expensive — the roadmap should treat "URL parity + redirect map + cutover checklist" as first-class deliverables, not afterthoughts, and should sequence a Postgres-schema-discipline foundation (`push:false`, migrations-at-deploy) before any content migration work begins.

## Key Findings

### Recommended Stack

Core stack: `payload` 3.85.x, `next` 15.5.x (hold off Next 16 until Payload publishes explicit support), `react`/`react-dom` 19.2.x, `@payloadcms/db-postgres` (Drizzle-based, `push:false` in prod), `@payloadcms/richtext-lexical` (not the legacy Slate editor). Supporting: `next-intl` for `[locale]` routing layered on top of Payload's own field-level `localized: true` (the two are complementary, not competing — confirmed across both reference codebases). `@payloadcms/email-resend` + `resend` SDK for the contact form. `@payloadcms/plugin-seo`, `@payloadcms/plugin-redirects` official plugins. Media storage: no official Cloudinary adapter exists — use `payload-storage-cloudinary` or `@jhb.software/payload-cloudinary-plugin` (spike both, pick one; custom-adapter fallback documented). One hard version pin: `graphql@^16` (Payload's peer dependency; npm `latest` is 17.x and will silently break the GraphQL layer if auto-installed).

**Core technologies:**
- `payload` 3.85.x + `@payloadcms/next` — CMS running in-process inside Next.js App Router, single deploy/process fit for self-hosted Hostinger Node
- `@payloadcms/db-postgres` — Drizzle-based Postgres adapter; migrations committed, never live-pushed in prod
- `next-intl` + Payload `localization` — dual-layer bilingual EN/ES (routing/UI strings vs. content fields)
- `payload-storage-cloudinary` / `@jhb.software/payload-cloudinary-plugin` — community Cloudinary storage adapters (MEDIUM confidence, spike before committing)
- `@payloadcms/email-resend` — direct port from existing site, no changes needed

### Expected Features

Competitor analysis (6 sites: Luca Tagliaferro, Aleyda Solis, Kevin Indig, Lee Robinson, Josh Comeau, swyx.io) converges on a clear pattern for engineer/SEO-expert portfolios: metric-first case studies beat testimonials, structured attribution beats anonymous quotes, and minimalism (Lee Robinson benchmark) reads as competence, not laziness — directly validating Juan's "no clutter" backend goal as a feature, not just an implementation preference.

**Must have (table stakes):**
- Author bio + credentials rendered on every post/case-study byline (E-E-A-T)
- Case studies with quantified headline metrics, not just freeform rich text
- Blog with category taxonomy + featured/popular surfacing (not flat reverse-chronological)
- Clean meta/OG/canonical (plugin-seo), sitemap.xml, robots.txt — already scoped
- Structured testimonials (name/role/company), not anonymous quotes
- Bilingual EN/ES parity across every content type

**Should have (competitive differentiators):**
- Case study structure: problem → approach → metric → stack (structured fields, not rich text blob)
- JSON-LD schema markup (Person/Article/BreadcrumbList) — hand-written, no plugin exists for this
- `llms.txt`/`llms-full.txt` for GEO/AI discoverability — genuine differentiator, none of the 6 competitor sites do this yet
- Credentials/press-mention strip near hero (only if real mentions exist — don't fabricate)

**Defer (v2+):**
- Dedicated Speaking/media page (needs 5+ real engagements to justify)
- Newsletter (needs sustained content cadence first)
- Multiple concurrent lead-gen funnels (anti-pattern — one CTA: contact form)

### Architecture Approach

Single Next.js 15 standalone Node process hosting Payload in-process (admin + public frontend + API share one deploy). Public RSC pages call Payload's Local API directly — no HTTP round-trip. Postgres schema is owned exclusively by committed migrations (`push:false` always in prod). Media storage is env-var-gated (Cloudinary plugin only registers when credentials are present, falling back to local disk in dev). The one-time Mongo→Postgres migration runs as a standalone offline script (never an app route), using Payload's Local API on both the old Mongo config (read-only, unmodified) and the new Postgres config, so Payload itself handles the relational decomposition of arrays/blocks/localized fields.

**Major components:**
1. Next.js App Router (`[locale]/...` public routes + `(payload)/admin`) — single process, single deploy
2. Payload Core Config — collections (Pages, Posts, Authors, CaseStudies, Categories, Media, Testimonials, Works, Users), consolidated block library (~12-14 blocks replacing ~35 near-duplicates), official plugins only (seo, redirects, search-deferred)
3. Postgres Adapter (Drizzle, `push:false`) — schema owned by generated migrations, applied at deploy time
4. Migration Script (offline, outside `app/`) — dual Payload Local API instances (Mongo source, Postgres target), dependency-ordered writes, ID remapping, media re-upload to Cloudinary

### Critical Pitfalls

1. **URL/slug drift breaks existing rankings** — migration scripts regenerating slugs from titles instead of copying verbatim; treat the live URL inventory as a frozen contract, diff the new sitemap against it before cutover.
2. **`push: true` leaking into production Postgres** — single most destructive footgun; set `push:false` from day one, all schema changes via committed migrations applied at deploy (`payload migrate` in the build command).
3. **Mongo→Postgres shape mismatch** — arrays/blocks/localized fields must migrate through the target Payload Local API (never raw SQL), in dependency order (Media → Authors/Categories → Posts/CaseStudies), with an old-ObjectId → new-ID remap table.
4. **Media is a re-upload, not a URL copy** — Vercel Blob URLs must be re-uploaded to Cloudinary and rewritten everywhere, including inside rich-text/blocks, not just the Media collection's URL field; verify the Cloudinary adapter choice in a dedicated spike before this phase.
5. **Staging `noindex`/robots leaking to production** — gate all indexing-blockers on an explicit env var, verify with a live fetch of the production URL post-deploy, not a code read.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Postgres/Schema Foundation + Clean Collection Scaffold
**Rationale:** Everything downstream (migration, content, media) depends on a stable, disciplined Postgres schema. Setting `push:false` and the migration workflow from day one prevents Pitfall 2 (the single most destructive footgun) before any real data exists.
**Delivers:** `payload.config.ts` with the lean KEEP-list collections (Pages, Posts, Authors, CaseStudies, Categories, Media, Testimonials, Works/Clientes, Users) wired to `@payloadcms/db-postgres`, `push:false`, migration tooling (`payload migrate:create`/`migrate`), consolidated ~12-14 block library replacing the current ~35 blocks.
**Addresses:** Sets up structured case-study fields and testimonial attribution fields per FEATURES.md table stakes.
**Avoids:** Pitfall 3 (`push:true` leak), Anti-Pattern 1 (porting SEO-tooling collections "just in case"), Anti-Pattern 2 (one block per grid variation).

### Phase 2: Bilingual Content Layer + SEO Plugin
**Rationale:** next-intl routing and Payload localization must be decided and wired before content migration, since the migration script preserves the live site's exact locale-prefix behavior — retrofitting i18n after migration risks re-mapping every migrated document.
**Delivers:** `[locale]` routing, Payload field localization (`es` default locale matching current site), `@payloadcms/plugin-seo` tabbed on Pages/Posts/CaseStudies, `app/sitemap.ts`/`app/robots.ts` (no official plugin exists — hand-built per Payload's documented pattern), `llms.txt`/`llms-full.txt` global + route.
**Uses:** `next-intl`, `@payloadcms/plugin-seo`, `@payloadcms/plugin-redirects` (with a middleware/route handler that actually executes redirects — the plugin only manages the collection).
**Implements:** Frontend RSC ↔ Payload Local API pattern (in-process, no HTTP round-trip).

### Phase 3: Cloudinary Media Spike + Storage Wiring
**Rationale:** The one open architectural question (no official Cloudinary adapter) must be resolved with a hands-on spike before it blocks migration — this is explicitly flagged across STACK.md, ARCHITECTURE.md, PITFALLS.md, and PLUGINS.md as a dedicated risk item, not a drop-in dependency.
**Delivers:** Chosen and validated Cloudinary storage adapter (`payload-storage-cloudinary` or `@jhb.software/payload-cloudinary-plugin`, spiked against a real Cloudinary account for `handleUpload`/`handleDelete`/`generateURL` + `next/image` compatibility), env-var-gated plugin registration, custom-adapter fallback documented if both community packages fail.
**Addresses:** Table-stakes fast page loads / Core Web Vitals requirement (Cloudinary `f_auto,q_auto` transformations).
**Avoids:** Pitfall 5 (media re-upload vs. URL copy) — must be resolved architecturally before the migration script can be written correctly.

### Phase 4: Mongo → Postgres Migration Script (URL Inventory, ETL, Media Re-upload)
**Rationale:** Depends on Phases 1-3 being stable (schema, i18n, storage all decided) since the migration writes through the target Payload Local API and must produce data that already conforms to the final schema shape.
**Delivers:** Frozen live-URL inventory (crawled from current sitemap/GSC), standalone offline ETL script (dependency-ordered: Media → Authors/Categories → Posts/CaseStudies/Testimonials/Works), old-ObjectId → new-ID remap table, media binaries re-uploaded to Cloudinary with rewritten URLs (including inside rich text/blocks), redirect map for any intentionally-changed URLs.
**Addresses:** Content parity requirement (réplica 1:1) from PROJECT.md.
**Avoids:** Pitfall 1 (URL/slug drift), Pitfall 4 (shape mismatch), Pitfall 5 (media re-upload).

### Phase 5: Frontend Pages + Feature Differentiators
**Rationale:** Once content exists in Postgres and renders through the block library, layer in the competitive differentiators identified in FEATURES.md — these are additive to already-migrated content, not blocking dependencies for it.
**Delivers:** All public pages (home, blog, case studies, authors, contact, privacy, terms, search — via `@payloadcms/plugin-search`), structured case-study display (problem/approach/metric/stack), JSON-LD schema (Person/Article/BreadcrumbList, hand-written), featured/popular content surfacing, GA4 + Search Console (external, zero Payload footprint).
**Addresses:** FEATURES.md differentiators (P2 priority items).
**Implements:** Consolidated `ArchiveBlock`/`FeaturedGrid` pattern, `ContactFormBlock` + Resend server action.

### Phase 6: Deployment + Cutover
**Rationale:** Deployment mechanics (standalone asset copying, PM2/Nginx, connection pooling) and the cutover runbook (content freeze, redirect verification, robots/noindex check) are operationally distinct from build work and carry their own HIGH-severity pitfalls that must be checklist-gated, not assumed.
**Delivers:** Hostinger Node deploy (`payload migrate && next build` + `postbuild` static-asset copy), PM2 process management, Postgres pool sizing verified against Hostinger's plan limits, go-live checklist (301s live-verified, robots.txt/noindex fetched from production, both locales sampled, sitemap diffed against frozen inventory).
**Avoids:** Pitfall 6 (noindex leak), Pitfall 7 (connection-pool exhaustion), Pitfall 8 (standalone missing assets), Pitfall 9 (cutover content loss — requires a content freeze on the live site immediately before final migration run).

### Phase Ordering Rationale

- Schema/foundation must precede content migration because Postgres enforces real schema (unlike Mongo) — get the discipline (`push:false`, migrations) right before there's data to lose.
- i18n/localization decisions must precede migration because the migration script needs to know the exact locale shape to write into.
- The Cloudinary spike is deliberately isolated as its own phase (not folded into general Media collection setup) because it is the one MEDIUM-confidence, unresolved architectural item flagged consistently across all four other research docs.
- Migration is sequenced after storage/schema/i18n are settled because it's the highest-risk, hardest-to-reverse phase (Pitfall 4) — it should touch a stable target, not a moving one.
- Frontend differentiators come after core content exists because they're additive polish, not blocking dependencies.
- Deployment/cutover is last and treated as an operational runbook with its own checklist, not "ship whenever the code compiles" — several pitfalls (noindex leak, cutover content loss) are pure process failures, not code bugs.

### Research Flags

Needs research during planning:
- **Phase 3 (Cloudinary spike)** — MEDIUM confidence on both community adapter candidates; needs hands-on validation against Payload 3.85 and a real Cloudinary account before the phase can be considered planned, not just researched.
- **Phase 4 (migration ETL)** — Mongo→Postgres shape mismatch is the highest technical risk in the whole project; needs a detailed field-by-field mapping spec (old block types → consolidated new blocks, relationship remapping) during phase planning, not just high-level ETL logic.
- **Phase 6 (Hostinger deployment specifics)** — process-management pattern (PM2 vs. Hostinger's own Node panel supervisor) and actual Postgres `max_connections` are MEDIUM confidence, verified via community guides, not official docs — confirm against the actually-provisioned Hostinger product tier before finalizing.

Phases with standard, well-documented patterns (skip deep research-phase):
- **Phase 1 (schema foundation)** — verified against two real production codebases (apturio, aprendoclub); `push:false` + migration workflow is Payload's own documented standard practice.
- **Phase 2 (i18n + SEO plugin)** — `next-intl` + Payload localization combination is a confirmed, working pattern in the apturio reference codebase; `plugin-seo` is official and stable.
- **Phase 5 (frontend pages)** — standard Next.js App Router + Local API rendering, no novel integration risk.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core Payload/Next/Postgres versions verified live against npm registry 2026-07-09; only the Cloudinary adapter carries MEDIUM confidence (stale peer-dependency metadata on the strongest-download-count package) |
| Features | MEDIUM | WebFetch on 6 live competitor sites (MEDIUM-HIGH per-site), one competitor (Eli Schwartz) via WebSearch only (LOW-MEDIUM); no official/Context7 docs applicable to this domain by nature |
| Architecture | HIGH | Patterns verified against two real production codebases (apturio, aprendoclub) plus the actual source-of-truth JuanPortfolio codebase; Hostinger process-management specifics are MEDIUM (community guides, not official) |
| Pitfalls | HIGH | Migration/schema pitfalls verified against official Payload docs + GitHub migration discussions + both reference codebases; Cloudinary-adapter and Hostinger-runtime specifics are MEDIUM, explicitly flagged for re-verification at build time |

**Overall confidence:** HIGH

### Gaps to Address

- **Cloudinary adapter final choice**: not resolved by research alone — requires a time-boxed hands-on spike (Phase 3) comparing `payload-storage-cloudinary` and `@jhb.software/payload-cloudinary-plugin` against a real Cloudinary account before committing.
- **Hostinger process-management/provisioned-tier confirmation**: whether the actual Hostinger product (VPS/Cloud "Node.js Web App" panel vs. manual PM2+Nginx) is confirmed needs to happen before the deployment phase is planned in detail — flagged MEDIUM in both ARCHITECTURE.md and PITFALLS.md.
- **Postgres `max_connections` on the actual provisioned Hostinger plan**: must be verified directly (not assumed from apturio's Neon-pooler numbers) before finalizing connection pool `max` sizing.
- **Works vs. Clientes collection split**: PROJECT.md refers to "Works/Clientes" as one concept but the current site has both as separate collections; ARCHITECTURE.md recommends keeping them distinct (mirroring aprendoclub's `ClientesTrabajados`/`TeamMembers` split) but flags this needs a Phase 1 content-audit decision, not a purely architectural one.
- **`@payloadcms/plugin-search` timing**: PLUGINS.md recommends it as the correct low-maintenance way to build the required search page, but defers wiring it until the search-page implementation phase rather than the initial schema phase — roadmap should reflect this explicit deferral, not treat it as a Phase 1 install.

## Sources

### Primary (HIGH confidence)
- npm registry (`registry.npmjs.org`, live query 2026-07-09) — all core `@payloadcms/*`, `next`, `react`, `next-intl`, `resend` versions
- Payload official docs — [Migrations](https://payloadcms.com/docs/database/migrations), [Postgres adapter](https://payloadcms.com/docs/database/postgres), [Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters), [Redirects Plugin](https://payloadcms.com/docs/plugins/redirects), [Search Plugin](https://payloadcms.com/docs/plugins/search), [Email adapters guide](https://payloadcms.com/posts/guides/how-to-set-up-email-adapters-in-payload), [Sitemap guide](https://payloadcms.com/posts/guides/how-to-build-an-seo-friendly-sitemap-in-payload--nextjs)
- Reference production codebases: `/Users/juan/Documents/Codigo/Arianna/apturio/website`, `/Users/juan/Documents/Codigo/Arianna/aprendoclub/aprendoclub`
- Source-of-truth codebase: `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio`
- `.planning/PROJECT.md` — scope, constraints, requirements

### Secondary (MEDIUM confidence)
- [Payload Discussion #9711 — Migrating from MongoDB to Postgresql](https://github.com/payloadcms/payload/discussions/9711) and [#625](https://github.com/payloadcms/payload/discussions/625)
- Community Cloudinary adapter packages: [payload-storage-cloudinary](https://www.npmjs.com/package/payload-storage-cloudinary), [@jhb.software/payload-cloudinary-plugin](https://www.npmjs.com/package/@jhb.software/payload-cloudinary-plugin) — npm registry + GitHub star/activity verification
- Hostinger deployment community guides — [Deploy Next.js on Hostinger VPS](https://medium.com/@muhammadrokon/how-to-deploy-your-next-js-app-on-hostinger-vps-quick-tips-f109d39680ba), [official Hostinger Node.js support doc](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- Competitor site WebFetch analysis: lucatagliaferro.com, aleydasolis.com, kevin-indig.com, leerob.com, joshwcomeau.com, swyx.io

### Tertiary (LOW confidence)
- Eli Schwartz (elischwartz.co / productledseo.com) — WebSearch only, not independently WebFetched
- General SEO-portfolio pattern round-ups (jaysearch.com, sitebuilderreport.com, shipixen.com) — secondary WebSearch sources, used only for corroboration

---
*Research completed: 2026-07-09*
*Ready for roadmap: yes*
