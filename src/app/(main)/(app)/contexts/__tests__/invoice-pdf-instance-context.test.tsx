// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";

interface MockPdfState {
  loading: boolean;
  url: string | null;
  error: string | null;
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

import { InvoicePdfInstanceProvider } from "@easyinvoicepdf/invoice-core/pdf";

const onError = vi.fn<(error: string) => void>();

function renderProvider() {
  return render(
    <InvoicePdfInstanceProvider
      invoiceData={getInitialInvoiceData()}
      qrCodeDataUrl="data:image/png;base64,abc"
      onError={onError}
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

  it("should hand a failed PDF generation to onError", () => {
    mockPdfStateRef.current = {
      loading: false,
      url: null,
      error: "PDF generation failed",
    };

    renderProvider();

    expect(onError).toHaveBeenCalledExactlyOnceWith("PDF generation failed");
  });

  it("should report the same failure only once", () => {
    mockPdfStateRef.current = {
      loading: false,
      url: null,
      error: "PDF generation failed",
    };

    const { rerender } = renderProvider();

    rerender(
      <InvoicePdfInstanceProvider
        invoiceData={getInitialInvoiceData()}
        qrCodeDataUrl="data:image/png;base64,abc"
        onError={onError}
      >
        <p>preview</p>
      </InvoicePdfInstanceProvider>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("should stay quiet when the PDF generates successfully", () => {
    renderProvider();

    expect(onError).not.toHaveBeenCalled();
  });
});
