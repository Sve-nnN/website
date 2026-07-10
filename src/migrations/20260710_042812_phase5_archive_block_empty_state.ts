import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_archive_block_locales" (
  	"empty_state_heading" varchar DEFAULT 'Nothing here yet',
  	"empty_state_body" varchar DEFAULT 'This category doesn''t have any posts yet. Browse all posts instead.',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_archive_block_locales" (
  	"empty_state_heading" varchar DEFAULT 'Nothing here yet',
  	"empty_state_body" varchar DEFAULT 'This category doesn''t have any posts yet. Browse all posts instead.',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_archive_block_2" ADD COLUMN "empty_state_heading" varchar DEFAULT 'Nothing here yet';
  ALTER TABLE "pages_blocks_archive_block_2" ADD COLUMN "empty_state_body" varchar DEFAULT 'This category doesn''t have any posts yet. Browse all posts instead.';
  ALTER TABLE "_pages_v_blocks_archive_block_2" ADD COLUMN "empty_state_heading" varchar DEFAULT 'Nothing here yet';
  ALTER TABLE "_pages_v_blocks_archive_block_2" ADD COLUMN "empty_state_body" varchar DEFAULT 'This category doesn''t have any posts yet. Browse all posts instead.';
  ALTER TABLE "pages_blocks_archive_block_locales" ADD CONSTRAINT "pages_blocks_archive_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_archive_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_archive_block_locales" ADD CONSTRAINT "_pages_v_blocks_archive_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_archive_block"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_blocks_archive_block_locales_locale_parent_id_unique" ON "pages_blocks_archive_block_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_archive_block_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_archive_block_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_archive_block_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_archive_block_locales" CASCADE;
  ALTER TABLE "pages_blocks_archive_block_2" DROP COLUMN "empty_state_heading";
  ALTER TABLE "pages_blocks_archive_block_2" DROP COLUMN "empty_state_body";
  ALTER TABLE "_pages_v_blocks_archive_block_2" DROP COLUMN "empty_state_heading";
  ALTER TABLE "_pages_v_blocks_archive_block_2" DROP COLUMN "empty_state_body";`)
}
