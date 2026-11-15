/**
 * Whether `error` is Payload's report of a unique index rejecting `field`: what a
 * concurrent request for the same payment causes. Anything else must not be taken
 * for a lost race.
 *
 * Checks the shape, not `instanceof ValidationError`: payload is bundled per route, so
 * the error thrown by the shared Payload instance can be from another copy of the class.
 */
export function isUniqueViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Error) || error.name !== 'ValidationError') return false;
  const fieldErrors = (error as { data?: { errors?: unknown } }).data?.errors;
  if (!Array.isArray(fieldErrors)) return false;
  const normalize = (value: string) => value.replaceAll('_', '').toLowerCase();
  return fieldErrors.some(
    (fieldError: { path?: unknown } | null) =>
      typeof fieldError?.path === 'string' && normalize(fieldError.path) === normalize(field),
  );
}
