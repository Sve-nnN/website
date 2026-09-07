import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_tool_stack_locales" ADD COLUMN "auditor_highlight_narrative" varchar;
  ALTER TABLE "_pages_v_blocks_tool_stack_locales" ADD COLUMN "auditor_highlight_narrative" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_tool_stack_locales" DROP COLUMN "auditor_highlight_narrative";
  ALTER TABLE "_pages_v_blocks_tool_stack_locales" DROP COLUMN "auditor_highlight_narrative";`)
}
