import { Font, renderToBuffer } from "@react-pdf/renderer";

import { registerInvoiceFonts } from "../fonts/invoice-pdf-fonts";
import type { InvoiceData } from "../schema";
import { InvoicePdfDocument } from "../templates/invoice-pdf-document";
import { SERVER_FONT_SOURCES } from "./font-sources";

// The Node build of `@react-pdf/renderer` has its own font store, separate from the browser
// build the templates import their primitives from, so the fonts are registered on it here.
registerInvoiceFonts({ font: Font, fontSources: SERVER_FONT_SOURCES });

/**
 * Renders an invoice to PDF bytes on the server -- the same document, in the same template,
 * that the browser preview shows for the same data.
 */
export function renderInvoicePdfToBuffer({
  invoiceData,
  qrCodeDataUrl = "",
}: RenderInvoicePdfToBufferArgs) {
  return renderToBuffer(
    <InvoicePdfDocument
      invoiceData={invoiceData}
      qrCodeDataUrl={qrCodeDataUrl}
    />,
  );
}

interface RenderInvoicePdfToBufferArgs {
  invoiceData: InvoiceData;
  /** The payment QR code as a PNG data URL. Defaults to none. */
  qrCodeDataUrl?: string;
}
