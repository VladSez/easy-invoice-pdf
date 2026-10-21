import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

import { reportPdfGenerationError } from "../report-pdf-generation-error";

vi.mock("@/components/ui/toasts/error-generating-pdf-toast", () => {
  return { ErrorGeneratingPdfToast: vi.fn() };
});

vi.mock("@/lib/umami-analytics-track-event", () => {
  return { umamiTrackEvent: vi.fn() };
});

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
});

describe("reportPdfGenerationError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tells the visitor, analytics and Sentry", () => {
    reportPdfGenerationError("PDF generation failed");

    expect(ErrorGeneratingPdfToast).toHaveBeenCalledOnce();
    expect(umamiTrackEvent).toHaveBeenCalledWith(
      "error_generating_document_link",
      { data: { error: "PDF generation failed" } },
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      "PDF generation failed",
    );
  });
});
