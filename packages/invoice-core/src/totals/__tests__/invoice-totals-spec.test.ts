import { describe, expect, it } from "vitest";

import { MOCK_INVOICE_ITEM_DATA } from "../../__tests__/fixtures/invoice-data";
import type { InvoiceItemData } from "../../schema";
import { calculateInvoiceTotal } from "../calculate-invoice-total";
import { calculateItemTotals } from "../calculate-item-totals";

/**
 * The scenarios of the `invoice-totals` capability (openspec change `backend-split`,
 * `specs/invoice-totals/spec.md`), one test each. The free form, the dashboard editor and
 * every backend write path rely on these exact numbers.
 */

function item(overrides: Partial<InvoiceItemData>): InvoiceItemData {
  return { ...MOCK_INVOICE_ITEM_DATA, ...overrides };
}

describe("item amounts are derived from quantity, price and VAT", () => {
  it("numeric VAT rate: 3 x 10.005 at 23% gives 30.02 / 6.9 / 36.92", () => {
    const totals = calculateItemTotals(
      item({ amount: 3, netPrice: 10.005, vat: "23" }),
    );

    expect(totals).toMatchObject({
      netAmount: 30.02,
      vatAmount: 6.9,
      preTaxAmount: 36.92,
    });
  });

  it.each(["NP", "OO"])(
    "non-numeric VAT code %s: no VAT, pre-tax equals net",
    (vat) => {
      const totals = calculateItemTotals(
        item({ amount: 2, netPrice: 12.5, vat }),
      );

      expect(totals).toMatchObject({
        netAmount: 25,
        vatAmount: 0,
        preTaxAmount: 25,
      });
    },
  );

  it.each([
    { label: "empty quantity", amount: "" as unknown as number, netPrice: 10 },
    { label: "invalid quantity", amount: Number.NaN, netPrice: 10 },
    { label: "empty price", amount: 3, netPrice: "" as unknown as number },
    { label: "invalid price", amount: 3, netPrice: Number.NaN },
  ])("$label counts as 0", ({ amount, netPrice }) => {
    const totals = calculateItemTotals(item({ amount, netPrice, vat: "23" }));

    expect(totals).toMatchObject({
      netAmount: 0,
      vatAmount: 0,
      preTaxAmount: 0,
    });
  });
});

describe("invoice total is the sum of item pre-tax amounts", () => {
  it("several items: 36.92 + 12.3 gives 49.22", () => {
    expect(
      calculateInvoiceTotal([{ preTaxAmount: 36.92 }, { preTaxAmount: 12.3 }]),
    ).toBe(49.22);
  });

  it("a non-finite amount contributes 0 and the total stays finite", () => {
    const total = calculateInvoiceTotal([
      { preTaxAmount: 36.92 },
      { preTaxAmount: Number.POSITIVE_INFINITY },
      { preTaxAmount: "1e999" as unknown as number },
    ]);

    expect(total).toBe(36.92);
    expect(Number.isFinite(total)).toBe(true);
  });
});
