import { InvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import { StripeInvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import {
  LANGUAGE_TO_LABEL,
  type InvoiceData,
  type SupportedLanguages,
} from "@/app/schema";
import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { usePDF } from "@react-pdf/renderer/lib/react-pdf.browser";
import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LOADING_BUTTON_TEXT, LOADING_BUTTON_TIMEOUT } from "./invoice-form";

import { useDeviceContext } from "@/contexts/device-context";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";
import { useCTAToast } from "../contexts/cta-toast-context";
import { CTA_TOAST_LAST_SHOWN_STORAGE_KEY } from "../hooks/use-show-random-cta-toast";
import { CTA_TOAST_TIMEOUT, showRandomCTAToast } from "./cta-toasts";

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
  errorWhileGeneratingPdfIsShown,
  setErrorWhileGeneratingPdfIsShown,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  errorWhileGeneratingPdfIsShown: boolean;
  setErrorWhileGeneratingPdfIsShown: (error: boolean) => void;
  qrCodeDataUrl: string;
}) {
  const { inAppInfo } = useDeviceContext();
  const { markToastAsShown } = useCTAToast();

  const [{ loading: pdfLoading, url, error }, updatePdfInstance] = usePDF();
  const [isLoading, setIsLoading] = useState(false);

  const [inAppBrowserToastShown, setInAppBrowserToastShown] = useState(false);

  const isTelegramPreviewBrowser = isTelegramInAppBrowser();

  const handleDownloadPDFClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!url) {
        e.preventDefault();

        toast.error(
          "File not available. Please try again in different browser.",
        );
        return;
      }

      if (inAppInfo?.isInApp) {
        e.preventDefault();

        toast(
          `Downloads are blocked inside ${inAppInfo?.name ?? "this app"}. Open in your browser to save.`,
          { icon: "📱" },
        );

        return;
      }

      if (isTelegramPreviewBrowser) {
        e.preventDefault();
        toast(
          `Downloads are blocked inside Telegram. Open in your browser to save.`,
          { icon: "📱" },
        );

        return;
      }

      if (!isLoading && !error) {
        // track download event
        umamiTrackEvent("download_invoice", {
          data: {
            invoice_template: invoiceData.template,
          },
        });

        // close all other toasts (if any)
        toast.dismiss();

        // if (isToastShownInSession) {
        //   umamiTrackEvent("cta_toast_skipped_downloaded_invoice");
        //   return;
        // }

        // Show a CTA toast
        setTimeout(() => {
          showRandomCTAToast();

          // Mark toast as shown in session to prevent duplicate toasts
          markToastAsShown();

          // Update timestamp to prevent other CTA toasts from showing for 7 days
          localStorage.setItem(
            CTA_TOAST_LAST_SHOWN_STORAGE_KEY,
            String(Date.now()),
          );
        }, CTA_TOAST_TIMEOUT);
      }
    },
    [
      url,
      inAppInfo?.isInApp,
      inAppInfo?.name,
      isTelegramPreviewBrowser,
      isLoading,
      error,
      invoiceData.template,
      markToastAsShown,
    ],
  );

  // Memoize static values
  const filename = useMemo(() => {
    const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

    // Replace all slashes with dashes (e.g. 01/2025 -> 01-2025)
    const formattedInvoiceNumber = invoiceNumberValue
      ? invoiceNumberValue?.replace(/\//g, "-")
      : dayjs().format("MM-YYYY"); // Fallback to current month and year if no invoice number

    const name = `invoice-${invoiceData?.language?.toUpperCase()}-${formattedInvoiceNumber}.pdf`;

    return name;
  }, [invoiceData?.language, invoiceData?.invoiceNumberObject]);

  const PdfDocument = useMemo(() => {
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

  // Handle PDF updates
  useEffect(() => {
    updatePdfInstance(PdfDocument);
  }, [PdfDocument, updatePdfInstance]);

  // Handle loading state (for better UX)
  useEffect(() => {
    if (!pdfLoading) {
      const timer = setTimeout(
        () => setIsLoading(false),
        LOADING_BUTTON_TIMEOUT,
      );
      return () => clearTimeout(timer);
    }
    setIsLoading(true);
  }, [pdfLoading]);

  // Handle errors
  useEffect(() => {
    if (error && !errorWhileGeneratingPdfIsShown) {
      ErrorGeneratingPdfToast();
      setErrorWhileGeneratingPdfIsShown(true);

      umamiTrackEvent("error_generating_document_link", { data: { error } });
      Sentry.captureException(error);
    }
  }, [
    error,
    errorWhileGeneratingPdfIsShown,
    setErrorWhileGeneratingPdfIsShown,
  ]);

  // Show a toast if the user is in an in-app browser
  useEffect(() => {
    if (
      (inAppInfo?.isInApp || isTelegramPreviewBrowser) &&
      !inAppBrowserToastShown
    ) {
      toast.info("In-App Browser Detected", {
        description: (
          <p>
            For the best experience, please open this page in{" "}
            <span className="font-bold">Safari or Chrome browser.</span>
          </p>
        ),
        id: "in-app-browser-toast", // To prevent duplicate toasts
        duration: Infinity,
        icon: "⚠️",
      });
      setInAppBrowserToastShown(true);
    }
  }, [inAppInfo?.isInApp, inAppBrowserToastShown, isTelegramPreviewBrowser]);

  return (
    <>
      <a
        translate="no"
        href={url || "#"}
        download={url ? filename : undefined}
        onClick={handleDownloadPDFClick}
        className={cn(
          "h-[36px] w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-slate-50",
          "shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90 active:scale-[98%] active:transition-transform",
          "focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50",
          "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0 lg:w-[210px]",
          {
            "pointer-events-none opacity-70": isLoading,
            "lg:w-[240px]": invoiceData.language === "pt",
          },
        )}
      >
        <ButtonContent isLoading={isLoading} language={invoiceData.language} />
      </a>
    </>
  );
}
