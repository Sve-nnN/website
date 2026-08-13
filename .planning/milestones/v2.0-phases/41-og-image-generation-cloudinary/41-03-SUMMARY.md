---
phase: 41-og-image-generation-cloudinary
plan: 03
subsystem: seo
tags: [cloudinary, opengraph, nextjs-metadata, seo]

# Dependency graph
requires:
  - "src/lib/og-image.ts: buildOpenGraph(params) (created in Plan 41-01)"
provides:
  - "Servicios/Services (4 physical routes) + Author detail + Website detail + 4 no-doc listings (case-studies/authors/websites/search) all wired to buildOpenGraph — closes the last ~10 of ~19 public generateMetadata functions in the codebase"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Same buildOpenGraph({ title, description, url, locale, slug, metaImage }) call shape as 41-01/41-02"
    - "Servicios group's og:url mirrors buildServiceAlternates' canonical-collapsing formula (computed purely from locale, not the physical route folder), and both services/page.tsx + servicios/page.tsx share the fixed slug 'servicios' so their fallback image hashes are identical (same logical page)"
    - "No-doc routes (Task 3) call buildOpenGraph with metaImage/heroImage both omitted -- resolveOgBackgroundUrl falls straight to the deterministic per-slug fallback pool"

key-files:
  created: []
  modified:
    - "src/app/(frontend)/[locale]/services/page.tsx"
    - "src/app/(frontend)/[locale]/servicios/page.tsx"
    - "src/app/(frontend)/[locale]/services/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/servicios/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/authors/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/websites/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/page.tsx"
    - "src/app/(frontend)/[locale]/authors/page.tsx"
    - "src/app/(frontend)/[locale]/websites/page.tsx"
    - "src/app/(frontend)/[locale]/search/page.tsx"

key-decisions:
  - "services/page.tsx and servicios/page.tsx both use the literal fixed slug 'servicios' (not 'services') for the fallback so both physical index routes hash to the identical fallback image, matching the canonical-collapsing design already established by buildServiceAlternates"
  - "Author detail explicitly excludes doc.avatar from the OG chain (not part of the 3-tier priority per 41-CONTEXT.md); Website detail excludes screenshots[] for the same reason -- verified via grep that neither reference was introduced"
  - "The 4 no-doc routes (case-studies/authors/websites/search listings) never query a Payload doc in generateMetadata, so buildOpenGraph is called with metaImage/heroImage both omitted -- falls straight to getFallbackHeroImage(slug)"

requirements-completed: [OG-01, OG-02, OG-03]

coverage:
  - id: D1
    description: "4 Servicios/Services physical routes (index + detail, es + en) wired to buildOpenGraph, og:url mirroring buildServiceAlternates' canonical-collapsing formula"
    requirement: "OG-01, OG-02, OG-03"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json"
        status: pass
      - kind: unit
        ref: "grep -c \"buildOpenGraph({\" on all 4 files -> 1 each; both index files include slug: 'servicios'"
        status: pass
      - kind: other
        ref: "curl http://localhost:3000/servicios and /en/services to confirm og:image resolves to res.cloudinary.com"
        status: blocked
    human_judgment: true
    rationale: "Static wiring verified correct (tsc clean, exact grep matches). Live-page curl blocked by the same pre-existing Neon Postgres ECONNRESET documented in WINDOWS.md ids 1/2, re-confirmed independently a third time this session (see Deviations). Underlying buildOpenGraph mechanism already live-verified against the real Cloudinary account in 41-01."
  - id: D2
    description: "Author detail + Website detail (doc-backed, no heroImage field) wired to buildOpenGraph via meta.image -> per-slug fallback"
    requirement: "OG-01, OG-02"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json; grep -c \"buildOpenGraph({\" on both files -> 1 each; no doc.avatar or screenshots reference added to the OG chain"
        status: pass
      - kind: other
        ref: "curl a real /authors/{slug} and /websites/{slug} discovered via /sitemap.xml"
        status: blocked
    human_judgment: true
    rationale: "Static checks pass. Live curl blocked by same Neon connectivity issue."
  - id: D3
    description: "4 no-doc routes (case-studies/authors/websites listings, search) wired to buildOpenGraph with fixed per-route slug fallback, no Payload query"
    requirement: "OG-01, OG-03"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json; grep -c \"buildOpenGraph({\" on all 4 files -> 1 each, correct slug string present in each"
        status: pass
      - kind: other
        ref: "curl the 4 routes to confirm 4 distinct fallback public_ids"
        status: blocked
    human_judgment: true
    rationale: "Static checks pass. Live curl blocked by same Neon connectivity issue. Sitewide grep (this plan, post-commit) confirms all ~19 public generateMetadata functions across 41-01/41-02/41-03 now call buildOpenGraph -- zero routes missed."

duration: ~25min
completed: 2026-07-31
status: complete
---

# Phase 41 Plan 03: OG Image Generation (Cloudinary) — Final Rollout Summary

