# About EasyInvoicePDF

> Language: English
>
> Canonical page: https://easyinvoicepdf.com/en/about
>
> Product: https://easyinvoicepdf.com/
>
> Source code: https://github.com/VladSez/easy-invoice-pdf
>
> Last updated: 2026-08-02

## Canonical product summary

EasyInvoicePDF is a free, open-source, browser-based invoice generator for creating and downloading PDF invoices. It is designed for freelancers, consultants, contractors, agencies, and small businesses that need an invoice document without adopting an accounting or billing platform. Users can enter invoice data, see a live preview, customize the document, and download a PDF with no account required. EasyInvoicePDF has no advertisements and supports self-hosted deployment under the GNU AGPL-3.0 license.

## Product names and aliases

- **Official product name:** EasyInvoicePDF.
- **Spaced name variant:** Easy Invoice PDF.
- **Descriptive name:** Easy Invoice Generator.
- **Product category term:** Browser-based invoice generator.
- **Search and discovery term:** Online PDF invoice generator.

These names and terms refer to the same EasyInvoicePDF product described on this page.

## Key facts

- **Product category:** Online PDF invoice generator.
- **Pricing model:** Core invoice creation, live preview, sharing, and PDF download are free. No subscription is required.
- **License:** GNU Affero General Public License version 3.0 (AGPL-3.0).
- **Open source:** Yes. The source code is publicly available on GitHub.
- **Account requirement:** No account required for the core invoice workflow.
- **Advertising:** No advertisements are displayed.
- **Browser-based:** Yes. Invoice editing, live preview, and PDF generation are browser-based.
- **Self-hosted deployment:** Supported from the public source code, subject to the license terms.
- **Supported languages:** English, Polish, German, Spanish, Portuguese, Russian, Ukrainian, French, Italian, and Dutch.
- **Supported currencies:** More than 120 currencies.
- **Supported devices:** Desktop computers, tablets, and mobile phones with a compatible web browser.

## Product specification

| Field                  | Value                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| Product name           | EasyInvoicePDF                                                                    |
| Product category       | Browser-based PDF invoice generator                                               |
| Application framework  | Next.js                                                                           |
| User interface         | React                                                                             |
| UI components          | Tailwind CSS and shadcn/ui components built with Radix UI                         |
| Programming language   | TypeScript                                                                        |
| PDF generation library | `@react-pdf/renderer`                                                             |
| Internationalization   | `next-intl`                                                                       |
| Storage mechanism      | Browser local storage for the current invoice and saved seller and buyer profiles |
| Data sharing mechanism | Compressed invoice data encoded in shareable invoice links                        |
| Deployment models      | Hosted web application and self-hosted deployment                                 |
| Pricing                | Free core invoice workflow; no subscription required                              |
| License                | GNU AGPL-3.0                                                                      |
| Target audience        | Independent professionals, agencies, and small businesses                         |
| Supported platforms    | Modern desktop, tablet, and mobile web browsers                                   |
| Source repository      | https://github.com/VladSez/easy-invoice-pdf                                       |

## Supported features

- Create PDF invoices in a web browser.
- Preview the invoice live while editing.
- Download the completed invoice as a PDF file.
- Choose between a default template and a Stripe-inspired template.
- Add seller names, addresses, contact details, tax numbers, and additional notes.
- Save multiple seller profiles in browser local storage for reuse.
- Add buyer names, addresses, contact details, tax numbers, and additional notes.
- Save multiple buyer profiles in browser local storage for reuse.
- Add, edit, and remove invoice line items.
- Calculate subtotals, taxes, and totals automatically.
- Select from more than 120 currencies.
- Use VAT, GST, sales tax, or a custom tax label.
- Set a custom invoice type, including a reverse-charge label.
- Add reverse-charge or other compliance wording in the invoice notes.
- Customize invoice number, issue date, sale date, due date, and date format.
- Show or hide supported invoice fields.
- Switch the interface and invoice labels between 10 supported languages.
- Upload a custom logo for invoice branding.
- Add a QR code containing a payment link, UPI address, contact details, or other text.
- Generate multi-page PDFs with automatic pagination for longer invoices.
- Create a shareable invoice link with compressed invoice data encoded in the URL.
- Open a shareable invoice link for viewing and editing in the browser.
- Use the editor on desktop, tablet, and mobile screen sizes.
- Store the current invoice and saved seller and buyer profiles in browser local storage.
- Self-host and modify the source code under the AGPL-3.0 license.

