import { describe, expect, it } from "vitest";

import type { InvoiceData, InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";

import { getCustomColumnsInPdf } from "../custom-column";

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return {
    ...MOCK_INVOICE_ITEM_DATA,
    typeOfGTU: "",
    extraCustomColumnValues: [],
    ...overrides,
  };
}

function getColumns({
  items,
  customColumnLabel = "",
  extraCustomColumns = [],
}: GetColumnsArgs) {
  return getCustomColumnsInPdf({
    items,
    customColumnLabel,
    extraCustomColumns,
  });
}

describe("getCustomColumnsInPdf", () => {
  describe("the first column", () => {
    it("is left out right after it is added: switched on, no name, no value", () => {
      expect(
        getColumns({ items: [createItem({ typeOfGTUFieldIsVisible: true })] }),
      ).toEqual([]);
    });

    it("ignores a name or value that is only whitespace", () => {
      expect(
        getColumns({
          items: [
            createItem({ typeOfGTUFieldIsVisible: true, typeOfGTU: "  " }),
          ],
          customColumnLabel: "  ",
        }),
      ).toEqual([]);
    });

    it("prints once it has a name", () => {
      expect(
        getColumns({
          items: [createItem({ typeOfGTUFieldIsVisible: true })],
          customColumnLabel: "Project code",
        }),
      ).toEqual([{ position: 0, label: "Project code", values: [""] }]);
    });

    it("prints once any item has a value, even an unnamed older column", () => {
      expect(
        getColumns({
          items: [
            createItem({ typeOfGTUFieldIsVisible: true }),
            createItem({ typeOfGTU: " GTU_01 " }),
          ],
        }),
      ).toEqual([{ position: 0, label: "", values: ["", "GTU_01"] }]);
    });

    it("is left out when the switch is off, whatever it holds", () => {
      expect(
        getColumns({
          items: [
            createItem({
              typeOfGTUFieldIsVisible: false,
              typeOfGTU: "ACME-24",
            }),
          ],
          customColumnLabel: "Project code",
        }),
      ).toEqual([]);
    });
  });

  describe("further columns", () => {
    it("print after the first, in order, each with its own values", () => {
      expect(
        getColumns({
          items: [
            createItem({
              typeOfGTUFieldIsVisible: true,
              typeOfGTU: "ACME-24",
              extraCustomColumnValues: ["SKU-1", "PO-9"],
            }),
            createItem({ extraCustomColumnValues: ["SKU-2"] }),
          ],
          customColumnLabel: "Project code",
          extraCustomColumns: [
            { label: "SKU", isVisible: true },
            { label: "PO line", isVisible: true },
          ],
        }),
      ).toEqual([
        { position: 0, label: "Project code", values: ["ACME-24", ""] },
        { position: 1, label: "SKU", values: ["SKU-1", "SKU-2"] },
        { position: 2, label: "PO line", values: ["PO-9", ""] },
      ]);
    });

    it("print even while the first column is left out, keeping their position", () => {
      expect(
        getColumns({
          items: [
            createItem({
              typeOfGTUFieldIsVisible: false,
              extraCustomColumnValues: ["SKU-1"],
            }),
          ],
          extraCustomColumns: [{ label: "SKU", isVisible: true }],
        }),
      ).toEqual([{ position: 1, label: "SKU", values: ["SKU-1"] }]);
    });

    it("are left out when switched off, or with neither a name nor a value", () => {
      expect(
        getColumns({
          items: [
            createItem({
              typeOfGTUFieldIsVisible: false,
              extraCustomColumnValues: ["SKU-1", ""],
            }),
          ],
          extraCustomColumns: [
            { label: "SKU", isVisible: false },
            { label: " ", isVisible: true },
          ],
        }),
      ).toEqual([]);
    });

    it("read a missing or null value, from a sparse array or a share link, as empty", () => {
      const sparseValues: string[] = [];
      sparseValues[1] = "PO-9";

      expect(
        getColumns({
          items: [
            createItem({
              typeOfGTUFieldIsVisible: false,
              extraCustomColumnValues: sparseValues,
            }),
            createItem({
              extraCustomColumnValues: [null as unknown as string],
            }),
          ],
          extraCustomColumns: [
            { label: "SKU", isVisible: true },
            { label: "PO line", isVisible: true },
          ],
        }),
      ).toEqual([
        { position: 1, label: "SKU", values: ["", ""] },
        { position: 2, label: "PO line", values: ["PO-9", ""] },
      ]);
    });
  });
});

interface GetColumnsArgs {
  items: InvoiceItemData[];
  customColumnLabel?: string;
  extraCustomColumns?: InvoiceData["extraCustomColumns"];
}
