TODO list

- [ ] Rework Seller/Buyer Information sections:

  @src/app/(app)/components/invoice-form/index.tsx:385-424 I want to rework and simplify Seller/Buyer Information sections.

  1. By default (if no sellers/buyer were saved) I want to show a button "New Seller/Buyer" which opens a dialog where you can fill the form
  2. when seller/buyer was saved, we show a native select where you can select a seller/buyer add/edit/delete

  the idea is that we remove the buyer/seller from main UI and only allow to edit via dialog to save space on main UI

  Use cases:

  (new seller/buyer usage scenarios)

  - [] I have no seller/buyer, I see a button "New Seller/Buyer" which opens a dialog where you can fill the form. I can add multiple sellers/buyers.
  - [] I have seller/buyer saved, I see a native select where you can select a seller/buyer add/edit/delete

  (shared invoice usage scenarios)

  - [] I have no seller/buyer, invoice is shared with me, I see a banner saying "Seller/Buyer from shared invoice is not saved in your browser. Save it to reuse in future invoices."
  - [] I have seller/buyer saved, invoice is shared with me, but does not have the same seller/buyer, I see a banner saying "Seller/Buyer from shared invoice is not saved in your browser. Save it to reuse in future invoices.". I'm allowed to change the seller/buyer via select because I already have a saved seller/buyer. Also select is reset to empty string ("") because there is no match.
  - [] I have seller/buyer saved, invoice is shared with me, and has the same seller/buyer, I see a select with the saved seller/buyer option applied if there is a match.

---

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