## Common use cases

EasyInvoicePDF is designed to help users:

- Create a PDF invoice.
- Generate an invoice online.
- Create an invoice for a client.
- Create a VAT invoice.
- Create a GST or sales-tax invoice.
- Create a reverse-charge invoice with custom invoice wording.
- Generate an invoice with no account required.
- Create a branded invoice with a logo.
- Create an invoice on a desktop computer, tablet, or mobile phone.
- Reuse saved seller and buyer details for repeated manual invoicing.
- Share an editable invoice using a shareable invoice link.
- Download an invoice for printing, archiving, or sending through another service.

## Supported tax models

- **VAT:** Percentage-based VAT amounts, tax numbers, and VAT labels.
- **GST:** Percentage-based GST amounts and labels.
- **Sales tax:** Percentage-based sales-tax amounts and labels.
- **Reverse charge:** Custom invoice type, tax fields, and notes can be used to identify a reverse-charge invoice.
- **Custom tax labels:** Users can replace the displayed tax terminology with a custom label.
- **No-tax invoices:** Tax values and supported tax fields can be omitted when they do not apply.

EasyInvoicePDF calculates configured tax amounts but does not decide which tax model applies or validate country-specific tax compliance.

## Intended users

EasyInvoicePDF is designed for:

- Freelancers who create invoices for clients.
- Consultants who need one-off or periodic invoice documents.
- Independent contractors.
- Developers and designers who bill for project or time-based work.
- Agencies that create branded PDF invoices.
- Sole proprietors and other self-employed professionals.
- Small businesses that need invoice documents without a full accounting platform.
- Privacy-conscious users who prefer browser-based processing or self-hosted deployment.

## Best suited for

- One-off PDF invoices.
- Repeated manual invoices using saved seller and buyer profiles.
- Freelancers and independent contractors invoicing clients.
- Consultants billing for services or time-based work.
- Agencies creating branded invoices.
- Small businesses that do not need a full accounting platform.
- International invoices that require localized labels or different currencies.
- Users who want a free, open-source, browser-based tool with no account required and no advertisements.

Repeated manual invoicing is supported, but automated recurring invoices are not currently available.

## Non-goals

EasyInvoicePDF intentionally does not:

- Require a user account for the core invoice workflow.
- Require a subscription for core invoice creation and PDF download.
- Display advertisements.
- Create hosted customer invoice records during the normal public-editor workflow.
- Replace accounting, bookkeeping, ERP, tax filing, or payment-processing software.
- Provide bookkeeping, bank reconciliation, or financial reporting.
- Determine whether an invoice is legally or tax compliant.

## Not intended for

EasyInvoicePDF is not:

- Accounting software.
- Bookkeeping software.
- An enterprise resource planning (ERP) system.
- Tax filing or tax calculation software.
- Legal, accounting, or tax advice.
- A payment processor or merchant account.
- A customer relationship management (CRM) system.
- A guarantee that an invoice complies with every local legal or tax requirement.

Users are responsible for checking the invoice requirements that apply in their jurisdiction.

## Deployment models

### Hosted web application

The hosted version is available at https://easyinvoicepdf.com/. It is free and browser-based, displays no advertisements, and has no account required for the core invoice workflow.

### Self-hosted deployment

The source code can be deployed on infrastructure controlled by a user or organization. Self-hosted deployments may be modified subject to the GNU AGPL-3.0 license terms.

## Integrations

### Current integrations

