'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Navbar } from '@eventuras/ratio-ui/core/Navbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartButton } from '@/components/CartButton';
import { useLocale } from '@/hooks/useLocale';
import { useHeaderTheme } from '@/providers/HeaderTheme';

interface HeaderClientProps {
  title?: string;
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ title }) => {
  const [theme, setTheme] = useState<string | null>(null);
  const { headerTheme, setHeaderTheme } = useHeaderTheme();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (headerTheme !== null) {
      setHeaderTheme(null);
    }
  }, [pathname, headerTheme, setHeaderTheme]);

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) {
      // Use setTimeout to avoid setState in render
      setTimeout(() => setTheme(headerTheme), 0);
    }
  }, [headerTheme, theme]);

  return (
    <header className="relative z-20" data-theme={theme ?? undefined}>
      <Navbar bgColor="bg-transparent">
        {title && (
          <Navbar.Brand>
            <Link href="/" className="text-lg tracking-tight whitespace-nowrap no-underline">
              {title}
            </Link>
          </Navbar.Brand>
        )}
        <Navbar.Content className="justify-end">
          <CartButton locale={locale} />
        </Navbar.Content>
      </Navbar>
    </header>
  );
};
