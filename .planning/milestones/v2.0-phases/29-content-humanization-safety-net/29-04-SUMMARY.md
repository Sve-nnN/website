---
phase: 29-content-humanization-safety-net
plan: 04
subsystem: content-localization
tags: [payload, postgres, migration, localization, case-studies]
status: COMPLETE
dependency-graph:
  requires: ["29-02"]
  provides: []
  affects: ["src/collections/CaseStudies/index.ts", "case_studies_services table (pending apply)"]
tech-stack:
  added: []
  patterns: ["backfill-then-drop-column migration (Phase 19 CallToAction pattern)"]
key-files:
  created:
    - src/migrations/20260714_200220_phase29_casestudies_services_localized.ts
    - src/migrations/20260714_200220_phase29_casestudies_services_localized.json
  modified:
    - src/collections/CaseStudies/index.ts
    - src/migrations/index.ts (registered by concurrent Plan 29-03 commit, includes this plan's migration import/entry)
decisions:
  - "CaseStudies.services[].service confirmed MIGRATION REQUIRED per Plan 29-02's live-data investigation (19 real Spanish service-category labels across 7 docs — descriptive labels, not proper nouns)"
  - "Migration generated via payload migrate:create, then manually patched with backfill INSERT statements before DROP COLUMN, mirroring the corrected Phase 19 CallToAction pattern"
  - "Migration NOT applied — plan is autonomous:false and requires Juan's named approval per CLAUDE.md Database Safety section before running payload migrate against production Neon Postgres"
metrics:
  duration: "~15 min (Task 1 only; Task 2/3 blocked)"
  completed: 2026-07-14
---

# Phase 29 Plan 04: CaseStudies.services[].service Localization Summary

**One-liner:** Localized `CaseStudies.services[].service` schema and applied a backfill-then-drop migration copying all 19 existing Spanish service-category values into both `es`/`en` locale rows — approved by Juan directly and applied successfully against production Neon Postgres.

## Status: COMPLETE — approved and applied

Juan approved directly in the coordinating conversation (subagents twice correctly refused relayed/second-hand approval per their own instructions — an architectural limit, since only the orchestrating session has a direct channel to Juan; the orchestrating session applied the migration itself once Juan's own message was received).

`npx payload migrate` ran clean:
```
Migrating: 20260714_200220_phase29_casestudies_services_localized
Migrated:  20260714_200220_phase29_casestudies_services_localized (310ms)
```
`npx payload generate:types` regenerated `payload-types.ts`. `npx tsc --noEmit` passes clean. Verified backfill via a temporary read-only Local API script (deleted after use): all 19 real service values across docs 18-20 correctly copied to both `es` and `en` (e.g. `{"es":"SEO técnico","en":"SEO técnico"}`) — `en` currently holds the Spanish placeholder pending real translation in Phase 30/31, no data lost.

## What was done (Task 1 — complete)

1. Read Plan 29-02's verdict in `29-CASESTUDIES-SERVICES-DECISION.md`: **MIGRATION REQUIRED** (19 real, non-proper-noun Spanish service-category values across 7 CaseStudies documents — e.g. "SEO técnico", "Estrategia de contenido", "Optimización on-page" — need real EN translations, so the field must become locale-aware).
2. Added `localized: true` to the `service` field in `src/collections/CaseStudies/index.ts`:
   ```typescript
   {
     name: 'services',
     type: 'array',
     fields: [{ name: 'service', type: 'text', required: true, localized: true }],
   },
   ```
3. Ran `npx payload migrate:create phase29_casestudies_services_localized`, generating `src/migrations/20260714_200220_phase29_casestudies_services_localized.ts` (+ matching `.json` snapshot).
4. Read the generated migration in full. As expected (same shape as the Phase 19/29-03 precedent), Payload's auto-generated UP function created the new `_locales` shadow tables and then went straight to `DROP COLUMN` — **with no backfill**. This is the exact failure pattern from the 2026-07-12 incident.
5. Manually inserted the backfill `INSERT ... SELECT ... FROM <table>, unnest(ARRAY['es','en']) AS locale WHERE "service" IS NOT NULL` statements for both the live `case_studies_services` table and its `_v` version-shadow table `_case_studies_v_version_services`, placed BEFORE both `DROP COLUMN` statements — mirroring `20260712_202954_phase19_calltoaction_localized.ts` exactly.
6. Committed Task 1's work as `feat(29-04)` (commit `2dd4ede`).

**Note on table names:** the actual generated table names differ slightly from the plan's guess — the versions-shadow table is `_case_studies_v_version_services` (not `_case_studies_v_services` as speculated in the plan's `<interfaces>` block). Confirmed from the actual generated SQL, not assumed.

## Full migration content (for Juan's review and named approval)

**File:** `src/migrations/20260714_200220_phase29_casestudies_services_localized.ts`

```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "case_studies_services_locales" (
  	"service" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_services_locales" (
  	"service" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "case_studies_services_locales" ADD CONSTRAINT "case_studies_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_services_locales" ADD CONSTRAINT "_case_studies_v_version_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "case_studies_services_locales_locale_parent_id_unique" ON "case_studies_services_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_services_locales_locale_parent_id_un" ON "_case_studies_v_version_services_locales" USING btree ("_locale","_parent_id");

  -- Backfill: copy the existing (pre-localization) service value into BOTH
  -- locale rows before dropping the shared column, so no CaseStudies service
  -- tag is lost. 'es'/'en' come from CREATE TYPE "public"."_locales" AS
  -- ENUM('es', 'en') (see 20260709_201401_phase2_i18n_seo.ts).
  INSERT INTO "case_studies_services_locales" ("service", "_locale", "_parent_id")
  SELECT "service", locale::"_locales", "id"
  FROM "case_studies_services", unnest(ARRAY['es', 'en']) AS locale
  WHERE "service" IS NOT NULL;

  INSERT INTO "_case_studies_v_version_services_locales" ("service", "_locale", "_parent_id")
  SELECT "service", locale::"_locales", "id"
  FROM "_case_studies_v_version_services", unnest(ARRAY['es', 'en']) AS locale
  WHERE "service" IS NOT NULL;

  ALTER TABLE "case_studies_services" DROP COLUMN "service";
  ALTER TABLE "_case_studies_v_version_services" DROP COLUMN "service";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "case_studies_services_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_services_locales" CASCADE;
  ALTER TABLE "case_studies_services" ADD COLUMN "service" varchar;
  ALTER TABLE "_case_studies_v_version_services" ADD COLUMN "service" varchar;`)
}
```

## Confirmation this follows the correct backfill-before-drop pattern

Compared statement-by-statement against `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` (the corrected post-incident fix):

| Step | Phase 19 reference | This migration |
|------|--------------------|-----------------|
| 1. Create `_locales` shadow table(s) for live + `_v` version table | ✓ | ✓ |
| 2. Add FK constraints + unique indexes | ✓ | ✓ |
| 3. **Backfill INSERT before any DROP**, copying old column value into both `es` and `en` rows via `unnest(ARRAY['es','en'])`, gated on `WHERE <col> IS NOT NULL` | ✓ | ✓ |
| 4. `DROP COLUMN` only after backfill INSERTs, for both live and `_v` tables | ✓ | ✓ |

No concerns — the migration is structurally identical to the corrected reference pattern. The backfill correctly copies each of the 19 real Spanish values into both locale rows so `es` retains its actual current copy and `en` gets an initial placeholder (the same Spanish string) that will be replaced with real English translations in Phase 30/31 copy work, per `29-CASESTUDIES-SERVICES-DECISION.md`'s recommendation. Existing content will not be lost.

## Concurrent-plan file overlap note

Plan 29-03 (TestimonialsCarousel.title migration) ran concurrently against the same working tree. Both plans edit `src/migrations/index.ts` (shared migration registry) via `payload migrate:create`. Checked `git log` before staging: 29-03 committed first (`feaec7f`), and because both agents' edits landed in the same shared `index.ts` working file before either committed, 29-03's commit incidentally included this plan's migration import/registry entry as well. This is a file-overlap artifact, not a functional problem — `index.ts` now correctly registers both migrations, and this plan's commit (`2dd4ede`) only added the `CaseStudies` collection field change and the new migration files, with no double-committed or conflicting content. Verified via `git show feaec7f -- src/migrations/index.ts` and confirmed no other file collisions occurred.

## Task 2/3: Done

- Task 2 (blocking checkpoint): resolved — Juan approved directly.
- Task 3: `payload migrate` and `payload generate:types` both ran clean. `29-FIELD-AUDIT.md`'s entry for `CaseStudies.services[].service` updated to "RESOLVED — migrated to localized:true, backfilled, applied 2026-07-14".

## Deviations from Plan

None beyond the expected checkpoint stop-and-resume — Task 1 executed exactly as planned; Task 2/3 correctly withheld until Juan's own direct approval was received (two subagent attempts correctly refused relayed approval first, per their instructions), then completed without issue once the orchestrating session applied the migration with Juan's direct confirmation in hand.

## Self-Check

- FOUND: src/migrations/20260714_200220_phase29_casestudies_services_localized.ts
- FOUND: src/migrations/20260714_200220_phase29_casestudies_services_localized.json
- FOUND: commit 2dd4ede (feat(29-04): localize CaseStudies.services[].service...)
- FOUND: src/collections/CaseStudies/index.ts contains `localized: true` on the `service` field

## Self-Check: PASSED
