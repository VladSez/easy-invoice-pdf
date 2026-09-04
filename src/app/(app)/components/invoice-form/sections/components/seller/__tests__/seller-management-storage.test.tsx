// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
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

const originalDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

/** iOS in-app webviews (Telegram, Instagram, Facebook) expose `localStorage` as `null`. */
function makeLocalStorageNull() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      return null;
    },
  });
}

/**
 * A fresh module graph per test: the availability probe memoizes its answer for the
 * lifetime of the module, exactly as it does for the lifetime of a page load.
 */
async function importFreshSellerManagement() {
  vi.resetModules();

  const { SellerManagement } = await import("../seller-management");

  return SellerManagement;
}

afterEach(() => {
  cleanup();

  if (originalDescriptor) {
    Object.defineProperty(window, "localStorage", originalDescriptor);
  }

  vi.clearAllMocks();
});

interface RenderSellerManagementOptions {
  /** The component under test, imported fresh so it probes the current storage stub. */
  SellerManagement: Awaited<ReturnType<typeof importFreshSellerManagement>>;
}

function renderSellerManagement({
  SellerManagement,
}: RenderSellerManagementOptions) {
  return render(
    <TooltipProvider delayDuration={0}>
      <SellerManagement
        setValue={vi.fn()}
        invoiceData={getInitialInvoiceData()}
        selectedSellerId=""
        setSelectedSellerId={vi.fn()}
        isMobile={false}
      />
    </TooltipProvider>,
  );
}

describe("SellerManagement when localStorage is unavailable", () => {
  it("renders instead of crashing, and marks 'New Seller' unavailable", async () => {
    makeLocalStorageNull();

    const SellerManagement = await importFreshSellerManagement();

    expect(() => {
      return renderSellerManagement({ SellerManagement });
    }).not.toThrow();

    expect(screen.getByRole("button", { name: /new seller/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("leaves 'New Seller' enabled when storage works", async () => {
    const SellerManagement = await importFreshSellerManagement();

    renderSellerManagement({ SellerManagement });

    expect(screen.getByRole("button", { name: /new seller/i })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
  });
});
