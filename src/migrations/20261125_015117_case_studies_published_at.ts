import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_published_at" timestamp(3) with time zone;`)

  // Relleno con un dato registrado, no inventado: la fecha de la primera versión
  // publicada que Payload conserva de cada caso. Solo escribe donde no hay valor
  // y no toca `updated_at`.
  await db.execute(sql`
   UPDATE "case_studies" AS c SET "published_at" = v."first_published"
   FROM (
     SELECT "parent_id", min("created_at") AS "first_published"
     FROM "_case_studies_v" WHERE "version__status" = 'published' GROUP BY "parent_id"
   ) AS v
   WHERE c."id" = v."parent_id" AND c."published_at" IS NULL;

   UPDATE "_case_studies_v" AS x SET "version_published_at" = c."published_at"
   FROM "case_studies" AS c
   WHERE x."parent_id" = c."id" AND x."version_published_at" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies" DROP COLUMN "published_at";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_published_at";`)
}
