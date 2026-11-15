import type { ReactNode } from 'react';

const SOFT_HYPHEN = String.fromCodePoint(0xad);

/**
 * A title for ratio-ui's `display` type, with its last part in an `<em>` for the
 * accent italic: the last word, or what follows the last soft hyphen of a single
 * long word, where the word then breaks.
 */
export function accentuate(title: string): ReactNode {
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

/**
 * The `--hero-display-size` that lets the longest unbreakable part of the title sit
 * on one line: a share of the viewport, capped by the hero's own column.
 */
export function displaySize(title: string): string {
  const longest = Math.max(
    ...title
      .split(/\s+|(?<=-)/)
      .flatMap((part) => part.split(SOFT_HYPHEN))
      .map((part) => part.length),
    1,
  );
  const vw = Math.min(13.6, 187 / longest).toFixed(2);
  const rem = (110 / longest).toFixed(2);
  return `min(${vw}vw, ${rem}rem)`;
}
