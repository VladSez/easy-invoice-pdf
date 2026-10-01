import { describe, expect, it } from "vitest";

import {
  BLANK_INVOICE_PAGE_SIZES,
  renderBlankInvoicePdf,
} from "../blank-invoice-pdf";

/**
 * 3 header fields, 5 per party block, 4 per line item across 10 rows, 3 totals, and
 * payment details plus notes.
 */
const EXPECTED_FIELD_COUNT = 3 + 5 * 2 + 4 * 10 + 3 + 2;

describe("blank invoice template PDF", () => {
  it.each(BLANK_INVOICE_PAGE_SIZES)(
    "renders a one-page fillable PDF on %s paper",
    async (pageSize) => {
      const pdf = (await renderBlankInvoicePdf({ pageSize })).toString(
        "latin1",
      );

      expect(pdf.startsWith("%PDF-")).toBe(true);
      // one page: the layout must not spill onto a second sheet when printed
      expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(1);
      expect(pdf).toContain("/AcroForm");
      expect(pdf.match(/\/FT \/Tx/g)).toHaveLength(EXPECTED_FIELD_COUNT);
    },
    30_000,
  );
});
