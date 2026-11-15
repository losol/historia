import type { CSSProperties, ReactNode } from 'react';
import styles from './PosterHero.module.css';

const SOFT_HYPHEN = String.fromCodePoint(0xad);

interface PosterHeroProps {
  title?: string | null;
  lead?: string | null;
  /** Leaves room at the bottom for the block below to slide up over the field. */
  overlap?: boolean;
}

/**
 * The title's last part in the accent italic: the last word, or what follows the last
 * soft hyphen of a single long word, where the word then breaks.
 */
function accentuate(title: string): ReactNode {
  const words = title.trim().split(/\s+/);
  if (words.length > 1) {
    return (
      <>
        {words.slice(0, -1).join(' ')} <em>{words.at(-1)}</em>
      </>
    );
  }
  const cut = title.lastIndexOf(SOFT_HYPHEN);
  if (cut === -1) return title;
  return (
    <>
      {title.slice(0, cut + 1)}
      <em>{title.slice(cut + 1)}</em>
    </>
  );
}

/** As large as the longest unbreakable part allows on one line, in vw. */
function titleSize(title: string): string {
  const longest = Math.max(
    ...title
      .split(/\s+|(?<=-)/)
      .flatMap((part) => part.split(SOFT_HYPHEN))
      .map((part) => part.length),
    1,
  );
  return `${Math.min(13.6, 187 / longest).toFixed(2)}vw`;
}

/** A front page's top: the title very large and light on a full-width coloured field. */
export function PosterHero({ title, lead, overlap = false }: Readonly<PosterHeroProps>) {
  if (!title) return null;

  return (
    <section className={overlap ? `${styles.hero} ${styles.overlap}` : styles.hero}>
      <div aria-hidden="true" className={styles.sun} />
      <div aria-hidden="true" className={`${styles.ring} ${styles.ringNear}`} />
      <div aria-hidden="true" className={`${styles.ring} ${styles.ringFar}`} />
      <div className={`${styles.column} ${styles.inner}`}>
        <h1 className={styles.title} style={{ '--poster-size': titleSize(title) } as CSSProperties}>
          {accentuate(title)}
        </h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
    </section>
  );
}
