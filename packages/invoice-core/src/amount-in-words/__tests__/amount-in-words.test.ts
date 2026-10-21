import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SUPPORTED_INVOICE_PDF_LANGUAGES } from "../../schema";
import { getAmountInWords, getNumberFractionalPart } from "../amount-in-words";
import { MAX_SPELLABLE } from "../number-to-words";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {
    // keep the expected errors out of the test output
  });
});

afterEach(() => {
  consoleError.mockRestore();
});

/**
 * One known conversion per supported language.
 *
 * `getAmountInWords` no longer goes through `n2words`' runtime dispatcher — it indexes a
 * table of per-locale converters built at module scope, so a language wired to the wrong
 * import would still return a perfectly valid string. These expectations are the output of
 * the dispatcher it replaced, which is what makes a mis-wired locale fail here.
 */
const AMOUNT_IN_WORDS_BY_LANGUAGE = {
  en: "one thousand two hundred and thirty-four",
  pl: "tysiąc dwieście trzydzieści cztery",
  de: "eintausendzweihundertvierunddreißig",
  es: "mil doscientos treinta y cuatro",
  sv: "ettusentvåhundratrettiofyra",
  pt: "mil duzentos e trinta e quatro",
  "pt-BR": "mil duzentos e trinta e quatro",
  ru: "одна тысяча двести тридцать четыре",
  uk: "одна тисяча двiстi тридцять чотири",
  fr: "mille deux cent trente-quatre",
  it: "milleduecentotrentaquattro",
  nb: "ett tusen to hundre og trettifire",
  nl: "twaalfhonderd vierendertig",
} as const satisfies Record<
  (typeof SUPPORTED_INVOICE_PDF_LANGUAGES)[number],
  string
>;

describe("getAmountInWords", () => {
  it.each(SUPPORTED_INVOICE_PDF_LANGUAGES)(
    "converts 1234 in %s",
    (language) => {
      expect(getAmountInWords({ amount: 1234, language })).toBe(
        AMOUNT_IN_WORDS_BY_LANGUAGE[language],
      );
    },
  );

  it("covers every supported language", () => {
    expect(Object.keys(AMOUNT_IN_WORDS_BY_LANGUAGE).sort()).toEqual(
      [...SUPPORTED_INVOICE_PDF_LANGUAGES].sort(),
    );
  });

  it("floors the amount before converting", () => {
    expect(getAmountInWords({ amount: 42.99, language: "en" })).toBe(
      "forty-two",
    );
  });

  it("converts zero", () => {
    expect(getAmountInWords({ amount: 0, language: "en" })).toBe("zero");
  });

  it("returns a placeholder and logs the error for a negative amount", () => {
    expect(getAmountInWords({ amount: -1, language: "en" })).toBe("-/-");
    expect(consoleError).toHaveBeenCalledOnce();
  });

  /**
   * A sum past the largest scale word these languages carry is an ordinary invoice in a
   * currency like VND or IDR, so it falls back to the digits without the error log that
   * a genuine conversion bug earns.
   */
  describe("an amount above the spellable range", () => {
    it("prints digits, never exponential notation", () => {
      // `<input type="number">` accepts "1e21" as typed input, and `toString()` would turn
      // that back into "1e+21" on the invoice.
      expect(getAmountInWords({ amount: 1e21, language: "en" })).toBe(
        "1000000000000000000000",
      );
      expect(getAmountInWords({ amount: 1.234e22, language: "en" })).toBe(
        "12340000000000000000000",
      );
    });

    it("falls back to the digits", () => {
      expect(
        getAmountInWords({ amount: MAX_SPELLABLE + 1, language: "en" }),
      ).toBe(String(MAX_SPELLABLE + 1));
    });

    it("does not log an error", () => {
      getAmountInWords({ amount: MAX_SPELLABLE + 1, language: "en" });

      expect(consoleError).not.toHaveBeenCalled();
    });

    it("still spells out the largest amount it can", () => {
      expect(
        getAmountInWords({ amount: MAX_SPELLABLE, language: "en" }),
      ).toContain("nine hundred and ninety-nine billion");
    });
  });
});

describe("getNumberFractionalPart", () => {
  it("returns the cents as two digits", () => {
    expect(getNumberFractionalPart(123.45)).toBe("45");
    expect(getNumberFractionalPart(7.05)).toBe("05");
    expect(getNumberFractionalPart(10)).toBe("00");
  });

  it("returns a placeholder and logs the error for a negative total", () => {
    expect(getNumberFractionalPart(-1)).toBe("-/-");
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
