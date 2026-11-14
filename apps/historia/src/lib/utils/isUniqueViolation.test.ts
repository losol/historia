import { ValidationError } from 'payload';
import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './isUniqueViolation';

const uniqueError = (path: string) =>
  new ValidationError({
    collection: 'orders',
    errors: [{ message: 'Value must be unique', path }],
  });

/** A ValidationError from another copy of Payload's class, as a bundled route sees it. */
class ForeignValidationError extends Error {
  data: unknown;
  constructor(data: unknown) {
    super('The following field is invalid');
    this.name = 'ValidationError';
    this.data = data;
  }
}

describe('isUniqueViolation', () => {
  it('matches a unique violation on the field', () => {
    expect(isUniqueViolation(uniqueError('paymentReference'), 'paymentReference')).toBe(true);
  });

  it('matches the column name as well as the field name', () => {
    expect(isUniqueViolation(uniqueError('payment_reference'), 'paymentReference')).toBe(true);
  });

  it('matches an error from another copy of the class', () => {
    const error = new ForeignValidationError({
      collection: 'orders',
      errors: [{ message: 'Value must be unique', path: 'paymentReference' }],
    });
    expect(error instanceof ValidationError).toBe(false);
    expect(isUniqueViolation(error, 'paymentReference')).toBe(true);
  });

  it('does not match another field', () => {
    expect(isUniqueViolation(uniqueError('email'), 'paymentReference')).toBe(false);
  });

  it('does not match other errors', () => {
    expect(isUniqueViolation(new Error('boom'), 'paymentReference')).toBe(false);
    expect(isUniqueViolation(new ForeignValidationError(null), 'paymentReference')).toBe(false);
    expect(isUniqueViolation(undefined, 'paymentReference')).toBe(false);
  });
});
