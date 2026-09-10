import { useRef, useState, type RefObject } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

/**
 * How much of an item name the dialog shows before truncating.
 */
const MAX_ITEM_NAME_PREVIEW_LENGTH = 60;

export interface ItemPendingDeletion {
  /** Index of the item in the `items` field array. */
  index: number;
  /**
   * The item's name as it read when the user pressed delete. Captured then, rather than
   * watched, so the dialog names the item the user is actually looking at and keeps naming
   * it while the dialog animates closed.
   */
  name: string | undefined;
}

interface DeleteInvoiceItemDialogProps {
  /** The item awaiting confirmation, or `null` while the dialog is closed. */
  itemPendingDeletion: ItemPendingDeletion | null;
  /** Closes the dialog (cancel, Escape, overlay click, or after a confirmed delete). */
  onClose: () => void;
  /** Removes the item at the given index. */
  onConfirm: (index: number) => void;
  /** The "Add invoice item" button, where focus lands after a confirmed delete. */
  addItemButtonRef: RefObject<HTMLButtonElement | null>;
  /** The trash button that opened the dialog, where focus lands after a cancel. */
  deleteTriggerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * A confirmation dialog for deleting an invoice item.
 */
export function DeleteInvoiceItemDialog({
  itemPendingDeletion,
  onClose,
  onConfirm,
  addItemButtonRef,
  deleteTriggerRef,
}: DeleteInvoiceItemDialogProps) {
  // Radix keeps the content mounted until its exit animation finishes, so rendering straight
  // from `itemPendingDeletion` would blank the dialog out mid-fade. Hold on to the last item
  // and keep showing it on the way out ("storing information from previous renders").
  const [lastItem, setLastItem] = useState(itemPendingDeletion);

  if (itemPendingDeletion !== null && itemPendingDeletion !== lastItem) {
    setLastItem(itemPendingDeletion);
  }

  const didConfirmRef = useRef(false);

  const item = itemPendingDeletion ?? lastItem;

  if (!item) return null;

  const itemLabel = `Item ${item.index + 1}`;
  const namePreview = toItemNamePreview(item.name);

  return (
    <AlertDialog
      open={itemPendingDeletion !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent
        data-testid="delete-invoice-item-confirmation-dialog"
        // Radix hands focus back to its `Trigger`, but this dialog is controlled rather than
        // triggered, so there is no trigger to hand it to and focus would land on `<body>`.
        // Place it ourselves: back on the trash button after a cancel, and -- since that
        // button has just been unmounted along with its item -- on "Add invoice item" after
        // a confirmed delete.
        onCloseAutoFocus={(event) => {
          event.preventDefault();

          const didConfirm = didConfirmRef.current;
          didConfirmRef.current = false;

          const trigger = deleteTriggerRef.current;
          const focusTarget =
            !didConfirm && trigger?.isConnected
              ? trigger
              : addItemButtonRef.current;

          focusTarget?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription className="text-balance">
            {namePreview ? (
              <>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                  &quot;{namePreview}&quot;
                </strong>{" "}
                will be removed from this invoice, and the totals recalculated.
              </>
            ) : (
              <>
                {itemLabel} has no name yet. It will be removed from this
                invoice, and the totals recalculated.
              </>
            )}{" "}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              didConfirmRef.current = true;
              onConfirm(item.index);
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            Delete {itemLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Item names allow up to 500 characters across multiple lines (the field is a `<textarea>`),
 * but the dialog only has room to identify the item. Collapse the whitespace and cut it short.
 *
 * Returns an empty string when the item has no usable name.
 */
function toItemNamePreview(itemName: string | undefined) {
  const collapsed = itemName?.replaceAll(/\s+/g, " ").trim() ?? "";

  return collapsed.length > MAX_ITEM_NAME_PREVIEW_LENGTH
    ? `${collapsed.slice(0, MAX_ITEM_NAME_PREVIEW_LENGTH).trimEnd()}…`
    : collapsed;
}
