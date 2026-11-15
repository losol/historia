/**
 * The answer when a preview cannot be opened, as a page that can be read.
 *
 * It is shown in the admin's live preview frame, which has a white background of
 * its own. A plain-text answer follows the browser's colour scheme, so in dark
 * mode it was white text on that white: the frame looked empty, and nothing said
 * why. Hence HTML with its own colours.
 *
 * `message` is written into the page as it is: pass fixed text, nothing from the
 * request.
 */
export function previewRefusal(status: number, message: string): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Preview unavailable</title>
<style>
html { color-scheme: light; background: #fff; color: #1a1a1a; }
body { margin: 0; padding: 2rem; font: 1rem/1.5 system-ui, sans-serif; }
h1 { margin: 0 0 0.5rem; font-size: 1.25rem; }
p { margin: 0; max-width: 40rem; }
</style>
</head>
<body>
<h1>Preview unavailable</h1>
<p>${message}</p>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
