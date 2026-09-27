'use server';

import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import { getCurrentSession } from '@eventuras/fides-auth-next';
import { Logger } from '@eventuras/logger';
import {
  type CreatePaymentRequest,
  type CreatePaymentResponse,
  createPayment,
  getPaymentDetails,
  type PaymentDetails,
} from '@eventuras/vipps/epayment-v1';
import configPromise from '@payload-config';
import { headers } from 'next/headers';
import { getPayload } from 'payload';
import { isSiteLocale } from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';
import { setCartPaymentReference } from '@/app/actions/cart';
import { saveCartToDatabase } from '@/lib/cart/saveCartToDatabase';
import { findPurchasableProducts, isValidQuantity } from '@/lib/commerce/cartValidation';
import { SHIPPING_OPTIONS } from '@/lib/shipping/options';
import { getVippsConfig } from '@/lib/vipps/config';
import { getCurrentWebsite, getCurrentWebsiteId } from '@/lib/website';
import { getMeUser } from '@/utilities/getMeUser';

const logger = Logger.create({
  namespace: 'historia:checkout',
  context: { module: 'checkoutActions' },
});

/**
 * Cart line item details with price and VAT calculations
 */
export interface CartLineItem {
  productId: string;
  title: string;
  quantity: number;
  pricePerUnit: number; // ex VAT, in minor units
  pricePerUnitIncVat: number; // inc VAT, in minor units
  lineTotal: number; // ex VAT, in minor units
  vatRate: number; // percentage
  vatAmount: number; // VAT for one unit, in minor units
  vatAmountTotal: number; // Total VAT for line, in minor units
  lineTotalIncVat: number; // in minor units
  currency: string;
}

/**
 * Complete cart summary with all calculations
 */
export interface CartSummary {
  items: CartLineItem[];
  subtotalExVat: number; // in minor units
  totalVat: number; // in minor units
  totalIncVat: number; // in minor units
  currency: string;
  /**
   * Lines left out because they cannot be bought: unknown, unpublished, from another
   * website, or with an invalid quantity. Checkout must not start while any remain.
   */
  unavailableProductIds: string[];
}

/**
 * Calculate cart summary with all prices and VAT
 * All calculations done server-side for security and consistency. Prices come from
 * the database; only product ids and quantities are taken from the caller, and those
 * are validated.
 */
export async function calculateCart(
  cartItems: Array<{ productId: string; quantity: number }>,
): Promise<ServerActionResult<CartSummary>> {
  try {
    if (!cartItems.length) {
      return actionSuccess({
        items: [],
        subtotalExVat: 0,
        totalVat: 0,
        totalIncVat: 0,
        currency: 'NOK',
        unavailableProductIds: [],
      });
    }

    const payload = await getPayload({ config: configPromise });
    const products = await findPurchasableProducts(
      payload,
      cartItems.map((item) => item.productId),
      await getCurrentWebsiteId(),
    );

    // Build line items with calculations
    const items: CartLineItem[] = [];
    const unavailableProductIds: string[] = [];
    let subtotalExVat = 0;
    let totalVat = 0;

    for (const cartItem of cartItems) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product || !isValidQuantity(cartItem.quantity)) {
        logger.warn(
          { productId: cartItem.productId, quantity: cartItem.quantity, found: !!product },
          'Cart line cannot be bought: product unavailable or quantity invalid',
        );
        unavailableProductIds.push(cartItem.productId);
        continue;
      }

      // Use virtual fields from Product collection
      const pricePerUnit = product.price?.amountExVat ?? 0;
      const pricePerUnitIncVat = product.price?.amountIncVat ?? pricePerUnit;
      const vatAmountPerUnit = product.price?.vatAmount ?? 0;
      const vatRate = product.price?.vatRate ?? 25;

      const lineTotal = pricePerUnit * cartItem.quantity;
      const vatAmountTotal = vatAmountPerUnit * cartItem.quantity;
      const lineTotalIncVat = pricePerUnitIncVat * cartItem.quantity;

      items.push({
        productId: product.id,
        title: product.title || 'Untitled',
        quantity: cartItem.quantity,
        pricePerUnit,
        pricePerUnitIncVat,
        lineTotal,
        vatRate,
        vatAmount: vatAmountPerUnit,
        vatAmountTotal,
        lineTotalIncVat,
        currency: product.price?.currency || 'NOK',
      });

      subtotalExVat += lineTotal;
      totalVat += vatAmountTotal;
    }

    // One payment has one currency; summing across currencies would charge nonsense.
    const currencies = [...new Set(items.map((item) => item.currency))];
    if (currencies.length > 1) {
      logger.error({ currencies, cartItems }, 'Cart mixes currencies - cannot be priced');
      return actionError('Handlekurven inneholder varer i ulike valutaer');
    }

    const summary: CartSummary = {
      items,
      subtotalExVat,
      totalVat,
      totalIncVat: subtotalExVat + totalVat,
      currency: currencies[0] ?? 'NOK',
      unavailableProductIds,
    };

    return actionSuccess(summary);
  } catch (error) {
    logger.error({ error, cartItems }, 'Failed to calculate cart totals');
    return actionError(error instanceof Error ? error.message : 'Failed to calculate cart');
  }
}

