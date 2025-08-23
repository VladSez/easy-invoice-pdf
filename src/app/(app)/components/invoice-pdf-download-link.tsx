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
import { StripeInvoicePdfTemplate } from "./invoice-pdf-stripe-template";
import { InvoicePdfTemplate } from "./invoice-pdf-template";

import { customDefaultToast, customPremiumToast } from "./cta-toasts";
import { useDeviceContext } from "@/contexts/device-context";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";

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
}: {
  invoiceData: InvoiceData;
  errorWhileGeneratingPdfIsShown: boolean;
  setErrorWhileGeneratingPdfIsShown: (error: boolean) => void;
}) {
  const { inAppInfo } = useDeviceContext();

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
        return <StripeInvoicePdfTemplate invoiceData={invoiceData} />;
      case "default":
      default:
        return <InvoicePdfTemplate invoiceData={invoiceData} />;
    }
  }, [invoiceData]);

  const [{ loading: pdfLoading, url, error }, updatePdfInstance] = usePDF();
  const [isLoading, setIsLoading] = useState(false);

  const trackDownload = useCallback(() => {
    umamiTrackEvent("download_invoice", {
      data: {
        invoice_template: invoiceData.template,
      },
    });
  }, [invoiceData.template]);

  const handleDownloadPDFClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!url) {
        e.preventDefault();

        toast.error(
          "File not available. Please try again in different browser.",
        );
        return;
      }

      if (inAppInfo.isInApp) {
        e.preventDefault();

        toast(
          `Downloads are blocked inside ${inAppInfo?.name ?? "this app"}. Open in your browser to save.`,
          { icon: "📱" },
        );

        return;
      }

      if (isTelegramInAppBrowser()) {
        e.preventDefault();
        toast(
          `Downloads are blocked inside Telegram. Open in your browser to save.`,
          { icon: "📱" },
        );

        return;
      }

      if (!isLoading && !error) {
        trackDownload();

        // close all other toasts (if any)
        toast.dismiss();

        // Randomly show either default or premium donation toast after 3 seconds
        setTimeout(() => {
          if (Math.random() <= 0.5) {
            customPremiumToast({
              title: "Support My Work",
              description:
                "Your contribution helps me maintain and improve this project for everyone! 🚀",
            });
          } else {
            customDefaultToast({
              title: "Love this project?",
              description:
                "Help me keep building amazing tools! Your support means the world to me. ✨",
            });
          }
        }, 3000);
      }
    },
    [url, inAppInfo.isInApp, inAppInfo?.name, isLoading, error, trackDownload],
  );

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
