import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_service_scope_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_service_scope_card_locales" (
  	"title" varchar,
  	"scope" varchar,
  	"outcome" varchar,
  	"timeline" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_related_case_study_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"case_study_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_related_case_study_block_locales" (
  	"title" varchar,
  	"framing_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_service_scope_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_service_scope_card_locales" (
  	"title" varchar,
  	"scope" varchar,
  	"outcome" varchar,
  	"timeline" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_related_case_study_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"case_study_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_related_case_study_block_locales" (
  	"title" varchar,
  	"framing_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_service_scope_card" ADD CONSTRAINT "pages_blocks_service_scope_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_service_scope_card_locales" ADD CONSTRAINT "pages_blocks_service_scope_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_service_scope_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_related_case_study_block" ADD CONSTRAINT "pages_blocks_related_case_study_block_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_related_case_study_block" ADD CONSTRAINT "pages_blocks_related_case_study_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_related_case_study_block_locales" ADD CONSTRAINT "pages_blocks_related_case_study_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_related_case_study_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_scope_card" ADD CONSTRAINT "_pages_v_blocks_service_scope_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_scope_card_locales" ADD CONSTRAINT "_pages_v_blocks_service_scope_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_service_scope_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_related_case_study_block" ADD CONSTRAINT "_pages_v_blocks_related_case_study_block_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_related_case_study_block" ADD CONSTRAINT "_pages_v_blocks_related_case_study_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_related_case_study_block_locales" ADD CONSTRAINT "_pages_v_blocks_related_case_study_block_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_related_case_study_block"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_service_scope_card_order_idx" ON "pages_blocks_service_scope_card" USING btree ("_order");
  CREATE INDEX "pages_blocks_service_scope_card_parent_id_idx" ON "pages_blocks_service_scope_card" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_service_scope_card_path_idx" ON "pages_blocks_service_scope_card" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_service_scope_card_locales_locale_parent_id_uni" ON "pages_blocks_service_scope_card_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_related_case_study_block_order_idx" ON "pages_blocks_related_case_study_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_related_case_study_block_parent_id_idx" ON "pages_blocks_related_case_study_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_related_case_study_block_path_idx" ON "pages_blocks_related_case_study_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_related_case_study_block_case_study_idx" ON "pages_blocks_related_case_study_block" USING btree ("case_study_id");
  CREATE UNIQUE INDEX "pages_blocks_related_case_study_block_locales_locale_parent_" ON "pages_blocks_related_case_study_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_service_scope_card_order_idx" ON "_pages_v_blocks_service_scope_card" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_service_scope_card_parent_id_idx" ON "_pages_v_blocks_service_scope_card" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_service_scope_card_path_idx" ON "_pages_v_blocks_service_scope_card" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_service_scope_card_locales_locale_parent_id_" ON "_pages_v_blocks_service_scope_card_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_related_case_study_block_order_idx" ON "_pages_v_blocks_related_case_study_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_related_case_study_block_parent_id_idx" ON "_pages_v_blocks_related_case_study_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_related_case_study_block_path_idx" ON "_pages_v_blocks_related_case_study_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_related_case_study_block_case_study_idx" ON "_pages_v_blocks_related_case_study_block" USING btree ("case_study_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_related_case_study_block_locales_locale_pare" ON "_pages_v_blocks_related_case_study_block_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_service_scope_card" CASCADE;
  DROP TABLE "pages_blocks_service_scope_card_locales" CASCADE;
  DROP TABLE "pages_blocks_related_case_study_block" CASCADE;
  DROP TABLE "pages_blocks_related_case_study_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_service_scope_card" CASCADE;
  DROP TABLE "_pages_v_blocks_service_scope_card_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_related_case_study_block" CASCADE;
  DROP TABLE "_pages_v_blocks_related_case_study_block_locales" CASCADE;`)
}
