import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await assertNoUnplaceableImages(db)

  await db.execute(sql`
   ALTER TABLE "articles" DROP CONSTRAINT "articles_meta_image_id_media_id_fk";
  
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "cases" DROP CONSTRAINT "cases_meta_image_id_media_id_fk";
  
  ALTER TABLE "_cases_v" DROP CONSTRAINT "_cases_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "happenings" DROP CONSTRAINT "happenings_meta_image_id_media_id_fk";
  
  ALTER TABLE "instructions" DROP CONSTRAINT "instructions_meta_image_id_media_id_fk";
  
  ALTER TABLE "_instructions_v" DROP CONSTRAINT "_instructions_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "notes" DROP CONSTRAINT "notes_meta_image_id_media_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_meta_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_meta_image_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "timelines" DROP CONSTRAINT "timelines_meta_image_id_media_id_fk";
  
  ALTER TABLE "_timelines_v" DROP CONSTRAINT "_timelines_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "websites" DROP CONSTRAINT "websites_meta_image_id_media_id_fk";
  
  DROP INDEX "articles_meta_meta_image_idx";
  DROP INDEX "_articles_v_version_meta_version_meta_image_idx";
  DROP INDEX "cases_meta_meta_image_idx";
  DROP INDEX "_cases_v_version_meta_version_meta_image_idx";
  DROP INDEX "happenings_meta_meta_image_idx";
  DROP INDEX "instructions_meta_meta_image_idx";
  DROP INDEX "_instructions_v_version_meta_version_meta_image_idx";
  DROP INDEX "notes_meta_meta_image_idx";
  DROP INDEX "pages_meta_meta_image_idx";
  DROP INDEX "_pages_v_version_meta_version_meta_image_idx";
  DROP INDEX "products_meta_meta_image_idx";
  DROP INDEX "_products_v_version_meta_version_meta_image_idx";
  DROP INDEX "timelines_meta_meta_image_idx";
  DROP INDEX "_timelines_v_version_meta_version_meta_image_idx";
  DROP INDEX "websites_meta_meta_image_idx";
  ALTER TABLE "articles_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "cases_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_cases_v_locales" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "happenings_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "instructions_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_instructions_v_locales" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "notes_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "products_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "timelines_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_timelines_v_locales" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "websites_locales" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "articles_locales" ADD CONSTRAINT "articles_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_locales" ADD CONSTRAINT "_articles_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_locales" ADD CONSTRAINT "cases_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_locales" ADD CONSTRAINT "_cases_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "happenings_locales" ADD CONSTRAINT "happenings_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "instructions_locales" ADD CONSTRAINT "instructions_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_instructions_v_locales" ADD CONSTRAINT "_instructions_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notes_locales" ADD CONSTRAINT "notes_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_locales" ADD CONSTRAINT "_products_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timelines_locales" ADD CONSTRAINT "timelines_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_timelines_v_locales" ADD CONSTRAINT "_timelines_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "websites_locales" ADD CONSTRAINT "websites_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE INDEX "cases_meta_meta_image_idx" ON "cases_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "_cases_v_version_meta_version_meta_image_idx" ON "_cases_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE INDEX "happenings_meta_meta_image_idx" ON "happenings_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "instructions_meta_meta_image_idx" ON "instructions_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "_instructions_v_version_meta_version_meta_image_idx" ON "_instructions_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE INDEX "notes_meta_meta_image_idx" ON "notes_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE INDEX "products_meta_meta_image_idx" ON "products_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "_products_v_version_meta_version_meta_image_idx" ON "_products_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE INDEX "timelines_meta_meta_image_idx" ON "timelines_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "_timelines_v_version_meta_version_meta_image_idx" ON "_timelines_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE INDEX "websites_meta_meta_image_idx" ON "websites_locales" USING btree ("meta_image_id","_locale");
`)

  await copyImageIntoLocales(db, defaultLocale(payload))

  await db.execute(sql`
  ALTER TABLE "articles" DROP COLUMN "meta_image_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "cases" DROP COLUMN "meta_image_id";
  ALTER TABLE "_cases_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "happenings" DROP COLUMN "meta_image_id";
  ALTER TABLE "instructions" DROP COLUMN "meta_image_id";
  ALTER TABLE "_instructions_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "notes" DROP COLUMN "meta_image_id";
  ALTER TABLE "pages" DROP COLUMN "meta_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "products" DROP COLUMN "meta_image_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "timelines" DROP COLUMN "meta_image_id";
  ALTER TABLE "_timelines_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "websites" DROP COLUMN "meta_image_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles_locales" DROP CONSTRAINT "articles_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "_articles_v_locales" DROP CONSTRAINT "_articles_v_locales_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "cases_locales" DROP CONSTRAINT "cases_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "_cases_v_locales" DROP CONSTRAINT "_cases_v_locales_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "happenings_locales" DROP CONSTRAINT "happenings_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "instructions_locales" DROP CONSTRAINT "instructions_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "_instructions_v_locales" DROP CONSTRAINT "_instructions_v_locales_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "notes_locales" DROP CONSTRAINT "notes_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "pages_locales" DROP CONSTRAINT "pages_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v_locales" DROP CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "products_locales" DROP CONSTRAINT "products_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "_products_v_locales" DROP CONSTRAINT "_products_v_locales_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "timelines_locales" DROP CONSTRAINT "timelines_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "_timelines_v_locales" DROP CONSTRAINT "_timelines_v_locales_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "websites_locales" DROP CONSTRAINT "websites_locales_meta_image_id_media_id_fk";
  
  DROP INDEX "articles_meta_meta_image_idx";
  DROP INDEX "_articles_v_version_meta_version_meta_image_idx";
  DROP INDEX "cases_meta_meta_image_idx";
  DROP INDEX "_cases_v_version_meta_version_meta_image_idx";
  DROP INDEX "happenings_meta_meta_image_idx";
  DROP INDEX "instructions_meta_meta_image_idx";
  DROP INDEX "_instructions_v_version_meta_version_meta_image_idx";
  DROP INDEX "notes_meta_meta_image_idx";
  DROP INDEX "pages_meta_meta_image_idx";
  DROP INDEX "_pages_v_version_meta_version_meta_image_idx";
  DROP INDEX "products_meta_meta_image_idx";
  DROP INDEX "_products_v_version_meta_version_meta_image_idx";
  DROP INDEX "timelines_meta_meta_image_idx";
  DROP INDEX "_timelines_v_version_meta_version_meta_image_idx";
  DROP INDEX "websites_meta_meta_image_idx";
  ALTER TABLE "articles" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_articles_v" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "cases" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_cases_v" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "happenings" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "instructions" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_instructions_v" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "notes" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "pages" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "products" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_products_v" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "timelines" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "_timelines_v" ADD COLUMN "version_meta_image_id" uuid;
  ALTER TABLE "websites" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "happenings" ADD CONSTRAINT "happenings_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "instructions" ADD CONSTRAINT "instructions_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_instructions_v" ADD CONSTRAINT "_instructions_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notes" ADD CONSTRAINT "notes_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timelines" ADD CONSTRAINT "timelines_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_timelines_v" ADD CONSTRAINT "_timelines_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "websites" ADD CONSTRAINT "websites_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "cases_meta_meta_image_idx" ON "cases" USING btree ("meta_image_id");
  CREATE INDEX "_cases_v_version_meta_version_meta_image_idx" ON "_cases_v" USING btree ("version_meta_image_id");
  CREATE INDEX "happenings_meta_meta_image_idx" ON "happenings" USING btree ("meta_image_id");
  CREATE INDEX "instructions_meta_meta_image_idx" ON "instructions" USING btree ("meta_image_id");
  CREATE INDEX "_instructions_v_version_meta_version_meta_image_idx" ON "_instructions_v" USING btree ("version_meta_image_id");
  CREATE INDEX "notes_meta_meta_image_idx" ON "notes" USING btree ("meta_image_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "products_meta_meta_image_idx" ON "products" USING btree ("meta_image_id");
  CREATE INDEX "_products_v_version_meta_version_meta_image_idx" ON "_products_v" USING btree ("version_meta_image_id");
  CREATE INDEX "timelines_meta_meta_image_idx" ON "timelines" USING btree ("meta_image_id");
  CREATE INDEX "_timelines_v_version_meta_version_meta_image_idx" ON "_timelines_v" USING btree ("version_meta_image_id");
  CREATE INDEX "websites_meta_meta_image_idx" ON "websites" USING btree ("meta_image_id");
`)

  await copyImageBackFromLocales(db, defaultLocale(payload))

  await db.execute(sql`
  ALTER TABLE "articles_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "_articles_v_locales" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "cases_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "_cases_v_locales" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "happenings_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "instructions_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "_instructions_v_locales" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "notes_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "pages_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "products_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "timelines_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "_timelines_v_locales" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "websites_locales" DROP COLUMN "meta_image_id";`)
}

