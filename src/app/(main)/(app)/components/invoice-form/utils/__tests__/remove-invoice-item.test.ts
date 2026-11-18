import { describe, expect, it } from "vitest";

import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";

import { removeInvoiceItem } from "../remove-invoice-item";

function item(overrides: Partial<InvoiceItemData>): InvoiceItemData {
  return { ...MOCK_INVOICE_ITEM_DATA, ...overrides };
}

describe("removeInvoiceItem", () => {
  it("removes a later item and leaves the others as they were", () => {
    const items = [
      item({ name: "A" }),
      item({ name: "B" }),
      item({ name: "C" }),
    ];

    const result = removeInvoiceItem({ items, index: 1 });

    expect(
      result.map((it) => {
        return it.name;
      }),
    ).toEqual(["A", "C"]);
    expect(result[0]).toBe(items[0]);
    expect(result[1]).toBe(items[2]);
  });

  it("hands the first item's PDF column switches to the item that becomes first", () => {
    const items = [
      item({
        name: "A",
        unitFieldIsVisible: false,
        vatAmountFieldIsVisible: false,
        invoiceItemNumberIsVisible: false,
      }),
      item({ name: "B", unitFieldIsVisible: true }),
    ];

    const [first, ...rest] = removeInvoiceItem({ items, index: 0 });

    expect(rest).toHaveLength(0);
    expect(first.name).toBe("B");
    expect(first.unitFieldIsVisible).toBe(false);
    expect(first.vatAmountFieldIsVisible).toBe(false);
    expect(first.invoiceItemNumberIsVisible).toBe(false);
    expect(first.nameFieldIsVisible).toBe(true);
  });

  it("returns an empty list when the only item is removed", () => {
    expect(removeInvoiceItem({ items: [item({})], index: 0 })).toEqual([]);
  });
});
