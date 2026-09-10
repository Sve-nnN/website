import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_groups_tools_reference_link_type" AS ENUM('caseStudy', 'custom');
  CREATE TYPE "public"."enum__groups_v_tools_reference_link_type" AS ENUM('caseStudy', 'custom');
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'hostinger';
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'dataforseo';
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'payload';
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'cloudinary';
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'resend';
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'ahrefs';
  ALTER TYPE "public"."enum_affiliate_links_program" ADD VALUE 'google-search-console';
  CREATE TABLE "groups_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"affiliate_link_id" integer,
  	"reference_link_type" "enum_groups_tools_reference_link_type" DEFAULT 'caseStudy',
  	"reference_link_case_study_id" integer,
  	"reference_link_url" varchar
  );
  
  CREATE TABLE "groups_tools_locales" (
  	"narrative" varchar,
  	"pro" varchar,
  	"con" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "groups_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_tool_stack_gear_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_tool_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"no_commission_pick_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_tool_stack_locales" (
  	"intro" varchar,
  	"gear_intro" varchar,
  	"elegiria_hoy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_groups_v_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"affiliate_link_id" integer,
  	"reference_link_type" "enum__groups_v_tools_reference_link_type" DEFAULT 'caseStudy',
  	"reference_link_case_study_id" integer,
  	"reference_link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_groups_v_tools_locales" (
  	"narrative" varchar,
  	"pro" varchar,
  	"con" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_groups_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_groups_v_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_tool_stack_gear_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_tool_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"no_commission_pick_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_tool_stack_locales" (
  	"intro" varchar,
  	"gear_intro" varchar,
  	"elegiria_hoy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "groups_tools" ADD CONSTRAINT "groups_tools_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups_tools" ADD CONSTRAINT "groups_tools_reference_link_case_study_id_case_studies_id_fk" FOREIGN KEY ("reference_link_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups_tools" ADD CONSTRAINT "groups_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_tools_locales" ADD CONSTRAINT "groups_tools_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups_tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_tool_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_locales" ADD CONSTRAINT "groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_tool_stack_gear_items" ADD CONSTRAINT "pages_blocks_tool_stack_gear_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_tool_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_tool_stack" ADD CONSTRAINT "pages_blocks_tool_stack_no_commission_pick_id_affiliate_links_id_fk" FOREIGN KEY ("no_commission_pick_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_tool_stack" ADD CONSTRAINT "pages_blocks_tool_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_tool_stack_locales" ADD CONSTRAINT "pages_blocks_tool_stack_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_tool_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v_tools" ADD CONSTRAINT "_groups_v_tools_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v_tools" ADD CONSTRAINT "_groups_v_tools_reference_link_case_study_id_case_studies_id_fk" FOREIGN KEY ("reference_link_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v_tools" ADD CONSTRAINT "_groups_v_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v_tools_locales" ADD CONSTRAINT "_groups_v_tools_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_groups_v_tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v" ADD CONSTRAINT "_groups_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_tool_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v_locales" ADD CONSTRAINT "_groups_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_tool_stack_gear_items" ADD CONSTRAINT "_pages_v_blocks_tool_stack_gear_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_tool_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_tool_stack" ADD CONSTRAINT "_pages_v_blocks_tool_stack_no_commission_pick_id_affiliate_links_id_fk" FOREIGN KEY ("no_commission_pick_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_tool_stack" ADD CONSTRAINT "_pages_v_blocks_tool_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_tool_stack_locales" ADD CONSTRAINT "_pages_v_blocks_tool_stack_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_tool_stack"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "groups_tools_order_idx" ON "groups_tools" USING btree ("_order");
  CREATE INDEX "groups_tools_parent_id_idx" ON "groups_tools" USING btree ("_parent_id");
  CREATE INDEX "groups_tools_affiliate_link_idx" ON "groups_tools" USING btree ("affiliate_link_id");
  CREATE INDEX "groups_tools_reference_link_reference_link_case_study_idx" ON "groups_tools" USING btree ("reference_link_case_study_id");
  CREATE UNIQUE INDEX "groups_tools_locales_locale_parent_id_unique" ON "groups_tools_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "groups_order_idx" ON "groups" USING btree ("_order");
  CREATE INDEX "groups_parent_id_idx" ON "groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "groups_locales_locale_parent_id_unique" ON "groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_tool_stack_gear_items_order_idx" ON "pages_blocks_tool_stack_gear_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_tool_stack_gear_items_parent_id_idx" ON "pages_blocks_tool_stack_gear_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_tool_stack_order_idx" ON "pages_blocks_tool_stack" USING btree ("_order");
  CREATE INDEX "pages_blocks_tool_stack_parent_id_idx" ON "pages_blocks_tool_stack" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_tool_stack_path_idx" ON "pages_blocks_tool_stack" USING btree ("_path");
  CREATE INDEX "pages_blocks_tool_stack_no_commission_pick_idx" ON "pages_blocks_tool_stack" USING btree ("no_commission_pick_id");
  CREATE UNIQUE INDEX "pages_blocks_tool_stack_locales_locale_parent_id_unique" ON "pages_blocks_tool_stack_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_groups_v_tools_order_idx" ON "_groups_v_tools" USING btree ("_order");
  CREATE INDEX "_groups_v_tools_parent_id_idx" ON "_groups_v_tools" USING btree ("_parent_id");
  CREATE INDEX "_groups_v_tools_affiliate_link_idx" ON "_groups_v_tools" USING btree ("affiliate_link_id");
  CREATE INDEX "_groups_v_tools_reference_link_reference_link_case_study_idx" ON "_groups_v_tools" USING btree ("reference_link_case_study_id");
  CREATE UNIQUE INDEX "_groups_v_tools_locales_locale_parent_id_unique" ON "_groups_v_tools_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_groups_v_order_idx" ON "_groups_v" USING btree ("_order");
  CREATE INDEX "_groups_v_parent_id_idx" ON "_groups_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_groups_v_locales_locale_parent_id_unique" ON "_groups_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_tool_stack_gear_items_order_idx" ON "_pages_v_blocks_tool_stack_gear_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_tool_stack_gear_items_parent_id_idx" ON "_pages_v_blocks_tool_stack_gear_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_tool_stack_order_idx" ON "_pages_v_blocks_tool_stack" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_tool_stack_parent_id_idx" ON "_pages_v_blocks_tool_stack" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_tool_stack_path_idx" ON "_pages_v_blocks_tool_stack" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_tool_stack_no_commission_pick_idx" ON "_pages_v_blocks_tool_stack" USING btree ("no_commission_pick_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_tool_stack_locales_locale_parent_id_unique" ON "_pages_v_blocks_tool_stack_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "groups_tools" CASCADE;
  DROP TABLE "groups_tools_locales" CASCADE;
  DROP TABLE "groups" CASCADE;
  DROP TABLE "groups_locales" CASCADE;
  DROP TABLE "pages_blocks_tool_stack_gear_items" CASCADE;
  DROP TABLE "pages_blocks_tool_stack" CASCADE;
  DROP TABLE "pages_blocks_tool_stack_locales" CASCADE;
  DROP TABLE "_groups_v_tools" CASCADE;
  DROP TABLE "_groups_v_tools_locales" CASCADE;
  DROP TABLE "_groups_v" CASCADE;
  DROP TABLE "_groups_v_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_tool_stack_gear_items" CASCADE;
  DROP TABLE "_pages_v_blocks_tool_stack" CASCADE;
  DROP TABLE "_pages_v_blocks_tool_stack_locales" CASCADE;
  ALTER TABLE "affiliate_links" ALTER COLUMN "program" SET DATA TYPE text;
  DROP TYPE "public"."enum_affiliate_links_program";
  CREATE TYPE "public"."enum_affiliate_links_program" AS ENUM('amazon', 'kinsta', 'dinorank', 'digitalocean', 'other');
  ALTER TABLE "affiliate_links" ALTER COLUMN "program" SET DATA TYPE "public"."enum_affiliate_links_program" USING "program"::"public"."enum_affiliate_links_program";
  DROP TYPE "public"."enum_groups_tools_reference_link_type";
  DROP TYPE "public"."enum__groups_v_tools_reference_link_type";`)
}
