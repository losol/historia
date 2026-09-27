'use client';

import { formatPrice } from '@eventuras/core/currency';
import { CartLineItem } from '@eventuras/ratio-ui/commerce/CartLineItem';
import { Button } from '@eventuras/ratio-ui/core/Button';
import { Panel } from '@eventuras/ratio-ui/core/Panel';
import { Spinner } from '@eventuras/ratio-ui/core/Spinner';
import { NumberField } from '@eventuras/ratio-ui/forms';
import { Drawer } from '@eventuras/ratio-ui/layout/Drawer';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { removedNotice } from '@/lib/cart/removedNotice';
import { useCartSummary } from '@/lib/cart/use-cart-summary';
import { fromMinorUnits } from '@/lib/price';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function CartDrawer({ isOpen, onClose, locale }: Readonly<CartDrawerProps>) {
  const {
    items,
    loading: cartLoading,
    updateCartItem,
    removeFromCart,
    removedProductIds,
  } = useCart();
  const { summary, loading, error, retry } = useCartSummary(items, isOpen);

  // Quantities come from the cart, which shows each click at once; the summary's
  // prices follow when the server has recomputed them. A line just removed is hidden
  // right away instead of waiting for the new summary.
  const quantities = new Map(items.map((item) => [item.productId, item.quantity]));
  const lines = (summary?.items ?? []).filter((item) => quantities.has(item.productId));

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Drawer.Header as="h2">Handlekurv</Drawer.Header>

      <Drawer.Body>
        {removedProductIds.length > 0 && (
          <Panel status="warning" accent="flush" marginBottom="md">
            <Panel.Body>{removedNotice(removedProductIds.length)}</Panel.Body>
          </Panel>
        )}
        {(cartLoading || (loading && items.length > 0 && !summary)) && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-3 text-gray-600">Laster...</span>
          </div>
        )}
        {!cartLoading && items.length === 0 && (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="mb-4 text-lg font-medium text-gray-900">Handlekurven er tom</p>
            <p className="text-gray-600">Legg til produkter for å komme i gang</p>
          </div>
        )}
        {!cartLoading && items.length > 0 && error && (
          <Panel status="error" accent="flush" marginBottom="md">
            <Panel.Body>Kunne ikke hente prisene i handlekurven.</Panel.Body>
            <Panel.Footer align="start">
              <Button onClick={retry} variant="outline">
                Prøv igjen
              </Button>
            </Panel.Footer>
          </Panel>
        )}
        {!cartLoading && items.length > 0 && summary && (
          <div className="space-y-4">
            {lines.map((item) => (
              <div
                key={item.productId}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
              >
                <CartLineItem
                  item={{
                    productId: item.productId,
                    title: item.title,
                    quantity: quantities.get(item.productId) ?? item.quantity,
                    pricePerUnitIncVat: fromMinorUnits(item.pricePerUnitIncVat, item.currency),
                    vatAmount: fromMinorUnits(item.vatAmount, item.currency),
                    lineTotalIncVat: fromMinorUnits(item.lineTotalIncVat, item.currency),
                    currency: item.currency,
                  }}
                  locale={locale}
                  formatPrice={formatPrice}
                  showQuantityControls
                  onQuantityChange={updateCartItem}
                  onRemove={removeFromCart}
                  testIdPrefix="cartdrawer"
                  QuantityField={NumberField}
                />
              </div>
            ))}
          </div>
        )}
      </Drawer.Body>

      {items.length > 0 && summary && (
        <Drawer.Footer>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(
                  fromMinorUnits(summary.totalIncVat, summary.currency),
                  summary.currency,
                  locale,
                )}
              </span>
            </div>

            <Link href={`/${locale}/checkout`} onClick={onClose}>
              <Button variant="primary" block>
                Gå til kassen
              </Button>
            </Link>

            <Link href={`/${locale}/products`} onClick={onClose}>
              <Button variant="outline" block>
                Fortsett å handle
              </Button>
            </Link>
          </div>
        </Drawer.Footer>
      )}
    </Drawer>
  );
}
