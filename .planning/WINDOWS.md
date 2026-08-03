---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 4
total_count: 7
last_updated: 2026-08-03T01:39:35.297Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 41 | unrun-verify | src/app/(frontend)/[locale]/page.tsx |  | 41-01 tracer <verify> (curl HTML og:image meta tags on live dev server, 5 checks) could not be run end-to-end: session-wide Neon Postgres ECONNRESET blocked all Postgres-backed routes (confirmed via raw pg Client test independent of this plan's code, ~85 resets over 40+ retries). The ported Cloudinary transform mechanism itself (getCloudinaryOgWithTitle) WAS independently curl-verified live (HTTP 200, correct visual render, comma-title double-encoding confirmed) -- only the DB-dependent HTML-rendering half of verification is unrun. Recommend Juan re-run: npm run dev && curl -s http://localhost:3000/ \| grep og:image | fixed |  | 2026-07-31T22:42:43.169Z | 2026-08-01T15:13:21.959Z |
| 2 | 41 | unrun-verify | src/app/(frontend)/[locale]/contact/page.tsx |  | 41-02 <verify> (curl og:image on live dev server for contact/privacy/terms/seo-tecnico-lima/seo-tecnico-madrid/blog, both locales) could not be run end-to-end: same session-wide Neon Postgres ECONNRESET as WINDOWS id 1, confirmed again for this plan (2 fresh dev-server attempts, both timed out at 25-30s on the middleware redirects-lookup DB call). Static verification complete: tsc --noEmit clean, all 6 grep acceptance criteria pass (buildOpenGraph call + correct slug per route). Recommend Juan re-run once Neon connectivity is stable: npm run dev && for p in contact privacy terms seo-tecnico-lima seo-tecnico-madrid blog; do curl -s http://localhost:3000/$p \| grep og:image; done | fixed |  | 2026-07-31T22:56:05.631Z | 2026-08-01T15:13:22.043Z |
| 3 | 41 | unrun-verify | src/app/(frontend)/[locale]/case-studies/page.tsx |  | 41-03 <verify> (curl og:image on live dev server for services/servicios (4 combos), authors/[slug], websites/[slug], case-studies/authors/websites/search listings) could not be run end-to-end: same session-wide Neon Postgres ECONNRESET as WINDOWS id 1/2, re-confirmed a third time (npm run dev, ECONNRESET on middleware redirects-lookup DB call within ~10s). Static verification complete: tsc --noEmit clean, all 10 grep acceptance criteria pass (buildOpenGraph call + correct slug/url per route). Sitewide grep confirms all ~19 public generateMetadata functions across 41-01/41-02/41-03 now call buildOpenGraph, zero missed. Recommend Juan re-run once Neon connectivity is stable: npm run dev && curl -s http://localhost:3000/servicios \| grep og:image (repeat for other 9 routes per plan verify block) | fixed |  | 2026-07-31T23:04:50.676Z | 2026-08-01T15:13:22.122Z |
| 4 | 42 | unrun-verify | src/app/(frontend)/[locale]/blog/[slug]/page.tsx |  | 42-03 Task 3 live-curl sweep (canonical across all route types + favicon/manifest/theme-color regression check) could not be run end-to-end: same session-wide Neon Postgres connectivity blocker as WINDOWS ids 1-3 recurred despite being marked fixed -- npm run dev hung on the middleware /api/redirects-lookup DB call for 15s+ with no response (SSL-mode deprecation warning logged, no crash). Static verification complete instead: tsc --noEmit clean, all 6 grep buildAlternates( acceptance criteria pass, sitewide comm -23 gap-check shows zero unexpected gaps (only the 4 expected Servicios/Services files), and static grep confirms Plan 42-01's manifest/themeColor still present in layout.tsx. Recommend Juan re-run once Neon connectivity is stable: npm run dev && curl -s http://localhost:3000/seo-tecnico-lima \| grep canonical (repeat per Task 3 verify block). | fixed |  | 2026-08-01T15:48:35.727Z | 2026-08-01T21:53:51.219Z |
| 5 | 42 | unmet-truth | .env |  | Home meta.description update confirmed written+published via Local API self-verify (payload.find overrideAccess:false, same read path as unauthenticated REST) on 2026-08-02, but production (https://juan-tech.com, Dokploy) still serves the OLD description with zero HTTP caching involved (cache-control: no-store, cache-bust query param has no effect). This means Juan's local .env DATABASE_URI and Dokploy's production DATABASE_URI likely point to DIFFERENT Neon databases/branches, contradicting CLAUDE.md's stated assumption of a single shared production DB. Needs Juan to compare the two connection strings in Dokploy env panel vs local .env. Until resolved, any Local-API script run locally may NOT be affecting what juan-tech.com actually serves -- Phase 41/42's earlier og:image/canonical fixes only worked because they are CODE changes (read fresh per request regardless of which DB), not content writes. | open |  | 2026-08-02T16:24:04.304Z |  |
| 6 | 43 | unrun-verify | .planning/phases/43-performance-response-time-html-size/43-01-SUMMARY.md |  | Live before/after Home response-time + HTML-size measurement (npm run start + curl timing/wc -c) blocked by intermittent local Neon ECONNRESET — deferred to production confirmation post-deploy | open |  | 2026-08-03T01:24:20.043Z |  |
| 7 | 43 | unrun-verify | .planning/phases/43-performance-response-time-html-size/43-02-SUMMARY.md |  | Live before/after Servicios+Blog listing response-time/HTML-size measurement (npm run start / node .next/standalone/server.js + curl timing) blocked by same session-wide intermittent local Neon ECONNRESET as WINDOWS id 6 — deferred to production confirmation post-deploy | open |  | 2026-08-03T01:39:35.297Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "41",
    "file": "src/app/(frontend)/[locale]/page.tsx",
    "line": null,
    "description": "41-01 tracer <verify> (curl HTML og:image meta tags on live dev server, 5 checks) could not be run end-to-end: session-wide Neon Postgres ECONNRESET blocked all Postgres-backed routes (confirmed via raw pg Client test independent of this plan's code, ~85 resets over 40+ retries). The ported Cloudinary transform mechanism itself (getCloudinaryOgWithTitle) WAS independently curl-verified live (HTTP 200, correct visual render, comma-title double-encoding confirmed) -- only the DB-dependent HTML-rendering half of verification is unrun. Recommend Juan re-run: npm run dev && curl -s http://localhost:3000/ | grep og:image",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-31T22:42:43.169Z",
    "resolved_at": "2026-08-01T15:13:21.959Z"
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "41",
    "file": "src/app/(frontend)/[locale]/contact/page.tsx",
    "line": null,
    "description": "41-02 <verify> (curl og:image on live dev server for contact/privacy/terms/seo-tecnico-lima/seo-tecnico-madrid/blog, both locales) could not be run end-to-end: same session-wide Neon Postgres ECONNRESET as WINDOWS id 1, confirmed again for this plan (2 fresh dev-server attempts, both timed out at 25-30s on the middleware redirects-lookup DB call). Static verification complete: tsc --noEmit clean, all 6 grep acceptance criteria pass (buildOpenGraph call + correct slug per route). Recommend Juan re-run once Neon connectivity is stable: npm run dev && for p in contact privacy terms seo-tecnico-lima seo-tecnico-madrid blog; do curl -s http://localhost:3000/$p | grep og:image; done",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-31T22:56:05.631Z",
    "resolved_at": "2026-08-01T15:13:22.043Z"
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "41",
    "file": "src/app/(frontend)/[locale]/case-studies/page.tsx",
    "line": null,
    "description": "41-03 <verify> (curl og:image on live dev server for services/servicios (4 combos), authors/[slug], websites/[slug], case-studies/authors/websites/search listings) could not be run end-to-end: same session-wide Neon Postgres ECONNRESET as WINDOWS id 1/2, re-confirmed a third time (npm run dev, ECONNRESET on middleware redirects-lookup DB call within ~10s). Static verification complete: tsc --noEmit clean, all 10 grep acceptance criteria pass (buildOpenGraph call + correct slug/url per route). Sitewide grep confirms all ~19 public generateMetadata functions across 41-01/41-02/41-03 now call buildOpenGraph, zero missed. Recommend Juan re-run once Neon connectivity is stable: npm run dev && curl -s http://localhost:3000/servicios | grep og:image (repeat for other 9 routes per plan verify block)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-31T23:04:50.676Z",
    "resolved_at": "2026-08-01T15:13:22.122Z"
  },
  {
    "id": 4,
    "kind": "unrun-verify",
    "phase": "42",
    "file": "src/app/(frontend)/[locale]/blog/[slug]/page.tsx",
    "line": null,
    "description": "42-03 Task 3 live-curl sweep (canonical across all route types + favicon/manifest/theme-color regression check) could not be run end-to-end: same session-wide Neon Postgres connectivity blocker as WINDOWS ids 1-3 recurred despite being marked fixed -- npm run dev hung on the middleware /api/redirects-lookup DB call for 15s+ with no response (SSL-mode deprecation warning logged, no crash). Static verification complete instead: tsc --noEmit clean, all 6 grep buildAlternates( acceptance criteria pass, sitewide comm -23 gap-check shows zero unexpected gaps (only the 4 expected Servicios/Services files), and static grep confirms Plan 42-01's manifest/themeColor still present in layout.tsx. Recommend Juan re-run once Neon connectivity is stable: npm run dev && curl -s http://localhost:3000/seo-tecnico-lima | grep canonical (repeat per Task 3 verify block).",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T15:48:35.727Z",
    "resolved_at": "2026-08-01T21:53:51.219Z"
  },
  {
    "id": 5,
    "kind": "unmet-truth",
    "phase": "42",
    "file": ".env",
    "line": null,
    "description": "Home meta.description update confirmed written+published via Local API self-verify (payload.find overrideAccess:false, same read path as unauthenticated REST) on 2026-08-02, but production (https://juan-tech.com, Dokploy) still serves the OLD description with zero HTTP caching involved (cache-control: no-store, cache-bust query param has no effect). This means Juan's local .env DATABASE_URI and Dokploy's production DATABASE_URI likely point to DIFFERENT Neon databases/branches, contradicting CLAUDE.md's stated assumption of a single shared production DB. Needs Juan to compare the two connection strings in Dokploy env panel vs local .env. Until resolved, any Local-API script run locally may NOT be affecting what juan-tech.com actually serves -- Phase 41/42's earlier og:image/canonical fixes only worked because they are CODE changes (read fresh per request regardless of which DB), not content writes.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-02T16:24:04.304Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "unrun-verify",
    "phase": "43",
    "file": ".planning/phases/43-performance-response-time-html-size/43-01-SUMMARY.md",
    "line": null,
    "description": "Live before/after Home response-time + HTML-size measurement (npm run start + curl timing/wc -c) blocked by intermittent local Neon ECONNRESET — deferred to production confirmation post-deploy",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-03T01:24:20.043Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "43",
    "file": ".planning/phases/43-performance-response-time-html-size/43-02-SUMMARY.md",
    "line": null,
    "description": "Live before/after Servicios+Blog listing response-time/HTML-size measurement (npm run start / node .next/standalone/server.js + curl timing) blocked by same session-wide intermittent local Neon ECONNRESET as WINDOWS id 6 — deferred to production confirmation post-deploy",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-03T01:39:35.297Z",
    "resolved_at": null
  }
]
````
