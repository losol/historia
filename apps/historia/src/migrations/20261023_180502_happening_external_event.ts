import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_happenings_external_event_system" AS ENUM('eventuras');
  ALTER TABLE "happenings" ADD COLUMN "external_event_system" "enum_happenings_external_event_system";
  ALTER TABLE "happenings" ADD COLUMN "external_event_uuid" varchar;
  CREATE INDEX "happenings_external_event_external_event_uuid_idx" ON "happenings" USING btree ("external_event_uuid");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "happenings_external_event_external_event_uuid_idx";
  ALTER TABLE "happenings" DROP COLUMN "external_event_system";
  ALTER TABLE "happenings" DROP COLUMN "external_event_uuid";
  DROP TYPE "public"."enum_happenings_external_event_system";`)
}
