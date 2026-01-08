TODO list

IMPORTANT:

- [ ] double check all invoice translations and fix them
- [ ] we can now try to update to latest Next.js version + react, react-dom, because fix for @react-pdf/renderer which was causing issues during PDF regeneration and toggling on/off of some invoice fields is now available (https://github.com/diegomura/react-pdf/pull/3261)

---

etc:

- [ ] rename "Invoice Type" field to "Invoice Notes" in the invoice form (better name)
- [ ] Double check if we need to save to local storage in the page.client.tsx (line: 235)

Useful stuff:

- https://github.com/karlhorky/playwright-tricks?tab=readme-ov-file#screenshot-comparison-tests-of-pdfs

Issues to follow:

- https://github.com/microsoft/playwright/issues/13873
- https://github.com/microsoft/playwright/issues/19253
