import { describe, expect, it } from 'vitest';
import { embedUrl, parseVideoUrl } from './embed';

describe('parseVideoUrl: YouTube', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=2',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?si=abcdef',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
    '  https://youtu.be/dQw4w9WgXcQ  ',
  ])('reads %s', (url) => {
    expect(parseVideoUrl(url)).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' });
  });

  it('keeps the start time, in seconds or as 1m30s', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=90')?.start).toBe(90);
    expect(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')?.start).toBe(90);
    expect(parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ?start=42')?.start).toBe(42);
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=0')).not.toHaveProperty('start');
  });

  it('refuses a link that is not one video', () => {
    expect(parseVideoUrl('https://www.youtube.com/')).toBeNull();
    expect(parseVideoUrl('https://www.youtube.com/@somechannel')).toBeNull();
    expect(parseVideoUrl('https://www.youtube.com/playlist?list=PL123')).toBeNull();
    expect(parseVideoUrl('https://www.youtube.com/watch?v=short')).toBeNull();
  });
});

describe('parseVideoUrl: Vimeo', () => {
  it.each([
    'https://vimeo.com/76979871',
    'https://www.vimeo.com/76979871',
    'https://player.vimeo.com/video/76979871',
    'https://vimeo.com/channels/staffpicks/76979871',
    'https://vimeo.com/groups/name/videos/76979871',
  ])('reads %s', (url) => {
    expect(parseVideoUrl(url)).toEqual({ provider: 'vimeo', id: '76979871' });
  });

  it('keeps the key of a video that is not listed, from the path or from ?h=', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871/8272103f6e')?.hash).toBe('8272103f6e');
    expect(parseVideoUrl('https://player.vimeo.com/video/76979871?h=8272103f6e')?.hash).toBe(
      '8272103f6e',
    );
  });

  it('keeps the start time from #t=', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871#t=1m5s')?.start).toBe(65);
    expect(parseVideoUrl('https://vimeo.com/76979871#t=30s')?.start).toBe(30);
  });

  it('refuses a link that is not one video', () => {
    expect(parseVideoUrl('https://vimeo.com/showcase/123456')).toBeNull();
    expect(parseVideoUrl('https://vimeo.com/someuser')).toBeNull();
    expect(parseVideoUrl('https://player.vimeo.com/')).toBeNull();
  });
});

describe('parseVideoUrl: anything else', () => {
  it.each([
    null,
    '',
    'not a url',
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'javascript:alert(1)',
    'ftp://vimeo.com/76979871',
  ])('refuses %s', (url) => {
    expect(parseVideoUrl(url)).toBeNull();
  });
});

describe('embedUrl', () => {
  it('plays YouTube from the no-cookie domain', () => {
    expect(embedUrl({ provider: 'youtube', id: 'dQw4w9WgXcQ', start: 90 })).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1&start=90',
    );
  });

  it('plays Vimeo with Do Not Track, its key and its start time', () => {
    expect(embedUrl({ provider: 'vimeo', id: '76979871', hash: 'abc123', start: 65 })).toBe(
      'https://player.vimeo.com/video/76979871?autoplay=1&dnt=1&h=abc123#t=65s',
    );
    expect(embedUrl({ provider: 'vimeo', id: '76979871' })).toBe(
      'https://player.vimeo.com/video/76979871?autoplay=1&dnt=1',
    );
  });
});
