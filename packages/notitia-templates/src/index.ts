// Main exports
export { createNotitiaTemplates, NotitiaTemplates, notitiaTemplates } from './NotitiaTemplates';
// Default templates
export {
  defaultEmailTemplates,
  defaultSmsTemplates,
  defaultTemplates,
  getDefaultTemplate,
  getDefaultTemplateKeys,
  getTemplatesForLocale,
  hasDefaultTemplate,
  localeTemplates,
  templatesEnUS,
  templatesNbNO,
  templatesNnNO,
} from './templates';
// Types
export type {
  BaseTemplateParams,
  Locale,
  NotificationChannel,
  RenderedTemplate,
  RenderOptions,
  Template,
  TemplateIdentifier,
  TemplateRegistry,
  TemplateType,
} from './types';
