import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_hero_style" AS ENUM('standard', 'poster');
  CREATE TYPE "public"."enum__pages_v_version_hero_style" AS ENUM('standard', 'poster');
  CREATE TYPE "public"."enum_websites_site_settings_appearance_footer" AS ENUM('classic', 'display');
  ALTER TYPE "public"."enum_pages_blocks_archive_layout" ADD VALUE 'poster';
  ALTER TYPE "public"."enum_pages_blocks_archive_layout" ADD VALUE 'numbered';
  ALTER TYPE "public"."enum_pages_blocks_archive_layout" ADD VALUE 'band';
  ALTER TYPE "public"."enum__pages_v_blocks_archive_layout" ADD VALUE 'poster';
  ALTER TYPE "public"."enum__pages_v_blocks_archive_layout" ADD VALUE 'numbered';
  ALTER TYPE "public"."enum__pages_v_blocks_archive_layout" ADD VALUE 'band';
  ALTER TABLE "pages_blocks_archive" ADD COLUMN "skip" numeric DEFAULT 0;
  ALTER TABLE "pages" ADD COLUMN "hero_style" "enum_pages_hero_style" DEFAULT 'standard';
  ALTER TABLE "_pages_v_blocks_archive" ADD COLUMN "skip" numeric DEFAULT 0;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_style" "enum__pages_v_version_hero_style" DEFAULT 'standard';
  ALTER TABLE "websites" ADD COLUMN "site_settings_appearance_footer" "enum_websites_site_settings_appearance_footer" DEFAULT 'classic';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_archive" ALTER COLUMN "layout" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_archive" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_pages_blocks_archive_layout";
  CREATE TYPE "public"."enum_pages_blocks_archive_layout" AS ENUM('grid', 'featured', 'list');
  ALTER TABLE "pages_blocks_archive" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_pages_blocks_archive_layout";
  ALTER TABLE "pages_blocks_archive" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_pages_blocks_archive_layout" USING "layout"::"public"."enum_pages_blocks_archive_layout";
  ALTER TABLE "_pages_v_blocks_archive" ALTER COLUMN "layout" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_archive" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__pages_v_blocks_archive_layout";
  CREATE TYPE "public"."enum__pages_v_blocks_archive_layout" AS ENUM('grid', 'featured', 'list');
  ALTER TABLE "_pages_v_blocks_archive" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__pages_v_blocks_archive_layout";
  ALTER TABLE "_pages_v_blocks_archive" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__pages_v_blocks_archive_layout" USING "layout"::"public"."enum__pages_v_blocks_archive_layout";
  ALTER TABLE "pages_blocks_archive" DROP COLUMN "skip";
  ALTER TABLE "pages" DROP COLUMN "hero_style";
  ALTER TABLE "_pages_v_blocks_archive" DROP COLUMN "skip";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_style";
  ALTER TABLE "websites" DROP COLUMN "site_settings_appearance_footer";
  DROP TYPE "public"."enum_pages_hero_style";
  DROP TYPE "public"."enum__pages_v_version_hero_style";
  DROP TYPE "public"."enum_websites_site_settings_appearance_footer";`)
}
