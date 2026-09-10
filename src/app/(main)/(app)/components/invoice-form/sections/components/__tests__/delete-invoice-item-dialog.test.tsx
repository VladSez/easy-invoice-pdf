// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DeleteInvoiceItemDialog,
  type ItemPendingDeletion,
} from "../delete-invoice-item-dialog";
import "@testing-library/jest-dom/vitest";

interface DialogTestHarnessProps {
  item: ItemPendingDeletion;
  onConfirm?: (index: number) => void;
  onClose?: () => void;
}

/**
 * Mirrors how `InvoiceItems` drives the dialog: a trash button per item opens it, and an
 * "Add invoice item" button sits below the list as the post-delete focus target.
 */
function DialogTestHarness({
  item,
  onConfirm = vi.fn(),
  onClose,
}: DialogTestHarnessProps) {
  const addItemButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const [itemPendingDeletion, setItemPendingDeletion] =
    useState<ItemPendingDeletion | null>(null);

  return (
    <>
      <button
        type="button"
        ref={deleteTriggerRef}
        onClick={() => {
          return setItemPendingDeletion(item);
        }}
      >
        Delete Invoice Item {item.index + 1}
      </button>
      <button type="button" ref={addItemButtonRef}>
        Add invoice item
      </button>
      <DeleteInvoiceItemDialog
        itemPendingDeletion={itemPendingDeletion}
        onClose={() => {
          onClose?.();
          setItemPendingDeletion(null);
        }}
        onConfirm={onConfirm}
        addItemButtonRef={addItemButtonRef}
        deleteTriggerRef={deleteTriggerRef}
      />
    </>
  );
}

function getTriggerButton(itemNumber: number) {
  return screen.getByRole("button", {
    name: `Delete Invoice Item ${itemNumber}`,
  });
}

function getDialog() {
  return screen.getByRole("alertdialog");
}

describe("DeleteInvoiceItemDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders nothing until it is opened", () => {
    render(<DialogTestHarness item={{ index: 1, name: "Product A" }} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("names the item in the title, the description and the confirm button", async () => {
    const user = userEvent.setup();

    render(
      <DialogTestHarness item={{ index: 1, name: "Consulting retainer" }} />,
    );

    await user.click(getTriggerButton(2));

    const dialog = getDialog();

    expect(
      within(dialog).getByRole("heading", { name: "Delete Item 2?" }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      '"Consulting retainer" will be removed from this invoice, and the totals recalculated. This action cannot be undone.',
    );
    expect(
      within(dialog).getByRole("button", { name: "Delete Item 2" }),
    ).toBeInTheDocument();
  });

  describe("item name preview", () => {
    it("collapses newlines and repeated spaces onto one line", async () => {
      const user = userEvent.setup();

      render(
        <DialogTestHarness
          item={{ index: 0, name: "  Design\n\n  work   for   Q3  " }}
        />,
      );

      await user.click(getTriggerButton(1));

      expect(getDialog()).toHaveTextContent('"Design work for Q3"');
    });

    it("keeps a name that is exactly at the length limit intact", async () => {
      const user = userEvent.setup();
      const name = "x".repeat(60);

      render(<DialogTestHarness item={{ index: 0, name }} />);

      await user.click(getTriggerButton(1));

      expect(getDialog()).toHaveTextContent(`"${name}"`);
      expect(getDialog()).not.toHaveTextContent("…");
    });

    it("truncates a name one character past the limit", async () => {
      const user = userEvent.setup();

      render(<DialogTestHarness item={{ index: 0, name: "x".repeat(61) }} />);

      await user.click(getTriggerButton(1));

      expect(getDialog()).toHaveTextContent(`"${"x".repeat(60)}…"`);
    });

    it("truncates a name far past the limit, as the schema's 500 characters allows", async () => {
      const user = userEvent.setup();

      render(
        <DialogTestHarness
          item={{
            index: 1,
            name: `Senior backend engineering consultancy\n   retainer for Q3, ${"x".repeat(440)}`,
          }}
        />,
      );

      await user.click(getTriggerButton(2));

      expect(getDialog()).toHaveTextContent(
        '"Senior backend engineering consultancy retainer for Q3, xxxx…"',
      );
    });

    it("does not leave a dangling space before the ellipsis", async () => {
      const user = userEvent.setup();

      render(
        <DialogTestHarness
          item={{ index: 0, name: `${"x".repeat(59)} tail end` }}
        />,
      );

      await user.click(getTriggerButton(1));

      expect(getDialog()).toHaveTextContent(`"${"x".repeat(59)}…"`);
    });

    it.each([
      ["an undefined name", undefined],
      ["an empty name", ""],
      ["a whitespace-only name", "   \n  "],
    ])("falls back to the item number for %s", async (_label, name) => {
      const user = userEvent.setup();

      render(<DialogTestHarness item={{ index: 1, name }} />);

      await user.click(getTriggerButton(2));

      expect(getDialog()).toHaveTextContent(
        "Item 2 has no name yet. It will be removed from this invoice, and the totals recalculated. This action cannot be undone.",
      );
    });
  });

  describe("confirming and cancelling", () => {
    it("removes the item when the deletion is confirmed", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(
        <DialogTestHarness
          item={{ index: 2, name: "Product C" }}
          onConfirm={onConfirm}
        />,
      );

      await user.click(getTriggerButton(3));
      await user.click(screen.getByRole("button", { name: "Delete Item 3" }));

      expect(onConfirm).toHaveBeenCalledExactlyOnceWith(2);
    });

    it("keeps the item when the dialog is cancelled", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <DialogTestHarness
          item={{ index: 1, name: "Product B" }}
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );

      await user.click(getTriggerButton(2));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledOnce();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("closes without removing the item when dismissed with Escape", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(
        <DialogTestHarness
          item={{ index: 1, name: "Product B" }}
          onConfirm={onConfirm}
        />,
      );

      await user.click(getTriggerButton(2));
      await user.keyboard("{Escape}");

      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("focus handling", () => {
    it("autofocuses Cancel rather than the destructive action when it opens", async () => {
      const user = userEvent.setup();

      render(<DialogTestHarness item={{ index: 1, name: "Product B" }} />);

      await user.click(getTriggerButton(2));

      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    });

    it("returns focus to the button that opened it after a cancel", async () => {
      const user = userEvent.setup();

      render(<DialogTestHarness item={{ index: 1, name: "Product B" }} />);

      await user.click(getTriggerButton(2));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(getTriggerButton(2)).toHaveFocus();
    });

    it("moves focus to 'Add invoice item' after a confirmed delete, since the trigger goes away with its item", async () => {
      const user = userEvent.setup();

      render(<DialogTestHarness item={{ index: 1, name: "Product B" }} />);

      await user.click(getTriggerButton(2));
      await user.click(screen.getByRole("button", { name: "Delete Item 2" }));

      expect(
        screen.getByRole("button", { name: "Add invoice item" }),
      ).toHaveFocus();
    });
  });
});
