'use client';

import { useId, useState } from 'react';
import styles from './Video.module.css';

export type VideoPlayerProps = {
  /** The player's address; loaded only once the reader presses play. */
  src: string;
  title: string;
  labels: {
    /** "Spill av video", before the title, for screen readers. */
    play: string;
    /** That the video comes from YouTube or Vimeo, and what pressing play sends there. */
    notice: string;
  };
};

/**
 * A video that is not loaded until the reader asks for it. Until then it is a
 * button with the video's title and where it plays from, and the page sends
 * nothing to YouTube or Vimeo: no request, no cookie. Pressing play puts the
 * player in its place, already playing, so it is still one press.
 */
export function VideoPlayer({ src, title, labels }: Readonly<VideoPlayerProps>) {
  const [playing, setPlaying] = useState(false);
  const noticeId = useId();

  if (playing) {
    return (
      <div className={styles.frame}>
        <iframe
          src={src}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.frame} ${styles.facade}`}
      onClick={() => setPlaying(true)}
      aria-label={`${labels.play}: ${title}`}
      aria-describedby={noticeId}
    >
      <span className={styles.play} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
        </svg>
      </span>
      <span className={styles.title}>{title}</span>
      <span id={noticeId} className={styles.notice}>
        {labels.notice}
      </span>
    </button>
  );
}
