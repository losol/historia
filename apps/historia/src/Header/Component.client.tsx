'use client';
import type React from 'react';
import { Navbar } from '@eventuras/ratio-ui/core/Navbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartButton } from '@/components/CartButton';
import { type NavLink, navLinks } from '@/components/Nav/links';
import { useLocale } from '@/hooks/useLocale';
import type { NavBlock } from '@/payload-types';
import styles from './Header.module.css';

interface HeaderClientProps {
  title?: string;
  navigation?: NavBlock[] | null;
}

/** The link is current on its own page and on pages below it; the home link only on the home page. */
function isCurrent(link: NavLink, pathname: string, locale: string): boolean {
  if (link.external) return false;
  if (link.href === `/${locale}`) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ title, navigation }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const links = navLinks(navigation, locale);
  const menuLabel = locale === 'en' ? 'Menu' : 'Meny';

  return (
    <header className={styles.header}>
      <Navbar glass>
        {title && (
          <Navbar.Brand>
            <Link href={`/${locale}`} className={styles.brand}>
              {title}
            </Link>
          </Navbar.Brand>
        )}
        {links.length > 0 && (
          <Navbar.Links className="hidden md:flex">
            {links.map((link) => (
              <Navbar.Link
                key={link.key}
                href={link.href}
                isCurrent={isCurrent(link, pathname, locale)}
                LinkComponent={link.external ? undefined : Link}
              >
                {link.label}
              </Navbar.Link>
            ))}
          </Navbar.Links>
        )}
        <Navbar.Spacer />
        <Navbar.Actions>
          <CartButton locale={locale} />
          {links.length > 0 && <Navbar.Toggle className="md:hidden" aria-label={menuLabel} />}
        </Navbar.Actions>
        {links.length > 0 && (
          <Navbar.Collapse className="md:hidden">
            <ul className={styles.mobileList}>
              {links.map((link) => (
                <li key={link.key}>
                  {link.external ? (
                    <a
                      href={link.href}
                      className={styles.mobileLink}
                      target={link.newTab ? '_blank' : undefined}
                      rel={link.newTab ? 'noopener noreferrer' : undefined}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={styles.mobileLink}
                      aria-current={isCurrent(link, pathname, locale) ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Navbar.Collapse>
        )}
      </Navbar>
    </header>
  );
};
