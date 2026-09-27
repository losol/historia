import type { Website } from '@/payload-types';

/**
 * The ratio-ui theme a website wears: its palette, fonts and shapes. `default` is
 * ratio-ui's standard theme, which needs no attribute.
 */
export const themes = ['default', 'bureau', 'ink'] as const;
export type SiteTheme = (typeof themes)[number];

/**
 * Light, dark, or both: `both` follows the visitor's system setting and shows a
 * toggle so they can switch.
 */
export const colorSchemes = ['light', 'dark', 'both'] as const;
export type SiteColorScheme = (typeof colorSchemes)[number];

export type Appearance = {
  theme: SiteTheme;
  colorScheme: SiteColorScheme;
};

export const defaultAppearance: Appearance = {
  theme: 'default',
  colorScheme: 'both',
};

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

/** The website's appearance, with defaults for anything unset or no longer offered. */
export function getAppearance(website: Pick<Website, 'siteSettings'> | null): Appearance {
  const appearance = website?.siteSettings?.appearance;
  return {
    theme: isOneOf(themes, appearance?.theme) ? appearance.theme : defaultAppearance.theme,
    colorScheme: isOneOf(colorSchemes, appearance?.colorScheme)
      ? appearance.colorScheme
      : defaultAppearance.colorScheme,
  };
}

/**
 * The attributes ratio-ui reads on `<html>`: `data-theme` for the palette and
 * `data-color-scheme` for light or dark. For `both`, the color scheme is left to
 * the InitTheme script, which knows the visitor's preference.
 */
export function htmlThemeAttributes({ theme, colorScheme }: Appearance) {
  return {
    'data-theme': theme === 'default' ? undefined : theme,
    'data-color-scheme': colorScheme === 'both' ? undefined : colorScheme,
  };
}
