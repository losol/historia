---
'@eventuras/historia': patch
---

Sentry SDK 11. The SDK dropped the `sendDefaultPii` switch and now collects everything unless told otherwise, so `SENTRY_SEND_DEFAULT_PII` keeps its meaning by turning the new `dataCollection` options off when it is unset: no user info, cookies, headers, query strings, request bodies, stack frame variables or database queries leave the server. With it set, the SDK's defaults apply.
