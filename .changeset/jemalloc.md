---
'@eventuras/historia': patch
---

The image runs Node with jemalloc (`LD_PRELOAD`). With glibc's allocator, memory grew with every media upload and was never returned, so a run of ordinary images could get the process OOM-killed; sharp recommends jemalloc on glibc.
