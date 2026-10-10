import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search" ADD COLUMN "tenant_id" uuid;
  ALTER TABLE "search" ADD CONSTRAINT "search_tenant_id_websites_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "search_tenant_idx" ON "search" USING btree ("tenant_id");`)

  // Existing entries take the website of the document they index.
  await db.execute(sql`
   UPDATE "search" s SET "tenant_id" = COALESCE(a."tenant_id", n."tenant_id", p."tenant_id")
   FROM "search_rels" r
   LEFT JOIN "articles" a ON a."id" = r."articles_id"
   LEFT JOIN "notes" n ON n."id" = r."notes_id"
   LEFT JOIN "pages" p ON p."id" = r."pages_id"
   WHERE r."parent_id" = s."id" AND r."path" = 'doc';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search" DROP CONSTRAINT "search_tenant_id_websites_id_fk";
  
  DROP INDEX "search_tenant_idx";
  ALTER TABLE "search" DROP COLUMN "tenant_id";`)
}
