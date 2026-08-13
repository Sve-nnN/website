---
phase: 12-author-page-e-e-a-t-expansion
reviewed: 2026-07-11T21:35:31Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/collections/Authors/index.ts
  - src/collections/SpeakingEvents/index.ts
  - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
  - scripts/seed-author-eeat.ts
  - scripts/fix-tablas-hash-excerpt.ts
  - src/migrations/20260711_201023_phase12_author_eeat_fields.ts
  - src/migrations/20260711_204216_phase12_speaking_events.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-07-11T21:35:31Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the Authors/SpeakingEvents collection changes, the extended author-page renderer, the two migrations, and the two data scripts for Phase 12. `npx tsc --noEmit` is clean, the migrations correctly mirror the collection schema and are registered in `src/migrations/index.ts`, and `SpeakingEvents` is correctly registered in `payload.config.ts`. No hardcoded secrets, no injection vectors, no crash-level bugs found.

The issues found are all correctness/robustness gaps that either already manifest with real seeded content (the empty date-range paragraph for the aprendoclub experience entry) or will manifest as soon as an editor adds the next slightly-different-shaped row (a credential without an end date, a re-titled speaking event, a manually-added expertise item followed by a script re-run). None are security-critical; all are worth fixing before calling this phase durable, given the site's stated purpose is impeccable SEO/content correctness.

## Warnings

### WR-01: Empty `<p>` rendered when `dateRange` is blank (education/experience)

**File:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx:217` and `:241`
**Issue:** `formatDateRange()` returns `''` when `startDate` is missing (`page.tsx:29`, `if (!startDate) return ''`). Both call sites render the result unconditionally:
```tsx
<p className="mt-1 text-label text-muted-foreground">{dateRange}</p>   // education, line 217
<p className="text-label text-muted-foreground">{dateRange}</p>        // experience, line 241
```
This is not a hypothetical edge case — the seeded "Senior Tech SEO Analyst @ aprendoclub" experience row (`scripts/seed-author-eeat.ts:102-107`) has `startDate: null, endDate: null` by design (ongoing role, "no inventar" per Juan's instruction) and is already live per the phase verification. The result is an empty `<p>` with `text-label` typography sitting above the role title, producing a visible phantom-line gap on the live author page for that entry, in both locales.

Contrast with the speaking-events section (`page.tsx:262-266`), which builds `metaParts` as an array and filters with `.filter(Boolean)` before joining — the same "omit if empty" handling was correctly applied there but not to `formatDateRange`'s callers.

**Fix:**
```tsx
{dateRange && (
  <p className="mt-1 text-label text-muted-foreground">{dateRange}</p>
)}
```
Apply the same guard at both call sites (education card and experience timeline item).

### WR-02: `hasCredential.datePublished` can be `null`, and `organization` is not a schema.org property of `EducationalOccupationalCredential`

**File:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx:151-160`
**Issue:**
```tsx
...(doc.education?.length
  ? {
      hasCredential: doc.education.map((ed) => ({
        '@type': 'EducationalOccupationalCredential',
        name: ed.degree,
        organization: ed.institution,
        datePublished: ed.endDate,
      })),
    }
  : {}),
```
Two correctness gaps in the structured data this phase's entire purpose is to enrich:
1. `ed.endDate` is optional on the `education[]` schema (`Authors/index.ts:120-128`, no `required`). If an editor adds an ongoing credential (no end date — exactly the pattern already used for the `experience[]` aprendoclub row), `datePublished` will literally serialize as `"datePublished": null` in the JSON-LD, which is not a valid ISO 8601 date and will fail structured-data validation for that credential.
2. `organization` is not a defined property of `EducationalOccupationalCredential` (or of `CreativeWork`) in the schema.org vocabulary — the standard property for "who recognizes/grants this credential" is `recognizedBy` (expects an `Organization` object). As written, `organization` will simply be ignored by any strict consumer/validator, silently defeating the E-E-A-T enrichment goal for that field.

**Fix:**
```tsx
hasCredential: doc.education.map((ed) => ({
  '@type': 'EducationalOccupationalCredential',
  name: ed.degree,
  recognizedBy: { '@type': 'Organization', name: ed.institution },
  ...(ed.endDate ? { datePublished: ed.endDate } : {}),
})),
```

### WR-03: `seedExpertise`/`seedEducation`/`seedExperience` silently overwrite manual admin edits on every re-run

