# Historia - The CMS where stories are told

Historia is a CMS that allows you to create and manage stories. It is built on top of [Payload](https://payloadcms.com), a headless CMS that provides a powerful and flexible API for your data, and Next.js.

Installing, running and releasing are covered in the [repository README](../../README.md). This page covers what is specific to the app.

## Configuration

`pnpm dev` starts without any configuration, against a local SQLite file (`historia.db`). For anything beyond that, copy `.env.example` to `.env`. The variables the app reads are described in [`app.config.json`](./app.config.json) and in the guides below. The most important ones:

| Variable | Purpose |
| --- | --- |
| `CMS_DATABASE_URL` | Database. A `postgres://` URL uses Postgres; unset means SQLite |
| `CMS_SECRET` | Signs the Payload session cookie. Keep it stable in production |
| `NEXT_PUBLIC_CMS_URL` | The app's public URL |
| `CMS_ALLOWED_ORIGINS` | Comma-separated public origins, for CORS/CSRF and for trusting proxy headers |
| `VIPPS_*` | Vipps ePayment (checkout), see [VIPPS.md](./docs/VIPPS.md) |
| `VIPPS_LOGIN_*` | Vipps Login for the admin, see [VIPPS_LOGIN_SETUP.md](./docs/VIPPS_LOGIN_SETUP.md) |

## Local development with HTTPS

Vipps (both payments and login) needs public HTTPS URLs for its callbacks. For local development, expose localhost through a Cloudflare Tunnel.

**Quick, temporary URL:**

```bash
cloudflared tunnel --url http://localhost:3100
```

The printed `https://….trycloudflare.com` URL changes every time you run it.

**Stable URL with a named tunnel** (needs a domain on Cloudflare):

1. Log in and create the tunnel:

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create historia-dev
   ```

2. Create `~/.cloudflared/config.yml`, using the tunnel ID printed by `create`:

   ```yaml
   tunnel: historia-dev
   credentials-file: /path/to/home/.cloudflared/<TUNNEL_ID>.json

   ingress:
     - hostname: historia-dev.YOUR-DOMAIN.com
       service: http://localhost:3100
     - service: http_status:404
   ```

3. Route the hostname to the tunnel. This creates the DNS record for you:

   ```bash
   cloudflared tunnel route dns historia-dev historia-dev.YOUR-DOMAIN.com
   ```

4. Run it:

   ```bash
   cloudflared tunnel run historia-dev
   ```

Either way, point the app at the public URL in `.env`:

```bash
NEXT_PUBLIC_CMS_URL=https://historia-dev.YOUR-DOMAIN.com
CMS_ALLOWED_ORIGINS=https://historia-dev.YOUR-DOMAIN.com
```

## Database migrations

Production runs on Postgres and applies the migrations in `src/migrations/` at startup (`prodMigrations`); it never pushes the schema. Local development on SQLite pushes the schema instead, so it needs no migrations.

The migrations are Postgres SQL. That means you must create them with a Postgres URL, or Payload writes SQLite SQL. After changing a collection or field:

```bash
CMS_DATABASE_URL=postgres://postgres:historia@localhost:3103/cms \
NEXT_PUBLIC_CMS_LOCALES=no,en NEXT_PUBLIC_CMS_DEFAULT_LOCALE=no \
  pnpm payload migrate:create <name>
```

`migrate:create` does not connect to the database; the URL only selects the dialect. The locales must match the ones the existing migrations were made with, or it will try to change the locale enum. CI fails a pull request that changes a collection without a matching migration.

To apply and inspect migrations against a Postgres database, for example the one `aspire run` starts (see the [repository README](../../README.md#with-aspire)):

```bash
CMS_DATABASE_URL=postgres://postgres:historia@localhost:3103/cms pnpm payload migrate
CMS_DATABASE_URL=postgres://postgres:historia@localhost:3103/cms pnpm payload migrate:status
```

`pnpm payload migrate:refresh` drops every table and re-runs all migrations. Never point it at a database you care about.

## Documentation

For administrators:

- [Role-based access control](./docs/administrator/role-based-access-control.md)
- [Orders](./docs/administrator/orders.md)
- [Vipps Login and user accounts](./docs/administrator/vipps-login.md)
- [Vipps commerce and user data](./docs/administrator/vipps-commerce.md)
- [API keys for media and notes](./docs/administrator/api-keys.md)

For developers:

- [Vipps ePayment integration](./docs/VIPPS.md)
- [Vipps Login setup](./docs/VIPPS_LOGIN_SETUP.md)
- [Real-time payment status with SSE](./docs/SSE_PAYMENT_STATUS.md)
- [Payment recovery via SSE](./docs/VIPPS_WEBHOOK_SSE_RECOVERY.md)
- [Theme toggle](./docs/ThemeToggle.md)
- [Kubernetes Helm chart](./k8s/README.md)
- [Architecture decision records](./docs/adr/)
