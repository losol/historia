import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- format now has NOT NULL; backfill the plugin's default first so a stray
  -- legacy row cannot fail the migration (and with it, app startup).
  UPDATE "exports" SET "format" = 'csv' WHERE "format" IS NULL;
  ALTER TABLE "exports" ALTER COLUMN "format" SET NOT NULL;
  ALTER TABLE "exports" ALTER COLUMN "collection_slug" SET DEFAULT 'articles';
  ALTER TABLE "imports" ALTER COLUMN "collection_slug" SET DATA TYPE varchar;
  ALTER TABLE "imports" ALTER COLUMN "collection_slug" SET DEFAULT 'articles';
  DROP TYPE "public"."enum_imports_collection_slug";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_imports_collection_slug" AS ENUM('articles', 'instructions', 'notes', 'pages', 'users', 'orders');
  ALTER TABLE "exports" ALTER COLUMN "format" DROP NOT NULL;
  ALTER TABLE "exports" ALTER COLUMN "collection_slug" DROP DEFAULT;
  -- Drop the varchar default before the type change: Postgres cannot cast it to
  -- the enum automatically. (The generated order had these two swapped.)
  ALTER TABLE "imports" ALTER COLUMN "collection_slug" DROP DEFAULT;
  ALTER TABLE "imports" ALTER COLUMN "collection_slug" SET DATA TYPE "public"."enum_imports_collection_slug" USING "collection_slug"::"public"."enum_imports_collection_slug";`)
}
