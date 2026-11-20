import type { VideoBlock as VideoBlockProps } from '@/payload-types';
import { embedUrl, parseVideoUrl, providerNames } from './embed';
import { VideoPlayer } from './Player';

const labels = {
  no: {
    video: 'Video',
    play: 'Spill av video',
    notice: (provider: string) =>
      `Videoen spilles av fra ${provider}. Når du starter den, får ${provider} vite at du ser den.`,
  },
  en: {
    video: 'Video',
    play: 'Play video',
    notice: (provider: string) =>
      `The video plays from ${provider}. When you start it, ${provider} learns that you are watching.`,
  },
};

/** A video from YouTube or Vimeo, loaded when the reader presses play. */
export function VideoBlock({ url, title, locale }: VideoBlockProps & { locale: string }) {
  // Publishing refuses a link this cannot read, but an autosaved draft skips
  // validation and may hold one: a preview leaves it out.
  const video = parseVideoUrl(url);
  if (!video) return null;

  const t = locale === 'no' ? labels.no : labels.en;
  const provider = providerNames[video.provider];

  return (
    <figure>
      <VideoPlayer
        src={embedUrl(video)}
        title={title?.trim() || t.video}
        labels={{ play: t.play, notice: t.notice(provider) }}
      />
    </figure>
  );
}
