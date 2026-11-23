import { describe, expect, it } from "vitest";

import type { InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";

import { isCustomColumnInPdf } from "../custom-column";

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return { ...MOCK_INVOICE_ITEM_DATA, typeOfGTU: "", ...overrides };
}

describe("isCustomColumnInPdf", () => {
  it("is false right after the column is added: switched on, no name, no value", () => {
    expect(
      isCustomColumnInPdf({
        items: [createItem({ typeOfGTUFieldIsVisible: true })],
        customColumnLabel: "",
      }),
    ).toBe(false);
  });

  it("ignores a name or value that is only whitespace", () => {
    expect(
      isCustomColumnInPdf({
        items: [createItem({ typeOfGTUFieldIsVisible: true, typeOfGTU: "  " })],
        customColumnLabel: "  ",
      }),
    ).toBe(false);
  });

  it("is true once the column has a name", () => {
    expect(
      isCustomColumnInPdf({
        items: [createItem({ typeOfGTUFieldIsVisible: true })],
        customColumnLabel: "Project code",
      }),
    ).toBe(true);
  });

  it("is true once any item has a value, even an unnamed older column", () => {
    expect(
      isCustomColumnInPdf({
        items: [
          createItem({ typeOfGTUFieldIsVisible: true }),
          createItem({ typeOfGTU: "GTU_01" }),
        ],
        customColumnLabel: "",
      }),
    ).toBe(true);
  });

  it("is false when the switch is off, whatever the column holds", () => {
    expect(
      isCustomColumnInPdf({
        items: [
          createItem({ typeOfGTUFieldIsVisible: false, typeOfGTU: "ACME-24" }),
        ],
        customColumnLabel: "Project code",
      }),
    ).toBe(false);
  });
});
