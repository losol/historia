---
'@eventuras/payload-oidc-auth': patch
---

The `identities` field refuses writes from anyone but the plugin itself: it was read-only in the admin only, so a user who could update their own document could clear or change their identities over the API. The plugin's own writes go through the local API with access overridden, so nothing changes for logins.
