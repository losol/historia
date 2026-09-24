/**
 * Log startup configuration to help debug production issues
 * Shows which features are enabled and key environment variables
 */
export function logStartupConfig() {
  if (typeof window !== 'undefined') {
    // Don't log on client-side
    return;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Historia CMS - Startup Configuration            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Environment
  console.log('📋 Environment:');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   Next.js URL: ${process.env.NEXT_PUBLIC_CMS_URL || 'not set'}`);
  console.log(`   Default Locale: ${process.env.NEXT_PUBLIC_CMS_DEFAULT_LOCALE || 'not set'}`);

  // Feature Flags
  console.log('\n🚀 Feature Flags:');
  const features = {
    'Sentry Error Tracking': process.env.NEXT_PUBLIC_FEATURE_SENTRY === 'true',
  };

  Object.entries(features).forEach(([name, enabled]) => {
    const status = enabled ? '✅ ENABLED' : '❌ DISABLED';
    console.log(`   ${name}: ${status}`);
  });

  // Sentry Configuration (only if enabled)
  if (process.env.NEXT_PUBLIC_FEATURE_SENTRY === 'true') {
    console.log('\n🔍 Sentry Configuration:');
    console.log(
      `   Server DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ configured' : '❌ missing'}`,
    );
    console.log(
      `   Client DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ configured' : '❌ missing'}`,
    );
    console.log(`   Organization: ${process.env.CMS_SENTRY_ORG || 'not set'}`);
    console.log(`   Project: ${process.env.CMS_SENTRY_PROJECT || 'not set'}`);
    console.log(
      `   Send PII: ${process.env.NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII === 'true' ? 'yes' : 'no'}`,
    );
  }

  // OpenTelemetry Configuration
  console.log('\n📊 OpenTelemetry:');
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
  const otlpHeaders = process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS;
  const serviceName = process.env.OTEL_SERVICE_NAME || 'historia';

  if (otlpEndpoint) {
    console.log(`   Logs Export: ✅ ENABLED`);
    // Extract host from URL without revealing full path/credentials
    try {
      const url = new URL(otlpEndpoint);
      console.log(`   Endpoint Host: ${url.hostname}`);
      console.log(`   Endpoint Protocol: ${url.protocol.replace(':', '')}`);
    } catch {
      console.log(`   Endpoint: ✅ configured`);
    }
    console.log(`   Authentication: ${otlpHeaders ? '✅ configured' : '❌ missing'}`);
    console.log(`   Service Name: ${serviceName}`);
  } else {
    console.log(`   Logs Export: ❌ DISABLED (OTEL_EXPORTER_OTLP_LOGS_ENDPOINT not set)`);
  }

  // Database Configuration (mirrors the adapter choice in payload.config.ts)
  console.log('\n💾 Database:');
  const databaseUrl = process.env.CMS_DATABASE_URL;
  const isPostgres = /^postgres(ql)?:\/\//.test(databaseUrl ?? '');
  console.log(`   Type: ${isPostgres ? 'Postgres' : 'SQLite'}`);
  console.log(
    `   CMS_DATABASE_URL: ${databaseUrl ? '✅ configured' : 'not set (local SQLite file)'}`,
  );

  // CORS & Security Configuration (payload.config.ts uses the list for both cors and csrf)
  console.log('\n🔒 CORS & Security:');
  console.log(`   Allowed Origins: ${process.env.CMS_ALLOWED_ORIGINS || 'not configured'}`);

  // Session & Authentication
  console.log('\n🔑 Session & Auth:');
  console.log(
    `   CMS_SECRET: ${
      process.env.CMS_SECRET
        ? '✅ configured'
        : '❌ missing (a random secret is generated, so sessions do not survive a restart)'
    }`,
  );
  console.log(
    `   Vipps Login: ${process.env.VIPPS_LOGIN_ENABLED === 'true' ? '✅ ENABLED' : '❌ DISABLED'}`,
  );

  // Email Configuration (mirrors the nodemailer setup in payload.config.ts)
  console.log('\n📧 Email:');
  if (process.env.FEATURE_SMTP === 'enabled') {
    console.log('   Transport: SMTP');
    console.log(`   From Address: ${process.env.SMTP_FROM_EMAIL || 'noreply@eventuras.local'}`);
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'localhost'}`);
    console.log(`   SMTP Port: ${process.env.SMTP_PORT || '587'}`);
    console.log(`   SMTP Secure: ${process.env.SMTP_SECURE === 'true' ? 'yes (TLS)' : 'no'}`);
    console.log(`   SMTP User: ${process.env.SMTP_USER ? '✅ configured' : '❌ missing'}`);
  } else {
    console.log('   Transport: console log only (FEATURE_SMTP is not "enabled")');
  }

  // Storage Configuration
  console.log('\n📦 Storage:');
  const s3Vars = [
    'CMS_MEDIA_S3_ACCESS_KEY_ID',
    'CMS_MEDIA_S3_ENDPOINT',
    'CMS_MEDIA_S3_SECRET_ACCESS_KEY',
    'CMS_MEDIA_S3_REGION',
    'CMS_MEDIA_S3_BUCKET',
  ];
  const hasS3 = s3Vars.every((v) => !!process.env[v]);
  console.log(`   S3 Media Storage: ${hasS3 ? '✅ configured' : '❌ not configured'}`);
  if (hasS3) {
    console.log(`   S3 Endpoint: ${process.env.CMS_MEDIA_S3_ENDPOINT}`);
    console.log(`   S3 Region: ${process.env.CMS_MEDIA_S3_REGION}`);
    console.log(`   S3 Bucket: ${process.env.CMS_MEDIA_S3_BUCKET}`);
  }
  // Vipps Configuration
  console.log('\n💳 Payment (Vipps):');
  const vippsApiUrl = process.env.VIPPS_API_URL || 'https://apitest.vipps.no';
  console.log(`   API: ${vippsApiUrl}${vippsApiUrl.includes('apitest') ? ' (test)' : ''}`);
  console.log(`   Client ID: ${process.env.VIPPS_CLIENT_ID ? '✅ configured' : '❌ missing'}`);
  console.log(
    `   Client Secret: ${process.env.VIPPS_CLIENT_SECRET ? '✅ configured' : '❌ missing'}`,
  );
  console.log(
    `   Subscription Key: ${process.env.VIPPS_SUBSCRIPTION_KEY ? '✅ configured' : '❌ missing'}`,
  );
  console.log(`   MSN: ${process.env.VIPPS_MERCHANT_SERIAL_NUMBER || 'not set'}`);

  console.log('\n════════════════════════════════════════════════════════════\n');
}
