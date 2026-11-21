import { describe, expect, it } from "vitest";

import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";

import { getColumnSwitchesToCarry } from "../get-column-switches-to-carry";

function item(overrides: Partial<InvoiceItemData>): InvoiceItemData {
  return { ...MOCK_INVOICE_ITEM_DATA, ...overrides };
}

describe("getColumnSwitchesToCarry", () => {
  it("carries nothing when a later item is removed", () => {
    const items = [
      item({ name: "A" }),
      item({ name: "B" }),
      item({ name: "C" }),
    ];

    expect(getColumnSwitchesToCarry({ items, index: 1 })).toBeNull();
  });

  it("hands the first item's PDF column switches on when it is removed", () => {
    const items = [
      item({
        name: "A",
        unitFieldIsVisible: false,
        vatAmountFieldIsVisible: false,
        invoiceItemNumberIsVisible: false,
      }),
      item({ name: "B", unitFieldIsVisible: true }),
    ];

    const switches = getColumnSwitchesToCarry({ items, index: 0 });

    expect(switches).toMatchObject({
      unitFieldIsVisible: false,
      vatAmountFieldIsVisible: false,
      invoiceItemNumberIsVisible: false,
      nameFieldIsVisible: true,
    });
    // switches only, never the item's own values
    expect(switches).not.toHaveProperty("name");
  });

  it("carries nothing when the only item is removed", () => {
    expect(
      getColumnSwitchesToCarry({ items: [item({})], index: 0 }),
    ).toBeNull();
  });
});
