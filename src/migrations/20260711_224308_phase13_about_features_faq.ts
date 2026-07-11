import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_about_section_features_icon" AS ENUM('zap', 'monitor', 'code', 'trendingUp', 'shield', 'rocket', 'palette', 'lightbulb', 'target', 'layers', 'cpu', 'database', 'globe', 'search', 'settings', 'smartphone', 'server', 'lock', 'gauge', 'sparkles', 'wrench', 'lineChart', 'checkCircle', 'barChart');
  CREATE TYPE "public"."enum__pages_v_blocks_about_section_features_icon" AS ENUM('zap', 'monitor', 'code', 'trendingUp', 'shield', 'rocket', 'palette', 'lightbulb', 'target', 'layers', 'cpu', 'database', 'globe', 'search', 'settings', 'smartphone', 'server', 'lock', 'gauge', 'sparkles', 'wrench', 'lineChart', 'checkCircle', 'barChart');
  CREATE TABLE "pages_blocks_about_section_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_about_section_features_icon"
  );
  
  CREATE TABLE "pages_blocks_about_section_features_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_about_section_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_about_section_features_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_about_section_features_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_about_section" ADD COLUMN "cta_link" varchar;
  ALTER TABLE "pages_blocks_about_section_locales" ADD COLUMN "cta_text" varchar;
  ALTER TABLE "_pages_v_blocks_about_section" ADD COLUMN "cta_link" varchar;
  ALTER TABLE "_pages_v_blocks_about_section_locales" ADD COLUMN "cta_text" varchar;
  ALTER TABLE "pages_blocks_about_section_features" ADD CONSTRAINT "pages_blocks_about_section_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_about_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_section_features_locales" ADD CONSTRAINT "pages_blocks_about_section_features_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_about_section_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section_features" ADD CONSTRAINT "_pages_v_blocks_about_section_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_about_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section_features_locales" ADD CONSTRAINT "_pages_v_blocks_about_section_features_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_about_section_features"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_about_section_features_order_idx" ON "pages_blocks_about_section_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_section_features_parent_id_idx" ON "pages_blocks_about_section_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_about_section_features_locales_locale_parent_id" ON "pages_blocks_about_section_features_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_about_section_features_order_idx" ON "_pages_v_blocks_about_section_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_section_features_parent_id_idx" ON "_pages_v_blocks_about_section_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_about_section_features_locales_locale_parent" ON "_pages_v_blocks_about_section_features_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_about_section_features" CASCADE;
  DROP TABLE "pages_blocks_about_section_features_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_about_section_features" CASCADE;
  DROP TABLE "_pages_v_blocks_about_section_features_locales" CASCADE;
  ALTER TABLE "pages_blocks_about_section" DROP COLUMN "cta_link";
  ALTER TABLE "pages_blocks_about_section_locales" DROP COLUMN "cta_text";
  ALTER TABLE "_pages_v_blocks_about_section" DROP COLUMN "cta_link";
  ALTER TABLE "_pages_v_blocks_about_section_locales" DROP COLUMN "cta_text";
  DROP TYPE "public"."enum_pages_blocks_about_section_features_icon";
  DROP TYPE "public"."enum__pages_v_blocks_about_section_features_icon";`)
}
