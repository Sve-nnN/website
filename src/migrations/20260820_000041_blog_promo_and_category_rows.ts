import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_blog_category_rows_category_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer
  );
  
  CREATE TABLE "pages_blocks_blog_category_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"posts_per_category" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_blog_category_rows_locales" (
  	"view_all_label" varchar DEFAULT 'Ver más',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_newsletter_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_newsletter_block_locales" (
  	"title" varchar,
  	"description" varchar,
  	"email_label" varchar DEFAULT 'Tu correo',
  	"submit_label" varchar DEFAULT 'Suscribirme',
  	"consent_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_blog_category_rows_category_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_blog_category_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"posts_per_category" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_blog_category_rows_locales" (
  	"view_all_label" varchar DEFAULT 'Ver más',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_newsletter_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_newsletter_block_locales" (
  	"title" varchar,
  	"description" varchar,
  	"email_label" varchar DEFAULT 'Tu correo',
  	"submit_label" varchar DEFAULT 'Suscribirme',
  	"consent_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "blog_promo_closing_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "blog_promo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"inline_link_url" varchar,
  	"closing_primary_url" varchar,
  	"closing_secondary_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "blog_promo_locales" (
  	"inline_text" varchar,
  	"inline_link_label" varchar,
  	"closing_heading" varchar,
  	"closing_body" varchar,
  	"closing_primary_label" varchar,
  	"closing_secondary_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "blog_promo_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "blog_promo_update" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_blog_category_rows_category_order" ADD CONSTRAINT "pages_blocks_blog_category_rows_category_order_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_category_rows_category_order" ADD CONSTRAINT "pages_blocks_blog_category_rows_category_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_blog_category_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_category_rows" ADD CONSTRAINT "pages_blocks_blog_category_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_category_rows_locales" ADD CONSTRAINT "pages_blocks_blog_category_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_blog_category_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_newsletter_block" ADD CONSTRAINT "pages_blocks_newsletter_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_newsletter_block_locales" ADD CONSTRAINT "pages_blocks_newsletter_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_newsletter_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_category_rows_category_order" ADD CONSTRAINT "_pages_v_blocks_blog_category_rows_category_order_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_category_rows_category_order" ADD CONSTRAINT "_pages_v_blocks_blog_category_rows_category_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_blog_category_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_category_rows" ADD CONSTRAINT "_pages_v_blocks_blog_category_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_category_rows_locales" ADD CONSTRAINT "_pages_v_blocks_blog_category_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_blog_category_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_newsletter_block" ADD CONSTRAINT "_pages_v_blocks_newsletter_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_newsletter_block_locales" ADD CONSTRAINT "_pages_v_blocks_newsletter_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_newsletter_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_promo_closing_points" ADD CONSTRAINT "blog_promo_closing_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_promo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_promo_locales" ADD CONSTRAINT "blog_promo_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_promo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_blog_category_rows_category_order_order_idx" ON "pages_blocks_blog_category_rows_category_order" USING btree ("_order");
  CREATE INDEX "pages_blocks_blog_category_rows_category_order_parent_id_idx" ON "pages_blocks_blog_category_rows_category_order" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_blog_category_rows_category_order_category_idx" ON "pages_blocks_blog_category_rows_category_order" USING btree ("category_id");
  CREATE INDEX "pages_blocks_blog_category_rows_order_idx" ON "pages_blocks_blog_category_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_blog_category_rows_parent_id_idx" ON "pages_blocks_blog_category_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_blog_category_rows_path_idx" ON "pages_blocks_blog_category_rows" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_blog_category_rows_locales_locale_parent_id_uni" ON "pages_blocks_blog_category_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_newsletter_block_order_idx" ON "pages_blocks_newsletter_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_newsletter_block_parent_id_idx" ON "pages_blocks_newsletter_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_newsletter_block_path_idx" ON "pages_blocks_newsletter_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_newsletter_block_locales_locale_parent_id_uniqu" ON "pages_blocks_newsletter_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_blog_category_rows_category_order_order_idx" ON "_pages_v_blocks_blog_category_rows_category_order" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_blog_category_rows_category_order_parent_id_idx" ON "_pages_v_blocks_blog_category_rows_category_order" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_blog_category_rows_category_order_catego_idx" ON "_pages_v_blocks_blog_category_rows_category_order" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_blog_category_rows_order_idx" ON "_pages_v_blocks_blog_category_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_blog_category_rows_parent_id_idx" ON "_pages_v_blocks_blog_category_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_blog_category_rows_path_idx" ON "_pages_v_blocks_blog_category_rows" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_blog_category_rows_locales_locale_parent_id_" ON "_pages_v_blocks_blog_category_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_newsletter_block_order_idx" ON "_pages_v_blocks_newsletter_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_newsletter_block_parent_id_idx" ON "_pages_v_blocks_newsletter_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_newsletter_block_path_idx" ON "_pages_v_blocks_newsletter_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_newsletter_block_locales_locale_parent_id_un" ON "_pages_v_blocks_newsletter_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "blog_promo_closing_points_order_idx" ON "blog_promo_closing_points" USING btree ("_order");
  CREATE INDEX "blog_promo_closing_points_parent_id_idx" ON "blog_promo_closing_points" USING btree ("_parent_id");
  CREATE INDEX "blog_promo_closing_points_locale_idx" ON "blog_promo_closing_points" USING btree ("_locale");
  CREATE UNIQUE INDEX "blog_promo_locales_locale_parent_id_unique" ON "blog_promo_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_blog_category_rows_category_order" CASCADE;
  DROP TABLE "pages_blocks_blog_category_rows" CASCADE;
  DROP TABLE "pages_blocks_blog_category_rows_locales" CASCADE;
  DROP TABLE "pages_blocks_newsletter_block" CASCADE;
  DROP TABLE "pages_blocks_newsletter_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_blog_category_rows_category_order" CASCADE;
  DROP TABLE "_pages_v_blocks_blog_category_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_blog_category_rows_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_newsletter_block" CASCADE;
  DROP TABLE "_pages_v_blocks_newsletter_block_locales" CASCADE;
  DROP TABLE "blog_promo_closing_points" CASCADE;
  DROP TABLE "blog_promo" CASCADE;
  DROP TABLE "blog_promo_locales" CASCADE;
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "blog_promo_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "blog_promo_update";`)
}
