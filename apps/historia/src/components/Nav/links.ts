import type { NavBlock, Page } from '@/payload-types';
import { getPageUrl } from '@/utilities/getPageUrl';

export type NavLink = {
  key: string;
  href: string;
  label: string;
  external: boolean;
  newTab: boolean;
};

/** The links of a navigation setting, flattened and with hrefs for the locale. Separators are left out. */
export function navLinks(navigation: NavBlock[] | null | undefined, locale: string): NavLink[] {
  const links: NavLink[] = [];
  for (const [blockIndex, block] of (navigation ?? []).entries()) {
    for (const [itemIndex, item] of (block.items ?? []).entries()) {
      const key = item.id || `${block.id || blockIndex}-${itemIndex}`;
      if (item.blockType === 'internalLink') {
        const page = typeof item.page === 'object' ? (item.page as Page) : null;
        if (!page?.slug) continue;
        // Nested pages live at their breadcrumb path, top-level ones at their slug.
        const path = page.breadcrumbs?.at(-1)?.url || page.slug;
        links.push({
          key,
          href: getPageUrl(path, locale),
          label: item.text || page.title || page.slug,
          external: false,
          newTab: false,
        });
      } else if (item.blockType === 'externalLink' && item.url) {
        links.push({
          key,
          href: item.url,
          label: item.text,
          external: true,
          newTab: Boolean(item.openInNewTab),
        });
      }
    }
  }
  return links;
}
