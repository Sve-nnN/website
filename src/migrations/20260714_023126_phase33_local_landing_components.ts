import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_ring_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_ring_side" AS ENUM('left', 'right');
  ALTER TYPE "public"."enum_pages_blocks_hero_variant" ADD VALUE 'local-landing';
  ALTER TYPE "public"."enum__pages_v_blocks_hero_variant" ADD VALUE 'local-landing';
  CREATE TABLE "pages_blocks_local_proof_section_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_local_proof_section_stats_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_local_proof_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"testimonial_author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_local_proof_section_locales" (
  	"testimonial_quote" varchar,
  	"testimonial_author_business" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_local_proof_section_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_local_proof_section_stats_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_local_proof_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"testimonial_author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_local_proof_section_locales" (
  	"testimonial_quote" varchar,
  	"testimonial_author_business" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "ring_side" "enum_pages_blocks_hero_ring_side" DEFAULT 'right';
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "ring_opacity" numeric DEFAULT 0.25;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "ring_flip_x" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_hero_locales" ADD COLUMN "city_name" varchar;
  ALTER TABLE "pages_blocks_hero_locales" ADD COLUMN "inline_stat" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "ring_side" "enum__pages_v_blocks_hero_ring_side" DEFAULT 'right';
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "ring_opacity" numeric DEFAULT 0.25;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "ring_flip_x" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD COLUMN "city_name" varchar;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD COLUMN "inline_stat" varchar;
  ALTER TABLE "pages_blocks_local_proof_section_stats" ADD CONSTRAINT "pages_blocks_local_proof_section_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_local_proof_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_local_proof_section_stats_locales" ADD CONSTRAINT "pages_blocks_local_proof_section_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_local_proof_section_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_local_proof_section" ADD CONSTRAINT "pages_blocks_local_proof_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_local_proof_section_locales" ADD CONSTRAINT "pages_blocks_local_proof_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_local_proof_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_local_proof_section_stats" ADD CONSTRAINT "_pages_v_blocks_local_proof_section_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_local_proof_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_local_proof_section_stats_locales" ADD CONSTRAINT "_pages_v_blocks_local_proof_section_stats_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_local_proof_section_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_local_proof_section" ADD CONSTRAINT "_pages_v_blocks_local_proof_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_local_proof_section_locales" ADD CONSTRAINT "_pages_v_blocks_local_proof_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_local_proof_section"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_local_proof_section_stats_order_idx" ON "pages_blocks_local_proof_section_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_local_proof_section_stats_parent_id_idx" ON "pages_blocks_local_proof_section_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_local_proof_section_stats_locales_locale_parent" ON "pages_blocks_local_proof_section_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_local_proof_section_order_idx" ON "pages_blocks_local_proof_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_local_proof_section_parent_id_idx" ON "pages_blocks_local_proof_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_local_proof_section_path_idx" ON "pages_blocks_local_proof_section" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_local_proof_section_locales_locale_parent_id_un" ON "pages_blocks_local_proof_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_local_proof_section_stats_order_idx" ON "_pages_v_blocks_local_proof_section_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_local_proof_section_stats_parent_id_idx" ON "_pages_v_blocks_local_proof_section_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_local_proof_section_stats_locales_locale_par" ON "_pages_v_blocks_local_proof_section_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_local_proof_section_order_idx" ON "_pages_v_blocks_local_proof_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_local_proof_section_parent_id_idx" ON "_pages_v_blocks_local_proof_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_local_proof_section_path_idx" ON "_pages_v_blocks_local_proof_section" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_local_proof_section_locales_locale_parent_id" ON "_pages_v_blocks_local_proof_section_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_local_proof_section_stats" CASCADE;
  DROP TABLE "pages_blocks_local_proof_section_stats_locales" CASCADE;
  DROP TABLE "pages_blocks_local_proof_section" CASCADE;
  DROP TABLE "pages_blocks_local_proof_section_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_local_proof_section_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_local_proof_section_stats_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_local_proof_section" CASCADE;
  DROP TABLE "_pages_v_blocks_local_proof_section_locales" CASCADE;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'home'::text;
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('home', 'listing', 'post-header', 'case-study-header');
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'home'::"public"."enum_pages_blocks_hero_variant";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_hero_variant" USING "variant"::"public"."enum_pages_blocks_hero_variant";
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'home'::text;
  DROP TYPE "public"."enum__pages_v_blocks_hero_variant";
  CREATE TYPE "public"."enum__pages_v_blocks_hero_variant" AS ENUM('home', 'listing', 'post-header', 'case-study-header');
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'home'::"public"."enum__pages_v_blocks_hero_variant";
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__pages_v_blocks_hero_variant" USING "variant"::"public"."enum__pages_v_blocks_hero_variant";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "ring_side";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "ring_opacity";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "ring_flip_x";
  ALTER TABLE "pages_blocks_hero_locales" DROP COLUMN "city_name";
  ALTER TABLE "pages_blocks_hero_locales" DROP COLUMN "inline_stat";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "ring_side";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "ring_opacity";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "ring_flip_x";
  ALTER TABLE "_pages_v_blocks_hero_locales" DROP COLUMN "city_name";
  ALTER TABLE "_pages_v_blocks_hero_locales" DROP COLUMN "inline_stat";
  DROP TYPE "public"."enum_pages_blocks_hero_ring_side";
  DROP TYPE "public"."enum__pages_v_blocks_hero_ring_side";`)
}
