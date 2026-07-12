import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "target_keyword_en" varchar;
  ALTER TABLE "pages" ADD COLUMN "target_keyword_es" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_target_keyword_en" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_target_keyword_es" varchar;
  ALTER TABLE "authors" ADD COLUMN "target_keyword_en" varchar;
  ALTER TABLE "authors" ADD COLUMN "target_keyword_es" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "target_keyword_en";
  ALTER TABLE "pages" DROP COLUMN "target_keyword_es";
  ALTER TABLE "_pages_v" DROP COLUMN "version_target_keyword_en";
  ALTER TABLE "_pages_v" DROP COLUMN "version_target_keyword_es";
  ALTER TABLE "authors" DROP COLUMN "target_keyword_en";
  ALTER TABLE "authors" DROP COLUMN "target_keyword_es";`)
}
