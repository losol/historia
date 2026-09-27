---
"@eventuras/historia": patch
---

Image blocks render again when `NEXT_PUBLIC_CMS_URL` is set. Payload then returns absolute media URLs, and the image component put the site's URL in front of them once more (`https://sitehttps://site/api/media/…`), so any page with an image block failed with a 500. In development, cards and other optimized images from `localhost` load again: Next 16 refuses local addresses in the image optimizer, which is now allowed in development only.
