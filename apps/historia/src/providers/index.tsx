import type React from 'react';
import { CartProvider } from '@/lib/cart';
import { HeaderThemeProvider } from './HeaderTheme';
import { ThemeProvider } from './Theme';
import { ToastProvider } from './ToastProvider';

export const Providers: React.FC<{
  children: React.ReactNode;
  /** Whether visitors may switch between light and dark. */
  colorSchemeSwitchable: boolean;
}> = ({ children, colorSchemeSwitchable }) => {
  return (
    <ThemeProvider switchable={colorSchemeSwitchable}>
      <HeaderThemeProvider>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  );
};
