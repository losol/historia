import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_happenings" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 10,
  	"include_past" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_happenings_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_happenings" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"limit" numeric DEFAULT 10,
  	"include_past" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_happenings_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "pages_blocks_happenings" ADD CONSTRAINT "pages_blocks_happenings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_happenings_locales" ADD CONSTRAINT "pages_blocks_happenings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_happenings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_happenings" ADD CONSTRAINT "_pages_v_blocks_happenings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_happenings_locales" ADD CONSTRAINT "_pages_v_blocks_happenings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_happenings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_happenings_order_idx" ON "pages_blocks_happenings" USING btree ("_order");
  CREATE INDEX "pages_blocks_happenings_parent_id_idx" ON "pages_blocks_happenings" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_happenings_path_idx" ON "pages_blocks_happenings" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_happenings_locales_locale_parent_id_unique" ON "pages_blocks_happenings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_happenings_order_idx" ON "_pages_v_blocks_happenings" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_happenings_parent_id_idx" ON "_pages_v_blocks_happenings" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_happenings_path_idx" ON "_pages_v_blocks_happenings" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_happenings_locales_locale_parent_id_unique" ON "_pages_v_blocks_happenings_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_happenings" CASCADE;
  DROP TABLE "pages_blocks_happenings_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_happenings" CASCADE;
  DROP TABLE "_pages_v_blocks_happenings_locales" CASCADE;`)
}
