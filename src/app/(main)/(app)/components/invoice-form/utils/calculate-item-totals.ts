import { type InvoiceItemData, parseDiscountValue } from "@/app/schema";

/**
 * Calculates discountAmount, netAmount, vatAmount, and preTaxAmount for invoice item.
 *
 * - The discount comes off the line (amount * netPrice) before tax: a percentage of the
 *   line, or a fixed amount capped at the line, so netAmount never goes below 0.
 * - netAmount is the line after the discount, and VAT is calculated on it.
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

  // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- form inputs and shared URLs can hand these over as strings, the schema type says number
  const amount = Number(item.amount) || 0;
  // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- same as above
  const netPrice = Number(item.netPrice) || 0;
  const lineAmount = Number((amount * netPrice).toFixed(2));
  const discountAmount = calculateDiscountAmount({
    item,
    lineAmount,
  });
  const formattedNetAmount = Number((lineAmount - discountAmount).toFixed(2));

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
    discountAmount,
    netAmount: formattedNetAmount,
    vatAmount: formattedVatAmount,
    preTaxAmount: formattedPreTaxAmount,
  };
}

interface CalculateDiscountAmountParams {
  /** The item whose `discountType` and `discountValue` say what to take off. */
  item: InvoiceItemData;
  /** The line before the discount (amount * netPrice), rounded to two decimals. */
  lineAmount: number;
}

/**
 * The money an item's discount takes off its line, rounded to two decimal places and never
 * more than the line itself.
 */
function calculateDiscountAmount({
  item,
  lineAmount,
}: CalculateDiscountAmountParams) {
  // read the same way the schema reads it; an invalid value never gets this far, since the
  // totals only run on items that pass validation, but it counts as no discount
  const discountValue = parseDiscountValue(item.discountValue) || 0;

  if (discountValue <= 0 || lineAmount <= 0) return 0;

  const discountAmount =
    item.discountType === "amount"
      ? discountValue
      : (lineAmount * discountValue) / 100;

  return Number(Math.min(discountAmount, lineAmount).toFixed(2));
}
