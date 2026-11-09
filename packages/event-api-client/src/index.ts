/**
 * A client for the public, anonymous part of the Eventuras event API: listing
 * events and reading one. The types are the package's own.
 */

export { createEventApiClient, type EventApiClient, EventApiError } from './client';
export * from './types';
