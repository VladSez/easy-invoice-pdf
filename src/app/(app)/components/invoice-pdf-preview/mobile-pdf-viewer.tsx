"use client";

import type { InvoiceData } from "@/app/schema";
import { BlobProvider } from "@react-pdf/renderer/lib/react-pdf.browser";
import { Document, Page, pdfjs } from "react-pdf";

import { InvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import { StripeInvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-stripe-template";

import { BUG_REPORT_URL } from "@/config";
import * as Sentry from "@sentry/nextjs";
import { useMemo, useState } from "react";

// https://github.com/wojtekmaj/react-pdf/issues/1822#issuecomment-2233334169
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Mobile PDF viewer.
 *
 * We show the different (enhanced) PDF viewer on all mobile devices due to the limitations of the `@react-pdf/renderer` default built-in PDF viewer
 *
 * Issue with the default PDF viewer: https://github.com/diegomura/react-pdf/issues/714
 *
 * **PDF viewer we use on mobile devices:** https://github.com/wojtekmaj/react-pdf
 */
export const MobileInvoicePDFViewer = ({
  invoiceData,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl: string;
}) => {
  const [key, setKey] = useState(0);
  const [numPages, setNumPages] = useState(0);

  const memoizedInvoicePdfTemplate = useMemo(() => {
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
  }, [invoiceData, qrCodeDataUrl]);

  // On mobile, we need to use the 'react-pdf' (https://github.com/wojtekmaj/react-pdf) to generate a PDF preview
  // This is because the PDF viewer is not supported on Android Chrome devices
  // https://github.com/diegomura/react-pdf/issues/714
  return (
    <BlobProvider document={memoizedInvoicePdfTemplate}>
      {({ url, loading, error }) => {
        if (error) {
          return (
            <div className="flex h-[520px] w-[650px] items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
              <div className="text-center">
                <p className="text-red-600">Error generating PDF preview</p>
                <p className="mx-6 mt-2 text-balance text-sm text-gray-600">
                  Something went wrong. Please try refreshing the page or using{" "}
                  <span className="font-bold">Chrome</span> browser. If the
                  issue persists, please fill a bug report{" "}
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

        if (loading || !url) {
          return (
            <div className="flex h-[520px] w-[650px] items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-gray-600">Loading PDF viewer...</p>
              </div>
            </div>
          );
        }

        // https://github.com/wojtekmaj/react-pdf
        return (
          <Document
            // we use a key to force a re-render of the PDF viewer in case of error
            key={key}
            file={url || ""}
            className="h-[520px] w-[650px] overflow-auto border border-slate-100 lg:h-[620px] 2xl:h-[700px]"
            loading={
              <div className="flex h-[520px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <p className="text-gray-600">Loading PDF viewer...</p>
                </div>
              </div>
            }
            onLoadSuccess={({ numPages }) => {
              // to render the correct number of pages in the PDF viewer
              setNumPages(numPages);
            }}
            onLoadError={(error) => {
              console.error(error);

              // Force a re-render of the PDF viewer to try to recover from error
              setKey((prev) => prev + 1);
            }}
            error={
              <div className="flex h-[520px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
                <div className="text-center">
                  <p className="text-balance text-red-600">
                    Error generating PDF preview. Please refresh the page or use
                    a different browser. If the issue persists, please file a{" "}
                    <a
                      href="https://pdfinvoicegenerator.userjot.com/board/bugs?cursor=1&order=top&limit=10"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      bug report
                    </a>
                    .
                  </p>
                </div>
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page-${index + 1}`}
                // we add some space between pages to make it easier to see the page break
                className={
                  index < numPages - 1 ? "border-b-[15px] border-gray-200" : ""
                }
                pageNumber={index + 1}
                error={"Something went wrong"}
                loading={
                  <div className="flex h-[520px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                      <p className="text-gray-600">Loading PDF viewer...</p>
                    </div>
                  </div>
                }
                onLoadError={(error) => {
                  Sentry.captureException(error);
                }}
                height={450}
                width={650}
              />
            ))}
          </Document>
        );
      }}
    </BlobProvider>
  );
};
