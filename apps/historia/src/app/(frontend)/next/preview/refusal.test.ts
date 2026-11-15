import { describe, expect, it } from 'vitest';
import { previewRefusal } from './refusal';

describe('previewRefusal', () => {
  it('answers with the status and the message', async () => {
    const response = previewRefusal(403, 'Sign in to the admin to preview drafts.');
    expect(response.status).toBe(403);
    expect(await response.text()).toContain('<p>Sign in to the admin to preview drafts.</p>');
  });

  // The admin's preview frame is white. Plain text follows the browser's colour
  // scheme, so in dark mode the refusal was white on white and the frame looked empty.
  it('is a page with colours of its own, not plain text', async () => {
    const response = previewRefusal(403, 'No.');
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    const html = await response.text();
    expect(html).toContain('color-scheme: light');
    expect(html).toContain('background: #fff');
    expect(html).toContain('color: #1a1a1a');
  });

  it('is not cached', () => {
    expect(previewRefusal(403, 'No.').headers.get('Cache-Control')).toBe('no-store');
  });
});
