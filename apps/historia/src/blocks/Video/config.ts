import type { Block } from 'payload';
import { parseVideoUrl } from './embed';

/**
 * A video in a story, embedded from YouTube or Vimeo by its link. The author
 * pastes the address they copy from the browser or the Share button; nothing
 * is uploaded here. On the site the video is loaded only when the reader
 * presses play, so the page itself sends nothing to the video's host.
 *
 * The link is not localized: the video is the same in every language, as the
 * lessons of a course are. A European or open-source service, with uploads and
 * closed courses, is meant to follow (ADR 0012, open question 4) as another
 * kind of source in this block.
 */
export const Video: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: {
    singular: 'Video',
    plural: 'Videos',
  },
  fields: [
    {
      name: 'url',
      label: 'Link to the video',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'https://www.youtube.com/watch?v=… or https://vimeo.com/…',
        description:
          'The address of the video on YouTube or Vimeo, as you copy it from the browser or the Share button. A start time in the link is kept.',
      },
      validate: (value: string | null | undefined): true | string => {
        if (!value) return 'Paste the link to the video.';
        return parseVideoUrl(value)
          ? true
          : 'This is not a link to a video on YouTube or Vimeo. Copy the address of the video itself, not of a channel or a list.';
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description:
          'What the video shows, in a few words. Shown before it is played, and read by screen readers.',
      },
    },
  ],
};