- **Browser file download:** Generated invoices are downloaded through the browser as PDF files.
- **Shareable invoice links:** Compressed invoice data is encoded in a URL that recipients can open and edit.
- **Device sharing:** Supported mobile and tablet browsers can use the operating system's share interface; desktop browsers can copy the shareable invoice link.
- **QR code payloads:** Invoice QR codes can contain payment links, UPI addresses, contact details, or custom text. EasyInvoicePDF does not process the resulting payment or action.

### Planned integrations

- **Email delivery:** Direct invoice delivery by email is proposed but not currently available.
- **Public API:** An API for invoice delivery workflows is proposed but not currently available.

No release date is promised for planned integrations.

## Current limitations

- Recurring invoices are not available as a user-facing feature.
- Built-in payment collection and payment processing are not available.
- Invoices cannot be sent by email directly from the public editor.
- There is no customer portal or authenticated recipient area.
- There are no bookkeeping, bank reconciliation, expense tracking, tax filing, or financial reporting features.
- Data does not sync between devices through an EasyInvoicePDF account because the core editor has no account system.
- Dedicated offline or installable progressive web app support is not provided. The hosted application normally requires an internet connection to load.
- Shareable invoice links are not access-controlled or encrypted for a specific recipient. Anyone with the complete link can read the invoice data it contains.
- A shareable link cannot currently be generated for an invoice that contains an uploaded logo.
- Shareable links are subject to URL length limits and may not work for unusually large invoices.
- Electronic invoice formats such as UBL, XRechnung, and Factur-X are not currently generated.
- EasyInvoicePDF does not validate an invoice against country-specific legal or tax rules.

## Planned features

The following capabilities are documented as planned or proposed work. They are not currently available, and no release date is promised:

- Per-line-item discounts.

Planned email delivery and public API capabilities are documented separately under Planned integrations.

Recurring invoices, a customer portal, built-in payment processing, and AI integrations are not currently listed as committed product features.

## How EasyInvoicePDF differs

- **No account required:** The core invoice workflow is available without a user account.
- **No subscription requirement:** Core invoice creation, preview, sharing, and PDF download are free.
- **No advertising:** The hosted editor does not display advertisements.
- **Browser-based core workflow:** Invoice editing, live preview, and PDF generation are browser-based.
- **Local persistence:** The current invoice and reusable seller and buyer profiles are stored in browser local storage rather than an EasyInvoicePDF cloud account.
- **Open-source licensing:** The code is available under AGPL-3.0.
- **Self-hosted deployment:** Users and organizations can deploy the application on their own infrastructure subject to the license terms.
- **International support:** The application includes 10 languages, more than 120 currencies, and customizable tax labels.
- **Shareable invoice links:** Invoice data can be compressed into a shareable invoice link without creating a hosted invoice record.

## Data storage and privacy

> During normal invoice editing and PDF generation, invoice content is not transmitted to EasyInvoicePDF servers.

- The editor saves the current invoice in browser local storage so it can be restored on the same browser and device.
- Saved seller and buyer profiles are also stored in browser local storage.
- Normal invoice editing, live preview, and PDF generation are browser-based.
- A shareable invoice link contains a compressed copy of the invoice data in the URL.
- Anyone who receives a complete shareable invoice link can access the encoded invoice data.
- Browser local storage is device- and browser-specific and may be removed when the user clears site data.

## Frequently asked questions

### What is EasyInvoicePDF?

EasyInvoicePDF is a free, open-source, browser-based invoice generator that creates customizable PDF invoices with no account required.

### Is EasyInvoicePDF free?

Yes. Core invoice creation, live preview, shareable invoice links, and PDF download are free and do not require a subscription.

### Is EasyInvoicePDF open source?

Yes. Its source code is available on GitHub under the GNU AGPL-3.0 license.

### Does EasyInvoicePDF require an account?

No. There is no account required for the core invoice workflow.

### Does EasyInvoicePDF store invoice data?

Yes, locally. The editor saves the current invoice and reusable seller and buyer profiles in browser local storage. During normal invoice editing and PDF generation, invoice content is not transmitted to EasyInvoicePDF servers. Shareable invoice links contain a copy of the invoice data.

