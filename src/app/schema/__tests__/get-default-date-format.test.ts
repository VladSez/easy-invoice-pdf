import { describe, expect, it } from "vitest";

import { formatDateWithLocale } from "@/app/(main)/(app)/utils/format-date-with-locale";
import {
  DEFAULT_DATE_FORMAT,
  getDefaultDateFormat,
  STRIPE_DEFAULT_DATE_FORMAT,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";

/** A date whose day and month can never be confused for one another. */
const DATE = "2025-12-17";

describe("getDefaultDateFormat", () => {
  it.each(SUPPORTED_INVOICE_PDF_LANGUAGES)(
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
    SUPPORTED_INVOICE_PDF_LANGUAGES.filter((language) => {
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

  // The exact string each language renders -- including why the day has to lead, which is
  // grammatical rather than cosmetic -- is asserted for all of them in
  // `language-date-formats.test.ts`. Deliberately not repeated here: two copies of the same
  // expected strings only ever drift apart.
});
