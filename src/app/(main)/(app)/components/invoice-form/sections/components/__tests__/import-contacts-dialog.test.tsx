// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ImportContactsDialog,
  type ImportContactsDialogState,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/import-contacts-dialog";
import type { MergeImportedContactsResult } from "@/app/(main)/(app)/utils/contacts-backup";
import {
  buyerSchema,
  sellerSchema,
  type BuyerData,
  type SellerData,
} from "@/app/schema";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

const ACME = sellerSchema.parse({ id: "1", name: "Acme", address: "1 Main" });
const GLOBEX = buyerSchema.parse({
  id: "2",
  name: "Globex",
  address: "2 Side",
});

function emptyResult<T extends SellerData | BuyerData>(
  overrides: Partial<MergeImportedContactsResult<T>> = {},
): MergeImportedContactsResult<T> {
  return {
    contacts: [],
    added: [],
    duplicates: [],
    invalidEntries: [],
    nameConflicts: [],
    ...overrides,
  };
}

function renderDialog(state: ImportContactsDialogState) {
  render(
    <ImportContactsDialog
      isOpen
      onOpenChange={vi.fn()}
      state={state}
      onFileSelected={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );

  return screen.getByTestId("import-contacts-dialog");
}

describe("ImportContactsDialog preview", () => {
  it("lists what will be added, skipped and cannot be imported", () => {
    const dialog = renderDialog({
      step: "preview",
      fileName: "backup.json",
      sellers: emptyResult({
        added: [ACME],
        nameConflicts: [
          {
            label: "Initech",
            entry: { name: "Initech", address: "Elsewhere" },
            issues: [
              {
                field: "name",
                message: "A seller with this name is already saved",
              },
            ],
          },
        ],
      }),
      buyers: emptyResult({ duplicates: [GLOBEX] }),
    });

    expect(
      within(dialog).getByRole("heading", { name: "Review import" }),
    ).toBeVisible();

    const sellers = within(dialog).getByRole("list", { name: "Sellers" });

    expect(sellers).toHaveTextContent("Acme1 MainNew");
    expect(sellers).toHaveTextContent("InitechElsewhereName taken");
    expect(
      within(dialog).getByRole("list", { name: "Buyers" }),
    ).toHaveTextContent("Globex2 SideAlready saved");

    expect(
      within(dialog).getByRole("button", { name: "Import 1 seller" }),
    ).toBeVisible();
  });

  it("shows the entry as written in the file with the failing field highlighted", () => {
    const dialog = renderDialog({
      step: "preview",
      fileName: "backup.json",
      sellers: emptyResult({
        invalidEntries: [
          {
            label: "Acme",
            entry: {
              name: "Acme",
              address: "1 Main St",
              email: "not-an-email",
            },
            issues: [{ field: "email", message: "Invalid email address" }],
          },
        ],
      }),
      buyers: emptyResult(),
    });

    expect(
      within(dialog).getByRole("heading", { name: "Nothing can be imported" }),
    ).toBeVisible();
    expect(within(dialog).getByText("1 problem")).toBeVisible();
    expect(within(dialog).getByText(/"1 Main St"/)).toBeVisible();

    const invalidLines = dialog.querySelectorAll("[data-invalid-field]");

    expect(invalidLines).toHaveLength(1);
    expect(invalidLines[0]).toHaveAttribute("data-invalid-field", "email");
    expect(invalidLines[0]).toHaveTextContent(
      '"email": "not-an-email"↳ Invalid email address',
    );

    // Nothing to add, so there is nothing to confirm
    expect(
      within(dialog).queryByRole("button", { name: /^Import/ }),
    ).not.toBeInTheDocument();
  });

  it("adds a line for a required field the entry does not have", () => {
    const dialog = renderDialog({
      step: "preview",
      fileName: "backup.json",
      sellers: emptyResult(),
      buyers: emptyResult({
        invalidEntries: [
          {
            label: "Entry #2",
            entry: { address: "No name" },
            issues: [{ field: "name", message: "Required" }],
          },
        ],
      }),
    });

    expect(
      dialog.querySelector('[data-invalid-field="name"]'),
    ).toHaveTextContent('"name": missing↳ Required');
  });

  it("shows a problem with the entry as a whole above its value", () => {
    const dialog = renderDialog({
      step: "preview",
      fileName: "backup.json",
      sellers: emptyResult({
        invalidEntries: [
          {
            label: "Entry #3",
            entry: { name: "x".repeat(500), address: 1, vatNo: 2 },
            issues: [
              { field: "address", message: "Expected string" },
              { field: "vatNo", message: "Expected string" },
            ],
          },
        ],
      }),
      buyers: emptyResult({
        invalidEntries: [
          {
            label: "Entry #1",
            entry: "oops",
            issues: [
              { message: "Invalid input: expected object, received string" },
            ],
          },
        ],
      }),
    });

    expect(
      within(dialog).getByText(
        "Invalid input: expected object, received string",
      ),
    ).toBeVisible();
    expect(within(dialog).getByText('"oops"')).toBeVisible();
    expect(within(dialog).getByText("2 problems")).toBeVisible();

    // Long values are cut short
    expect(dialog).toHaveTextContent(`"${"x".repeat(119)}…`);
  });
});
