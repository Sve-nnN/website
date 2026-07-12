import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "authors_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "authors_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "authors_locales" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "authors_locales" ADD CONSTRAINT "authors_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "authors_meta_meta_image_idx" ON "authors_locales" USING btree ("meta_image_id","_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "authors_locales" DROP CONSTRAINT "authors_locales_meta_image_id_media_id_fk";
  
  DROP INDEX "authors_meta_meta_image_idx";
  ALTER TABLE "authors_locales" DROP COLUMN "meta_title";
  ALTER TABLE "authors_locales" DROP COLUMN "meta_description";
  ALTER TABLE "authors_locales" DROP COLUMN "meta_image_id";`)
}
