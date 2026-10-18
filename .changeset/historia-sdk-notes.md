---
'@eventuras/historia-sdk': minor
---

Notes: `notes.list`, `notes.get` (by slug) and `notes.getById` read a website's notes, the newest first, with their picture, topics and page on the website. A note's text comes as rich text in the SDK's own small shape (paragraphs, headings, quotes, lists; marks, line breaks and links), not the editor's, with links made absolute and only to safe schemes. `toPlainText` gives the text alone.
