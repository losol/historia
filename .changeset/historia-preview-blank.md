---
'@eventuras/historia': patch
---

The admin's live preview opens on a deployment without `PREVIEW_SECRET`. The secret is optional, but a link without it was refused all the same, so the preview never opened there. A refused preview now says why, on a page that can be read: the plain-text answer was white on the white preview frame in dark mode, which looked like an empty frame. The reason is also logged.
