"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { PDF_DATA_LOCAL_STORAGE_KEY } from "../../components/invoice-form";
import { INITIAL_INVOICE_DATA } from "../../constants";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import { ErrorMessage } from "@/components/etc/error-message";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);

    toast.error(
      "Something went wrong! Please try to refresh the page or fill a bug report.",
      {
        closeButton: true,
        richColors: true,
      }
    );
  }, [error]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <ErrorMessage>
          Something went wrong. Please try to refresh the page or fill a bug
          report{" "}
          <a
            href="https://pdfinvoicegenerator.userjot.com/board/bugs"
            className="underline"
          >
            here
          </a>
        </ErrorMessage>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => {
              reset();

              umamiTrackEvent("error_button_try_again_clicked");
            }
          }
          _variant="outline"
        >
          Try again
        </Button>
        <Button
          onClick={() => {
            try {
              // Clear the invoice data and start from scratch
              localStorage.setItem(
                PDF_DATA_LOCAL_STORAGE_KEY,
                JSON.stringify(INITIAL_INVOICE_DATA)
              );

              // Attempt to recover by trying to re-render the segment
              reset();

              toast.success("Invoice data cleared", {
                closeButton: true,
                richColors: true,
              });

              umamiTrackEvent("error_button_start_from_scratch_clicked");
            } catch (error) {
              console.error(error);

              toast.error("Error clearing the invoice data", {
                closeButton: true,
                richColors: true,
              });

              Sentry.captureException(error);
            }
          }}
        >
          Reset Invoice Data and Start From Scratch
        </Button>
      </div>
    </div>
  );
}
