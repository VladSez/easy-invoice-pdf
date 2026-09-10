// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";

interface MockPdfState {
  loading: boolean;
  url: string | null;
  error: Error | null;
}

const { mockPdfStateRef } = vi.hoisted(() => {
  const mockPdfStateRef: { current: MockPdfState } = {
    current: {
      loading: false,
      url: "blob:http://localhost/fake-pdf",
      error: null,
    },
  };

  return { mockPdfStateRef };
});

vi.mock("@react-pdf/renderer/lib/react-pdf.browser", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...(actual as object),
    usePDF: () => {
      return [mockPdfStateRef.current, vi.fn()];
    },
  };
});

vi.mock("@/components/ui/toasts/error-generating-pdf-toast", () => {
  return {
    ErrorGeneratingPdfToast: vi.fn(),
  };
});

vi.mock("@/lib/umami-analytics-track-event", () => {
  return {
    umamiTrackEvent: vi.fn(),
  };
});

vi.mock("@sentry/nextjs", () => {
  return {
    captureException: vi.fn(),
  };
});

import * as Sentry from "@sentry/nextjs";

import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

import { InvoicePdfInstanceProvider } from "../invoice-pdf-instance-context";

function renderProvider() {
  return render(
    <InvoicePdfInstanceProvider
      invoiceData={getInitialInvoiceData()}
      qrCodeDataUrl="data:image/png;base64,abc"
    >
      <p>preview</p>
    </InvoicePdfInstanceProvider>,
  );
}

describe("InvoicePdfInstanceProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPdfStateRef.current = {
      loading: false,
      url: "blob:http://localhost/fake-pdf",
      error: null,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should report a failed PDF generation to the user, analytics and Sentry", () => {
    const pdfError = new Error("PDF generation failed");

    mockPdfStateRef.current = { loading: false, url: null, error: pdfError };

    renderProvider();

    expect(ErrorGeneratingPdfToast).toHaveBeenCalledTimes(1);
    expect(umamiTrackEvent).toHaveBeenCalledWith(
      "error_generating_document_link",
      { data: { error: pdfError } },
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(pdfError);
  });

  it("should report the same failure only once", () => {
    mockPdfStateRef.current = {
      loading: false,
      url: null,
      error: new Error("PDF generation failed"),
    };

    const { rerender } = renderProvider();

    rerender(
      <InvoicePdfInstanceProvider
        invoiceData={getInitialInvoiceData()}
        qrCodeDataUrl="data:image/png;base64,abc"
      >
        <p>preview</p>
      </InvoicePdfInstanceProvider>,
    );

    expect(ErrorGeneratingPdfToast).toHaveBeenCalledTimes(1);
  });

  it("should stay quiet when the PDF generates successfully", () => {
    renderProvider();

    expect(ErrorGeneratingPdfToast).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