**File:** `scripts/seed-author-eeat.ts:240-313`
**Issue:** These three functions unconditionally `payload.update({ data: { expertise: items } })` (and same for education/experience) with the script's hardcoded content on every run, regardless of what's currently in the database. Compare with `seedSocialLinks` (`scripts/seed-author-eeat.ts:315-348`), which explicitly checks for existing values and refuses to overwrite when they differ from the expected seed:
```ts
console.warn('SocialLinks: el Author ya tiene valores DIFERENTES a los esperados — no se sobrescriben...')
return
```
No equivalent guard exists for expertise/education/experience. If Juan (or a future editor) adds a 5th expertise item or edits a description via `/admin`, and this script is re-run for any reason (e.g. to seed the next author, or a "let me just re-run it to be safe" moment), the whole array is replaced and the manual edit is silently lost. The docstring calls the script "idempotent," which is true only for re-running against untouched data — it is not safe against concurrent manual edits, unlike the sibling function in the same file.
**Fix:** Either mirror `seedSocialLinks`'s diff-and-warn pattern for the three array fields, or make the overwrite-blind behavior explicit and loud (e.g. require a `--force` flag / log a prominent warning before each destructive array replace) so it can't be re-run against a since-edited author by accident.

### WR-04: `speaking-events` upsert keyed on ES `title` is fragile, and `defaultSort: '-date'` has unstated NULL-ordering behavior

**File:** `scripts/seed-author-eeat.ts:356-365`; `src/collections/SpeakingEvents/index.ts:22`
**Issue:**
- The upsert in `seedSpeakingEvents` matches existing docs by exact ES `title` (`where: { title: { equals: esItem.title } }`). If an editor renames a speaking event's ES title in `/admin` (a normal content edit) and the seed script is re-run afterward, the lookup will no longer find the existing doc and will `payload.create` a duplicate event with the original title, rather than updating the renamed one.
- `SpeakingEvents.defaultSort = '-date'` (line 22) combined with the `date` field being nullable and both currently-seeded events having `date: null` means Postgres's default NULLS ordering for `ORDER BY date DESC` is `NULLS FIRST`. Today this is harmless (both events are null-dated), but as soon as a future event with a real, older date is added, it will still sort below the two null-dated events indefinitely — undocumented behavior that could look like a display bug when it actually happens.
**Fix:** For the upsert, key on something more stable than free-text title (e.g. a `slug` field, or the `link` URL which is already unique per event) if this script is expected to be re-run after content edits. For the sort, either document the NULLS-FIRST intent explicitly in a comment on `defaultSort`, or use an explicit `sql` order clause (`date DESC NULLS LAST`) if the intended behavior is "undated events sink, not float."

## Info

### IN-01: `fix-tablas-hash-excerpt.ts` hardcodes numeric id `56` with no pre-check

**File:** `scripts/fix-tablas-hash-excerpt.ts:32`
**Issue:** `payload.update({ collection: 'posts', id: 56, ... })` assumes post id 56 is still the "Tablas hash" post. This is a one-off migration script (acceptable for that use case), but it has no guard confirming the doc at id 56 is still the intended slug before writing, so if ids ever get renumbered/re-seeded, this script would silently overwrite the wrong post's excerpt.
**Fix:** Not required to change for a one-off script already run, but for any future copy of this pattern, prefer looking the doc up `where: { slug: { equals: 'tablas-hash' } }` and asserting the id matches before writing, rather than trusting a hardcoded id.

### IN-02: `organization`/`recognizedBy` decision traces back to `12-CONTEXT.md`, not an execution deviation

**File:** `.planning/phases/12-author-page-e-e-a-t-expansion/12-CONTEXT.md:31`
**Issue:** Noting for the record (not a new finding beyond WR-02): the `organization=institution` mapping was specified verbatim in `12-CONTEXT.md`'s decisions section, so the executor implemented the spec faithfully — the defect is upstream in the design decision, not an implementation slip. Flagging here so the fix in WR-02 doesn't get read as "executor ignored the spec."

### IN-03: External `link` fields (`SpeakingEvents.link`, `Authors.socialLinks[].url`) have no URL/scheme validation

**File:** `src/collections/SpeakingEvents/index.ts:80-83`; `src/collections/Authors/index.ts:196-201`
**Issue:** Both fields are plain `type: 'text'` with no `validate` for URL shape/scheme. These are admin-only-writable, low-risk fields (not public-submission forms), so this isn't exploitable by an outside attacker, but a stray `javascript:` or malformed value would render into an `<a href>` (`page.tsx:300-309`) without any sanitization beyond React's default escaping (which does not block `javascript:` URLs).
**Fix:** Optional hardening — add a `validate` function requiring `http(s)://` prefix on both fields, consistent with treating admin input as "trusted but not infallible."

---

_Reviewed: 2026-07-11T21:35:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
