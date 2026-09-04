import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_affiliate_links_program" AS ENUM('amazon', 'kinsta', 'dinorank', 'digitalocean', 'other');
  CREATE TYPE "public"."enum_affiliate_links_placement" AS ENUM('stack-page', 'inline-post', 'both');
  CREATE TABLE "affiliate_links_destinations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"marketplace" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "affiliate_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"program" "enum_affiliate_links_program" NOT NULL,
  	"cookie_window_days" numeric,
  	"commission_note" varchar,
  	"active" boolean DEFAULT false,
  	"placement" "enum_affiliate_links_placement",
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "affiliate_links_locales" (
  	"tagline" varchar,
  	"why_i_use_it" varchar,
  	"disclosure_override" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "affiliate_links_id" integer;
  ALTER TABLE "affiliate_links_destinations" ADD CONSTRAINT "affiliate_links_destinations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "affiliate_links_locales" ADD CONSTRAINT "affiliate_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "affiliate_links_destinations_order_idx" ON "affiliate_links_destinations" USING btree ("_order");
  CREATE INDEX "affiliate_links_destinations_parent_id_idx" ON "affiliate_links_destinations" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "affiliate_links_slug_idx" ON "affiliate_links" USING btree ("slug");
  CREATE INDEX "affiliate_links_updated_at_idx" ON "affiliate_links" USING btree ("updated_at");
  CREATE INDEX "affiliate_links_created_at_idx" ON "affiliate_links" USING btree ("created_at");
  CREATE UNIQUE INDEX "affiliate_links_locales_locale_parent_id_unique" ON "affiliate_links_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_affiliate_links_fk" FOREIGN KEY ("affiliate_links_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_affiliate_links_id_idx" ON "payload_locked_documents_rels" USING btree ("affiliate_links_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "affiliate_links_destinations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "affiliate_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "affiliate_links_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "affiliate_links_destinations" CASCADE;
  DROP TABLE "affiliate_links" CASCADE;
  DROP TABLE "affiliate_links_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_affiliate_links_fk";
  
  DROP INDEX "payload_locked_documents_rels_affiliate_links_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "affiliate_links_id";
  DROP TYPE "public"."enum_affiliate_links_program";
  DROP TYPE "public"."enum_affiliate_links_placement";`)
}