/**
 * `meta.image` moves from a column on each document (and version) table to a
 * column on its `_locales` table. The generated DDL alone would drop the old
 * column and lose every SEO image, so the data is carried across between the
 * ADD and the DROP. Payload runs each migration in a single transaction.
 */
const TABLES = [
  // insertMissing: a document with an image but no locale row at all (a draft
  // with no localized content yet) gets a default-locale row to hold it. Off
  // where the locale table has other NOT NULL columns, which an insert could
  // not satisfy; the app always writes a locale row there, and
  // assertNoUnplaceableImages stops the migration if one is missing anyway.
  { table: 'articles', column: 'meta_image_id', insertMissing: true },
  { table: '_articles_v', column: 'version_meta_image_id', insertMissing: true },
  { table: 'cases', column: 'meta_image_id', insertMissing: true },
  { table: '_cases_v', column: 'version_meta_image_id', insertMissing: true },
  { table: 'happenings', column: 'meta_image_id', insertMissing: false },
  { table: 'instructions', column: 'meta_image_id', insertMissing: true },
  { table: '_instructions_v', column: 'version_meta_image_id', insertMissing: true },
  { table: 'notes', column: 'meta_image_id', insertMissing: false },
  { table: 'pages', column: 'meta_image_id', insertMissing: true },
  { table: '_pages_v', column: 'version_meta_image_id', insertMissing: true },
  { table: 'products', column: 'meta_image_id', insertMissing: true },
  { table: '_products_v', column: 'version_meta_image_id', insertMissing: true },
  { table: 'timelines', column: 'meta_image_id', insertMissing: true },
  { table: '_timelines_v', column: 'version_meta_image_id', insertMissing: true },
  { table: 'websites', column: 'meta_image_id', insertMissing: false },
] as const

