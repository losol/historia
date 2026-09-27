import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "payment_reference" varchar;
  CREATE UNIQUE INDEX "orders_payment_reference_idx" ON "orders" USING btree ("payment_reference");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_payment_reference_idx";
  ALTER TABLE "orders" DROP COLUMN "payment_reference";`)
}
