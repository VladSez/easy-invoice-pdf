import { assert, describe, expect, it } from "vitest";

import { invoiceSchema } from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

describe("invoiceSchema stripeTopLineColor", () => {
  it("leaves an invoice that never picked a color without one", () => {
    const result = invoiceSchema.safeParse({
      ...MOCK_INVOICE_DATA,
      stripeTopLineColor: undefined,
    });

    assert(result.success);
    expect(result.data.stripeTopLineColor).toBeUndefined();
  });

  it.each(["#635bff", "#E11D48"])("accepts the hex color %s", (color) => {
    const result = invoiceSchema.safeParse({
      ...MOCK_INVOICE_DATA,
      stripeTopLineColor: color,
    });

    assert(result.success);
    expect(result.data.stripeTopLineColor).toBe(color);
  });

  it.each(["#fa0", "635bff", "red", "#12345g", "rgb(0, 0, 0)"])(
    "rejects %s",
    (color) => {
      const result = invoiceSchema.safeParse({
        ...MOCK_INVOICE_DATA,
        stripeTopLineColor: color,
      });

      assert(!result.success);
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["stripeTopLineColor"] }),
        ]),
      );
    },
  );
});
