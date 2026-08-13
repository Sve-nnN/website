---
quick_id: 260813-fix-prod-404-500-routes
status: incomplete
date: 2026-08-13
---

# Summary — fix production 404/500 routes

## Done (committed, needs deploy)

| Commit | Fix |
|--------|-----|
| `0ea14e2` | `Categories.access.read` → `() => true`. Root cause of the 500 on all 130 `/blog/<slug>` URLs and on `GET /api/categories`. |
| `594f851` | Removed `categories` from `SITEMAP_COLLECTIONS`; added 301s `/categories/:slug` → `/blog?category=:slug` (both locales). Removes 10 self-inflicted 404s from `sitemap.xml`. |
| `342207f` | `code-block` / `faq` JSX converters wired into `RichTextRenderer`. 87 code samples + 10 FAQ sections across 29 post/locale docs were rendering as nothing. |
| `f6f82e3` | `scripts/publish-draft-content.ts` + diagnostics (`neon-sql.mjs`, `diagnose-publish-status.ts`, `repro-richtext-render.tsx`). |

Verification run locally: `tsc --noEmit` clean, `npm run build` succeeds,
`repro-richtext-render.tsx` → 124/124 post bodies render, 29/29 block-bearing
docs now emit their blocks.

## Not done — blocked on DB access

The `/blog` 404 and the six 404ing case studies are a **data** problem, not a
code one: those docs sit at `_status: 'draft'`. The fix is
`scripts/publish-draft-content.ts`, which cannot run from this machine — TCP
5432 to the Neon endpoint times out here (TLS handshake reset; `openssl
s_client -starttls postgres` fails too) while Neon's HTTPS SQL endpoint and
production both work, so it is a local network/IP-allowlist issue rather than a
DB outage.

Run on the server (or any network that can reach 5432):

```bash
node --env-file=.env node_modules/.bin/tsx scripts/publish-draft-content.ts
```

It publishes, per locale: `pages` → `blog`, `contact`, `privacy`, `terms`;
`case-studies` → the 6 drafts. Equivalent manual path: open each doc in
`/admin` and press Publish.

Draft posts (`nextjs-portfolio`, `nextjs-server-components`, `payloadcms-seo`,
`payloadcms-tutorial`, `payloadcms-vs-strapi`, `typescript-best-practices`) are
deliberately left as drafts — unlinked seed fixtures. `--include-posts`
publishes them too.

## Production state at the time of the sweep

174 sitemap URLs crawled: 34 × 200, 10 × 404, 130 × 500. Plus `/blog` and
`/en/blog` → 404 (not in the sitemap because the doc is a draft).
