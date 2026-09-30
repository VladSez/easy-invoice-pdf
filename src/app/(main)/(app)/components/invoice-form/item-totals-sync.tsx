import { useEffect } from "react";
import {
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import type { InvoiceData, InvoiceItemData } from "@/app/schema";
import { debugLog } from "@/lib/debug-log";

import { calculateInvoiceTotal } from "./utils/calculate-invoice-total";
import { calculateItemTotals } from "./utils/calculate-item-totals";
import { hasAnyItemTotalsChanged } from "./utils/has-item-totals-changed";
import { parseValidatedInvoiceItems } from "./utils/validated-invoice-items";

interface ItemTotalsSyncProps {
  control: Control<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

/**
 * Keeps the invoice total and each item's computed amounts (net, VAT, pre-tax) in step
 * with the items. Renders nothing.
 *
 * It lives in its own component so that it is the only thing subscribed to the whole
 * `items` array. When `InvoiceForm` watched `items` itself, any change inside an item --
 * down to flipping a "Show in PDF" switch -- re-rendered the entire form in the same
 * task as the click, 60-90ms in development, and the switch's thumb and track fell out
 * of step while the main thread was busy.
 *
 * Why a component and not a hook: a hook has no render of its own, it runs inside the
 * component that calls it. `useWatch` in a `useItemTotalsSync()` called from
 * `InvoiceForm` would subscribe `InvoiceForm`, and every item change would re-render
 * the whole form again. A component is the smallest unit React re-renders on its own,
 * and this one renders `null`, so its re-render costs next to nothing.
 *
 * A hook would work only if it never re-rendered, e.g. by listening through
 * `control.subscribe` / `watch(callback)` instead of `useWatch`. That moves the totals
 * into the change callback, during the event, and makes the `setValue` -> callback
 * loop easier to miss, so the component, which keeps the logic in an effect, is the
 * simpler of the two.
 */
export function ItemTotalsSync({
  control,
  getValues,
  setValue,
}: ItemTotalsSyncProps) {
  const invoiceItems = useWatch({ control, name: "items" });

  // calculate totals and other values when invoice items change
  useEffect(() => {
    // Bail out while the user is mid-edit with input the schema rejects, so we
    // never turn half-typed values into totals and write them back. Clearing the
    // amount field to retype it would otherwise zero out the item's totals, and
    // a VAT of 500 would persist a bogus tax amount.
    // `zodResolver` does not do this for us: it populates `errors`, but form
    // state (and so `useWatch`) still holds the raw, unvalidated input.
    const validatedItemsResult = parseValidatedInvoiceItems(invoiceItems);

    if (!validatedItemsResult.success) {
      // Not reported to Sentry on purpose, and not a `console.error` either: this branch is
      // the expected state while someone is still typing (a cleared amount field, a
      // half-entered VAT), so it fires constantly and says nothing about a broken app.
      debugLog("Invalid items:", validatedItemsResult.error);

      return;
    }

    const total = calculateInvoiceTotal(invoiceItems);

    debugLog("[useEffect] recalculating totals because invoice items changed", {
      invoiceItems,
      validatedItemsResult,
      total,
    });

    // Update total first
    setTotalIfChanged({ getValues, setValue, total });

    // Skip rest of calculations if no items
    if (!invoiceItems?.length) return;

    // if no item totals changed (netAmount, vatAmount, preTaxAmount), skip the rest of the calculations
    if (!hasAnyItemTotalsChanged(invoiceItems)) return;

    // Only update if there are actual changes
    const updatedItems = invoiceItems
      .map((item) => {
        return calculateItemTotals(item);
      })
      .filter(Boolean) as InvoiceItemData[];

    // Batch updates
    updatedItems.forEach((item, index) => {
      setValue(`items.${index}`, item, {
        shouldValidate: false, // Prevent validation during intermediate updates
      });
    });
  }, [invoiceItems, getValues, setValue]);

  return null;
}

interface SetTotalIfChangedParams {
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  /** The total just calculated from the items. */
  total: number;
}

/**
 * Writes the invoice total only when it moved. Most item edits (a "Show in PDF" switch,
 * the item name) leave it as it is, and a validating `setValue` publishes new
 * `formState.errors`, which re-renders all of `InvoiceForm` -- the very re-render
 * `ItemTotalsSync` exists to keep off the root.
 */
function setTotalIfChanged({
  getValues,
  setValue,
  total,
}: SetTotalIfChangedParams) {
  if (getValues("total") === total) {
    return;
  }

  setValue("total", total, { shouldValidate: true });
}
