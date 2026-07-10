import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_content_columns_locales" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "_pages_v_blocks_content_columns_locales" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "pages_blocks_content_columns" DROP COLUMN "rich_text";
  ALTER TABLE "_pages_v_blocks_content_columns" DROP COLUMN "rich_text";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_content_columns" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "_pages_v_blocks_content_columns" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "pages_blocks_content_columns_locales" DROP COLUMN "rich_text";
  ALTER TABLE "_pages_v_blocks_content_columns_locales" DROP COLUMN "rich_text";`)
}
