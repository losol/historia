/**
 * Client-safe exports: the login button only, so no server code reaches the
 * browser bundle.
 */

export type { OidcLoginButtonProps } from './components/OidcLoginButton';
export { OidcLoginButton } from './components/OidcLoginButton';
