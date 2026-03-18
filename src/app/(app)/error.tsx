"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";
import { toast } from "sonner";
import { INITIAL_INVOICE_DATA } from "../constants";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import { ErrorMessage } from "@/components/etc/error-message";
import {
  METADATA_LOCAL_STORAGE_KEY,
  PDF_DATA_LOCAL_STORAGE_KEY,
} from "@/app/schema";
import { BUG_REPORT_URL } from "@/config";
import { DEFAULT_METADATA } from "@/app/(app)/utils/get-app-metadata";

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
        id: "app-error-toast",
        closeButton: true,
        richColors: true,
      },
    );
  }, [error]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <ErrorMessage>
          Something went wrong. Please try refreshing the page or using{" "}
          <span className="font-bold">Chrome</span> browser. You can also try
          resetting your invoice data below and filling it in again. If the
          issue persists, try clearing your browser&apos;s local storage
          manually or fill a bug report{" "}
          <a
            href={BUG_REPORT_URL}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            here.
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
          variant="outline"
        >
          Try again
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Reset Invoice Data and Start From Scratch</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently reset your invoice data. You will need to
                fill it in again. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  try {
                    localStorage.setItem(
                      PDF_DATA_LOCAL_STORAGE_KEY,
                      JSON.stringify(INITIAL_INVOICE_DATA),
                    );

                    localStorage.setItem(
                      METADATA_LOCAL_STORAGE_KEY,
                      JSON.stringify(DEFAULT_METADATA),
                    );

                    reset();

                    toast.success("Invoice data cleared", {
                      id: "app-error-toast-clear-invoice-data-success",
                      closeButton: true,
                      richColors: true,
                    });

                    umamiTrackEvent("error_button_start_from_scratch_clicked");
                  } catch (error) {
                    console.error(error);

                    toast.error("Error clearing the invoice data", {
                      id: "app-error-toast-clear-invoice-data",
                      closeButton: true,
                      richColors: true,
                    });

                    Sentry.captureException(error);
                  }
                }}
              >
                Reset Invoice Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
