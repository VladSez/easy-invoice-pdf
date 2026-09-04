import dayjs from "dayjs";
import { DownloadIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useInvoicePdfInstance } from "@/app/(app)/contexts/invoice-pdf-instance-context";
import {
  LANGUAGE_TO_LABEL,
  type InvoiceData,
  type SupportedLanguages,
} from "@/app/schema";
import { CustomTooltip } from "@/components/ui/tooltip";
import { useDeviceContext } from "@/contexts/device-context";
import { haptic } from "@/lib/haptic";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";

import { useCTAToast } from "../contexts/cta-toast-context";
import { updateAppMetadata } from "../utils/get-app-metadata";
import { CTA_TOAST_TIMEOUT, showCTAToast } from "./cta-toasts";

const LOADING_BUTTON_TIMEOUT = 400;
export const LOADING_BUTTON_TEXT = "Generating Document...";

// Separate button states into a memoized component
const ButtonContent = ({
  isLoading,
  isMobile,
  language,
}: {
  isLoading: boolean;
  isMobile: boolean;
  language: SupportedLanguages;
}) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center">
        <Loader2 className="mr-1.5 size-4 animate-spin" />
        <span className="animate-pulse">{LOADING_BUTTON_TEXT}</span>
      </span>
    );
  }

  const languageLabel = LANGUAGE_TO_LABEL[language];

  return (
    <span className="inline-flex items-center">
      <DownloadIcon className="mr-1.5 size-4" />
      {isMobile ? "Download PDF" : `Download PDF in ${languageLabel}`}
    </span>
  );
};

export function InvoicePDFDownloadLink({
  invoiceData,
  isMobile,
}: {
  invoiceData: InvoiceData;
  isMobile: boolean;
}) {
  const { inAppInfo } = useDeviceContext();
  const { hasTriggeredCTAAction, markCTAActionTriggered } = useCTAToast();

  // The very same PDF the preview shows, generated once by `InvoicePdfInstanceProvider`
  const { loading: pdfLoading, url, error } = useInvoicePdfInstance();
  const [isLoading, setIsLoading] = useState(false);

  const isTelegramPreviewBrowser = isTelegramInAppBrowser();

  const handleDownloadPDFClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!url) {
        e.preventDefault();

        toast.error(
          "File not available. Please try again in different browser.",
          {
            id: "file-not-available-error-toast",
            position: isMobile ? "top-center" : "bottom-right",
          },
        );
        return;
      }

      if (inAppInfo?.isInApp) {
        e.preventDefault();

        toast(
          `Downloads are blocked inside ${inAppInfo?.name ?? "this app"}. Open in your browser to save.`,
          {
            icon: "📱",
            id: "downloads-blocked-inside-app-toast",
            position: isMobile ? "top-center" : "bottom-right",
          },
        );

        return;
      }

      if (isTelegramPreviewBrowser) {
        e.preventDefault();
        toast(
          `Downloads are blocked inside Telegram. Open in your browser to save.`,
          {
            icon: "📱",
            id: "downloads-blocked-inside-telegram-toast",
            position: isMobile ? "top-center" : "bottom-right",
          },
        );

        return;
      }

      if (!isLoading && !error) {
        haptic();

        // track download event
        umamiTrackEvent("download_invoice", {
          data: {
            invoice_template: invoiceData.template,
          },
        });

        updateAppMetadata((current) => {
          return {
            ...current,
            invoiceDownloadCount: (current?.invoiceDownloadCount ?? 0) + 1,
          };
        });

        // close all other toasts (if any)
        toast.dismiss();

        // downloading the PDF is the only thing that shows the CTA toast, and it
        // is shown at most once every 24 hours (cooldown lives in `useCTAToast`)
        if (!hasTriggeredCTAAction) {
          markCTAActionTriggered();

          setTimeout(() => {
            showCTAToast();
          }, CTA_TOAST_TIMEOUT);
        }
      }
    },
    [
      url,
      inAppInfo?.isInApp,
      inAppInfo?.name,
      isTelegramPreviewBrowser,
      isLoading,
      error,
      isMobile,
      invoiceData.template,
      hasTriggeredCTAAction,
      markCTAActionTriggered,
    ],
  );

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  // Replace all slashes with dashes (e.g. 01/2025 -> 01-2025)
  const formattedInvoiceNumber = invoiceNumberValue
    ? invoiceNumberValue?.replaceAll("/", "-")
    : dayjs().format("MM-YYYY"); // Fallback to current month and year if no invoice number

  const filename = `invoice-${invoiceData?.language?.toUpperCase()}-${formattedInvoiceNumber}.pdf`;

  // Handle loading state (for better UX)
  useEffect(() => {
    if (!pdfLoading) {
      const timer = setTimeout(() => {
        return setIsLoading(false);
      }, LOADING_BUTTON_TIMEOUT);

      return () => {
        return clearTimeout(timer);
      };
    }
    // oxlint-disable-next-line react/set-state-in-effect -- `pdfLoading` comes from the shared PDF instance, and the button holds its loading state for `LOADING_BUTTON_TIMEOUT` after it clears; there is no event here to derive this from
    setIsLoading(true);

    // it's ok to return here
    // oxlint-disable-next-line no-useless-return
    return;
  }, [pdfLoading]);

  return (
    <CustomTooltip
      content={
        <div className="flex items-center gap-3 p-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Your Responsibility
            </p>
            <p className="text-pretty text-xs leading-relaxed text-slate-700">
              Ensure this invoice complies with your local tax and accounting
              regulations before sending to clients.
            </p>
          </div>
        </div>
      }
      delayDuration={0}
      trigger={
        <a
          translate="no"
          href={url || "#"}
          download={url ? filename : undefined}
          onClick={handleDownloadPDFClick}
          className={cn(
            "h-[36px] w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white",
            "shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90 active:scale-[98%] active:transition-transform",
            "focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50",
            "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0 lg:w-[230px]",
            {
              "pointer-events-none opacity-70": isLoading,
              "lg:w-[250px]": invoiceData.language === "pt",
            },
          )}
        >
          <ButtonContent
            isLoading={isLoading}
            isMobile={isMobile}
            language={invoiceData.language}
          />
        </a>
      }
    />
  );
}
