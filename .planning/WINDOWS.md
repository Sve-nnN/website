---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-07-31T22:42:43.169Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 41 | unrun-verify | src/app/(frontend)/[locale]/page.tsx |  | 41-01 tracer <verify> (curl HTML og:image meta tags on live dev server, 5 checks) could not be run end-to-end: session-wide Neon Postgres ECONNRESET blocked all Postgres-backed routes (confirmed via raw pg Client test independent of this plan's code, ~85 resets over 40+ retries). The ported Cloudinary transform mechanism itself (getCloudinaryOgWithTitle) WAS independently curl-verified live (HTTP 200, correct visual render, comma-title double-encoding confirmed) -- only the DB-dependent HTML-rendering half of verification is unrun. Recommend Juan re-run: npm run dev && curl -s http://localhost:3000/ \| grep og:image | open |  | 2026-07-31T22:42:43.169Z |  |

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
  }
]
````
