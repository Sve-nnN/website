import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_promo" ADD COLUMN "rail_link_url" varchar;
  ALTER TABLE "blog_promo_locales" ADD COLUMN "inline_title" varchar;
  ALTER TABLE "blog_promo_locales" ADD COLUMN "rail_title" varchar;
  ALTER TABLE "blog_promo_locales" ADD COLUMN "rail_body" varchar;
  ALTER TABLE "blog_promo_locales" ADD COLUMN "rail_link_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_promo" DROP COLUMN "rail_link_url";
  ALTER TABLE "blog_promo_locales" DROP COLUMN "inline_title";
  ALTER TABLE "blog_promo_locales" DROP COLUMN "rail_title";
  ALTER TABLE "blog_promo_locales" DROP COLUMN "rail_body";
  ALTER TABLE "blog_promo_locales" DROP COLUMN "rail_link_label";`)
}
