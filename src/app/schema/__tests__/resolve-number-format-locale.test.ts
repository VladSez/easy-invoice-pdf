import { describe, expect, it } from "vitest";

import {
  getNumberFormatLocaleAfterLanguageChange,
  resolveNumberFormatLocale,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
  invoiceSchema,
} from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

describe("resolveNumberFormatLocale", () => {
  it.each(SUPPORTED_INVOICE_PDF_LANGUAGES)(
    "follows the invoice language (%s) when there is no override",
    (language) => {
      expect(resolveNumberFormatLocale({ language })).toBe(language);
    },
  );

  it("uses the override when the invoice carries one", () => {
    expect(
      resolveNumberFormatLocale({
        language: "en",
        numberFormatLocale: "pl",
      }),
    ).toBe("pl");

    expect(
      resolveNumberFormatLocale({
        language: "de",
        numberFormatLocale: "international",
      }),
    ).toBe("international");
  });

  /**
   * The field is deliberately not `.default()`ed: an invoice only carries it once someone
   * has picked one, which keeps it out of every share link and every `localStorage` entry
   * that predates the setting.
   */
  it("is not stored on an invoice that never picked one", () => {
    const parsed = invoiceSchema.parse(MOCK_INVOICE_DATA);

    expect(parsed.numberFormatLocale).toBeUndefined();

    // the key is absent, not undefined, so it never reaches localStorage or a share link
    expect(Object.hasOwn(parsed, "numberFormatLocale")).toBe(false);
  });
});

describe("getNumberFormatLocaleAfterLanguageChange", () => {
  it("follows the new language when the format is not pinned", () => {
    expect(
      getNumberFormatLocaleAfterLanguageChange({
        previousLanguage: "en",
        nextLanguage: "pl",
        numberFormatLocale: "en",
      }),
    ).toBe("pl");

    // explicitly off reads the same as absent
    expect(
      getNumberFormatLocaleAfterLanguageChange({
        previousLanguage: "en",
        nextLanguage: "pl",
        numberFormatLocale: "en",
        preserveNumberFormatOnLanguageChange: false,
      }),
    ).toBe("pl");
  });

  it("follows the new language even when the invoice never picked a format", () => {
    expect(
      getNumberFormatLocaleAfterLanguageChange({
        previousLanguage: "en",
        nextLanguage: "de",
      }),
    ).toBe("de");
  });

  it("keeps the picked format when it is pinned", () => {
    expect(
      getNumberFormatLocaleAfterLanguageChange({
        previousLanguage: "en",
        nextLanguage: "pl",
        numberFormatLocale: "international",
        preserveNumberFormatOnLanguageChange: true,
      }),
    ).toBe("international");
  });

  /**
   * The case the flag exists for: nothing is stored, so the numbers on screen are written
   * in the language being left behind. Pinning has to name that language, or the format
   * would follow the new one and preserve nothing.
   */
  it("pins the previous language when the invoice never picked a format", () => {
    expect(
      getNumberFormatLocaleAfterLanguageChange({
        previousLanguage: "de",
        nextLanguage: "en",
        preserveNumberFormatOnLanguageChange: true,
      }),
    ).toBe("de");
  });
});
