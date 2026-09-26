// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportIssuesDialog } from "@/app/(main)/(app)/components/invoice-form/sections/components/import-issues-dialog";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

function renderDialog(
  invalidEntries: Parameters<typeof ImportIssuesDialog>[0]["invalidEntries"],
) {
  render(
    <ImportIssuesDialog
      isOpen
      onOpenChange={vi.fn()}
      invalidEntries={invalidEntries}
    />,
  );

  return screen.getByTestId("import-issues-dialog");
}

describe("ImportIssuesDialog", () => {
  it("shows the entry as written in the file with the failing field highlighted", () => {
    const dialog = renderDialog([
      {
        party: "Seller",
        label: "“Acme”",
        entry: { name: "Acme", address: "1 Main St", email: "not-an-email" },
        issues: [{ field: "email", message: "Invalid email address" }],
      },
    ]);

    expect(
      within(dialog).getByRole("heading", { name: "1 entry was not imported" }),
    ).toBeVisible();
    expect(within(dialog).getByText("Seller “Acme”")).toBeVisible();
    expect(within(dialog).getByText(/"1 Main St"/)).toBeVisible();

    const invalidLines = dialog.querySelectorAll("[data-invalid-field]");

    expect(invalidLines).toHaveLength(1);
    expect(invalidLines[0]).toHaveAttribute("data-invalid-field", "email");
    expect(invalidLines[0]).toHaveTextContent(
      '"email": "not-an-email"↳ Invalid email address',
    );
  });

  it("adds a line for a required field the entry does not have", () => {
    const dialog = renderDialog([
      {
        party: "Buyer",
        label: "Entry #2",
        entry: { address: "No name" },
        issues: [
          {
            field: "name",
            message: "Invalid input: expected string, received undefined",
          },
        ],
      },
    ]);

    const missingLine = dialog.querySelector('[data-invalid-field="name"]');

    expect(missingLine).toHaveTextContent(
      '"name": missing↳ Invalid input: expected string, received undefined',
    );
  });

  it("shows a problem with the entry as a whole above its value", () => {
    const dialog = renderDialog([
      {
        party: "Buyer",
        label: "Entry #1",
        entry: "oops",
        issues: [
          { message: "Invalid input: expected object, received string" },
        ],
      },
      {
        party: "Seller",
        label: "Entry #3",
        entry: { name: "x".repeat(500), address: 1, vatNo: 2 },
        issues: [
          { field: "address", message: "Expected string" },
          { field: "vatNo", message: "Expected string" },
        ],
      },
    ]);

    expect(
      within(dialog).getByRole("heading", {
        name: "2 entries were not imported",
      }),
    ).toBeVisible();
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
