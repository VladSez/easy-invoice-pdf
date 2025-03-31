"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { PDF_DATA_LOCAL_STORAGE_KEY } from "./components/invoice-form";
import { INITIAL_INVOICE_DATA } from "./constants";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);

    Sentry.captureException(error);

    toast.error(
      "Something went wrong! Please try to refresh the page or contact support.",
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
          </a>{" "}
          or contact support via this{" "}
          <a href="mailto:vladsazon27@gmail.com" className="underline">
            link
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
          Clear the Invoice Data and Start from Scratch
        </Button>
      </div>
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-5 rounded-lg border border-red-500/50 px-4 py-3 text-red-600">
      <p className="text-sm">
        <CircleAlert
          className="-mt-0.5 me-2 inline-flex opacity-60"
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />
        {children}
      </p>
    </div>
  );
}
