import { describe, expect, it } from "vitest";

import { formatDateWithLocale } from "@/app/(main)/(app)/utils/format-date-with-locale";
import {
  getDateFormatsForLanguage,
  getDefaultDateFormat,
  LANGUAGE_TO_LONG_DATE_FORMAT,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
} from "@/app/schema";

/** A date whose day and month can never be confused for one another. */
const DATE = "2025-12-17";

/**
 * The formats that spell out one language's punctuation. Named here as literals rather than
 * sniffed for, so this test fails loudly if a future format joins them without a rule.
 */
const LANGUAGE_SPECIFIC = [
  "D. MMMM YYYY",
  "D [de] MMMM [de] YYYY",
  "D MMMM YYYY [г.]",
  "D MMMM YYYY [р.]",
] as const;

describe("getDateFormatsForLanguage", () => {
  it.each(SUPPORTED_LANGUAGES)("offers %s its own long format", (language) => {
    expect(getDateFormatsForLanguage(language)).toContain(
      LANGUAGE_TO_LONG_DATE_FORMAT[language],
    );
  });

  /**
   * Spelled out per language rather than derived, so that pointing a language at a
   * different convention has to be restated here instead of passing silently.
   */
  it.each([
    ["en", []],
    ["pl", []],
    ["nl", []],
    ["fr", []],
    ["de", ["D. MMMM YYYY"]],
    ["it", []],
    ["nb", ["D. MMMM YYYY"]],
    ["pt", ["D [de] MMMM [de] YYYY"]],
    ["ru", ["D MMMM YYYY [г.]"]],
    ["es", ["D [de] MMMM [de] YYYY"]],
    ["sv", []],
    ["uk", ["D MMMM YYYY [р.]"]],
  ] as const)(
    "offers %s only the punctuation that belongs to it",
    (language, expected) => {
      const offered: readonly string[] = getDateFormatsForLanguage(language);

      expect(
        LANGUAGE_SPECIFIC.filter((format) => {
          return offered.includes(format);
        }),
      ).toEqual(expected);
    },
  );

  it("keeps every shared format available in every language", () => {
    const languageSpecific: readonly string[] = LANGUAGE_SPECIFIC;
    const shared = SUPPORTED_DATE_FORMATS.filter((format) => {
      return !languageSpecific.includes(format);
    });

    for (const language of SUPPORTED_LANGUAGES) {
      expect(getDateFormatsForLanguage(language)).toEqual(
        expect.arrayContaining([...shared]),
      );
    }
  });

  it("preserves the order of the full list", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const offered: readonly string[] = getDateFormatsForLanguage(language);

      expect(getDateFormatsForLanguage(language)).toEqual(
        SUPPORTED_DATE_FORMATS.filter((format) => {
          return offered.includes(format);
        }),
      );
    }
  });
});

describe("the Stripe default reads as a real date in every language", () => {
  it.each([
    ["de", "17. Dezember 2025"],
    ["es", "17 de diciembre de 2025"],
    ["pt", "17 de dezembro de 2025"],
    ["pl", "17 grudnia 2025"],
    ["ru", "17 декабря 2025 г."],
    ["uk", "17 грудня 2025 р."],
    ["sv", "17 december 2025"],
    ["nl", "17 december 2025"],
    ["fr", "17 décembre 2025"],
    ["it", "17 dicembre 2025"],
    ["nb", "17. desember 2025"],
    ["en", "December 17, 2025"],
  ] as const)("renders %s as the language writes it", (language, expected) => {
    expect(
      formatDateWithLocale({
        date: DATE,
        selectedDateFormat: getDefaultDateFormat({
          language,
          template: "stripe",
        }),
        language,
      }),
    ).toBe(expected);
  });
});
