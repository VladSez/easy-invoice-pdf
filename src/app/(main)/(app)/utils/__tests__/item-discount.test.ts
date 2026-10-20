import { describe, expect, it } from "vitest";

import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";

import {
  getItemAmountBeforeDiscount,
  formatDiscountPercent,
  hasAnyItemDiscount,
} from "../item-discount";

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return { ...MOCK_INVOICE_ITEM_DATA, ...overrides };
}

describe("hasAnyItemDiscount", () => {
  it("is false when no item has a discount amount", () => {
    expect(hasAnyItemDiscount([createItem(), createItem()])).toBe(false);
  });

  it("is true when one item has a discount amount", () => {
    expect(
      hasAnyItemDiscount([createItem(), createItem({ discountAmount: 1 })]),
    ).toBe(true);
  });
});

describe("getItemAmountBeforeDiscount", () => {
  it("adds the discount back onto the net amount", () => {
    expect(
      getItemAmountBeforeDiscount({ netAmount: 9000, discountAmount: 1000 }),
    ).toBe(10_000);
  });

  it("does not leak floating point noise", () => {
    expect(
      getItemAmountBeforeDiscount({ netAmount: 0.1, discountAmount: 0.2 }),
    ).toBe(0.3);
  });
});

describe("formatDiscountPercent", () => {
  it("writes the percentage in the invoice's number format", () => {
    expect(
      formatDiscountPercent({ value: 12.5, numberFormatLocale: "en" }),
    ).toBe("12.5%");
    expect(
      formatDiscountPercent({ value: 12.5, numberFormatLocale: "de" }),
    ).toBe("12,5%");
  });

  it("prints a whole percentage without decimals", () => {
    expect(formatDiscountPercent({ value: 10, numberFormatLocale: "pl" })).toBe(
      "10%",
    );
  });
});
