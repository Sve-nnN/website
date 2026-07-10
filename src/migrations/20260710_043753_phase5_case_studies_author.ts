import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies" ADD COLUMN "author_id" integer;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_author_id" integer;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "case_studies_author_idx" ON "case_studies" USING btree ("author_id");
  CREATE INDEX "_case_studies_v_version_version_author_idx" ON "_case_studies_v" USING btree ("version_author_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies" DROP CONSTRAINT "case_studies_author_id_authors_id_fk";
  
  ALTER TABLE "_case_studies_v" DROP CONSTRAINT "_case_studies_v_version_author_id_authors_id_fk";
  
  DROP INDEX "case_studies_author_idx";
  DROP INDEX "_case_studies_v_version_version_author_idx";
  ALTER TABLE "case_studies" DROP COLUMN "author_id";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_author_id";`)
}
