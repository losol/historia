---
'@eventuras/historia': patch
---

Preview needs a role on the website. `/next/preview` turns on draft mode, which reads past access control, and it let in any logged-in user with the preview secret; now signing up is open, being logged in says little. It now needs a system admin or a role on the website the host serves, and it refuses a path that leads to another site (`//host`). A person who is logged in without a role on any website is now called a signed-in visitor in the docs, so they are not confused with the `member` site role, the admin's read-only reader. ADR 0001's matrix no longer says the site roles read published content only: they read drafts too. The websites field on users no longer says that leaving it empty gives global access.
