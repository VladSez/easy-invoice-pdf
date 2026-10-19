import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { MOCK_INVOICE_DATA } from "../../__tests__/fixtures/invoice-data";
import type { InvoiceData } from "../../schema";
import { formatDateWithLocale } from "../format-date-with-locale";
import {
  formatDateOfServiceEnd,
  formatServicePeriodRange,
} from "../format-service-period";

/**
 * The templates format every date with a per-call locale. The server renders invoices in
 * several languages in one process, and `renderToBuffer` awaits font loading before it lays
 * out the pages, so a global `dayjs.locale(...)` set by one render would leak into another.
 */
function invoice(language: InvoiceData["language"]): InvoiceData {
  return {
    ...MOCK_INVOICE_DATA,
    language,
    dateFormat: "D MMMM YYYY",
    dateOfServiceStart: "2024-03-01",
    dateOfService: "2024-03-20",
  };
}

describe("dates are formatted with a per-call locale", () => {
  it("prints the right month names when languages alternate", () => {
    const results = (["pl", "en", "de", "pl"] as const).map((language) => {
      return formatDateWithLocale({
        date: "2024-03-20",
        selectedDateFormat: "D MMMM YYYY",
        language,
      });
    });

    expect(results).toEqual([
      "20 marca 2024",
      "20 March 2024",
      "20 März 2024",
      "20 marca 2024",
    ]);
  });

  it("localises the service period in the invoice's own language", () => {
    expect(formatServicePeriodRange(invoice("pl"))).toBe(
      "1 marca 2024 – 20 marca 2024",
    );
    expect(formatDateOfServiceEnd(invoice("en"))).toBe("20 March 2024");
    expect(formatServicePeriodRange(invoice("de"))).toBe(
      "1 März 2024 – 20 März 2024",
    );
  });

  it("never changes dayjs's global locale", () => {
    const before = dayjs.locale();

    formatDateWithLocale({
      date: "2024-03-20",
      selectedDateFormat: "D MMMM YYYY",
      language: "pl",
    });
    formatServicePeriodRange(invoice("de"));

    expect(dayjs.locale()).toBe(before);
  });
});
