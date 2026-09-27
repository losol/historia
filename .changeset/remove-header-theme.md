---
"@eventuras/historia": patch
---

Remove `HeaderTheme`, left over from Payload's website template. It set `data-theme="dark"` or `"light"` on the `<header>` on some pages, which ratio-ui's `dark:` utilities read, so an article's header could be dark while the page was light. The header now follows the page's theme and color scheme like everything else.
