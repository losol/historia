'use client';
import type React from 'react';
import { Navbar } from '@eventuras/ratio-ui/core/Navbar';
import Link from 'next/link';
import { CartButton } from '@/components/CartButton';
import { useLocale } from '@/hooks/useLocale';

interface HeaderClientProps {
  title?: string;
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ title }) => {
  const locale = useLocale();

  return (
    <header className="relative z-20">
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
