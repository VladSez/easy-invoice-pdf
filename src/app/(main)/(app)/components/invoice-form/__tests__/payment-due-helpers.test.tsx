// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
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
import type { InvoiceData, SupportedLanguages } from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

vi.mock("@sentry/nextjs", () => {
  return {
    captureException: vi.fn(),
  };
});

vi.mock("@/lib/umami-analytics-track-event", () => {
  return {
    umamiTrackEvent: vi.fn(),
  };
});

vi.mock("@/hooks/use-media-query", () => {
  return {
    useIsDesktop: () => {
      return true;
    },
  };
});

import { InvoiceForm } from "../index";

/** Frozen "now" for the whole suite: 15 September 2026. */
const NOW = new Date("2026-09-15T10:00:00.000Z");

const DATE_OF_ISSUE = "2026-09-15";

interface RenderOptions {
  language?: SupportedLanguages;
  dateFormat?: InvoiceData["dateFormat"];
  paymentDue: string;
}

function renderInvoiceForm({
  language = "en",
  dateFormat = "MMMM D, YYYY",
  paymentDue,
}: RenderOptions) {
  const invoiceData: InvoiceData = {
    ...getInitialInvoiceData(),
    language,
    dateFormat,
    dateOfIssue: DATE_OF_ISSUE,
    paymentDue,
  };

  return render(
    <TooltipProvider delayDuration={0}>
      <InvoiceForm
        invoiceData={invoiceData}
        handleInvoiceDataChange={vi.fn()}
      />
    </TooltipProvider>,
  );
}

function getSetPaymentDueButton() {
  return screen.getByRole("button", { name: /set payment due date to/i });
}

describe("payment due helper texts", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("is hidden when the payment due date is already 14 days after the issue date", () => {
    renderInvoiceForm({ paymentDue: "2026-09-29" });

    expect(
      screen.queryByRole("button", { name: /set payment due date to/i }),
    ).not.toBeInTheDocument();
  });

  describe('"Set payment due date to <date>"', () => {
    it("renders the suggested date in English by default", () => {
      renderInvoiceForm({ language: "en", paymentDue: "2026-09-20" });

      expect(getSetPaymentDueButton()).toHaveTextContent(
        "Set payment due date to September 29, 2026 (14 days from issue date)",
      );
    });

    it.each([
      ["pl", "wrzesień 29, 2026"],
      ["de", "September 29, 2026"],
      ["es", "septiembre 29, 2026"],
      ["pt", "setembro 29, 2026"],
      ["ru", "сентябрь 29, 2026"],
      ["uk", "вересень 29, 2026"],
      ["fr", "septembre 29, 2026"],
      ["it", "settembre 29, 2026"],
      ["nl", "september 29, 2026"],
    ] as const)(
      "renders the suggested date in the invoice PDF language (%s)",
      (language, expectedDate) => {
        renderInvoiceForm({ language, paymentDue: "2026-09-20" });

        expect(getSetPaymentDueButton()).toHaveTextContent(
          `Set payment due date to ${expectedDate} (14 days from issue date)`,
        );
      },
    );

    it("honours the selected date format on top of the language", () => {
      renderInvoiceForm({
        language: "pl",
        dateFormat: "D MMM YYYY",
        paymentDue: "2026-09-20",
      });

      expect(getSetPaymentDueButton()).toHaveTextContent(
        "Set payment due date to 29 wrz 2026 (14 days from issue date)",
      );
    });
  });

  describe('"Payment due date is before date of issue"', () => {
    it("renders the date of issue in the invoice PDF language", () => {
      renderInvoiceForm({ language: "fr", paymentDue: "2026-09-01" });

      expect(
        screen.getByText(
          /Payment due date is before date of issue \(septembre 15, 2026\)/,
        ),
      ).toBeVisible();
      expect(getSetPaymentDueButton()).toHaveTextContent(
        "Set payment due date to septembre 29, 2026 (14 days from issue date)",
      );
    });

    it("renders the date of issue in English by default", () => {
      renderInvoiceForm({ language: "en", paymentDue: "2026-09-01" });

      expect(
        screen.getByText(
          /Payment due date is before date of issue \(September 15, 2026\)/,
        ),
      ).toBeVisible();
    });
  });
});
