import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import {
  formatDateWithLocale,
  formatTodayWithLocale,
} from "@/app/(app)/utils/format-date-with-locale";
import { SUPPORTED_LANGUAGES, type SupportedLanguages } from "@/app/schema";

const DATE = "2026-09-01";

/**
 * Expected rendering of {@link DATE} with the `MMMM D, YYYY` format in every
 * supported language. Typed as an exhaustive record, so adding a language to
 * `SUPPORTED_LANGUAGES` without registering its dayjs locale fails to compile here.
 */
const EXPECTED_LONG_DATE: Record<SupportedLanguages, string> = {
  en: "September 1, 2026",
  pl: "wrzesień 1, 2026",
  de: "September 1, 2026",
  es: "septiembre 1, 2026",
  pt: "setembro 1, 2026",
  ru: "сентябрь 1, 2026",
  uk: "вересень 1, 2026",
  fr: "septembre 1, 2026",
  it: "settembre 1, 2026",
  nl: "september 1, 2026",
};

describe("formatDateWithLocale", () => {
  it.each(SUPPORTED_LANGUAGES)(
    "formats a date in %s, so the locale is actually registered",
    (language) => {
      expect(
        formatDateWithLocale({
          date: DATE,
          selectedDateFormat: "MMMM D, YYYY",
          language,
        }),
      ).toBe(EXPECTED_LONG_DATE[language]);
    },
  );

  it("renders month names differently per language", () => {
    // Guards against the silent dayjs fallback: an unregistered locale keeps the
    // previous one, which would make every language render identically.
    const rendered = SUPPORTED_LANGUAGES.map((language) => {
      return formatDateWithLocale({
        date: DATE,
        selectedDateFormat: "D MMM YYYY",
        language,
      });
    });

    // "es"/"nl" both render "1 sep 2026", so the set is smaller than the list —
    // what matters is that we are not down to a single shared rendering.
    expect(new Set(rendered).size).toBeGreaterThan(1);
  });

  it("leaves numeric formats untouched across languages", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(
        formatDateWithLocale({
          date: DATE,
          selectedDateFormat: "YYYY-MM-DD",
          language,
        }),
      ).toBe(DATE);
    }
  });

  it("accepts a Dayjs instance as well as a string", () => {
    expect(
      formatDateWithLocale({
        date: dayjs(DATE).add(14, "days"),
        selectedDateFormat: "YYYY-MM-DD",
        language: "fr",
      }),
    ).toBe("2026-09-15");
  });

  it("does not change the global dayjs locale", () => {
    const globalLocaleBefore = dayjs.locale();

    formatDateWithLocale({
      date: DATE,
      selectedDateFormat: "MMMM D, YYYY",
      language: "pl",
    });

    expect(dayjs.locale()).toBe(globalLocaleBefore);
    expect(dayjs(DATE).format("MMMM")).toBe("September");
  });
});

describe("formatTodayWithLocale", () => {
  it("formats today in the given language", () => {
    const today = dayjs();

    expect(
      formatTodayWithLocale({
        selectedDateFormat: "MMMM D, YYYY",
        language: "it",
      }),
    ).toBe(today.locale("it").format("MMMM D, YYYY"));
  });

  it("uses today and not some other date", () => {
    expect(
      formatTodayWithLocale({
        selectedDateFormat: "YYYY-MM-DD",
        language: "en",
      }),
    ).toBe(dayjs().format("YYYY-MM-DD"));
  });
});
