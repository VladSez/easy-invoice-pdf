import { InvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import { StripeInvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import type { InvoiceData, MobileTabsValues } from "@/app/schema";
import { DEFAULT_MOBILE_TAB, MOBILE_TABS_VALUES } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { AlertCircleIcon, FileTextIcon, PencilIcon } from "lucide-react";
import dynamic from "next/dynamic";

import { TWITTER_URL } from "@/config";
import { getAppMetadata, updateAppMetadata } from "../utils/get-app-metadata";
import { InvoiceForm } from "./invoice-form";
import { InvoicePDFDownloadLink } from "./invoice-pdf-download-link";
import type { Dispatch, SetStateAction } from "react";

const DesktopPDFViewerModuleLoading = () => (
  <div className="flex h-[580px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-gray-600">Loading PDF viewer...</p>
    </div>
  </div>
);

const MobileInvoicePDFViewerModuleLoading = () => (
  <div className="flex h-[520px] w-[650px] items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-gray-600">Loading PDF viewer...</p>
    </div>
  </div>
);

const DesktopInvoicePDFViewer = dynamic(
  () =>
    import("./invoice-pdf-preview/desktop-pdf-viewer").then(
      (mod) => mod.DesktopInvoicePDFViewer,
    ),

  {
    ssr: false,
    loading: () => <DesktopPDFViewerModuleLoading />,
  },
);

const MobileInvoicePDFViewer = dynamic(
  () =>
    import("./invoice-pdf-preview/mobile-pdf-viewer").then(
      (mod) => mod.MobileInvoicePDFViewer,
    ),
  {
    ssr: false,
    loading: () => <MobileInvoicePDFViewerModuleLoading />,
  },
);

const PdfViewer = ({
  invoiceData,
  errorWhileGeneratingPdfIsShown,
  isMobile,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  errorWhileGeneratingPdfIsShown: boolean;
  isMobile: boolean;
  qrCodeDataUrl: string;
}) => {
  // Render the appropriate template based on the selected template
  const renderTemplate = () => {
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

  // Use Mobile PDF viewer for:
  // 1. Mobile devices
  // 2. Any in-app browser/WebView environment (new logic for platforms like X.com, LinkedIn, etc.)
  // This is due to limitations of the standard PDF viewer in these environments
  // https://github.com/diegomura/react-pdf/issues/714
  if (isMobile) {
    return (
      <MobileInvoicePDFViewer
        invoiceData={invoiceData}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    );
  }

  const template = renderTemplate();

  // Normal version for standard desktop browsers
  return (
    <DesktopInvoicePDFViewer
      errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
    >
      {template}
    </DesktopInvoicePDFViewer>
  );
};

const TAB_INVOICE_FORM = MOBILE_TABS_VALUES[0];
const TAB_INVOICE_PREVIEW = MOBILE_TABS_VALUES[1];

export function InvoiceClientPage({
  invoiceDataState,
  handleInvoiceDataChange,
  handleShareInvoice,
  isMobile,
  errorWhileGeneratingPdfIsShown,
  setErrorWhileGeneratingPdfIsShown,
  setCanShareInvoice,
  canShareInvoice,
  qrCodeDataUrl,
  setInvoiceFormHasErrors,
}: {
  invoiceDataState: InvoiceData;
  handleInvoiceDataChange: (invoiceData: InvoiceData) => void;
  handleShareInvoice: () => void;
  isMobile: boolean;
  errorWhileGeneratingPdfIsShown: boolean;
  setErrorWhileGeneratingPdfIsShown: (error: boolean) => void;
  setCanShareInvoice: (canShareInvoice: boolean) => void;
  canShareInvoice: boolean;
  qrCodeDataUrl: string;
  setInvoiceFormHasErrors: Dispatch<SetStateAction<boolean>>;
}) {
  const appMetadata = getAppMetadata();

  const invoiceLastUpdatedAtFormatted = appMetadata?.invoiceLastUpdatedAt
    ? dayjs(appMetadata.invoiceLastUpdatedAt)
        .locale("en")
        .format("MMM D, YYYY [at] HH:mm")
    : null;

  const defaultMobileTab =
    appMetadata?.lastVisitedMobileTab || DEFAULT_MOBILE_TAB;

  return (
    <>
      {isMobile ? (
        <div>
          <Tabs
            defaultValue={defaultMobileTab}
            className="w-full"
            onValueChange={(value) => {
              const newValue = value as MobileTabsValues;

              // update the last visited mobile tab in the app metadata
              updateAppMetadata((current) => {
                return {
                  ...current,
                  lastVisitedMobileTab: newValue,
                };
              });
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value={TAB_INVOICE_FORM} className="flex-1">
                <span className="flex items-center gap-1">
                  <PencilIcon className="h-4 w-4" />
                  Edit Invoice
                </span>
              </TabsTrigger>
              <TabsTrigger value={TAB_INVOICE_PREVIEW} className="flex-1">
                <span className="flex items-center gap-1">
                  <FileTextIcon className="h-4 w-4" />
                  Preview PDF
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={TAB_INVOICE_FORM} className="mt-1">
              <div className="h-[520px] overflow-auto rounded-lg border-b px-3 shadow-sm">
                <InvoiceForm
                  invoiceData={invoiceDataState}
                  handleInvoiceDataChange={handleInvoiceDataChange}
                  setCanShareInvoice={setCanShareInvoice}
                  isMobile
                  setInvoiceFormHasErrors={setInvoiceFormHasErrors}
                />
              </div>
            </TabsContent>
            <TabsContent value={TAB_INVOICE_PREVIEW} className="mt-1">
              <div className="flex h-[520px] w-full items-center justify-center">
                <PdfViewer
                  invoiceData={invoiceDataState}
                  errorWhileGeneratingPdfIsShown={
                    errorWhileGeneratingPdfIsShown
                  }
                  isMobile={isMobile}
                  qrCodeDataUrl={qrCodeDataUrl}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="sticky bottom-0 z-50 mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-2px_rgba(0,0,0,0.05)]">
            <CustomTooltip
              className={cn(!canShareInvoice && "bg-red-50")}
              trigger={
                <Button
                  data-disabled={!canShareInvoice} // for better UX than 'disabled'
                  onClick={handleShareInvoice}
                  variant="outline"
                  className={cn("mx-2 w-full")}
                >
                  Generate a link to invoice
                </Button>
              }
              content={
                canShareInvoice ? (
                  <div className="flex items-center gap-3 p-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Share Invoice Online
                      </p>
                      <p className="text-pretty text-xs leading-relaxed text-slate-700">
                        Generate a link to share this invoice with your clients.
                        They can view and download it directly from their
                        browser.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    data-testid="share-invoice-tooltip-content"
                    className="flex items-center gap-3 bg-red-50 p-3"
                  >
                    <AlertCircleIcon className="h-5 w-5 flex-shrink-0 fill-red-600 text-white" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-red-800">
                        Unable to Share Invoice
                      </p>
                      <p className="text-pretty text-xs leading-relaxed text-red-700">
                        Invoices with logos cannot be shared. Please remove the
                        logo to generate a shareable link. You can still
                        download the invoice as PDF and share it.
                      </p>
                    </div>
                  </div>
                )
              }
            />
            <InvoicePDFDownloadLink
              invoiceData={invoiceDataState}
              errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
              setErrorWhileGeneratingPdfIsShown={
                setErrorWhileGeneratingPdfIsShown
              }
              qrCodeDataUrl={qrCodeDataUrl}
            />
          </div>
          {invoiceLastUpdatedAtFormatted && (
            <div className="relative mt-2 text-center text-xs text-slate-700 duration-500 animate-in fade-in slide-in-from-bottom-2">
              <span className="font-semibold">Invoice last updated:</span>{" "}
              {invoiceLastUpdatedAtFormatted}
            </div>
          )}
          <div className="mt-3 flex w-full justify-center">
            <span className="inline-block text-sm text-zinc-700 duration-500 animate-in fade-in slide-in-from-bottom-2">
              Made by{" "}
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-black"
              >
                Vlad Sazonau
              </a>
            </span>
          </div>
        </div>
      ) : (
        // Desktop View
        <>
          <div className="col-span-4">
            <div className="h-[620px] overflow-auto border-b px-3 pl-0 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)] 2xl:h-[700px]">
              <InvoiceForm
                invoiceData={invoiceDataState}
                handleInvoiceDataChange={handleInvoiceDataChange}
                setCanShareInvoice={setCanShareInvoice}
                setInvoiceFormHasErrors={setInvoiceFormHasErrors}
              />
            </div>

            <span className="mt-1 inline-block text-end text-sm text-zinc-700 duration-500 animate-in fade-in slide-in-from-bottom-2">
              Made by{" "}
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-black"
              >
                Vlad Sazonau
              </a>
            </span>
          </div>
          <div className="relative col-span-8 h-[620px] w-full max-w-full 2xl:h-[700px]">
            {invoiceLastUpdatedAtFormatted && (
              <div className="absolute -top-5 right-0 text-center text-xs text-slate-700 duration-500 animate-in fade-in slide-in-from-bottom-2 md:-mb-5 lg:text-right">
                <span className="font-semibold">Invoice last updated:</span>{" "}
                {invoiceLastUpdatedAtFormatted}
              </div>
            )}
            <PdfViewer
              invoiceData={invoiceDataState}
              errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
              isMobile={false}
              qrCodeDataUrl={qrCodeDataUrl}
            />
          </div>
        </>
      )}
    </>
  );
}
