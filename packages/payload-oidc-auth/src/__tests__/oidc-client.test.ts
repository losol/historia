import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clientFor, createOidcClient } from '../oidc-client';
import { resolveProvider } from '../provider';

/**
 * A provider on a loopback port: discovery, token, keys and userinfo. It checks
 * what a real one checks at the token endpoint (the client, the code and the
 * PKCE verifier), so the default client is run through a whole login.
 */
const CLIENT_ID = 'historia';
const CLIENT_SECRET = 's3cret';
const REDIRECT_URI = 'https://shop.example.com/api/auth/idp/callback';

let server: Server;
let issuer: string;
let discoveries = 0;
/** What the "browser" sent to the authorization endpoint, kept for the token call. */
let challenge: string | undefined;
let userinfoSub = 'user-1';

const body = async (request: IncomingMessage) => {
  let text = '';
  for await (const chunk of request) text += chunk;
  return new URLSearchParams(text);
};

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };

  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', issuer);
    const json = (status: number, value: unknown) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(value));
    };

    if (url.pathname === '/.well-known/openid-configuration') {
      discoveries += 1;
      return json(200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/keys`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      });
    }
    if (url.pathname === '/keys') return json(200, { keys: [jwk] });

    if (url.pathname === '/token') {
      const form = await body(request);
      const basic = request.headers.authorization?.startsWith('Basic ')
        ? Buffer.from(request.headers.authorization.slice(6), 'base64').toString().split(':')
        : [];
      const clientId = form.get('client_id') ?? decodeURIComponent(basic[0] ?? '');
      const clientSecret = form.get('client_secret') ?? decodeURIComponent(basic[1] ?? '');
      const verifier = form.get('code_verifier') ?? '';
      const expected = createHash('sha256').update(verifier).digest('base64url');
      if (clientId !== CLIENT_ID || clientSecret !== CLIENT_SECRET) {
        return json(401, { error: 'invalid_client' });
      }
      if (
        form.get('grant_type') !== 'authorization_code' ||
        form.get('code') !== 'the-code' ||
        form.get('redirect_uri') !== REDIRECT_URI ||
        expected !== challenge
      ) {
        return json(400, { error: 'invalid_grant' });
      }
      const idToken = await new SignJWT({ email: 'kari@example.com' })
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(issuer)
        .setAudience(CLIENT_ID)
        .setSubject('user-1')
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);
      return json(200, {
        access_token: 'the-access-token',
        token_type: 'Bearer',
        expires_in: 300,
        id_token: idToken,
      });
    }

    if (url.pathname === '/userinfo') {
      if (request.headers.authorization !== 'Bearer the-access-token') return json(401, {});
      return json(200, { sub: userinfoSub, email: 'kari@example.com', email_verified: true });
    }
    return json(404, {});
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => void server.close(() => resolve())));

const provider = () =>
  resolveProvider({
    name: 'idp',
    issuer,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });

describe('the default OIDC client, against a provider', () => {
  it('takes a login from the authorization URL to the user', async () => {
    const client = createOidcClient(provider(), REDIRECT_URI);

    const request = await client.createAuthorizationRequest();
    const authUrl = await client.authorizationUrl(request);
    expect(authUrl.origin + authUrl.pathname).toBe(`${issuer}/authorize`);
    expect(authUrl.searchParams.get('client_id')).toBe(CLIENT_ID);
    expect(authUrl.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(authUrl.searchParams.get('scope')).toBe('openid profile email');
    expect(authUrl.searchParams.get('state')).toBe(request.state);
    expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
    challenge = authUrl.searchParams.get('code_challenge') ?? undefined;
    expect(challenge).toBe(request.codeChallenge);

    const callbackUrl = new URL(`${REDIRECT_URI}?code=the-code&state=${request.state}`);
    const tokens = await client.exchangeCode(callbackUrl, request);
    expect(tokens.access_token).toBe('the-access-token');

    userinfoSub = 'user-1';
    expect(await client.getUserInfo(tokens)).toMatchObject({
      sub: 'user-1',
      email: 'kari@example.com',
      email_verified: true,
    });
  });

  it('refuses a callback with another state than the login had', async () => {
    const client = createOidcClient(provider(), REDIRECT_URI);
    const request = await client.createAuthorizationRequest();
    challenge = request.codeChallenge;

    const callbackUrl = new URL(`${REDIRECT_URI}?code=the-code&state=someone-elses`);
    await expect(client.exchangeCode(callbackUrl, request)).rejects.toThrow();
  });

  it('refuses a verifier that does not belong to the login', async () => {
    const client = createOidcClient(provider(), REDIRECT_URI);
    const request = await client.createAuthorizationRequest();
    challenge = request.codeChallenge;

    const callbackUrl = new URL(`${REDIRECT_URI}?code=the-code&state=${request.state}`);
    await expect(
      client.exchangeCode(callbackUrl, { state: request.state, codeVerifier: 'x'.repeat(43) }),
    ).rejects.toThrow();
  });

  it('refuses userinfo about another subject than the ID token names', async () => {
    const client = createOidcClient(provider(), REDIRECT_URI);
    const request = await client.createAuthorizationRequest();
    challenge = request.codeChallenge;
    const callbackUrl = new URL(`${REDIRECT_URI}?code=the-code&state=${request.state}`);
    const tokens = await client.exchangeCode(callbackUrl, request);

    userinfoSub = 'someone-else';
    await expect(client.getUserInfo(tokens)).rejects.toThrow();
    userinfoSub = 'user-1';
  });
});

describe('clientFor', () => {
  it('keeps one client per redirect URI, so the provider is discovered once', async () => {
    const idp = provider();
    const first = clientFor(idp, REDIRECT_URI);
    expect(clientFor(idp, REDIRECT_URI)).toBe(first);
    expect(clientFor(idp, 'https://other.example.com/api/auth/idp/callback')).not.toBe(first);

    const before = discoveries;
    await first.authorizationUrl(await first.createAuthorizationRequest());
    const again = clientFor(idp, REDIRECT_URI);
    await again.authorizationUrl(await again.createAuthorizationRequest());
    expect(discoveries - before).toBe(1);
  });
});
