import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "case_studies_lessons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_lessons_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_lessons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_lessons_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "case_studies_lessons" ADD CONSTRAINT "case_studies_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_lessons_locales" ADD CONSTRAINT "case_studies_lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_lessons" ADD CONSTRAINT "_case_studies_v_version_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_lessons_locales" ADD CONSTRAINT "_case_studies_v_version_lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_lessons_order_idx" ON "case_studies_lessons" USING btree ("_order");
  CREATE INDEX "case_studies_lessons_parent_id_idx" ON "case_studies_lessons" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_lessons_locales_locale_parent_id_unique" ON "case_studies_lessons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_version_lessons_order_idx" ON "_case_studies_v_version_lessons" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_lessons_parent_id_idx" ON "_case_studies_v_version_lessons" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_lessons_locales_locale_parent_id_uni" ON "_case_studies_v_version_lessons_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "case_studies_lessons" CASCADE;
  DROP TABLE "case_studies_lessons_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_lessons" CASCADE;
  DROP TABLE "_case_studies_v_version_lessons_locales" CASCADE;`)
}
