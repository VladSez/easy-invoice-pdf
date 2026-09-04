useful stuff:

- https://github.com/karlhorky/playwright-tricks?tab=readme-ov-file#screenshot-comparison-tests-of-pdfs

react-pdf/renderer quirks:

- https://github.com/diegomura/react-pdf/issues/774#issuecomment-560069810 (Preventing other elements from crashing into a fixed footer)
- PDFs used to lose the first character of labels ("Cobrar de" -> "obrar de"), mostly in PT/ES, cleared by a page reload. It is a fontkit bug, not a react-pdf one: rendering an accented (composite) glyph caches its base letter without codePoints, and the font object is shared across every render on the page. Upstream: https://github.com/foliojs/fontkit/issues/154 (open since 2018). Fixed locally by `patches/fontkit@2.0.4.patch` - see `patches/README.md` before touching or upgrading fontkit.

react-pdf quirks (non-desktop pdf viewer):

- https://github.com/wojtekmaj/react-pdf/issues/1824

issues to follow:

- https://github.com/foliojs/fontkit/issues/154 (glyph cache drops codePoints - we carry `patches/fontkit@2.0.4.patch` until this ships)
- https://github.com/microsoft/playwright/issues/13873
- https://github.com/microsoft/playwright/issues/19253
- https://github.com/wojtekmaj/react-pdf/issues/2026

---

To create GIFs for README.md, you can use:

- https://www.freeconvert.com/mov-to-gif (set width to 1200px and Compression to 1)
