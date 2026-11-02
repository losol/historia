---
'@eventuras/historia': patch
---

Only system admins and users with a role on a website can open the admin. Payload let every user in, and a user is easy to become: an OIDC or Vipps login with signup on makes one, and so does a Vipps checkout. Such a user now gets the "not allowed to access the admin panel" page until a system admin adds them to a website. Every site role counts, `member` included, as the read-only reader of a site's content and drafts.

The same rule now holds for preview and MCP. `/next/preview` turns on draft mode, which reads past access control, only for a system admin or a user with a role on the website the host serves; before, any logged-in user with the preview secret could. MCP API keys are created only by users who can open the admin, and a key stops working once its user cannot.
