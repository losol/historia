/** Light or dark: the value of `data-color-scheme` on `<html>`. */
export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  setTheme: (theme: Theme | null) => void;
  theme?: Theme | null;
  /** Whether visitors may switch; only when the website's color scheme is `both`. */
  switchable: boolean;
}

export function themeIsValid(string: null | string): string is Theme {
  return string ? ['dark', 'light'].includes(string) : false;
}
