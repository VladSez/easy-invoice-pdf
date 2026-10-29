// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useWatch } from "react-hook-form";
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
    },
  };
});

vi.mock("@/hooks/use-media-query", () => {
  return {
    useIsDesktop: () => {
      return true;
    },
  };
});

import { GeneralInformation } from "../general-information";

/** Frozen "now" for the whole suite: 15 September 2026. */
const NOW = new Date("2026-09-15T10:00:00.000Z");

/** A date of issue in the past, so the "not today" helper is rendered. */
const STALE_DATE_OF_ISSUE = "2026-06-10";

interface HarnessProps {
  language?: SupportedLanguages;
  dateFormat?: InvoiceData["dateFormat"];
  dateOfIssue?: string;
  /** Left out by default, like an invoice that has never picked a number format. */
  numberFormatLocale?: InvoiceData["numberFormatLocale"];
  preserveNumberFormatOnLanguageChange?: InvoiceData["preserveNumberFormatOnLanguageChange"];
  template?: InvoiceData["template"];
  paymentDue?: string;
  dateOfService?: string;
  dateOfServiceStart?: string;
  invoiceNumberValue?: string;
  servicePeriodFieldIsVisible?: boolean;
  dateOfServiceFieldIsVisible?: boolean;
  dateOfServiceLabelText?: string;
}

function GeneralInformationHarness({
  language = "en",
  dateFormat = "MMMM D, YYYY",
  dateOfIssue = STALE_DATE_OF_ISSUE,
  numberFormatLocale,
  preserveNumberFormatOnLanguageChange,
  template = "default",
  paymentDue,
  dateOfService,
  dateOfServiceStart,
  invoiceNumberValue,
  servicePeriodFieldIsVisible = true,
  dateOfServiceFieldIsVisible = true,
  dateOfServiceLabelText,
}: HarnessProps) {
  const initialInvoiceData = getInitialInvoiceData();

  const { control, setValue } = useForm<InvoiceData>({
    defaultValues: {
      ...initialInvoiceData,
      language,
      dateFormat,
      dateOfIssue,
      numberFormatLocale,
      preserveNumberFormatOnLanguageChange,
      template,
      ...(paymentDue ? { paymentDue } : {}),
      ...(dateOfService ? { dateOfService } : {}),
      ...(dateOfServiceStart ? { dateOfServiceStart } : {}),
      servicePeriodFieldIsVisible,
      dateOfServiceFieldIsVisible,
      ...(dateOfServiceLabelText ? { dateOfServiceLabelText } : {}),
      ...(invoiceNumberValue
        ? {
            invoiceNumberObject: {
              ...initialInvoiceData.invoiceNumberObject,
              value: invoiceNumberValue,
            },
          }
        : {}),
    },
  });

  // The real parent feeds the live form value back in, so the helper texts react
  // to `setValue` the same way they do in the app.
  const currentDateOfIssue = useWatch({ control, name: "dateOfIssue" });
  const currentPaymentDue = useWatch({ control, name: "paymentDue" });
  const currentTopLineColor = useWatch({ control, name: "stripeTopLineColor" });

  return (
    <TooltipProvider delayDuration={0}>
      <GeneralInformation
        control={control}
        errors={{}}
        setValue={setValue}
        dateOfIssue={currentDateOfIssue}
        isMobile={false}
      />
      <output data-testid="payment-due-readout">{currentPaymentDue}</output>
      <output data-testid="top-line-color-readout">
        {currentTopLineColor ?? "unset"}
      </output>
    </TooltipProvider>
  );
}

function renderGeneralInformation(props: HarnessProps = {}) {
  return render(<GeneralInformationHarness {...props} />);
}

function getSetDateOfIssueToTodayButton() {
  return screen.getByRole("button", { name: /set date of issue to today/i });
}

function getNumberFormatSelect() {
  return screen.getByLabelText("Number Format");
}

function getPreserveNumberFormatSwitch() {
  return screen.getByTestId("preserveNumberFormatOnLanguageChange");
}

async function selectInvoiceLanguage({
  user,
  language,
}: {
  user: ReturnType<typeof userEvent.setup>;
  language: SupportedLanguages;
}) {
  await user.selectOptions(
    screen.getByLabelText("Invoice PDF Language"),
    language,
  );
}

