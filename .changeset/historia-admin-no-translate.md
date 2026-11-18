---
'@eventuras/historia': patch
---

The admin no longer crashes when Chrome translates it. A new article lost its form as soon as a title was typed, with `Failed to execute 'removeChild'` in the console: translation replaces the page's text with elements of its own, and React fails at its next render. The admin now asks browsers not to translate it, and comes in Norwegian for a browser set to Norwegian, so there is nothing to translate. Each user can still pick English in their account.
