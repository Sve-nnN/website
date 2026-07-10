import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_about_section_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_about_section_paragraphs_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_about_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_about_section_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_about_section_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_about_section_paragraphs_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_about_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_about_section_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "case_studies_blocks_testimonial_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"author_name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_testimonial_section_locales" (
  	"quote" varchar,
  	"author_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_blocks_testimonial_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_testimonial_section_locales" (
  	"quote" varchar,
  	"author_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_about_section_paragraphs" ADD CONSTRAINT "pages_blocks_about_section_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_about_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_section_paragraphs_locales" ADD CONSTRAINT "pages_blocks_about_section_paragraphs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_about_section_paragraphs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_section" ADD CONSTRAINT "pages_blocks_about_section_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_section" ADD CONSTRAINT "pages_blocks_about_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_section_locales" ADD CONSTRAINT "pages_blocks_about_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_about_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section_paragraphs" ADD CONSTRAINT "_pages_v_blocks_about_section_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_about_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section_paragraphs_locales" ADD CONSTRAINT "_pages_v_blocks_about_section_paragraphs_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_about_section_paragraphs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section" ADD CONSTRAINT "_pages_v_blocks_about_section_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section" ADD CONSTRAINT "_pages_v_blocks_about_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_section_locales" ADD CONSTRAINT "_pages_v_blocks_about_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_about_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_testimonial_section" ADD CONSTRAINT "case_studies_blocks_testimonial_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_testimonial_section_locales" ADD CONSTRAINT "case_studies_blocks_testimonial_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_testimonial_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_testimonial_section" ADD CONSTRAINT "_case_studies_v_blocks_testimonial_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_testimonial_section_locales" ADD CONSTRAINT "_case_studies_v_blocks_testimonial_section_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_testimonial_section"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_about_section_paragraphs_order_idx" ON "pages_blocks_about_section_paragraphs" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_section_paragraphs_parent_id_idx" ON "pages_blocks_about_section_paragraphs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_about_section_paragraphs_locales_locale_parent_" ON "pages_blocks_about_section_paragraphs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_about_section_order_idx" ON "pages_blocks_about_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_section_parent_id_idx" ON "pages_blocks_about_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_section_path_idx" ON "pages_blocks_about_section" USING btree ("_path");
  CREATE INDEX "pages_blocks_about_section_photo_idx" ON "pages_blocks_about_section" USING btree ("photo_id");
  CREATE UNIQUE INDEX "pages_blocks_about_section_locales_locale_parent_id_unique" ON "pages_blocks_about_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_about_section_paragraphs_order_idx" ON "_pages_v_blocks_about_section_paragraphs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_section_paragraphs_parent_id_idx" ON "_pages_v_blocks_about_section_paragraphs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_about_section_paragraphs_locales_locale_pare" ON "_pages_v_blocks_about_section_paragraphs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_about_section_order_idx" ON "_pages_v_blocks_about_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_section_parent_id_idx" ON "_pages_v_blocks_about_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_section_path_idx" ON "_pages_v_blocks_about_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_about_section_photo_idx" ON "_pages_v_blocks_about_section" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_about_section_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_about_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_blocks_testimonial_section_order_idx" ON "case_studies_blocks_testimonial_section" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_testimonial_section_parent_id_idx" ON "case_studies_blocks_testimonial_section" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_testimonial_section_path_idx" ON "case_studies_blocks_testimonial_section" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_blocks_testimonial_section_locales_locale_paren" ON "case_studies_blocks_testimonial_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_blocks_testimonial_section_order_idx" ON "_case_studies_v_blocks_testimonial_section" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_testimonial_section_parent_id_idx" ON "_case_studies_v_blocks_testimonial_section" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_testimonial_section_path_idx" ON "_case_studies_v_blocks_testimonial_section" USING btree ("_path");
  CREATE UNIQUE INDEX "_case_studies_v_blocks_testimonial_section_locales_locale_pa" ON "_case_studies_v_blocks_testimonial_section_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_about_section_paragraphs" CASCADE;
  DROP TABLE "pages_blocks_about_section_paragraphs_locales" CASCADE;
  DROP TABLE "pages_blocks_about_section" CASCADE;
  DROP TABLE "pages_blocks_about_section_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_about_section_paragraphs" CASCADE;
  DROP TABLE "_pages_v_blocks_about_section_paragraphs_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_about_section" CASCADE;
  DROP TABLE "_pages_v_blocks_about_section_locales" CASCADE;
  DROP TABLE "case_studies_blocks_testimonial_section" CASCADE;
  DROP TABLE "case_studies_blocks_testimonial_section_locales" CASCADE;
  DROP TABLE "_case_studies_v_blocks_testimonial_section" CASCADE;
  DROP TABLE "_case_studies_v_blocks_testimonial_section_locales" CASCADE;`)
}
