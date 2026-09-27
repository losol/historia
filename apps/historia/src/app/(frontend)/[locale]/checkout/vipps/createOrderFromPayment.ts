import crypto from 'node:crypto';
import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import { Logger } from '@eventuras/logger';
import type { PaymentDetails } from '@eventuras/vipps/epayment-v1';
import configPromise from '@payload-config';
import { getPayload, ValidationError } from 'payload';
import type { Cart } from '@/lib/cart/types';
import { canTransitionTransaction } from '@/lib/commerce/orderStatusRules';
import { maskEmail } from '@/lib/observability/maskEmail';
import { reportCritical } from '@/lib/observability/reportCritical';
import { getSessionContext } from '@/lib/session/sessionId';
import { getCurrentWebsiteId } from '@/lib/website';
import type { Order, Product, Transaction, User } from '@/payload-types';
import { createOrderAutoCreatedEvent } from './orderEvents';
import { notifyOrphanedPayment } from './orphanedPaymentNotification';

const logger = Logger.create({
  namespace: 'historia:payment',
  context: { module: 'paymentCallbackActions' },
});

type UserAddress = NonNullable<User['addresses']>[number];

/**
 * Normalize Norwegian phone number to E.164 format with country code
 * @param phoneNumber - Raw phone number from Vipps (e.g., "4748755492" or "48755492")
 * @returns Normalized phone number with country code (e.g., "+4748755492")
 */
function normalizePhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) return undefined;

  // Remove any whitespace
  const cleaned = phoneNumber.replaceAll(/\s/g, '');

  // If already has +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 47 (Norwegian country code), add +
  if (cleaned.startsWith('47') && cleaned.length >= 10) {
    return `+${cleaned}`;
  }

  // If starts with 4 or 9 (Norwegian mobile prefix), assume it's missing country code
  if ((cleaned.startsWith('4') || cleaned.startsWith('9')) && cleaned.length === 8) {
    return `+47${cleaned}`;
  }

  // Default: assume it's a Norwegian number without country code
  return `+47${cleaned}`;
}

function generateSecurePassword(): string {
  // Generate 32 random bytes and convert to base64
  // This creates a strong password that users won't need (guest checkout)
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Whether `error` is Payload's report of a unique index rejecting `field`: what a
 * concurrent request for the same payment causes. Anything else must not be taken
 * for a lost race.
 */
function isUniqueViolation(error: unknown, field: string): boolean {
  if (!(error instanceof ValidationError)) return false;
  const normalize = (value: string) => value.replaceAll('_', '').toLowerCase();
  return error.data.errors.some(
    (fieldError) => fieldError.path && normalize(fieldError.path) === normalize(field),
  );
}

/** The order created for a payment, if there is one. */
async function findOrderByPaymentReference(
  payload: Awaited<ReturnType<typeof getPayload>>,
  paymentReference: string,
): Promise<Order | undefined> {
  const { docs } = await payload.find({
    collection: 'orders',
    where: { paymentReference: { equals: paymentReference } },
    limit: 1,
    depth: 0,
  });
  return docs[0];
}

async function findTransactionIdByPaymentReference(
  payload: Awaited<ReturnType<typeof getPayload>>,
  paymentReference: string,
): Promise<string> {
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { paymentReference: { equals: paymentReference } },
    limit: 1,
    depth: 0,
  });
  return docs[0]?.id ?? '';
}

interface CreateOrderParams {
  paymentReference: string;
  paymentDetails: PaymentDetails;
  userId?: string;
}

/**
 * Create order and transaction after successful payment
 *
 * SECURITY: This function retrieves cart from database (not from client!),
 * verifies payment with Vipps API, and validates the order total matches the
 * authorized amount. Cart cannot be tampered with by client.
 *
 * Not a server action: it trusts the payment details it is given, so only server
 * code that fetched them from Vipps may call it (the return page's action, the webhook).
 */
