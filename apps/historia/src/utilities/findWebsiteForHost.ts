import type { Payload } from 'payload';
import type { Website } from '@/payload-types';

/**
 * The website whose `domains` include this host, or null. A website lists every
 * host it is served on, with the port where one is used (`localhost:3100`).
 *
 * The lookup bypasses access control: it is what access control is built on.
 */
export async function findWebsiteForHost(
  payload: Payload,
  host: string,
  options: { depth?: number } = {},
): Promise<Website | null> {
  const { docs } = await payload.find({
    collection: 'websites',
    where: { domains: { contains: host } },
    limit: 1,
    pagination: false,
    ...options,
  });
  return docs[0] ?? null;
}
