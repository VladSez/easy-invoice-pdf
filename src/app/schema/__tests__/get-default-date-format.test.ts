import { describe, expect, it } from "vitest";

import { formatDateWithLocale } from "@/app/(main)/(app)/utils/format-date-with-locale";
import {
  DEFAULT_DATE_FORMAT,
  getDefaultDateFormat,
  STRIPE_DEFAULT_DATE_FORMAT,
  SUPPORTED_LANGUAGES,
} from "@/app/schema";

/** A date whose day and month can never be confused for one another. */
const DATE = "2025-12-17";

describe("getDefaultDateFormat", () => {
  it.each(SUPPORTED_LANGUAGES)(
    "keeps the default template on ISO in %s, whatever the language",
    (language) => {
      expect(getDefaultDateFormat({ language, template: "default" })).toBe(
        DEFAULT_DATE_FORMAT,
      );
    },
  );

  it("keeps the Stripe template's month-first date in English", () => {
    expect(getDefaultDateFormat({ language: "en", template: "stripe" })).toBe(
      STRIPE_DEFAULT_DATE_FORMAT,
    );
  });

  it.each(
    SUPPORTED_LANGUAGES.filter((language) => {
      return language !== "en";
    }),
  )("leads the Stripe template's date with the day in %s", (language) => {
    const rendered = formatDateWithLocale({
      date: DATE,
      selectedDateFormat: getDefaultDateFormat({
        language,
        template: "stripe",
      }),
      language,
    });

    expect(rendered.startsWith("17")).toBe(true);
  });

  /**
   * The reason the non-English languages lead with the day is grammatical, not cosmetic:
   * dayjs picks the case of the month name from its position, so the month-first format
   * leaves the Slavic languages in the nominative ("grudzień 17, 2025").
   */
  it.each([
    ["pl", "17 grudnia 2025"],
    ["ru", "17 декабря 2025"],
    ["uk", "17 грудня 2025"],
    ["sv", "17 december 2025"],
  ] as const)("declines the month correctly in %s", (language, expected) => {
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
