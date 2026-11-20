import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "courses_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_video_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_video_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "lessons_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "lessons_blocks_video_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_lessons_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lessons_v_blocks_video_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "courses_blocks_video" ADD CONSTRAINT "courses_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_video_locales" ADD CONSTRAINT "courses_blocks_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_video" ADD CONSTRAINT "_courses_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_video_locales" ADD CONSTRAINT "_courses_v_blocks_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_video" ADD CONSTRAINT "lessons_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_video_locales" ADD CONSTRAINT "lessons_blocks_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_blocks_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_video" ADD CONSTRAINT "_lessons_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_video_locales" ADD CONSTRAINT "_lessons_v_blocks_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_blocks_video"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_blocks_video_order_idx" ON "courses_blocks_video" USING btree ("_order");
  CREATE INDEX "courses_blocks_video_parent_id_idx" ON "courses_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_video_path_idx" ON "courses_blocks_video" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_video_locales_locale_parent_id_unique" ON "courses_blocks_video_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_video_locales_parent_id_idx" ON "courses_blocks_video_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_video_order_idx" ON "_courses_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_video_parent_id_idx" ON "_courses_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_video_path_idx" ON "_courses_v_blocks_video" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_video_locales_locale_parent_id_unique" ON "_courses_v_blocks_video_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_video_locales_parent_id_idx" ON "_courses_v_blocks_video_locales" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_video_order_idx" ON "lessons_blocks_video" USING btree ("_order");
  CREATE INDEX "lessons_blocks_video_parent_id_idx" ON "lessons_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_video_path_idx" ON "lessons_blocks_video" USING btree ("_path");
  CREATE UNIQUE INDEX "lessons_blocks_video_locales_locale_parent_id_unique" ON "lessons_blocks_video_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_blocks_video_locales_parent_id_idx" ON "lessons_blocks_video_locales" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_video_order_idx" ON "_lessons_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_video_parent_id_idx" ON "_lessons_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_video_path_idx" ON "_lessons_v_blocks_video" USING btree ("_path");
  CREATE UNIQUE INDEX "_lessons_v_blocks_video_locales_locale_parent_id_unique" ON "_lessons_v_blocks_video_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_blocks_video_locales_parent_id_idx" ON "_lessons_v_blocks_video_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "courses_blocks_video" CASCADE;
  DROP TABLE "courses_blocks_video_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_video" CASCADE;
  DROP TABLE "_courses_v_blocks_video_locales" CASCADE;
  DROP TABLE "lessons_blocks_video" CASCADE;
  DROP TABLE "lessons_blocks_video_locales" CASCADE;
  DROP TABLE "_lessons_v_blocks_video" CASCADE;
  DROP TABLE "_lessons_v_blocks_video_locales" CASCADE;`)
}
