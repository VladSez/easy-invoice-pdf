import { assert, describe, expect, it } from "vitest";

import { MAX_INVOICE_ITEMS, invoiceSchema } from "@/app/schema";
import {
  MOCK_INVOICE_DATA,
  MOCK_INVOICE_ITEM_DATA,
} from "@/utils/__tests__/data";

function createInvoiceWithItemCount(itemCount: number) {
  return {
    ...MOCK_INVOICE_DATA,
    items: Array.from({ length: itemCount }, () => {
      return {
        ...MOCK_INVOICE_ITEM_DATA,
      };
    }),
  };
}

describe("invoiceSchema max invoice items", () => {
  it(`accepts invoices with up to ${MAX_INVOICE_ITEMS} items`, () => {
    const result = invoiceSchema.safeParse(
      createInvoiceWithItemCount(MAX_INVOICE_ITEMS),
    );

    expect(result.success).toBe(true);
  });

  it(`rejects invoices with more than ${MAX_INVOICE_ITEMS} items`, () => {
    const result = invoiceSchema.safeParse(
      createInvoiceWithItemCount(MAX_INVOICE_ITEMS + 1),
    );

    // `assert` fails the test and narrows the safeParse union in one step
    assert(!result.success);

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["items"],
          message: `Invoices support at most ${MAX_INVOICE_ITEMS} line items`,
        }),
      ]),
    );
  });
});
