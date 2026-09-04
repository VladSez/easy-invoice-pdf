// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CTA_TOAST_TIMEOUT,
  showCTAToast,
} from "@/app/(app)/components/cta-toasts";
import { CTAToastProvider } from "@/app/(app)/contexts/cta-toast-context";
import { InvoicePdfInstanceProvider } from "@/app/(app)/contexts/invoice-pdf-instance-context";
import { updateAppMetadata } from "@/app/(app)/utils/get-app-metadata";
import { getInitialInvoiceData } from "@/app/constants";
import { CTA_TOAST_STORAGE_KEY, type InvoiceData } from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DeviceContextProvider } from "@/contexts/device-context";
import { haptic } from "@/lib/haptic";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";

import {
  InvoicePDFDownloadLink,
  LOADING_BUTTON_TEXT,
} from "../invoice-pdf-download-link";

import "@testing-library/jest-dom/vitest";

const { mockUpdatePdfInstance, mockPdfStateRef, resetMockPdfState } =
  vi.hoisted(() => {
    const mockUpdatePdfInstance = vi.fn();

    const mockPdfStateRef = {
      current: {
        loading: false,
        url: "blob:http://localhost/fake-pdf" as string | null,
        error: null as Error | null,
      },
    };

    const resetMockPdfState = () => {
      mockPdfStateRef.current = {
        loading: false,
        url: "blob:http://localhost/fake-pdf",
        error: null,
      };
    };

    return { mockUpdatePdfInstance, mockPdfStateRef, resetMockPdfState };
  });

