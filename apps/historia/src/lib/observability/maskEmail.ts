/**
 * An email address as logs may show it: the first letter and the domain, enough to
 * tell customers apart and spot a typo'd domain, not enough to identify anyone.
 * `kari@example.com` becomes `k***@example.com`.
 */
export function maskEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;
  const at = email.indexOf('@');
  if (at < 1) return '***';
  return `${email[0]}***${email.slice(at)}`;
}
