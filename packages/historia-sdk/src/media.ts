import type { HistoriaImage, HistoriaImageSize } from './types';

// What Historia's REST API returns for an uploaded picture, and how the SDK hands it
// on. Shared by the content types that have one (products, notes).

export interface RawSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}
export interface RawMedia extends RawSize {
  title?: string | null;
  sizes?: Record<string, RawSize | null> | null;
}

/** The media fields the SDK asks Historia to populate. */
export const MEDIA_POPULATE = { url: true, title: true, width: true, height: true, sizes: true };

/** A URL Historia gave, made absolute against the website's address; null when there is none. */
export function absolute(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, `${baseUrl}/`).toString();
  } catch {
    return null;
  }
}

export function mapImage(
  media: RawMedia | string | null | undefined,
  baseUrl: string,
): HistoriaImage | null {
  // An id instead of a document means the media was not populated or not readable.
  if (!media || typeof media === 'string') return null;

  const sizes: Record<string, HistoriaImageSize> = {};
  for (const [name, size] of Object.entries(media.sizes ?? {})) {
    const url = absolute(size?.url, baseUrl);
    if (url) sizes[name] = { url, width: size?.width ?? null, height: size?.height ?? null };
  }
  const largest = Object.values(sizes).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  const url = absolute(media.url, baseUrl) ?? largest?.url;
  if (!url) return null;

  return {
    url,
    width: media.url ? (media.width ?? null) : (largest?.width ?? null),
    height: media.url ? (media.height ?? null) : (largest?.height ?? null),
    alt: media.title ?? null,
    sizes,
  };
}
