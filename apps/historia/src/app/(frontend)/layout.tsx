import type React from 'react';
import { SkipLink } from '@eventuras/ratio-ui/core/SkipLink';
import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { AdminBar } from '@/components/AdminBar';
import { Footer } from '@/components/Footer/Component';
import { SentryConfigMeta } from '@/components/SentryConfigMeta';
import { Header } from '@/Header/Component';
import { getAppearance, htmlThemeAttributes } from '@/lib/site-settings/appearance';
import { getCurrentWebsite } from '@/lib/website';
import { Providers } from '@/providers';
import { InitTheme } from '@/providers/Theme/InitTheme';

import '@eventuras/ratio-ui/ratio-ui.css';
// The named themes a website can pick in its settings (see lib/site-settings/appearance).
// Opt-in since ratio-ui 2.26; without them data-theme falls back to the default look.
import '@eventuras/ratio-ui/themes/bureau.css';
// Only fetched when a page uses them, so sites on other themes don't download them.
import '@eventuras/ratio-ui/themes/bureau-fonts.css';
import '@eventuras/ratio-ui/themes/ink.css';
import '@eventuras/ratio-ui/fonts.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Historia',
    default: 'Historia',
  },
  description: 'Historia - Knowledge management and content platform',
};

type RootLayoutProps = {
  children: React.ReactNode;
  params?: Promise<{ locale?: string }>;
};

export default async function RootLayout({ children, params }: Readonly<RootLayoutProps>) {
  const { isEnabled } = await draftMode();
  const resolvedParams = params ? await params : {};
  const locale = resolvedParams.locale || process.env.NEXT_PUBLIC_CMS_DEFAULT_LOCALE || 'no';
  // Cached per request: the header and footer read the same website.
  const website = await getCurrentWebsite();
  const appearance = getAppearance(website);
  const colorSchemeSwitchable = appearance.colorScheme === 'both';

  return (
    <html lang={locale} suppressHydrationWarning {...htmlThemeAttributes(appearance)}>
      <head>
        {colorSchemeSwitchable && <InitTheme />}
        <SentryConfigMeta />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers colorSchemeSwitchable={colorSchemeSwitchable}>
          <SkipLink href="#main-content">
            {locale === 'en' ? 'Skip to main content' : 'Hopp til hovedinnhold'}
          </SkipLink>
          <div className="flex flex-col min-h-screen">
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />

            <Header />
            <main id="main-content" className="flex-1 min-h-[80vh]">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
