import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('es', 'en');
  CREATE TYPE "public"."enum_pages_blocks_call_to_action_2_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_call_to_action_2_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_content_2_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "public"."enum_pages_blocks_content_2_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_content_2_columns_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_archive_block_2_relation_to" AS ENUM('posts', 'case-studies');
  CREATE TYPE "public"."enum_pages_blocks_archive_block_2_mode" AS ENUM('latest', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_call_to_action_2_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_call_to_action_2_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_content_2_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_content_2_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_content_2_columns_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_block_2_relation_to" AS ENUM('posts', 'case-studies');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_block_2_mode" AS ENUM('latest', 'manual');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('es', 'en');
  CREATE TYPE "public"."enum__posts_v_published_locale" AS ENUM('es', 'en');
  CREATE TYPE "public"."enum__case_studies_v_published_locale" AS ENUM('es', 'en');
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_content_columns_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_call_to_action_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_faqs_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_contact_form_block_contact_info_locales" (
  	"title" varchar,
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_contact_form_block_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"submit_label" varchar DEFAULT 'Enviar mensaje',
  	"sidebar_title" varchar,
  	"sidebar_description" varchar,
  	"social_proof_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_related_posts_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_table_of_contents_block_locales" (
  	"title" varchar DEFAULT 'Tabla de contenidos',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_results_section_stats_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_results_section_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_call_to_action_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_call_to_action_2_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_call_to_action_2_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_call_to_action_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rich_text" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content_2_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_pages_blocks_content_2_columns_size" DEFAULT 'oneThird',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "enum_pages_blocks_content_2_columns_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_content_2_columns_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_content_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_block_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_archive_block_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"relation_to" "enum_pages_blocks_archive_block_2_relation_to",
  	"mode" "enum_pages_blocks_archive_block_2_mode" DEFAULT 'latest',
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_content_columns_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_call_to_action_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_faqs_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_contact_form_block_contact_info_locales" (
  	"title" varchar,
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_contact_form_block_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"submit_label" varchar DEFAULT 'Enviar mensaje',
  	"sidebar_title" varchar,
  	"sidebar_description" varchar,
  	"social_proof_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_related_posts_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_table_of_contents_block_locales" (
  	"title" varchar DEFAULT 'Tabla de contenidos',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_results_section_stats_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_results_section_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_call_to_action_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_call_to_action_2_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_call_to_action_2_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_call_to_action_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rich_text" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_2_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "enum__pages_v_blocks_content_2_columns_size" DEFAULT 'oneThird',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "enum__pages_v_blocks_content_2_columns_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_content_2_columns_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_block_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_archive_block_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"relation_to" "enum__pages_v_blocks_archive_block_2_relation_to",
  	"mode" "enum__pages_v_blocks_archive_block_2_mode" DEFAULT 'latest',
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_posts_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "authors_locales" (
  	"job_title" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "case_studies_kpis_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_challenge_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_solution_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_results_metrics_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_locales" (
  	"title" varchar,
  	"hero_metric" varchar,
  	"hero_subtitle" varchar,
  	"sector" varchar,
  	"client_context" jsonb,
  	"conclusion" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_kpis_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_challenge_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_solution_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_results_metrics_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_locales" (
  	"version_title" varchar,
  	"version_hero_metric" varchar,
  	"version_hero_subtitle" varchar,
  	"version_sector" varchar,
  	"version_client_context" jsonb,
  	"version_conclusion" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "testimonials_locales" (
  	"role" varchar NOT NULL,
  	"testimonial" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "llms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"llms_txt" varchar NOT NULL,
  	"llms_full" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_meta_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_meta_image_id_media_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "case_studies" DROP CONSTRAINT "case_studies_meta_image_id_media_id_fk";
  
  ALTER TABLE "_case_studies_v" DROP CONSTRAINT "_case_studies_v_version_meta_image_id_media_id_fk";
  
  DROP INDEX "pages_meta_meta_image_idx";
  DROP INDEX "_pages_v_version_meta_version_meta_image_idx";
  DROP INDEX "posts_meta_meta_image_idx";
  DROP INDEX "_posts_v_version_meta_version_meta_image_idx";
  DROP INDEX "case_studies_meta_meta_image_idx";
  DROP INDEX "_case_studies_v_version_meta_version_meta_image_idx";
  DROP INDEX "pages_rels_pages_id_idx";
  DROP INDEX "pages_rels_posts_id_idx";
  DROP INDEX "pages_rels_case_studies_id_idx";
  DROP INDEX "_pages_v_rels_pages_id_idx";
  DROP INDEX "_pages_v_rels_posts_id_idx";
  DROP INDEX "_pages_v_rels_case_studies_id_idx";
  ALTER TABLE "pages_rels" ADD COLUMN "locale" "_locales";
  ALTER TABLE "_pages_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_pages_v" ADD COLUMN "published_locale" "enum__pages_v_published_locale";
  ALTER TABLE "_pages_v_rels" ADD COLUMN "locale" "_locales";
  ALTER TABLE "_posts_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN "published_locale" "enum__posts_v_published_locale";
  ALTER TABLE "_case_studies_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_case_studies_v" ADD COLUMN "published_locale" "enum__case_studies_v_published_locale";
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_columns_locales" ADD CONSTRAINT "pages_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_call_to_action_links_locales" ADD CONSTRAINT "pages_blocks_call_to_action_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_call_to_action_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_faqs_locales" ADD CONSTRAINT "pages_blocks_faq_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_locales" ADD CONSTRAINT "pages_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_form_block_contact_info_locales" ADD CONSTRAINT "pages_blocks_contact_form_block_contact_info_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_form_block_contact_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_form_block_locales" ADD CONSTRAINT "pages_blocks_contact_form_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_form_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_related_posts_locales" ADD CONSTRAINT "pages_blocks_related_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_related_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_of_contents_block_locales" ADD CONSTRAINT "pages_blocks_table_of_contents_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table_of_contents_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_results_section_stats_locales" ADD CONSTRAINT "pages_blocks_results_section_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_section_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_results_section_locales" ADD CONSTRAINT "pages_blocks_results_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_call_to_action_2_links" ADD CONSTRAINT "pages_blocks_call_to_action_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_call_to_action_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_call_to_action_2" ADD CONSTRAINT "pages_blocks_call_to_action_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_2_columns" ADD CONSTRAINT "pages_blocks_content_2_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_2" ADD CONSTRAINT "pages_blocks_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block_2" ADD CONSTRAINT "pages_blocks_media_block_2_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block_2" ADD CONSTRAINT "pages_blocks_media_block_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_archive_block_2" ADD CONSTRAINT "pages_blocks_archive_block_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD CONSTRAINT "_pages_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_columns_locales" ADD CONSTRAINT "_pages_v_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_call_to_action_links_locales" ADD CONSTRAINT "_pages_v_blocks_call_to_action_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_call_to_action_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_faqs_locales" ADD CONSTRAINT "_pages_v_blocks_faq_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_locales" ADD CONSTRAINT "_pages_v_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_form_block_contact_info_locales" ADD CONSTRAINT "_pages_v_blocks_contact_form_block_contact_info_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_form_block_contact_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_form_block_locales" ADD CONSTRAINT "_pages_v_blocks_contact_form_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_form_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_related_posts_locales" ADD CONSTRAINT "_pages_v_blocks_related_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_related_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_of_contents_block_locales" ADD CONSTRAINT "_pages_v_blocks_table_of_contents_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table_of_contents_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_results_section_stats_locales" ADD CONSTRAINT "_pages_v_blocks_results_section_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_section_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_results_section_locales" ADD CONSTRAINT "_pages_v_blocks_results_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_call_to_action_2_links" ADD CONSTRAINT "_pages_v_blocks_call_to_action_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_call_to_action_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_call_to_action_2" ADD CONSTRAINT "_pages_v_blocks_call_to_action_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_2_columns" ADD CONSTRAINT "_pages_v_blocks_content_2_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_content_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_2" ADD CONSTRAINT "_pages_v_blocks_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block_2" ADD CONSTRAINT "_pages_v_blocks_media_block_2_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block_2" ADD CONSTRAINT "_pages_v_blocks_media_block_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_archive_block_2" ADD CONSTRAINT "_pages_v_blocks_archive_block_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_locales" ADD CONSTRAINT "authors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_kpis_locales" ADD CONSTRAINT "case_studies_kpis_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_kpis"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_challenge_locales" ADD CONSTRAINT "case_studies_challenge_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_challenge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_solution_locales" ADD CONSTRAINT "case_studies_solution_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_solution"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_results_metrics_locales" ADD CONSTRAINT "case_studies_results_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_results_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_locales" ADD CONSTRAINT "case_studies_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_locales" ADD CONSTRAINT "case_studies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_kpis_locales" ADD CONSTRAINT "_case_studies_v_version_kpis_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_kpis"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_challenge_locales" ADD CONSTRAINT "_case_studies_v_version_challenge_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_challenge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_solution_locales" ADD CONSTRAINT "_case_studies_v_version_solution_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_solution"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_results_metrics_locales" ADD CONSTRAINT "_case_studies_v_version_results_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_results_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_locales" ADD CONSTRAINT "_case_studies_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_locales" ADD CONSTRAINT "_case_studies_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials_locales" ADD CONSTRAINT "testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_content_columns_locales_locale_parent_id_unique" ON "pages_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_call_to_action_links_locales_locale_parent_id_u" ON "pages_blocks_call_to_action_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_faqs_locales_locale_parent_id_unique" ON "pages_blocks_faq_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_locales_locale_parent_id_unique" ON "pages_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_contact_form_block_contact_info_locales_locale_" ON "pages_blocks_contact_form_block_contact_info_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_contact_form_block_locales_locale_parent_id_uni" ON "pages_blocks_contact_form_block_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_related_posts_locales_locale_parent_id_unique" ON "pages_blocks_related_posts_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_table_of_contents_block_locales_locale_parent_i" ON "pages_blocks_table_of_contents_block_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_results_section_stats_locales_locale_parent_id_" ON "pages_blocks_results_section_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_results_section_locales_locale_parent_id_unique" ON "pages_blocks_results_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_call_to_action_2_links_order_idx" ON "pages_blocks_call_to_action_2_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_call_to_action_2_links_parent_id_idx" ON "pages_blocks_call_to_action_2_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_call_to_action_2_links_locale_idx" ON "pages_blocks_call_to_action_2_links" USING btree ("_locale");
  CREATE INDEX "pages_blocks_call_to_action_2_order_idx" ON "pages_blocks_call_to_action_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_call_to_action_2_parent_id_idx" ON "pages_blocks_call_to_action_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_call_to_action_2_path_idx" ON "pages_blocks_call_to_action_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_call_to_action_2_locale_idx" ON "pages_blocks_call_to_action_2" USING btree ("_locale");
  CREATE INDEX "pages_blocks_content_2_columns_order_idx" ON "pages_blocks_content_2_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_2_columns_parent_id_idx" ON "pages_blocks_content_2_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_2_columns_locale_idx" ON "pages_blocks_content_2_columns" USING btree ("_locale");
  CREATE INDEX "pages_blocks_content_2_order_idx" ON "pages_blocks_content_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_2_parent_id_idx" ON "pages_blocks_content_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_2_path_idx" ON "pages_blocks_content_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_2_locale_idx" ON "pages_blocks_content_2" USING btree ("_locale");
  CREATE INDEX "pages_blocks_media_block_2_order_idx" ON "pages_blocks_media_block_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_block_2_parent_id_idx" ON "pages_blocks_media_block_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_block_2_path_idx" ON "pages_blocks_media_block_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_block_2_locale_idx" ON "pages_blocks_media_block_2" USING btree ("_locale");
  CREATE INDEX "pages_blocks_media_block_2_media_idx" ON "pages_blocks_media_block_2" USING btree ("media_id");
  CREATE INDEX "pages_blocks_archive_block_2_order_idx" ON "pages_blocks_archive_block_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_archive_block_2_parent_id_idx" ON "pages_blocks_archive_block_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_archive_block_2_path_idx" ON "pages_blocks_archive_block_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_archive_block_2_locale_idx" ON "pages_blocks_archive_block_2" USING btree ("_locale");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_content_columns_locales_locale_parent_id_uni" ON "_pages_v_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_call_to_action_links_locales_locale_parent_i" ON "_pages_v_blocks_call_to_action_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_faqs_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_contact_form_block_contact_info_locales_loca" ON "_pages_v_blocks_contact_form_block_contact_info_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_contact_form_block_locales_locale_parent_id_" ON "_pages_v_blocks_contact_form_block_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_related_posts_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_related_posts_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_table_of_contents_block_locales_locale_paren" ON "_pages_v_blocks_table_of_contents_block_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_results_section_stats_locales_locale_parent_" ON "_pages_v_blocks_results_section_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_results_section_locales_locale_parent_id_uni" ON "_pages_v_blocks_results_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_links_order_idx" ON "_pages_v_blocks_call_to_action_2_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_links_parent_id_idx" ON "_pages_v_blocks_call_to_action_2_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_links_locale_idx" ON "_pages_v_blocks_call_to_action_2_links" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_order_idx" ON "_pages_v_blocks_call_to_action_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_parent_id_idx" ON "_pages_v_blocks_call_to_action_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_path_idx" ON "_pages_v_blocks_call_to_action_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_call_to_action_2_locale_idx" ON "_pages_v_blocks_call_to_action_2" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_content_2_columns_order_idx" ON "_pages_v_blocks_content_2_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_2_columns_parent_id_idx" ON "_pages_v_blocks_content_2_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_2_columns_locale_idx" ON "_pages_v_blocks_content_2_columns" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_content_2_order_idx" ON "_pages_v_blocks_content_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_2_parent_id_idx" ON "_pages_v_blocks_content_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_2_path_idx" ON "_pages_v_blocks_content_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_2_locale_idx" ON "_pages_v_blocks_content_2" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_media_block_2_order_idx" ON "_pages_v_blocks_media_block_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_block_2_parent_id_idx" ON "_pages_v_blocks_media_block_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_block_2_path_idx" ON "_pages_v_blocks_media_block_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_block_2_locale_idx" ON "_pages_v_blocks_media_block_2" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_media_block_2_media_idx" ON "_pages_v_blocks_media_block_2" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_archive_block_2_order_idx" ON "_pages_v_blocks_archive_block_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_archive_block_2_parent_id_idx" ON "_pages_v_blocks_archive_block_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_archive_block_2_path_idx" ON "_pages_v_blocks_archive_block_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_archive_block_2_locale_idx" ON "_pages_v_blocks_archive_block_2" USING btree ("_locale");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_posts_v_locales_locale_parent_id_unique" ON "_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "authors_locales_locale_parent_id_unique" ON "authors_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "case_studies_kpis_locales_locale_parent_id_unique" ON "case_studies_kpis_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "case_studies_challenge_locales_locale_parent_id_unique" ON "case_studies_challenge_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "case_studies_solution_locales_locale_parent_id_unique" ON "case_studies_solution_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "case_studies_results_metrics_locales_locale_parent_id_unique" ON "case_studies_results_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_meta_meta_image_idx" ON "case_studies_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "case_studies_locales_locale_parent_id_unique" ON "case_studies_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_kpis_locales_locale_parent_id_unique" ON "_case_studies_v_version_kpis_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_challenge_locales_locale_parent_id_u" ON "_case_studies_v_version_challenge_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_solution_locales_locale_parent_id_un" ON "_case_studies_v_version_solution_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_case_studies_v_version_results_metrics_locales_locale_paren" ON "_case_studies_v_version_results_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_version_meta_version_meta_image_idx" ON "_case_studies_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_case_studies_v_locales_locale_parent_id_unique" ON "_case_studies_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "testimonials_locales_locale_parent_id_unique" ON "testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_rels_locale_idx" ON "_pages_v_rels" USING btree ("locale");
  CREATE INDEX "_posts_v_snapshot_idx" ON "_posts_v" USING btree ("snapshot");
  CREATE INDEX "_posts_v_published_locale_idx" ON "_posts_v" USING btree ("published_locale");
  CREATE INDEX "_case_studies_v_snapshot_idx" ON "_case_studies_v" USING btree ("snapshot");
  CREATE INDEX "_case_studies_v_published_locale_idx" ON "_case_studies_v" USING btree ("published_locale");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id","locale");
  CREATE INDEX "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id","locale");
  CREATE INDEX "pages_rels_case_studies_id_idx" ON "pages_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id","locale");
  CREATE INDEX "_pages_v_rels_posts_id_idx" ON "_pages_v_rels" USING btree ("posts_id","locale");
  CREATE INDEX "_pages_v_rels_case_studies_id_idx" ON "_pages_v_rels" USING btree ("case_studies_id","locale");
  ALTER TABLE "media" DROP COLUMN "alt";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "subtitle";
  ALTER TABLE "pages_blocks_content_columns" DROP COLUMN "link_label";
  ALTER TABLE "pages_blocks_call_to_action_links" DROP COLUMN "link_label";
  ALTER TABLE "pages_blocks_faq_faqs" DROP COLUMN "question";
  ALTER TABLE "pages_blocks_faq_faqs" DROP COLUMN "answer";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_contact_form_block_contact_info" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_contact_form_block_contact_info" DROP COLUMN "value";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "description";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "submit_label";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "sidebar_title";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "sidebar_description";
  ALTER TABLE "pages_blocks_contact_form_block" DROP COLUMN "social_proof_text";
  ALTER TABLE "pages_blocks_related_posts" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_table_of_contents_block" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_results_section_stats" DROP COLUMN "value";
  ALTER TABLE "pages_blocks_results_section_stats" DROP COLUMN "label";
  ALTER TABLE "pages_blocks_results_section" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_results_section" DROP COLUMN "description";
  ALTER TABLE "pages" DROP COLUMN "title";
  ALTER TABLE "pages" DROP COLUMN "meta_title";
  ALTER TABLE "pages" DROP COLUMN "meta_description";
  ALTER TABLE "pages" DROP COLUMN "meta_image_id";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "subtitle";
  ALTER TABLE "_pages_v_blocks_content_columns" DROP COLUMN "link_label";
  ALTER TABLE "_pages_v_blocks_call_to_action_links" DROP COLUMN "link_label";
  ALTER TABLE "_pages_v_blocks_faq_faqs" DROP COLUMN "question";
  ALTER TABLE "_pages_v_blocks_faq_faqs" DROP COLUMN "answer";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_contact_form_block_contact_info" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_contact_form_block_contact_info" DROP COLUMN "value";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "submit_label";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "sidebar_title";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "sidebar_description";
  ALTER TABLE "_pages_v_blocks_contact_form_block" DROP COLUMN "social_proof_text";
  ALTER TABLE "_pages_v_blocks_related_posts" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_table_of_contents_block" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_results_section_stats" DROP COLUMN "value";
  ALTER TABLE "_pages_v_blocks_results_section_stats" DROP COLUMN "label";
  ALTER TABLE "_pages_v_blocks_results_section" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_results_section" DROP COLUMN "description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "posts" DROP COLUMN "title";
  ALTER TABLE "posts" DROP COLUMN "excerpt";
  ALTER TABLE "posts" DROP COLUMN "content";
  ALTER TABLE "posts" DROP COLUMN "meta_title";
  ALTER TABLE "posts" DROP COLUMN "meta_description";
  ALTER TABLE "posts" DROP COLUMN "meta_image_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_title";
  ALTER TABLE "_posts_v" DROP COLUMN "version_excerpt";
  ALTER TABLE "_posts_v" DROP COLUMN "version_content";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "authors" DROP COLUMN "job_title";
  ALTER TABLE "authors" DROP COLUMN "bio";
  ALTER TABLE "categories" DROP COLUMN "title";
  ALTER TABLE "categories" DROP COLUMN "description";
  ALTER TABLE "case_studies_kpis" DROP COLUMN "label";
  ALTER TABLE "case_studies_challenge" DROP COLUMN "text";
  ALTER TABLE "case_studies_solution" DROP COLUMN "title";
  ALTER TABLE "case_studies_solution" DROP COLUMN "description";
  ALTER TABLE "case_studies_results_metrics" DROP COLUMN "label";
  ALTER TABLE "case_studies" DROP COLUMN "title";
  ALTER TABLE "case_studies" DROP COLUMN "hero_metric";
  ALTER TABLE "case_studies" DROP COLUMN "hero_subtitle";
  ALTER TABLE "case_studies" DROP COLUMN "sector";
  ALTER TABLE "case_studies" DROP COLUMN "client_context";
  ALTER TABLE "case_studies" DROP COLUMN "conclusion";
  ALTER TABLE "case_studies" DROP COLUMN "meta_title";
  ALTER TABLE "case_studies" DROP COLUMN "meta_description";
  ALTER TABLE "case_studies" DROP COLUMN "meta_image_id";
  ALTER TABLE "_case_studies_v_version_kpis" DROP COLUMN "label";
  ALTER TABLE "_case_studies_v_version_challenge" DROP COLUMN "text";
  ALTER TABLE "_case_studies_v_version_solution" DROP COLUMN "title";
  ALTER TABLE "_case_studies_v_version_solution" DROP COLUMN "description";
  ALTER TABLE "_case_studies_v_version_results_metrics" DROP COLUMN "label";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_title";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_hero_metric";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_hero_subtitle";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_sector";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_client_context";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_conclusion";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "testimonials" DROP COLUMN "role";
  ALTER TABLE "testimonials" DROP COLUMN "testimonial";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_call_to_action_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_form_block_contact_info_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_form_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_related_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_table_of_contents_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_results_section_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_results_section_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_call_to_action_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_call_to_action_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_2_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_block_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_archive_block_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_call_to_action_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_form_block_contact_info_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_form_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_related_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_table_of_contents_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_results_section_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_results_section_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_call_to_action_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_call_to_action_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_content_2_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_content_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_block_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_archive_block_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "authors_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_kpis_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_challenge_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_solution_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_results_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_kpis_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_challenge_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_solution_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_results_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "llms" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "pages_blocks_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_content_columns_locales" CASCADE;
  DROP TABLE "pages_blocks_call_to_action_links_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_faqs_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_locales" CASCADE;
  DROP TABLE "pages_blocks_contact_form_block_contact_info_locales" CASCADE;
  DROP TABLE "pages_blocks_contact_form_block_locales" CASCADE;
  DROP TABLE "pages_blocks_related_posts_locales" CASCADE;
  DROP TABLE "pages_blocks_table_of_contents_block_locales" CASCADE;
  DROP TABLE "pages_blocks_results_section_stats_locales" CASCADE;
  DROP TABLE "pages_blocks_results_section_locales" CASCADE;
  DROP TABLE "pages_blocks_call_to_action_2_links" CASCADE;
  DROP TABLE "pages_blocks_call_to_action_2" CASCADE;
  DROP TABLE "pages_blocks_content_2_columns" CASCADE;
  DROP TABLE "pages_blocks_content_2" CASCADE;
  DROP TABLE "pages_blocks_media_block_2" CASCADE;
  DROP TABLE "pages_blocks_archive_block_2" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_content_columns_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_call_to_action_links_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_faqs_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_form_block_contact_info_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_form_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_related_posts_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_table_of_contents_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_results_section_stats_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_results_section_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_call_to_action_2_links" CASCADE;
  DROP TABLE "_pages_v_blocks_call_to_action_2" CASCADE;
  DROP TABLE "_pages_v_blocks_content_2_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_content_2" CASCADE;
  DROP TABLE "_pages_v_blocks_media_block_2" CASCADE;
  DROP TABLE "_pages_v_blocks_archive_block_2" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "_posts_v_locales" CASCADE;
  DROP TABLE "authors_locales" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "case_studies_kpis_locales" CASCADE;
  DROP TABLE "case_studies_challenge_locales" CASCADE;
  DROP TABLE "case_studies_solution_locales" CASCADE;
  DROP TABLE "case_studies_results_metrics_locales" CASCADE;
  DROP TABLE "case_studies_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_kpis_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_challenge_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_solution_locales" CASCADE;
  DROP TABLE "_case_studies_v_version_results_metrics_locales" CASCADE;
  DROP TABLE "_case_studies_v_locales" CASCADE;
  DROP TABLE "testimonials_locales" CASCADE;
  DROP TABLE "llms" CASCADE;
  DROP INDEX "pages_rels_locale_idx";
  DROP INDEX "_pages_v_snapshot_idx";
  DROP INDEX "_pages_v_published_locale_idx";
  DROP INDEX "_pages_v_rels_locale_idx";
  DROP INDEX "_posts_v_snapshot_idx";
  DROP INDEX "_posts_v_published_locale_idx";
  DROP INDEX "_case_studies_v_snapshot_idx";
  DROP INDEX "_case_studies_v_published_locale_idx";
  DROP INDEX "pages_rels_pages_id_idx";
  DROP INDEX "pages_rels_posts_id_idx";
  DROP INDEX "pages_rels_case_studies_id_idx";
  DROP INDEX "_pages_v_rels_pages_id_idx";
  DROP INDEX "_pages_v_rels_posts_id_idx";
  DROP INDEX "_pages_v_rels_case_studies_id_idx";
  ALTER TABLE "media" ADD COLUMN "alt" varchar NOT NULL;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "title" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "subtitle" varchar;
  ALTER TABLE "pages_blocks_content_columns" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_blocks_call_to_action_links" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_blocks_faq_faqs" ADD COLUMN "question" varchar;
  ALTER TABLE "pages_blocks_faq_faqs" ADD COLUMN "answer" jsonb;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "title" varchar;
  ALTER TABLE "pages_blocks_contact_form_block_contact_info" ADD COLUMN "title" varchar;
  ALTER TABLE "pages_blocks_contact_form_block_contact_info" ADD COLUMN "value" varchar;
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "title" varchar;
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "description" varchar;
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "submit_label" varchar DEFAULT 'Enviar mensaje';
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "sidebar_title" varchar;
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "sidebar_description" varchar;
  ALTER TABLE "pages_blocks_contact_form_block" ADD COLUMN "social_proof_text" varchar;
  ALTER TABLE "pages_blocks_related_posts" ADD COLUMN "title" varchar;
  ALTER TABLE "pages_blocks_table_of_contents_block" ADD COLUMN "title" varchar DEFAULT 'Tabla de contenidos';
  ALTER TABLE "pages_blocks_results_section_stats" ADD COLUMN "value" varchar;
  ALTER TABLE "pages_blocks_results_section_stats" ADD COLUMN "label" varchar;
  ALTER TABLE "pages_blocks_results_section" ADD COLUMN "title" varchar;
  ALTER TABLE "pages_blocks_results_section" ADD COLUMN "description" varchar;
  ALTER TABLE "pages" ADD COLUMN "title" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "subtitle" varchar;
  ALTER TABLE "_pages_v_blocks_content_columns" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_pages_v_blocks_call_to_action_links" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_pages_v_blocks_faq_faqs" ADD COLUMN "question" varchar;
  ALTER TABLE "_pages_v_blocks_faq_faqs" ADD COLUMN "answer" jsonb;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block_contact_info" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block_contact_info" ADD COLUMN "value" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "description" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "submit_label" varchar DEFAULT 'Enviar mensaje';
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "sidebar_title" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "sidebar_description" varchar;
  ALTER TABLE "_pages_v_blocks_contact_form_block" ADD COLUMN "social_proof_text" varchar;
  ALTER TABLE "_pages_v_blocks_related_posts" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_blocks_table_of_contents_block" ADD COLUMN "title" varchar DEFAULT 'Tabla de contenidos';
  ALTER TABLE "_pages_v_blocks_results_section_stats" ADD COLUMN "value" varchar;
  ALTER TABLE "_pages_v_blocks_results_section_stats" ADD COLUMN "label" varchar;
  ALTER TABLE "_pages_v_blocks_results_section" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_blocks_results_section" ADD COLUMN "description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "posts" ADD COLUMN "title" varchar;
  ALTER TABLE "posts" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "posts" ADD COLUMN "content" jsonb;
  ALTER TABLE "posts" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_excerpt" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_content" jsonb;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "authors" ADD COLUMN "job_title" varchar;
  ALTER TABLE "authors" ADD COLUMN "bio" varchar;
  ALTER TABLE "categories" ADD COLUMN "title" varchar NOT NULL;
  ALTER TABLE "categories" ADD COLUMN "description" varchar;
  ALTER TABLE "case_studies_kpis" ADD COLUMN "label" varchar;
  ALTER TABLE "case_studies_challenge" ADD COLUMN "text" varchar;
  ALTER TABLE "case_studies_solution" ADD COLUMN "title" varchar;
  ALTER TABLE "case_studies_solution" ADD COLUMN "description" varchar;
  ALTER TABLE "case_studies_results_metrics" ADD COLUMN "label" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "title" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "hero_metric" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "hero_subtitle" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "sector" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "client_context" jsonb;
  ALTER TABLE "case_studies" ADD COLUMN "conclusion" jsonb;
  ALTER TABLE "case_studies" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_case_studies_v_version_kpis" ADD COLUMN "label" varchar;
  ALTER TABLE "_case_studies_v_version_challenge" ADD COLUMN "text" varchar;
  ALTER TABLE "_case_studies_v_version_solution" ADD COLUMN "title" varchar;
  ALTER TABLE "_case_studies_v_version_solution" ADD COLUMN "description" varchar;
  ALTER TABLE "_case_studies_v_version_results_metrics" ADD COLUMN "label" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_hero_metric" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_hero_subtitle" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_sector" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_client_context" jsonb;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_conclusion" jsonb;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "testimonials" ADD COLUMN "role" varchar NOT NULL;
  ALTER TABLE "testimonials" ADD COLUMN "testimonial" varchar NOT NULL;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");
  CREATE INDEX "case_studies_meta_meta_image_idx" ON "case_studies" USING btree ("meta_image_id");
  CREATE INDEX "_case_studies_v_version_meta_version_meta_image_idx" ON "_case_studies_v" USING btree ("version_meta_image_id");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id");
  CREATE INDEX "pages_rels_case_studies_id_idx" ON "pages_rels" USING btree ("case_studies_id");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_posts_id_idx" ON "_pages_v_rels" USING btree ("posts_id");
  CREATE INDEX "_pages_v_rels_case_studies_id_idx" ON "_pages_v_rels" USING btree ("case_studies_id");
  ALTER TABLE "pages_rels" DROP COLUMN "locale";
  ALTER TABLE "_pages_v" DROP COLUMN "snapshot";
  ALTER TABLE "_pages_v" DROP COLUMN "published_locale";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "locale";
  ALTER TABLE "_posts_v" DROP COLUMN "snapshot";
  ALTER TABLE "_posts_v" DROP COLUMN "published_locale";
  ALTER TABLE "_case_studies_v" DROP COLUMN "snapshot";
  ALTER TABLE "_case_studies_v" DROP COLUMN "published_locale";
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_pages_blocks_call_to_action_2_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_call_to_action_2_links_link_appearance";
  DROP TYPE "public"."enum_pages_blocks_content_2_columns_size";
  DROP TYPE "public"."enum_pages_blocks_content_2_columns_link_type";
  DROP TYPE "public"."enum_pages_blocks_content_2_columns_link_appearance";
  DROP TYPE "public"."enum_pages_blocks_archive_block_2_relation_to";
  DROP TYPE "public"."enum_pages_blocks_archive_block_2_mode";
  DROP TYPE "public"."enum__pages_v_blocks_call_to_action_2_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_call_to_action_2_links_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_content_2_columns_size";
  DROP TYPE "public"."enum__pages_v_blocks_content_2_columns_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_content_2_columns_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_archive_block_2_relation_to";
  DROP TYPE "public"."enum__pages_v_blocks_archive_block_2_mode";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum__posts_v_published_locale";
  DROP TYPE "public"."enum__case_studies_v_published_locale";`)
}
