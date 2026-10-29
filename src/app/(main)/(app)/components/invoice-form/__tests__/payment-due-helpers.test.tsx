// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  // the 7/14/30 day payment terms cover any other spacing, so only a due date that comes
  // before the issue date gets a button of its own
  it("is hidden when the payment due date is after the issue date but not 14 days after it", () => {
    renderInvoiceForm({ paymentDue: "2026-09-20" });

    expect(
      screen.queryByRole("button", { name: /set payment due date to/i }),
    ).not.toBeInTheDocument();
  });

  describe('"Set payment due date to <date>"', () => {
    it("renders the suggested date in English by default", () => {
      renderInvoiceForm({ language: "en", paymentDue: "2026-09-01" });

      expect(getSetPaymentDueButton()).toHaveTextContent(
        "Use September 29, 2026",
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
        renderInvoiceForm({ language, paymentDue: "2026-09-01" });

        expect(getSetPaymentDueButton()).toHaveTextContent(
          `Use ${expectedDate}`,
        );
      },
    );

    it("honours the selected date format on top of the language", () => {
      renderInvoiceForm({
        language: "pl",
        dateFormat: "D MMM YYYY",
        paymentDue: "2026-09-01",
      });

      expect(getSetPaymentDueButton()).toHaveTextContent("Use 29 wrz 2026");
    });
  });

  describe('"Before date of issue"', () => {
    it("sits under the payment due field", () => {
      renderInvoiceForm({ language: "en", paymentDue: "2026-09-01" });

      const paymentDueField = screen
        .getByLabelText("Payment due")
        .closest("div");
      expect(paymentDueField).not.toBeNull();
      expect(
        within(paymentDueField as HTMLElement).getByText(
          "Before date of issue",
        ),
      ).toBeVisible();
      expect(
        within(paymentDueField as HTMLElement).getByRole("button", {
          name: "Set payment due date to September 29, 2026 (14 days after issue)",
        }),
      ).toBeVisible();
    });

    it("offers the payment terms in place of a term to name", () => {
      renderInvoiceForm({ paymentDue: "2026-09-01" });

      expect(screen.getByText("Pick a payment term")).toBeVisible();
    });

    it("sets the payment due date to 14 days after issue when clicked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderInvoiceForm({ paymentDue: "2026-09-01" });

      await user.click(getSetPaymentDueButton());

      expect(screen.getByLabelText("Payment due")).toHaveValue("2026-09-29");
      expect(
        screen.queryByText("Before date of issue"),
      ).not.toBeInTheDocument();
    });
  });
});
