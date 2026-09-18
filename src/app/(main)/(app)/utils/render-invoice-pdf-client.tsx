"use client";

import { pdf } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import { InvoicePdfTemplate } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-default-template";
import { StripeInvoicePdfTemplate } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import type { InvoiceData } from "@/app/schema";

/** Renders either supported invoice template with the existing browser renderer. */
export function renderInvoicePdfBlob(
  invoiceData: InvoiceData,
  qrCodeDataUrl: string,
): Promise<Blob> {
  const document =
    invoiceData.template === "stripe" ? (
      <StripeInvoicePdfTemplate
        invoiceData={invoiceData}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    ) : (
      <InvoicePdfTemplate
        invoiceData={invoiceData}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    );
  return pdf(document).toBlob();
}

export function getInvoicePdfFilename(invoiceData: InvoiceData): string {
  const number =
    invoiceData.invoiceNumberObject?.value?.replaceAll("/", "-") ||
    dayjs().format("MM-YYYY");
  return `invoice-${invoiceData.language.toUpperCase()}-${number}.pdf`;
}
