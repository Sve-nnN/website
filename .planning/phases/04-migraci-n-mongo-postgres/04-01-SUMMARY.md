---
phase: 04-migraci-n-mongo-postgres
plan: 01
subsystem: migration-etl-foundation
tags: [migration, mongo, postgres, local-api, url-inventory]
dependency-graph:
  requires: []
  provides: [dump-source, url-inventory, remap-table-lib, richtext-remap-lib]
  affects: [scripts/migrate/steps/*]
tech-stack:
  added: []
  patterns: ["standalone tsx script + relative sibling-project config import", "in-memory kv adapter shim for cross-version payload config", "remap-table JSON persistence"]
key-files:
  created:
    - scripts/migrate/export/dump-source.ts
    - scripts/migrate/data/export/{media,authors,categories,posts,case-studies,testimonials,clientes,works}.json
    - scripts/migrate/lib/types.ts
    - scripts/migrate/lib/remap-table.ts
    - scripts/migrate/lib/richtext-remap.ts
    - .planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json
  modified:
    - .gitignore
decisions:
  - "Dump script patches an in-memory kv adapter onto JuanPortfolio's config object, because that config was sanitized at build time by its own older payload (3.61.1) and lacks the `kv` field our installed payload (3.85) requires on init"
  - "Real execution technique: `cd JuanPortfolio && npx tsx -r dotenv/config <abs-path>/dump-source.ts` — dotenv/config loads JuanPortfolio's own .env (real Mongo DATABASE_URI) from its cwd; TSX_TSCONFIG_PATH alone resolves the @/* aliases but does NOT load the right env vars"
  - "URL-INVENTORY.json derived from dump + source-code sitemap logic instead of live HTTP fetch, because juan-tech.com (Vercel) is DEPLOYMENT_DISABLED (HTTP 402) for every route as of freeze time"
metrics:
  duration: "~45 min"
  completed: 2026-07-10
---

# Phase 4 Plan 01: Migration ETL Foundation Summary

Read-only Local API dump of JuanPortfolio's real Mongo Atlas production data (8 collections), a frozen URL inventory derived from source + dump (live sitemap fetch was impossible), and the shared remap-table/richText-remap library modules that waves 2-8 import unmodified.

## What Was Built

- `scripts/migrate/export/dump-source.ts` — standalone script, imports JuanPortfolio's real `payload.config.ts` via relative path, calls `payload.find({ locale: 'all', limit: 0, depth: 0, draft: true })` against all 8 source collections and writes each to `scripts/migrate/data/export/<collection>.json`.
- `.planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json` — 152 frozen URL entries (76 es + 76 en): static pages, posts (`/blog/{categorySlug}/{slug}`), categories (`/blog/{slug}`), authors (`/authors/{slug}`). Case-studies pattern present but empty (0 real case studies exist).
- `scripts/migrate/lib/types.ts`, `remap-table.ts`, `richtext-remap.ts` — shared contracts for all subsequent waves.

**Real dump counts:** media 15, authors 1, categories 5, posts 73, case-studies 0, testimonials 1, clientes 6, works 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `payload.config.kv` missing crashes `getPayload` init against the older sibling config**
- **Found during:** Task 1, first real dump run
- **Issue:** `getPayload({config})` (our payload 3.85) threw `TypeError: Cannot read properties of undefined (reading 'init')` at `this.config.kv.init(...)`. JuanPortfolio's config was built/sanitized by its own bundled payload 3.61.1, which predates the `kv` config option, so `config.kv` was `undefined` after import.
- **Fix:** After awaiting the imported config, patch in a throwaway in-memory KV adapter (`get/set/delete/has/keys/clear`) matching the shape payload 3.85 expects, only inside our own read-only dump script — never touches JuanPortfolio's actual files.
- **Files modified:** `scripts/migrate/export/dump-source.ts`
- **Commit:** 275e772

**2. [Rule 3 - Blocking issue] `TSX_TSCONFIG_PATH` alone does not load the real Mongo `DATABASE_URI`**
- **Found during:** Task 1
- **Issue:** Running with only `TSX_TSCONFIG_PATH` set resolved the `@/*` import aliases correctly, but `process.env.DATABASE_URI` was whatever was in the invoking shell (unset, or juan-payload's own Postgres string) — JuanPortfolio's scripts always run with `tsx -r dotenv/config` to load their own `.env` from cwd.
- **Fix:** Executed the dump as `(cd JuanPortfolio && npx tsx -r dotenv/config <abs-path-to-dump-source.ts>)` — cwd inside JuanPortfolio both resolves the `@/*` aliases (via tsconfig inheritance) and loads JuanPortfolio's real `.env` via `dotenv/config`.
- **Files modified:** none (execution technique only, documented in the script's header comment)
- **Commit:** 275e772 (comment lives in the committed file)

**3. [Rule 3 - Blocking issue] Live sitemap fetch impossible — juan-tech.com deployment disabled**
- **Found during:** Task 2
- **Issue:** `https://juan-tech.com/sitemap.xml` and every other route on the live site returned HTTP 402 with header `x-vercel-error: DEPLOYMENT_DISABLED`. The plan's Task 2 action assumed a live, reachable site to crawl.
- **Fix:** Derived the identical URL set directly from the real dump (`posts.json`/`categories.json`/`authors.json`/`case-studies.json`) combined with the exact URL-building logic read verbatim from `JuanPortfolio/src/utilities/sitemap.ts` and the `posts-sitemap.xml`/`categories-sitemap.xml`/`authors-sitemap.xml` route handlers (category-slug-prefixed post URLs, `/authors/{slug}`, `/blog/{slug}` for categories, static page list). Functionally equivalent contract; documented inline in `URL-INVENTORY.json`'s `note` field.
- **Files modified:** `.planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json`
- **Commit:** e646c9e

### Notable Findings (not deviations, but affect later waves)

- **4 of 15 media docs have no `cloudinaryUrl`** and their only source (`/api/media/file/...` on juan-tech.com) is unreachable while the deployment stays disabled: `image-post2-2.webp`, `image-hero1-2.webp`, `image-post1-2.webp`, `image-post3-2.webp`. Wave 2 (04-02) will hit fetch failures for these 4 — expected and already handled by the plan's documented "accumulate failed list, don't abort" behavior.
- **`case-studies` and `works` are both empty (0 docs)** in the real production database — confirmed via a direct `payload.find` query against the real Mongo Atlas DB (not just an artifact of the dump), so waves 6 and 7 will have nothing to migrate/audit. This will be re-confirmed and reported explicitly when those waves run.
- **Posts/CaseStudies old schema nests `heroImage`/`content`/`tldr` under a `content` tab-group** (both collections have a Payload tab with `name: 'content'`, which creates data nesting) — e.g. `doc.content.content.{es,en}` for post body, not `doc.content` directly. Waves 5/6 field-mapping code must read from this nested path; noted here so those waves don't need to re-discover it.

## Self-Check: PASSED

- FOUND: scripts/migrate/export/dump-source.ts
- FOUND: scripts/migrate/data/export/media.json (gitignored, verified on disk)
- FOUND: scripts/migrate/data/export/posts.json (gitignored, verified on disk, 73 docs)
- FOUND: scripts/migrate/lib/types.ts
- FOUND: scripts/migrate/lib/remap-table.ts
- FOUND: scripts/migrate/lib/richtext-remap.ts
- FOUND: .planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json (152 entries)
- FOUND commit 275e772 (dump-source.ts + .gitignore)
- FOUND commit e646c9e (URL-INVENTORY.json)
- FOUND commit 5421361 (lib modules)
