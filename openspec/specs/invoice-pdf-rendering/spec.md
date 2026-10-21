# invoice-pdf-rendering Specification

## Purpose

Guarantees that a given invoice produces the same PDF wherever it is rendered, in the user's browser or on a server, so the free app, the dashboard and the API all deliver identical documents.

## Requirements

### Requirement: Same PDF in browser and on server

Rendering the same valid invoice data SHALL produce PDFs with the same text content, layout and fonts, whether the PDF is rendered in the browser or on a Node server.

#### Scenario: Default template renders identically

- **WHEN** the same invoice data using the default template is rendered in the browser and on the server
- **THEN** both PDFs contain the same extracted text in the same order and look the same when rasterized

#### Scenario: Stripe template renders on the server

- **WHEN** invoice data with the Stripe template selected is rendered on the server
- **THEN** the PDF uses the Stripe template layout and its fonts, not the default template

#### Scenario: Accented languages keep every character

- **WHEN** an invoice in a language with accented labels (for example Portuguese or Polish) is rendered on the server after another accented invoice in the same process
- **THEN** every label in the PDF keeps its first character (for example "Cobrar de", not "obrar de")

### Requirement: Template follows invoice data

The template used for a PDF SHALL be the one named in the invoice data, in every rendering environment.

#### Scenario: Template switch on the server

- **WHEN** two invoices that differ only in their selected template are rendered on the server
- **THEN** each PDF uses the template its data selected

### Requirement: Fonts never load over the network

Rendering a PDF SHALL NOT fetch fonts from any host other than the origin serving the app (in the browser) or the local filesystem (on the server).

#### Scenario: Server render without network access

- **WHEN** a PDF is rendered on the server with outbound network access blocked
- **THEN** the render succeeds and the PDF embeds the template's fonts

#### Scenario: Browser render does not call the static host

- **WHEN** the free app renders a PDF preview
- **THEN** no request is made to `static.easyinvoicepdf.com`, and fonts load from the app's own origin

### Requirement: Free app output is unchanged

Moving the rendering engine into a shared package SHALL NOT change any PDF the free app produces.

#### Scenario: Existing PDF snapshots still match

- **WHEN** the existing PDF snapshot e2e tests run after the move
- **THEN** every snapshot matches without being regenerated
