import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_call_to_action_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_call_to_action_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_call_to_action_locales" ADD CONSTRAINT "pages_blocks_call_to_action_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_call_to_action"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_call_to_action_locales" ADD CONSTRAINT "_pages_v_blocks_call_to_action_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_call_to_action"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_blocks_call_to_action_locales_locale_parent_id_unique" ON "pages_blocks_call_to_action_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_call_to_action_locales_locale_parent_id_uniq" ON "_pages_v_blocks_call_to_action_locales" USING btree ("_locale","_parent_id");

  -- Backfill: copy the existing (pre-localization) rich_text into BOTH
  -- locale rows before dropping the shared column, so no CTA copy is lost.
  -- 'es'/'en' come from CREATE TYPE "public"."_locales" AS ENUM('es', 'en')
  -- (see 20260709_201401_phase2_i18n_seo.ts).
  INSERT INTO "pages_blocks_call_to_action_locales" ("rich_text", "_locale", "_parent_id")
  SELECT "rich_text", locale::"_locales", "id"
  FROM "pages_blocks_call_to_action", unnest(ARRAY['es', 'en']) AS locale
  WHERE "rich_text" IS NOT NULL;

  INSERT INTO "_pages_v_blocks_call_to_action_locales" ("rich_text", "_locale", "_parent_id")
  SELECT "rich_text", locale::"_locales", "id"
  FROM "_pages_v_blocks_call_to_action", unnest(ARRAY['es', 'en']) AS locale
  WHERE "rich_text" IS NOT NULL;

  ALTER TABLE "pages_blocks_call_to_action" DROP COLUMN "rich_text";
  ALTER TABLE "_pages_v_blocks_call_to_action" DROP COLUMN "rich_text";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_call_to_action_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_call_to_action_locales" CASCADE;
  ALTER TABLE "pages_blocks_call_to_action" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "_pages_v_blocks_call_to_action" ADD COLUMN "rich_text" jsonb;`)
}
