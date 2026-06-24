import type { InvoiceItemData } from "@/app/schema";

/**
 * Calculates netAmount, vatAmount, and preTaxAmount for invoice item.
 *
 * - If item.vat is numeric (e.g. "23"), computes VAT as (netAmount * vat / 100).
 * - If item.vat is not a number (e.g. "NP", "OO"), sets vatAmount to 0.
 * - Rounds all computed amounts to two decimal places.
 *
 * @param item Invoice item to calculate totals for. Can be null.
 * @returns InvoiceItemData with totals, or null if input is null.
 */
export function calculateItemTotals(
  item: InvoiceItemData | null,
): InvoiceItemData | null {
  if (!item) return null;

  const amount = Number(item.amount) || 0;
  const netPrice = Number(item.netPrice) || 0;
  const calculatedNetAmount = amount * netPrice;
  const formattedNetAmount = Number(calculatedNetAmount.toFixed(2));

  let vatAmount = 0;

  // item.vat comes as a string, so we need to convert it to a number ("23" -> 23) to calculate the VAT amount
  // it also can be not a number (e.g. "NP", "OO", etc), in this case we don't calculate the VAT amount and set it to 0
  // If item.vat exists, check if numeric. If numeric, compute VAT as percent of net amount.
  // Else, leave vatAmount as 0.
  if (item?.vat) {
    // Try to convert vat value to number (e.g., "23" -> 23)
    const vatValue = Number(item.vat);

    // Number.isNaN(vatValue) false means it's a valid number, true means non-number like "NP"
    const isVatValueNumeric = !Number.isNaN(vatValue);

    if (isVatValueNumeric) {
      // Calculate VAT: net amount * (vat percentage / 100)
      vatAmount = (formattedNetAmount * vatValue) / 100;
    }
    // If vat is not numeric ("NP", "OO"), VAT stays 0
  }

  const formattedVatAmount = Number(vatAmount.toFixed(2));
  const formattedPreTaxAmount = Number(
    (formattedNetAmount + formattedVatAmount).toFixed(2),
  );

  return {
    ...item,
    netAmount: formattedNetAmount,
    vatAmount: formattedVatAmount,
    preTaxAmount: formattedPreTaxAmount,
  };
}
