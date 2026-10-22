import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_archive_layout" AS ENUM('grid', 'featured', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_layout" AS ENUM('grid', 'featured', 'list');
  CREATE TABLE "pages_blocks_archive_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_archive_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "pages_blocks_archive" ADD COLUMN "layout" "enum_pages_blocks_archive_layout" DEFAULT 'grid';
  ALTER TABLE "pages_blocks_archive" ADD COLUMN "show_all_link" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_archive" ADD COLUMN "layout" "enum__pages_v_blocks_archive_layout" DEFAULT 'grid';
  ALTER TABLE "_pages_v_blocks_archive" ADD COLUMN "show_all_link" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_archive_locales" ADD CONSTRAINT "pages_blocks_archive_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_archive"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_archive_locales" ADD CONSTRAINT "_pages_v_blocks_archive_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_archive"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_blocks_archive_locales_locale_parent_id_unique" ON "pages_blocks_archive_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_archive_locales_locale_parent_id_unique" ON "_pages_v_blocks_archive_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_archive_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_archive_locales" CASCADE;
  ALTER TABLE "pages_blocks_archive" DROP COLUMN "layout";
  ALTER TABLE "pages_blocks_archive" DROP COLUMN "show_all_link";
  ALTER TABLE "_pages_v_blocks_archive" DROP COLUMN "layout";
  ALTER TABLE "_pages_v_blocks_archive" DROP COLUMN "show_all_link";
  DROP TYPE "public"."enum_pages_blocks_archive_layout";
  DROP TYPE "public"."enum__pages_v_blocks_archive_layout";`)
}
