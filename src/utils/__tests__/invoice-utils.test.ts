import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SUPPORTED_LANGUAGES } from "@/app/schema";
import { MAX_SPELLABLE } from "@/utils/number-to-words";

import { getAmountInWords } from "../invoice.utils";

vi.mock("sonner", () => {
  return { toast: { error: vi.fn() } };
});

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
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
  pt: "mil duzentos e trinta e quatro",
  ru: "одна тысяча двести тридцать четыре",
  uk: "одна тисяча двiстi тридцять чотири",
  fr: "mille deux cent trente-quatre",
  it: "milleduecentotrentaquattro",
  nl: "twaalfhonderd vierendertig",
} as const satisfies Record<(typeof SUPPORTED_LANGUAGES)[number], string>;

describe("getAmountInWords", () => {
  it.each(SUPPORTED_LANGUAGES)("converts 1234 in %s", (language) => {
    expect(getAmountInWords({ amount: 1234, language })).toBe(
      AMOUNT_IN_WORDS_BY_LANGUAGE[language],
    );
  });

  it("covers every supported language", () => {
    expect(Object.keys(AMOUNT_IN_WORDS_BY_LANGUAGE).sort()).toEqual(
      [...SUPPORTED_LANGUAGES].sort(),
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

  it("returns a placeholder for a negative amount", () => {
    expect(getAmountInWords({ amount: -1, language: "en" })).toBe("-/-");
  });

  /**
   * A sum past the largest scale word these languages carry is an ordinary invoice in a
   * currency like VND or IDR, so it falls back to the digits without the error toast and
   * the Sentry report that a genuine conversion bug earns.
   */
  describe("an amount above the spellable range", () => {
    beforeEach(() => {
      vi.mocked(toast.error).mockClear();
      vi.mocked(Sentry.captureException).mockClear();
    });

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

    it("does not tell the visitor something went wrong", () => {
      getAmountInWords({ amount: MAX_SPELLABLE + 1, language: "en" });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it("does not report itself to Sentry", () => {
      getAmountInWords({ amount: MAX_SPELLABLE + 1, language: "en" });

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("still spells out the largest amount it can", () => {
      expect(
        getAmountInWords({ amount: MAX_SPELLABLE, language: "en" }),
      ).toContain("nine hundred and ninety-nine billion");
    });
  });
});
