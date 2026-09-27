import type React from 'react';
import Script from 'next/script';
import { defaultTheme, themeLocalStorageKey } from '../shared';

/**
 * Sets `data-color-scheme` on `<html>` before first paint, from the visitor's saved
 * choice or their system setting. Only for websites whose color scheme is `both`;
 * a fixed light or dark is rendered on `<html>` by the server.
 */
export const InitTheme: React.FC = () => {
  return (
    <Script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static inline script, no user input
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? 'dark' : 'light'
      }

      return null
    }

    function themeIsValid(theme) {
      return theme === 'light' || theme === 'dark'
    }

    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      var implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-color-scheme', themeToSet)
  })();
  `,
      }}
      id="theme-script"
      strategy="beforeInteractive"
    />
  );
};
