---
"@eventuras/historia": patch
---

`/api/health` reports the `version` and `revision` (commit SHA) of the running image, so a deploy can check that the new build is the one answering. Both are `null` outside the Docker image.