vi.mock("@react-pdf/renderer/lib/react-pdf.browser", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...(actual as object),
    usePDF: () => {
      return [mockPdfStateRef.current, mockUpdatePdfInstance];
    },
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

vi.mock("@/utils/is-telegram-in-app-browser", () => {
  return {
    isTelegramInAppBrowser: vi.fn(() => {
      return false;
    }),
  };
});

vi.mock("@/app/(app)/utils/get-app-metadata", () => {
  return {
    updateAppMetadata: vi.fn(),
  };
});

vi.mock("@/app/(app)/components/cta-toasts", async () => {
  const actual = await vi.importActual("@/app/(app)/components/cta-toasts");

  return {
    ...(actual as object),
    showCTAToast: vi.fn(),
  };
});

vi.mock("@/lib/haptic", () => {
  return {
    haptic: vi.fn(),
  };
});

vi.mock("@/components/ui/toasts/error-generating-pdf-toast", () => {
  return {
    ErrorGeneratingPdfToast: vi.fn(),
  };
});

vi.mock("sonner", () => {
  return {
    toast: Object.assign(vi.fn(), {
      error: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
    }),
  };
});

interface RenderOptions {
  invoiceData?: InvoiceData;
  qrCodeDataUrl?: string;
  isMobile?: boolean;
  inAppInfo?: { isInApp: boolean; name: string | null };
}

function renderInvoicePDFDownloadLink({
  invoiceData = getInitialInvoiceData(),
  qrCodeDataUrl = "data:image/png;base64,abc",
  isMobile = false,
  inAppInfo = { isInApp: false, name: null },
}: RenderOptions = {}) {
  return render(
    <TooltipProvider delayDuration={0}>
      <DeviceContextProvider
        isDesktop
        isAndroid={false}
        isMobile={isMobile}
        inAppInfo={inAppInfo}
      >
        <CTAToastProvider>
          {/* The download link reads the PDF from the shared instance, so it needs the provider */}
          <InvoicePdfInstanceProvider
            invoiceData={invoiceData}
            qrCodeDataUrl={qrCodeDataUrl}
          >
            <InvoicePDFDownloadLink
              invoiceData={invoiceData}
              isMobile={isMobile}
            />
          </InvoicePdfInstanceProvider>
        </CTAToastProvider>
      </DeviceContextProvider>
    </TooltipProvider>,
  );
}

function getDownloadLink() {
  return screen.getByRole("link", { name: /Download PDF/i });
}

describe("InvoicePDFDownloadLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockPdfState();
    // the CTA toast cooldown is persisted, so it has to be cleared between tests
    localStorage.clear();
    vi.mocked(isTelegramInAppBrowser).mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("should render a language-specific desktop download link when PDF is ready", () => {
    renderInvoicePDFDownloadLink();

    expect(getDownloadLink()).toHaveTextContent("Download PDF in English");
  });

  it("should render a concise mobile download link", () => {
    renderInvoicePDFDownloadLink({ isMobile: true });

    expect(getDownloadLink()).toHaveTextContent("Download PDF");
    expect(getDownloadLink()).not.toHaveTextContent("Download PDF in English");
  });

  it("should call updatePdfInstance when document mounts", () => {
    renderInvoicePDFDownloadLink();

    expect(mockUpdatePdfInstance).toHaveBeenCalledTimes(1);
  });

  it("should show loading state while PDF is generating", () => {
    mockPdfStateRef.current = {
      loading: true,
      url: null,
      error: null,
    };

    renderInvoicePDFDownloadLink();

    const link = screen.getByRole("link", { name: LOADING_BUTTON_TEXT });

    expect(within(link).getByText(LOADING_BUTTON_TEXT)).toBeInTheDocument();
    expect(link).toHaveClass("pointer-events-none");
  });

  it("should set href and download attributes when PDF url is available", () => {
    const invoiceData = {
      ...getInitialInvoiceData(),
      invoiceNumberObject: {
        ...getInitialInvoiceData().invoiceNumberObject,
        value: "01/2025",
      },
    };

    renderInvoicePDFDownloadLink({ invoiceData });

    const link = getDownloadLink();

    expect(link).toHaveAttribute("href", "blob:http://localhost/fake-pdf");
    expect(link).toHaveAttribute("download", "invoice-EN-01-2025.pdf");
  });

  it("should track download_invoice on successful click", async () => {
    vi.useFakeTimers();

    renderInvoicePDFDownloadLink();

    fireEvent.click(getDownloadLink());

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(umamiTrackEvent).toHaveBeenCalledWith("download_invoice", {
      data: {
        invoice_template: "default",
      },
    });
    expect(updateAppMetadata).toHaveBeenCalledTimes(1);
    expect(toast.dismiss).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(CTA_TOAST_TIMEOUT);

    expect(showCTAToast).toHaveBeenCalledTimes(1);
  });

  it("should not show the CTA toast again while the cooldown is active", async () => {
    vi.useFakeTimers();

    // pretend a CTA toast was shown a minute ago
    localStorage.setItem(CTA_TOAST_STORAGE_KEY, String(Date.now() - 60_000));

    renderInvoicePDFDownloadLink();

    fireEvent.click(getDownloadLink());

    // the download itself still goes through
    expect(umamiTrackEvent).toHaveBeenCalledWith("download_invoice", {
      data: {
        invoice_template: "default",
      },
    });

    await vi.advanceTimersByTimeAsync(CTA_TOAST_TIMEOUT);

    expect(showCTAToast).not.toHaveBeenCalled();
  });

  it("should show the CTA toast again once the cooldown has expired", async () => {
    vi.useFakeTimers();

    // the cooldown is 24 hours, so a toast shown two days ago no longer suppresses it
    localStorage.setItem(
      CTA_TOAST_STORAGE_KEY,
      String(Date.now() - 2 * 24 * 60 * 60 * 1000),
    );

    renderInvoicePDFDownloadLink();

    fireEvent.click(getDownloadLink());

    await vi.advanceTimersByTimeAsync(CTA_TOAST_TIMEOUT);

    expect(showCTAToast).toHaveBeenCalledTimes(1);
  });

  it("should show error toast when url is missing on click", async () => {
    mockPdfStateRef.current = {
      loading: false,
      url: null,
      error: null,
    };

    const user = userEvent.setup();

    renderInvoicePDFDownloadLink();

    await user.click(getDownloadLink());

    expect(toast.error).toHaveBeenCalledWith(
      "File not available. Please try again in different browser.",
      expect.objectContaining({
        id: "file-not-available-error-toast",
      }),
    );
    expect(umamiTrackEvent).not.toHaveBeenCalled();
  });

  it("should block download inside in-app browser", async () => {
    const user = userEvent.setup();

    renderInvoicePDFDownloadLink({
      inAppInfo: { isInApp: true, name: "Instagram" },
    });

    await user.click(getDownloadLink());

    expect(toast).toHaveBeenCalledWith(
      "Downloads are blocked inside Instagram. Open in your browser to save.",
      expect.objectContaining({
        id: "downloads-blocked-inside-app-toast",
      }),
    );
    expect(umamiTrackEvent).not.toHaveBeenCalled();
  });

  it("should block download inside Telegram preview browser", async () => {
    vi.mocked(isTelegramInAppBrowser).mockReturnValue(true);

    const user = userEvent.setup();

    renderInvoicePDFDownloadLink();

    await user.click(getDownloadLink());

    expect(toast).toHaveBeenCalledWith(
      "Downloads are blocked inside Telegram. Open in your browser to save.",
      expect.objectContaining({
        id: "downloads-blocked-inside-telegram-toast",
      }),
    );
    expect(umamiTrackEvent).not.toHaveBeenCalled();
  });

  it("should not track a download when the PDF failed to generate", async () => {
    const user = userEvent.setup();

    mockPdfStateRef.current = {
      loading: false,
      url: "blob:http://localhost/fake-pdf",
      error: new Error("PDF generation failed"),
    };

    renderInvoicePDFDownloadLink();

    await user.click(getDownloadLink());

    // the provider reports the failure itself, the button just must not count it
    // as a download
    expect(umamiTrackEvent).not.toHaveBeenCalledWith(
      "download_invoice",
      expect.anything(),
    );
    expect(haptic).not.toHaveBeenCalled();
  });

  it("should show responsibility tooltip on hover", async () => {
    const user = userEvent.setup();

    renderInvoicePDFDownloadLink();

    await user.hover(getDownloadLink());

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Your Responsibility",
    );
  });
});
