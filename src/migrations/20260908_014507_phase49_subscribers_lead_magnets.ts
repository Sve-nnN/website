import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscribers_opt_in_reason" AS ENUM('newsletter', 'lead-magnet');
  CREATE TYPE "public"."enum_lead_magnets_locale" AS ENUM('es', 'en');
  CREATE TABLE "lead_magnets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"locale" "enum_lead_magnets_locale" NOT NULL,
  	"cloudinary_public_id" varchar NOT NULL,
  	"file_name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "subscribers" ADD COLUMN "opt_in_reason" "enum_subscribers_opt_in_reason" DEFAULT 'newsletter' NOT NULL;
  ALTER TABLE "subscribers" ADD COLUMN "lead_magnet_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lead_magnets_id" integer;
  CREATE INDEX "lead_magnets_updated_at_idx" ON "lead_magnets" USING btree ("updated_at");
  CREATE INDEX "lead_magnets_created_at_idx" ON "lead_magnets" USING btree ("created_at");
  ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_lead_magnet_id_lead_magnets_id_fk" FOREIGN KEY ("lead_magnet_id") REFERENCES "public"."lead_magnets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_magnets_fk" FOREIGN KEY ("lead_magnets_id") REFERENCES "public"."lead_magnets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "subscribers_lead_magnet_idx" ON "subscribers" USING btree ("lead_magnet_id");
  CREATE INDEX "payload_locked_documents_rels_lead_magnets_id_idx" ON "payload_locked_documents_rels" USING btree ("lead_magnets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lead_magnets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lead_magnets" CASCADE;
  ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_lead_magnet_id_lead_magnets_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lead_magnets_fk";
  
  DROP INDEX "subscribers_lead_magnet_idx";
  DROP INDEX "payload_locked_documents_rels_lead_magnets_id_idx";
  ALTER TABLE "subscribers" DROP COLUMN "opt_in_reason";
  ALTER TABLE "subscribers" DROP COLUMN "lead_magnet_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lead_magnets_id";
  DROP TYPE "public"."enum_subscribers_opt_in_reason";
  DROP TYPE "public"."enum_lead_magnets_locale";`)
}