function defaultLocale(payload: MigrateUpArgs['payload']): string {
  const { localization } = payload.config
  if (!localization) throw new Error('localize_meta_image requires localization to be enabled')
  return localization.defaultLocale
}

/**
 * Fail before any DDL runs if a table that cannot take new locale rows has a
 * document with an image but no locale row. That such a row always exists is
 * only a convention of how the app writes data, not something the database
 * enforces, and without one the DROP would lose the image silently.
 */
async function assertNoUnplaceableImages(db: MigrateUpArgs['db']): Promise<void> {
  const unplaceable: string[] = []

  for (const { table, column, insertMissing } of TABLES) {
    if (insertMissing) continue

    const t = sql.raw(`"${table}"`)
    const l = sql.raw(`"${table}_locales"`)
    const c = sql.raw(`"${column}"`)

    const { rows } = await db.execute(sql`
      SELECT p."id"::text AS id, p.${c}::text AS image
      FROM ${t} AS p
      WHERE p.${c} IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM ${l} AS l WHERE l."_parent_id" = p."id");`)

    for (const row of rows) unplaceable.push(`${table} ${row.id} (image ${row.image})`)
  }

  if (unplaceable.length > 0) {
    throw new Error(
      `localize_meta_image: ${unplaceable.length} document(s) have an SEO image but no locale ` +
        'row, and their table cannot take a new one. Give each a locale row or clear its ' +
        `image, then run the migration again:\n  ${unplaceable.join('\n  ')}`,
    )
  }
}

/**
 * Copy each document's image into every locale row it has, so each language
 * keeps showing the image it showed before.
 */
async function copyImageIntoLocales(db: MigrateUpArgs['db'], locale: string): Promise<void> {
  for (const { table, column, insertMissing } of TABLES) {
    const t = sql.raw(`"${table}"`)
    const l = sql.raw(`"${table}_locales"`)
    const c = sql.raw(`"${column}"`)

    await db.execute(sql`
      UPDATE ${l} AS l SET ${c} = p.${c}
      FROM ${t} AS p
      WHERE l."_parent_id" = p."id" AND p.${c} IS NOT NULL;`)

    if (insertMissing) {
      await db.execute(sql`
        INSERT INTO ${l} ("_locale", "_parent_id", ${c})
        SELECT ${locale}::"_locales", p."id", p.${c}
        FROM ${t} AS p
        WHERE p.${c} IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM ${l} AS l WHERE l."_parent_id" = p."id");`)
    }
  }
}

/**
 * Collapse the per-locale images back into one column. Lossy by nature: the
 * default locale's image wins, otherwise the first locale that has one.
 */
async function copyImageBackFromLocales(db: MigrateDownArgs['db'], locale: string): Promise<void> {
  for (const { table, column } of TABLES) {
    const t = sql.raw(`"${table}"`)
    const l = sql.raw(`"${table}_locales"`)
    const c = sql.raw(`"${column}"`)

    await db.execute(sql`
      UPDATE ${t} AS p SET ${c} = l.${c}
      FROM (
        SELECT DISTINCT ON ("_parent_id") "_parent_id", ${c}
        FROM ${l}
        WHERE ${c} IS NOT NULL
        ORDER BY "_parent_id", ("_locale" = ${locale}::"_locales") DESC, "_locale"
      ) AS l
      WHERE p."id" = l."_parent_id";`)
  }
}
