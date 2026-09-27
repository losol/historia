import type { Field } from 'payload';
import { appearance } from './appearance';
import { footer } from './footer';

/**
 * Settings for how the site looks and behaves, one group per area. A new area is
 * a new file in this folder, added to the list below. The frontend reads them
 * through helpers in `@/lib/site-settings`, which fill in the defaults.
 */
export const siteSettings: Field = {
  name: 'siteSettings',
  label: 'Site Settings',
  type: 'group',
  fields: [appearance, footer],
};
