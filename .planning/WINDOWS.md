---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-07-31T22:56:05.631Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 41 | unrun-verify | src/app/(frontend)/[locale]/page.tsx |  | 41-01 tracer <verify> (curl HTML og:image meta tags on live dev server, 5 checks) could not be run end-to-end: session-wide Neon Postgres ECONNRESET blocked all Postgres-backed routes (confirmed via raw pg Client test independent of this plan's code, ~85 resets over 40+ retries). The ported Cloudinary transform mechanism itself (getCloudinaryOgWithTitle) WAS independently curl-verified live (HTTP 200, correct visual render, comma-title double-encoding confirmed) -- only the DB-dependent HTML-rendering half of verification is unrun. Recommend Juan re-run: npm run dev && curl -s http://localhost:3000/ \| grep og:image | open |  | 2026-07-31T22:42:43.169Z |  |
| 2 | 41 | unrun-verify | src/app/(frontend)/[locale]/contact/page.tsx |  | 41-02 <verify> (curl og:image on live dev server for contact/privacy/terms/seo-tecnico-lima/seo-tecnico-madrid/blog, both locales) could not be run end-to-end: same session-wide Neon Postgres ECONNRESET as WINDOWS id 1, confirmed again for this plan (2 fresh dev-server attempts, both timed out at 25-30s on the middleware redirects-lookup DB call). Static verification complete: tsc --noEmit clean, all 6 grep acceptance criteria pass (buildOpenGraph call + correct slug per route). Recommend Juan re-run once Neon connectivity is stable: npm run dev && for p in contact privacy terms seo-tecnico-lima seo-tecnico-madrid blog; do curl -s http://localhost:3000/$p \| grep og:image; done | open |  | 2026-07-31T22:56:05.631Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "41",
    "file": "src/app/(frontend)/[locale]/page.tsx",
    "line": null,
    "description": "41-01 tracer <verify> (curl HTML og:image meta tags on live dev server, 5 checks) could not be run end-to-end: session-wide Neon Postgres ECONNRESET blocked all Postgres-backed routes (confirmed via raw pg Client test independent of this plan's code, ~85 resets over 40+ retries). The ported Cloudinary transform mechanism itself (getCloudinaryOgWithTitle) WAS independently curl-verified live (HTTP 200, correct visual render, comma-title double-encoding confirmed) -- only the DB-dependent HTML-rendering half of verification is unrun. Recommend Juan re-run: npm run dev && curl -s http://localhost:3000/ | grep og:image",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-31T22:42:43.169Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "41",
    "file": "src/app/(frontend)/[locale]/contact/page.tsx",
    "line": null,
    "description": "41-02 <verify> (curl og:image on live dev server for contact/privacy/terms/seo-tecnico-lima/seo-tecnico-madrid/blog, both locales) could not be run end-to-end: same session-wide Neon Postgres ECONNRESET as WINDOWS id 1, confirmed again for this plan (2 fresh dev-server attempts, both timed out at 25-30s on the middleware redirects-lookup DB call). Static verification complete: tsc --noEmit clean, all 6 grep acceptance criteria pass (buildOpenGraph call + correct slug per route). Recommend Juan re-run once Neon connectivity is stable: npm run dev && for p in contact privacy terms seo-tecnico-lima seo-tecnico-madrid blog; do curl -s http://localhost:3000/$p | grep og:image; done",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-31T22:56:05.631Z",
    "resolved_at": null
  }
]
````
