"use client";

import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/ui/tooltip";
import {
  LOADING_BUTTON_TEXT,
  LOADING_BUTTON_TIMEOUT,
  PDF_DATA_FORM_ID,
} from "./invoice-form";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { usePDF } from "@react-pdf/renderer";
import type { InvoiceData } from "../schema";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { useOpenPanel } from "@openpanel/nextjs";
import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import { useLogger } from "next-axiom";
import * as Sentry from "@sentry/nextjs";

export function RegenerateInvoiceButton({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const [{ loading: pdfLoading, error }] = usePDF({
    document: <InvoicePdfTemplate invoiceData={invoiceData} />,
  });
  const [isLoading, setIsLoading] = useState(false);
  const openPanel = useOpenPanel();
  const log = useLogger();

  useEffect(() => {
    if (pdfLoading) {
      setIsLoading(true);
    } else {
      // When PDF loading completes, wait for 0.5 second before hiding the loader
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, LOADING_BUTTON_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [pdfLoading]);

  useEffect(() => {
    if (error) {
      ErrorGeneratingPdfToast();

      log.error("error_generating_pdf_regenerate_button", {
        data: {
          error: error,
        },
      });

      openPanel.track("error_generating_pdf_regenerate_button", {
        data: {
          error: error,
        },
      });
      umamiTrackEvent("error_generating_pdf_regenerate_button", {
        data: {
          error: error,
        },
      });

      Sentry.captureException(error);
    }
  }, [error, log, openPanel]);

  return (
    <CustomTooltip
      trigger={
        <Button
          type="submit"
          form={PDF_DATA_FORM_ID}
          _variant="outline"
          className="mt-2 w-full"
          disabled={isLoading}
          onClick={() => {
            // analytics events
            openPanel.track("regenerate_invoice");
            umamiTrackEvent("regenerate_invoice");
          }}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="animate-pulse">{LOADING_BUTTON_TEXT}</span>
            </span>
          ) : (
            "Regenerate Invoice"
          )}
        </Button>
      }
      content={isLoading ? null : "Click to regenerate the invoice PDF preview"}
    />
  );
}
