import type { CSSProperties } from 'react';
import { Hero } from '@eventuras/ratio-ui/blocks/Hero';
import { accentuate, displaySize } from '@/lib/displayTitle';
import styles from './PosterPage.module.css';

interface PosterHeroProps {
  title?: string | null;
  lead?: string | null;
  /** Leaves room at the bottom for the block below to slide up over the field. */
  overlap?: boolean;
}

/** A front page's top: ratio-ui's primary field, disc and display title. */
export function PosterHero({ title, lead, overlap = false }: Readonly<PosterHeroProps>) {
  if (!title) return null;

  return (
    <Hero
      surface="primary"
      disc
      className={overlap ? `${styles.hero} ${styles.heroOverlap}` : styles.hero}
    >
      <Hero.Main>
        <Hero.Title display style={{ '--hero-display-size': displaySize(title) } as CSSProperties}>
          {accentuate(title)}
        </Hero.Title>
        {lead && <Hero.Lead>{lead}</Hero.Lead>}
      </Hero.Main>
    </Hero>
  );
}
