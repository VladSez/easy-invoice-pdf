import { BlobProvider } from "@react-pdf/renderer/lib/react-pdf.browser";
import { Document, Page, pdfjs } from "react-pdf";
import type { InvoiceData } from "../schema";
import { InvoicePdfTemplate } from "./invoice-pdf-template";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// https://github.com/wojtekmaj/react-pdf/issues/1822#issuecomment-2233334169
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const AndroidPdfViewer = ({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) => {
  // On mobile, we need to use the BlobProvider to generate a PDF preview
  // This is because the PDF viewer is not supported on Android Chrome devices
  // https://github.com/diegomura/react-pdf/issues/714
  return (
    <BlobProvider document={<InvoicePdfTemplate invoiceData={invoiceData} />}>
      {({ url, loading, error }) => {
        if (error) {
          return (
            <div className="flex h-[580px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
              <div className="text-center">
                <p className="text-red-600">Error generating PDF preview</p>
                <p className="mt-2 text-sm text-gray-600">
                  Something went wrong. Please try again or contact support.
                </p>
              </div>
            </div>
          );
        }

        if (loading) {
          return (
            <div className="flex h-full w-full items-center justify-center border border-gray-200 bg-gray-200">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-gray-600">Loading PDF viewer...</p>
              </div>
            </div>
          );
        }

        return (
          <Document
            file={url}
            className="h-[480px] w-[650px] overflow-auto"
            loading={
              <div className="flex h-[480px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <p className="text-gray-600">Loading PDF viewer...</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={1}
              error={"Something went wrong"}
              loading={
                <div className="flex h-[480px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    <p className="text-gray-600">Loading PDF viewer...</p>
                  </div>
                </div>
              }
              height={450}
              width={650}
            />
          </Document>
        );
      }}
    </BlobProvider>
  );
};
