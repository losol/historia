import type { VippsAddress } from '@eventuras/fides-auth/providers/vipps';
import type { User } from '@/payload-types';

type UserAddress = NonNullable<User['addresses']>[number];

/** The label that marks the address Vipps keeps up to date. Checkout uses the same one. */
export const VIPPS_ADDRESS_LABEL = 'Vipps';

/**
 * Merges the address from a Vipps Login into the user's addresses.
 *
 * Only the address labelled "Vipps" is touched: it is updated in place (keeping its
 * id and isDefault) or appended if missing. Every other address is left as it is.
 * Returns undefined when Vipps sent no address, so the caller can leave the field alone.
 */
export function mergeVippsAddress(
  existing: UserAddress[] | null | undefined,
  vippsAddresses: VippsAddress[] | undefined,
): UserAddress[] | undefined {
  // Vipps can return several (home, work, other); prefer home.
  const source =
    vippsAddresses?.find((addr) => addr.address_type === 'home') ?? vippsAddresses?.[0];
  if (!source) return undefined;

  // Vipps may put several street lines in street_address, separated by newlines.
  const [addressLine1, ...rest] = (source.street_address ?? '').split('\n');
  const fromVipps: UserAddress = {
    label: VIPPS_ADDRESS_LABEL,
    addressLine1: addressLine1 || undefined,
    addressLine2: rest.join(', ') || undefined,
    postalCode: source.postal_code,
    city: source.region, // Vipps calls the city/post town "region"
    country: source.country,
  };

  const addresses = existing ?? [];
  const index = addresses.findIndex((addr) => addr.label === VIPPS_ADDRESS_LABEL);

  if (index === -1) {
    return [...addresses, { ...fromVipps, isDefault: addresses.length === 0 }];
  }

  return addresses.map((addr, i) => (i === index ? { ...addr, ...fromVipps } : addr));
}
