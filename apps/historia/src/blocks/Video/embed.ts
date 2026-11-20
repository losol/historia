/**
 * Videos are embedded from YouTube or Vimeo for now: the block stores the link
 * an author copies from the browser, and this reads it. A European or
 * open-source service, with uploads and closed courses, is meant to follow;
 * see ADR 0012, open question 4. It will be another provider here, not another
 * block.
 */
export type VideoProvider = 'youtube' | 'vimeo';

export type EmbeddedVideo = {
  provider: VideoProvider;
  id: string;
  /** Vimeo's key for a video that is not listed (`vimeo.com/123/abc` or `?h=abc`). */
  hash?: string;
  /** Where to start, in seconds, from `t=` or `start=` in the link. */
  start?: number;
};

export const providerNames: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
};

const youtubeHosts = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const youtubeId = /^[A-Za-z0-9_-]{11}$/;
const numeric = /^\d+$/;
const vimeoHash = /^[0-9a-f]+$/i;

/** "90", "90s", "1m30s", "1h2m3s" as seconds; undefined for anything else, and for 0. */
function seconds(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  if (numeric.test(value)) return Number(value) || undefined;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!match?.[0]) return undefined;
  const [, h = '0', m = '0', s = '0'] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) || undefined;
}

function youtube(url: URL): EmbeddedVideo | null {
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let id: string | null | undefined;
  if (host === 'youtu.be') id = parts[0];
  else if (parts[0] === 'watch') id = url.searchParams.get('v');
  else if (['embed', 'shorts', 'live', 'v'].includes(parts[0] ?? '')) id = parts[1];
  if (!id || !youtubeId.test(id)) return null;

  const start = seconds(url.searchParams.get('t') ?? url.searchParams.get('start'));
  return { provider: 'youtube', id, ...(start ? { start } : {}) };
}

function vimeo(url: URL): EmbeddedVideo | null {
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let at = -1;
  if (host === 'player.vimeo.com') {
    if (parts[0] === 'video') at = 1;
  } else if (numeric.test(parts[0] ?? '')) {
    at = 0; // vimeo.com/123, vimeo.com/123/abc
  } else if (parts[0] === 'channels') {
    at = 2; // vimeo.com/channels/name/123
  } else if (parts[0] === 'groups' && parts[2] === 'videos') {
    at = 3; // vimeo.com/groups/name/videos/123
  }
  const id = parts[at];
  if (at === -1 || !id || !numeric.test(id)) return null;

  const pathHash = parts[at + 1];
  const hash =
    url.searchParams.get('h') ?? (pathHash && vimeoHash.test(pathHash) ? pathHash : undefined);
  const start = seconds(/(?:^|&)t=([0-9hms]+)/.exec(url.hash.slice(1))?.[1]);
  return { provider: 'vimeo', id, ...(hash ? { hash } : {}), ...(start ? { start } : {}) };
}

/** The video a link points to, or null when it is not a YouTube or Vimeo video. */
export function parseVideoUrl(input: string | null | undefined): EmbeddedVideo | null {
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || youtubeHosts.has(host)) return youtube(url);
  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    return vimeo(url);
  }
  return null;
}

/**
 * The player's address, set to start playing: it is only loaded once the
 * reader has clicked play. YouTube from its no-cookie domain and without other
 * channels' suggestions at the end, Vimeo with Do Not Track, which keeps it from
 * tracking the session.
 */
export function embedUrl(video: EmbeddedVideo): string {
  if (video.provider === 'youtube') {
    const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
    if (video.start) params.set('start', String(video.start));
    return `https://www.youtube-nocookie.com/embed/${video.id}?${params}`;
  }

  const params = new URLSearchParams({ autoplay: '1', dnt: '1' });
  if (video.hash) params.set('h', video.hash);
  const time = video.start ? `#t=${video.start}s` : '';
  return `https://player.vimeo.com/video/${video.id}?${params}${time}`;
}
