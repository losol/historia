---
"@eventuras/historia": minor
---

Websites get an Appearance section in their site settings: the ratio-ui theme (Default, Bureau or Ink) and the color scheme (Light, Dark, or Both, which follows the visitor's system setting and shows the light/dark toggle). The server renders them on `<html>` as `data-theme` and `data-color-scheme`, and the visitor's own choice is now stored as `data-color-scheme` under its own key instead of sharing `payload-theme` with the admin panel. Existing websites keep today's look: Default and Both.

Site settings now live in `collections/Websites/siteSettings/`, one file per area, with the frontend helpers in `lib/site-settings/`.
