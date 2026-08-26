"use client";

import { InvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import { StripeInvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import type { InvoiceData } from "@/app/schema";

import { usePDF } from "@react-pdf/renderer/lib/react-pdf.browser";
import { createContext, useContext, useEffect, useMemo } from "react";

/** The state of the single PDF render that every consumer on the page shares */
interface InvoicePdfInstance {
  /** `true` while a new version of the PDF is being generated */
  loading: boolean;
  /** Blob URL of the latest generated PDF (used by the preview iframe and the download link) */
  url: string | null;
  /** The latest generated PDF itself */
  blob: Blob | null;
  error: string | null;
}

const InvoicePdfInstanceContext = createContext<InvoicePdfInstance | undefined>(
  undefined,
);

// Render the appropriate template based on the selected template
const renderTemplate = (invoiceData: InvoiceData, qrCodeDataUrl: string) => {
  switch (invoiceData.template) {
    case "stripe":
      return (
        <StripeInvoicePdfTemplate
          invoiceData={invoiceData}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
    case "default":
    default:
      return (
        <InvoicePdfTemplate
          invoiceData={invoiceData}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
  }
};

/**
 * Generates the invoice PDF once and shares the result with everything that needs it:
 * the desktop preview, the mobile preview and the "Download PDF" button.
 *
 * `@react-pdf/renderer` keeps its `change` listeners in a module level registry, which means
 * every `usePDF()` / `<PDFViewer>` / `<BlobProvider>` on the page is notified whenever *any*
 * of the others commits. While the preview and the download button each owned an instance,
 * a single invoice edit made both of them render the very same PDF twice - and the preview
 * iframe visibly flickered as its blob URL was swapped for an identical one. Sharing one
 * instance removes the flicker and halves the rendering work.
 */
export function InvoicePdfInstanceProvider({
  invoiceData,
  qrCodeDataUrl,
  children,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl: string;
  children: React.ReactNode;
}) {
  const [instance, updatePdfInstance] = usePDF();

  // Keep the identity of the document stable, otherwise every re-render of this provider
  // would regenerate an identical PDF (see the effect below, which is keyed on it).
  const pdfDocument = useMemo(
    () => renderTemplate(invoiceData, qrCodeDataUrl),
    [invoiceData, qrCodeDataUrl],
  );

  useEffect(() => {
    updatePdfInstance(pdfDocument);
  }, [pdfDocument, updatePdfInstance]);

  return (
    <InvoicePdfInstanceContext.Provider value={instance}>
      {children}
    </InvoicePdfInstanceContext.Provider>
  );
}

/**
 * Custom React hook to consume the PDF instance context for invoices.
 *
 * Must be used within an {@link InvoicePdfInstanceProvider}. Throws an error if used outside the provider.
 */
export function useInvoicePdfInstance() {
  const context = useContext(InvoicePdfInstanceContext);

  if (context === undefined) {
    throw new Error(
      "useInvoicePdfInstance must be used within an InvoicePdfInstanceProvider",
    );
  }

  return context;
}
