# CaseStudies.services[].service — Localization Decision

**Investigated:** 2026-07-14
**Method:** Live query via `getPayload({ config }).find({ collection: 'case-studies', locale: 'all', depth: 0 })` against the real production Neon Postgres (read-only, no writes) — using `scripts/content-humanization-snapshot.ts` output. Every existing CaseStudies document was inspected, not a sample.

## Verdict: MIGRATION REQUIRED

## Real values found (verbatim, across all 7 CaseStudies documents with a non-empty `services` array — doc 14 has `services: []`)

| Doc ID | `service` values (as stored, `es` — field is not localized so there is only one value per row) |
|---|---|
| 15 | "SEO técnico", "Estrategia de contenido", "Optimización on-page" |
| 16 | "SEO técnico", "Contenido educativo de salud", "SEO local" |
| 17 | "SEO técnico", "SEO local", "Optimización on-page" |
| 18 | "SEO técnico", "Estrategia de contenido legal", "SEO local" |
| 19 | "SEO técnico", "Optimización on-page", "Estrategia de contenido de producto" |
| 20 | "SEO técnico", "Estrategia de contenido legal", "Optimización on-page" |
| 14 | (empty array — no services rows on this doc) |

## Reasoning

These are **not** proper nouns or brand terms. They are short descriptive Spanish service-category labels — "technical SEO", "content strategy", "on-page optimization", "local SEO", "health-content strategy", "legal-content strategy", "product-content strategy" — every one of which has a natural, expected English equivalent that an EN-locale visitor would read as translated copy, not as an untranslated tag.

This is the opposite case from the comparison analog cited in `29-PATTERNS.md` and the field audit doc, `Websites.stack[].tag` (values like "Next.js", "Payload", "PostgreSQL" — real proper-noun brand/technology names that must NOT be translated, correctly left non-localized per Phase 38 CONTEXT.md). `services[].service` values contain zero proper nouns; they are ordinary editorial phrases describing a type of work performed, structurally identical in kind to `TestimonialsCarousel.title` (a plain string that should read differently per locale) rather than to `stack[].tag`.

Conclusion: treat `CaseStudies.services[].service` the same as `TestimonialsCarousel.title` — it needs `localized: true` plus a backfill-then-drop-column migration copying today's (Spanish) values into both `es` and `en` locale rows before the shared column is dropped, so no existing content is lost. EN values can then be translated as real copy work in Phase 30/31, but the schema fix (this migration) must land first so the field has somewhere to hold a distinct EN value at all.

## Handoff to Plan 29-04

**Current field config** (`src/collections/CaseStudies/index.ts`, lines 36-39):
```typescript
{
  name: 'services',
  type: 'array',
  fields: [{ name: 'service', type: 'text', required: true }],
},
```

**Required config change:**
```typescript
{
  name: 'services',
  type: 'array',
  fields: [{ name: 'service', type: 'text', required: true, localized: true }],
},
```

**Migration pattern to replicate exactly:** `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` (the corrected post-incident backfill-then-drop pattern, also the pattern Plan 29-03 applies to `TestimonialsCarousel.title`). Generate with `payload migrate:create`, read the generated SQL in full, insert an explicit `INSERT ... SELECT ... FROM <table>, unnest(ARRAY['es','en']) AS locale WHERE "service" IS NOT NULL` backfill into the new `_locales` table (for both the live `case_studies_services` array table and its `_v` versions shadow table) BEFORE any `DROP COLUMN`. Do not apply against the real Neon DB without Juan's named approval per CLAUDE.md Database Safety — this touches an existing populated column, it is not an additive migration.

**Existing data that must survive the backfill (from the live query above):** all 19 non-empty `service` rows across docs 15-20 (doc 14 has none, nothing to preserve there) must be copied verbatim into the `es` locale row, with `en` initially receiving the same Spanish string as a placeholder until Phase 30/31 translates it as real copy work.
