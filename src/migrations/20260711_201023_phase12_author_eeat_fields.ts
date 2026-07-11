import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "authors_expertise" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "authors_expertise_locales" (
  	"topic" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "authors_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "authors_education_locales" (
  	"degree" varchar NOT NULL,
  	"institution" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "authors_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "authors_experience_locales" (
  	"company" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "authors_expertise" ADD CONSTRAINT "authors_expertise_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_expertise_locales" ADD CONSTRAINT "authors_expertise_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors_expertise"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_education" ADD CONSTRAINT "authors_education_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors_education" ADD CONSTRAINT "authors_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_education_locales" ADD CONSTRAINT "authors_education_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors_education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_experience" ADD CONSTRAINT "authors_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_experience_locales" ADD CONSTRAINT "authors_experience_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors_experience"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "authors_expertise_order_idx" ON "authors_expertise" USING btree ("_order");
  CREATE INDEX "authors_expertise_parent_id_idx" ON "authors_expertise" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "authors_expertise_locales_locale_parent_id_unique" ON "authors_expertise_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "authors_education_order_idx" ON "authors_education" USING btree ("_order");
  CREATE INDEX "authors_education_parent_id_idx" ON "authors_education" USING btree ("_parent_id");
  CREATE INDEX "authors_education_logo_idx" ON "authors_education" USING btree ("logo_id");
  CREATE UNIQUE INDEX "authors_education_locales_locale_parent_id_unique" ON "authors_education_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "authors_experience_order_idx" ON "authors_experience" USING btree ("_order");
  CREATE INDEX "authors_experience_parent_id_idx" ON "authors_experience" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "authors_experience_locales_locale_parent_id_unique" ON "authors_experience_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "authors_expertise" CASCADE;
  DROP TABLE "authors_expertise_locales" CASCADE;
  DROP TABLE "authors_education" CASCADE;
  DROP TABLE "authors_education_locales" CASCADE;
  DROP TABLE "authors_experience" CASCADE;
  DROP TABLE "authors_experience_locales" CASCADE;`)
}
