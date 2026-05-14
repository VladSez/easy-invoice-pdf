TODO list

DISCOUNTS FEATURE:

- should be per item based discount, not total based discount
- display discount below each item, if applied (check stripe example image below)
- when discount is applied, in tax column + tax summary table we should show (total amount - discount amount), check stripe example image below
- think about design for default template (check default template example image below)

---

- [ ] when adding invoice item, generate unique id for the item and store in local storage (should be backward compatible with existing invoice items)

- [ ] add unit test for next js api routes (for generate-invoice route)

- [ ] run playwright tests in docker, add local docker UBUNTU setup and re-use docker setup on ci

IMPORTANT:

- [ ] double check all invoice translations and fix them (if needed)
- [ ] we can now try to update to latest Next.js version + react, react-dom, because fix for @react-pdf/renderer which was causing issues during PDF regeneration and toggling on/off of some invoice fields is now available (https://github.com/diegomura/react-pdf/pull/3261)

---

etc:

- [ ] Double check if we need to save to local storage in the page.client.tsx (line: 235)
