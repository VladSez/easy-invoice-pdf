import { assert, describe, expect, it } from "vitest";

import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";

import { parseValidatedInvoiceItems } from "../validated-invoice-items";

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return {
    ...MOCK_INVOICE_ITEM_DATA,
    ...overrides,
  };
}

describe("parseValidatedInvoiceItems", () => {
  it("accepts items that pass invoiceItemSchema", () => {
    const result = parseValidatedInvoiceItems([createItem()]);

    // `assert` both fails the test and narrows the safeParse union, so the
    // assertions below need no `if (!result.success) return` guard.
    assert(result.success);

    expect(result.data[0].preTaxAmount).toBe(
      MOCK_INVOICE_ITEM_DATA.preTaxAmount,
    );
  });

  it("coerces string amounts on the way through", () => {
    const result = parseValidatedInvoiceItems([
      createItem({ preTaxAmount: "247.23" as unknown as number }),
    ]);

    assert(result.success);

    expect(result.data[0].preTaxAmount).toBe(247.23);
  });

  // These are the states the gate exists for: `useWatch` fires on every
  // keystroke, so the totals effect sees them while the user is still typing.
  // Failing the parse is what stops bogus totals being written back.
  it("rejects an amount cleared mid-edit", () => {
    const result = parseValidatedInvoiceItems([
      createItem({ amount: "" as unknown as number }),
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects a VAT rate above the allowed range", () => {
    const result = parseValidatedInvoiceItems([createItem({ vat: 500 })]);

    expect(result.success).toBe(false);
  });

  it("rejects a negative calculated amount", () => {
    const result = parseValidatedInvoiceItems([
      createItem({ preTaxAmount: -1 }),
    ]);

    expect(result.success).toBe(false);
  });

  describe("discount", () => {
    it("accepts a percentage discount up to 100%", () => {
      const result = parseValidatedInvoiceItems([
        createItem({ discountType: "percentage", discountValue: 100 }),
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects a percentage discount above 100%", () => {
      const result = parseValidatedInvoiceItems([
        createItem({ discountType: "percentage", discountValue: 101 }),
      ]);

      assert(!result.success);

      expect(result.error.issues[0].path).toEqual([0, "discountValue"]);
    });

    it("rejects a fixed discount larger than the line", () => {
      // MOCK_INVOICE_ITEM_DATA: 2 x 100.50 = 201.00
      const result = parseValidatedInvoiceItems([
        createItem({ discountType: "amount", discountValue: 201.01 }),
      ]);

      assert(!result.success);

      expect(result.error.issues[0]).toMatchObject({
        path: [0, "discountValue"],
        message:
          "Discount must not exceed the line amount (Amount × Net Price)",
      });
    });

    it("accepts a fixed discount equal to the line", () => {
      const result = parseValidatedInvoiceItems([
        createItem({ discountType: "amount", discountValue: 201 }),
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects a negative discount", () => {
      const result = parseValidatedInvoiceItems([
        createItem({ discountValue: -5 }),
      ]);

      expect(result.success).toBe(false);
    });

    it("reads a cleared discount input as no discount", () => {
      const result = parseValidatedInvoiceItems([
        createItem({ discountValue: "" as unknown as number }),
      ]);

      assert(result.success);

      expect(result.data[0].discountValue).toBe(0);
    });

    it("fills in the discount fields for items saved before discounts existed", () => {
      const legacyItem = Object.fromEntries(
        Object.entries(createItem()).filter(([key]) => {
          return !key.startsWith("discount");
        }),
      );

      const result = parseValidatedInvoiceItems([legacyItem]);

      assert(result.success);

      expect(result.data[0]).toMatchObject({
        discountType: "percentage",
        discountValue: 0,
        discountLabel: "",
        discountAmount: 0,
      });
    });
  });
});
