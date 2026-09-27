'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import canUseDOM from '@/utilities/canUseDOM';
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared';
import type { Theme, ThemeContextType } from './types';
import { themeIsValid } from './types';

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
  switchable: false,
};

const ThemeContext = createContext(initialContext);

/**
 * The visitor's light or dark choice, kept in `data-color-scheme` on `<html>`. When the
 * website fixes its color scheme (`switchable` is false), the server has rendered the
 * attribute and this only reports it.
 */
export const ThemeProvider = ({
  children,
  switchable,
}: {
  children: React.ReactNode;
  switchable: boolean;
}) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.dataset.colorScheme as Theme) : undefined,
  );

  const setTheme = useCallback(
    (themeToSet: Theme | null) => {
      if (!switchable) return;
      if (themeToSet === null) {
        window.localStorage.removeItem(themeLocalStorageKey);
        const implicitPreference = getImplicitPreference() || defaultTheme;
        document.documentElement.dataset.colorScheme = implicitPreference;
        setThemeState(implicitPreference);
      } else {
        setThemeState(themeToSet);
        window.localStorage.setItem(themeLocalStorageKey, themeToSet);
        document.documentElement.dataset.colorScheme = themeToSet;
      }
    },
    [switchable],
  );

  useEffect(() => {
    if (!switchable) {
      const fixed = document.documentElement.dataset.colorScheme;
      setThemeState(themeIsValid(fixed ?? null) ? (fixed as Theme) : defaultTheme);
      return;
    }

    let themeToSet: Theme = defaultTheme;
    const preference = window.localStorage.getItem(themeLocalStorageKey);

    if (themeIsValid(preference)) {
      themeToSet = preference;
    } else {
      const implicitPreference = getImplicitPreference();

      if (implicitPreference) {
        themeToSet = implicitPreference;
      }
    }

    document.documentElement.dataset.colorScheme = themeToSet;
    setThemeState(themeToSet);
  }, [switchable]);

  return (
    <ThemeContext.Provider value={{ setTheme, theme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
