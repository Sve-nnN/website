import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "affiliate_clicks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "affiliate_clicks_id" integer;
  CREATE INDEX "affiliate_clicks_slug_idx" ON "affiliate_clicks" USING btree ("slug");
  CREATE INDEX "affiliate_clicks_updated_at_idx" ON "affiliate_clicks" USING btree ("updated_at");
  CREATE INDEX "affiliate_clicks_created_at_idx" ON "affiliate_clicks" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_affiliate_clicks_fk" FOREIGN KEY ("affiliate_clicks_id") REFERENCES "public"."affiliate_clicks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_affiliate_clicks_id_idx" ON "payload_locked_documents_rels" USING btree ("affiliate_clicks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "affiliate_clicks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "affiliate_clicks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_affiliate_clicks_fk";
  
  DROP INDEX "payload_locked_documents_rels_affiliate_clicks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "affiliate_clicks_id";`)
}
