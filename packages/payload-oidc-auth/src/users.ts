/**
 * Finding, linking and creating the Payload user for a person a provider vouches
 * for.
 *
 * A user is matched by the provider's subject first, through the `identities`
 * rows the plugin adds to the collection. Only when there is no such row is the
 * email used, and then only an email the provider reports as verified: otherwise
 * anyone who registered another person's address with the provider could log in
 * as that person.
 */

import { randomBytes } from 'node:crypto';
import type { Field, Payload } from 'payload';
import { createLogger } from './logger';
import type { OidcLoginError, OidcUserInfo, ResolvedOidcProvider } from './types';

export const IDENTITIES_FIELD = 'identities';

interface Identity {
  provider: string;
  subject: string;
}

type UserDoc = Record<string, unknown> & { id: string | number; email?: string };

/** The field the plugin adds to the users collection. */
export const identitiesField: Field = {
  name: IDENTITIES_FIELD,
  type: 'array',
  label: 'Identities',
  admin: {
    description: 'Logins at identity providers that belong to this user.',
    position: 'sidebar',
    readOnly: true,
  },
  fields: [
    { name: 'provider', type: 'text', required: true },
    { name: 'subject', type: 'text', required: true },
  ],
};

/** A login that cannot continue, with the code the error redirect carries. */
export class OidcLoginFailure extends Error {
  readonly code: OidcLoginError;

  constructor(code: OidcLoginError, message: string) {
    super(message);
    this.name = 'OidcLoginFailure';
    this.code = code;
  }
}

function defaultMapUser(user: OidcUserInfo): Record<string, unknown> {
  return {
    email: user.email,
    email_verified: user.email_verified,
    given_name: user.given_name,
    family_name: user.family_name,
  };
}

/** Payload stores emails lowercased and trimmed; compare and write them the same way. */
function normalizeEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

function identitiesOf(user: UserDoc): Identity[] {
  const rows = user[IDENTITIES_FIELD];
  return Array.isArray(rows) ? (rows as Identity[]) : [];
}

function hasIdentity(user: UserDoc, identity: Identity): boolean {
  return identitiesOf(user).some(
    (row) => row.provider === identity.provider && row.subject === identity.subject,
  );
}

async function findByIdentity(
  payload: Payload,
  collection: string,
  identity: Identity,
): Promise<UserDoc | undefined> {
  // Two conditions on an array field can match different rows, so the rows are
  // checked again here.
  const result = await payload.find({
    collection,
    where: {
      and: [
        { [`${IDENTITIES_FIELD}.provider`]: { equals: identity.provider } },
        { [`${IDENTITIES_FIELD}.subject`]: { equals: identity.subject } },
      ],
    },
    limit: 10,
    overrideAccess: true,
  });
  return (result.docs as UserDoc[]).find((user) => hasIdentity(user, identity));
}

async function findByEmail(
  payload: Payload,
  collection: string,
  email: string,
): Promise<UserDoc | undefined> {
  const result = await payload.find({
    collection,
    where: { email: { equals: email } },
    limit: 1,
    // The whole document goes to mapUser for merging, so access control must not trim it.
    overrideAccess: true,
  });
  return result.docs[0] as UserDoc | undefined;
}

/**
 * Returns the user for `userInfo`, updated with what the provider returned, or
 * throws an `OidcLoginFailure`.
 */
export async function findOrCreateUser<TUser extends OidcUserInfo>(options: {
  payload: Payload;
  collection: string;
  provider: ResolvedOidcProvider<TUser>;
  userInfo: TUser;
}): Promise<UserDoc> {
  const { payload, collection, provider, userInfo } = options;
  const identity: Identity = { provider: provider.name, subject: userInfo.sub };
  const log = createLogger('Users', provider.name);
  const email = normalizeEmail(userInfo.email);
  const emailTrusted = !provider.requireVerifiedEmail || userInfo.email_verified === true;

  // What the provider's claims become on the user. An email the provider has not
  // verified is never written: on a known user it would let anyone change their
  // provider email to another person's and claim it here.
  const mapUser = (existing?: UserDoc): Record<string, unknown> => {
    const data = (provider.mapUser ?? defaultMapUser)(userInfo, existing);
    if (typeof data.email === 'string') data.email = normalizeEmail(data.email);
    if (!emailTrusted) {
      delete data.email;
      delete data.email_verified;
    }
    return data;
  };

  if (!identity.subject) {
    throw new OidcLoginFailure('callback_failed', 'The provider returned no subject');
  }

  const byIdentity = await findByIdentity(payload, collection, identity);
  if (byIdentity) {
    log.info({ userId: byIdentity.id, sub: identity.subject }, 'Found user by identity');
    return update(byIdentity, mapUser(byIdentity));
  }

  if (!email) {
    throw new OidcLoginFailure('no_email', 'The provider returned no email');
  }
  if (!emailTrusted) {
    throw new OidcLoginFailure(
      'email_not_verified',
      'The provider has not verified the email, so it cannot identify a user',
    );
  }

  const byEmail = await findByEmail(payload, collection, email);
  if (byEmail) {
    log.info(
      { userId: byEmail.id, sub: identity.subject },
      'Found user by verified email, linking identity',
    );
    return update(byEmail, {
      ...mapUser(byEmail),
      [IDENTITIES_FIELD]: [...identitiesOf(byEmail), identity],
    });
  }

  if (!provider.allowSignup) {
    throw new OidcLoginFailure('signup_disabled', 'No user has this email, and signup is off');
  }

  const created = (await payload.create({
    collection,
    data: {
      email,
      // Payload's local strategy insists on a password. This one is never told
      // to anyone; a person who wants email login resets it.
      password: randomBytes(32).toString('base64url'),
      ...mapUser(),
      [IDENTITIES_FIELD]: [identity],
    },
  })) as UserDoc;
  log.info({ userId: created.id, sub: identity.subject }, 'Created user');
  return created;

  async function update(user: UserDoc, data: Record<string, unknown>): Promise<UserDoc> {
    if (Object.keys(data).length === 0) return user;
    return (await payload.update({
      collection,
      id: user.id,
      data,
      overrideAccess: true, // The provider is trusted for the fields it maps.
    })) as UserDoc;
  }
}
