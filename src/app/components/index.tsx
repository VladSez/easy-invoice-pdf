"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTextIcon, PencilIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { InvoiceForm } from "./invoice-form";
import { InvoicePDFDownloadLink } from "./invoice-pdf-download-link";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import type { InvoiceData } from "../schema";
import { CustomTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FORM_PREFIX_IDS } from "./constants";

const InvoicePDFViewer = dynamic(
  () => import("./invoice-pdf-viewer").then((mod) => mod.InvoicePDFViewer),

  {
    ssr: false,
    loading: () => (
      <div className="flex h-[580px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

const TABS_VALUES = ["invoice-form", "invoice-preview"] as const;

const TAB_INVOICE_FORM = TABS_VALUES[0];
const TAB_INVOICE_PREVIEW = TABS_VALUES[1];

export function InvoiceClientPage({
  invoiceDataState,
  handleInvoiceDataChange,
  handleShareInvoice,
}: {
  invoiceDataState: InvoiceData;
  handleInvoiceDataChange: (invoiceData: InvoiceData) => void;
  handleShareInvoice: () => void;
}) {
  return (
    <>
      {/* Mobile View with Tabs START */}
      <div className="block w-full lg:hidden" data-testid="mobile-view">
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
            <div className="h-[460px] overflow-auto rounded-lg border-b px-3 shadow-sm">
              <InvoiceForm
                invoiceData={invoiceDataState}
                onInvoiceDataChange={handleInvoiceDataChange}
                formPrefixId={FORM_PREFIX_IDS.MOBILE}
              />
            </div>
          </TabsContent>
          <TabsContent value={TAB_INVOICE_PREVIEW} className="mt-1">
            <div className="h-[445px] w-full">
              <InvoicePDFViewer>
                <InvoicePdfTemplate invoiceData={invoiceDataState} />
              </InvoicePDFViewer>
            </div>
          </TabsContent>
        </Tabs>
        {/* Action buttons visible based on active tab */}
        <div className="sticky bottom-0 mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-2px_rgba(0,0,0,0.05)]">
          <CustomTooltip
            trigger={
              <Button
                onClick={handleShareInvoice}
                _variant="outline"
                className="mx-2 w-full lg:mx-0 lg:mb-0 lg:w-auto"
              >
                Generate a link to invoice
              </Button>
            }
            content="Generate a shareable link to this invoice. Share it with your clients to allow them to view the invoice online."
          />
          <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
        </div>
      </div>
      {/* Mobile View with Tabs END */}

      {/* Desktop View - Side by Side START */}
      <div className="hidden lg:col-span-4 lg:block" data-testid="desktop-view">
        <div className="h-[620px] overflow-auto border-b px-3 pl-0">
          <InvoiceForm
            invoiceData={invoiceDataState}
            onInvoiceDataChange={handleInvoiceDataChange}
            formPrefixId={FORM_PREFIX_IDS.DESKTOP}
          />
        </div>
      </div>
      <div className="hidden h-[620px] w-full max-w-full lg:col-span-8 lg:block">
        <InvoicePDFViewer>
          <InvoicePdfTemplate invoiceData={invoiceDataState} />
        </InvoicePDFViewer>
      </div>
      {/* Desktop View - Side by Side END */}
    </>
  );
}
