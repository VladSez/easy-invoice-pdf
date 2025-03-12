"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { usePDF } from "@react-pdf/renderer";
import {
  LANGUAGE_TO_LABEL,
  type InvoiceData,
  type SupportedLanguages,
} from "@/app/schema";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { LOADING_BUTTON_TEXT, LOADING_BUTTON_TIMEOUT } from "./invoice-form";
import { toast } from "sonner";
import { useOpenPanel } from "@openpanel/nextjs";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import * as Sentry from "@sentry/nextjs";

// Move static content outside component to prevent recreation
const DONATION_TOAST_CONFIG = {
  title: "Consider Supporting Us!",
  description:
    "If you find this tool helpful, please consider making a small donation to support our work.",
  duration: Infinity,
  closeButton: true,
} as const;

const DONATION_URL = "https://dub.sh/easyinvoice-donate" as const;

// Separate button states into a memoized component
const ButtonContent = ({
  isLoading,
  language,
}: {
  isLoading: boolean;
  language: SupportedLanguages;
}) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="animate-pulse">{LOADING_BUTTON_TEXT}</span>
      </span>
    );
  }

  const languageLabel = LANGUAGE_TO_LABEL[language];

  return `Download PDF in ${languageLabel}`;
};

export function InvoicePDFDownloadLink({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const openPanel = useOpenPanel();

  // Memoize static values
  const filename = useMemo(
    () =>
      `invoice-${invoiceData.language}-${invoiceData.invoiceNumber.replace("/", "-")}.pdf`,
    [invoiceData.language, invoiceData.invoiceNumber]
  );

  const PdfDocument = useMemo(
    () => <InvoicePdfTemplate invoiceData={invoiceData} />,
    [invoiceData]
  );

  // Combine loading states
  const [{ loading: pdfLoading, url, error }, updatePdfInstance] = usePDF();
  const [isLoading, setIsLoading] = useState(false);

  // Memoize tracking functions
  const trackDownload = useCallback(() => {
    openPanel.track("download_invoice");
    umamiTrackEvent("download_invoice");
  }, [openPanel]);

  const trackDonationClick = useCallback(() => {
    openPanel.track("donate_button_clicked_download_pdf_toast");
    umamiTrackEvent("donate_button_clicked_download_pdf_toast");
  }, [openPanel]);

  const showDonationToast = useCallback(() => {
    toast(DONATION_TOAST_CONFIG.title, {
      ...DONATION_TOAST_CONFIG,
      action: {
        label: "Donate",
        onClick: () => {
          window.open(DONATION_URL, "_blank", "noopener,noreferrer");
          trackDonationClick();
        },
      },
    });
  }, [trackDonationClick]);

  const handleClick = useCallback(() => {
    if (!isLoading && url) {
      trackDownload();
      toast.dismiss();
      setTimeout(showDonationToast, 3000);
    }
  }, [isLoading, url, trackDownload, showDonationToast]);

  // Handle PDF updates
  useEffect(() => {
    updatePdfInstance(PdfDocument);
  }, [PdfDocument, updatePdfInstance]);

  // Handle loading state
  useEffect(() => {
    if (!pdfLoading) {
      const timer = setTimeout(
        () => setIsLoading(false),
        LOADING_BUTTON_TIMEOUT
      );
      return () => clearTimeout(timer);
    }
    setIsLoading(true);
  }, [pdfLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      ErrorGeneratingPdfToast();
      openPanel.track("error_generating_document_link", { data: { error } });
      umamiTrackEvent("error_generating_document_link", { data: { error } });
      Sentry.captureException(error);
    }
  }, [error, openPanel]);

  return (
    <a
      href={url || "#"}
      download={filename}
      onClick={handleClick}
      className={cn(
        "mb-4 h-[36px] w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-slate-50",
        "shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90",
        "focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50",
        "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0 lg:w-[210px]",
        {
          "pointer-events-none opacity-70": isLoading,
        }
      )}
    >
      <ButtonContent isLoading={isLoading} language={invoiceData.language} />
    </a>
  );
}
