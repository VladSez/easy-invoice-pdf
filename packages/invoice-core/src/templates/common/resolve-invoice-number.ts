import { getDefaultInvoiceNumberLabel } from "../../pdf-translations/pdf-translations";
import type { InvoiceData } from "../../schema";

/**
 * The invoice number label and value the templates print.
 *
 * `invoiceNumberObject` is optional in the schema: the free app always sets it, but an
 * API client sending raw JSON may not. Without it the templates printed
 * "undefined undefined", so a missing label falls back to the template's translated
 * default and a missing value to an empty string.
 */
export function resolveInvoiceNumber(
  invoiceData: Pick<
    InvoiceData,
    "invoiceNumberObject" | "language" | "template"
  >,
) {
  const label =
    invoiceData.invoiceNumberObject?.label ??
    getDefaultInvoiceNumberLabel(invoiceData.language, invoiceData.template);

  const value = invoiceData.invoiceNumberObject?.value ?? "";

  return { label, value };
}
