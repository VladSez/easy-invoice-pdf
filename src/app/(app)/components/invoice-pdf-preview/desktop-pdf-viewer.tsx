"use client";

import { useInvoicePdfInstance } from "@/app/(app)/contexts/invoice-pdf-instance-context";
import { BUG_REPORT_URL } from "@/config";

export function DesktopInvoicePDFViewer() {
  const { url, error } = useInvoicePdfInstance();

  if (error) {
    return (
      <div className="flex h-[580px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
        <div className="text-center">
          <p className="text-red-600">Error generating PDF preview</p>
          <p className="mx-6 mt-2 max-w-xl text-balance text-sm text-gray-600">
            Something went wrong.
            <br /> Please try refreshing the page or using the{" "}
            <span className="font-bold">Chrome</span> browser. If the issue
            persists, please fill a bug report{" "}
            <a
              href={BUG_REPORT_URL}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              here.
            </a>
          </p>
        </div>
      </div>
    );
  }

  // This is what react-pdf's own `<PDFViewer>` renders, minus its built-in `usePDF()` call.
  // We render the iframe ourselves so the PDF can come from the single shared instance,
  // see `InvoicePdfInstanceProvider` for why having a second instance here was a problem.
  return (
    <iframe
      src={url ? `${url}#toolbar=1` : undefined}
      width="100%"
      className="mb-4 h-full w-full"
      title="Invoice PDF Viewer"
      data-testid="pdf-preview"
    />
  );
}
