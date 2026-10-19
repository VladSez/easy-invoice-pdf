import type { InvoiceData } from "../schema";
import { InvoicePdfTemplate } from "./invoice-pdf-default-template";
import { StripeInvoicePdfTemplate } from "./invoice-pdf-stripe-template";

/**
 * The whole invoice PDF -- `<Document>` and its pages -- in the template the invoice data
 * selects. The one entry point for rendering an invoice, in the browser preview and on the
 * server alike, so both always pick the template the same way.
 */
export function InvoicePdfDocument({
  invoiceData,
  qrCodeDataUrl,
}: InvoicePdfDocumentProps) {
  switch (invoiceData.template) {
    case "stripe":
      return (
        <StripeInvoicePdfTemplate
          invoiceData={invoiceData}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
    // listed explicitly so `switch-exhaustiveness-check` covers the union;
    // `default` also catches anything unexpected at runtime
    // oxlint-disable-next-line unicorn/no-useless-switch-case
    case "default":
    default:
      return (
        <InvoicePdfTemplate
          invoiceData={invoiceData}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
  }
}

interface InvoicePdfDocumentProps {
  invoiceData: InvoiceData;
  /** The payment QR code as a PNG data URL, or an empty string for none. */
  qrCodeDataUrl: string;
}
