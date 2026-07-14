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
