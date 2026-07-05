// @vitest-environment happy-dom

import { getInitialInvoiceData } from "@/app/constants";
import { CTAToastProvider } from "@/app/(app)/contexts/cta-toast-context";
import { CTA_TOAST_TIMEOUT } from "@/app/(app)/components/cta-toasts";
import { LOADING_BUTTON_TEXT } from "@/app/(app)/components/invoice-form";
import { DeviceContextProvider } from "@/contexts/device-context";
import type { InvoiceData } from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    usePDF: () => [mockPdfStateRef.current, mockUpdatePdfInstance],
  };
});

vi.mock("@/lib/umami-analytics-track-event", () => ({
  umamiTrackEvent: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/utils/is-telegram-in-app-browser", () => ({
  isTelegramInAppBrowser: vi.fn(() => false),
}));

vi.mock("@/app/(app)/utils/get-app-metadata", () => ({
  updateAppMetadata: vi.fn(),
}));

vi.mock("@/app/(app)/components/cta-toasts", async () => {
  const actual = await vi.importActual("@/app/(app)/components/cta-toasts");

  return {
    ...(actual as object),
    showRandomCTAToast: vi.fn(),
  };
});

vi.mock("@/lib/haptic", () => ({
  haptic: vi.fn(),
}));

vi.mock("@/components/ui/toasts/error-generating-pdf-toast", () => ({
  ErrorGeneratingPdfToast: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

import { InvoicePDFDownloadLink } from "../invoice-pdf-download-link";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import { isTelegramInAppBrowser } from "@/utils/is-telegram-in-app-browser";
import { updateAppMetadata } from "@/app/(app)/utils/get-app-metadata";
import { showRandomCTAToast } from "@/app/(app)/components/cta-toasts";
import { haptic } from "@/lib/haptic";
import { ErrorGeneratingPdfToast } from "@/components/ui/toasts/error-generating-pdf-toast";
import { toast } from "sonner";

interface RenderOptions {
  invoiceData?: InvoiceData;
  errorWhileGeneratingPdfIsShown?: boolean;
  setErrorWhileGeneratingPdfIsShown?: (error: boolean) => void;
  qrCodeDataUrl?: string;
  isMobile?: boolean;
  inAppInfo?: { isInApp: boolean; name: string | null };
}

function renderInvoicePDFDownloadLink({
  invoiceData = getInitialInvoiceData(),
  errorWhileGeneratingPdfIsShown = false,
  setErrorWhileGeneratingPdfIsShown = vi.fn(),
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
          <InvoicePDFDownloadLink
            invoiceData={invoiceData}
            errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
            setErrorWhileGeneratingPdfIsShown={
              setErrorWhileGeneratingPdfIsShown
            }
            qrCodeDataUrl={qrCodeDataUrl}
            isMobile={isMobile}
          />
        </CTAToastProvider>
      </DeviceContextProvider>
    </TooltipProvider>,
  );
}

function getDownloadLink() {
  return screen.getByRole("link", { name: /Download PDF in/i });
}

describe("InvoicePDFDownloadLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockPdfState();
    vi.mocked(isTelegramInAppBrowser).mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("should render download link with language label when PDF is ready", () => {
    renderInvoicePDFDownloadLink();

    expect(getDownloadLink()).toHaveTextContent("Download PDF in English");
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

    expect(showRandomCTAToast).toHaveBeenCalledTimes(1);
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

  it("should show in-app browser info toast on mount", () => {
    renderInvoicePDFDownloadLink({
      inAppInfo: { isInApp: true, name: "Facebook" },
    });

    expect(toast.info).toHaveBeenCalledWith(
      "In-App Browser Detected",
      expect.objectContaining({
        id: "in-app-browser-toast",
      }),
    );
  });

  it("should show error generating PDF toast when PDF error occurs", () => {
    const setErrorWhileGeneratingPdfIsShown = vi.fn();
    const pdfError = new Error("PDF generation failed");

    mockPdfStateRef.current = {
      loading: false,
      url: null,
      error: pdfError,
    };

    renderInvoicePDFDownloadLink({
      errorWhileGeneratingPdfIsShown: false,
      setErrorWhileGeneratingPdfIsShown,
    });

    expect(ErrorGeneratingPdfToast).toHaveBeenCalledTimes(1);
    expect(setErrorWhileGeneratingPdfIsShown).toHaveBeenCalledWith(true);
    expect(umamiTrackEvent).toHaveBeenCalledWith(
      "error_generating_document_link",
      { data: { error: pdfError } },
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(pdfError);
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
