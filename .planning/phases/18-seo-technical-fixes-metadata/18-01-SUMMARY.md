---
phase: 18-seo-technical-fixes-metadata
plan: 01
subsystem: seo
tags: [payload-cms, plugin-seo, nextjs-metadata, postgres-migration, semantic-html]

requires:
  - phase: 01-schema-foundation
    provides: Authors collection, migrations convention
  - phase: 05-frontend-pages
    provides: AuthorCard component, contact/authors page routes, case-studies/blog byline usage of AuthorCard
provides:
  - Real semantic <h1> on /contact (sr-only) and /authors/[slug] (visible, via AuthorCard asPageHeading prop)
  - Authors collection wired into @payloadcms/plugin-seo (admin-editable meta.title/meta.description)
  - Committed + applied Postgres migration for the new Authors meta fields
affects: [phase-19-service-pages, phase-21-home-optimization]

tech-stack:
  added: []
  patterns:
    - "asPageHeading opt-in prop pattern for a shared component rendered both as a page-level heading and as a byline (AuthorCard)"
    - "generateTitle/generateDescription plugin-seo callbacks branching on doc shape (name vs title) to support multiple collections with different field sets"

key-files:
  created:
    - src/migrations/20260712_070605_phase18_authors_seo_meta.ts
    - src/migrations/20260712_070605_phase18_authors_seo_meta.json
  modified:
    - src/app/(frontend)/[locale]/contact/page.tsx
    - src/components/AuthorCard.tsx
    - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
    - src/payload.config.ts
    - src/collections/Authors/index.ts
    - src/migrations/index.ts
    - src/payload-types.ts

key-decisions:
  - "sr-only <h1> added directly in contact/page.tsx instead of promoting ContactFormBlock's <h2> — that block is reused as a CTA sidebar elsewhere, promoting its heading risked duplicate H1s on other pages"
  - "AuthorCard gets an asPageHeading prop (default false) instead of unconditionally rendering an <h1> — the component is reused as a byline on /blog/[slug] and /case-studies/[slug], which already have their own H1 (the post/case-study title)"
  - "Authors wired into the existing seoPlugin config (generateTitle/generateDescription branch on doc.name presence) rather than adding a bespoke SEO field group — keeps parity with pages/posts/case-studies"

patterns-established:
  - "Opt-in heading-level prop for shared byline/card components reused across page-level and inline contexts"

requirements-completed: [SEO-STRUCT-01, SEO-STRUCT-02, SEO-META-01]

duration: ~15min
completed: 2026-07-12
---

# Phase 18: SEO Technical Fixes + Metadata Summary

**Fixed the 2 missing-H1 semantic bugs on `/contact` and the Author page, and wired the Authors collection into `@payloadcms/plugin-seo` so its meta title/description are admin-editable — no visible layout changes.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 completed
- **Files modified:** 7 (2 new migration files, 5 modified)

## Accomplishments

- `/contact` (both locales) now renders a real, visually-hidden `<h1>` sourced from `doc.meta?.title ?? doc.title`, matching the existing `<title>` value — zero visible layout change.
- `/authors/[slug]` (both locales) now renders the author's name inside a real `<h1>` via a new `asPageHeading` prop on `AuthorCard`, default `false` so the byline usages on `/blog/[slug]` and `/case-studies/[slug]` are unaffected (verified no `asPageHeading` on those call sites).
- `authors` added to `@payloadcms/plugin-seo`'s `collections` array; `generateTitle`/`generateDescription` extended to branch on Authors doc shape (`name`/`jobTitle`) vs the existing Pages/Posts/CaseStudies shape (`title`/`heroSubtitle`/`excerpt`).
- Postgres migration generated via `payload migrate:create` and applied via `payload migrate` against the real dev Neon DB (`push: false` untouched), adding plugin-seo's `meta` fields to the `authors` table. `payload-types.ts` regenerated (`Author` interface now includes `meta`).
- Author page `generateMetadata` now reads `doc.meta?.title ?? doc.name` / `doc.meta?.description ?? doc.jobTitle ?? ''`, mirroring the exact pattern already used in `case-studies/[slug]/page.tsx`.

## Task Commits

1. **Task 1: Real H1 on /contact and Author page** - `1791abe` (feat)
2. **Task 2: Wire Authors into plugin-seo** - `e216f2b` (feat)
3. **Task 3: [BLOCKING] Migration + generateMetadata update** - `d578ca1` (feat)

## Files Created/Modified

- `src/app/(frontend)/[locale]/contact/page.tsx` — added `sr-only` `<h1>`
- `src/components/AuthorCard.tsx` — added `asPageHeading?: boolean` prop (default `false`)
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` — passes `asPageHeading` to `AuthorCard`; `generateMetadata` reads `doc.meta`
- `src/payload.config.ts` — `authors` added to `seoPlugin` collections; `generateTitle`/`generateDescription` branch on doc shape
- `src/collections/Authors/index.ts` — removed stale "No SEO tab" comment
- `src/migrations/20260712_070605_phase18_authors_seo_meta.ts` / `.json` — new migration (generated, not hand-written)
- `src/migrations/index.ts` — barrel updated by Payload CLI
- `src/payload-types.ts` — regenerated, `Author` interface includes `meta`

## Verification

- `npx tsc --noEmit` — exits 0 (re-verified independently after execution)
- `npm run build` — reported green by the executing agent (includes `payload migrate` no-op re-run against the already-migrated dev DB, `payload generate:importmap`, `payload generate:types`, `next build`)
- `grep` checks confirm: `sr-only` present in `contact/page.tsx`; `asPageHeading` present in `AuthorCard.tsx` and only passed from `authors/[slug]/page.tsx` (not from the blog/case-study byline call sites); `'authors'` present in `payload.config.ts`'s `seoPlugin` collections array

## Deviations from Plan

None — all 3 tasks executed as specified in `18-01-PLAN.md`. The executor's inline final report/completion signal was not captured by the orchestrator (background-agent transcript did not surface a text summary before session handoff); this SUMMARY.md was reconstructed by the orchestrator directly from `git log`/`git show` on the 3 task commits, which fully match the plan's `<action>` and `<acceptance_criteria>` blocks.

## Self-Check: PASSED
