import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_archive_block_relation_to" ADD VALUE 'websites';
  ALTER TYPE "public"."enum_pages_blocks_archive_block_2_relation_to" ADD VALUE 'websites';
  ALTER TYPE "public"."enum__pages_v_blocks_archive_block_relation_to" ADD VALUE 'websites';
  ALTER TYPE "public"."enum__pages_v_blocks_archive_block_2_relation_to" ADD VALUE 'websites';
  CREATE TABLE "pages_blocks_featured_websites_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_websites_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_websites_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_websites_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "websites_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "websites_id" integer;
  ALTER TABLE "featured_content_rels" ADD COLUMN "websites_id" integer;
  ALTER TABLE "pages_blocks_featured_websites_block" ADD CONSTRAINT "pages_blocks_featured_websites_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_websites_block_locales" ADD CONSTRAINT "pages_blocks_featured_websites_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_websites_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_websites_block" ADD CONSTRAINT "_pages_v_blocks_featured_websites_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_websites_block_locales" ADD CONSTRAINT "_pages_v_blocks_featured_websites_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_websites_block"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_featured_websites_block_order_idx" ON "pages_blocks_featured_websites_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_websites_block_parent_id_idx" ON "pages_blocks_featured_websites_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_websites_block_path_idx" ON "pages_blocks_featured_websites_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_featured_websites_block_locales_locale_parent_i" ON "pages_blocks_featured_websites_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_websites_block_order_idx" ON "_pages_v_blocks_featured_websites_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_websites_block_parent_id_idx" ON "_pages_v_blocks_featured_websites_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_websites_block_path_idx" ON "_pages_v_blocks_featured_websites_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_websites_block_locales_locale_paren" ON "_pages_v_blocks_featured_websites_block_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_websites_fk" FOREIGN KEY ("websites_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_websites_fk" FOREIGN KEY ("websites_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "featured_content_rels" ADD CONSTRAINT "featured_content_rels_websites_fk" FOREIGN KEY ("websites_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_websites_id_idx" ON "pages_rels" USING btree ("websites_id","locale");
  CREATE INDEX "_pages_v_rels_websites_id_idx" ON "_pages_v_rels" USING btree ("websites_id","locale");
  CREATE INDEX "featured_content_rels_websites_id_idx" ON "featured_content_rels" USING btree ("websites_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_featured_websites_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_websites_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_websites_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_websites_block_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_featured_websites_block" CASCADE;
  DROP TABLE "pages_blocks_featured_websites_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_websites_block" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_websites_block_locales" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_websites_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_websites_fk";
  
  ALTER TABLE "featured_content_rels" DROP CONSTRAINT "featured_content_rels_websites_fk";
  
  ALTER TABLE "pages_blocks_archive_block" ALTER COLUMN "relation_to" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_archive_block_relation_to";
  CREATE TYPE "public"."enum_pages_blocks_archive_block_relation_to" AS ENUM('posts', 'case-studies');
  ALTER TABLE "pages_blocks_archive_block" ALTER COLUMN "relation_to" SET DATA TYPE "public"."enum_pages_blocks_archive_block_relation_to" USING "relation_to"::"public"."enum_pages_blocks_archive_block_relation_to";
  ALTER TABLE "pages_blocks_archive_block_2" ALTER COLUMN "relation_to" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_archive_block_2_relation_to";
  CREATE TYPE "public"."enum_pages_blocks_archive_block_2_relation_to" AS ENUM('posts', 'case-studies');
  ALTER TABLE "pages_blocks_archive_block_2" ALTER COLUMN "relation_to" SET DATA TYPE "public"."enum_pages_blocks_archive_block_2_relation_to" USING "relation_to"::"public"."enum_pages_blocks_archive_block_2_relation_to";
  ALTER TABLE "_pages_v_blocks_archive_block" ALTER COLUMN "relation_to" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_archive_block_relation_to";
  CREATE TYPE "public"."enum__pages_v_blocks_archive_block_relation_to" AS ENUM('posts', 'case-studies');
  ALTER TABLE "_pages_v_blocks_archive_block" ALTER COLUMN "relation_to" SET DATA TYPE "public"."enum__pages_v_blocks_archive_block_relation_to" USING "relation_to"::"public"."enum__pages_v_blocks_archive_block_relation_to";
  ALTER TABLE "_pages_v_blocks_archive_block_2" ALTER COLUMN "relation_to" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_archive_block_2_relation_to";
  CREATE TYPE "public"."enum__pages_v_blocks_archive_block_2_relation_to" AS ENUM('posts', 'case-studies');
  ALTER TABLE "_pages_v_blocks_archive_block_2" ALTER COLUMN "relation_to" SET DATA TYPE "public"."enum__pages_v_blocks_archive_block_2_relation_to" USING "relation_to"::"public"."enum__pages_v_blocks_archive_block_2_relation_to";
  DROP INDEX "pages_rels_websites_id_idx";
  DROP INDEX "_pages_v_rels_websites_id_idx";
  DROP INDEX "featured_content_rels_websites_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "websites_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "websites_id";
  ALTER TABLE "featured_content_rels" DROP COLUMN "websites_id";`)
}
