import * as Sentry from "@sentry/nextjs";

import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

/**
 * Tells the visitor, analytics and Sentry that the invoice PDF failed to generate.
 *
 * Passed to `InvoicePdfInstanceProvider` as `onError`. The provider moves into
 * `@easyinvoicepdf/invoice-core` and can't import any of these itself.
 */
export function reportPdfGenerationError(error: string) {
  ErrorGeneratingPdfToast();

  umamiTrackEvent("error_generating_document_link", { data: { error } });

  Sentry.captureException(error);
}
