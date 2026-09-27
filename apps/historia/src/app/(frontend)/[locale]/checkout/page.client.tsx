'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@eventuras/core/currency';
import { Logger } from '@eventuras/logger';
import { CartLineItem } from '@eventuras/ratio-ui/commerce/CartLineItem';
import { OrderSummary } from '@eventuras/ratio-ui/commerce/OrderSummary';
import { Button } from '@eventuras/ratio-ui/core/Button';
import { Card } from '@eventuras/ratio-ui/core/Card';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Loading } from '@eventuras/ratio-ui/core/Loading';
import { Panel } from '@eventuras/ratio-ui/core/Panel';
import { NumberField } from '@eventuras/ratio-ui/forms';
import { AlertTriangle } from '@eventuras/ratio-ui/icons';
import { Container } from '@eventuras/ratio-ui/layout/Container';
import { useToast } from '@eventuras/ratio-ui/toast';
import { Link } from '@eventuras/ratio-ui-next';
import type { PaymentDetails } from '@eventuras/vipps/epayment-v1';
import { useCart } from '@/lib/cart';
import { cartLineItemLabels, orderSummaryLabels } from '@/lib/cart/labels';
import { removedNotice } from '@/lib/cart/removedNotice';
import { useCartSummary } from '@/lib/cart/use-cart-summary';
import { fromMinorUnits } from '@/lib/price';
import { checkPendingPayment, createVippsPayment } from './actions';

const logger = Logger.create({
  namespace: 'historia:checkout',
  context: { module: 'CheckoutPageClient' },
});

interface CheckoutPageClientProps {
  locale: string;
}

export function CheckoutPageClient({ locale }: Readonly<CheckoutPageClientProps>) {
  const {
    items,
    updateCartItem,
    removeFromCart,
    loading: cartLoading,
    pending: cartPending,
    removedProductIds,
    revalidateCart,
  } = useCart();
  const {
    summary: cart,
    loading: summaryLoading,
    error: summaryError,
    upToDate,
    retry,
  } = useCartSummary(items);
  const [pendingPayment, setPendingPayment] = useState<PaymentDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Check the cart again on arrival, dropping products that can no longer be bought,
  // and look for a payment already started for it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on mount only
  useEffect(() => {
    revalidateCart();

    async function checkPending() {
      const result = await checkPendingPayment();
      if (result.success && result.data) {
        logger.info(
          {
            reference: result.data.reference,
            state: result.data.state,
          },
          'Found pending payment',
        );
        setPendingPayment(result.data);
      }
    }

    checkPending();
  }, []);

  // Quantities come from the cart, which shows each click at once; the summary's
  // prices follow when the server has recomputed them.
  const quantities = new Map(items.map((item) => [item.productId, item.quantity]));
  const lines = (cart?.items ?? []).filter((item) => quantities.has(item.productId));
  const summaryText = orderSummaryLabels(locale);

  // The payment is priced from the cart on the server: wait until every change has
  // reached it and the prices shown are for the lines shown.
  const canCheckout =
    !cartPending &&
    upToDate &&
    !summaryError &&
    !!cart &&
    cart.items.length > 0 &&
    cart.unavailableProductIds.length === 0;

  const handleVippsCheckout = async () => {
    if (!canCheckout) return;
    setSubmitting(true);

    try {
      // The server prices the cart from the session, not from what the page shows.
      const result = await createVippsPayment({ userLanguage: locale });

      if (!result.success) {
        logger.error({ error: result.error }, 'Could not start Vipps payment');
        toast.error('Kunne ikke starte betalingen. Prøv igjen om litt.');
        setSubmitting(false);
        return;
      }

      if (result.data.redirectUrl) {
        window.location.assign(result.data.redirectUrl);
      } else {
        logger.error('Vipps payment created without a redirect URL');
        toast.error('Kunne ikke starte betalingen. Prøv igjen om litt.');
        setSubmitting(false);
      }
    } catch (error) {
      logger.error({ error }, 'Checkout failed');
      toast.error('En uventet feil oppstod. Prøv igjen om litt.');
      setSubmitting(false);
    }
  };

  if (cartLoading || (items.length > 0 && summaryLoading && !cart)) {
    return <Loading />;
  }

  return (
    <Container className="p-3">
      {/* Header */}
      <Heading as="h1" paddingBottom="sm">
        Kasse
      </Heading>

      {/* Pending Payment Notice */}
      {pendingPayment && (
        <Panel status="warning" accent="flush" marginBottom="md">
          <Panel.Header icon={<AlertTriangle />}>
            <Panel.Title as="h3">Du har en påbegynt betaling</Panel.Title>
          </Panel.Header>
          <Panel.Body>
            Vi fant en eksisterende betaling for denne handlekurven.
            {pendingPayment.state === 'CREATED' && ' Betalingen er ikke fullført ennå.'}
            {pendingPayment.state === 'AUTHORIZED' &&
              ' Betalingen er godkjent og venter på behandling.'}
          </Panel.Body>
          <Panel.Footer align="start">
            <Link
              href={`/${locale}/checkout/vipps?reference=${pendingPayment.reference}`}
              variant="button-primary"
            >
              Sjekk betalingsstatus
            </Link>
            <Button onClick={() => setPendingPayment(null)} variant="outline">
              Ignorer og opprett ny
            </Button>
          </Panel.Footer>
        </Panel>
      )}

      {removedProductIds.length > 0 && (
        <Panel status="warning" accent="flush" marginBottom="md">
          <Panel.Body>{removedNotice(removedProductIds.length)}</Panel.Body>
        </Panel>
      )}

      {items.length > 0 && summaryError && (
        <Panel status="error" accent="flush" marginBottom="md">
          <Panel.Body>Kunne ikke hente prisene i handlekurven.</Panel.Body>
          <Panel.Footer align="start">
            <Button onClick={retry} variant="outline">
              Prøv igjen
            </Button>
          </Panel.Footer>
        </Panel>
      )}

      {items.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Handlekurven din er tom</p>
            <Link href={`/${locale}`}>Fortsett å handle</Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Order Summary */}
          {cart && (
            <OrderSummary
              summary={{
                items: cart.items.map((item) => ({
                  productId: item.productId,
                  title: item.title,
                  quantity: item.quantity,
                  pricePerUnitIncVat: fromMinorUnits(item.pricePerUnitIncVat, item.currency),
                  vatAmount: fromMinorUnits(item.vatAmount, item.currency),
                  lineTotalIncVat: fromMinorUnits(item.lineTotalIncVat, item.currency),
                  currency: item.currency,
                })),
                subtotalExVat: fromMinorUnits(cart.subtotalExVat, cart.currency),
                totalVat: fromMinorUnits(cart.totalVat, cart.currency),
                totalIncVat: fromMinorUnits(cart.totalIncVat, cart.currency),
                currency: cart.currency,
              }}
              locale={locale}
              formatPrice={formatPrice}
              title={summaryText.title}
              labels={summaryText.labels}
              showVatBreakdown
            >
              {lines.map((item) => (
                <CartLineItem
                  key={item.productId}
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
                  testIdPrefix="checkout"
                  labels={cartLineItemLabels(locale)}
                  QuantityField={NumberField}
                />
              ))}
            </OrderSummary>
          )}

          <Button
            onClick={handleVippsCheckout}
            loading={submitting}
            isDisabled={!canCheckout}
            block
          >
            Kjøp nå med Vipps
          </Button>
        </div>
      )}
    </Container>
  );
}
