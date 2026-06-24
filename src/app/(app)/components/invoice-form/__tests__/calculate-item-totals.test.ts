import { describe, it, expect } from "vitest";
import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import { calculateItemTotals } from "../utils/calculate-item-totals";

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return {
    ...MOCK_INVOICE_ITEM_DATA,
    ...overrides,
  };
}

describe("calculateItemTotals", () => {
  describe("null / guard", () => {
    it("returns null when item is null", () => {
      expect(calculateItemTotals(null)).toBeNull();
    });
  });

  describe("basic net amount", () => {
    it("calculates netAmount as amount * netPrice", () => {
      const result = calculateItemTotals(
        createItem({ amount: 2, netPrice: 100.5, vat: 0 }),
      );

      expect(result?.netAmount).toBe(201);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(201);
    });

    it("coerces string amount and netPrice via Number()", () => {
      const result = calculateItemTotals(
        createItem({
          amount: "3" as unknown as number,
          netPrice: "10.50" as unknown as number,
          vat: 0,
        }),
      );

      expect(result?.netAmount).toBe(31.5);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(31.5);
    });

    it("falls back to 0 when amount is empty string", () => {
      const result = calculateItemTotals(
        createItem({
          amount: "" as unknown as number,
          netPrice: 100,
          vat: 0,
        }),
      );

      expect(result?.netAmount).toBe(0);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(0);
    });

    it("falls back to 0 when netPrice is empty string", () => {
      const result = calculateItemTotals(
        createItem({
          amount: 5,
          netPrice: "" as unknown as number,
          vat: 0,
        }),
      );

      expect(result?.netAmount).toBe(0);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(0);
    });

    it("falls back to 0 when amount and netPrice are invalid", () => {
      const result = calculateItemTotals(
        createItem({
          amount: "abc" as unknown as number,
          netPrice: "xyz" as unknown as number,
          vat: 0,
        }),
      );

      expect(result?.netAmount).toBe(0);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(0);
    });
  });

  describe("VAT — numeric rates", () => {
    it("calculates standard 23% VAT", () => {
      const result = calculateItemTotals(
        createItem({ amount: 2, netPrice: 100.5, vat: 23 }),
      );

      expect(result?.netAmount).toBe(201);
      expect(result?.vatAmount).toBe(46.23);
      expect(result?.preTaxAmount).toBe(247.23);
    });

    it("returns zero VAT for 0% rate as number", () => {
      const result = calculateItemTotals(
        createItem({ amount: 2, netPrice: 100, vat: 0 }),
      );

      expect(result?.netAmount).toBe(200);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(200);
    });

    it("returns zero VAT for 0% rate as string", () => {
      const result = calculateItemTotals(
        createItem({
          amount: 2,
          netPrice: 100,
          vat: "0" as unknown as number,
        }),
      );

      expect(result?.netAmount).toBe(200);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(200);
    });

    it("calculates 100% VAT", () => {
      const result = calculateItemTotals(
        createItem({ amount: 1, netPrice: 50, vat: 100 }),
      );

      expect(result?.netAmount).toBe(50);
      expect(result?.vatAmount).toBe(50);
      expect(result?.preTaxAmount).toBe(100);
    });

    it("accepts string numeric VAT", () => {
      const result = calculateItemTotals(
        createItem({
          amount: 2,
          netPrice: 100.5,
          vat: "23" as unknown as number,
        }),
      );

      expect(result?.netAmount).toBe(201);
      expect(result?.vatAmount).toBe(46.23);
      expect(result?.preTaxAmount).toBe(247.23);
    });

    it("accepts number VAT", () => {
      const result = calculateItemTotals(
        createItem({ amount: 1, netPrice: 100, vat: 23 }),
      );

      expect(result?.netAmount).toBe(100);
      expect(result?.vatAmount).toBe(23);
      expect(result?.preTaxAmount).toBe(123);
    });
  });

  describe("VAT — non-numeric / exempt codes", () => {
    it.each(["NP", "OO", "ZW", "EXEMPT"])(
      "returns zero VAT for exempt code %s",
      (vatCode) => {
        const result = calculateItemTotals(
          createItem({
            amount: 2,
            netPrice: 100,
            vat: vatCode as unknown as number,
          }),
        );

        expect(result?.netAmount).toBe(200);
        expect(result?.vatAmount).toBe(0);
        expect(result?.preTaxAmount).toBe(200);
      },
    );

    it("returns zero VAT for empty string vat", () => {
      const result = calculateItemTotals(
        createItem({
          amount: 2,
          netPrice: 100,
          vat: "" as unknown as number,
        }),
      );

      expect(result?.netAmount).toBe(200);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(200);
    });
  });

  describe("rounding", () => {
    it("rounds netAmount to two decimal places", () => {
      const result = calculateItemTotals(
        createItem({ amount: 3, netPrice: 33.33, vat: 0 }),
      );

      expect(result?.netAmount).toBe(99.99);
    });

    it("rounds vatAmount to two decimal places", () => {
      const result = calculateItemTotals(
        createItem({ amount: 3, netPrice: 33.33, vat: 7 }),
      );

      expect(result?.netAmount).toBe(99.99);
      expect(result?.vatAmount).toBe(7);
      expect(result?.preTaxAmount).toBe(106.99);
    });

    it("rounds preTaxAmount from sum of rounded net and vat amounts", () => {
      const result = calculateItemTotals(
        createItem({ amount: 1, netPrice: 10.005, vat: 23 }),
      );

      expect(result?.netAmount).toBe(10.01);
      expect(result?.vatAmount).toBe(2.3);
      expect(result?.preTaxAmount).toBe(12.31);
    });

    it("handles floating-point multiplication edge cases", () => {
      const result = calculateItemTotals(
        createItem({ amount: 0.1, netPrice: 0.2, vat: 23 }),
      );

      expect(result?.netAmount).toBe(0.02);
      expect(result?.vatAmount).toBe(0);
      expect(result?.preTaxAmount).toBe(0.02);
    });

    it("rounds awkward VAT percentage on large net amount", () => {
      const result = calculateItemTotals(
        createItem({ amount: 7, netPrice: 14.29, vat: 8.5 }),
      );

      expect(result?.netAmount).toBe(100.03);
      expect(result?.vatAmount).toBe(8.5);
      expect(result?.preTaxAmount).toBe(108.53);
    });
  });

  describe("field preservation", () => {
    it("preserves unrelated item fields", () => {
      const item = createItem({
        name: "Custom Product",
        unit: "kg",
        typeOfGTU: "GTU_12",
        nameFieldIsVisible: false,
        amount: 1,
        netPrice: 10,
        vat: 23,
      });

      const result = calculateItemTotals(item);

      expect(result?.name).toBe("Custom Product");
      expect(result?.unit).toBe("kg");
      expect(result?.typeOfGTU).toBe("GTU_12");
      expect(result?.nameFieldIsVisible).toBe(false);
      expect(result?.invoiceItemNumberIsVisible).toBe(true);
    });

    it("overwrites stale computed fields with recalculated values", () => {
      const result = calculateItemTotals(
        createItem({
          amount: 2,
          netPrice: 100.5,
          vat: 23,
          netAmount: 999,
          vatAmount: 999,
          preTaxAmount: 999,
        }),
      );

      expect(result?.netAmount).toBe(201);
      expect(result?.vatAmount).toBe(46.23);
      expect(result?.preTaxAmount).toBe(247.23);
    });
  });

  describe("integration-style case", () => {
    it("matches MOCK_INVOICE_ITEM_DATA expected totals", () => {
      const result = calculateItemTotals(createItem());

      expect(result?.netAmount).toBe(201);
      expect(result?.vatAmount).toBe(46.23);
      expect(result?.preTaxAmount).toBe(247.23);
    });

    it("returns full item shape with all original fields plus computed totals", () => {
      const item = createItem();
      const result = calculateItemTotals(item);

      expect(result).toEqual({
        ...item,
        netAmount: 201,
        vatAmount: 46.23,
        preTaxAmount: 247.23,
      });
    });
  });
});
