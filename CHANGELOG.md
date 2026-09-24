# Changelog

## [1.0.5] - 2026-09-24

### Added

- Number Format setting: choose how amounts are grouped and punctuated in the PDF, independently of the invoice language, including a locale-neutral **International** format (`321 200.00`). Each option previews the invoice's own total in the selected template's style
- "Keep format when language changes" switch, which pins the number format across language switches
- Brazilian Portuguese (`pt-BR`) as a PDF language, with `CNPJ/CPF` and `Imposto` labels and amounts in words on the short scale (`um bilhão`). The site itself stays translated into European Portuguese only: invoice PDF languages (`SUPPORTED_INVOICE_PDF_LANGUAGES`) and site locales (`SUPPORTED_I18N_LOCALES`) are now separate lists
- `WrappableAmount` PDF component: amounts too wide for their cell wrap at a thousands boundary instead of overflowing into the next column, in both templates
- "How to customize tax" video in the "How it works" guide

### Changed

- The default template now punctuates amounts in the invoice language by default (`321,200.00` in English, `321.200,00` in German) instead of always printing `321 200.00`. This includes invoices saved or shared before this release, which may re-download with different punctuation; picking **International** restores the old output
- Four-digit amounts are grouped in Polish, Spanish and Italian (`8 111,00` rather than `8111,00`), via `useGrouping: "always"`
- The default template's footer writes the total like the rest of the invoice, with the ISO currency code rather than a localized symbol
- Language pickers name the region for Portuguese: "Portuguese (Portugal)" and "Portuguese (Brazil)"
- Clearer Stripe-template "due" and "amount due" wording in German, Spanish, French, Italian and Portuguese
- Wider quantity column in the Stripe template, so four- and five-digit quantities stay on one line
- Seller and buyer visibility switches are now named by their visible labels instead of separate `aria-label`s

### Fixed

- French amounts in the default template's footer printed `/` in place of the thousands separator (`321/200,00 €`): U+202F is now mapped to a no-break space the PDF fonts cover
- The amount in words no longer leaves `00/100` alone on the next line
- Hydration mismatch on the footer copyright year when the build year and the visitor's year differ

## [1.0.4] - 2026-09-04

### Added

- Redesigned mobile tabs: a pill-shaped track with a single indicator that slides between the invoice form and the preview
- Service period fields in the invoice form
- Terms of Service and founder pages, SEO landing pages, and Markdown versions of key pages
- Welcome popup and a changelog update popup
- Monthly recurring invoice as a Trigger.dev scheduled task

### Changed

- The invoice PDF is rendered once and shared by the desktop preview, the mobile viewer and the download button, removing flicker and duplicate renders
- Dates in the form's helper texts and the out-of-date banner use the invoice's own language and date format, matching the PDF
- The out-of-date dates banner also detects a stale month in the invoice number
- Upgraded to Next.js 15, React 19 and Sentry 10
- Switched linting and formatting to oxlint and oxfmt, and expanded unit and end-to-end test coverage
- Hardened GitHub Actions workflows with zizmor static analysis

### Fixed

- PDFs intermittently dropped the first one or two characters of labels (for example `Fatura` → `atura`) after switching template and language in quick succession
- Text typed just before switching mobile tabs was lost; both panels now stay mounted once opened
- The app crashed in iOS in-app webviews that expose `localStorage` as `null`, and in Safari with "Block all cookies" enabled
- The preview rendered the PDF twice when switching between the default and Stripe templates

## [1.0.3] - 2026-03-29

### Added

- Email visibility toggle for seller and buyer sections — control whether the email address appears in the generated PDF
- `ConfirmDiscardDialog` component to warn users about unsaved changes when closing the buyer/seller dialogs (replaces native `window.confirm`)
- `useConfirmDiscard` reusable hook for managing discard confirmation state across buyer and seller dialogs
- Knip CI workflow for automated dead-code and unused-dependency detection
- `update-github-actions` script in `package.json` to streamline GitHub Actions version updates
- Unit tests for the `generate-invoice` API route and core logic (`generate-invoice.ts`, `route.tsx`)

### Changed

