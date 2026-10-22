import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_identities" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider" varchar NOT NULL,
  	"subject" varchar NOT NULL
  );
  
  ALTER TABLE "users_identities" ADD CONSTRAINT "users_identities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_identities_order_idx" ON "users_identities" USING btree ("_order");
  CREATE INDEX "users_identities_parent_id_idx" ON "users_identities" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_identities" CASCADE;`)
}
