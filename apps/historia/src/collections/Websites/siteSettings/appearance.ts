import type { Field } from 'payload';
import {
  colorSchemes,
  defaultAppearance,
  footerStyles,
  themes,
} from '@/lib/site-settings/appearance';

const themeLabels: Record<(typeof themes)[number], string> = {
  default: 'Default',
  bureau: 'Bureau',
  ink: 'Ink',
};

const colorSchemeLabels: Record<(typeof colorSchemes)[number], string> = {
  light: 'Light',
  dark: 'Dark',
  both: 'Both (follows the visitor, who can switch)',
};

const footerStyleLabels: Record<(typeof footerStyles)[number], string> = {
  classic: 'Classic: site title and publisher',
  display: 'Display: a dark block with the site title very large',
};

export const appearance: Field = {
  name: 'appearance',
  label: 'Appearance',
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'theme',
          label: 'Theme',
          type: 'select',
          defaultValue: defaultAppearance.theme,
          options: themes.map((value) => ({ label: themeLabels[value], value })),
          admin: {
            width: '50%',
            description: 'The ratio-ui theme: colors, fonts and shapes.',
          },
        },
        {
          name: 'colorScheme',
          label: 'Color scheme',
          type: 'select',
          defaultValue: defaultAppearance.colorScheme,
          options: colorSchemes.map((value) => ({ label: colorSchemeLabels[value], value })),
          admin: {
            width: '50%',
            description: 'Light, dark, or both with a toggle for the visitor.',
          },
        },
      ],
    },
    {
      name: 'footer',
      label: 'Footer',
      type: 'select',
      defaultValue: defaultAppearance.footer,
      options: footerStyles.map((value) => ({ label: footerStyleLabels[value], value })),
      admin: {
        description: 'A soft hyphen in the site title breaks it there and sets the rest in italic.',
      },
    },
  ],
};