- Refactored `generate-invoice` API route: extracted core business logic into a standalone `generate-invoice.ts` module using a dependency-injection pattern for improved testability
- Reworked seller and buyer information form sections with improved layout, locked-state banners, and cleaner field grouping
- Buyer and seller dialogs now reset form values and pre-fill switch to their defaults when closed
- Buyer and seller names are trimmed of whitespace before saving; whitespace-padded duplicates are rejected
- Invalid localStorage entries for buyers and sellers are now validated and silently dropped instead of causing errors
- Out-of-Date dates helper improved with more accurate state detection
- Error message component layout and copy updated for better readability
- Vitest config updated with JSX support (`esbuild.jsx: "automatic"`) to enable unit-testing JSX components
- Restructured buyer and seller dialog components into dedicated feature directories under `sections/components/buyer` and `sections/components/seller`
- GitHub Actions workflows updated to latest action versions; failure handling added to all CI jobs
- Auto-scroll the invoice form on mobile when switching between tabs

### Fixed

- Pre-fill switch in buyer/seller dialogs no longer retains its state after the dialog is closed and reopened
- Rate limit exceeded log upgraded from `console.log` to `console.error` for correct severity
- Loading placeholder display fixed when switching invoice tabs on mobile

## [1.0.2] - 2026-03-10

### Added

- QR code generation for invoices with customizable descriptions and visibility toggles, supported in both default and Stripe templates
- Logo upload for the default invoice template (previously available only in the Stripe template)
- Searchable currency combobox with grouped categories, replacing the native dropdown for faster selection
- Improved multi-page PDF support with automatic pagination and page breaks

### Changed

- Increased QR code size and improved rendering quality for better scannability
- Enhanced invoice template text color and visuals for improved readability
- Reorganized Stripe payment link input position in the form for better flow
- Improved user feedback during invoice item deletion with better toast notification handling
- Enhanced error handling to reset invoice metadata to defaults on errors
- Clearer error messages when invoice sharing fails
- Tooltip on the "Add invoice item" button for contextual guidance
- Sentry error tracking integration for invoice sharing and GitHub stars features

### Fixed

- i18n issue when generating PDF via the API route
- Delete invoice item flow not working correctly
- Item name field validation too strict (now optional for flexibility)

## [1.0.1] - 2026-01-12

### Added

- Stripe-inspired invoice template with professional styling and layout optimizations
- Dynamic template selection in the invoice form
- Logo upload capability for the Stripe template with validation
- Stripe payment URL field for enhanced invoice functionality
- Customizable Tax/VAT label text (e.g., "VAT", "GST", "Sales Tax")
- Customizable Tax Number label in buyer and seller information sections
- Dynamic tax label updates based on selected invoice language

### Changed

- Landing page cleanup: refined About section and footer for better layout and accessibility
- Call-to-action toasts: added custom, randomized CTA toasts encouraging user support
- Added support for more currencies with improved date handling
- Enhanced tooltips with detailed explanations and improved styling
- Enhanced validation for VAT input to accept both numeric values and specific strings
- Improved user interface messages for clarity regarding VAT input requirements

### Fixed

- Bug with accordion component
- Error message for invoice link generation now includes a refresh suggestion

## [1.0.0] - 2025-11-19

### Added

- Initial release of EasyInvoicePDF — a free, open-source invoice generator
- Live preview: invoice updates in real-time as you make changes
- Shareable links: generate secure links to share invoices directly with clients
- Instant PDF download with one click
- Multi-language support (English, Polish, German, Spanish, Portuguese, Russian, Ukrainian, French, Italian, Dutch)
- Support for all major currencies with automatic locale-based formatting
- European VAT calculation and formatting compliant with EU tax requirements
- Complete seller and buyer information management with save-for-future-use
- Detailed invoice items with descriptions, quantities, and pricing
- Automatic tax calculations and totals
- Invoice numbering, dating, and payment terms
- No sign-up required — fully browser-based with no server-side data storage

[1.0.5]: https://github.com/VladSez/easy-invoice-pdf/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/VladSez/easy-invoice-pdf/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/VladSez/easy-invoice-pdf/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/VladSez/easy-invoice-pdf/compare/EasyInvoicePDF-1.0.1...v1.0.2
[1.0.1]: https://github.com/VladSez/easy-invoice-pdf/compare/EasyInvoicePDF-v1.0.0...EasyInvoicePDF-1.0.1
[1.0.0]: https://github.com/VladSez/easy-invoice-pdf/releases/tag/EasyInvoicePDF-v1.0.0
