---
phase: 14-target-keyword-field
fixed_at: 2026-07-12T00:50:06Z
review_path: .planning/phases/14-target-keyword-field/14-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-07-12T00:50:06Z
**Source review:** .planning/phases/14-target-keyword-field/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: `targetKeyword` is publicly readable via REST despite being documented as internal/editorial-only

**Files modified:** `src/collections/Pages/index.ts`, `src/collections/Authors/index.ts`
**Commit:** 86e6e7b
**Applied fix:** Added `access: { read: authenticated }` to the `targetKeyword` group field in both collections, reusing the existing `authenticated` helper from `@/access/authenticated` (already imported and used for other access rules in `Pages/index.ts`; added the import to `Authors/index.ts` where it wasn't previously needed). Confirmed live against the running dev server: unauthenticated `GET /api/pages` and `GET /api/authors` now omit the `targetKeyword` key from returned documents entirely (verified via curl, see below).

### WR-02: Duplicated `targetKeyword` field definition instead of a reusable factory

**Files modified:** `src/fields/targetKeyword.ts` (new), `src/collections/Pages/index.ts`, `src/collections/Authors/index.ts`
**Commit:** 40e221d
**Applied fix:** Extracted the `targetKeyword` group field (bilingual label/description, `en`/`es` text sub-fields, and the `access.read` restriction from WR-01) into a new `targetKeywordField()` factory in `src/fields/targetKeyword.ts`, following the existing `slugField()` factory pattern (`src/fields/slug.ts`). Both `Pages/index.ts` and `Authors/index.ts` now import and call `targetKeywordField()` instead of inlining the field definition. Removed the now-unused `authenticated` import from `Authors/index.ts` (the access rule moved into the factory).

## Skipped Issues

None — both in-scope Warning findings were fixed. (Info findings IN-01 and IN-02 were out of scope per default `fix_scope: critical_warning`.)

## Verification Performed

- `npx tsc --noEmit` — clean, no errors in any modified file (`Pages/index.ts`, `Authors/index.ts`, `fields/targetKeyword.ts`).
- Live curl against running dev server (`localhost:3000`) after fixes landed on `master`:
  - `GET /api/pages?limit=1&depth=0` (unauthenticated) — response docs no longer contain a `targetKeyword` key.
  - `GET /api/authors?limit=1&depth=0` (unauthenticated) — response docs no longer contain a `targetKeyword` key.
- Field-level access restriction does not affect `/admin` — Payload's admin UI runs authenticated requests, so editors continue to see and edit `targetKeyword` normally in the collection edit views.

---

_Fixed: 2026-07-12T00:50:06Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
