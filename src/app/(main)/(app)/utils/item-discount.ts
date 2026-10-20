import type {
  InvoiceItemData,
  SupportedNumberFormatLocale,
} from "@/app/schema";

import { formatAmount } from "./format-amount";

/** Whether the item has a discount that takes money off its line. */
export function hasItemDiscount(item: Pick<InvoiceItemData, "discountAmount">) {
  return item.discountAmount > 0;
}

/** Whether any item on the invoice has a discount. */
export function hasAnyItemDiscount(
  items: ReadonlyArray<Pick<InvoiceItemData, "discountAmount">>,
) {
  return items.some((item) => {
    return hasItemDiscount(item);
  });
}

/**
 * The line before its discount (quantity * net price), derived from the stored totals so
 * it always adds up with them: `netAmount` is already the line after the discount.
 */
export function getItemAmountBeforeDiscount(
  item: Pick<InvoiceItemData, "netAmount" | "discountAmount">,
) {
  return Number((item.netAmount + item.discountAmount).toFixed(2));
}

interface FormatDiscountPercentParams {
  /** The percentage, e.g. `12.5` for 12.5% off. */
  value: number;
  /** The invoice's number format, already resolved against its language. */
  numberFormatLocale: SupportedNumberFormatLocale;
}

/**
 * A percentage discount in the invoice's number format, so it matches the amounts around
 * it: "12.5%" in English, "12,5%" in Polish or German.
 */
export function formatDiscountPercent({
  value,
  numberFormatLocale,
}: FormatDiscountPercentParams) {
  const formattedValue = formatAmount({
    amount: value,
    numberFormatLocale,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formattedValue}%`;
}