describe("GeneralInformation date helper texts", () => {
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

  describe('"Set date of issue to today"', () => {
    it("is hidden when the date of issue is already today", () => {
      renderGeneralInformation({ dateOfIssue: "2026-09-15" });

      expect(
        screen.queryByRole("button", { name: /set date of issue to today/i }),
      ).not.toBeInTheDocument();
    });

    it("renders today in English by default", () => {
      renderGeneralInformation({ language: "en" });

      expect(getSetDateOfIssueToTodayButton()).toHaveTextContent(
        "Use September 15, 2026",
      );
    });

    it.each([
      ["pl", "wrzesień 15, 2026"],
      ["de", "September 15, 2026"],
      ["es", "septiembre 15, 2026"],
      ["pt", "setembro 15, 2026"],
      ["ru", "сентябрь 15, 2026"],
      ["uk", "вересень 15, 2026"],
      ["fr", "septembre 15, 2026"],
      ["it", "settembre 15, 2026"],
      ["nl", "september 15, 2026"],
    ] as const)(
      "renders today in the invoice PDF language (%s)",
      (language, expectedDate) => {
        renderGeneralInformation({ language });

        expect(getSetDateOfIssueToTodayButton()).toHaveTextContent(
          `Use ${expectedDate}`,
        );
      },
    );

    it("honours the selected date format on top of the language", () => {
      renderGeneralInformation({ language: "pl", dateFormat: "D MMM YYYY" });

      expect(getSetDateOfIssueToTodayButton()).toHaveTextContent(
        "Use 15 wrz 2026",
      );
    });

    it("leaves a numeric date format identical across languages", () => {
      renderGeneralInformation({ language: "ru", dateFormat: "YYYY-MM-DD" });

      expect(getSetDateOfIssueToTodayButton()).toHaveTextContent(
        "Use 2026-09-15",
      );
    });

    it("sets the date of issue and keeps the payment term when clicked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // due 7 days after issue
      renderGeneralInformation({ paymentDue: "2026-06-17" });

      await user.click(getSetDateOfIssueToTodayButton());

      expect(screen.getByLabelText("Date of issue")).toHaveValue("2026-09-15");
      expect(screen.getByTestId("payment-due-readout")).toHaveTextContent(
        "2026-09-22",
      );
      expect(
        screen.queryByRole("button", { name: /set date of issue to today/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("payment due and the date of issue", () => {
    it("moves the payment due date along with the date of issue, keeping its term", () => {
      // due 30 days after issue
      renderGeneralInformation({ paymentDue: "2026-07-10" });

      // a date picker hands over the whole date at once
      fireEvent.change(screen.getByLabelText("Date of issue"), {
        target: { value: "2026-08-01" },
      });

      expect(screen.getByTestId("payment-due-readout")).toHaveTextContent(
        "2026-08-31",
      );
    });

    it("does not call a payment term other than 14 days out of date", () => {
      renderGeneralInformation({
        dateOfIssue: "2026-09-15",
        // due 7 days after issue
        paymentDue: "2026-09-22",
        dateOfServiceStart: "2026-09-01",
        dateOfService: "2026-09-30",
        invoiceNumberValue: "1/09-2026",
      });

      expect(
        screen.queryByTestId("out-of-date-dates-helper"),
      ).not.toBeInTheDocument();
    });
  });

  describe("out-of-date field warnings", () => {
    it("offers this month's invoice number and applies it", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation({ invoiceNumberValue: "1/10-2025" });

      const fixButton = screen.getByRole("button", {
        name: "Set invoice number to 1/09-2026",
      });
      expect(fixButton).toHaveTextContent("Use 1/09-2026");

      await user.click(fixButton);

      expect(
        screen.getByRole("textbox", { name: "Invoice number" }),
      ).toHaveValue("1/09-2026");
      expect(fixButton).not.toBeInTheDocument();
    });

    it("keeps the same short message for a date from last year", () => {
      renderGeneralInformation({ dateOfServiceStart: "2025-09-01" });

      const startField = screen
        .getByLabelText("Service period start")
        .closest("div");
      expect(startField).not.toBeNull();
      expect(
        within(startField as HTMLElement).getByText("Not current month"),
      ).toBeInTheDocument();
    });

    it("moves the service period to the current month", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation({
        dateOfServiceStart: "2026-08-01",
        dateOfService: "2026-08-31",
      });

      await user.click(
        screen.getByRole("button", {
          name: "Set service period start to September 1, 2026",
        }),
      );
      await user.click(
        screen.getByRole("button", {
          name: "Set service period end to September 30, 2026",
        }),
      );

      expect(screen.getByLabelText("Service period start")).toHaveValue(
        "2026-09-01",
      );
      expect(screen.getByLabelText("Service period end")).toHaveValue(
        "2026-09-30",
      );
      expect(screen.queryByText("Not current month")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Not end of current month"),
      ).not.toBeInTheDocument();
    });
  });

  describe("date format preview", () => {
    it("previews each format in English by default", () => {
      renderGeneralInformation({ language: "en" });

      expect(
        screen.getByRole("option", {
          name: "MMMM D, YYYY (September 15, 2026)",
        }),
      ).toBeInTheDocument();
    });

    it("previews each format in the invoice PDF language", () => {
      renderGeneralInformation({ language: "fr" });

      expect(
        screen.getByRole("option", {
          name: "MMMM D, YYYY (septembre 15, 2026)",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "D MMM YYYY (15 sept. 2026)" }),
      ).toBeInTheDocument();
    });

    it("previews a numeric format identically in every language", () => {
      renderGeneralInformation({ language: "uk" });

      expect(
        screen.getByRole("option", {
          name: "YYYY-MM-DD (2026-09-15) (default)",
        }),
      ).toBeInTheDocument();
    });
  });

  describe('"Keep number format when changing language" switch', () => {
    it("is off on an invoice that has never turned it on", () => {
      renderGeneralInformation();

      expect(getPreserveNumberFormatSwitch()).not.toBeChecked();
    });

    it("says under the switch what a language change does to the format", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation();

      expect(
        screen.getByText(
          "Changing the PDF language also changes the number format.",
        ),
      ).toBeInTheDocument();

      await user.click(getPreserveNumberFormatSwitch());

      expect(
        screen.getByText("Changing the PDF language keeps the number format."),
      ).toBeInTheDocument();
    });

    /**
     * No `aria-label` overriding it, so what a screen reader announces is the text on
     * screen -- which is what lets someone say "keep number format when changing language" to a
     * voice control tool and have it hit this switch (WCAG 2.5.3).
     */
    it("is named by its visible label", () => {
      renderGeneralInformation();

      expect(
        screen.getByRole("switch", {
          name: "Keep number format when changing language",
        }),
      ).toBe(getPreserveNumberFormatSwitch());
    });

    it("is toggled by its own visible label", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation();

      // the label is what a pointer lands on, so `htmlFor` has to reach the switch
      await user.click(
        screen.getByText("Keep number format when changing language"),
      );

      expect(getPreserveNumberFormatSwitch()).toBeChecked();
    });

    it("lets the number format follow the language while it is off", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation({ language: "en", numberFormatLocale: "en" });

      await selectInvoiceLanguage({ user, language: "pl" });

      expect(getNumberFormatSelect()).toHaveValue("pl");
    });

    it("keeps the picked number format across a language switch once it is on", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation({
        language: "en",
        numberFormatLocale: "international",
        preserveNumberFormatOnLanguageChange: true,
      });

      await selectInvoiceLanguage({ user, language: "pl" });

      expect(getNumberFormatSelect()).toHaveValue("international");
    });

    /**
     * The case the switch exists for. Nothing is stored, so the amounts on screen are
     * punctuated the way the language being left behind punctuates them -- switching
     * has to pin that language, or there would be nothing to preserve.
     */
    it("pins the previous language when no format was ever picked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation({ language: "de" });

      expect(getNumberFormatSelect()).toHaveValue("de");

      await user.click(getPreserveNumberFormatSwitch());
      await selectInvoiceLanguage({ user, language: "en" });

      expect(getNumberFormatSelect()).toHaveValue("de");
    });

    it("still moves the labels when the format is pinned", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation({
        language: "en",
        numberFormatLocale: "international",
        preserveNumberFormatOnLanguageChange: true,
      });

      await selectInvoiceLanguage({ user, language: "pl" });

      expect(screen.getByLabelText("Invoice number label")).toHaveValue(
        "Faktura nr:",
      );
      expect(getNumberFormatSelect()).toHaveValue("international");
    });
  });

  describe("stale dates banner", () => {
    it("renders the banner with dates in the invoice PDF language", () => {
      renderGeneralInformation({ language: "it" });

      const banner = screen.getByTestId("out-of-date-dates-helper");

      expect(banner).toBeVisible();
      expect(banner).toHaveTextContent("settembre 15, 2026");
    });
  });

  describe("payment terms", () => {
    it("marks the term the payment due date already matches", () => {
      renderGeneralInformation({
        dateOfIssue: "2026-09-15",
        paymentDue: "2026-09-29",
      });

      const terms = screen.getByRole("group", { name: /payment terms/i });

      expect(
        within(terms).getByRole("button", { name: "14 days" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Due 14 days after issue")).toBeInTheDocument();
    });

    it("moves the payment due date to the picked term", async () => {
      const user = userEvent.setup();
      renderGeneralInformation({
        dateOfIssue: "2026-09-15",
        paymentDue: "2026-09-29",
      });

      await user.click(screen.getByRole("button", { name: "30 days" }));

      expect(screen.getByTestId("payment-due-readout")).toHaveTextContent(
        "2026-10-15",
      );
      expect(screen.getByText("Due 30 days after issue")).toBeInTheDocument();
    });
  });

  describe("top line color", () => {
    it("is not offered on the default template", () => {
      renderGeneralInformation({ template: "default" });

      expect(screen.queryByText("Top line color")).not.toBeInTheDocument();
    });

    it("writes the picked color to the form on the Stripe template", async () => {
      const user = userEvent.setup();
      renderGeneralInformation({ template: "stripe" });

      expect(screen.getByTestId("top-line-color-readout")).toHaveTextContent(
        "unset",
      );

      await user.click(screen.getByRole("button", { name: "Emerald" }));

      expect(screen.getByTestId("top-line-color-readout")).toHaveTextContent(
        "#10b981",
      );
    });
  });

  describe('"Service period end" helper', () => {
    // the last day of the frozen month, so the end date carries no warning
    const END_OF_MONTH = "2026-09-30";

    it("mentions the date of sales on the default template", () => {
      renderGeneralInformation({
        template: "default",
        dateOfService: END_OF_MONTH,
      });

      expect(
        screen.getByLabelText("Service period end"),
      ).toHaveAccessibleDescription(
        "Also printed as “Date of sales/of executing the service”",
      );
    });

    it("quotes the date of sales label the PDF prints", () => {
      renderGeneralInformation({
        template: "default",
        dateOfService: END_OF_MONTH,
        dateOfServiceLabelText: "Date of delivery",
      });

      expect(
        screen.getByLabelText("Service period end"),
      ).toHaveAccessibleDescription("Also printed as “Date of delivery”");
    });

    it("says the date is printed only once while the service period is hidden", () => {
      renderGeneralInformation({
        template: "default",
        dateOfService: END_OF_MONTH,
        servicePeriodFieldIsVisible: false,
      });

      expect(
        screen.getByLabelText("Service period end"),
      ).toHaveAccessibleDescription(
        "Printed as “Date of sales/of executing the service”",
      );
    });

    it("is not shown while the date of sales is hidden from the PDF", () => {
      renderGeneralInformation({
        template: "default",
        dateOfService: END_OF_MONTH,
        dateOfServiceFieldIsVisible: false,
      });

      expect(
        screen.getByLabelText("Service period end"),
      ).not.toHaveAccessibleDescription();
    });

    it("gives way to the warning when the end date is not the end of the month", () => {
      renderGeneralInformation({
        template: "default",
        dateOfService: "2026-09-20",
      });

      expect(
        screen.getByRole("button", {
          name: "Set service period end to September 30, 2026",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Service period end"),
      ).not.toHaveAccessibleDescription();
    });

    it("is not shown on the Stripe template, which prints no date of sales", () => {
      renderGeneralInformation({
        template: "stripe",
        dateOfService: END_OF_MONTH,
      });

      expect(
        screen.getByLabelText("Service period end"),
      ).not.toHaveAccessibleDescription();
      expect(screen.queryByText(/printed as/i)).not.toBeInTheDocument();
    });
  });
});
