---
'@eventuras/historia': patch
---

Fix images not rendering in the built image. `next.config.js` builds `images.remotePatterns` from `CMS_ALLOWED_ORIGINS` and `NEXT_PUBLIC_CMS_URL`, and Next bakes the result into the build output. Both were declared as Dockerfile `ARG`s — under a comment stating they must be available at build time — but the Docker workflow never passed them. The shipped allowlist was therefore just `localhost`, which `dangerouslyAllowLocalIP` rejects outside development, so every `/_next/image` request for media returned 400.

`ImageMedia` now reduces media URLs that point back at this site to a path. A local path is optimised without consulting `remotePatterns`, so media renders on any tenant domain without rebuilding the image for each one — which matters because the browser's own origin was being prepended to relative URLs, making every image depend on an allowlist keyed to per-site domains. A genuinely foreign host, such as a CDN or storage with Payload's access control disabled, is left absolute and still needs an entry; the match is anchored on a `/` boundary so a lookalike domain is not treated as our own.

The two build args are now passed as well, from repository variables rather than secrets, since a public URL and a domain list are not secret. They are additive: unset, the behaviour is what it is today.