**Wired buildOpenGraph (from Plan 41-01) into the last 10 route files: the 4 Servicios/Services physical routes, Author/Website detail, and the 4 no-doc listings (case-studies, authors, websites, search). This closes every one of the ~19 public generateMetadata functions in the codebase. Live curl verification blocked by the same pre-existing Neon Postgres connectivity issue as 41-01/41-02, re-confirmed a third time; a sitewide grep confirms zero routes were missed.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-31
- **Tasks:** 3/3 completed and committed
- **Files modified:** 10

## Accomplishments

- `services/page.tsx` + `servicios/page.tsx` (index): both wired with the literal fixed slug `'servicios'` so both physical index routes hash to the identical fallback image, matching the canonical-collapsing pattern buildServiceAlternates already established. `og:url` computed purely from `locale` (`/servicios` es / `/en/services` en), same formula as `esPathFor`/`enPathFor` in `src/lib/canonical.ts`.
- `services/[slug]/page.tsx` + `servicios/[slug]/page.tsx` (detail): same pattern, `og:url` built from `doc.slug ?? slug`, `metaImage: doc.meta?.image` passed through.
- `authors/[slug]/page.tsx`: wired via `meta.image` -> per-slug fallback. `doc.avatar` deliberately NOT introduced into the OG chain (confirmed via grep — zero references), per 41-CONTEXT.md's locked 3-tier priority.
- `websites/[slug]/page.tsx`: wired via `meta.image` -> per-slug fallback. `screenshots[]` deliberately NOT used as a background source (confirmed via grep — only pre-existing render-section references remain, none in the OG chain).
- `case-studies/page.tsx`, `authors/page.tsx`, `websites/page.tsx`, `search/page.tsx`: none of these 4 routes queries a Payload doc in `generateMetadata` — each calls `buildOpenGraph` with `metaImage`/`heroImage` both omitted, falling straight through to `getFallbackHeroImage(slug)` with its own fixed slug (`case-studies`/`authors`/`websites`/`search`).
- **Final sitewide check (this plan's explicit success criterion):** `grep -rl "generateMetadata" "src/app/(frontend)"` found 19 files; every single one now also matches `buildOpenGraph` — zero routes silently missed across 41-01/41-02/41-03.
- `npx tsc --noEmit -p tsconfig.json` passes clean after every task and again at the end of the plan.

## Task Commits

1. **Task 1: Wire the 4 Servicios/Services physical routes (index + detail, es + en)** — `81947d6` (feat)
2. **Task 2: Wire Author detail + Website detail (doc-backed, no heroImage)** — `171418b` (feat)
3. **Task 3: Wire the 4 no-doc routes (Case Studies listing, Authors listing, Websites listing, Search)** — `f344035` (feat)

## Files Modified

- `src/app/(frontend)/[locale]/services/page.tsx` — `generateMetadata` returns `openGraph: buildOpenGraph({ ..., slug: 'servicios' })`
- `src/app/(frontend)/[locale]/servicios/page.tsx` — same, `slug: 'servicios'`
- `src/app/(frontend)/[locale]/services/[slug]/page.tsx` — `generateMetadata` returns `openGraph: buildOpenGraph({ ..., slug: doc.slug ?? slug })`
- `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx` — same
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` — `generateMetadata` returns `openGraph: buildOpenGraph({ ..., metaImage: doc.meta?.image })`
- `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` — same
- `src/app/(frontend)/[locale]/case-studies/page.tsx` — `generateMetadata` returns `openGraph: buildOpenGraph({ ..., slug: 'case-studies' })`
- `src/app/(frontend)/[locale]/authors/page.tsx` — `slug: 'authors'`
- `src/app/(frontend)/[locale]/websites/page.tsx` — `slug: 'websites'`
- `src/app/(frontend)/[locale]/search/page.tsx` — `slug: 'search'`

## Decisions Made

- Followed the plan's Interfaces/action blocks verbatim for all 10 files — no deviation from the documented current shape of any file (all matched exactly on read).
- Confirmed via grep (not just by not-writing-it) that `doc.avatar` and `screenshots` were never introduced into the OG call sites, satisfying the plan's explicit exclusion instructions.

## Deviations from Plan

None — plan executed exactly as written. Zero Rule 1/2/3/4 deviations; no bugs found, no missing functionality, no blocking issues, no architectural changes needed.

### Blocker (not a code deviation — environment/infrastructure, same root cause as 41-01/41-02)

**Postgres/Neon connectivity again prevented full live-page curl verification.**

- **What happened:** The plan's `<verify>` blocks require curling `/servicios`, `/en/services`, a real `/authors/{slug}` and `/websites/{slug}` (via sitemap.xml), and `/case-studies`, `/authors`, `/websites`, `/search` to confirm `og:image` renders and resolves to `res.cloudinary.com`. Started a fresh `npm run dev`, waited for "Ready", then curled `/servicios` — the request hung, and the server log showed `ERROR: Error: cannot connect to Postgres. Details: read ECONNRESET` on the middleware's `/api/redirects-lookup` route, same failure signature as 41-01/41-02.
- **Root cause:** Confirmed to be the exact same pre-existing session-wide Neon Postgres connectivity issue documented in `.planning/WINDOWS.md` entries id 1 and id 2 (isolated independently by 41-01 via a raw `pg` client test). Not caused by any code in Phase 41, including this plan.
- **What I did instead:** Full static verification for all 3 tasks — `npx tsc --noEmit -p tsconfig.json` exits 0 after every task; every one of the 10 files' `grep -c "buildOpenGraph({"` acceptance criteria returns 1 with the exact correct `slug:`/`url:` present; confirmed `doc.avatar` and `screenshots` were never added to the OG call sites. Additionally ran the plan's explicit final success-criterion check: a sitewide `grep -rl "generateMetadata" src/app/(frontend)` cross-referenced against `buildOpenGraph` presence — all 19 files match, zero missed.
- **Not fixed, by design:** Database/network infrastructure issue, out of scope for this plan's code (CLAUDE.md's Database Safety rules govern `payload.config.ts`, not touched here). Recorded as `.planning/WINDOWS.md` entry id 3 (`unrun-verify`), alongside ids 1/2, so all three stay visible at ship time.
- **Recommended re-verification (once Neon connectivity is confirmed stable):**
  ```bash
  npm run dev &
  sleep 5
  curl -s http://localhost:3000/servicios | grep -o 'property="og:image" content="[^"]*"'
  curl -s http://localhost:3000/en/services | grep -o 'property="og:image" content="[^"]*"'
  AUTHOR_URL=$(curl -s http://localhost:3000/sitemap.xml | grep -oE '<loc>[^<]*/authors/[^<]+</loc>' | head -1 | sed -E 's#<loc>(.*)</loc>#\1#')
  curl -s "$AUTHOR_URL" | grep -o 'property="og:image" content="[^"]*"'
  WEBSITE_URL=$(curl -s http://localhost:3000/sitemap.xml | grep -oE '<loc>[^<]*/websites/[^<]+</loc>' | head -1 | sed -E 's#<loc>(.*)</loc>#\1#')
  curl -s "$WEBSITE_URL" | grep -o 'property="og:image" content="[^"]*"'
  for p in case-studies authors websites search; do
    curl -s "http://localhost:3000/$p" | grep -o 'property="og:image" content="[^"]*"'
  done
  ```

---

**Total deviations:** 0 code deviations. 1 environment blocker (same root cause as 41-01/41-02, documented above, tracked in `.planning/WINDOWS.md` id 3).
**Impact on plan:** Code is complete and correct, matches every acceptance criterion checkable without a live DB connection, and introduces no new mechanism (pure call-site expansion of already-proven `buildOpenGraph`/`getCloudinaryOgWithTitle`, per this plan's own threat model). The only unverified leg is the DB-dependent HTML-rendering half of each task's `<verify>` block, blocked by the same pre-existing infrastructure issue as 41-01/41-02.

## Issues Encountered

- Persistent Neon Postgres `ECONNRESET` (see Deviations above), identical to 41-01/41-02's blocker. Confirmed independently a third time this session (1 fresh `npm run dev` + curl attempt, immediate ECONNRESET on the middleware DB call).

## Next Phase Readiness

- All 19 public `generateMetadata` functions in the codebase now call `buildOpenGraph` — Phase 41's ROADMAP Success Criteria #2/#3/#5 (og:image + og:url on every public route) are code-complete.
- **Before closing Phase 41 / this milestone**, re-run the combined live curl verification for 41-01, 41-02, and 41-03 (all ~19 routes across 2 locales) once Neon connectivity is confirmed stable, and resolve `.planning/WINDOWS.md` entries id 1, id 2, and id 3 accordingly.
- No further plans remain in Phase 41 — this was the last plan (wave 2, depends on 41-01, ran after 41-02 with zero file overlap).

---
*Phase: 41-og-image-generation-cloudinary*
*Completed: 2026-07-31*

## Self-Check: PASSED

- FOUND: src/app/(frontend)/[locale]/services/page.tsx
- FOUND: src/app/(frontend)/[locale]/servicios/page.tsx
- FOUND: src/app/(frontend)/[locale]/services/[slug]/page.tsx
- FOUND: src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
- FOUND: src/app/(frontend)/[locale]/authors/[slug]/page.tsx
- FOUND: src/app/(frontend)/[locale]/websites/[slug]/page.tsx
- FOUND: src/app/(frontend)/[locale]/case-studies/page.tsx
- FOUND: src/app/(frontend)/[locale]/authors/page.tsx
- FOUND: src/app/(frontend)/[locale]/websites/page.tsx
- FOUND: src/app/(frontend)/[locale]/search/page.tsx
- FOUND: 81947d6 (Task 1 commit)
- FOUND: 171418b (Task 2 commit)
- FOUND: f344035 (Task 3 commit)
