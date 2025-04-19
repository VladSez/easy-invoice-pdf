"use client";

import { PDFViewer } from "@react-pdf/renderer/lib/react-pdf.browser";

export function InvoicePDFViewer({ children }: { children: React.ReactNode }) {
  return (
    <PDFViewer
      width="100%"
      className="mb-4 h-full w-full"
      title="Invoice PDF Viewer"
      data-testid="pdf-preview"
    >
      {/* @ts-expect-error PR with fix?: https://github.com/diegomura/react-pdf/pull/2888 */}
      {children}
    </PDFViewer>
  );
}