// ============================================================================
// Vipps Payment Actions
// ============================================================================

interface CreateVippsPaymentParams {
  userLanguage?: string;
}

/**
 * Create Vipps ePayment (WEB_REDIRECT flow)
 * Uses the new ePayment API instead of the old Checkout API.
 *
 * The amount is computed from the cart as it is saved to the database here, the same
 * lines the order is later built from, never from items sent by the browser. The
 * amount and the payment reference are stored on that cart before Vipps is called,
 * so every payment Vipps knows about can be matched to its cart and checked exactly.
 */
export async function createVippsPayment({
  userLanguage = 'no',
}: CreateVippsPaymentParams = {}): Promise<ServerActionResult<CreatePaymentResponse>> {
  const locale = isSiteLocale(userLanguage) ? userLanguage : 'no';
  let cartId: string | undefined;
  let reference: string | undefined;

  try {
    // STEP 1: Save cart to database for secure payment validation
    // This ensures cart persists during payment flow even if session expires
    const saveResult = await saveCartToDatabase();
    if (!saveResult.success) {
      logger.error({ error: saveResult.error }, 'Checkout failed: could not save cart to database');
      return actionError('Kunne ikke lagre handlekurven. Prøv igjen om litt.');
    }

    cartId = saveResult.data.cartId;
    logger.info({ cartId }, 'Cart saved to database successfully');

    // STEP 2: Calculate cart totals server-side, from the lines just saved
    const cartResult = await calculateCart(saveResult.data.items);
    if (!cartResult.success) {
      logger.error({ error: cartResult.error, cartId }, 'Checkout failed: could not price cart');
      return actionError('Kunne ikke beregne handlekurv');
    }

    const cart: CartSummary = cartResult.data;

    if (cart.unavailableProductIds.length > 0) {
      logger.warn(
        { cartId, unavailableProductIds: cart.unavailableProductIds },
        'Checkout stopped: cart has lines that cannot be bought',
      );
      return actionError(
        'Noen varer i handlekurven er ikke lenger tilgjengelige. Fjern dem og prøv igjen.',
      );
    }

    if (cart.items.length === 0 || cart.totalIncVat <= 0) {
      logger.warn({ cartId, totalIncVat: cart.totalIncVat }, 'Checkout stopped: nothing to pay');
      return actionError('Handlekurven er tom');
    }

    // Try to get current user for phone number (optional)
    let phoneNumber: string | undefined;
    try {
      const userResult = await getMeUser();
      const rawPhone = userResult?.user?.phone_number;
      if (rawPhone) {
        // Normalize phone number: remove +, spaces, and other non-digits
        // Vipps requires 9-15 digits WITH country code (e.g., 4712345678)
        phoneNumber = rawPhone.replaceAll(/\D/g, '');

        // Validate length (9-15 digits)
        if (phoneNumber.length < 9 || phoneNumber.length > 15) {
          phoneNumber = undefined;
        }
      }
    } catch {
      // No user session, continue without phone pre-fill
    }

    // Generate unique payment reference using UUID
    reference = crypto.randomUUID();

    // Build payment description from cart items
    const productNames = cart.items.map((item) => item.title).join(', ');
    const paymentDescription =
      cart.items.length > 0 ? `Kjøp: ${productNames.substring(0, 100)}` : `Ordre ${reference}`;

    // Build order lines from calculated cart
    const orderLines = cart.items.map((item) => ({
      name: item.title,
      id: item.productId,
      totalAmount: item.lineTotalIncVat,
      totalAmountExcludingTax: item.lineTotal,
      totalTaxAmount: item.vatAmountTotal, // for the whole line, not one unit
      taxRate: item.vatRate * 100, // Vipps expects taxRate in basis points (25% = 2500)
    }));

    // Total amount without shipping (Vipps will add shipping cost)
    const totalAmount = cart.totalIncVat;

    // Return to the domain the payment was started on. The host is read the way
    // getCurrentWebsite reads it, and used only once a website is configured for it,
    // so Vipps never redirects to a domain from a forged Host header.
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const website = await getCurrentWebsite();
    if (!host || !website) {
      logger.error(
        { host, cartId, reference },
        'Checkout failed: no configured website for this host - cannot build return URL',
      );
      return actionError('Kunne ikke starte betaling. Prøv igjen om litt.');
    }
    const forwardedProto = headersList.get('x-forwarded-proto');
    const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const baseUrl = `${protocol}://${host}`;

    logger.info({ host, baseUrl, reference }, 'Building payment with dynamic callback URL');

    // Build ePayment request
    const paymentRequest: CreatePaymentRequest = {
      amount: {
        value: totalAmount,
        currency: cart.currency,
      },
      paymentMethod: {
        type: 'WALLET',
      },
      customer: phoneNumber
        ? {
            phoneNumber,
          }
        : undefined,
      profile: {
        scope: 'name phoneNumber address email',
      },
      reference,
      returnUrl: `${baseUrl}/${locale}/checkout/vipps?reference=${reference}`,
      userFlow: 'WEB_REDIRECT',
      paymentDescription,
      receipt: {
        orderLines,
        bottomLine: {
          currency: cart.currency,
        },
      },
      shipping: {
        fixedOptions: SHIPPING_OPTIONS.map((option, index) => ({
          brand: option.brand,
          type: option.type,
          isDefault: index === 0,
          priority: index,
          options: [
            {
              id: option.id,
              amount: {
                value: option.price,
                currency: cart.currency,
              },
              name: option.name,
              isDefault: index === 0,
              priority: 0,
            },
          ],
        })),
      },
    };

    // STEP 3: Record the reference and the amount on the cart before Vipps knows about
    // the payment. Order creation reads the cart only from the database, so a payment
    // whose reference is not stored there could never become an order.
    const payload = await getPayload({ config: configPromise });
    try {
      await payload.update({
        collection: 'carts',
        id: cartId,
        data: {
          paymentReference: reference,
          amount: cart.totalIncVat,
          currency: cart.currency,
          status: 'payment-initiated',
        },
        overrideAccess: true, // We have the cartId from saveCartToDatabase
      });
    } catch (error) {
      logger.error(
        { error, cartId, reference },
        'Checkout failed: could not store payment reference on cart - payment not started',
      );
      return actionError('Kunne ikke starte betaling. Prøv igjen om litt.');
    }

    // STEP 4: Create the payment at Vipps
    const vippsConfig = getVippsConfig();
    const paymentResponse = await createPayment(vippsConfig, paymentRequest);

    // Store payment reference in cart session. The database cart already has it, so
    // the order can still be created if this fails, but the checkout page would not
    // know about the pending payment.
    const sessionResult = await setCartPaymentReference(reference);
    if (!sessionResult.success) {
      logger.error(
        { cartId, reference, error: sessionResult.error },
        'Payment created but its reference could not be stored in the session',
      );
    }

    logger.info(
      { reference, cartId, amount: cart.totalIncVat, currency: cart.currency },
      'Vipps payment created',
    );

    return actionSuccess(paymentResponse);
  } catch (error) {
    logger.error({ error, cartId, reference }, 'Checkout failed: error creating Vipps ePayment');

    // The cart was marked as waiting for this payment; it will never come.
    if (cartId && reference) {
      try {
        const payload = await getPayload({ config: configPromise });
        await payload.update({
          collection: 'carts',
          id: cartId,
          data: { status: 'cancelled' },
          overrideAccess: true,
        });
      } catch (updateError) {
        logger.error(
          { error: updateError, cartId, reference },
          'Could not mark cart as cancelled after failed payment creation',
        );
      }
    }

    return actionError('Kunne ikke starte betaling. Prøv igjen om litt.');
  }
}

/**
 * Check if there's a pending payment for the current cart
 *
 * This is useful when user returns to checkout page after starting a payment
 * but didn't complete it or got lost along the way.
 *
 * @returns Payment details if there's a pending/authorized payment, null otherwise
 */
export async function checkPendingPayment(): Promise<ServerActionResult<PaymentDetails | null>> {
  try {
    const session = await getCurrentSession();
    const cart = session?.data?.cart;

    if (!cart?.paymentReference) {
      return actionSuccess(null);
    }

    const reference = cart.paymentReference;

    const vippsConfig = getVippsConfig();
    const paymentDetails = await getPaymentDetails(vippsConfig, reference);

    // Only return payment if it's in a state where user can continue
    if (paymentDetails.state === 'CREATED' || paymentDetails.state === 'AUTHORIZED') {
      return actionSuccess(paymentDetails);
    }

    // Payment is in terminal state (ABORTED, EXPIRED, TERMINATED), allow new payment
    return actionSuccess(null);
  } catch {
    // Payment not found or error - allow new payment
    return actionSuccess(null);
  }
}
