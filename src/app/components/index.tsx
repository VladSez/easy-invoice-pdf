"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTextIcon, PencilIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { InvoiceForm } from "./invoice-form";
import { InvoicePDFDownloadLink } from "./invoice-pdf-download-link";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { RegenerateInvoiceButton } from "./regenerate-invoice-button";
import type { InvoiceData } from "../schema";
import { useState } from "react";

export const FORM_PREFIX_IDS = {
  MOBILE: "mobile-invoice-form",
  DESKTOP: "desktop-invoice-form",
} as const satisfies Record<string, string>;

export type FormPrefixId =
  (typeof FORM_PREFIX_IDS)[keyof typeof FORM_PREFIX_IDS];

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
type TabValue = (typeof TABS_VALUES)[number];

const TAB_INVOICE_FORM = TABS_VALUES[0];
const TAB_INVOICE_PREVIEW = TABS_VALUES[1];

export function InvoiceClientPage({
  invoiceDataState,
  handleInvoiceDataChange,
}: {
  invoiceDataState: InvoiceData;
  handleInvoiceDataChange: (invoiceData: InvoiceData) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_INVOICE_FORM);

  return (
    <>
      {/* Mobile View with Tabs START */}
      <div className="block w-full lg:hidden">
        <Tabs
          defaultValue={TAB_INVOICE_FORM}
          className="w-full"
          onValueChange={(value) => setActiveTab(value as TabValue)}
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
          <TabsContent value={TAB_INVOICE_FORM} className="mt-4">
            <div className="h-[400px] overflow-auto rounded-lg border-b px-3 shadow-sm">
              <InvoiceForm
                invoiceData={invoiceDataState}
                onInvoiceDataChange={handleInvoiceDataChange}
                formPrefixId={FORM_PREFIX_IDS.MOBILE}
              />
            </div>
          </TabsContent>
          <TabsContent value={TAB_INVOICE_PREVIEW} className="mt-4">
            <div className="h-[580px] w-full">
              <InvoicePDFViewer>
                <InvoicePdfTemplate invoiceData={invoiceDataState} />
              </InvoicePDFViewer>
            </div>
          </TabsContent>
          {/* Action buttons visible based on active tab */}
          <div className="sticky bottom-0 mt-4 flex flex-col gap-3 rounded-lg border border-t border-gray-200 bg-white px-3 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-2px_rgba(0,0,0,0.05)]">
            <RegenerateInvoiceButton
              invoiceData={invoiceDataState}
              formPrefixId={
                // we need to pass the correct form prefix id based on the active tab, because on invoice preview tab, the mobile form is not rendered
                activeTab === TAB_INVOICE_FORM
                  ? FORM_PREFIX_IDS.MOBILE
                  : FORM_PREFIX_IDS.DESKTOP
              }
            />
            <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
          </div>
        </Tabs>
      </div>
      {/* Mobile View with Tabs END */}

      {/* Desktop View - Side by Side START */}
      <div className="hidden lg:col-span-4 lg:block">
        <div className="h-[580px] overflow-auto px-3 pl-0">
          <InvoiceForm
            invoiceData={invoiceDataState}
            onInvoiceDataChange={handleInvoiceDataChange}
            formPrefixId={FORM_PREFIX_IDS.DESKTOP}
          />
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white">
          <RegenerateInvoiceButton
            invoiceData={invoiceDataState}
            formPrefixId={FORM_PREFIX_IDS.DESKTOP}
          />
        </div>
      </div>
      <div className="hidden h-[580px] w-full max-w-full lg:col-span-8 lg:block">
        <InvoicePDFViewer>
          <InvoicePdfTemplate invoiceData={invoiceDataState} />
        </InvoicePDFViewer>
      </div>
      {/* Desktop View - Side by Side END */}
    </>
  );
}
