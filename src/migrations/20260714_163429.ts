import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_websites_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__websites_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__websites_v_published_locale" AS ENUM('es', 'en');
  CREATE TABLE "websites_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "websites_highlights_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "websites_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "websites_challenges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "websites_challenges_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "websites_screenshots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "websites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"lighthouse_performance" numeric,
  	"lighthouse_accessibility" numeric,
  	"lighthouse_best_practices" numeric,
  	"lighthouse_seo" numeric,
  	"lighthouse_captured_at" timestamp(3) with time zone,
  	"client_id" integer,
  	"related_case_study_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_websites_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "websites_locales" (
  	"title" varchar,
  	"role" varchar,
  	"industry" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_websites_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_websites_v_version_highlights_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_websites_v_version_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_websites_v_version_challenges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_websites_v_version_challenges_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_websites_v_version_screenshots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_websites_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_year" numeric,
  	"version_lighthouse_performance" numeric,
  	"version_lighthouse_accessibility" numeric,
  	"version_lighthouse_best_practices" numeric,
  	"version_lighthouse_seo" numeric,
  	"version_lighthouse_captured_at" timestamp(3) with time zone,
  	"version_client_id" integer,
  	"version_related_case_study_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__websites_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__websites_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_websites_v_locales" (
  	"version_title" varchar,
  	"version_role" varchar,
  	"version_industry" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "websites_id" integer;
  ALTER TABLE "websites_highlights" ADD CONSTRAINT "websites_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "websites_highlights_locales" ADD CONSTRAINT "websites_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "websites_stack" ADD CONSTRAINT "websites_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "websites_challenges" ADD CONSTRAINT "websites_challenges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "websites_challenges_locales" ADD CONSTRAINT "websites_challenges_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites_challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "websites_screenshots" ADD CONSTRAINT "websites_screenshots_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "websites_screenshots" ADD CONSTRAINT "websites_screenshots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "websites" ADD CONSTRAINT "websites_client_id_clientes_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "websites" ADD CONSTRAINT "websites_related_case_study_id_case_studies_id_fk" FOREIGN KEY ("related_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "websites_locales" ADD CONSTRAINT "websites_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "websites_locales" ADD CONSTRAINT "websites_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v_version_highlights" ADD CONSTRAINT "_websites_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v_version_highlights_locales" ADD CONSTRAINT "_websites_v_version_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v_version_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v_version_stack" ADD CONSTRAINT "_websites_v_version_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v_version_challenges" ADD CONSTRAINT "_websites_v_version_challenges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v_version_challenges_locales" ADD CONSTRAINT "_websites_v_version_challenges_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v_version_challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v_version_screenshots" ADD CONSTRAINT "_websites_v_version_screenshots_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_websites_v_version_screenshots" ADD CONSTRAINT "_websites_v_version_screenshots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_websites_v" ADD CONSTRAINT "_websites_v_parent_id_websites_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_websites_v" ADD CONSTRAINT "_websites_v_version_client_id_clientes_id_fk" FOREIGN KEY ("version_client_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_websites_v" ADD CONSTRAINT "_websites_v_version_related_case_study_id_case_studies_id_fk" FOREIGN KEY ("version_related_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_websites_v_locales" ADD CONSTRAINT "_websites_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_websites_v_locales" ADD CONSTRAINT "_websites_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_websites_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "websites_highlights_order_idx" ON "websites_highlights" USING btree ("_order");
  CREATE INDEX "websites_highlights_parent_id_idx" ON "websites_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "websites_highlights_locales_locale_parent_id_unique" ON "websites_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "websites_stack_order_idx" ON "websites_stack" USING btree ("_order");
  CREATE INDEX "websites_stack_parent_id_idx" ON "websites_stack" USING btree ("_parent_id");
  CREATE INDEX "websites_challenges_order_idx" ON "websites_challenges" USING btree ("_order");
  CREATE INDEX "websites_challenges_parent_id_idx" ON "websites_challenges" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "websites_challenges_locales_locale_parent_id_unique" ON "websites_challenges_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "websites_screenshots_order_idx" ON "websites_screenshots" USING btree ("_order");
  CREATE INDEX "websites_screenshots_parent_id_idx" ON "websites_screenshots" USING btree ("_parent_id");
  CREATE INDEX "websites_screenshots_image_idx" ON "websites_screenshots" USING btree ("image_id");
  CREATE INDEX "websites_client_idx" ON "websites" USING btree ("client_id");
  CREATE INDEX "websites_related_case_study_idx" ON "websites" USING btree ("related_case_study_id");
  CREATE UNIQUE INDEX "websites_slug_idx" ON "websites" USING btree ("slug");
  CREATE INDEX "websites_updated_at_idx" ON "websites" USING btree ("updated_at");
  CREATE INDEX "websites_created_at_idx" ON "websites" USING btree ("created_at");
  CREATE INDEX "websites__status_idx" ON "websites" USING btree ("_status");
  CREATE INDEX "websites_meta_meta_image_idx" ON "websites_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "websites_locales_locale_parent_id_unique" ON "websites_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_websites_v_version_highlights_order_idx" ON "_websites_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_websites_v_version_highlights_parent_id_idx" ON "_websites_v_version_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_websites_v_version_highlights_locales_locale_parent_id_uniq" ON "_websites_v_version_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_websites_v_version_stack_order_idx" ON "_websites_v_version_stack" USING btree ("_order");
  CREATE INDEX "_websites_v_version_stack_parent_id_idx" ON "_websites_v_version_stack" USING btree ("_parent_id");
  CREATE INDEX "_websites_v_version_challenges_order_idx" ON "_websites_v_version_challenges" USING btree ("_order");
  CREATE INDEX "_websites_v_version_challenges_parent_id_idx" ON "_websites_v_version_challenges" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_websites_v_version_challenges_locales_locale_parent_id_uniq" ON "_websites_v_version_challenges_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_websites_v_version_screenshots_order_idx" ON "_websites_v_version_screenshots" USING btree ("_order");
  CREATE INDEX "_websites_v_version_screenshots_parent_id_idx" ON "_websites_v_version_screenshots" USING btree ("_parent_id");
  CREATE INDEX "_websites_v_version_screenshots_image_idx" ON "_websites_v_version_screenshots" USING btree ("image_id");
  CREATE INDEX "_websites_v_parent_idx" ON "_websites_v" USING btree ("parent_id");
  CREATE INDEX "_websites_v_version_version_client_idx" ON "_websites_v" USING btree ("version_client_id");
  CREATE INDEX "_websites_v_version_version_related_case_study_idx" ON "_websites_v" USING btree ("version_related_case_study_id");
  CREATE INDEX "_websites_v_version_version_slug_idx" ON "_websites_v" USING btree ("version_slug");
  CREATE INDEX "_websites_v_version_version_updated_at_idx" ON "_websites_v" USING btree ("version_updated_at");
  CREATE INDEX "_websites_v_version_version_created_at_idx" ON "_websites_v" USING btree ("version_created_at");
  CREATE INDEX "_websites_v_version_version__status_idx" ON "_websites_v" USING btree ("version__status");
  CREATE INDEX "_websites_v_created_at_idx" ON "_websites_v" USING btree ("created_at");
  CREATE INDEX "_websites_v_updated_at_idx" ON "_websites_v" USING btree ("updated_at");
  CREATE INDEX "_websites_v_snapshot_idx" ON "_websites_v" USING btree ("snapshot");
  CREATE INDEX "_websites_v_published_locale_idx" ON "_websites_v" USING btree ("published_locale");
  CREATE INDEX "_websites_v_latest_idx" ON "_websites_v" USING btree ("latest");
  CREATE INDEX "_websites_v_autosave_idx" ON "_websites_v" USING btree ("autosave");
  CREATE INDEX "_websites_v_version_meta_version_meta_image_idx" ON "_websites_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_websites_v_locales_locale_parent_id_unique" ON "_websites_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_websites_fk" FOREIGN KEY ("websites_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_websites_id_idx" ON "payload_locked_documents_rels" USING btree ("websites_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "websites_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites_highlights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites_challenges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites_challenges_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites_screenshots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "websites_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_version_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_version_highlights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_version_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_version_challenges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_version_challenges_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_version_screenshots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_websites_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "websites_highlights" CASCADE;
  DROP TABLE "websites_highlights_locales" CASCADE;
  DROP TABLE "websites_stack" CASCADE;
  DROP TABLE "websites_challenges" CASCADE;
  DROP TABLE "websites_challenges_locales" CASCADE;
  DROP TABLE "websites_screenshots" CASCADE;
  DROP TABLE "websites" CASCADE;
  DROP TABLE "websites_locales" CASCADE;
  DROP TABLE "_websites_v_version_highlights" CASCADE;
  DROP TABLE "_websites_v_version_highlights_locales" CASCADE;
  DROP TABLE "_websites_v_version_stack" CASCADE;
  DROP TABLE "_websites_v_version_challenges" CASCADE;
  DROP TABLE "_websites_v_version_challenges_locales" CASCADE;
  DROP TABLE "_websites_v_version_screenshots" CASCADE;
  DROP TABLE "_websites_v" CASCADE;
  DROP TABLE "_websites_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_websites_fk";
  
  DROP INDEX "payload_locked_documents_rels_websites_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "websites_id";
  DROP TYPE "public"."enum_websites_status";
  DROP TYPE "public"."enum__websites_v_version_status";
  DROP TYPE "public"."enum__websites_v_published_locale";`)
}
