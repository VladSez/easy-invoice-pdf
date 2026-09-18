// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
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
}

function GeneralInformationHarness({
  language = "en",
  dateFormat = "MMMM D, YYYY",
  dateOfIssue = STALE_DATE_OF_ISSUE,
  numberFormatLocale,
  preserveNumberFormatOnLanguageChange,
}: HarnessProps) {
  const { control, setValue } = useForm<InvoiceData>({
    defaultValues: {
      ...getInitialInvoiceData(),
      language,
      dateFormat,
      dateOfIssue,
      numberFormatLocale,
      preserveNumberFormatOnLanguageChange,
    },
  });

  // The real parent feeds the live form value back in, so the helper texts react
  // to `setValue` the same way they do in the app.
  const currentDateOfIssue = useWatch({ control, name: "dateOfIssue" });
  const currentPaymentDue = useWatch({ control, name: "paymentDue" });

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
  return screen.getByLabelText("Format");
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
        "Set date of issue to today (September 15, 2026)",
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
          `Set date of issue to today (${expectedDate})`,
        );
      },
    );

    it("honours the selected date format on top of the language", () => {
      renderGeneralInformation({ language: "pl", dateFormat: "D MMM YYYY" });

      expect(getSetDateOfIssueToTodayButton()).toHaveTextContent(
        "Set date of issue to today (15 wrz 2026)",
      );
    });

    it("leaves a numeric date format identical across languages", () => {
      renderGeneralInformation({ language: "ru", dateFormat: "YYYY-MM-DD" });

      expect(getSetDateOfIssueToTodayButton()).toHaveTextContent(
        "Set date of issue to today (2026-09-15)",
      );
    });

    it("sets the date of issue and the payment due date when clicked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation();

      await user.click(getSetDateOfIssueToTodayButton());

      expect(screen.getByLabelText("Date of Issue")).toHaveValue("2026-09-15");
      expect(screen.getByTestId("payment-due-readout")).toHaveTextContent(
        "2026-09-29",
      );
      expect(
        screen.queryByRole("button", { name: /set date of issue to today/i }),
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

  describe('"Keep format when language changes" switch', () => {
    it("is off on an invoice that has never turned it on", () => {
      renderGeneralInformation();

      expect(getPreserveNumberFormatSwitch()).not.toBeChecked();
    });

    /**
     * No `aria-label` overriding it, so what a screen reader announces is the text on
     * screen -- which is what lets someone say "keep format when language changes" to a
     * voice control tool and have it hit this switch (WCAG 2.5.3).
     */
    it("is named by its visible label", () => {
      renderGeneralInformation();

      expect(
        screen.getByRole("switch", {
          name: "Keep format when language changes",
        }),
      ).toBe(getPreserveNumberFormatSwitch());
    });

    it("is toggled by its own visible label", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderGeneralInformation();

      // the label is what a pointer lands on, so `htmlFor` has to reach the switch
      await user.click(screen.getByText("Keep format when language changes"));

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

      expect(screen.getByLabelText("Label")).toHaveValue("Faktura nr:");
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
});
