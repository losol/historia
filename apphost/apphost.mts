// Aspire AppHost for Historia: the CMS with Postgres and Mailpit, as one command.
// Start it with `aspire run` from this directory. See the README for the workflow.

import { createBuilder, OtlpProtocol } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

// Every address the stack serves, defined once. Historia keeps the port `pnpm dev`
// already uses, so NEXT_PUBLIC_CMS_URL and anything bookmarked stay valid.
const historiaUrl = 'http://localhost:3100';
const mailpitUiPort = 3101;
const mailpitSmtpPort = 3102;
// Pinned so a terminal can reach the database too, e.g. for `payload migrate:create`.
const postgresPort = 3103;

// Pinned rather than generated: Postgres only applies a password when the data
// volume is first initialised, so a per-run password locks the AppHost out of
// its own volume on every subsequent start.
const postgresPassword = await builder.addParameter('postgres-password', {
  value: 'historia',
  secret: true,
});

const postgres = await builder
  .addPostgres('postgres', { password: postgresPassword, port: postgresPort })
  // Named, so it is easy to find and to drop: `docker volume rm historia-postgres-data`.
  .withDataVolume({ name: 'historia-postgres-data' });

// Aspire registers the database name but does not create it, so on a fresh
// volume the resource never reports healthy and everything waiting on it stalls.
const db = await postgres
  .addDatabase('cms', { databaseName: 'cms' })
  .withCreationScript('CREATE DATABASE "cms";');

// Payload signs sessions with this, so it is pinned for the same reason as the
// password: a per-run secret would log everyone out on every start.
const cmsSecret = await builder.addParameter('cms-secret', {
  value: 'historia-development-secret',
  secret: true,
});

// Order confirmations and password resets are mail, so development needs somewhere
// for it to land. Mailpit's web UI is where you read it.
const mailpit = await builder
  .addContainer('mailpit', { image: 'axllent/mailpit', tag: 'v1.27' })
  .withHttpEndpoint({ port: mailpitUiPort, targetPort: 8025, name: 'ui' })
  .withEndpoint({ port: mailpitSmtpPort, targetPort: 1025, name: 'smtp' })
  // Historia's SMTP config requires credentials, and sends them over plain SMTP
  // since Mailpit offers no TLS here. Accept whatever it sends.
  .withArgs(['--smtp-auth-accept-any', '--smtp-auth-allow-insecure']);

// What both the migrations and the app need to reach the same database the same way.
const sharedEnvironment = {
  // The URI form: Historia only picks Postgres for a postgres:// or postgresql:// URL,
  // and silently falls back to SQLite for anything else.
  CMS_DATABASE_URL: await db.uriExpression(),
  CMS_SECRET: cmsSecret,
  NEXT_PUBLIC_CMS_URL: historiaUrl,
  // Must match the locale enum the migrations create. Note that .env.example
  // suggests `nb`, which these migrations do not know.
  NEXT_PUBLIC_CMS_LOCALES: 'no,en',
  NEXT_PUBLIC_CMS_DEFAULT_LOCALE: 'no',
};

// Schema comes up as its own step, the way a deployment does it, so the app only
// ever starts against a database that is already current. Development runs on
// migrations rather than push, so a schema change without a migration shows up
// here instead of in production. Re-run it with `aspire resource migrations start`.
const migrations = await builder
  .addExecutable('migrations', 'pnpm', '../apps/historia', ['payload', 'migrate'])
  .waitFor(db);

// Next directly rather than `pnpm dev`: pnpm re-executes itself for the pinned
// version and then runs the script through a shell, and Aspire's stop signal only
// reaches the outermost process. Stop then times out and reports failure, and
// restart from the dashboard gives up. Keep the arguments in step with the app's
// `dev` script.
const historia = await builder
  .addExecutable('historia', 'node', '../apps/historia', [
    'node_modules/next/dist/bin/next',
    'dev',
    '--port',
    '3100',
  ])
  // Not proxied: Next binds 3100 itself, so Aspire only records the address.
  .withHttpEndpoint({ port: 3100, isProxied: false, name: 'http' })
  .withUrl(`${historiaUrl}/admin`, { displayText: 'Admin' })
  // Historia's exporter speaks OTLP over HTTP with JSON bodies.
  .withOtlpExporter({ protocol: OtlpProtocol.HttpJson })
  .withEnvironment('FEATURE_SMTP', 'enabled')
  .withEnvironment('SMTP_HOST', 'localhost')
  .withEnvironment('SMTP_PORT', String(mailpitSmtpPort))
  .withEnvironment('SMTP_USER', 'historia')
  .withEnvironment('SMTP_PASS', 'historia')
  .waitForCompletion(migrations)
  .waitFor(mailpit);

for (const [name, value] of Object.entries(sharedEnvironment)) {
  await migrations.withEnvironment(name, value);
  await historia.withEnvironment(name, value);
}

await builder.build().run();
