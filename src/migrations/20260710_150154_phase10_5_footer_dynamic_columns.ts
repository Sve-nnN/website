import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_footer_dynamic_columns_source" AS ENUM('latestPosts', 'latestCaseStudies');
  CREATE TABLE "footer_dynamic_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_footer_dynamic_columns_source" NOT NULL,
  	"limit" numeric DEFAULT 5
  );
  
  CREATE TABLE "footer_dynamic_columns_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "footer_dynamic_columns" ADD CONSTRAINT "footer_dynamic_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_dynamic_columns_locales" ADD CONSTRAINT "footer_dynamic_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_dynamic_columns"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "footer_dynamic_columns_order_idx" ON "footer_dynamic_columns" USING btree ("_order");
  CREATE INDEX "footer_dynamic_columns_parent_id_idx" ON "footer_dynamic_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_dynamic_columns_locales_locale_parent_id_unique" ON "footer_dynamic_columns_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "footer_dynamic_columns" CASCADE;
  DROP TABLE "footer_dynamic_columns_locales" CASCADE;
  DROP TYPE "public"."enum_footer_dynamic_columns_source";`)
}
