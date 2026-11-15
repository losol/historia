---
"@eventuras/historia": minor
---

A poster front page, built on ratio-ui 2.40.

- Pages: "Top of the page" can be "Poster": the title very large and light on a full-width field of the brand colour, with a cropped disc and the lead under it (`Hero surface="primary" disc`, `Hero.Title display`). A soft hyphen in a one-word title breaks it there and sets the second half in italic.
- Archive block: three layouts. "Poster" is the first story on a large card that slides up over the field (`Teaser variant="feature"`); "Numbered" a very large heading over numbered titles (`Section.Title display`, `Teaser variant="numbered"`); "Band" one story on a full-width accent band (`Hero surface="accent"`). "Skip" leaves out the stories a block above already shows.
- Website appearance: "Footer" can be "Display", a dark block with the site title very large (`Footer.Brand display`). "Classic" stays the default.
- The teaser is now ratio-ui's `Teaser`; the local copy is gone.
