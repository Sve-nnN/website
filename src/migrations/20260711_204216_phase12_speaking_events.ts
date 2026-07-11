import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "speaking_events_co_speakers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "speaking_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"location" varchar,
  	"attendee_count" numeric,
  	"link" varchar,
  	"flyer_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "speaking_events_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "speaking_events_id" integer;
  ALTER TABLE "speaking_events_co_speakers" ADD CONSTRAINT "speaking_events_co_speakers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."speaking_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "speaking_events" ADD CONSTRAINT "speaking_events_flyer_id_media_id_fk" FOREIGN KEY ("flyer_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "speaking_events_locales" ADD CONSTRAINT "speaking_events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."speaking_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "speaking_events_co_speakers_order_idx" ON "speaking_events_co_speakers" USING btree ("_order");
  CREATE INDEX "speaking_events_co_speakers_parent_id_idx" ON "speaking_events_co_speakers" USING btree ("_parent_id");
  CREATE INDEX "speaking_events_flyer_idx" ON "speaking_events" USING btree ("flyer_id");
  CREATE INDEX "speaking_events_updated_at_idx" ON "speaking_events" USING btree ("updated_at");
  CREATE INDEX "speaking_events_created_at_idx" ON "speaking_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "speaking_events_locales_locale_parent_id_unique" ON "speaking_events_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_speaking_events_fk" FOREIGN KEY ("speaking_events_id") REFERENCES "public"."speaking_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_speaking_events_id_idx" ON "payload_locked_documents_rels" USING btree ("speaking_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "speaking_events_co_speakers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "speaking_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "speaking_events_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "speaking_events_co_speakers" CASCADE;
  DROP TABLE "speaking_events" CASCADE;
  DROP TABLE "speaking_events_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_speaking_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_speaking_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "speaking_events_id";`)
}
