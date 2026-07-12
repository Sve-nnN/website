---
phase: 14-target-keyword-field
reviewed: 2026-07-12T00:46:31Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/collections/Pages/index.ts
  - src/collections/Authors/index.ts
  - scripts/seed-phase14-target-keyword.ts
  - src/migrations/20260712_001122_phase14_target_keyword_field.ts
  - src/migrations/20260712_001122_phase14_target_keyword_field.json
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-07-12T00:46:31Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the `targetKeyword` group-field addition to `pages`/`authors`, the generated Postgres migration, and the idempotent seed script. Schema, migration (up/down symmetry, `_pages_v` versioned-table column included), migration registration in `src/migrations/index.ts`, and `payload-types.ts` regeneration are all correctly wired and internally consistent — confirmed the migration JSON snapshot actually contains `target_keyword_en/es` and `version_target_keyword_en/es`, and `tsc --noEmit` reports no type errors touching these files. No hardcoded secrets, no `eval`/dangerous calls, no empty catch blocks, no external API calls introduced (matches the phase's stated "editorial, no live API calls" scope).

Two Warning-level issues found: one about unrestricted public exposure of a field the code itself documents as "editorial reference only," and one about field-definition duplication that breaks from the codebase's own established `slugField()`-style reusable-field convention. Two Info-level style notes below.

## Warnings

### WR-01: `targetKeyword` is publicly readable via REST despite being documented as internal/editorial-only

**File:** `src/collections/Pages/index.ts:92-97`, `src/collections/Authors/index.ts:209-214`
**Issue:** The field's own `admin.description` states this is "Editorial reference only ... Does not affect SEO meta tags." Yet neither collection restricts read access at the field level, and both collections already expose published/all docs publicly (`Pages.access.read = authenticatedOrPublished`, `Authors.access.read = () => true`). The Phase 14 verification report itself confirms this by querying `targetKeyword` unauthenticated via `GET /api/pages?locale=es` and `GET /api/authors?locale=es`. As implemented, anyone (including competitors) can scrape `/api/pages` and `/api/authors` and see the exact keyword Juan is targeting for every page and his author profile — the opposite of what an "internal editorial reference" implies. This is a design gap, not a crash risk, but it directly contradicts the field's stated purpose and has real competitive-SEO-intelligence exposure implications for a site whose core value proposition is demonstrating SEO expertise.
**Fix:** Add a field-level `access.read` restricting the group to authenticated admin users, e.g.:
```ts
{
  name: 'targetKeyword',
  type: 'group',
  access: {
    read: authenticated, // reuse existing @/access/authenticated
  },
  // ...
}
```
Apply the same in both `Pages/index.ts` and `Authors/index.ts`. If public exposure is actually acceptable (e.g., Juan wants this visible), the `admin.description` copy should be updated to stop claiming it's editorial-only/internal, so the code and its own documentation don't contradict each other.

### WR-02: Duplicated `targetKeyword` field definition instead of a reusable factory

**File:** `src/collections/Pages/index.ts:88-102`, `src/collections/Authors/index.ts:205-219`
**Issue:** The exact same 15-line field config (group name, bilingual labels, bilingual descriptions, `en`/`es` text sub-fields) is copy-pasted verbatim across both collections. The codebase already establishes the reusable-field-factory pattern for this exact scenario — `slugField()` (imported and used directly above this field in both files, `Pages/index.ts:5,87` and `Authors/index.ts:3,204`). Any future edit to the label/description/shape (e.g., adding a third locale, tightening validation) requires remembering to update two files in lockstep, and it's easy to let them drift.
**Fix:** Extract to `src/fields/targetKeyword.ts` following the `slugField()` pattern, and import it in both collections:
```ts
// src/fields/targetKeyword.ts
import type { Field } from 'payload'

export const targetKeywordField = (): Field => ({
  name: 'targetKeyword',
  type: 'group',
  label: { en: 'Target Keyword', es: 'Keyword objetivo' },
  admin: {
    description: {
      en: 'Editorial reference only — the primary keyword this page/profile is written toward. Does not affect SEO meta tags or trigger any external API call.',
      es: 'Solo referencia editorial — la keyword principal para la que está escrito este contenido. No afecta las meta etiquetas de SEO ni dispara ninguna llamada a una API externa.',
    },
  },
  fields: [
    { name: 'en', type: 'text', label: 'English' },
    { name: 'es', type: 'text', label: 'Español' },
  ],
})
```
Then `fields: [..., slugField(), targetKeywordField()]` in both `Pages/index.ts` and `Authors/index.ts`.

## Info

### IN-01: Inconsistent indentation in generated migration SQL block

**File:** `src/migrations/20260712_001122_phase14_target_keyword_field.ts:4-10, 14-20`
**Issue:** The first line inside each template literal (`  await db.execute(sql\`\n   ALTER TABLE ...`) has a 3-space indent while subsequent `ALTER TABLE` lines use 2 spaces — a stray space likely introduced by the CLI generator or manual edit. Cosmetic only, does not affect execution since it's raw SQL inside a template literal.
**Fix:** Normalize indentation to 2 spaces for all `ALTER TABLE` lines for readability (no functional change).

### IN-02: No `maxLength`/`required` validation on `targetKeyword.en`/`.es` text fields

**File:** `src/collections/Pages/index.ts:99-100`, `src/collections/Authors/index.ts:216-217`
**Issue:** Sub-fields are unconstrained plain `text` with no `required`, no `maxLength`. This is likely intentional given the field is purely editorial/optional reference data (matches CONTEXT.md's "texto simple" spec), but it means an editor could paste an arbitrarily long string or leave it blank without any admin-side signal that a pick is missing for one locale.
**Fix:** If keeping both locales populated is important going forward, consider a soft `admin.description` note per sub-field, or add `maxLength: 100` to guard against accidental paste of long text. Not blocking — flagging for awareness only.

---

_Reviewed: 2026-07-12T00:46:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
