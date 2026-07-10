import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_featured_posts_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_posts_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_featured_case_studies_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_case_studies_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_client_logos_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_client_logos_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_posts_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_posts_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_case_studies_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_case_studies_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_client_logos_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_client_logos_block_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_archive_block" ADD COLUMN "enable_category_filter" boolean DEFAULT true;
  ALTER TABLE "pages_blocks_archive_block_2" ADD COLUMN "enable_category_filter" boolean DEFAULT true;
  ALTER TABLE "pages_rels" ADD COLUMN "clientes_id" integer;
  ALTER TABLE "_pages_v_blocks_archive_block" ADD COLUMN "enable_category_filter" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_archive_block_2" ADD COLUMN "enable_category_filter" boolean DEFAULT true;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "clientes_id" integer;
  ALTER TABLE "pages_blocks_featured_posts_block" ADD CONSTRAINT "pages_blocks_featured_posts_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_posts_block_locales" ADD CONSTRAINT "pages_blocks_featured_posts_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_posts_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_case_studies_block" ADD CONSTRAINT "pages_blocks_featured_case_studies_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_case_studies_block_locales" ADD CONSTRAINT "pages_blocks_featured_case_studies_block_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_case_studies_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_client_logos_block" ADD CONSTRAINT "pages_blocks_client_logos_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_client_logos_block_locales" ADD CONSTRAINT "pages_blocks_client_logos_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_client_logos_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_posts_block" ADD CONSTRAINT "_pages_v_blocks_featured_posts_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_posts_block_locales" ADD CONSTRAINT "_pages_v_blocks_featured_posts_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_posts_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_case_studies_block" ADD CONSTRAINT "_pages_v_blocks_featured_case_studies_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_case_studies_block_locales" ADD CONSTRAINT "_pages_v_blocks_featured_case_studies_block_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_case_studies_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_client_logos_block" ADD CONSTRAINT "_pages_v_blocks_client_logos_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_client_logos_block_locales" ADD CONSTRAINT "_pages_v_blocks_client_logos_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_client_logos_block"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_featured_posts_block_order_idx" ON "pages_blocks_featured_posts_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_posts_block_parent_id_idx" ON "pages_blocks_featured_posts_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_posts_block_path_idx" ON "pages_blocks_featured_posts_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_featured_posts_block_locales_locale_parent_id_u" ON "pages_blocks_featured_posts_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_featured_case_studies_block_order_idx" ON "pages_blocks_featured_case_studies_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_case_studies_block_parent_id_idx" ON "pages_blocks_featured_case_studies_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_case_studies_block_path_idx" ON "pages_blocks_featured_case_studies_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_featured_case_studies_block_locales_locale_pare" ON "pages_blocks_featured_case_studies_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_client_logos_block_order_idx" ON "pages_blocks_client_logos_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_client_logos_block_parent_id_idx" ON "pages_blocks_client_logos_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_client_logos_block_path_idx" ON "pages_blocks_client_logos_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_client_logos_block_locales_locale_parent_id_uni" ON "pages_blocks_client_logos_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_posts_block_order_idx" ON "_pages_v_blocks_featured_posts_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_posts_block_parent_id_idx" ON "_pages_v_blocks_featured_posts_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_posts_block_path_idx" ON "_pages_v_blocks_featured_posts_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_posts_block_locales_locale_parent_i" ON "_pages_v_blocks_featured_posts_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_case_studies_block_order_idx" ON "_pages_v_blocks_featured_case_studies_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_case_studies_block_parent_id_idx" ON "_pages_v_blocks_featured_case_studies_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_case_studies_block_path_idx" ON "_pages_v_blocks_featured_case_studies_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_case_studies_block_locales_locale_p" ON "_pages_v_blocks_featured_case_studies_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_client_logos_block_order_idx" ON "_pages_v_blocks_client_logos_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_client_logos_block_parent_id_idx" ON "_pages_v_blocks_client_logos_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_client_logos_block_path_idx" ON "_pages_v_blocks_client_logos_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_client_logos_block_locales_locale_parent_id_" ON "_pages_v_blocks_client_logos_block_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_clientes_fk" FOREIGN KEY ("clientes_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_clientes_fk" FOREIGN KEY ("clientes_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_clientes_id_idx" ON "pages_rels" USING btree ("clientes_id","locale");
  CREATE INDEX "_pages_v_rels_clientes_id_idx" ON "_pages_v_rels" USING btree ("clientes_id","locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_featured_posts_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_posts_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_case_studies_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_case_studies_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_client_logos_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_client_logos_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_posts_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_posts_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_case_studies_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_case_studies_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_client_logos_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_client_logos_block_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_featured_posts_block" CASCADE;
  DROP TABLE "pages_blocks_featured_posts_block_locales" CASCADE;
  DROP TABLE "pages_blocks_featured_case_studies_block" CASCADE;
  DROP TABLE "pages_blocks_featured_case_studies_block_locales" CASCADE;
  DROP TABLE "pages_blocks_client_logos_block" CASCADE;
  DROP TABLE "pages_blocks_client_logos_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_posts_block" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_posts_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_case_studies_block" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_case_studies_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_client_logos_block" CASCADE;
  DROP TABLE "_pages_v_blocks_client_logos_block_locales" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_clientes_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_clientes_fk";
  
  DROP INDEX "pages_rels_clientes_id_idx";
  DROP INDEX "_pages_v_rels_clientes_id_idx";
  ALTER TABLE "pages_blocks_archive_block" DROP COLUMN "enable_category_filter";
  ALTER TABLE "pages_blocks_archive_block_2" DROP COLUMN "enable_category_filter";
  ALTER TABLE "pages_rels" DROP COLUMN "clientes_id";
  ALTER TABLE "_pages_v_blocks_archive_block" DROP COLUMN "enable_category_filter";
  ALTER TABLE "_pages_v_blocks_archive_block_2" DROP COLUMN "enable_category_filter";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "clientes_id";`)
}
