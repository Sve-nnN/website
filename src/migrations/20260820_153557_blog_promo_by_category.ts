import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "blog_promo_by_category_closing_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "blog_promo_by_category" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer NOT NULL,
  	"inline_link_url" varchar,
  	"rail_link_url" varchar,
  	"closing_primary_url" varchar,
  	"closing_secondary_url" varchar
  );
  
  CREATE TABLE "blog_promo_by_category_locales" (
  	"inline_title" varchar,
  	"inline_text" varchar,
  	"inline_link_label" varchar,
  	"rail_title" varchar,
  	"rail_body" varchar,
  	"rail_link_label" varchar,
  	"closing_heading" varchar,
  	"closing_body" varchar,
  	"closing_primary_label" varchar,
  	"closing_secondary_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "blog_promo_by_category_closing_points" ADD CONSTRAINT "blog_promo_by_category_closing_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_promo_by_category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_promo_by_category" ADD CONSTRAINT "blog_promo_by_category_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_promo_by_category" ADD CONSTRAINT "blog_promo_by_category_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_promo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_promo_by_category_locales" ADD CONSTRAINT "blog_promo_by_category_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_promo_by_category"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blog_promo_by_category_closing_points_order_idx" ON "blog_promo_by_category_closing_points" USING btree ("_order");
  CREATE INDEX "blog_promo_by_category_closing_points_parent_id_idx" ON "blog_promo_by_category_closing_points" USING btree ("_parent_id");
  CREATE INDEX "blog_promo_by_category_closing_points_locale_idx" ON "blog_promo_by_category_closing_points" USING btree ("_locale");
  CREATE INDEX "blog_promo_by_category_order_idx" ON "blog_promo_by_category" USING btree ("_order");
  CREATE INDEX "blog_promo_by_category_parent_id_idx" ON "blog_promo_by_category" USING btree ("_parent_id");
  CREATE INDEX "blog_promo_by_category_category_idx" ON "blog_promo_by_category" USING btree ("category_id");
  CREATE UNIQUE INDEX "blog_promo_by_category_locales_locale_parent_id_unique" ON "blog_promo_by_category_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "blog_promo_by_category_closing_points" CASCADE;
  DROP TABLE "blog_promo_by_category" CASCADE;
  DROP TABLE "blog_promo_by_category_locales" CASCADE;`)
}
