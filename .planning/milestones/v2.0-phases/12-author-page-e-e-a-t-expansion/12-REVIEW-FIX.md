---
phase: 12-author-page-e-e-a-t-expansion
fixed_at: 2026-07-11T22:10:00Z
review_path: .planning/phases/12-author-page-e-e-a-t-expansion/12-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-07-11T22:10:00Z
**Source review:** .planning/phases/12-author-page-e-e-a-t-expansion/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (all Warning-level; Info findings excluded per default `critical_warning` scope)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Empty `<p>` rendered when `dateRange` is blank (education/experience)

**Files modified:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx`
**Commit:** `135bb76`
**Applied fix:** Guarded both the education-card and experience-timeline `<p>` renders with `{dateRange && (...)}` so the empty-string case (no `startDate`, e.g. the ongoing aprendoclub role) no longer renders a phantom-line `<p>`.

### WR-02: `hasCredential.datePublished` can be `null`, and `organization` is not a valid schema.org property

**Files modified:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx`
**Commit:** `1f28810`
**Applied fix:** Replaced `organization: ed.institution` with `recognizedBy: { '@type': 'Organization', name: ed.institution }` (the correct schema.org property for `EducationalOccupationalCredential`), and made `datePublished` conditional on `ed.endDate` being present so it's omitted rather than serialized as `null` for ongoing/undated credentials.

### WR-03: `seedExpertise`/`seedEducation`/`seedExperience` silently overwrite manual admin edits on every re-run

**Files modified:** `scripts/seed-author-eeat.ts`
**Commit:** `f5bf69a`
**Applied fix:** Added a shared `itemsMatchExpected()` helper and applied it as a guard at the top of all three seed functions, mirroring the existing `seedSocialLinks` diff-and-warn pattern: if the current array (fetched from the just-verified `Author` doc, now threaded into `seedExpertise`/`seedEducation`/`seedExperience` via `main()`) has content and doesn't match the script's expected seed values, the function logs a Spanish warning and returns without writing, instead of blindly overwriting a manually-edited array.

### WR-04: `speaking-events` upsert keyed on ES `title` is fragile, and `defaultSort: '-date'` has unstated NULL-ordering behavior

**Files modified:** `scripts/seed-author-eeat.ts`, `src/collections/SpeakingEvents/index.ts`
**Commit:** `c62fc11`
**Applied fix:** Changed the upsert lookup in `seedSpeakingEvents` from matching on the localized ES `title` to matching on `link` (stable, non-localized, unique per event per the review's suggested alternative), so renaming a speaking event's title in `/admin` no longer causes a duplicate on re-run. Added an explanatory comment on `SpeakingEvents.defaultSort` documenting Postgres's NULLS FIRST behavior for `ORDER BY date DESC` on a nullable `date` column, so a future dated event sorting below undated ones reads as documented behavior, not a bug. Kept the sort as a plain field-name string (no raw `sql` order clause) since NULLS-FIRST is not currently harmful and the review offered documentation as an equally valid alternative to changing the sort semantics.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-11T22:10:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
