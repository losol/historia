/**
 * A "log in with …" button for Payload's login page. Add it through
 * `admin.components.beforeLogin`.
 */

'use client';

import type React from 'react';

export interface OidcLoginButtonProps {
  /** The provider's name, which decides the default login path. */
  provider: string;
  /** @default `Logg inn med ${provider}` */
  label?: string;
  /** Text under the button. @default 'eller bruk e-post og passord nedenfor' */
  helperText?: string | null;
  /** @default `/api/auth/${provider}/login` */
  loginPath?: string;
  /**
   * The path on this site to come back to after login. Without it, the page's
   * own `?redirect=` (where Payload's login page keeps a deep link) is used, and
   * without that the plugin's `successPath`. The server checks it either way.
   */
  returnTo?: string;
  /** @default '#1f2937' */
  color?: string;
  hoverColor?: string;
  icon?: React.ReactNode;
}

export const OidcLoginButton: React.FC<OidcLoginButtonProps> = ({
  provider,
  label = `Logg inn med ${provider}`,
  helperText = 'eller bruk e-post og passord nedenfor',
  loginPath = `/api/auth/${provider}/login`,
  returnTo,
  color = '#1f2937',
  hoverColor,
  icon,
}) => (
  <div style={{ marginTop: '1rem' }}>
    <button
      type="button"
      onClick={() => {
        window.location.href = loginUrl(loginPath, returnTo);
      }}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        backgroundColor: color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (hoverColor) e.currentTarget.style.backgroundColor = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = color;
      }}
    >
      {icon}
      {label}
    </button>
    {helperText && (
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666', textAlign: 'center' }}>
        {helperText}
      </p>
    )}
  </div>
);

/** The login path with where to come back to, if anything says so. */
export function loginUrl(loginPath: string, returnTo?: string, current?: string): string {
  const back =
    returnTo ?? new URL(current ?? window.location.href).searchParams.get('redirect') ?? undefined;
  if (!back) return loginPath;
  const url = new URL(loginPath, 'http://login.invalid');
  url.searchParams.set('returnTo', back);
  return `${url.pathname}${url.search}`;
}
