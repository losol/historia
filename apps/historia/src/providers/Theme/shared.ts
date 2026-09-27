import type { Theme } from './types';

// Not `payload-theme`: that is the admin panel's, and the two should not follow each other.
export const themeLocalStorageKey = 'historia-color-scheme';

export const defaultTheme: Theme = 'light';

export const getImplicitPreference = (): Theme | null => {
  const mediaQuery = '(prefers-color-scheme: dark)';
  const mql = window.matchMedia(mediaQuery);
  const hasImplicitPreference = typeof mql.matches === 'boolean';

  if (hasImplicitPreference) {
    return mql.matches ? 'dark' : 'light';
  }

  return null;
};
