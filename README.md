# Historia

The knowledge CMS — a [Payload](https://payloadcms.com) + Next.js app, extracted
from the [eventuras](https://github.com/losol/eventuras) monorepo with full git
history.

## Layout

- `apps/historia` — the CMS app (Next.js 16, Payload 3)
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

## Releases

Versioning via changesets; a `@eventuras/historia@x.y.z` tag retags the staged
Docker image for production (see `.github/workflows/historia-docker.yml`).
