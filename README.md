# Historia

The knowledge CMS — a [Payload](https://payloadcms.com) + Next.js app, extracted
from the [eventuras](https://github.com/losol/eventuras) monorepo with full git
history.

## Layout

- `apps/historia` — the CMS app (Next.js 16, Payload 3)
- `apphost` — Aspire AppHost that runs the app with Postgres and Mailpit for local development
- `packages/vipps` — Vipps MobilePay integration (`@eventuras/vipps`)
- `packages/payload-vipps-auth` — Vipps login for Payload (`@eventuras/payload-vipps-auth`)
- `packages/notitia-templates` — notification templates (`@eventuras/notitia-templates`)

Shared foundations (`@eventuras/core`, `@eventuras/core-nextjs`,
`@eventuras/app-config`, `@eventuras/logger`, config packages) are consumed from
npm and live in [origo](https://github.com/losol/origo).

## Development

```sh
pnpm install
pnpm dev          # next dev on port 3100
pnpm build
pnpm test
pnpm lint         # Biome; warnings fail it too, as in CI
pnpm --filter @eventuras/historia exec tsc --noEmit   # typecheck the app
```

`pnpm dev` runs against a local SQLite file and needs nothing else. Configuration
(`.env`), Vipps, HTTPS tunnels and migrations are covered in
[`apps/historia/README.md`](apps/historia/README.md).

Typechecking the app needs the workspace packages it imports to be built first:
`pnpm --filter '@eventuras/historia^...' build`.

### With Aspire

For the production database engine, `aspire run` from the repo root starts
Historia with Postgres and Mailpit, plus the Aspire dashboard to watch them. It
needs the [Aspire CLI](https://aspire.dev/get-started/install-cli/) and Docker,
but no .NET SDK: the AppHost is TypeScript (`apphost/apphost.mts`).

```sh
pnpm install   # first: the AppHost's dependencies come from the workspace lockfile
aspire run
```

| What | Where |
| --- | --- |
| Admin | http://localhost:3100/admin |
| Mailpit (every mail the app sends) | http://localhost:3101 |
| Postgres | `postgres://postgres:historia@localhost:3103/cms` |
| Dashboard | printed by `aspire run` |

On an empty database the `seed` resource fills in a demo site through the REST
API: a website for `localhost:3100`, a home page and 25 articles in Norwegian
and English, and a system-admin, `admin@historia.local` with password
`historia`. It does nothing once a website exists, so it never touches content
you have added. The script lives in `apphost/seed/`, outside the app; it also
runs by hand against any running Historia with `node apphost/seed/seed.ts` (see
the top of `seed.ts`).

The database runs on migrations, as production does, rather than schema push.
So after changing a collection, create a migration and run the migrations step
again. `migrate:create` compares the config with the last migration and does
not connect; the Postgres URL is what makes it write Postgres SQL rather than
SQLite, and the locales must match or it will try to change the locale enum:

```sh
cd apps/historia
CMS_DATABASE_URL=postgres://postgres:historia@localhost:3103/cms \
NEXT_PUBLIC_CMS_LOCALES=no,en NEXT_PUBLIC_CMS_DEFAULT_LOCALE=no \
  pnpm payload migrate:create <name>
aspire resource migrations start
```

Data lives in the `historia-postgres-data` volume; remove it to start over
(`docker volume rm historia-postgres-data`).

## Releases

A release is a pull request you merge. Nothing is published to a registry — the
artifact is the Docker image, and the version is the label it carries.

1. **Every change that belongs in the changelog carries a changeset.** Run
   `pnpm changeset` in the branch, pick a bump, write one line, commit the
   `.changeset/*.md` alongside the change.
2. **Merging to `main`** runs CI, builds and pushes `losolio/historia:main-<sha>`,
   and then a bot opens or updates a **`chore: version packages`** pull request
   holding the version bumps and the changelog entries.
3. **Merging that pull request is the release.** The version lands on `main`, the
   tag `@eventuras/historia@x.y.z` is pushed, and that tag promotes the image
   already built for the commit to `vx.y.z` and `latest`. A GitHub release is
   created from the changelog.
4. **Argo CD** sets `image.tag` to deploy it. That part lives outside this repo.

Because the image is promoted rather than rebuilt, what reaches production is
exactly what CI ran against.

Production applies migrations at startup (`prodMigrations`, with `push: false`),
so **take a database backup before releasing anything that carries one**.
