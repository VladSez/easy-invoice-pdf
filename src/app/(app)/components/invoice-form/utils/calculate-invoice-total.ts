import type { InvoiceItemData } from "@/app/schema";

/**
 * Converts a value to a finite number, returning 0 if the value is not finite.
 *
 * This is the only thing standing between raw form state and the sum, so it
 * covers two cases:
 *
 * - `preTaxAmount` can arrive as a string. `zodResolver` validates form state
 *   but never writes coerced values back into it, so a `useWatch` result can
 *   still hold `"10"`. Summing that concatenates (`0 + "10"` -> `"010"`) and
 *   then throws on `.toFixed`.
 * - `z.coerce.number().nonnegative()` accepts `Infinity`, so a literal
 *   `Infinity` or an overflowing numeric string like `"1e999"` survives
 *   validation. Summing those renders the invoice total as "Infinity"; a
 *   non-finite amount contributes 0 instead so the form stays usable.
 */
export function getSafeNumber(value: unknown) {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
}

/**
 * Sums pre-tax amounts from invoice items and rounds to two decimal places.
 *
 * Safe to call with raw form values - see `getSafeNumber`.
 */
export function calculateInvoiceTotal(
  items: ReadonlyArray<Pick<InvoiceItemData, "preTaxAmount">>,
) {
  return Number(
    items
      .reduce((sum, item) => {
        return sum + getSafeNumber(item.preTaxAmount);
      }, 0)
      .toFixed(2),
  );
}
