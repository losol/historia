/**
 * Vipps Login for Payload CMS, as a provider for `@eventuras/payload-oidc-auth`.
 *
 * @example
 * ```typescript
 * import { oidcAuthPlugin } from '@eventuras/payload-oidc-auth';
 * import { vippsProvider } from '@eventuras/payload-vipps-auth';
 *
 * plugins: [
 *   oidcAuthPlugin({
 *     providers: [vippsProvider({ clientId, clientSecret, apiUrl })],
 *   }),
 * ]
 * ```
 *
 * @see https://developer.vippsmobilepay.com/docs/APIs/login-api/
 */

export * from './components';
export * from './provider';
export * from './types';
