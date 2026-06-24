import { describe, it, expect } from "vitest";
import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import {
  hasAnyItemTotalsChanged,
  hasItemTotalsChanged,
} from "../utils/has-item-totals-changed";

function createItem(overrides: Partial<InvoiceItemData> = {}) {
  return {
    ...MOCK_INVOICE_ITEM_DATA,
    ...overrides,
  } as const satisfies InvoiceItemData;
}

describe("hasItemTotalsChanged", () => {
  it("returns false when item totals match calculated values", () => {
    expect(hasItemTotalsChanged(createItem())).toBe(false);
  });

  it("returns true when netAmount is stale", () => {
    expect(
      hasItemTotalsChanged(
        createItem({
          netAmount: 999,
        }),
      ),
    ).toBe(true);
  });

  it("returns true when vatAmount is stale", () => {
    expect(
      hasItemTotalsChanged(
        createItem({
          vatAmount: 999,
        }),
      ),
    ).toBe(true);
  });

  it("returns true when preTaxAmount is stale", () => {
    expect(
      hasItemTotalsChanged(
        createItem({
          preTaxAmount: 999,
        }),
      ),
    ).toBe(true);
  });

  it("returns true when input fields changed but totals were not recalculated", () => {
    expect(
      hasItemTotalsChanged(
        createItem({
          amount: 5,
          netPrice: 100,
          vat: 23,
          netAmount: 201,
          vatAmount: 46.23,
          preTaxAmount: 247.23,
        }),
      ),
    ).toBe(true);
  });

  it("returns true when vat changed but totals were not recalculated", () => {
    expect(
      hasItemTotalsChanged(
        createItem({
          vat: 8,
          netAmount: 201,
          vatAmount: 46.23,
          preTaxAmount: 247.23,
        }),
      ),
    ).toBe(true);
  });
});

describe("hasAnyItemTotalsChanged", () => {
  it("returns false for empty array", () => {
    expect(hasAnyItemTotalsChanged([])).toBe(false);
  });

  it("returns false when all items are up to date", () => {
    expect(hasAnyItemTotalsChanged([createItem(), createItem()])).toBe(false);
  });

  it("returns true when one item in a multi-item array is stale", () => {
    expect(
      hasAnyItemTotalsChanged([createItem(), createItem({ netAmount: 999 })]),
    ).toBe(true);
  });

  it("returns true when all items are stale", () => {
    expect(
      hasAnyItemTotalsChanged([
        createItem({ netAmount: 999 }),
        createItem({ vatAmount: 999 }),
      ]),
    ).toBe(true);
  });
});
