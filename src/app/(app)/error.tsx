"use client"; // Error boundaries must be Client Components

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { toast } from "sonner";

import { setAppStorageItem } from "@/app/(app)/utils/app-local-storage";
import { DEFAULT_METADATA } from "@/app/(app)/utils/get-app-metadata";
import {
  METADATA_LOCAL_STORAGE_KEY,
  PDF_DATA_LOCAL_STORAGE_KEY,
} from "@/app/schema";
import { ErrorMessage } from "@/components/etc/error-message";
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
import { Button } from "@/components/ui/button";
import { BUG_REPORT_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

import { getInitialInvoiceData } from "../constants";

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
          Something went wrong.
          <br /> Please try refreshing the page or using the Chrome browser.
        </ErrorMessage>
        <ErrorMessage>
          You can also try resetting your invoice data below and filling it in
          again. <br /> If the issue persists, try clearing your browser&apos;s
          local storage manually or fill a bug report{" "}
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
                    // Best effort: a store that rejects writes cannot be holding the
                    // data that broke the app either, and `reset()` below is what gets
                    // the user off this error screen — it must not be skipped.
                    setAppStorageItem({
                      key: PDF_DATA_LOCAL_STORAGE_KEY,
                      value: JSON.stringify(getInitialInvoiceData()),
                    });

                    setAppStorageItem({
                      key: METADATA_LOCAL_STORAGE_KEY,
                      value: JSON.stringify(DEFAULT_METADATA),
                    });

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
