TODO list

DISCOUNTS FEATURE:

- should be per item based discount, not total based discount
- display discount below each item, if applied (check stripe example image below)
- when discount is applied, in tax column + tax summary table we should show (total amount - discount amount), check stripe example image below
- think about design for default template (check default template example image below)

example:
![Per-item default template discount example](..wip/discount-invoice-default-example.png)

example:
![Per-item stripe template discount example](..wip/discount-invoice-stripe-example.png)

---

- [ ] when adding invoice item, generate unique id for the item and store in local storage (should be backward compatible with existing invoice items)

- [] on mobile, when switching between tabs, scroll to the last position of the invoice form section for better UX

- [ ] add unit test for next js api routes (for generate-invoice route)

- [ ] run playwright tests in docker, add local docker UBUNTU setup and re-use docker setup on ci

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
