import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" ADD COLUMN "amount" numeric;
  ALTER TABLE "carts" ADD COLUMN "currency" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" DROP COLUMN "amount";
  ALTER TABLE "carts" DROP COLUMN "currency";`)
}
