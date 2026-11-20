import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" ADD COLUMN "courses_id" uuid;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_courses_id_idx" ON "search_rels" USING btree ("courses_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_courses_fk";
  
  DROP INDEX "search_rels_courses_id_idx";
  ALTER TABLE "search_rels" DROP COLUMN "courses_id";`)
}
