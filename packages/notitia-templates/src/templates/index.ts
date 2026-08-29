import type { Locale, Template, TemplateRegistry } from '../types';
import { defaultEmailTemplates } from './email';
import { getTemplatesForLocale } from './locales';
import { defaultSmsTemplates } from './sms';

/**
 * Combined default templates (en-US for backward compatibility)
 */
export const defaultTemplates: TemplateRegistry = {
  ...defaultEmailTemplates,
  ...defaultSmsTemplates,
};

/**
 * Export individual template collections
 */
export { defaultEmailTemplates } from './email';
/**
 * Export locale-specific templates
 */
export {
  getTemplatesForLocale,
  localeTemplates,
  templatesEnUS,
  templatesNbNO,
  templatesNnNO,
} from './locales';
export { defaultSmsTemplates } from './sms';

/**
 * Get a default template by key
 */
export function getDefaultTemplate(key: string, locale: Locale = 'en-US'): Template | undefined {
  const templates = getTemplatesForLocale(locale);
  return templates[key];
}

/**
 * Check if a default template exists
 */
export function hasDefaultTemplate(key: string, locale: Locale = 'en-US'): boolean {
  const templates = getTemplatesForLocale(locale);
  return key in templates;
}

/**
 * Get all default template keys for a specific locale
 */
export function getDefaultTemplateKeys(locale: Locale = 'en-US'): string[] {
  const templates = getTemplatesForLocale(locale);
  return Object.keys(templates);
}
