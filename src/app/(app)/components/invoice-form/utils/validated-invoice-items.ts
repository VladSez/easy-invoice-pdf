import { invoiceItemSchema } from "@/app/schema";
import { z } from "zod";

const invoiceItemsSchema = z.array(invoiceItemSchema);

/**
 * Validity gate for the totals effect.
 *
 * `useWatch` fires on every keystroke, including while the user is mid-edit
 * with input the schema rejects - a cleared amount, a VAT above 100. Callers
 * check `success` and bail out in those moments, so half-typed input never gets
 * turned into totals and written back into the form. Without the gate, clearing
 * the amount field to retype it writes 0/0/0 over the item's totals, and a VAT
 * of 500 computes and persists a bogus tax amount.
 *
 * This is a gate, not a coercion step. `zodResolver` never writes transformed
 * values back into form state, but nothing downstream needs it to:
 * `calculateItemTotals` does its own `Number(...)` conversion, and the
 * calculated amount fields are read-only in the UI, so they are always numbers.
 */
export function parseValidatedInvoiceItems(items: unknown) {
  return invoiceItemsSchema.safeParse(items);
}
