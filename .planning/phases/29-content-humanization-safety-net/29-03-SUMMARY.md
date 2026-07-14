---
phase: 29-content-humanization-safety-net
plan: 03
subsystem: database
tags: [payload, postgres, drizzle, migrations, localization, i18n]

requires:
  - phase: 19-cta-i18n-fix (or equivalent prior phase)
    provides: "Corrected backfill-then-drop migration pattern (src/migrations/20260712_202954_phase19_calltoaction_localized.ts) used as the exact template replicated here"
provides:
  - "TestimonialsCarousel.title field config with localized: true"
  - "Generated + manually-corrected backfill migration (src/migrations/20260714_200158.ts), reviewed but NOT applied"
affects: [30-content-rewrite, 31-content-rewrite, testimonials-carousel-block]

tech-stack:
  added: []
  patterns:
    - "Backfill-before-drop migration pattern: manually insert INSERT ... SELECT ... unnest(ARRAY['es','en']) before any generated DROP COLUMN when localizing a previously-shared column with existing data"

key-files:
  created:
    - src/migrations/20260714_200158.ts
    - src/migrations/20260714_200158.json
  modified:
    - src/blocks/TestimonialsCarousel/config.ts
    - src/migrations/index.ts

key-decisions:
  - "Migration generated via `payload migrate:create` and manually edited to insert backfill INSERTs before DROP COLUMN, mirroring the corrected Phase 19 CallToAction pattern exactly — Payload's auto-diff does not preserve data by default (confirmed, same behavior as the original 2026-07-12 incident)"
  - "Migration is NOT applied. Per CLAUDE.md Database Safety section, this plan is BLOCKED at Task 2 (checkpoint:decision, gate=blocking) pending Juan's explicit named approval before running `payload migrate` against the real Neon Postgres database"

requirements-completed: []  # VOICE-02 NOT yet complete — migration generated/reviewed but not applied; will mark complete only after Task 3 runs post-approval

# Metrics
duration: ~8min (Task 1 only; plan paused before Task 2/3)
completed: 2026-07-14
---

# Phase 29 Plan 03: TestimonialsCarousel.title Localization Migration Summary

**Field localized and backfill migration generated + corrected, but BLOCKED pending Juan's named approval before applying to production Neon Postgres — plan is NOT complete.**

## Performance

- **Duration:** ~8 min (Task 1 only)
- **Started:** 2026-07-14T20:00:00Z (approx)
- **Completed (Task 1 only):** 2026-07-14T20:03:15Z
- **Tasks:** 1/3 completed (Task 1 done, Task 2 blocking checkpoint reached, Task 3 not started)
- **Files modified:** 4 (config.ts, migrations/index.ts, + 2 new migration files)

## Accomplishments
- Added `localized: true` to `TestimonialsCarousel.title` field in `src/blocks/TestimonialsCarousel/config.ts`
- Ran `npx payload migrate:create`, generated migration at `src/migrations/20260714_200158.ts`
- Confirmed the auto-generated diff did NOT include a backfill INSERT before `DROP COLUMN "title"` — same gap as the original 2026-07-12 incident
- Manually inserted the backfill `INSERT ... SELECT ... FROM <table>, unnest(ARRAY['es','en']) AS locale WHERE "title" IS NOT NULL` for both the live table (`pages_blocks_testimonials_carousel`) and its `_v` (versions) shadow table (`_pages_v_blocks_testimonials_carousel`), placed immediately before the `DROP COLUMN` statements — mirroring the reference file `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` exactly
- Migration NOT applied — stopped at Task 2's blocking checkpoint per plan instructions and CLAUDE.md Database Safety section

## Task Commits

1. **Task 1: Localize the field and generate + verify the backfill migration (do NOT apply)** - `feaec7f` (feat)

Task 2 (checkpoint:decision, blocking) is AWAITING Juan's named approval — not yet resolved.
Task 3 (apply migration + regenerate types) NOT started — contingent on Task 2 approval.

**Plan metadata:** not yet committed — plan is incomplete pending approval.

## Files Created/Modified
- `src/blocks/TestimonialsCarousel/config.ts` - Added `localized: true` to the `title` field
- `src/migrations/20260714_200158.ts` - Generated + manually corrected backfill-then-drop migration (NOT applied)
- `src/migrations/20260714_200158.json` - Payload's schema snapshot paired with the migration
- `src/migrations/index.ts` - Auto-updated migration registry (includes this migration + an unrelated concurrent migration from a parallel plan run, `20260714_200220_phase29_casestudies_services_localized`, which is out of scope for this plan)

## Decisions Made
- Replicated the Phase 19 CallToAction backfill pattern exactly: `INSERT ... SELECT ... unnest(ARRAY['es','en'])` into the new `_locales` table for BOTH live and `_v` tables, placed before `DROP COLUMN`, for both `pages_blocks_testimonials_carousel` and `_pages_v_blocks_testimonials_carousel`
- Did NOT run `payload migrate` — per explicit plan instruction and CLAUDE.md Database Safety section, this requires Juan's named approval first
- Did NOT touch `src/collections/CaseStudies/index.ts`, which appeared modified in `git status` from a concurrent/parallel plan run (29-02, likely) — out of scope for this plan, left untouched and uncommitted by this task

## Deviations from Plan

None - plan executed exactly as written for Task 1. The plan explicitly anticipated that Payload's auto-generated diff would omit the backfill INSERT, and instructed manually adding it — this was followed precisely, not a deviation.

