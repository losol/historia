'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@eventuras/ratio-ui/core/Badge';
import { Button } from '@eventuras/ratio-ui/core/Button';
import { ShoppingCart } from '@eventuras/ratio-ui/icons';
import { useCart } from '@/lib/cart';
import { CartDrawer } from './cart/CartDrawer';

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
        aria-label={showCount ? `Åpne handlekurv, ${itemCount} varer` : 'Åpne handlekurv'}
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
