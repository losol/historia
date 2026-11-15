import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_courses_access" AS ENUM('public', 'enrolled');
  CREATE TYPE "public"."enum_courses_external_event_system" AS ENUM('eventuras');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_version_access" AS ENUM('public', 'enrolled');
  CREATE TYPE "public"."enum__courses_v_version_external_event_system" AS ENUM('eventuras');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_published_locale" AS ENUM('no', 'en');
  CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_published_locale" AS ENUM('no', 'en');
  CREATE TABLE "courses_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_content_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_image_locales" (
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_syllabus" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_syllabus_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_contributors" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"person_id" uuid
  );
  
  CREATE TABLE "courses_contributors_locales" (
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid,
  	"image_media_id" uuid,
  	"access" "enum_courses_access" DEFAULT 'public',
  	"duration_minutes" numeric,
  	"external_event_system" "enum_courses_external_event_system",
  	"external_event_uuid" varchar,
  	"published_at" timestamp(3) with time zone,
  	"slug_lock" boolean DEFAULT true,
  	"resource_id" varchar,
  	"config" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_courses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "courses_locales" (
  	"title" varchar,
  	"lead" varchar,
  	"image_caption" jsonb,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"lessons_id" uuid,
  	"topics_id" uuid
  );
  
  CREATE TABLE "_courses_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_content_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"media_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_image_locales" (
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_syllabus" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_syllabus_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_contributors" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"person_id" uuid,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_contributors_locales" (
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_courses_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_tenant_id" uuid,
  	"version_image_media_id" uuid,
  	"version_access" "enum__courses_v_version_access" DEFAULT 'public',
  	"version_duration_minutes" numeric,
  	"version_external_event_system" "enum__courses_v_version_external_event_system",
  	"version_external_event_uuid" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_slug_lock" boolean DEFAULT true,
  	"version_resource_id" varchar,
  	"version_config" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__courses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__courses_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_courses_v_locales" (
  	"version_title" varchar,
  	"version_lead" varchar,
  	"version_image_caption" jsonb,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"lessons_id" uuid,
  	"topics_id" uuid
  );
  
  CREATE TABLE "lessons_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lessons_blocks_content_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lessons_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "lessons_blocks_image_locales" (
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lessons" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid,
  	"duration_minutes" numeric,
  	"image_media_id" uuid,
  	"published_at" timestamp(3) with time zone,
  	"slug_lock" boolean DEFAULT true,
  	"resource_id" varchar,
  	"config" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lessons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "lessons_locales" (
  	"title" varchar,
  	"lead" varchar,
  	"image_caption" jsonb,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_lessons_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lessons_v_blocks_content_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_lessons_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"media_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lessons_v_blocks_image_locales" (
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_lessons_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_tenant_id" uuid,
  	"version_duration_minutes" numeric,
  	"version_image_media_id" uuid,
  	"version_published_at" timestamp(3) with time zone,
  	"version_slug_lock" boolean DEFAULT true,
  	"version_resource_id" varchar,
  	"version_config" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lessons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__lessons_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_lessons_v_locales" (
  	"version_title" varchar,
  	"version_lead" varchar,
  	"version_image_caption" jsonb,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "courses_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lessons_id" uuid;
  ALTER TABLE "courses_blocks_content" ADD CONSTRAINT "courses_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_content_locales" ADD CONSTRAINT "courses_blocks_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_image" ADD CONSTRAINT "courses_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_image" ADD CONSTRAINT "courses_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_image_locales" ADD CONSTRAINT "courses_blocks_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_syllabus" ADD CONSTRAINT "courses_syllabus_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_syllabus_locales" ADD CONSTRAINT "courses_syllabus_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_syllabus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_contributors" ADD CONSTRAINT "courses_contributors_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_contributors" ADD CONSTRAINT "courses_contributors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_contributors_locales" ADD CONSTRAINT "courses_contributors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_websites_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_content" ADD CONSTRAINT "_courses_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_content_locales" ADD CONSTRAINT "_courses_v_blocks_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_image" ADD CONSTRAINT "_courses_v_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_image" ADD CONSTRAINT "_courses_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_image_locales" ADD CONSTRAINT "_courses_v_blocks_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_syllabus" ADD CONSTRAINT "_courses_v_version_syllabus_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_syllabus_locales" ADD CONSTRAINT "_courses_v_version_syllabus_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_syllabus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_contributors" ADD CONSTRAINT "_courses_v_version_contributors_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_contributors" ADD CONSTRAINT "_courses_v_version_contributors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_contributors_locales" ADD CONSTRAINT "_courses_v_version_contributors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_tenant_id_websites_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_image_media_id_media_id_fk" FOREIGN KEY ("version_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_locales" ADD CONSTRAINT "_courses_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_locales" ADD CONSTRAINT "_courses_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_content" ADD CONSTRAINT "lessons_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_content_locales" ADD CONSTRAINT "lessons_blocks_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_image" ADD CONSTRAINT "lessons_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_blocks_image" ADD CONSTRAINT "lessons_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_image_locales" ADD CONSTRAINT "lessons_blocks_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_blocks_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_id_websites_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_locales" ADD CONSTRAINT "lessons_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_locales" ADD CONSTRAINT "lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_content" ADD CONSTRAINT "_lessons_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_content_locales" ADD CONSTRAINT "_lessons_v_blocks_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_image" ADD CONSTRAINT "_lessons_v_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_image" ADD CONSTRAINT "_lessons_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_image_locales" ADD CONSTRAINT "_lessons_v_blocks_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_blocks_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_tenant_id_websites_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_image_media_id_media_id_fk" FOREIGN KEY ("version_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_locales" ADD CONSTRAINT "_lessons_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_locales" ADD CONSTRAINT "_lessons_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_blocks_content_order_idx" ON "courses_blocks_content" USING btree ("_order");
  CREATE INDEX "courses_blocks_content_parent_id_idx" ON "courses_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_content_path_idx" ON "courses_blocks_content" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_content_locales_locale_parent_id_unique" ON "courses_blocks_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_content_locales_parent_id_idx" ON "courses_blocks_content_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_image_order_idx" ON "courses_blocks_image" USING btree ("_order");
  CREATE INDEX "courses_blocks_image_parent_id_idx" ON "courses_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_image_path_idx" ON "courses_blocks_image" USING btree ("_path");
  CREATE INDEX "courses_blocks_image_media_idx" ON "courses_blocks_image" USING btree ("media_id");
  CREATE UNIQUE INDEX "courses_blocks_image_locales_locale_parent_id_unique" ON "courses_blocks_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_image_locales_parent_id_idx" ON "courses_blocks_image_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_syllabus_order_idx" ON "courses_syllabus" USING btree ("_order");
  CREATE INDEX "courses_syllabus_parent_id_idx" ON "courses_syllabus" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_syllabus_locales_locale_parent_id_unique" ON "courses_syllabus_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_syllabus_locales_parent_id_idx" ON "courses_syllabus_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_contributors_order_idx" ON "courses_contributors" USING btree ("_order");
  CREATE INDEX "courses_contributors_parent_id_idx" ON "courses_contributors" USING btree ("_parent_id");
  CREATE INDEX "courses_contributors_person_idx" ON "courses_contributors" USING btree ("person_id");
  CREATE UNIQUE INDEX "courses_contributors_locales_locale_parent_id_unique" ON "courses_contributors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_contributors_locales_parent_id_idx" ON "courses_contributors_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_tenant_idx" ON "courses" USING btree ("tenant_id");
  CREATE INDEX "courses_image_image_media_idx" ON "courses" USING btree ("image_media_id");
  CREATE INDEX "courses_external_event_external_event_uuid_idx" ON "courses" USING btree ("external_event_uuid");
  CREATE UNIQUE INDEX "courses_resource_id_idx" ON "courses" USING btree ("resource_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses__status_idx" ON "courses" USING btree ("_status");
  CREATE INDEX "courses_slug_idx" ON "courses_locales" USING btree ("slug","_locale");
  CREATE INDEX "courses_meta_meta_image_idx" ON "courses_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_locales_parent_id_idx" ON "courses_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_lessons_id_idx" ON "courses_rels" USING btree ("lessons_id");
  CREATE INDEX "courses_rels_topics_id_idx" ON "courses_rels" USING btree ("topics_id");
  CREATE INDEX "_courses_v_blocks_content_order_idx" ON "_courses_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_content_parent_id_idx" ON "_courses_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_content_path_idx" ON "_courses_v_blocks_content" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_content_locales_locale_parent_id_unique" ON "_courses_v_blocks_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_content_locales_parent_id_idx" ON "_courses_v_blocks_content_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_image_order_idx" ON "_courses_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_image_parent_id_idx" ON "_courses_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_image_path_idx" ON "_courses_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_courses_v_blocks_image_media_idx" ON "_courses_v_blocks_image" USING btree ("media_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_image_locales_locale_parent_id_unique" ON "_courses_v_blocks_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_image_locales_parent_id_idx" ON "_courses_v_blocks_image_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_syllabus_order_idx" ON "_courses_v_version_syllabus" USING btree ("_order");
  CREATE INDEX "_courses_v_version_syllabus_parent_id_idx" ON "_courses_v_version_syllabus" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_version_syllabus_locales_locale_parent_id_unique" ON "_courses_v_version_syllabus_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_version_syllabus_locales_parent_id_idx" ON "_courses_v_version_syllabus_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_contributors_order_idx" ON "_courses_v_version_contributors" USING btree ("_order");
  CREATE INDEX "_courses_v_version_contributors_parent_id_idx" ON "_courses_v_version_contributors" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_contributors_person_idx" ON "_courses_v_version_contributors" USING btree ("person_id");
  CREATE UNIQUE INDEX "_courses_v_version_contributors_locales_locale_parent_id_uni" ON "_courses_v_version_contributors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_version_contributors_locales_parent_id_idx" ON "_courses_v_version_contributors_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version_tenant_idx" ON "_courses_v" USING btree ("version_tenant_id");
  CREATE INDEX "_courses_v_version_image_version_image_media_idx" ON "_courses_v" USING btree ("version_image_media_id");
  CREATE INDEX "_courses_v_version_external_event_version_external_event_idx" ON "_courses_v" USING btree ("version_external_event_uuid");
  CREATE INDEX "_courses_v_version_version_resource_id_idx" ON "_courses_v" USING btree ("version_resource_id");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v" USING btree ("version__status");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_snapshot_idx" ON "_courses_v" USING btree ("snapshot");
  CREATE INDEX "_courses_v_published_locale_idx" ON "_courses_v" USING btree ("published_locale");
  CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
  CREATE INDEX "_courses_v_autosave_idx" ON "_courses_v" USING btree ("autosave");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_courses_v_version_meta_version_meta_image_idx" ON "_courses_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_courses_v_locales_locale_parent_id_unique" ON "_courses_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_locales_parent_id_idx" ON "_courses_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_rels_order_idx" ON "_courses_v_rels" USING btree ("order");
  CREATE INDEX "_courses_v_rels_parent_idx" ON "_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_courses_v_rels_path_idx" ON "_courses_v_rels" USING btree ("path");
  CREATE INDEX "_courses_v_rels_lessons_id_idx" ON "_courses_v_rels" USING btree ("lessons_id");
  CREATE INDEX "_courses_v_rels_topics_id_idx" ON "_courses_v_rels" USING btree ("topics_id");
  CREATE INDEX "lessons_blocks_content_order_idx" ON "lessons_blocks_content" USING btree ("_order");
  CREATE INDEX "lessons_blocks_content_parent_id_idx" ON "lessons_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_content_path_idx" ON "lessons_blocks_content" USING btree ("_path");
  CREATE UNIQUE INDEX "lessons_blocks_content_locales_locale_parent_id_unique" ON "lessons_blocks_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_blocks_content_locales_parent_id_idx" ON "lessons_blocks_content_locales" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_image_order_idx" ON "lessons_blocks_image" USING btree ("_order");
  CREATE INDEX "lessons_blocks_image_parent_id_idx" ON "lessons_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_image_path_idx" ON "lessons_blocks_image" USING btree ("_path");
  CREATE INDEX "lessons_blocks_image_media_idx" ON "lessons_blocks_image" USING btree ("media_id");
  CREATE UNIQUE INDEX "lessons_blocks_image_locales_locale_parent_id_unique" ON "lessons_blocks_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_blocks_image_locales_parent_id_idx" ON "lessons_blocks_image_locales" USING btree ("_parent_id");
  CREATE INDEX "lessons_tenant_idx" ON "lessons" USING btree ("tenant_id");
  CREATE INDEX "lessons_image_image_media_idx" ON "lessons" USING btree ("image_media_id");
  CREATE UNIQUE INDEX "lessons_resource_id_idx" ON "lessons" USING btree ("resource_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons__status_idx" ON "lessons" USING btree ("_status");
  CREATE INDEX "lessons_slug_idx" ON "lessons_locales" USING btree ("slug","_locale");
  CREATE INDEX "lessons_meta_meta_image_idx" ON "lessons_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "lessons_locales_locale_parent_id_unique" ON "lessons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_locales_parent_id_idx" ON "lessons_locales" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_content_order_idx" ON "_lessons_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_content_parent_id_idx" ON "_lessons_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_content_path_idx" ON "_lessons_v_blocks_content" USING btree ("_path");
  CREATE UNIQUE INDEX "_lessons_v_blocks_content_locales_locale_parent_id_unique" ON "_lessons_v_blocks_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_blocks_content_locales_parent_id_idx" ON "_lessons_v_blocks_content_locales" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_image_order_idx" ON "_lessons_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_image_parent_id_idx" ON "_lessons_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_image_path_idx" ON "_lessons_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_lessons_v_blocks_image_media_idx" ON "_lessons_v_blocks_image" USING btree ("media_id");
  CREATE UNIQUE INDEX "_lessons_v_blocks_image_locales_locale_parent_id_unique" ON "_lessons_v_blocks_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_blocks_image_locales_parent_id_idx" ON "_lessons_v_blocks_image_locales" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_tenant_idx" ON "_lessons_v" USING btree ("version_tenant_id");
  CREATE INDEX "_lessons_v_version_image_version_image_media_idx" ON "_lessons_v" USING btree ("version_image_media_id");
  CREATE INDEX "_lessons_v_version_version_resource_id_idx" ON "_lessons_v" USING btree ("version_resource_id");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_version_version__status_idx" ON "_lessons_v" USING btree ("version__status");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "_lessons_v_snapshot_idx" ON "_lessons_v" USING btree ("snapshot");
  CREATE INDEX "_lessons_v_published_locale_idx" ON "_lessons_v" USING btree ("published_locale");
  CREATE INDEX "_lessons_v_latest_idx" ON "_lessons_v" USING btree ("latest");
  CREATE INDEX "_lessons_v_autosave_idx" ON "_lessons_v" USING btree ("autosave");
  CREATE INDEX "_lessons_v_version_version_slug_idx" ON "_lessons_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_lessons_v_version_meta_version_meta_image_idx" ON "_lessons_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_lessons_v_locales_locale_parent_id_unique" ON "_lessons_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_locales_parent_id_idx" ON "_lessons_v_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_syllabus" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_syllabus_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_contributors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_contributors_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_syllabus" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_syllabus_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_contributors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_contributors_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses_blocks_content" CASCADE;
  DROP TABLE "courses_blocks_content_locales" CASCADE;
  DROP TABLE "courses_blocks_image" CASCADE;
  DROP TABLE "courses_blocks_image_locales" CASCADE;
  DROP TABLE "courses_syllabus" CASCADE;
  DROP TABLE "courses_syllabus_locales" CASCADE;
  DROP TABLE "courses_contributors" CASCADE;
  DROP TABLE "courses_contributors_locales" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_locales" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "_courses_v_blocks_content" CASCADE;
  DROP TABLE "_courses_v_blocks_content_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_image" CASCADE;
  DROP TABLE "_courses_v_blocks_image_locales" CASCADE;
  DROP TABLE "_courses_v_version_syllabus" CASCADE;
  DROP TABLE "_courses_v_version_syllabus_locales" CASCADE;
  DROP TABLE "_courses_v_version_contributors" CASCADE;
  DROP TABLE "_courses_v_version_contributors_locales" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "_courses_v_locales" CASCADE;
  DROP TABLE "_courses_v_rels" CASCADE;
  DROP TABLE "lessons_blocks_content" CASCADE;
  DROP TABLE "lessons_blocks_content_locales" CASCADE;
  DROP TABLE "lessons_blocks_image" CASCADE;
  DROP TABLE "lessons_blocks_image_locales" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "lessons_locales" CASCADE;
  DROP TABLE "_lessons_v_blocks_content" CASCADE;
  DROP TABLE "_lessons_v_blocks_content_locales" CASCADE;
  DROP TABLE "_lessons_v_blocks_image" CASCADE;
  DROP TABLE "_lessons_v_blocks_image_locales" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "_lessons_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_courses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lessons_fk";
  
  DROP INDEX "payload_locked_documents_rels_courses_id_idx";
  DROP INDEX "payload_locked_documents_rels_lessons_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "courses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lessons_id";
  DROP TYPE "public"."enum_courses_access";
  DROP TYPE "public"."enum_courses_external_event_system";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_version_access";
  DROP TYPE "public"."enum__courses_v_version_external_event_system";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum__courses_v_published_locale";
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_version_status";
  DROP TYPE "public"."enum__lessons_v_published_locale";`)
}
