import { createOidcClient } from './oidc-client';
import type {
  OidcAuthPluginConfig,
  OidcProvider,
  OidcUserInfo,
  ResolvedOidcAuthPluginConfig,
  ResolvedOidcProvider,
} from './types';

export const DEFAULT_SCOPE = 'openid profile email';

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Applies the defaults to a provider and checks what cannot be defaulted. It
 * throws on a missing issuer or credentials, so a misconfigured provider fails at
 * startup rather than on the first login.
 */
export function resolveProvider<TUser extends OidcUserInfo>(
  provider: OidcProvider<TUser>,
): ResolvedOidcProvider<TUser> {
  const { name } = provider;
  if (!name || !NAME.test(name)) {
    throw new Error(
      `OIDC provider name "${name}" must be lowercase letters, digits and dashes (it is used in URLs and cookie names)`,
    );
  }
  for (const key of ['issuer', 'clientId', 'clientSecret'] as const) {
    if (!provider[key]) {
      throw new Error(`OIDC provider "${name}" needs a ${key}`);
    }
  }

  return {
    name,
    label: provider.label ?? name,
    issuer: provider.issuer,
    clientId: provider.clientId,
    clientSecret: provider.clientSecret,
    scope: provider.scope ?? DEFAULT_SCOPE,
    redirectUri: provider.redirectUri,
    basePath: provider.basePath ?? `/api/auth/${name}`,
    allowSignup: provider.allowSignup ?? true,
    requireVerifiedEmail: provider.requireVerifiedEmail ?? true,
    mapUser: provider.mapUser,
    createClient: provider.createClient ?? createOidcClient,
  };
}

export function resolveConfig(config: OidcAuthPluginConfig): ResolvedOidcAuthPluginConfig {
  const providers = config.providers.map(resolveProvider);

  const names = new Set<string>();
  for (const provider of providers) {
    if (names.has(provider.name)) {
      throw new Error(`OIDC provider "${provider.name}" is configured twice`);
    }
    names.add(provider.name);
  }

  return {
    providers,
    usersCollection: config.usersCollection ?? 'users',
    allowedDomains: config.allowedDomains,
    successPath: config.successPath ?? '/admin',
    errorPath: config.errorPath ?? '/admin/login?error={error}',
  };
}

/** The strategy name and the `provider` value on identity rows. */
export function strategyName(provider: Pick<ResolvedOidcProvider, 'name'>): string {
  return `oidc-${provider.name}`;
}
