---
'@eventuras/historia': patch
---

Saving an article, note or page with a topic that another document already had could be lost without an error: the search index stored the topic's id as the array row's id, the duplicate rolled back the save, and the search plugin only logged it. Search topics no longer reuse the topic's id.
