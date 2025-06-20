import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomTooltip } from "@/components/ui/tooltip";
import { FileTextIcon, PencilIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { InvoiceData } from "@/app/schema";
import { InvoiceForm } from "./invoice-form";
import { InvoicePDFDownloadLink } from "./invoice-pdf-download-link";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { useDeviceContext } from "@/contexts/device-context";

const DesktopPDFViewerModuleLoading = () => (
  <div className="flex h-[580px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px] 2xl:h-[700px]">
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-gray-600">Loading PDF viewer...</p>
    </div>
  </div>
);

const AndroidPDFViewerModuleLoading = () => (
  <div className="flex h-full w-full items-center justify-center border border-gray-200 bg-gray-200">
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-gray-600">Loading PDF viewer...</p>
    </div>
  </div>
);

const InvoicePDFViewer = dynamic(
  () => import("./invoice-pdf-viewer").then((mod) => mod.InvoicePDFViewer),

  {
    ssr: false,
    loading: () => <DesktopPDFViewerModuleLoading />,
  }
);

const AndroidPDFViewer = dynamic(
  () => import("./android-pdf-viewer").then((mod) => mod.AndroidPdfViewer),
  {
    ssr: false,
    loading: () => <AndroidPDFViewerModuleLoading />,
  }
);

const PdfViewer = ({ invoiceData }: { invoiceData: InvoiceData }) => {
  const { isAndroid } = useDeviceContext();

  // we only show the Android PDF viewer on Android devices due to the limitations of the PDF viewer
  // https://github.com/diegomura/react-pdf/issues/714
  if (isAndroid) {
    return <AndroidPDFViewer invoiceData={invoiceData} />;
  }

  // Desktop version
  return (
    <InvoicePDFViewer>
      <InvoicePdfTemplate invoiceData={invoiceData} />
    </InvoicePDFViewer>
  );
};

const TABS_VALUES = ["invoice-form", "invoice-preview"] as const;

const TAB_INVOICE_FORM = TABS_VALUES[0];
const TAB_INVOICE_PREVIEW = TABS_VALUES[1];

export function InvoiceClientPage({
  invoiceDataState,
  handleInvoiceDataChange,
  handleShareInvoice,
  isMobile,
}: {
  invoiceDataState: InvoiceData;
  handleInvoiceDataChange: (invoiceData: InvoiceData) => void;
  handleShareInvoice: () => void;
  isMobile: boolean;
}) {
  return (
    <>
      {isMobile ? (
        <div>
          <Tabs defaultValue={TAB_INVOICE_FORM} className="w-full">
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
              <div className="h-[480px] overflow-auto rounded-lg border-b px-3 shadow-sm">
                <InvoiceForm
                  invoiceData={invoiceDataState}
                  onInvoiceDataChange={handleInvoiceDataChange}
                />
              </div>
            </TabsContent>
            <TabsContent value={TAB_INVOICE_PREVIEW} className="mt-1">
              <div className="flex h-[480px] w-full items-center justify-center">
                <PdfViewer invoiceData={invoiceDataState} />
              </div>
            </TabsContent>
          </Tabs>
          <div className="sticky bottom-0 z-50 mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-2px_rgba(0,0,0,0.05)]">
            <CustomTooltip
              trigger={
                <Button
                  onClick={handleShareInvoice}
                  _variant="outline"
                  className="mx-2 w-full"
                >
                  Generate a link to invoice
                </Button>
              }
              content="Generate a shareable link to this invoice. Share it with your clients to allow them to view the invoice online."
            />
            <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
          </div>
        </div>
      ) : (
        // Desktop View
        <>
          <div className="col-span-4">
            <div className="h-[620px] overflow-auto border-b px-3 pl-0 2xl:h-[700px]">
              <InvoiceForm
                invoiceData={invoiceDataState}
                onInvoiceDataChange={handleInvoiceDataChange}
              />
            </div>
          </div>
          <div className="col-span-8 h-[620px] w-full max-w-full 2xl:h-[700px]">
            <PdfViewer invoiceData={invoiceDataState} />
          </div>
        </>
      )}
    </>
  );
}
