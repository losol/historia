/** What to tell the customer when lines were removed because they can no longer be bought. */
export function removedNotice(count: number) {
  return count === 1
    ? 'En vare er ikke lenger tilgjengelig og er fjernet fra handlekurven.'
    : `${count} varer er ikke lenger tilgjengelige og er fjernet fra handlekurven.`;
}
