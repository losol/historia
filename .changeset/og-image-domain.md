---
'@eventuras/historia': patch
---

Share images (og:image, twitter:image) use the website's own domain, like the canonical URL, instead of NEXT_PUBLIC_CMS_URL, which fell back to localhost where it was not set.
