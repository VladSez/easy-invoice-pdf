import { blankInvoicePdfResponse } from "../blank-invoice-pdf-response";

/** Rendered once at build time and served as a static file. */
export const dynamic = "force-static";

/** The blank invoice template on A4 paper, linked from `/invoice-template-pdf`. */
export function GET() {
  return blankInvoicePdfResponse({
    pageSize: "A4",
    fileName: "blank-invoice-template-a4.pdf",
  });
}
