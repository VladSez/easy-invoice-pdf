"use client";

import { usePDF } from "@react-pdf/renderer/lib/react-pdf.browser";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";

import type { InvoiceData } from "../schema";
import { InvoicePdfDocument } from "../templates/invoice-pdf-document";

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
  onError,
  children,
}: InvoicePdfInstanceProviderProps) {
  const [instance, updatePdfInstance] = usePDF();

  const { error } = instance;

  // Guards the error report so a failure is only announced once. A ref, not state:
  // nothing in the render output depends on it.
  const errorReportedRef = useRef(false);

  // Keep the identity of the document stable, otherwise every re-render of this provider
  // would regenerate an identical PDF (see the effect below, which is keyed on it).
  const pdfDocument = useMemo(() => {
    return (
      <InvoicePdfDocument
        invoiceData={invoiceData}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    );
  }, [invoiceData, qrCodeDataUrl]);

  useEffect(() => {
    updatePdfInstance(pdfDocument);
  }, [pdfDocument, updatePdfInstance]);

  // Reporting the failure belongs next to the `usePDF()` call that produced it: every
  // consumer reads the same error, so reporting it from one of them would tie the report
  // to whichever consumer happens to be mounted. What "reporting" means (a toast,
  // analytics, Sentry) is the app's business, so it comes in as `onError`.
  useEffect(() => {
    if (!error || errorReportedRef.current) {
      return;
    }

    errorReportedRef.current = true;

    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- `onError` reports the failure (toast, analytics, Sentry), it does not lift state, and `usePDF` only has the error after a render
    onError(error);
  }, [error, onError]);

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

interface InvoicePdfInstanceProviderProps {
  invoiceData: InvoiceData;
  qrCodeDataUrl: string;
  /**
   * Called once when generating the PDF fails, with the error `usePDF` reported. Required,
   * so no page can forget to tell the visitor that the download won't work.
   */
  onError: (error: string) => void;
  children: React.ReactNode;
}
