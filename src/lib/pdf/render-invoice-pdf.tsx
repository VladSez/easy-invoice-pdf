// Server-only renderer import. The browser bundle uses the existing preview.
// eslint-disable-next-line no-restricted-imports
import { Document, Font, Page, renderToBuffer } from "@react-pdf/renderer";

import { PDF_DEFAULT_TEMPLATE_STYLES } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-default-template";
import { InvoiceBody } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-default-template/invoice-body";
import { generateQrCodeDataUrl } from "@/app/(main)/(app)/utils/generate-qr-code-data-url";
import type { InvoiceData } from "@/app/schema";
import { INVOICE_PDF_FONTS } from "@/config";

const fontFamily = "Open Sans";

Font.register({
  family: fontFamily,
  fonts: [
    { src: INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_REGULAR },
    {
      src: INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_700,
      fontWeight: 700,
    },
  ],
});

/** Renders the existing default invoice template in the server PDF runtime. */
function ServerInvoiceTemplate({
  invoiceData,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl: string;
}) {
  const invoiceNumber = `${invoiceData.invoiceNumberObject?.label ?? ""} ${
    invoiceData.invoiceNumberObject?.value ?? ""
  }`.trim();

  return (
    <Document
      title={`${invoiceNumber} | Created with https://easyinvoicepdf.com`}
    >
      <Page size="A4" style={PDF_DEFAULT_TEMPLATE_STYLES.page}>
        <InvoiceBody
          invoiceData={invoiceData}
          styles={PDF_DEFAULT_TEMPLATE_STYLES}
          shouldLocaliseDates={false}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </Page>
    </Document>
  );
}

/** Generates a Buffer containing the current invoice, logo, and optional QR code. */
export async function renderInvoicePdfBuffer({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}): Promise<Buffer> {
  const qrCodeDataUrl =
    invoiceData.qrCodeIsVisible && invoiceData.qrCodeData
      ? await generateQrCodeDataUrl(invoiceData.qrCodeData)
      : "";

  return renderToBuffer(
    <ServerInvoiceTemplate
      invoiceData={invoiceData}
      qrCodeDataUrl={qrCodeDataUrl}
    />,
  );
}
