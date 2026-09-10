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

import type { InvoiceData, SupportedLanguages } from "@/app/schema";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
    },
  };
});

import { StaleDatesBanner } from "../stale-dates-banner";

/** Frozen "now" for the whole suite: 15 September 2026, mid-month. */
const NOW = new Date("2026-09-15T10:00:00.000Z");

/** Every date below is stale relative to {@link NOW}. */
const STALE_PROPS = {
  dateOfIssue: "2026-06-10",
  dateOfService: "2026-06-30",
  dateOfServiceStart: "2026-06-01",
  invoiceNumberValue: "1/06-2026",
  // Not 14 days after the date of issue, so it counts as stale too.
  paymentDue: "2026-06-20",
  selectedDateFormat: "MMMM D, YYYY",
  isMobile: false,
};

function renderBanner({
  language = "en",
  setValue = vi.fn(),
  ...overrides
}: {
  language?: SupportedLanguages;
  setValue?: ReturnType<typeof vi.fn>;
} & Partial<typeof STALE_PROPS> = {}) {
  return render(
    <StaleDatesBanner
      {...STALE_PROPS}
      {...overrides}
      language={language}
      setValue={
        setValue as unknown as Parameters<
          typeof StaleDatesBanner
        >[0]["setValue"]
      }
    />,
  );
}

function getBanner() {
  return screen.getByTestId("out-of-date-dates-helper");
}

/** Field labels of the rendered rows, in DOM order. */
function getRowLabels() {
  return within(getBanner())
    .getAllByRole("row")
    .slice(1) // drop the header row
    .map((row) => {
      return within(row).getAllByRole("cell")[0].textContent;
    });
}

function getRow(label: string) {
  const cell = within(getBanner()).getByRole("cell", { name: label });
  const row = cell.closest("tr");

  if (!row) {
    throw new Error(`No row found for "${label}"`);
  }

  return row;
}

describe("StaleDatesBanner", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("lists every stale field, in the same order as the form", () => {
    renderBanner();

    expect(
      within(getBanner()).getByText("5 fields are out of date"),
    ).toBeVisible();

    // The banner walks the invoice in the same order as the fields do, and
    // service period start has to come above service period end so the two read
    // as a range rather than backwards.
    expect(getRowLabels()).toEqual([
      "Invoice number",
      "Date of issue",
      "Service period start",
      "Service period end",
      "Payment due",
    ]);
  });

  it("keeps service period start above service period end when they are the only stale fields", () => {
    renderBanner({
      dateOfIssue: "2026-09-15",
      paymentDue: "2026-09-29",
      invoiceNumberValue: "1/09-2026",
      dateOfServiceStart: "2026-08-31",
      dateOfService: "2026-08-31",
    });

    expect(getRowLabels()).toEqual([
      "Service period start",
      "Service period end",
    ]);
  });

  it("only lists the fields that are actually stale", () => {
    renderBanner({
      dateOfIssue: "2026-09-15",
      dateOfServiceStart: "2026-09-01",
      dateOfService: "2026-09-30",
      invoiceNumberValue: "1/09-2026",
      paymentDue: "2026-06-24",
    });

    expect(
      within(getBanner()).getByText("1 field is out of date"),
    ).toBeVisible();
    expect(getRow("Payment due")).toBeInTheDocument();
    expect(
      within(getBanner()).queryByRole("cell", { name: "Date of issue" }),
    ).not.toBeInTheDocument();
  });

  it("falls back to a placeholder when a date is not set", () => {
    renderBanner({ paymentDue: "" });

    expect(within(getRow("Payment due")).getByText("(not set)")).toBeVisible();
  });

  describe("localised dates", () => {
    it("renders both the old and the suggested date in English", () => {
      renderBanner({ language: "en" });

      const row = getRow("Date of issue");

      expect(within(row).getByText("June 10, 2026")).toBeVisible();
      expect(within(row).getByText("September 15, 2026")).toBeVisible();
    });

    it("renders both the old and the suggested date in the invoice PDF language", () => {
      renderBanner({ language: "fr" });

      const row = getRow("Date of issue");

      expect(within(row).getByText("juin 10, 2026")).toBeVisible();
      expect(within(row).getByText("septembre 15, 2026")).toBeVisible();
    });

    it.each([
      ["pl", "wrzesień 30, 2026"],
      ["de", "September 30, 2026"],
      ["es", "septiembre 30, 2026"],
      ["ru", "сентябрь 30, 2026"],
      ["uk", "вересень 30, 2026"],
      ["it", "settembre 30, 2026"],
      ["nl", "september 30, 2026"],
      ["pt", "setembro 30, 2026"],
    ] as const)(
      "renders the end-of-month suggestion in %s",
      (language, expected) => {
        renderBanner({ language });

        expect(
          within(getRow("Service period end")).getByText(expected),
        ).toBeVisible();
      },
    );

    it("respects the selected date format on top of the language", () => {
      renderBanner({ language: "pl", selectedDateFormat: "D MMM YYYY" });

      expect(
        within(getRow("Date of issue")).getByText("15 wrz 2026"),
      ).toBeVisible();
    });

    it("leaves a numeric date format identical across languages", () => {
      renderBanner({ language: "ru", selectedDateFormat: "YYYY-MM-DD" });

      expect(
        within(getRow("Date of issue")).getByText("2026-09-15"),
      ).toBeVisible();
    });

    it("keeps the invoice number suggestion language-independent", () => {
      renderBanner({ language: "ru" });

      expect(
        within(getRow("Invoice number")).getByText("1/09-2026"),
      ).toBeVisible();
    });
  });

  it("updates every stale date to the current month when clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const setValue = vi.fn();

    renderBanner({ setValue });

    await user.click(screen.getByRole("button", { name: /update all dates/i }));

    const calls = Object.fromEntries(setValue.mock.calls) as Record<
      keyof InvoiceData | "invoiceNumberObject.value",
      string
    >;

    expect(calls).toEqual({
      dateOfServiceStart: "2026-09-01",
      dateOfService: "2026-09-30",
      dateOfIssue: "2026-09-15",
      "invoiceNumberObject.value": "1/09-2026",
      paymentDue: "2026-09-29",
    });
  });
});
