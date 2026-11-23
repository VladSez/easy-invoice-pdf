import type { InvoiceData } from "@/app/schema";

/**
 * Whether the PDF prints the custom column (the one the user names themselves, stored as
 * `typeOfGTU` because it began as the Polish Type of GTU).
 *
 * Its switch is on, and the column has something to show: a name or a value on some item.
 * Adding the column in the form turns the switch on before anything is typed, so without
 * the content check the PDF would gain an empty column headed "Type of GTU" the moment the
 * pill is clicked.
 */
export function isCustomColumnInPdf(
  invoiceData: Pick<InvoiceData, "items" | "customColumnLabel">,
) {
  const isSwitchedOn = Boolean(invoiceData.items[0]?.typeOfGTUFieldIsVisible);

  if (!isSwitchedOn) {
    return false;
  }

  const hasName = Boolean(invoiceData.customColumnLabel?.trim());

  const hasValue = invoiceData.items.some((item) => {
    return Boolean(item.typeOfGTU?.trim());
  });

  return hasName || hasValue;
}
