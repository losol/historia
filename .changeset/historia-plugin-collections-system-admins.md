---
'@eventuras/historia': patch
---

Forms, form submissions, redirects, imports, exports and the job queue were open to every logged-in user, since their plugins set no access for it and Payload then lets anyone logged in through. With signup on, that is anyone with an OIDC or Vipps account: they could read every form submission, change where a form's emails go, add redirects, and download the exports an admin had made, a users export included. These are not tied to a website, so they are now for system admins only; visitors still read forms and redirects and submit forms. Site admins and editors, who could use them before, no longer can.

MCP API keys are now created only by users who can open the admin, and a key stops working once its user cannot.

A new test builds the config with every plugin and fails if a logged-in user without a role may do more than a visitor, outside their own documents. CI now runs historia's unit tests.
