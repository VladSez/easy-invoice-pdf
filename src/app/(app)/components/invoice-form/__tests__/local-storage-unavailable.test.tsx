// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getInitialInvoiceData } from "@/app/constants";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
});

vi.mock("@/lib/umami-analytics-track-event", () => {
  return { umamiTrackEvent: vi.fn() };
});

vi.mock("@/hooks/use-media-query", () => {
  return {
    useIsDesktop: () => {
      return true;
    },
  };
});

import { InvoiceForm } from "../index";

/**
 * iOS in-app webviews (Telegram, Instagram, Facebook) expose `localStorage` as `null`.
 * Reading it unguarded throws
 * `TypeError: null is not an object (evaluating 'localStorage.getItem')`.
 */
function makeLocalStorageNull() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      return null;
    },
  });
}

const realLocalStorage = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

const NOTES = "Thanks for your business";

describe("InvoiceForm when localStorage is unavailable", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    if (realLocalStorage) {
      Object.defineProperty(window, "localStorage", realLocalStorage);
    }
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("still renders the form instead of crashing", () => {
    makeLocalStorageNull();

    expect(() => {
      render(
        <TooltipProvider delayDuration={0}>
          <InvoiceForm
            invoiceData={getInitialInvoiceData()}
            handleInvoiceDataChange={vi.fn()}
          />
        </TooltipProvider>,
      );
    }).not.toThrow();

    expect(screen.getByTestId("final-section")).toBeInTheDocument();
  });

  it("still propagates form edits to the parent so the PDF keeps regenerating", async () => {
    makeLocalStorageNull();

    const handleInvoiceDataChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <InvoiceForm
          invoiceData={getInitialInvoiceData()}
          handleInvoiceDataChange={handleInvoiceDataChange}
        />
      </TooltipProvider>,
    );

    fireEvent.change(screen.getByTestId("notes"), {
      target: { value: NOTES },
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(handleInvoiceDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ notes: NOTES }),
    );
  });

  it("propagates form edits to the parent when localStorage works (control)", async () => {
    const handleInvoiceDataChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <InvoiceForm
          invoiceData={getInitialInvoiceData()}
          handleInvoiceDataChange={handleInvoiceDataChange}
        />
      </TooltipProvider>,
    );

    fireEvent.change(screen.getByTestId("notes"), {
      target: { value: NOTES },
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(handleInvoiceDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ notes: NOTES }),
    );
  });
});
