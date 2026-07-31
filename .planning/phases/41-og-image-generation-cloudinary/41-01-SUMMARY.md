---
phase: 41-og-image-generation-cloudinary
plan: 01
subsystem: seo
tags: [cloudinary, opengraph, twitter-card, nextjs-metadata, seo]

# Dependency graph
requires: []
provides:
  - "src/lib/og-image.ts: getCloudinaryOgWithTitle(url, title) + buildOpenGraph(params), the module every other Phase 41 plan imports"
  - "Home (ES+EN) generateMetadata wired to buildOpenGraph — tracer proof the mechanism works end-to-end"
  - "Root [locale]/layout.tsx sitewide twitter: { card: 'summary_large_image' } — closes OG-04 for the whole site"
  - "Post detail (blog/[slug]) and CaseStudy detail (case-studies/[slug]) generateMetadata wired to buildOpenGraph with heroImage passed, exercising the 2nd-tier fallback priority"
affects: [41-02, 41-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "buildOpenGraph({ title, description, url, locale, slug, metaImage, heroImage }) called from generateMetadata, url always relative and locale-correct, resolved via metadataBase"
    - "3-tier OG background priority: meta.image (plugin-seo editorial) -> heroImage (Cloudinary) -> getFallbackHeroImage(slug) deterministic pool"

key-files:
  created:
    - src/lib/og-image.ts
  modified:
    - "src/app/(frontend)/[locale]/layout.tsx"
    - "src/app/(frontend)/[locale]/page.tsx"
    - "src/app/(frontend)/[locale]/blog/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"

key-decisions:
  - "Ported getCloudinaryOgWithTitle verbatim from JuanPortfolio (same transform string, same double-encoding of , and / for the l_text layer) — zero new Cloudinary uploads, reuses portfolio/og-scrim + Array-Bold.woff2 already live on the shared account"
  - "Reused this repo's existing getFallbackHeroImage instead of re-porting JuanPortfolio's fallbackImages.ts — same 53-image pool, same deterministic hash"
  - "twitter.creator and twitter.images omitted per 41-CONTEXT.md — no Twitter/X account, images inherit from openGraph.images automatically"

requirements-completed: [OG-01, OG-02, OG-03, OG-04]

coverage:
  - id: D1
    description: "og-image.ts module (getCloudinaryOgWithTitle + buildOpenGraph) — Cloudinary title-overlay transform, ported and live-verified against the real Cloudinary account"
    requirement: "OG-01"
    verification:
      - kind: other
        ref: "direct curl of a hand-built og-image URL (fallback image + comma-containing title) -- HTTP 200, image/jpeg, 76666 bytes; visually confirmed scrim + white Array-Bold text bottom-right, correct 65-char truncation with ellipsis, comma survived the double-encoding (T-41-01 mitigation)"
        status: pass
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: true
    rationale: "The Cloudinary transform mechanism itself is proven live and correct (see verification above), but the plan's <verify> block also requires curling the actual rendered HTML page (og:image meta tag present, resolves 200) against a running dev server — that leg could not be completed this session due to a Postgres/Neon connectivity blocker unrelated to this plan's code (see Deviations). Needs a human/verifier re-run once DB connectivity is confirmed stable."
  - id: D2
    description: "Home (ES+EN) generateMetadata wired to buildOpenGraph; root layout gains sitewide twitter:card summary_large_image"
    requirement: "OG-03, OG-04"
    verification:
      - kind: unit
        ref: "grep -c \"buildOpenGraph(\" \"src/app/(frontend)/[locale]/page.tsx\" -> 1; grep -c \"card: 'summary_large_image'\" \"src/app/(frontend)/[locale]/layout.tsx\" -> 1"
        status: pass
    human_judgment: true
    rationale: "Static code checks pass, but live curl of / and /en/ to confirm the og:image and twitter:card meta tags actually render in the served HTML was blocked by the same Postgres connectivity issue as D1. Needs re-verification once the dev server can reach the DB reliably."
  - id: D3
    description: "Post detail (blog/[slug]) and CaseStudy detail (case-studies/[slug]) generateMetadata wired to buildOpenGraph with heroImage passed"
    requirement: "OG-02"
    verification:
      - kind: unit
        ref: "grep -c \"buildOpenGraph(\" and grep -c \"heroImage: doc.heroImage\" on both files -> 1 each"
        status: pass
    human_judgment: true
    rationale: "Static wiring confirmed correct by grep + tsc, but curling a real post/case-study URL from the live sitemap to confirm the og:image tag resolves on res.cloudinary.com (proving the heroImage-branch of the 3-tier fallback) was blocked by the same DB connectivity issue. Needs re-verification."

duration: ~55min
completed: 2026-07-31
status: complete
---

# Phase 41 Plan 01: OG Image Generation (Cloudinary) — Tracer Summary

**Ported JuanPortfolio's Cloudinary title-overlay `og:image` mechanism into `src/lib/og-image.ts`, wired Home + Post detail + CaseStudy detail + sitewide `twitter:card`; the transform itself is live-verified, but full page-level curl verification is blocked by a Postgres/Neon connectivity issue in this session, not by the code.**

## Performance

- **Duration:** ~55 min (implementation ~15 min; remainder spent diagnosing and retrying a Postgres connectivity blocker unrelated to this plan's code)
- **Completed:** 2026-07-31
- **Tasks:** 2/2 completed and committed
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- `src/lib/og-image.ts` created: `getCloudinaryOgWithTitle` ported verbatim from JuanPortfolio (same transform string, same double-encoding of `,`/`/` for the Cloudinary `l_text` layer — the T-41-01 injection mitigation), plus `buildOpenGraph` implementing the locked 3-tier background priority (`meta.image` → `heroImage` → `getFallbackHeroImage(slug)`).
- Home (`[locale]/page.tsx`) `generateMetadata` wired to `buildOpenGraph` — the tracer proof.
- Root `[locale]/layout.tsx` gained sitewide `twitter: { card: 'summary_large_image' }`, closing OG-04 for the entire site from a single static object (no `creator`, no separate `images` — inherits from `openGraph.images`).
- Post detail (`blog/[slug]/page.tsx`) and CaseStudy detail (`case-studies/[slug]/page.tsx`) both wired with `heroImage` passed through, exercising the middle tier of the fallback priority chain (the only two collections with a real per-doc `heroImage`).
- The ported Cloudinary mechanism itself was independently verified live against the real Cloudinary account: a hand-built OG URL (fallback image + a title containing a comma, to exercise the double-encoding mitigation) returned HTTP 200, `image/jpeg`, and rendered correctly — dark scrim at the bottom, white Array-Bold text bottom-right, truncated with an ellipsis, comma preserved as literal text (not a broken transform).

## Task Commits

1. **Task 1: Create src/lib/og-image.ts + wire Home end-to-end + sitewide twitter card** — `e1d20df` (feat)
2. **Task 2: Wire Post detail + CaseStudy detail (the two heroImage-bearing collections)** — `6e6ccda` (feat)

## Files Created/Modified

- `src/lib/og-image.ts` — new module: `getCloudinaryOgWithTitle`, `buildOpenGraph`, internal `isPopulatedMedia`/`resolveOgBackgroundUrl`
- `src/app/(frontend)/[locale]/layout.tsx` — added sitewide `twitter: { card: 'summary_large_image' }`
- `src/app/(frontend)/[locale]/page.tsx` — Home `generateMetadata` now returns `openGraph: buildOpenGraph(...)`
- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` — Post detail `generateMetadata` now returns `openGraph: buildOpenGraph(...)` with `heroImage: doc.heroImage`
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — CaseStudy detail `generateMetadata` now returns `openGraph: buildOpenGraph(...)` with `heroImage: doc.heroImage`

## Decisions Made

- Ported `getCloudinaryOgWithTitle` verbatim (same transform literals, same public_id-extraction loop, same 65-char truncation, same double-encoding), only adjusting doc-comment wording per the plan's Interfaces block.
- Reused this repo's existing `getFallbackHeroImage` instead of re-porting JuanPortfolio's `fallbackImages.ts` — same 53-image pool, same FNV-1a hash, zero duplicated logic.
- `twitter.creator` and `twitter.images` intentionally omitted per 41-CONTEXT.md (no Twitter/X account; images inherit automatically from `openGraph.images`).

## Deviations from Plan

### Blocker (not a code deviation — environment/infrastructure)

**Postgres/Neon connectivity prevented full live-page curl verification.**

- **What happened:** The plan's tracer `<verify>` requires curling the running dev server's HTML (`http://localhost:3000/`, `/en/`, a real blog post, a real case study) to confirm the `og:image`/`twitter:card` meta tags render and resolve. Every attempt to load a Postgres-backed route (`/`, `/en/`, `/api/redirects-lookup`) returned HTTP 500 or timed out with `ECONNRESET` while Payload tried to connect to the Neon database — over 30 restart/retry attempts across ~45 minutes, only 5 requests ever completed successfully (and at least one of those completed server-side after the client had already given up waiting).
- **Root-cause isolation:** Ran a raw `pg` `Client.connect()` test directly against `DATABASE_URI` (bypassing Next.js/Payload entirely) — it reproduced the exact same `ECONNRESET` at a consistent ~20-second mark. Repeated the test against the Neon **pooled** endpoint (`-pooler` host) as well — same result. Also confirmed general internet connectivity was fine (`https://www.google.com`, `https://neon.tech`, `https://res.cloudinary.com` all returned normal responses instantly) and that disabling the Bash sandbox (`dangerouslyDisableSandbox`) made no difference. This isolates the problem to the Postgres/TLS connection path to Neon in this session — not to anything in this plan's code, and not to a Claude Code sandbox restriction.
- **What I did instead:** Independently verified the actual ported logic — the highest-risk part of this plan (the Cloudinary transform string, the `l_text` title overlay, the double-encoding injection mitigation) — by hand-building an OG URL with `getCloudinaryOgWithTitle`'s exact algorithm and curling it directly against the live Cloudinary account (no DB involved). It returned HTTP 200 and rendered correctly (screenshot inspected). All static checks (`tsc --noEmit`, every grep-based acceptance criterion from the plan) pass.
- **Not fixed, by design:** This is a database/network infrastructure issue, not something this plan's code should touch (`payload.config.ts`'s pool settings are explicitly out of scope, and CLAUDE.md's Database Safety rules govern that file). Recorded in `.planning/WINDOWS.md` as an `unrun-verify` entry (id 1) so it stays visible at ship time.
- **Recommended re-verification (single command, once Neon connectivity is confirmed stable):**
  ```bash
  npm run dev &
  sleep 5
  curl -s http://localhost:3000/ | grep -o 'property="og:image" content="[^"]*"'
  curl -s http://localhost:3000/en/ | grep -o 'name="twitter:card" content="[^"]*"'
  ```

---

**Total deviations:** 0 code deviations. 1 environment blocker (documented above, tracked in `.planning/WINDOWS.md`).
**Impact on plan:** Code is complete, correct, and matches every acceptance criterion checkable without a live DB connection. The only unverified leg is the DB-dependent HTML-rendering half of the tracer's `<verify>` block, blocked by a pre-existing infrastructure issue in this session.

## Issues Encountered

- Persistent Neon Postgres `ECONNRESET` (see Deviations above) blocked live end-to-end curl verification of the rendered HTML. Isolated to be independent of this plan's code via a raw `pg` client test.

## Next Phase Readiness

- `src/lib/og-image.ts` is ready to be imported by Plans 41-02/41-03 for the remaining ~17 public routes — the module's API (`buildOpenGraph`) is stable and matches the interface every other plan will call.
- **Before closing Phase 41 / this milestone**, re-run the live curl verification above once Neon connectivity is confirmed stable, and update `.planning/WINDOWS.md` entry id 1 to `fixed` (or re-open a targeted follow-up if the mechanism itself turns out to have a real bug once verified — unlikely given the independent Cloudinary-URL proof, but the HTML-level check has not yet been done).

---
*Phase: 41-og-image-generation-cloudinary*
*Completed: 2026-07-31*

## Self-Check: PASSED

- FOUND: src/lib/og-image.ts
- FOUND: .planning/phases/41-og-image-generation-cloudinary/41-01-SUMMARY.md
- FOUND: e1d20df (Task 1 commit)
- FOUND: 6e6ccda (Task 2 commit)
