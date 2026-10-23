/**
 * The package's own types, not the Eventuras API's: the API can change without
 * breaking the sites that list its events.
 */

export type EventurasEventStatus =
  | 'draft'
  | 'planned'
  | 'registrationsOpen'
  | 'waitingList'
  | 'registrationsClosed'
  | 'finished'
  | 'archived'
  | 'cancelled';

export type EventurasEventType = 'course' | 'conference' | 'onlineCourse' | 'social' | 'other';

export interface EventurasEvent {
  id: number;
  slug: string;
  title: string;
  /** A one-line summary, when the organiser wrote one. */
  headline: string | null;
  category: string | null;
  type: EventurasEventType;
  status: EventurasEventStatus;
  /** True while people can register (open, or waiting list). */
  registrationOpen: boolean;
  city: string | null;
  location: string | null;
  /** ISO dates (`2026-03-01`), as the API gives them. */
  dateStart: string | null;
  dateEnd: string | null;
  lastRegistrationDate: string | null;
  onDemand: boolean;
  featuredImageUrl: string | null;
  /** The event's page on the Eventuras site, where people read more and register. */
  url: string;
}

export interface EventurasPage<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface ListEventsOptions {
  /** Overrides the client's organisation. */
  organizationId?: number;
  /** Only events in this collection (a curated group of events in Eventuras). */
  collectionId?: number;
  /** Events that are over are left out unless this is true. */
  includePast?: boolean;
  /** 1–100. Default: 20. */
  limit?: number;
  /** 1-based. Default: 1. */
  page?: number;
  signal?: AbortSignal;
}

export interface EventApiClientOptions {
  /** The API, e.g. `https://api.example.com`. */
  apiUrl: string;
  /** The Eventuras site the event links go to, e.g. `https://kurs.example.com`. */
  siteUrl: string;
  /** Sent with every request; the API lists that organisation's events. */
  organizationId?: number;
  /** Your own `fetch`, e.g. one with caching. */
  fetch?: typeof fetch;
  /** Give up on a request after this long. Default: 10 000. */
  timeoutMs?: number;
}