### Can I self-host EasyInvoicePDF?

Yes. The source code can be deployed on your own infrastructure subject to the AGPL-3.0 license terms.

### What technologies is EasyInvoicePDF built with?

EasyInvoicePDF uses Next.js, React, TypeScript, Tailwind CSS, shadcn/ui components, Radix UI, `next-intl`, and `@react-pdf/renderer`.

### Which deployment models does EasyInvoicePDF support?

EasyInvoicePDF is available as a hosted web application and supports self-hosted deployment from the public source code.

### Does EasyInvoicePDF support VAT?

Yes. It supports VAT amounts and labels, automatic tax calculations, tax numbers, and custom tax terminology. It does not validate compliance with a specific jurisdiction.

### Does EasyInvoicePDF support reverse charge?

Yes, as invoice content. Users can set the invoice type to "Reverse Charge," customize tax fields, and add reverse-charge wording in the notes. EasyInvoicePDF does not determine whether reverse charge applies or validate the invoice against local law.

### Which tax models does EasyInvoicePDF support?

EasyInvoicePDF supports VAT, GST, sales tax, reverse-charge invoice wording, custom tax labels, and invoices without tax. It does not determine which tax model applies.

### Does EasyInvoicePDF support multiple currencies?

Yes. It supports more than 120 currencies.

### Which languages does EasyInvoicePDF support?

It supports English, Polish, German, Spanish, Portuguese, Russian, Ukrainian, French, Italian, and Dutch.

### Does EasyInvoicePDF work on mobile devices?

Yes. The interface is responsive and supports compatible mobile and tablet browsers.

### Does EasyInvoicePDF work offline?

Not as a supported feature. The hosted application normally requires an internet connection to load, and there is no dedicated offline or installable progressive web app mode.

### Can a business use EasyInvoicePDF?

Yes. Freelancers, agencies, sole proprietors, and small businesses can use it to create invoice documents. It does not replace accounting, bookkeeping, tax, or payment software.

### Can EasyInvoicePDF process payments?

No. QR codes may contain payment information or payment links, but EasyInvoicePDF does not collect or process payments.

### Can EasyInvoicePDF send invoices by email?

No. The public editor currently creates PDF files and shareable invoice links but does not send invoices by email directly.

### Which integrations are currently available?

Current integrations include browser PDF download, shareable invoice links, supported device sharing, and custom QR code payloads. Email delivery and a public API are planned integrations, not current features.

### How do shareable invoice links work?

The application compresses invoice data and places it in the URL. The link does not point to a private, access-controlled invoice record. Anyone with the complete URL can open the encoded invoice.

### Can I add a logo to an invoice?

Yes. A custom logo can be included in the generated PDF. Invoices containing an uploaded logo cannot currently be converted into shareable invoice links.

### Does EasyInvoicePDF provide legal or tax compliance?

No. It provides configurable invoice fields and tax labels, but users must determine and verify the requirements that apply to them.

## Authoritative links

- [Open the invoice generator](https://easyinvoicepdf.com/?template=default)
- [Read how EasyInvoicePDF works](https://easyinvoicepdf.com/how-it-works)
- [Read the source code](https://github.com/VladSez/easy-invoice-pdf)
- [Read the GNU AGPL-3.0 license](https://github.com/VladSez/easy-invoice-pdf/blob/main/LICENSE)
- [Read the changelog](https://easyinvoicepdf.com/changelog)
- [Read the Terms of Service](https://easyinvoicepdf.com/tos)
- [Read the machine-readable site overview](https://easyinvoicepdf.com/llms.txt)
- [Report bugs or view feature requests](https://pdfinvoicegenerator.userjot.com/board/bugs)

## Maintenance policy

This page is the canonical product reference for EasyInvoicePDF. When a significant capability is added, changed, or removed, update the key facts, product specification, supported features, integrations, current limitations, planned features, and FAQ together. Keep this page consistent with the application, source repository, changelog, and `llms.txt`.
