---
phase: 12-author-page-e-e-a-t-expansion
plan: 02
subsystem: frontend-author-page
tags: [nextjs, jsonld, shadcn, author-page]
requires:
  - "12-01 (Authors collection expertise/education/experience fields + payload-types.ts)"
provides:
  - Expertise tag cloud, Education card grid, Experience timeline sections on author page
  - Enriched Person JSON-LD (sameAs/knowsAbout/hasCredential)
affects:
  - "src/app/(frontend)/[locale]/authors/[slug]/page.tsx"
tech-stack:
  added: []
  patterns:
    - "formatDateRange module-level helper using Intl.DateTimeFormat with locale-aware month/year + Presente/Present fallback for null endDate"
    - "conditional spread for JSON-LD properties (omit key entirely when source array is empty, never emit empty array)"
key-files:
  modified:
    - "src/app/(frontend)/[locale]/authors/[slug]/page.tsx"
decisions: []
metrics:
  duration: "~15 min"
  completed: 2026-07-11
---

# Phase 12 Plan 02: Author Page E-E-A-T Sections + JSON-LD Summary

Adds the 3 new E-E-A-T sections (Expertise tag cloud, Education & Certifications card grid, Experience vertical timeline) to the author page per 12-UI-SPEC.md, plus enriches the existing Person JSON-LD with `sameAs`/`knowsAbout`/`hasCredential`.

## What Was Built

**Task 1 — 3 new sections** (`src/app/(frontend)/[locale]/authors/[slug]/page.tsx`):
- Extended `copy` dictionary with `expertise`/`education`/`experience`/`present` keys per locale, matching 12-UI-SPEC.md's Copywriting Contract literally.
- `formatDateRange(startDate, endDate, locale, presentLabel)` module-level helper — `Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })`, joins with en dash, falls back to `presentLabel` when `endDate` is null (ongoing), returns empty string when `startDate` is missing.
- Expertise section: `Badge variant="secondary"` tag cloud in `flex flex-wrap gap-2`.
- Education section: `grid-cols-1 md:grid-cols-2 gap-6` of `Card`s, `next/image` for the logo (48x48, `rounded-md object-contain`) with `GraduationCap` fallback icon when no logo is set.
- Experience section: vertical timeline — `bg-border` rail line + `bg-primary` connector dots, single-column left-rail layout at all breakpoints per spec.
- All 3 sections inserted between `<AuthorCard>` and the `posts` grid, each conditionally rendered only when its source array has `.length > 0` (no public empty state).

**Task 2 — Person JSON-LD enrichment**:
- `personData` extended with `sameAs` (from `doc.socialLinks[].url`), `knowsAbout` (from `doc.expertise[].topic`), `hasCredential` (from `doc.education[]`, mapped to `EducationalOccupationalCredential` with `name`/`organization`/`datePublished`).
- Each property is conditionally spread in — omitted entirely (not emitted as an empty array) when its source array is empty or absent.

## Deviations from Plan

None — plan executed exactly as written. `npx tsc --noEmit` confirmed no type errors introduced in `page.tsx`.

## Self-Check: PASSED

- FOUND: src/app/(frontend)/[locale]/authors/[slug]/page.tsx
- FOUND commit 5d8fda6 (Task 1: 3 sections)
- FOUND commit ab6b03f (Task 2: JSON-LD enrichment)

## Notes for 12-04 verification

This plan's sections and JSON-LD will render empty/absent until 12-03's seed script populates the real Author's `expertise`/`education`/`experience`/`socialLinks`. That is expected — 12-03 runs in the same wave and closes this gap before 12-04's verification.
