import { describe, expect, it } from "vitest";

import {
  formatAmount,
  formatAmountChunks,
  formatAmountInWordsWithCurrency,
} from "@/app/(main)/(app)/utils/format-amount";
import {
  SUPPORTED_INVOICE_PDF_LANGUAGES,
  SUPPORTED_NUMBER_FORMAT_LOCALES,
} from "@/app/schema";

const AMOUNT = 321_200;

// Spelled out by codepoint for the same reason as in `format-currency.tsx`: `oxfmt` turns
// `\uXXXX` escapes into literal characters, and these ones are invisible in a diff.
const NBSP = String.fromCodePoint(0x00_a0);

/** U+202F NARROW NO-BREAK SPACE and U+2009 THIN SPACE, neither of which may survive. */
const NARROW_SPACES_REGEX = new RegExp(
  `[${String.fromCodePoint(0x20_2f)}${String.fromCodePoint(0x20_09)}]`,
);

describe("formatAmount", () => {
  it("writes the number the way the given locale does", () => {
    expect(formatAmount({ amount: AMOUNT, numberFormatLocale: "en" })).toBe(
      "321,200.00",
    );

    expect(formatAmount({ amount: AMOUNT, numberFormatLocale: "de" })).toBe(
      "321.200,00",
    );

    expect(formatAmount({ amount: AMOUNT, numberFormatLocale: "pl" })).toBe(
      `321${NBSP}200,00`,
    );
  });

  describe("international", () => {
    it("groups with a no-break space and marks the decimal with a dot", () => {
      const formatted = formatAmount({
        amount: AMOUNT,
        numberFormatLocale: "international",
      });

      expect(formatted).toBe(`321${NBSP}200.00`);

      /**
       * The templates used to group with a plain U+0020, which let a total wrap across
       * lines in a narrow column.
       */
      expect(formatted).not.toContain(" ");
      expect(formatted).not.toContain(",");
    });
  });

  /**
   * French groups digits with U+202F NARROW NO-BREAK SPACE, which Open Sans -- the default
   * template's font -- has no glyph for. See the note in `format-currency.tsx`.
   */
  it.each(SUPPORTED_INVOICE_PDF_LANGUAGES)(
    "emits no narrow spaces for %s",
    (language) => {
      expect(
        formatAmount({ amount: AMOUNT, numberFormatLocale: language }),
      ).not.toMatch(NARROW_SPACES_REGEX);
    },
  );

  it("prints quantities with the decimals the caller asks for", () => {
    expect(
      formatAmount({
        amount: 1.5,
        numberFormatLocale: "international",
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }),
    ).toBe("1.5");

    expect(
      formatAmount({
        amount: 2,
        numberFormatLocale: "de",
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }),
    ).toBe("2");
  });

  it("writes zero when the amount is not a finite number", () => {
    expect(
      formatAmount({
        // @ts-expect-error -- the runtime guard exists for data restored from localStorage/share links
        amount: undefined,
        numberFormatLocale: "international",
      }),
    ).toBe("0.00");

    expect(formatAmount({ amount: Number.NaN, numberFormatLocale: "de" })).toBe(
      "0,00",
    );
  });
});

describe("formatAmountChunks", () => {
  it("cuts the number at its thousands boundaries, separator and all", () => {
    expect(
      formatAmountChunks({ amount: 1_000_000_000, numberFormatLocale: "en" }),
    ).toEqual(["1,", "000,", "000,", "000.00"]);

    expect(
      formatAmountChunks({ amount: 1_000_000_000, numberFormatLocale: "de" }),
    ).toEqual(["1.", "000.", "000.", "000,00"]);

    expect(
      formatAmountChunks({
        amount: 1_000_000_000,
        numberFormatLocale: "international",
      }),
    ).toEqual([`1${NBSP}`, `000${NBSP}`, `000${NBSP}`, "000.00"]);
  });

  /**
   * The cut follows what `Intl` calls a group, not what the digits look like: German writes
   * both its grouping and its decimals with a `.`, and only the first of the two may break.
   */
  it("never cuts at the decimal separator", () => {
    expect(
      formatAmountChunks({ amount: 1234.56, numberFormatLocale: "de" }),
    ).toEqual(["1.", "234,56"]);

    expect(
      formatAmountChunks({
        amount: 1.234,
        numberFormatLocale: "en",
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }),
    ).toEqual(["1.234"]);
  });

  it("leaves a number with nothing to group in one piece", () => {
    expect(
      formatAmountChunks({ amount: 999, numberFormatLocale: "en" }),
    ).toEqual(["999.00"]);
  });

  it.each(SUPPORTED_NUMBER_FORMAT_LOCALES)(
    "joins back up into the string %s prints",
    (numberFormatLocale) => {
      expect(
        formatAmountChunks({ amount: AMOUNT, numberFormatLocale }).join(""),
      ).toBe(formatAmount({ amount: AMOUNT, numberFormatLocale }));
    },
  );

  it("writes zero when the amount is not a finite number", () => {
    expect(
      formatAmountChunks({ amount: Number.NaN, numberFormatLocale: "en" }),
    ).toEqual(["0.00"]);
  });
});

describe("formatAmountInWordsWithCurrency", () => {
  it("glues the currency to the fraction with a no-break space", () => {
    expect(
      formatAmountInWordsWithCurrency({
        amountInWords: "czternascie tysiecy dziewiecset siedemdziesiat cztery",
        currency: "EUR",
        fractionalPart: "00",
      }),
    ).toBe(
      `czternascie tysiecy dziewiecset siedemdziesiat cztery EUR${NBSP}00/100`,
    );
  });

  it("leaves the tail with no break opportunity in it", () => {
    // the regression this guards: with a plain U+0020 the totals column broke between the
    // currency and the fraction, stranding "00/100" alone on the line below
    const tail = formatAmountInWordsWithCurrency({
      amountInWords: "ten thousand",
      currency: "EUR",
      fractionalPart: "00",
    }).slice("ten thousand ".length);

    expect(tail).toBe(`EUR${NBSP}00/100`);
    expect(tail).not.toContain(" ");
    expect(tail).not.toMatch(NARROW_SPACES_REGEX);
  });

  it("keeps an ordinary space before the currency, so the prose can still wrap", () => {
    const formatted = formatAmountInWordsWithCurrency({
      amountInWords: "ten thousand",
      currency: "EUR",
      fractionalPart: "00",
    });

    expect(formatted.startsWith("ten thousand ")).toBe(true);
  });
});
