---
quick_id: 260813-fix-prod-404-500-routes
description: Fix production 404s (blog listing, case studies, categories) and 500s (all blog post detail pages)
date: 2026-08-13
---

# Quick Task: fix production 404/500 routes on juan-tech.com

## Symptom (reported by Juan)

- Case-study pages 404
- Blog post pages: "Application error: a server-side exception has occurred… Digest: 1751763016"
- `/blog` 404

## Evidence gathered

Crawled all 174 sitemap URLs against production:

| status | count |
|--------|-------|
| 200 | 34 |
| 404 | 10 |
| 500 | 130 |

Plus `/blog` and `/en/blog` (not in sitemap) → 404.

Direct DB inspection (via Neon's HTTP SQL endpoint — TCP 5432 is unreachable
from this machine, see Notes):

- `pages`: 8 published, 4 draft (`blog`, `contact`, `privacy`, `terms`)
- `case_studies`: 1 published, 6 draft
- `posts`: 66 published, 6 draft

Production API probes that isolated the 500:

- `GET /api/categories?limit=1` → `{"errors":[{"message":"Something went wrong."}]}`
- `GET /api/posts?limit=1&depth=0` → 200
- `GET /api/posts?limit=1&depth=1` → error
- `/blog/tablas-hash` (the only published post with **zero** categories) → 200

## Root causes

**RC-1 — every blog post 500s.** `Categories` used `read: authenticatedOrPublished`,
which returns the query constraint `{ _status: { equals: 'published' } }` for
anonymous readers. `Categories` has no `versions.drafts`, so there is no
`_status` column and Payload throws on every unauthenticated read. Invisible
until Phase 43 switched the frontend to `overrideAccess: false`: from then on,
populating a post's `categories` relation at depth ≥ 1 threw → 500 on every
post detail page (and on `/api/categories`).

**RC-2 — `/blog` and 6 of 7 case studies 404.** Those docs are stuck at
`_status: 'draft'` because seed/humanize scripts called `payload.update()`
without `draft: false`. Same Phase 43 `overrideAccess: false` switch made the
draft state user-visible. `/contact`, `/privacy`, `/terms` are also drafts —
their routes still render (they read with the default `overrideAccess: true`)
but they are excluded from `sitemap.xml`.

**RC-3 — 10 × 404 from our own sitemap.** `sitemap-data.ts` emitted
`/categories/<slug>` for both locales, but no `[locale]/categories` route
exists in the app.

**RC-4 (found while verifying) — silently dropped article content.**
`RichTextRenderer` used `defaultJSXConverters`, which has no `blocks`
converter. Migrated post bodies contain `code-block` (87) and `faq` (10) block
nodes, so 29 post/locale documents rendered those sections as nothing.

## Tasks

1. `Categories.access.read` → `() => true` (public taxonomy, no drafts). Fixes RC-1.
2. Drop `categories` from `SITEMAP_COLLECTIONS` + add 301 redirects
   `/categories/:slug` → `/blog?category=:slug` in `next.config.mjs`. Fixes RC-3.
3. Add `code-block` / `faq` JSX converters and wire them into
   `RichTextRenderer`. Fixes RC-4.
4. `scripts/publish-draft-content.ts` — generalises `publish-blog-page.ts` to
   publish the draft `pages` + `case-studies` (re-saves the same content with
   `draft: false`, never writes new copy). Fixes RC-2. **Requires DB access.**

## Notes

TCP 5432 to the Neon endpoint times out from this machine (TLS handshake reset;
`openssl s_client -starttls postgres` also fails), while Neon's HTTPS SQL
endpoint works and production is fine — so it is a local network/allowlist
issue, not a DB outage. Task 4 therefore cannot run from here; it must run on
the server (or from a network that can reach 5432).