## Issues Encountered

**Concurrent migration state:** `src/migrations/index.ts` already contained a registry entry for `20260714_200220_phase29_casestudies_services_localized` (json + ts files present but untracked) when this plan ran `payload migrate:create` — evidence of a parallel/concurrent execution of a different plan (likely 29-02, CaseStudies.services investigation) touching the same generated registry file. This plan's commit only staged the files relevant to `TestimonialsCarousel.title` (config.ts, the new 20260714_200158 migration pair, and migrations/index.ts as regenerated) and left `src/collections/CaseStudies/index.ts` and the CaseStudies migration files untouched/uncommitted, since they belong to a different plan's scope.

## User Setup Required

None - no external service configuration required. This is a pending DATABASE APPROVAL, not external service setup — see "BLOCKING: Awaiting Juan's Approval" below.

## BLOCKING: Awaiting Juan's Approval

**This plan is NOT complete.** Task 2 (checkpoint:decision, `gate="blocking"`) requires Juan's explicit **named** approval before Task 3 can run `payload migrate` against the real production Neon Postgres database.

**Full generated + corrected migration file** (`src/migrations/20260714_200158.ts`):

```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_testimonials_carousel_locales" (
  	"title" varchar DEFAULT 'Testimonios',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_pages_v_blocks_testimonials_carousel_locales" (
  	"title" varchar DEFAULT 'Testimonios',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "pages_blocks_testimonials_carousel_locales" ADD CONSTRAINT "pages_blocks_testimonials_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_carousel_locales" ADD CONSTRAINT "_pages_v_blocks_testimonials_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials_carousel"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_blocks_testimonials_carousel_locales_locale_parent_id_" ON "pages_blocks_testimonials_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_testimonials_carousel_locales_locale_parent_" ON "_pages_v_blocks_testimonials_carousel_locales" USING btree ("_locale","_parent_id");

  -- Backfill: copy the existing (pre-localization) title into BOTH
  -- locale rows before dropping the shared column, so no copy is lost.
  -- 'es'/'en' come from CREATE TYPE "public"."_locales" AS ENUM('es', 'en')
  -- (see 20260709_201401_phase2_i18n_seo.ts).
  INSERT INTO "pages_blocks_testimonials_carousel_locales" ("title", "_locale", "_parent_id")
  SELECT "title", locale::"_locales", "id"
  FROM "pages_blocks_testimonials_carousel", unnest(ARRAY['es', 'en']) AS locale
  WHERE "title" IS NOT NULL;

  INSERT INTO "_pages_v_blocks_testimonials_carousel_locales" ("title", "_locale", "_parent_id")
  SELECT "title", locale::"_locales", "id"
  FROM "_pages_v_blocks_testimonials_carousel", unnest(ARRAY['es', 'en']) AS locale
  WHERE "title" IS NOT NULL;

  ALTER TABLE "pages_blocks_testimonials_carousel" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_testimonials_carousel" DROP COLUMN "title";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_testimonials_carousel_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_carousel_locales" CASCADE;
  ALTER TABLE "pages_blocks_testimonials_carousel" ADD COLUMN "title" varchar DEFAULT 'Testimonios';
  ALTER TABLE "_pages_v_blocks_testimonials_carousel" ADD COLUMN "title" varchar DEFAULT 'Testimonios';`)
}
```

**Pattern verification:** Compared line-by-line against `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` (the corrected post-incident Phase 19 pattern). Structure matches exactly:
1. `CREATE TABLE` for both the live `_locales` table and the `_v` (versions) `_locales` table ✅
2. Foreign key constraints + unique indexes on `(_locale, _parent_id)` for both ✅
3. Backfill `INSERT ... SELECT ... FROM <table>, unnest(ARRAY['es', 'en']) AS locale WHERE "title" IS NOT NULL` for BOTH live and `_v` tables, placed BEFORE any `DROP COLUMN` ✅
4. `DROP COLUMN "title"` only runs AFTER both backfill INSERTs ✅
5. `down()` correctly reverses: drops the new locale tables, re-adds the plain `title` column with its original default — matches reference `down()` structure ✅

**No concerns identified.** This migration follows the correct backfill-before-drop pattern and does not repeat the 2026-07-12 incident's data-loss bug.

**Next steps:**
1. Juan reads the migration SQL above (or the file at `src/migrations/20260714_200158.ts`)
2. Juan responds with explicit named approval (e.g., "Juan aprueba") to authorize Task 3, or rejects/requests changes
3. Only after named approval: run `npx payload migrate` (or `CI=true npx payload migrate` if non-interactive) to apply against the real Neon Postgres DB, then `npx payload generate:types` to regenerate `src/payload-types.ts`
4. Once Task 3 completes, update this SUMMARY, mark `VOICE-02` as complete in `requirements-completed`, and run the plan's final metadata commit / STATE.md updates

## Next Phase Readiness

Not ready — this plan is blocked pending Juan's approval. Do NOT advance STATE.md's plan counter or mark VOICE-02 complete until Task 3 has run successfully post-approval. Phase 30/31 content rewrite work touching TestimonialsCarousel should wait for this migration to be applied so `title` is safely per-locale editable.

---
*Phase: 29-content-humanization-safety-net*
*Status: BLOCKED — awaiting Juan's named approval (Task 2 checkpoint)*
