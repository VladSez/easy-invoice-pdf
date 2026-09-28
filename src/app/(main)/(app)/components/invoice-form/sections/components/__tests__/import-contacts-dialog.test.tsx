// @vitest-environment happy-dom

import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
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

  it("lists every filled-in field of a new or saved entry in a collapsed row", () => {
    const dialog = renderDialog({
      step: "preview",
      fileName: "backup.json",
      sellers: emptyResult({
        added: [
          sellerSchema.parse({
            name: "Acme",
            address: "1 Main",
            vatNo: "PL123",
            vatNoLabelText: "Tax no",
            email: "billing@acme.test",
            accountNumber: "DE89 3704",
            accountNumberFieldIsVisible: false,
          }),
        ],
      }),
      buyers: emptyResult({ duplicates: [GLOBEX] }),
    });

    const [acme, globex] = within(dialog).getAllByTestId(
      "import-preview-entry",
    );

    expect(acme).not.toHaveAttribute("open");

    expect(acme).toHaveTextContent("Tax noPL123");
    expect(acme).toHaveTextContent("Emailbilling@acme.test");
    expect(acme).toHaveTextContent(
      "Account NumberDE89 3704(hidden on invoice)",
    );
    expect(acme).not.toHaveTextContent("SWIFT/BIC");

    // A buyer has no bank fields, and empty optional fields are left out
    expect(globex).toHaveTextContent("Name");
    expect(globex).not.toHaveTextContent("Email");
  });

  it("lists both fields when the tax label matches another field's label", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const dialog = renderDialog({
      step: "preview",
      fileName: "backup.json",
      sellers: emptyResult({
        added: [
          sellerSchema.parse({
            name: "Acme",
            address: "1 Main",
            vatNo: "PL123",
            vatNoLabelText: "Email",
            email: "billing@acme.test",
          }),
        ],
      }),
      buyers: emptyResult(),
    });

    const acme = within(dialog).getByTestId("import-preview-entry");

    expect(acme).toHaveTextContent("EmailPL123");
    expect(acme).toHaveTextContent("Emailbilling@acme.test");
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
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

describe("ImportContactsDialog drop", () => {
  it("takes a file dropped anywhere, not only on the drop zone", () => {
    const onFileSelected = vi.fn();
    renderDropDialog({ state: { step: "choose" }, onFileSelected });

    const file = new File(["{}"], "backup.json");
    // Outside the dashed box: on the rules list, and on the page behind the dialog
    const targets = [
      screen.getByText("The invoice you’re working on isn’t touched."),
      document.body,
    ];

    for (const target of targets) {
      const drop = createEvent.drop(target, {
        dataTransfer: fileDataTransfer(file),
      });
      fireEvent(target, drop);

      // Cancelled, so the browser does not open the file in the tab
      expect(drop.defaultPrevented).toBe(true);
    }

    expect(onFileSelected).toHaveBeenCalledTimes(2);
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("leaves drops alone while closed", () => {
    renderDropDialog({ isOpen: false, state: { step: "choose" } });

    const drop = createEvent.drop(document.body, {
      dataTransfer: fileDataTransfer(new File(["{}"], "backup.json")),
    });
    fireEvent(document.body, drop);

    expect(drop.defaultPrevented).toBe(false);
  });

  it("cancels but ignores a file dropped after the choose step", () => {
    const onFileSelected = vi.fn();
    const states: ImportContactsDialogState[] = [
      {
        step: "preview",
        fileName: "backup.json",
        sellers: emptyResult({ added: [ACME] }),
        buyers: emptyResult(),
      },
      { step: "error", fileName: "broken.json", error: "Not JSON" },
    ];

    for (const state of states) {
      renderDropDialog({ state, onFileSelected });

      const drop = createEvent.drop(document.body, {
        dataTransfer: fileDataTransfer(new File(["{}"], "other.json")),
      });
      fireEvent(document.body, drop);

      // Still cancelled, so the browser does not navigate away to the file
      expect(drop.defaultPrevented).toBe(true);

      cleanup();
    }

    // A stray drop does not swap the file under review
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it("leaves drags that carry no file alone", () => {
    const onFileSelected = vi.fn();
    renderDropDialog({ state: { step: "choose" }, onFileSelected });

    const textDrag = { types: ["text/plain"], files: [] };

    fireEvent.dragEnter(document.body, { dataTransfer: textDrag });
    expect(getDropZone()).not.toHaveClass("border-slate-600");

    const drop = createEvent.drop(document.body, { dataTransfer: textDrag });
    fireEvent(document.body, drop);

    expect(drop.defaultPrevented).toBe(false);
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it("takes a Chromium file drag that lists only text/plain in its types", () => {
    const onFileSelected = vi.fn();
    renderDropDialog({ state: { step: "choose" }, onFileSelected });

    const file = new File(["{}"], "backup.json");
    // The file shows up only as an item of kind `file` (react-dropzone#1409)
    const dataTransfer = {
      types: ["text/plain"],
      items: [{ kind: "file" }],
      files: [file],
    };

    const drop = createEvent.drop(document.body, { dataTransfer });
    fireEvent(document.body, drop);

    expect(drop.defaultPrevented).toBe(true);
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("keeps the drop zone highlighted while the drag moves between elements", () => {
    renderDropDialog({ state: { step: "choose" } });

    const dataTransfer = fileDataTransfer(new File(["{}"], "backup.json"));
    const rule = screen.getByText(
      "The invoice you’re working on isn’t touched.",
    );

    fireEvent.dragEnter(document.body, { dataTransfer });
    expect(getDropZone()).toHaveClass("border-slate-600");

    // Into a child: WebKit fires the `dragleave` for the element being left with a null
    // `relatedTarget`, which must not read as leaving the window
    fireEvent.dragEnter(rule, { dataTransfer });
    fireEvent.dragLeave(document.body, { dataTransfer });
    expect(getDropZone()).toHaveClass("border-slate-600");

    // Out of the window
    fireEvent.dragLeave(rule, { dataTransfer });
    expect(getDropZone()).not.toHaveClass("border-slate-600");
  });

  it("clears the highlight when Firefox enters the same element twice", () => {
    renderDropDialog({ state: { step: "choose" } });

    const dataTransfer = fileDataTransfer(new File(["{}"], "backup.json"));

    fireEvent.dragEnter(document.body, { dataTransfer });
    fireEvent.dragEnter(document.body, { dataTransfer });
    fireEvent.dragLeave(document.body, { dataTransfer });

    expect(getDropZone()).not.toHaveClass("border-slate-600");
  });
});

interface RenderDropDialogOptions {
  /** Whether the dialog is open. */
  isOpen?: boolean;
  /** The dialog step to render. */
  state: ImportContactsDialogState;
  /** Receives the dropped file. */
  onFileSelected?: (file: File) => void;
}

function renderDropDialog({
  isOpen = true,
  state,
  onFileSelected = vi.fn(),
}: RenderDropDialogOptions) {
  render(
    <ImportContactsDialog
      isOpen={isOpen}
      onOpenChange={vi.fn()}
      state={state}
      onFileSelected={onFileSelected}
      onConfirm={vi.fn()}
    />,
  );
}

/** The `dataTransfer` of a drag carrying `file`, as the browser reports it. */
function fileDataTransfer(file: File) {
  return { types: ["Files"], files: [file] };
}

function getDropZone() {
  const label = screen.getByText("Drop a .json file here").closest("label");

  if (!label) {
    throw new Error("Drop zone not found");
  }

  return label;
}
