import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatCurrencyChunks,
} from "@/app/(main)/(app)/utils/format-currency";
import {
  SUPPORTED_INVOICE_PDF_LANGUAGES,
  SUPPORTED_NUMBER_FORMAT_LOCALES,
} from "@/app/schema";

const AMOUNT = 321_200;

// Spelled out by codepoint for the same reason as in `format-currency.tsx`: `oxfmt` turns
// `\uXXXX` escapes into literal characters, and these ones are invisible in a diff.
const NBSP = String.fromCodePoint(0x00_a0);
const EURO = String.fromCodePoint(0x20_ac);

/** U+202F NARROW NO-BREAK SPACE and U+2009 THIN SPACE, neither of which may survive. */
const NARROW_SPACES_REGEX = new RegExp(
  `[${String.fromCodePoint(0x20_2f)}${String.fromCodePoint(0x20_09)}]`,
);

describe("formatCurrency", () => {
  it("formats an amount in the given locale and currency", () => {
    expect(
      formatCurrency({
        amount: AMOUNT,
        currency: "USD",
        numberFormatLocale: "en",
      }),
    ).toBe("$321,200.00");

    expect(
      formatCurrency({
        amount: AMOUNT,
        currency: "EUR",
        numberFormatLocale: "de",
      }),
    ).toBe(`321.200,00${NBSP}${EURO}`);
  });

  it("falls back to 0.00 when the amount is not a number", () => {
    expect(
      formatCurrency({
        // @ts-expect-error — the runtime guard exists for data restored from localStorage/share links
        amount: undefined,
        currency: "EUR",
        numberFormatLocale: "fr",
      }),
    ).toBe(`0,00${NBSP}${EURO}`);
  });

  /**
   * French groups digits with U+202F NARROW NO-BREAK SPACE, which Open Sans (the default
   * template's font) has no glyph for — react-pdf emitted it in its Helvetica fallback, where
   * the byte renders as "/", so the invoice total read "321/200,00 €". See the note in
   * `format-currency.tsx`.
   */
  it("replaces narrow no-break spaces with regular no-break spaces in French", () => {
    const formatted = formatCurrency({
      amount: AMOUNT,
      currency: "EUR",
      numberFormatLocale: "fr",
    });

    expect(formatted).toBe(`321${NBSP}200,00${NBSP}${EURO}`);
    expect(formatted).not.toMatch(NARROW_SPACES_REGEX);
  });

  it.each(SUPPORTED_INVOICE_PDF_LANGUAGES)(
    "emits no narrow spaces for %s",
    (language) => {
      expect(
        formatCurrency({
          amount: AMOUNT,
          currency: "EUR",
          numberFormatLocale: language,
        }),
      ).not.toMatch(NARROW_SPACES_REGEX);
    },
  );

  /**
   * `international` belongs to no locale, so it is built from `en-US` -- symbol first --
   * with the grouping comma swapped for a no-break space, exactly as the default template's
   * bare amounts are.
   */
  it("groups the international format with a no-break space", () => {
    const formatted = formatCurrency({
      amount: AMOUNT,
      currency: "EUR",
      numberFormatLocale: "international",
    });

    expect(formatted).toBe(`${EURO}321${NBSP}200.00`);
    expect(formatted).not.toContain(",");
  });
});

describe("formatCurrencyChunks", () => {
  /**
   * The symbol rides along on the piece it sits next to, so a wrapped total can never leave
   * it stranded on a line of its own.
   */
  it("cuts at the thousands boundaries and keeps the symbol attached", () => {
    expect(
      formatCurrencyChunks({
        amount: 1_000_000,
        currency: "USD",
        numberFormatLocale: "en",
      }),
    ).toEqual(["$1,", "000,", "000.00"]);

    expect(
      formatCurrencyChunks({
        amount: 1_000_000,
        currency: "EUR",
        numberFormatLocale: "de",
      }),
    ).toEqual(["1.", "000.", `000,00${NBSP}${EURO}`]);
  });

  it.each(SUPPORTED_NUMBER_FORMAT_LOCALES)(
    "joins back up into the string %s prints",
    (numberFormatLocale) => {
      expect(
        formatCurrencyChunks({
          amount: AMOUNT,
          currency: "EUR",
          numberFormatLocale,
        }).join(""),
      ).toBe(
        formatCurrency({ amount: AMOUNT, currency: "EUR", numberFormatLocale }),
      );
    },
  );

  it("falls back to a single 0.00 when the currency is not one Intl knows", () => {
    expect(
      formatCurrencyChunks({
        // @ts-expect-error -- the runtime guard exists for data restored from localStorage/share links
        currency: "NOT_A_CURRENCY",
        amount: AMOUNT,
        numberFormatLocale: "en",
      }),
    ).toEqual(["0.00"]);
  });
});
