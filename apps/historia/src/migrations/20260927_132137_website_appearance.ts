import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_websites_site_settings_appearance_theme" AS ENUM('default', 'bureau', 'ink');
  CREATE TYPE "public"."enum_websites_site_settings_appearance_color_scheme" AS ENUM('light', 'dark', 'both');
  ALTER TABLE "websites" ADD COLUMN "site_settings_appearance_theme" "enum_websites_site_settings_appearance_theme" DEFAULT 'default';
  ALTER TABLE "websites" ADD COLUMN "site_settings_appearance_color_scheme" "enum_websites_site_settings_appearance_color_scheme" DEFAULT 'both';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "websites" DROP COLUMN "site_settings_appearance_theme";
  ALTER TABLE "websites" DROP COLUMN "site_settings_appearance_color_scheme";
  DROP TYPE "public"."enum_websites_site_settings_appearance_theme";
  DROP TYPE "public"."enum_websites_site_settings_appearance_color_scheme";`)
}
