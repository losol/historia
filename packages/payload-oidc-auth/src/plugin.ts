/**
 * The plugin: for each provider it adds the login, callback and session
 * endpoints and an auth strategy, and it adds the `identities` field to the
 * users collection.
 */

import type { Config, Endpoint, PayloadRequest } from 'payload';
import { handleOidcCallback, handleOidcLogin, handleOidcSession } from './handlers';
import { createLogger } from './logger';
import { resolveConfig } from './provider';
import { createOidcAuthStrategy } from './strategy';
import type { OidcAuthPluginConfig, ResolvedOidcAuthPluginConfig } from './types';
import { IDENTITIES_FIELD, identitiesField } from './users';

const logger = createLogger('OidcAuthPlugin');

function allowedDomainsOf(config: ResolvedOidcAuthPluginConfig): string[] | undefined {
  const { allowedDomains } = config;
  return typeof allowedDomains === 'function' ? allowedDomains() : allowedDomains;
}

/** The endpoints for every provider, relative to Payload's API route. */
export function oidcEndpoints(config: ResolvedOidcAuthPluginConfig, apiRoute = '/api'): Endpoint[] {
  return config.providers.flatMap((provider) => {
    if (!provider.basePath.startsWith(`${apiRoute}/`)) {
      throw new Error(
        `OIDC provider "${provider.name}" has basePath "${provider.basePath}", but Payload only serves endpoints under "${apiRoute}"`,
      );
    }
    const path = provider.basePath.slice(apiRoute.length);
    const common = {
      collection: config.usersCollection,
      allowedDomains: allowedDomainsOf(config),
      errorPath: config.errorPath,
    };

    return [
      {
        method: 'get',
        path: `${path}/login`,
        handler: (req: PayloadRequest) =>
          handleOidcLogin(req, provider, { allowedDomains: common.allowedDomains }),
      },
      {
        method: 'get',
        path: `${path}/callback`,
        handler: (req: PayloadRequest) => handleOidcCallback(req, provider, req.payload, common),
      },
      {
        method: 'get',
        path: `${path}/session`,
        handler: (req: PayloadRequest) =>
          handleOidcSession(req, req.payload, { ...common, successPath: config.successPath }),
      },
    ];
  });
}

export function oidcAuthPlugin(pluginConfig: OidcAuthPluginConfig) {
  return (incoming: Config): Config => {
    if (pluginConfig.enabled === false || pluginConfig.providers.length === 0) {
      logger.info('OIDC login is off');
      return incoming;
    }

    const config = resolveConfig(pluginConfig);
    const users = incoming.collections?.find((c) => c.slug === config.usersCollection);
    if (!users) {
      throw new Error(`OIDC login needs the "${config.usersCollection}" collection`);
    }
    if (!users.auth) {
      throw new Error(`OIDC login needs auth on the "${config.usersCollection}" collection`);
    }

    const auth = users.auth === true ? {} : users.auth;
    users.auth = auth;
    auth.strategies = [
      ...(auth.strategies ?? []),
      ...config.providers.map((provider) =>
        createOidcAuthStrategy(provider, config.usersCollection),
      ),
    ];
    if (config.disableLocalStrategy) {
      auth.disableLocalStrategy = true;
    }

    if (!users.fields.some((field) => 'name' in field && field.name === IDENTITIES_FIELD)) {
      users.fields = [...users.fields, identitiesField];
    }

    incoming.endpoints = [
      ...(incoming.endpoints ?? []),
      ...oidcEndpoints(config, incoming.routes?.api ?? '/api'),
    ];

    logger.info(
      { providers: config.providers.map((p) => p.name), collection: config.usersCollection },
      'OIDC login is on',
    );
    return incoming;
  };
}
