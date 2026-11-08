import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_services_items_icon" AS ENUM('search', 'code', 'server', 'gauge', 'sparkles', 'list', 'wrench', 'chart');
  CREATE TYPE "public"."enum_home_page_services_items_service_page" AS ENUM('seo-technical-audit', 'seo-consulting', 'fullstack-development', 'ai-seo-geo');
  CREATE TYPE "public"."enum_home_page_process_steps_icon" AS ENUM('search', 'code', 'server', 'gauge', 'sparkles', 'list', 'wrench', 'chart');
  CREATE TYPE "public"."enum_home_page_contact_info_rows_icon" AS ENUM('clock', 'map-pin', 'globe');
  CREATE TYPE "public"."enum_about_page_hero_chips_icon" AS ENUM('map-pin', 'globe');
  CREATE TABLE "home_page_vitals_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"good_pct" numeric,
  	"mid_pct" numeric,
  	"poor_pct" numeric,
  	"marker_pct" numeric
  );
  
  CREATE TABLE "home_page_vitals_items_locales" (
  	"name" varchar,
  	"desc" varchar,
  	"value" varchar,
  	"label" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_services_items_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "home_page_services_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_page_services_items_icon",
  	"service_page" "enum_home_page_services_items_service_page"
  );
  
  CREATE TABLE "home_page_services_items_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_page_process_steps_icon"
  );
  
  CREATE TABLE "home_page_process_steps_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_about_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_about_paragraphs_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_about_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_about_chips_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_about_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "home_page_about_photos_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_contact_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_contact_steps_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_contact_info_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_page_contact_info_rows_icon"
  );
  
  CREATE TABLE "home_page_contact_info_rows_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_cta_href" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"hero_eyebrow" varchar,
  	"hero_title_line1" varchar,
  	"hero_title_line2" varchar,
  	"hero_lead" varchar,
  	"hero_cta_label" varchar,
  	"hero_stat_value" varchar,
  	"hero_stat_caption" varchar,
  	"tagline" varchar,
  	"vitals_title" varchar,
  	"vitals_lead" varchar,
  	"vitals_measurement_note" varchar,
  	"services_title" varchar,
  	"services_lead" varchar,
  	"services_cta_label" varchar,
  	"cases_title" varchar,
  	"cases_lead" varchar,
  	"cases_cta_label" varchar,
  	"cases_metric_suffix" varchar,
  	"cases_note" varchar,
  	"process_title" varchar,
  	"sites_title" varchar,
  	"sites_cta_label" varchar,
  	"sites_note" varchar,
  	"about_title" varchar,
  	"about_seo_label" varchar,
  	"about_dev_label" varchar,
  	"testimonials_title" varchar,
  	"faq_title" varchar,
  	"cta_title" varchar,
  	"cta_lead" varchar,
  	"contact_steps_title" varchar,
  	"contact_faq_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "about_page_hero_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_about_page_hero_chips_icon"
  );
  
  CREATE TABLE "about_page_hero_chips_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_specialties_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "about_page_specialties_items_locales" (
  	"title" varchar,
  	"detail" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_experience_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"current" boolean DEFAULT false,
  	"link_href" varchar
  );
  
  CREATE TABLE "about_page_experience_stages_locales" (
  	"when" varchar,
  	"role" varchar,
  	"org" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_photo_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_page_locales" (
  	"hero_eyebrow" varchar,
  	"hero_lead" varchar,
  	"bio_title" varchar,
  	"counters_seo_label" varchar,
  	"counters_dev_label" varchar,
  	"counters_years_label" varchar,
  	"specialties_title" varchar,
  	"experience_title" varchar,
  	"experience_lead" varchar,
  	"education_title" varchar,
  	"talks_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "groups_tools" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_groups_v_tools" ADD COLUMN "logo_id" integer;
  ALTER TABLE "clientes" ADD COLUMN "on_dark" boolean DEFAULT false;
  ALTER TABLE "home_page_vitals_items" ADD CONSTRAINT "home_page_vitals_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_vitals_items_locales" ADD CONSTRAINT "home_page_vitals_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_vitals_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_services_items_tags" ADD CONSTRAINT "home_page_services_items_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_services_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_services_items" ADD CONSTRAINT "home_page_services_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_services_items_locales" ADD CONSTRAINT "home_page_services_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_services_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_process_steps" ADD CONSTRAINT "home_page_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_process_steps_locales" ADD CONSTRAINT "home_page_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_paragraphs" ADD CONSTRAINT "home_page_about_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_paragraphs_locales" ADD CONSTRAINT "home_page_about_paragraphs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_about_paragraphs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_chips" ADD CONSTRAINT "home_page_about_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_chips_locales" ADD CONSTRAINT "home_page_about_chips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_about_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_photos" ADD CONSTRAINT "home_page_about_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_about_photos" ADD CONSTRAINT "home_page_about_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_photos_locales" ADD CONSTRAINT "home_page_about_photos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_about_photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_faq_items" ADD CONSTRAINT "home_page_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_faq_items_locales" ADD CONSTRAINT "home_page_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_contact_steps" ADD CONSTRAINT "home_page_contact_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_contact_steps_locales" ADD CONSTRAINT "home_page_contact_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_contact_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_contact_info_rows" ADD CONSTRAINT "home_page_contact_info_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_contact_info_rows_locales" ADD CONSTRAINT "home_page_contact_info_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_contact_info_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_hero_chips" ADD CONSTRAINT "about_page_hero_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_hero_chips_locales" ADD CONSTRAINT "about_page_hero_chips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_hero_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_specialties_items" ADD CONSTRAINT "about_page_specialties_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_specialties_items_locales" ADD CONSTRAINT "about_page_specialties_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_specialties_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_experience_stages" ADD CONSTRAINT "about_page_experience_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_experience_stages_locales" ADD CONSTRAINT "about_page_experience_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_experience_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_hero_photo_id_media_id_fk" FOREIGN KEY ("hero_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_locales" ADD CONSTRAINT "about_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_vitals_items_order_idx" ON "home_page_vitals_items" USING btree ("_order");
  CREATE INDEX "home_page_vitals_items_parent_id_idx" ON "home_page_vitals_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_vitals_items_locales_locale_parent_id_unique" ON "home_page_vitals_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_services_items_tags_order_idx" ON "home_page_services_items_tags" USING btree ("_order");
  CREATE INDEX "home_page_services_items_tags_parent_id_idx" ON "home_page_services_items_tags" USING btree ("_parent_id");
  CREATE INDEX "home_page_services_items_order_idx" ON "home_page_services_items" USING btree ("_order");
  CREATE INDEX "home_page_services_items_parent_id_idx" ON "home_page_services_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_services_items_locales_locale_parent_id_unique" ON "home_page_services_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_process_steps_order_idx" ON "home_page_process_steps" USING btree ("_order");
  CREATE INDEX "home_page_process_steps_parent_id_idx" ON "home_page_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_process_steps_locales_locale_parent_id_unique" ON "home_page_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_about_paragraphs_order_idx" ON "home_page_about_paragraphs" USING btree ("_order");
  CREATE INDEX "home_page_about_paragraphs_parent_id_idx" ON "home_page_about_paragraphs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_about_paragraphs_locales_locale_parent_id_unique" ON "home_page_about_paragraphs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_about_chips_order_idx" ON "home_page_about_chips" USING btree ("_order");
  CREATE INDEX "home_page_about_chips_parent_id_idx" ON "home_page_about_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_about_chips_locales_locale_parent_id_unique" ON "home_page_about_chips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_about_photos_order_idx" ON "home_page_about_photos" USING btree ("_order");
  CREATE INDEX "home_page_about_photos_parent_id_idx" ON "home_page_about_photos" USING btree ("_parent_id");
  CREATE INDEX "home_page_about_photos_image_idx" ON "home_page_about_photos" USING btree ("image_id");
  CREATE UNIQUE INDEX "home_page_about_photos_locales_locale_parent_id_unique" ON "home_page_about_photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_faq_items_order_idx" ON "home_page_faq_items" USING btree ("_order");
  CREATE INDEX "home_page_faq_items_parent_id_idx" ON "home_page_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_faq_items_locales_locale_parent_id_unique" ON "home_page_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_contact_steps_order_idx" ON "home_page_contact_steps" USING btree ("_order");
  CREATE INDEX "home_page_contact_steps_parent_id_idx" ON "home_page_contact_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_contact_steps_locales_locale_parent_id_unique" ON "home_page_contact_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_contact_info_rows_order_idx" ON "home_page_contact_info_rows" USING btree ("_order");
  CREATE INDEX "home_page_contact_info_rows_parent_id_idx" ON "home_page_contact_info_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_contact_info_rows_locales_locale_parent_id_unique" ON "home_page_contact_info_rows_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_hero_chips_order_idx" ON "about_page_hero_chips" USING btree ("_order");
  CREATE INDEX "about_page_hero_chips_parent_id_idx" ON "about_page_hero_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_hero_chips_locales_locale_parent_id_unique" ON "about_page_hero_chips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_specialties_items_order_idx" ON "about_page_specialties_items" USING btree ("_order");
  CREATE INDEX "about_page_specialties_items_parent_id_idx" ON "about_page_specialties_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_specialties_items_locales_locale_parent_id_unique" ON "about_page_specialties_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_experience_stages_order_idx" ON "about_page_experience_stages" USING btree ("_order");
  CREATE INDEX "about_page_experience_stages_parent_id_idx" ON "about_page_experience_stages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_experience_stages_locales_locale_parent_id_unique" ON "about_page_experience_stages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_hero_hero_photo_idx" ON "about_page" USING btree ("hero_photo_id");
  CREATE UNIQUE INDEX "about_page_locales_locale_parent_id_unique" ON "about_page_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "groups_tools" ADD CONSTRAINT "groups_tools_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v_tools" ADD CONSTRAINT "_groups_v_tools_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "groups_tools_logo_idx" ON "groups_tools" USING btree ("logo_id");
  CREATE INDEX "_groups_v_tools_logo_idx" ON "_groups_v_tools" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_vitals_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_vitals_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_services_items_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_services_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_services_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_process_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_paragraphs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_paragraphs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_chips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_photos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_contact_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_contact_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_contact_info_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_contact_info_rows_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_hero_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_hero_chips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_specialties_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_specialties_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_experience_stages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_experience_stages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_page_vitals_items" CASCADE;
  DROP TABLE "home_page_vitals_items_locales" CASCADE;
  DROP TABLE "home_page_services_items_tags" CASCADE;
  DROP TABLE "home_page_services_items" CASCADE;
  DROP TABLE "home_page_services_items_locales" CASCADE;
  DROP TABLE "home_page_process_steps" CASCADE;
  DROP TABLE "home_page_process_steps_locales" CASCADE;
  DROP TABLE "home_page_about_paragraphs" CASCADE;
  DROP TABLE "home_page_about_paragraphs_locales" CASCADE;
  DROP TABLE "home_page_about_chips" CASCADE;
  DROP TABLE "home_page_about_chips_locales" CASCADE;
  DROP TABLE "home_page_about_photos" CASCADE;
  DROP TABLE "home_page_about_photos_locales" CASCADE;
  DROP TABLE "home_page_faq_items" CASCADE;
  DROP TABLE "home_page_faq_items_locales" CASCADE;
  DROP TABLE "home_page_contact_steps" CASCADE;
  DROP TABLE "home_page_contact_steps_locales" CASCADE;
  DROP TABLE "home_page_contact_info_rows" CASCADE;
  DROP TABLE "home_page_contact_info_rows_locales" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "about_page_hero_chips" CASCADE;
  DROP TABLE "about_page_hero_chips_locales" CASCADE;
  DROP TABLE "about_page_specialties_items" CASCADE;
  DROP TABLE "about_page_specialties_items_locales" CASCADE;
  DROP TABLE "about_page_experience_stages" CASCADE;
  DROP TABLE "about_page_experience_stages_locales" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "about_page_locales" CASCADE;
  ALTER TABLE "groups_tools" DROP CONSTRAINT "groups_tools_logo_id_media_id_fk";
  
  ALTER TABLE "_groups_v_tools" DROP CONSTRAINT "_groups_v_tools_logo_id_media_id_fk";
  
  DROP INDEX "groups_tools_logo_idx";
  DROP INDEX "_groups_v_tools_logo_idx";
  ALTER TABLE "groups_tools" DROP COLUMN "logo_id";
  ALTER TABLE "_groups_v_tools" DROP COLUMN "logo_id";
  ALTER TABLE "clientes" DROP COLUMN "on_dark";
  DROP TYPE "public"."enum_home_page_services_items_icon";
  DROP TYPE "public"."enum_home_page_services_items_service_page";
  DROP TYPE "public"."enum_home_page_process_steps_icon";
  DROP TYPE "public"."enum_home_page_contact_info_rows_icon";
  DROP TYPE "public"."enum_about_page_hero_chips_icon";`)
}
