---
'@eventuras/historia': patch
---

Add the migration for `media._objectkey`, the column `@payloadcms/plugin-cloud-storage` contributes to the media collection. It had never been created, so every request that reached a media query in production failed with `column media._objectkey does not exist` — a 500 on any page carrying an image. The column is missing because `s3Storage` is enabled only when the `CMS_MEDIA_S3_*` vars are present, and the `migrate:create` that should have picked it up ran without them: the plugin was inert, so it contributed nothing to the diff and the snapshot never knew about the column. Generating the migration with the vars set produces exactly one statement, and a second `migrate:create` against the result is empty, so this was the only column outstanding.

CI's existing schema check now runs with those vars set too. It is the step that compares the collections against the migrations, and without them it diffs an inert plugin — which is why it passed while prod was broken. Nothing contacts S3: the adapter has no `onInit` and builds its client lazily, so the values only have to be non-empty.

The public site also gets its own error boundary at `app/(frontend)/error.tsx`. A throw under `(frontend)` previously climbed to `global-error.tsx`, which replaces the entire document, so one failing query looked like the whole site being down. The layout now stays mounted — header, navigation and footer keep working — and only the page body is replaced, with the error's digest shown so it can be matched against the server log and Sentry.
