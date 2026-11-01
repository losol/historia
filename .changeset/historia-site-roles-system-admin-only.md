---
'@eventuras/historia': patch
---

Only a system admin can add a user to a website or change their site roles. The `tenants` field on users had no field-level access, so a user could join any website as its admin by updating their own document, and a site admin could do the same for the users of their sites.
