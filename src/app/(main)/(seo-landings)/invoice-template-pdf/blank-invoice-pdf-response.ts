import { renderBlankInvoicePdf } from "./blank-invoice-pdf";

interface BlankInvoicePdfResponseParams {
  /** Paper size to render. */
  pageSize: Parameters<typeof renderBlankInvoicePdf>[0]["pageSize"];
  /** The name a browser saves the file under; matches the URL's last segment. */
  fileName: string;
}

/**
 * The blank invoice PDF as an HTTP response.
 *
 * `inline` so a click opens it in the browser's PDF viewer, where it can be filled in
 * straight away; the download links on the landing page carry a `download` attribute to
 * save it instead.
 */
export async function blankInvoicePdfResponse({
  pageSize,
  fileName,
}: BlankInvoicePdfResponseParams) {
  const pdf = await renderBlankInvoicePdf({ pageSize });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
