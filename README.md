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
pnpm lint
```

`pnpm dev` runs against a local SQLite file and needs nothing else.

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

Versioning via changesets; a `@eventuras/historia@x.y.z` tag retags the staged
Docker image for production (see `.github/workflows/historia-docker.yml`).
