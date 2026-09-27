'use client';

import type React from 'react';
import { ThemeToggle as RatioThemeToggle } from '@eventuras/ratio-ui/core/ThemeToggle';
import { useTheme } from '@/providers/Theme';

export interface ThemeToggleProps {
  /** Optional className for custom styling */
  className?: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * Lets the visitor switch between light and dark. Shown only when the website's
 * color scheme is `both`.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, ariaLabel }) => {
  const { theme, setTheme, switchable } = useTheme();

  if (!switchable) return null;

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <RatioThemeToggle
      theme={theme}
      onThemeChange={handleThemeChange}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
};
