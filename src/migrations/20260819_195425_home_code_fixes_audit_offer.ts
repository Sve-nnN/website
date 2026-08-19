import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_code_fixes_block_fixes_language" AS ENUM('ts', 'tsx', 'js', 'json', 'sql', 'html', 'bash');
  CREATE TYPE "public"."enum_pages_blocks_audit_offer_block_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_audit_offer_block_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_code_fixes_block_fixes_language" AS ENUM('ts', 'tsx', 'js', 'json', 'sql', 'html', 'bash');
  CREATE TYPE "public"."enum__pages_v_blocks_audit_offer_block_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_audit_offer_block_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_clientes_work_type" AS ENUM('seo', 'desarrollo', 'optimizacion');
  CREATE TABLE "pages_blocks_code_fixes_block_fixes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_path" varchar,
  	"language" "enum_pages_blocks_code_fixes_block_fixes_language" DEFAULT 'ts',
  	"code" varchar,
  	"commit_url" varchar,
  	"commit_sha" varchar
  );
  
  CREATE TABLE "pages_blocks_code_fixes_block_fixes_locales" (
  	"symptom" varchar,
  	"cause" varchar,
  	"outcome" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_code_fixes_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"repo_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_code_fixes_block_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"repo_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_audit_offer_block_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_audit_offer_block_includes_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_audit_offer_block_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_audit_offer_block_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_appearance" "enum_pages_blocks_audit_offer_block_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_audit_offer_block_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_audit_offer_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_audit_offer_block_locales" (
  	"title" varchar,
  	"description" varchar,
  	"price" varchar,
  	"price_caption" varchar,
  	"credit_note" varchar,
  	"delivery_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_code_fixes_block_fixes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_path" varchar,
  	"language" "enum__pages_v_blocks_code_fixes_block_fixes_language" DEFAULT 'ts',
  	"code" varchar,
  	"commit_url" varchar,
  	"commit_sha" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_code_fixes_block_fixes_locales" (
  	"symptom" varchar,
  	"cause" varchar,
  	"outcome" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_code_fixes_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"repo_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_code_fixes_block_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"repo_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_audit_offer_block_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_audit_offer_block_includes_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_audit_offer_block_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_audit_offer_block_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_appearance" "enum__pages_v_blocks_audit_offer_block_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_audit_offer_block_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_audit_offer_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_audit_offer_block_locales" (
  	"title" varchar,
  	"description" varchar,
  	"price" varchar,
  	"price_caption" varchar,
  	"credit_note" varchar,
  	"delivery_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "clientes" ADD COLUMN "work_type" "enum_clientes_work_type" DEFAULT 'seo';
  ALTER TABLE "pages_blocks_code_fixes_block_fixes" ADD CONSTRAINT "pages_blocks_code_fixes_block_fixes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_code_fixes_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_code_fixes_block_fixes_locales" ADD CONSTRAINT "pages_blocks_code_fixes_block_fixes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_code_fixes_block_fixes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_code_fixes_block" ADD CONSTRAINT "pages_blocks_code_fixes_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_code_fixes_block_locales" ADD CONSTRAINT "pages_blocks_code_fixes_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_code_fixes_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_audit_offer_block_includes" ADD CONSTRAINT "pages_blocks_audit_offer_block_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_audit_offer_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_audit_offer_block_includes_locales" ADD CONSTRAINT "pages_blocks_audit_offer_block_includes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_audit_offer_block_includes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_audit_offer_block_links" ADD CONSTRAINT "pages_blocks_audit_offer_block_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_audit_offer_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_audit_offer_block_links_locales" ADD CONSTRAINT "pages_blocks_audit_offer_block_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_audit_offer_block_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_audit_offer_block" ADD CONSTRAINT "pages_blocks_audit_offer_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_audit_offer_block_locales" ADD CONSTRAINT "pages_blocks_audit_offer_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_audit_offer_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_code_fixes_block_fixes" ADD CONSTRAINT "_pages_v_blocks_code_fixes_block_fixes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_code_fixes_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_code_fixes_block_fixes_locales" ADD CONSTRAINT "_pages_v_blocks_code_fixes_block_fixes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_code_fixes_block_fixes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_code_fixes_block" ADD CONSTRAINT "_pages_v_blocks_code_fixes_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_code_fixes_block_locales" ADD CONSTRAINT "_pages_v_blocks_code_fixes_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_code_fixes_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_audit_offer_block_includes" ADD CONSTRAINT "_pages_v_blocks_audit_offer_block_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_audit_offer_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_audit_offer_block_includes_locales" ADD CONSTRAINT "_pages_v_blocks_audit_offer_block_includes_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_audit_offer_block_includes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_audit_offer_block_links" ADD CONSTRAINT "_pages_v_blocks_audit_offer_block_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_audit_offer_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_audit_offer_block_links_locales" ADD CONSTRAINT "_pages_v_blocks_audit_offer_block_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_audit_offer_block_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_audit_offer_block" ADD CONSTRAINT "_pages_v_blocks_audit_offer_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_audit_offer_block_locales" ADD CONSTRAINT "_pages_v_blocks_audit_offer_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_audit_offer_block"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_code_fixes_block_fixes_order_idx" ON "pages_blocks_code_fixes_block_fixes" USING btree ("_order");
  CREATE INDEX "pages_blocks_code_fixes_block_fixes_parent_id_idx" ON "pages_blocks_code_fixes_block_fixes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_code_fixes_block_fixes_locales_locale_parent_id" ON "pages_blocks_code_fixes_block_fixes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_code_fixes_block_order_idx" ON "pages_blocks_code_fixes_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_code_fixes_block_parent_id_idx" ON "pages_blocks_code_fixes_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_code_fixes_block_path_idx" ON "pages_blocks_code_fixes_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_code_fixes_block_locales_locale_parent_id_uniqu" ON "pages_blocks_code_fixes_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_audit_offer_block_includes_order_idx" ON "pages_blocks_audit_offer_block_includes" USING btree ("_order");
  CREATE INDEX "pages_blocks_audit_offer_block_includes_parent_id_idx" ON "pages_blocks_audit_offer_block_includes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_audit_offer_block_includes_locales_locale_paren" ON "pages_blocks_audit_offer_block_includes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_audit_offer_block_links_order_idx" ON "pages_blocks_audit_offer_block_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_audit_offer_block_links_parent_id_idx" ON "pages_blocks_audit_offer_block_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_audit_offer_block_links_locales_locale_parent_i" ON "pages_blocks_audit_offer_block_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_audit_offer_block_order_idx" ON "pages_blocks_audit_offer_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_audit_offer_block_parent_id_idx" ON "pages_blocks_audit_offer_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_audit_offer_block_path_idx" ON "pages_blocks_audit_offer_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_audit_offer_block_locales_locale_parent_id_uniq" ON "pages_blocks_audit_offer_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_code_fixes_block_fixes_order_idx" ON "_pages_v_blocks_code_fixes_block_fixes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_code_fixes_block_fixes_parent_id_idx" ON "_pages_v_blocks_code_fixes_block_fixes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_code_fixes_block_fixes_locales_locale_parent" ON "_pages_v_blocks_code_fixes_block_fixes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_code_fixes_block_order_idx" ON "_pages_v_blocks_code_fixes_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_code_fixes_block_parent_id_idx" ON "_pages_v_blocks_code_fixes_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_code_fixes_block_path_idx" ON "_pages_v_blocks_code_fixes_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_code_fixes_block_locales_locale_parent_id_un" ON "_pages_v_blocks_code_fixes_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_includes_order_idx" ON "_pages_v_blocks_audit_offer_block_includes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_includes_parent_id_idx" ON "_pages_v_blocks_audit_offer_block_includes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_audit_offer_block_includes_locales_locale_pa" ON "_pages_v_blocks_audit_offer_block_includes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_links_order_idx" ON "_pages_v_blocks_audit_offer_block_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_links_parent_id_idx" ON "_pages_v_blocks_audit_offer_block_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_audit_offer_block_links_locales_locale_paren" ON "_pages_v_blocks_audit_offer_block_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_order_idx" ON "_pages_v_blocks_audit_offer_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_parent_id_idx" ON "_pages_v_blocks_audit_offer_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_audit_offer_block_path_idx" ON "_pages_v_blocks_audit_offer_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_audit_offer_block_locales_locale_parent_id_u" ON "_pages_v_blocks_audit_offer_block_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_code_fixes_block_fixes" CASCADE;
  DROP TABLE "pages_blocks_code_fixes_block_fixes_locales" CASCADE;
  DROP TABLE "pages_blocks_code_fixes_block" CASCADE;
  DROP TABLE "pages_blocks_code_fixes_block_locales" CASCADE;
  DROP TABLE "pages_blocks_audit_offer_block_includes" CASCADE;
  DROP TABLE "pages_blocks_audit_offer_block_includes_locales" CASCADE;
  DROP TABLE "pages_blocks_audit_offer_block_links" CASCADE;
  DROP TABLE "pages_blocks_audit_offer_block_links_locales" CASCADE;
  DROP TABLE "pages_blocks_audit_offer_block" CASCADE;
  DROP TABLE "pages_blocks_audit_offer_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_code_fixes_block_fixes" CASCADE;
  DROP TABLE "_pages_v_blocks_code_fixes_block_fixes_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_code_fixes_block" CASCADE;
  DROP TABLE "_pages_v_blocks_code_fixes_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_audit_offer_block_includes" CASCADE;
  DROP TABLE "_pages_v_blocks_audit_offer_block_includes_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_audit_offer_block_links" CASCADE;
  DROP TABLE "_pages_v_blocks_audit_offer_block_links_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_audit_offer_block" CASCADE;
  DROP TABLE "_pages_v_blocks_audit_offer_block_locales" CASCADE;
  ALTER TABLE "clientes" DROP COLUMN "work_type";
  DROP TYPE "public"."enum_pages_blocks_code_fixes_block_fixes_language";
  DROP TYPE "public"."enum_pages_blocks_audit_offer_block_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_audit_offer_block_links_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_code_fixes_block_fixes_language";
  DROP TYPE "public"."enum__pages_v_blocks_audit_offer_block_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_audit_offer_block_links_link_appearance";
  DROP TYPE "public"."enum_clientes_work_type";`)
}
