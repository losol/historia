'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@eventuras/ratio-ui/core/Badge';
import { Button } from '@eventuras/ratio-ui/core/Button';
import { ShoppingCart } from '@eventuras/ratio-ui/icons';
import { useCart } from '@/lib/cart';
import { CartDrawer } from './cart/CartDrawer';

// The aria-label replaces the button's content for screen readers, so it carries the count.
function cartLabel(locale: string, count: number): string {
  if (locale === 'en') {
    if (count === 0) return 'Open cart';
    return `Open cart, ${count} ${count === 1 ? 'item' : 'items'}`;
  }
  if (count === 0) return 'Åpne handlekurv';
  return `Åpne handlekurv, ${count} ${count === 1 ? 'vare' : 'varer'}`;
}

interface CartButtonProps {
  locale: string;
}

export function CartButton({ locale }: Readonly<CartButtonProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { itemCount } = useCart();

  // Prevent hydration mismatch by only showing count after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showCount = isMounted && itemCount > 0;

  // Don't render the button at all if there are no items and component is mounted
  if (isMounted && itemCount === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="text"
        icon={<ShoppingCart />}
        onPress={() => setIsDrawerOpen(true)}
        aria-label={cartLabel(locale, showCount ? itemCount : 0)}
      >
        {showCount && (
          <Badge variant="count" tone="inherit">
            {itemCount > 9 ? '9+' : itemCount}
          </Badge>
        )}
      </Button>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} locale={locale} />
    </>
  );
}
