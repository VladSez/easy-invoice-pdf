TODO list

- [ ] replace native select for currencies with Combobox (https://ui.shadcn.com/docs/components/radix/combobox) i.e. make it searchable? (also add Groups - Major, EU, Africa, Asia, Latin America, etc.)

IMPORTANT:

- [ ] double check all invoice translations and fix them (if needed)
- [ ] we can now try to update to latest Next.js version + react, react-dom, because fix for @react-pdf/renderer which was causing issues during PDF regeneration and toggling on/off of some invoice fields is now available (https://github.com/diegomura/react-pdf/pull/3261)

---

etc:

- [ ] Double check if we need to save to local storage in the page.client.tsx (line: 235)

useful stuff:

- https://github.com/karlhorky/playwright-tricks?tab=readme-ov-file#screenshot-comparison-tests-of-pdfs

react-pdf/renderer quirks:

- https://github.com/diegomura/react-pdf/issues/774#issuecomment-560069810 (Preventing other elements from crashing into a fixed footer)

react-pdf quirks (non-desktop pdf viewer):

- https://github.com/wojtekmaj/react-pdf/issues/1824

issues to follow:

- https://github.com/microsoft/playwright/issues/13873
- https://github.com/microsoft/playwright/issues/19253
- https://github.com/wojtekmaj/react-pdf/issues/2026

---

To create GIFs for README.md, you can use:

- https://www.freeconvert.com/mov-to-gif (set width to 1200px and Compression to 1)