export async function createOrderFromPayment({
  paymentReference,
  paymentDetails,
  userId,
}: CreateOrderParams): Promise<ServerActionResult<{ orderId: string; transactionId: string }>> {
  const startTime = Date.now();

  // Get session context for logging throughout this function
  const sessionContext = await getSessionContext();

  let cart: Cart | undefined;
  // What the customer was asked to pay for the items (inc. VAT, ex. shipping), stored on
  // the cart when the payment was created. Missing on carts from before it was stored.
  let cartAmount: number | null = null;
  let cartCurrency: string | null = null;
  // The website the cart was filled on. The webhook calls this too, and its host is
  // the webhook's, not the shop's, so the host cannot say which website the order is for.
  let cartTenantId: string | null = null;

  try {
    const payload = await getPayload({ config: configPromise });

    // ROBUST APPROACH: Find cart by paymentReference
    // This works even if session cookies are lost/expired
    const carts = await payload.find({
      collection: 'carts',
      where: {
        paymentReference: {
          equals: paymentReference,
        },
      },
      limit: 1,
    });

    if (carts.docs.length > 0) {
      const cartDoc = carts.docs[0];

      // Convert Payload cart to Cart type
      cart = {
        items: cartDoc.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentReference: paymentReference,
      };
      cartAmount = typeof cartDoc.amount === 'number' ? cartDoc.amount : null;
      cartCurrency = cartDoc.currency ?? null;
      cartTenantId =
        typeof cartDoc.tenant === 'object'
          ? (cartDoc.tenant?.id ?? null)
          : (cartDoc.tenant ?? null);

      logger.info(
        {
          ...sessionContext,
          cartId: cartDoc.id,
          cartAmount,
          itemCount: cart?.items.length || 0,
          paymentReference,
        },
        'Cart retrieved from database by paymentReference',
      );
    } else {
      logger.error(
        {
          ...sessionContext,
          paymentReference,
        },
        'Cart not found by paymentReference in database',
      );
    }
  } catch (error) {
    logger.error(
      {
        ...sessionContext,
        error,
        paymentReference,
      },
      'Failed to retrieve cart from database',
    );
  }

  try {
    if (!cart?.items || cart.items.length === 0) {
      logger.error(
        {
          ...sessionContext,
          paymentReference,
          hasCart: !!cart,
          paymentState: paymentDetails.state,
          authorizedAmount: paymentDetails.aggregate.authorizedAmount.value,
          customerEmail: maskEmail(
            paymentDetails.profile?.email || paymentDetails.userDetails?.email,
          ),
        },
        'CRITICAL: Cart not found in session but payment may be authorized - potential orphaned payment',
      );

      // Check if this is a cross-domain session issue where payment is authorized
      // This is a CRITICAL scenario that needs manual intervention
      if (
        paymentDetails.state === 'AUTHORIZED' ||
        paymentDetails.aggregate.capturedAmount.value > 0
      ) {
        const customerEmail = paymentDetails.profile?.email || paymentDetails.userDetails?.email;

        reportCritical(
          logger,
          'Payment is AUTHORIZED but cart unavailable - requires manual order creation!',
          {
            area: 'checkout',
            ...sessionContext,
            paymentReference,
            customerEmail: maskEmail(customerEmail),
            amount: paymentDetails.aggregate.authorizedAmount.value,
            currency: paymentDetails.aggregate.authorizedAmount.currency,
          },
        );

        // Create business event and notify sales team
        await notifyOrphanedPayment({
          paymentReference,
          customerEmail,
          amount: paymentDetails.aggregate.authorizedAmount.value,
          currency: paymentDetails.aggregate.authorizedAmount.currency,
          paymentState: paymentDetails.state,
        });

        return actionError(
          'Din betaling er godkjent og sikret! Vi behandler ordren din manuelt og sender ' +
            'deg en bekreftelse på e-post innen kort tid. ' +
            'Referanse: ' +
            paymentReference,
        );
      }

      return actionError('Cart is empty or not found');
    }

    // Verify payment reference matches session cart
    if (cart.paymentReference !== paymentReference) {
      logger.error(
        {
          paymentReference,
          cartPaymentReference: cart.paymentReference,
        },
        'Payment reference mismatch - possible fraud attempt',
      );
      return actionError(
        'This payment session is no longer valid. Your cart may have been modified or a new checkout was started. Please start a new checkout.',
      );
    }

    logger.info(
      {
        ...sessionContext,
        paymentReference,
        itemCount: cart.items.length,
        paymentState: paymentDetails.state,
        authorizedAmount: paymentDetails.aggregate.authorizedAmount,
      },
      'Starting order creation from payment',
    );

    const payload = await getPayload({ config: configPromise });

    // Only an authorized payment becomes an order. After capture Vipps still reports
    // AUTHORIZED; CREATED, ABORTED, EXPIRED and TERMINATED (cancelled) have no money
    // behind them.
    if (paymentDetails.state !== 'AUTHORIZED') {
      logger.error(
        {
          paymentReference,
          paymentState: paymentDetails.state,
          authorizedAmount: paymentDetails.aggregate.authorizedAmount,
        },
        'Order not created: payment is not authorized',
      );
      return actionError('Betalingen er ikke godkjent');
    }

    // One order per payment: the webhook and the return page both get here.
    const existingOrder = await findOrderByPaymentReference(payload, paymentReference);
    if (existingOrder) {
      logger.info(
        { paymentReference, existingOrderId: existingOrder.id },
        'Order already exists for this payment reference, returning existing order',
      );
      return actionSuccess({
        orderId: existingOrder.id,
        transactionId: await findTransactionIdByPaymentReference(payload, paymentReference),
      });
    }

    // Check if order already exists for this payment reference (idempotency)
    const existingTransactions = await payload.find({
      collection: 'transactions',
      where: {
        paymentReference: {
          equals: paymentReference,
        },
      },
      limit: 1,
    });

    if (existingTransactions.docs.length > 0) {
      const existingTransaction = existingTransactions.docs[0];
      const orderId =
        typeof existingTransaction.order === 'string'
          ? existingTransaction.order
          : existingTransaction.order?.id;

      // Only return early if order actually exists
      // Transaction might exist without order (orphaned from webhook)
      if (orderId) {
        logger.info(
          {
            paymentReference,
            existingOrderId: orderId,
            existingTransactionId: existingTransaction.id,
          },
          'Order already exists for this payment reference, returning existing order',
        );
        return actionSuccess({
          orderId: orderId as string,
          transactionId: existingTransaction.id as string,
        });
      } else {
        logger.warn(
          {
            paymentReference,
            existingTransactionId: existingTransaction.id,
            transactionStatus: existingTransaction.status,
          },
          'Transaction exists but has no order (orphaned from webhook) - will create order now',
        );
        // Continue to order creation below
      }
    }

    // If no authenticated user, try to find or create from Vipps profile data.
    // Every branch below assigns this or returns, so TypeScript can check it is set.
    let effectiveUserId: string;

    if (!userId) {
      // Try to get user info from Vipps profile sharing or user details.
      // Payload stores auth emails lowercased — lowercase before lookup/create so
      // a mixed-case email from Vipps matches the customer's existing user instead
      // of colliding with the unique index on create. Vipps also redacts personal
      // data on old payments to the literal string '[Expired]' — treat as missing.
      const rawVippsEmail = paymentDetails.profile?.email || paymentDetails.userDetails?.email;
      const vippsEmail =
        rawVippsEmail && rawVippsEmail !== '[Expired]' ? rawVippsEmail.toLowerCase() : undefined;
      const vippsPhone =
        paymentDetails.profile?.phoneNumber || paymentDetails.userDetails?.mobileNumber;
      const vippsFirstName =
        paymentDetails.profile?.givenName || paymentDetails.userDetails?.firstName;
      const vippsLastName =
        paymentDetails.profile?.familyName || paymentDetails.userDetails?.lastName;

      if (!vippsEmail) {
        logger.error(
          {
            paymentReference,
          },
          'Guest checkout attempted but email not available from Vipps',
        );
        return actionError(
          'Email address is required for order confirmation. Please ensure Vipps has permission to share your email address.',
        );
      }

      // Normalize phone number to include country code
      const normalizedPhone = normalizePhoneNumber(vippsPhone);

      logger.info(
        {
          paymentReference,
          hasEmail: !!vippsEmail,
          hasPhone: !!normalizedPhone,
          hasName: !!(vippsFirstName && vippsLastName),
        },
        'Guest checkout - finding or creating user from Vipps data',
      );

      // Try to find existing user by email
      const usersByEmail = await payload.find({
        collection: 'users',
        where: {
          email: { equals: vippsEmail },
        },
        limit: 1,
      });

      const existingUser = usersByEmail.docs[0];

      if (existingUser) {
        effectiveUserId = existingUser.id;
        logger.info(
          {
            userId: effectiveUserId,
            email: maskEmail(existingUser.email),
          },
          'Found existing user for checkout',
        );
      } else {
        // Create new user from Vipps data. The webhook and the return page can get
        // here at the same time for the same email; the unique email index then
        // rejects the second create, and that caller uses the user the first created.
        let newUser: User;
        try {
          newUser = await payload.create({
            collection: 'users',
            data: {
              email: vippsEmail,
              password: generateSecurePassword(),
              phone_number: normalizedPhone,
              email_verified: true,
              phone_number_verified: true,
              given_name: vippsFirstName,
              family_name: vippsLastName,
            },
          });
        } catch (error) {
          if (!isUniqueViolation(error, 'email')) throw error;
          const { docs } = await payload.find({
            collection: 'users',
            where: { email: { equals: vippsEmail } },
            limit: 1,
          });
          if (!docs[0]) throw error;
          logger.info(
            { paymentReference, userId: docs[0].id },
            'User was created by a concurrent request for the same payment - using it',
          );
          newUser = docs[0];
        }
        effectiveUserId = newUser.id;
        logger.info(
          {
            userId: effectiveUserId,
            email: maskEmail(newUser.email),
            hasPhone: !!normalizedPhone,
            hasName: !!(vippsFirstName && vippsLastName),
            emailVerified: true,
            phoneVerified: true,
          },
          'Created new user from Vipps profile',
        );
      }
    } else {
      effectiveUserId = userId;
      logger.info(
        {
          userId: effectiveUserId,
          paymentReference,
          pspReference: paymentDetails.pspReference,
        },
        'Processing order for authenticated Historia user',
      );
    }

    // Get the current website/tenant ID
    let websiteId = cartTenantId;
    if (!websiteId) {
      // Carts saved before they carried a tenant: fall back to the request's host.
      logger.warn({ paymentReference }, 'Cart has no tenant - resolving website from host');
      websiteId = await getCurrentWebsiteId().catch((error: unknown) => {
        logger.error(
          { error, paymentReference },
          'Could not resolve website from host for order creation',
        );
        return null;
      });
    }
    if (!websiteId) {
      logger.error({ paymentReference }, 'Cannot create order without website/tenant');
      return actionError('Website configuration not found');
    }

    logger.info({ websiteId, paymentReference }, 'Using website/tenant for order creation');

    // Fetch all products
    const productFetchStart = Date.now();
    const { docs: products } = await payload.find({
      collection: 'products',
      where: {
        id: {
          in: cart.items.map((item) => item.productId),
        },
      },
      limit: cart.items.length,
    });
    const productFetchTime = Date.now() - productFetchStart;

    logger.info(
      {
        requestedProducts: cart.items.length,
        foundProducts: products.length,
        productIds: products.map((p) => p.id),
        fetchTimeMs: productFetchTime,
      },
      'Products fetched',
    );

    if (products.length !== cart.items.length) {
      const missingIds = cart.items
        .map((i) => i.productId)
        .filter((id) => !products.find((p) => p.id === id));

      reportCritical(
        logger,
        'Not all products found - products may have been deleted or are in different tenant',
        {
          area: 'checkout',
          expected: cart.items.length,
          found: products.length,
          requestedIds: cart.items.map((i) => i.productId),
          foundIds: products.map((p) => p.id),
          missingIds,
          paymentReference,
          cartItems: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          websiteId,
        },
      );
      return actionError('Some products not found');
    }

    // Map products to order items with prices
    const orderItems = cart.items.map((item) => {
      const product = products.find((p) => p.id === item.productId) as Product;
      return {
        itemId: crypto.randomUUID(),
        product: product.id,
        quantity: item.quantity,
        price: {
          amountExVat: product.price?.amountExVat ?? 0,
          currency: product.price?.currency || 'NOK',
          vatRate: product.price?.vatRate ?? 25,
        },
      };
    });

    // Add shipping line item if Vipps provided shipping details
    logger.info(
      {
        hasShippingDetails: !!paymentDetails.shippingDetails,
        shippingDetails: paymentDetails.shippingDetails,
        paymentState: paymentDetails.state,
      },
      'Checking for shipping details from Vipps',
    );

    if (paymentDetails.shippingDetails) {
      try {
        const shippingOptionId = paymentDetails.shippingDetails.shippingOptionId;
        const shippingOptionName = paymentDetails.shippingDetails.shippingOptionName;

        // Find or create shipping product with SKU matching the shipping option ID
        const shippingProducts = await payload.find({
          collection: 'products',
          where: {
            sku: {
              equals: shippingOptionId,
            },
          },
          limit: 1,
        });

        let shippingProduct: Product;

        if (shippingProducts.docs.length > 0) {
          shippingProduct = shippingProducts.docs[0] as Product;
          logger.info(
            { productId: shippingProduct.id, sku: shippingOptionId },
            'Found existing shipping product',
          );
        } else {
          // Create shipping product with data from Vipps
          const newShippingProduct = await payload.create({
            collection: 'products',
            draft: false,
            data: {
              title: shippingOptionName,
              lead: `Levering via Vipps: ${shippingOptionName}`,
              productType: 'shipping',
              price: {
                amountExVat: 0, // Actual price comes from Vipps per order
                currency: 'NOK',
                vatRate: 25,
              },
              sku: shippingOptionId,
              slug: shippingOptionId,
              resourceId: shippingOptionId,
              tenant: websiteId,
              _status: 'published',
            },
          });
          shippingProduct = newShippingProduct as Product;
          logger.info(
            { productId: shippingProduct.id, sku: shippingOptionId, name: shippingOptionName },
            'Created new shipping product from Vipps option',
          );
        }

        // Vipps shippingCost is in minor units (øre), already including VAT
        // We need to calculate ex VAT amount
        const shippingCostIncVat = paymentDetails.shippingDetails.shippingCost;
        const vatRate = 25; // Shipping typically has 25% VAT in Norway
        const shippingCostExVat = Math.round(shippingCostIncVat / (1 + vatRate / 100));

        // Validate currency
        const currency = paymentDetails.aggregate.authorizedAmount.currency || 'NOK';
        const supportedCurrencies = ['NOK', 'USD', 'EUR', 'GBP', 'SEK', 'DKK'] as const;
        const validCurrency = supportedCurrencies.includes(
          currency as (typeof supportedCurrencies)[number],
        )
          ? (currency as (typeof supportedCurrencies)[number])
          : 'NOK';

        // Add shipping as order item
        orderItems.push({
          itemId: crypto.randomUUID(),
          product: shippingProduct.id,
          quantity: 1,
          price: {
            amountExVat: shippingCostExVat,
            currency: validCurrency,
            vatRate,
          },
        });

        logger.info(
          {
            shippingOptionId: paymentDetails.shippingDetails.shippingOptionId,
            shippingOptionName: paymentDetails.shippingDetails.shippingOptionName,
            shippingCostIncVat,
            shippingCostExVat,
            vatRate,
          },
          'Added shipping line item from Vipps',
        );
      } catch (error) {
        logger.error(
          {
            error,
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            paymentReference,
            shippingDetails: paymentDetails.shippingDetails,
          },
          'Failed to add shipping line item - continuing without shipping',
        );
        // Continue without shipping rather than failing the entire order
      }
    }

    // Check the authorized amount against what the customer was asked to pay: the cart's
    // stored amount (inc. VAT) plus the shipping Vipps added. It must match exactly.
    // A mismatch does not stop the order: the money is authorized, and dropping the order
    // would leave a paid payment with nothing to fulfil. The order is put on hold for a
    // person to check instead, and the mismatch is logged and recorded.
    const authorizedAmount = paymentDetails.aggregate.authorizedAmount.value;
    const authorizedCurrency = paymentDetails.aggregate.authorizedAmount.currency;
    const shippingCost = paymentDetails.shippingDetails?.shippingCost ?? 0;
    const itemsAmount =
      cartAmount ??
      // Carts from before the amount was stored: recompute from today's prices.
      cart.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product?.price?.amountIncVat ?? 0) * item.quantity;
      }, 0);
    const expectedAmount = itemsAmount + shippingCost;
    const currencyMatches = !cartCurrency || cartCurrency === authorizedCurrency;
    const amountMatches = authorizedAmount === expectedAmount && currencyMatches;

    const amountCheck = {
      paymentReference,
      authorizedAmount,
      authorizedCurrency,
      expectedAmount,
      itemsAmount,
      shippingCost,
      cartCurrency,
      amountSource: cartAmount === null ? 'recomputed-from-products' : 'cart',
      difference: authorizedAmount - expectedAmount,
    };

    if (amountMatches) {
      logger.info(amountCheck, 'Payment amount matches the cart');
    } else {
      reportCritical(
        logger,
        'Authorized amount does not match the cart - order will be created on hold for manual review',
        { area: 'checkout', ...amountCheck },
      );
    }

    // Get user details from Historia account
    const user = await payload.findByID({
      collection: 'users',
      id: effectiveUserId,
    });

    if (!user?.email) {
      reportCritical(logger, 'User or user email not found - cannot create order', {
        area: 'checkout',
        paymentReference,
        userId: effectiveUserId,
        hasUser: !!user,
        hasEmail: !!user?.email,
        paymentState: paymentDetails.state,
        authorizedAmount: paymentDetails.aggregate.authorizedAmount,
      });
      return actionError('User account information not found');
    }

    logger.info(
      {
        userId: effectiveUserId,
        userEmail: maskEmail(user.email),
        itemCount: orderItems.length,
      },
      'Creating order in database',
    );

    // Extract shipping address from Vipps (prioritize shippingDetails over userDetails)
    let vippsShippingAddress: Omit<UserAddress, 'id' | 'label' | 'isDefault'> | undefined;
    if (paymentDetails.shippingDetails?.address) {
      vippsShippingAddress = {
        addressLine1: paymentDetails.shippingDetails.address.addressLine1,
        addressLine2: paymentDetails.shippingDetails.address.addressLine2,
        postalCode: paymentDetails.shippingDetails.address.postCode,
        city: paymentDetails.shippingDetails.address.city,
        country: paymentDetails.shippingDetails.address.country,
      };
    } else if (paymentDetails.userDetails) {
      vippsShippingAddress = {
        addressLine1: paymentDetails.userDetails.streetAddress,
        postalCode: paymentDetails.userDetails.zipCode,
        city: paymentDetails.userDetails.city,
        country: paymentDetails.userDetails.country,
      };
    }

    if (vippsShippingAddress) {
      logger.info(
        {
          paymentReference,
          postalCode: vippsShippingAddress.postalCode,
          country: vippsShippingAddress.country,
        },
        'Shipping address received from Vipps',
      );
    } else {
      logger.warn({ paymentReference }, 'No shipping address available from Vipps');
    }

    // Create Order
    const orderCreateStart = Date.now();
    // paymentReference is unique on orders: if the webhook and the return page both got
    // this far, only one insert succeeds. The other finds that order and returns it,
    // without sending emails or touching the cart and transaction a second time.
    let order: Order;
    try {
      order = await payload.create({
        collection: 'orders',
        draft: false,
        data: {
          customer: effectiveUserId,
          userEmail: user.email,
          status: amountMatches ? 'pending' : 'on-hold',
          currency: paymentDetails.aggregate.authorizedAmount.currency,
          tenant: websiteId,
          items: orderItems,
          shippingAddress: vippsShippingAddress,
          paymentReference,
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error, 'paymentReference')) throw error;
      const concurrentOrder = await findOrderByPaymentReference(payload, paymentReference);
      if (!concurrentOrder) throw error;
      logger.info(
        { paymentReference, orderId: concurrentOrder.id },
        'Order was created by a concurrent request for the same payment - using it',
      );
      return actionSuccess({
        orderId: concurrentOrder.id,
        transactionId: await findTransactionIdByPaymentReference(payload, paymentReference),
      });
    }

    const orderCreateTime = Date.now() - orderCreateStart;
    logger.info(
      {
        orderId: order.id,
        paymentReference,
        itemCount: orderItems.length,
        status: order.status,
        createTimeMs: orderCreateTime,
      },
      'Order created successfully',
    );

    if (!amountMatches) {
      // A record next to the order, so the mismatch can be found in the admin and not
      // only in the logs.
      try {
        await payload.create({
          collection: 'business-events',
          data: {
            eventType: 'payment.amount_mismatch',
            source: 'historia',
            externalReference: paymentReference,
            data: { ...amountCheck, orderId: order.id },
          },
        });
      } catch (error) {
        logger.error(
          { error, ...amountCheck, orderId: order.id },
          'Could not record the payment amount mismatch as a business event',
        );
      }
    }

    // Update cart status to completed and link to order
    // Idempotent: Only update if not already completed (prevents race condition with webhook)
    try {
      const carts = await payload.find({
        collection: 'carts',
        where: {
          paymentReference: {
            equals: paymentReference,
          },
        },
        limit: 1,
      });

      if (carts.docs.length > 0) {
        const cart = carts.docs[0];

        // Idempotent check: Skip if already completed (webhook may have updated it)
        if (cart.status === 'completed') {
          logger.info(
            {
              cartId: cart.id,
              orderId: order.id,
              paymentReference,
            },
            'Cart already marked as completed (likely by webhook) - skipping update',
          );
        } else {
          await payload.update({
            collection: 'carts',
            id: cart.id,
            data: {
              status: 'completed',
              order: order.id,
            },
          });
          logger.info(
            {
              cartId: cart.id,
              orderId: order.id,
              paymentReference,
              previousStatus: cart.status,
            },
            'Cart status updated to completed and linked to order',
          );
        }
      } else {
        logger.warn(
          {
            paymentReference,
            orderId: order.id,
          },
          'No cart found for payment reference when updating status - order was created successfully',
        );
      }
    } catch (error) {
      logger.error(
        {
          error,
          paymentReference,
          orderId: order.id,
        },
        'Failed to update cart status - order was created successfully',
      );
    }

    // Update user's Vipps address in their profile
    if (vippsShippingAddress) {
      try {
        // Find existing Vipps address or add new one
        const currentAddresses = user.addresses || [];
        const vippsAddressIndex = currentAddresses.findIndex((addr) => addr.label === 'Vipps');

        let updatedAddresses: UserAddress[];
        if (vippsAddressIndex >= 0) {
          // Update existing Vipps address
          updatedAddresses = [...currentAddresses];
          updatedAddresses[vippsAddressIndex] = {
            ...updatedAddresses[vippsAddressIndex],
            ...vippsShippingAddress,
            label: 'Vipps',
          };
          logger.info(
            { userId: effectiveUserId, addressIndex: vippsAddressIndex },
            'Updated existing Vipps address in user profile',
          );
        } else {
          // Add new Vipps address
          updatedAddresses = [
            ...currentAddresses,
            {
              label: 'Vipps',
              isDefault: currentAddresses.length === 0, // First address is default
              ...vippsShippingAddress,
            },
          ];
          logger.info(
            {
              userId: effectiveUserId,
              isFirstAddress: currentAddresses.length === 0,
            },
            'Added new Vipps address to user profile',
          );
        }

        await payload.update({
          collection: 'users',
          id: effectiveUserId,
          data: {
            addresses: updatedAddresses,
          },
        });
      } catch (error) {
        // Don't fail order creation if address update fails
        logger.error(
          {
            error,
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: effectiveUserId,
            paymentReference,
          },
          'Failed to update user address, but order was created successfully',
        );
      }
    }

    // Update user's name and phone from Vipps (verified data from Folkeregisteret)
    if (paymentDetails.userDetails) {
      try {
        const { firstName, lastName, mobileNumber, email } = paymentDetails.userDetails;

        // Build update object with only fields that Vipps actually provided
        const updateData: Partial<User> = {};

        // Update name fields if provided (treated as atomic unit per ADR 0002)
        if (firstName || lastName) {
          if (firstName) updateData.given_name = firstName;
          updateData.middle_name = null; // Vipps doesn't provide middle name
          if (lastName) updateData.family_name = lastName;
          updateData.name_verified = true;
        }

        // Update email if provided (always provided in userDetails)
        if (email) {
          updateData.email_verified = true;
        }

        // Update phone if provided
        if (mobileNumber) {
          updateData.phone_number = normalizePhoneNumber(mobileNumber);
          updateData.phone_number_verified = true;
        }

        // Only update if we have data to update
        if (Object.keys(updateData).length > 0) {
          await payload.update({
            collection: 'users',
            id: effectiveUserId,
            data: updateData,
            overrideAccess: true, // Bypass field-level access control (trusted source)
          });

          // Create business event for audit trail
          await payload.create({
            collection: 'business-events',
            data: {
              eventType: 'user.verified',
              source: 'vipps',
              externalReference: paymentReference,
              actor: effectiveUserId,
              entity: {
                relationTo: 'users',
                value: effectiveUserId,
              },
              data: {
                description: `User data verified and updated via Vipps payment`,
                paymentReference,
                firstName,
                lastName,
                mobileNumber,
                email,
              },
            },
          });

          logger.info(
            {
              userId: effectiveUserId,
              paymentReference,
              updatedFields: {
                given_name: !!firstName,
                family_name: !!lastName,
                phone_number: !!mobileNumber,
              },
            },
            'Updated user name and phone from Vipps verified data',
          );
        }
      } catch (error) {
        // Don't fail order creation if user update fails
        logger.error(
          {
            error,
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            userId: effectiveUserId,
            paymentReference,
          },
          'Failed to update user from Vipps data, but order was created successfully',
        );
      }
    }

    // Create or update Transaction
    const transactionCreateStart = Date.now();
    const transactionAmount = paymentDetails.aggregate.authorizedAmount.value; // Keep in minor units (øre)
    const transactionCurrency = paymentDetails.aggregate.authorizedAmount.currency;
    // State is AUTHORIZED here (checked above) whether or not the payment has been
    // captured since; the aggregate tells which.
    const transactionStatus =
      paymentDetails.aggregate.capturedAmount.value > 0 ? 'captured' : 'authorized';

    // Check if transaction already exists (from webhook)
    const existingWebhookTransactions = await payload.find({
      collection: 'transactions',
      where: {
        paymentReference: {
          equals: paymentReference,
        },
      },
      limit: 1,
    });

    let transaction: Transaction;
    if (existingWebhookTransactions.docs.length > 0) {
      // Transaction already exists from webhook - update it with order and customer
      transaction = existingWebhookTransactions.docs[0];

      logger.info(
        {
          transactionId: transaction.id,
          orderId: order.id,
          customerId: effectiveUserId,
          paymentReference,
          hadOrder: !!transaction.order,
        },
        'Transaction already exists (from webhook) - linking to order',
      );

      // The webhook may have moved the transaction further (captured, refunded) or
      // ended it (failed) since the payment details used here were read: keep its
      // status unless this is a step forward.
      const statusUpdate = canTransitionTransaction(transaction.status, transactionStatus)
        ? { status: transactionStatus }
        : {};
      if (!('status' in statusUpdate) && transaction.status !== transactionStatus) {
        logger.warn(
          {
            paymentReference,
            transactionId: transaction.id,
            currentStatus: transaction.status,
            ignoredStatus: transactionStatus,
          },
          'Transaction status from the return page would move it backwards - keeping current status',
        );
      }

      transaction = await payload.update({
        collection: 'transactions',
        id: transaction.id,
        data: {
          order: order.id,
          customer: effectiveUserId,
          amount: transactionAmount,
          currency: transactionCurrency as 'NOK' | 'USD' | 'EUR' | 'SEK' | 'DKK',
          ...statusUpdate,
          paymentMethod: 'vipps',
          tenant: websiteId,
        },
      });

      logger.info(
        {
          transactionId: transaction.id,
          orderId: order.id,
          paymentReference,
        },
        'Orphaned transaction successfully linked to order',
      );
    } else {
      // Create new transaction
      logger.info(
        {
          orderId: order.id,
          customerId: effectiveUserId,
          amount: transactionAmount,
          amountMajor: transactionAmount / 100, // For logging readability
          currency: transactionCurrency,
          status: transactionStatus,
          paymentReference,
        },
        'Creating new transaction in database',
      );

      try {
        transaction = await payload.create({
          collection: 'transactions',
          draft: false,
          data: {
            order: order.id,
            customer: effectiveUserId,
            amount: transactionAmount, // Store in minor units
            currency: transactionCurrency as 'NOK' | 'USD' | 'EUR' | 'SEK' | 'DKK',
            status: transactionStatus,
            paymentMethod: 'vipps',
            paymentReference,
            tenant: websiteId,
          },
        });
      } catch (createError) {
        // Handle race condition: webhook and client callback both tried to create transaction
        // The unique constraint on paymentReference prevents duplicates
        const createErrorMessage = (createError as { message?: unknown } | null)?.message;
        if (
          typeof createErrorMessage === 'string' &&
          (createErrorMessage.includes('unique') || createErrorMessage.includes('duplicate'))
        ) {
          logger.warn(
            {
              paymentReference,
              orderId: order.id,
              createError: createErrorMessage,
            },
            'Transaction already exists (race condition) - retrieving existing transaction',
          );

          // Retrieve the existing transaction that was created by webhook
          const existingDuplicateTransactions = await payload.find({
            collection: 'transactions',
            where: {
              paymentReference: {
                equals: paymentReference,
              },
            },
            limit: 1,
          });

          if (existingDuplicateTransactions.docs.length === 0) {
            // This shouldn't happen, but handle it
            logger.error(
              {
                paymentReference,
                orderId: order.id,
              },
              'CRITICAL: Unique constraint violation but transaction not found',
            );
            throw createError; // Re-throw original error
          }

          // Link it to this order, which it was created without; its status only moves
          // forward.
          const existingTransaction = existingDuplicateTransactions.docs[0];
          transaction = await payload.update({
            collection: 'transactions',
            id: existingTransaction.id,
            data: {
              order: order.id,
              customer: effectiveUserId,
              ...(canTransitionTransaction(existingTransaction.status, transactionStatus) && {
                status: transactionStatus,
              }),
            },
          });

          logger.info(
            {
              transactionId: transaction.id,
              paymentReference,
              orderId: order.id,
            },
            'Using existing transaction created by concurrent request (webhook/client race)',
          );
        } else {
          // Different error - re-throw
          throw createError;
        }
      }
    }

    const transactionCreateTime = Date.now() - transactionCreateStart;

    // Create BusinessEvent to log the payment
    const businessEventStart = Date.now();
    await payload.create({
      collection: 'business-events',
      data: {
        eventType: 'payment',
        externalReference: paymentReference,
        data: {
          name: transactionStatus === 'authorized' ? 'AUTHORIZED' : 'CAPTURED',
          amount: paymentDetails.aggregate.authorizedAmount,
          pspReference: paymentDetails.pspReference,
          orderId: order.id,
          transactionId: transaction.id,
          timestamp: new Date().toISOString(),
          source: 'order-creation',
        },
      },
    });
    const businessEventTime = Date.now() - businessEventStart;

    const totalTime = Date.now() - startTime;

    logger.info(
      {
        orderId: order.id,
        transactionId: transaction.id,
        paymentReference,
        amount: transactionAmount,
        transactionStatus,
        transactionCreateTimeMs: transactionCreateTime,
        businessEventTimeMs: businessEventTime,
        totalTimeMs: totalTime,
      },
      'Order, transaction and business event created successfully - cart will be cleared client-side',
    );

    // Create business event for order auto-creation tracking
    // Note: We don't await this to avoid slowing down the response
    // Errors in event creation are logged but don't fail the order creation
    createOrderAutoCreatedEvent(
      paymentReference,
      order.id as string,
      paymentDetails.aggregate.authorizedAmount,
      'callback', // This is called from client callback (SSE path)
    ).catch((error) => {
      logger.error(
        { error, orderId: order.id, paymentReference },
        'Failed to create order auto-created event (non-critical)',
      );
    });

    return actionSuccess({
      orderId: order.id as string,
      transactionId: transaction.id as string,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    reportCritical(
      logger,
      'Error creating order from payment - payment may be authorized but order not created',
      {
        area: 'checkout',
        ...sessionContext,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        paymentReference,
        userId,
        paymentState: paymentDetails?.state,
        authorizedAmount: paymentDetails?.aggregate?.authorizedAmount,
        pspReference: paymentDetails?.pspReference,
        hasCart: !!cart,
        cartItemCount: cart?.items?.length,
        customerEmail: maskEmail(
          paymentDetails?.profile?.email || paymentDetails?.userDetails?.email,
        ),
        totalTimeMs: totalTime,
      },
      error,
    );
    return actionError(error instanceof Error ? error.message : 'Failed to create order');
  }
}
