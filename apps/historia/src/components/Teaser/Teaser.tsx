import type { ElementType, ReactNode } from 'react';
import styles from './Teaser.module.css';

/** `md` is a card in a grid, `lg` the lead story, `row` a line in a compact list. */
export type TeaserVariant = 'md' | 'lg' | 'row';

export type TeaserProps = {
  href: string;
  title: ReactNode;
  /** A kicker above the title: the topic and the date, say. */
  eyebrow?: ReactNode;
  lead?: ReactNode;
  /** The picture, already sized; it is fitted to the teaser's frame. */
  image?: ReactNode;
  variant?: TeaserVariant;
  /** A routing link, e.g. Next's `Link`. Defaults to `<a>`. */
  LinkComponent?: ElementType;
  className?: string;
};

/**
 * One story as a link: picture, eyebrow, title and lead, in the magazine look.
 * Presentational only, so it can move to ratio-ui unchanged.
 */
export function Teaser({
  href,
  title,
  eyebrow,
  lead,
  image,
  variant = 'md',
  LinkComponent = 'a',
  className,
}: TeaserProps) {
  const classes = [styles.teaser, styles[variant], className].filter(Boolean).join(' ');
  return (
    <LinkComponent href={href} className={classes}>
      {image && <div className={styles.frame}>{image}</div>}
      <div className={styles.body}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h3 className={styles.title}>{title}</h3>
        {lead && variant !== 'row' && <p className={styles.lead}>{lead}</p>}
      </div>
    </LinkComponent>
  );
}
