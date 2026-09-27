---
"@eventuras/historia": patch
---

Upgrade ratio-ui to 2.26.0. Its named themes are opt-in stylesheets now, so the frontend layout imports `themes/bureau.css` and `themes/ink.css`; without them a website set to Bureau or Ink would fall back to the default look.
