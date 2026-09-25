/**
 * Colours for the email templates, taken from the default theme of @eventuras/ratio-ui
 * (src/tokens/theme.css) so emails match the web app.
 *
 * They are hex because email clients support neither oklch() nor CSS variables, so the
 * ratio-ui scales are converted by hand. Update them together with ratio-ui.
 *
 * Text/background pairs are chosen for WCAG AA contrast; where ratio-ui has a lighter
 * "solid" token that does not reach 4.5:1 against white text, the darker one is used.
 */
export const emailColors = {
  /** --surface: behind the email card */
  pageBackground: '#f0ece4',
  /** --card: the email card itself */
  cardBackground: '#fcfaf4',
  /** secondary-200: boxes, table headers and the footer inside the card */
  panelBackground: '#f6f2ea',
  /** secondary-300: dividers and box borders */
  border: '#eee6d7',

  /** --text (neutral-900) */
  text: '#171717',
  /** --text-subtle (neutral-600): labels, secondary copy, footer; 7:1 on panels */
  textMuted: '#525252',

  /** --primary (primary-600): header, accents, totals; 5.4:1 with white text */
  primary: '#29728d',
  /** --text-on-primary (secondary-100) */
  onPrimary: '#fbfaf7',

  /** --success-text: shipped header and tracking button. --success-solid (#2e9a62) is only 3.6:1 with white text; this is 6.5:1 */
  success: '#1f6b46',
  /** success-800: hover for the tracking button */
  successStrong: '#166534',
  /** --success-bg */
  successBackground: '#eaf7f0',

  /** --warning-solid: accent border on notice boxes */
  warning: '#d97706',
  /** --warning-bg */
  warningBackground: '#fff6de',
  /** --warning-text: 6.3:1 on --warning-bg */
  warningText: '#8a4b05',

  /** --error-solid: alert borders */
  error: '#d64545',
  /** --error-text: alert banner background; --error-solid is 4.4:1 with white text, this is 8.4:1 */
  errorStrong: '#8e2a2a',
} as const;
