import { describe, expect, it } from "vitest";
import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import {
  calculateInvoiceTotal,
  getSafeNumber,
} from "../utils/calculate-invoice-total";
import { parseValidatedInvoiceItems } from "../utils/validated-invoice-items";

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return {
    ...MOCK_INVOICE_ITEM_DATA,
    ...overrides,
  };
}

function createValidatedItems(items: InvoiceItemData[] = [createItem()]) {
  const result = parseValidatedInvoiceItems(items);

  if (!result.success) {
    throw new Error("Expected valid invoice items in test fixture");
  }

  return result.data;
}

describe("getSafeNumber", () => {
  it("returns the number when value is a finite number", () => {
    expect(getSafeNumber(42)).toBe(42);
    expect(getSafeNumber(0)).toBe(0);
    expect(getSafeNumber(-12.34)).toBe(-12.34);
  });

  it("coerces numeric strings to numbers", () => {
    expect(getSafeNumber("10.5")).toBe(10.5);
    expect(getSafeNumber("0")).toBe(0);
  });

  it("returns 0 for null and undefined", () => {
    expect(getSafeNumber(null)).toBe(0);
    expect(getSafeNumber(undefined)).toBe(0);
  });

  it("returns 0 for non-finite numbers", () => {
    expect(getSafeNumber(Number.NaN)).toBe(0);
    expect(getSafeNumber(Number.POSITIVE_INFINITY)).toBe(0);
    expect(getSafeNumber(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it("returns 0 for non-numeric values", () => {
    expect(getSafeNumber("")).toBe(0);
    expect(getSafeNumber("abc")).toBe(0);
    expect(getSafeNumber({})).toBe(0);
  });
});

describe("calculateInvoiceTotal", () => {
  it("returns 0 when there are no items", () => {
    expect(calculateInvoiceTotal(createValidatedItems([]))).toBe(0);
  });

  it("sums preTaxAmount from a single item", () => {
    expect(
      calculateInvoiceTotal(
        createValidatedItems([createItem({ preTaxAmount: 247.23 })]),
      ),
    ).toBe(247.23);
  });

  it("sums preTaxAmount across multiple items", () => {
    expect(
      calculateInvoiceTotal(
        createValidatedItems([
          createItem({ preTaxAmount: 100 }),
          createItem({ preTaxAmount: 50.5 }),
          createItem({ preTaxAmount: 12.25 }),
        ]),
      ),
    ).toBe(162.75);
  });

  it("rounds the total to two decimal places", () => {
    expect(
      calculateInvoiceTotal(
        createValidatedItems([
          createItem({ preTaxAmount: 10.005 }),
          createItem({ preTaxAmount: 10.005 }),
        ]),
      ),
    ).toBe(20.01);
  });

  // Note: the parse step, not `calculateInvoiceTotal`, is what turns string
  // amounts into numbers. These cases cover that parse -> total path end to end.
  it("sums string preTaxAmount once the parse step has coerced it", () => {
    expect(
      calculateInvoiceTotal(
        createValidatedItems([
          createItem({ preTaxAmount: "100.5" as unknown as number }),
          createItem({ preTaxAmount: "12.25" as unknown as number }),
        ]),
      ),
    ).toBe(112.75);

    expect(
      calculateInvoiceTotal(
        createValidatedItems([
          createItem({ preTaxAmount: 50 }),
          createItem({ preTaxAmount: "25.5" as unknown as number }),
          createItem({ preTaxAmount: "0" as unknown as number }),
        ]),
      ),
    ).toBe(75.5);
  });

  // `z.coerce.number().nonnegative()` accepts Infinity, so these reach
  // `calculateInvoiceTotal` through the real parse path and are the cases that
  // `getSafeNumber` actually exists to handle.
  it("treats a non-finite preTaxAmount that passed validation as 0", () => {
    expect(
      calculateInvoiceTotal(
        createValidatedItems([
          createItem({ preTaxAmount: 100 }),
          createItem({ preTaxAmount: Number.POSITIVE_INFINITY }),
        ]),
      ),
    ).toBe(100);
  });

  it("treats an overflowing numeric string as 0", () => {
    const validatedItems = createValidatedItems([
      createItem({ preTaxAmount: 100 }),
      createItem({ preTaxAmount: "1e999" as unknown as number }),
    ]);

    // the string overflows to Infinity during coercion, not to a parse error
    expect(validatedItems[1].preTaxAmount).toBe(Number.POSITIVE_INFINITY);
    expect(calculateInvoiceTotal(validatedItems)).toBe(100);
  });

  it("coerces string preTaxAmount when raw form values reach it", () => {
    // The totals effect passes raw `useWatch` items straight in, so this call
    // shape is the real one. `zodResolver` validates but never writes coerced
    // values back into form state, so nothing guarantees a number here - this
    // pins the guard that keeps a string from crashing the form.
    const rawFormItems = [
      { preTaxAmount: "10" },
      { preTaxAmount: "20" },
    ] as unknown as ReadonlyArray<Pick<InvoiceItemData, "preTaxAmount">>;

    // Without coercion, `0 + "10"` becomes `"010"`, then string concat continues
    // and `.toFixed` throws: TypeError: f.reduce(...).toFixed is not a function
    expect(() =>
      Number(
        rawFormItems
          .reduce((sum, item) => sum + item.preTaxAmount, 0)
          .toFixed(2),
      ),
    ).toThrow(TypeError);

    expect(calculateInvoiceTotal(rawFormItems)).toBe(30);
  });
});
