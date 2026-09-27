import type { Payload } from 'payload';
import type { Product } from '@/payload-types';

/**
 * The most of one product a cart line may hold. Anything above is almost
 * certainly a typo or a scripted request, and a larger order goes through sales.
 */
export const MAX_ITEM_QUANTITY = 99;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A whole number of items, 1 to MAX_ITEM_QUANTITY. Server actions can be called
 * with anything, so fractions, NaN and huge numbers have to be turned away here:
 * the price would be computed from them.
 */
export function isValidQuantity(quantity: unknown): quantity is number {
  return (
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_ITEM_QUANTITY
  );
}

export function isValidProductId(productId: unknown): productId is string {
  return typeof productId === 'string' && UUID_PATTERN.test(productId);
}

/**
 * The products among `productIds` that can be bought on this website: published,
 * not a shipping line (those are priced by Vipps), and belonging to the site. The
 * Local API skips access control, so without these filters a draft, another
 * site's product or a free shipping product could be put in a cart and paid for.
 */
export async function findPurchasableProducts(
  payload: Payload,
  productIds: string[],
  websiteId: string | null,
): Promise<Product[]> {
  const ids = [...new Set(productIds.filter(isValidProductId))];
  if (ids.length === 0) return [];

  const { docs } = await payload.find({
    collection: 'products',
    where: {
      and: [
        { id: { in: ids } },
        { _status: { equals: 'published' } },
        { productType: { not_equals: 'shipping' } },
        ...(websiteId ? [{ tenant: { equals: websiteId } }] : []),
      ],
    },
    limit: ids.length,
    depth: 0,
    pagination: false,
  });

  return docs;
}
