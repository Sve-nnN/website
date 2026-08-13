---
phase: 41-og-image-generation-cloudinary
plan: 02
subsystem: seo
tags: [cloudinary, opengraph, nextjs-metadata, seo]

# Dependency graph
requires:
  - "src/lib/og-image.ts: buildOpenGraph(params) (created in Plan 41-01)"
provides:
  - "contact/privacy/terms/seo-tecnico-lima/seo-tecnico-madrid/blog generateMetadata wired to buildOpenGraph — horizontal expansion of the 41-01 tracer to the 6 no-heroImage Pages-collection routes"
affects: [41-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Same buildOpenGraph({ title, description, url, locale, slug, metaImage }) call shape as 41-01, no heroImage passed (Pages collection has no such field)"

key-files:
  created: []
  modified:
    - "src/app/(frontend)/[locale]/contact/page.tsx"
    - "src/app/(frontend)/[locale]/privacy/page.tsx"
    - "src/app/(frontend)/[locale]/terms/page.tsx"
    - "src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx"
    - "src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx"
    - "src/app/(frontend)/[locale]/blog/page.tsx"

key-decisions:
  - "Pure mechanical repetition of the 41-01 tracer pattern — title/description extracted to named consts, openGraph: buildOpenGraph({...}) added to each returned metadata object, no logic changes to og-image.ts itself"
  - "seo-tecnico-lima/seo-tecnico-madrid keep the same URL segment across locales (only /en prefix differs), per the Phase 20 decision already baked into these routes"

requirements-completed: [OG-01, OG-02, OG-03]

coverage:
  - id: D1
    description: "6 generateMetadata functions (contact, privacy, terms, seo-tecnico-lima, seo-tecnico-madrid, blog) wired to buildOpenGraph, each with its own fixed slug fallback"
    requirement: "OG-01, OG-02, OG-03"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json"
        status: pass
      - kind: unit
        ref: "grep -c \"buildOpenGraph({\" on all 6 files -> 1 each, with the correct slug string present in each (contact/privacy/terms/seo-tecnico-lima/seo-tecnico-madrid/blog)"
        status: pass
      - kind: other
        ref: "curl http://localhost:3000/{route} for all 6 routes, both locales -- to confirm og:image resolves to res.cloudinary.com in the rendered HTML"
        status: blocked
    human_judgment: true
    rationale: "Static wiring is verified correct (tsc clean, exact slug per route confirmed by grep) and matches the exact call shape already live-verified by 41-01's tracer (same buildOpenGraph function, same Cloudinary transform mechanism, no new logic introduced this plan per the threat model). The live-page curl leg of verification is blocked by the same pre-existing Neon Postgres connectivity issue documented in WINDOWS.md id 1 (re-confirmed independently this session, see Deviations). Needs a human/verifier re-run once DB connectivity is stable."

duration: ~20min
completed: 2026-07-31
status: complete
---

# Phase 41 Plan 02: OG Image Generation (Cloudinary) — Horizontal Expansion Summary

**Wired buildOpenGraph (from Plan 41-01) into the 6 remaining no-heroImage Pages-collection routes (contact, privacy, terms, seo-tecnico-lima, seo-tecnico-madrid, blog listing) — pure mechanical repetition of the proven tracer pattern, zero new logic. Live curl verification blocked by the same pre-existing Neon Postgres connectivity issue as 41-01.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-31
- **Tasks:** 2/2 completed and committed
- **Files modified:** 6

## Accomplishments

- `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx` `generateMetadata` now return `openGraph: buildOpenGraph({...})`, each with its own fixed slug (`contact`/`privacy`/`terms`) as the deterministic fallback identifier.
- `seo-tecnico-lima/page.tsx`, `seo-tecnico-madrid/page.tsx`, `blog/page.tsx` `generateMetadata` likewise wired, each with slug `seo-tecnico-lima`/`seo-tecnico-madrid`/`blog`.
- All 6 routes follow the exact same shape: extract `title`/`description` into named consts (existing fallback-title ternaries left unchanged), compute a locale-correct relative `url`, pass `metaImage: meta?.image` through — never `heroImage` (Pages collection has no such field, confirmed by reading all 6 files' current interfaces before editing).
- `seo-tecnico-lima`/`seo-tecnico-madrid` correctly reuse the same URL segment across both locales (only the `/en` prefix differs) per the Phase 20 decision baked into these routes' original `generateMetadata`.
- `npx tsc --noEmit -p tsconfig.json` passes clean after both tasks.

## Task Commits

1. **Task 1: Wire contact, privacy, terms** — `f3d9a4c` (feat)
2. **Task 2: Wire seo-tecnico-lima, seo-tecnico-madrid, blog listing** — `938778b` (feat)

## Files Modified

- `src/app/(frontend)/[locale]/contact/page.tsx` — `generateMetadata` now returns `openGraph: buildOpenGraph({ ..., slug: 'contact' })`
- `src/app/(frontend)/[locale]/privacy/page.tsx` — `generateMetadata` now returns `openGraph: buildOpenGraph({ ..., slug: 'privacy' })`
- `src/app/(frontend)/[locale]/terms/page.tsx` — `generateMetadata` now returns `openGraph: buildOpenGraph({ ..., slug: 'terms' })`
- `src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx` — `generateMetadata` now returns `openGraph: buildOpenGraph({ ..., slug: 'seo-tecnico-lima' })`
- `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx` — `generateMetadata` now returns `openGraph: buildOpenGraph({ ..., slug: 'seo-tecnico-madrid' })`
- `src/app/(frontend)/[locale]/blog/page.tsx` — `generateMetadata` now returns `openGraph: buildOpenGraph({ ..., slug: 'blog' })`

## Decisions Made

- Followed the plan's Interfaces block verbatim — no deviation from the documented current shape of any of the 6 files (all matched exactly on read).
- No `heroImage` passed anywhere in this plan (correct — Pages collection docs have no such field, only `posts`/`case-studies` have it, already wired in 41-01).

## Deviations from Plan

None — plan executed exactly as written. Zero Rule 1/2/3/4 deviations; no bugs found, no missing functionality, no blocking issues, no architectural changes needed.

### Blocker (not a code deviation — environment/infrastructure, same root cause as 41-01)

**Postgres/Neon connectivity again prevented full live-page curl verification.**

- **What happened:** The plan's `<verify>` block requires curling all 6 routes in both locales (`http://localhost:3000/{contact,privacy,terms,seo-tecnico-lima,seo-tecnico-madrid,blog}` and their `/en/...` counterparts) to confirm the `og:image` meta tag renders and resolves to `res.cloudinary.com`. Two fresh `npm run dev` attempts this session both hung: the middleware's `/api/redirects-lookup` DB call failed with `ECONNRESET` after ~20s, and subsequent curl attempts against `/seo-tecnico-lima` with 15s and then 25-30s timeouts both returned `000` (no response).
- **Root cause:** Confirmed to be the exact same pre-existing session-wide Neon Postgres connectivity issue documented in `.planning/WINDOWS.md` entry id 1 (isolated independently by 41-01 via a raw `pg` client test, unrelated to any code in Phase 41). Not caused by this plan's changes.
- **What I did instead:** Full static verification — `npx tsc --noEmit -p tsconfig.json` exits 0; every one of the 6 acceptance-criteria `grep -c "buildOpenGraph({"` checks returns 1 with the exact correct `slug:` value present. The underlying `buildOpenGraph`/`getCloudinaryOgWithTitle` mechanism itself was already independently live-verified against the real Cloudinary account in 41-01 (not re-verified here, since this plan introduces zero new logic — confirmed by the plan's own threat model, which explicitly states "zero new code paths").
- **Not fixed, by design:** Database/network infrastructure issue, out of scope for this plan's code. Recorded as a new entry in `.planning/WINDOWS.md` (`unrun-verify`, id 2) alongside 41-01's id 1, so both stay visible at ship time.
- **Recommended re-verification (once Neon connectivity is confirmed stable):**
  ```bash
  npm run dev &
  sleep 5
  for p in contact privacy terms seo-tecnico-lima seo-tecnico-madrid blog; do
    echo "--- /$p (es) ---"
    curl -s "http://localhost:3000/$p" | grep -o 'property="og:image" content="[^"]*"'
    echo "--- /en/$p ---"
    curl -s "http://localhost:3000/en/$p" | grep -o 'property="og:image" content="[^"]*"'
  done
  ```

---

**Total deviations:** 0 code deviations. 1 environment blocker (same root cause as 41-01, documented above, tracked in `.planning/WINDOWS.md` id 2).
**Impact on plan:** Code is complete and correct, matches every acceptance criterion checkable without a live DB connection, and introduces no new mechanism (pure call-site expansion of already-proven code). The only unverified leg is the DB-dependent HTML-rendering half of the plan's `<verify>` block, blocked by the same pre-existing infrastructure issue as 41-01.

## Issues Encountered

- Persistent Neon Postgres `ECONNRESET` (see Deviations above), identical to 41-01's blocker. Confirmed independently again this session (2 fresh dev-server + curl attempts).

## Next Phase Readiness

- All 8 Pages-collection routes covered by Plans 41-01 + 41-02 (Home, contact, privacy, terms, seo-tecnico-lima, seo-tecnico-madrid, blog listing) plus Post/CaseStudy detail templates are wired to `buildOpenGraph`.
- Plan 41-03 (if it covers the remaining routes — services, case-studies listing, authors, etc. per PROJECT.md's ~18-route inventory) can proceed with the same proven `buildOpenGraph` call shape.
- **Before closing Phase 41 / this milestone**, re-run the combined live curl verification for both 41-01 and 41-02 (12+ routes across 2 locales) once Neon connectivity is confirmed stable, and resolve `.planning/WINDOWS.md` entries id 1 and id 2 accordingly.

---
*Phase: 41-og-image-generation-cloudinary*
*Completed: 2026-07-31*

## Self-Check: PASSED

- FOUND: src/app/(frontend)/[locale]/contact/page.tsx
- FOUND: src/app/(frontend)/[locale]/privacy/page.tsx
- FOUND: src/app/(frontend)/[locale]/terms/page.tsx
- FOUND: src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx
- FOUND: src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
- FOUND: src/app/(frontend)/[locale]/blog/page.tsx
- FOUND: .planning/phases/41-og-image-generation-cloudinary/41-02-SUMMARY.md
- FOUND: f3d9a4c (Task 1 commit)
- FOUND: 938778b (Task 2 commit)
