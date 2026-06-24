import type { InvoiceItemData } from "@/app/schema";
import { calculateItemTotals } from "./calculate-item-totals";

/**
 * Check if calculated item totals (netAmount, vatAmount, preTaxAmount)
 * differ from existing item's values.
 *
 * @param item InvoiceItemData to check for changes
 * @returns true if any total value differs, false otherwise
 */
export function hasItemTotalsChanged(item: InvoiceItemData): boolean {
  const calculated = calculateItemTotals(item);

  return (
    calculated?.netAmount !== item.netAmount ||
    calculated?.vatAmount !== item.vatAmount ||
    calculated?.preTaxAmount !== item.preTaxAmount
  );
}

/**
 * Check if any item in array has changed totals (netAmount, vatAmount, preTaxAmount).
 *
 * If any item has changed totals, we need to recalculate the totals for all items.
 *
 * @param items Array of InvoiceItemData
 * @returns true if any item has changed totals, false otherwise
 */
export function hasAnyItemTotalsChanged(items: InvoiceItemData[]): boolean {
  return items.some(hasItemTotalsChanged);
}
