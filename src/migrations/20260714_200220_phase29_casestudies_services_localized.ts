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
