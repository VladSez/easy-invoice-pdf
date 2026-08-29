import { getDefaultInvoiceNumberLabel } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import {
  SUPPORTED_TEMPLATES,
  type InvoiceData,
  type SupportedTemplates,
} from "@/app/schema";

/**
 * Selects the invoice template and updates the invoice data accordingly.
 *
 * If the invoice number object label matches a known default label for any supported template,
 * updates the label to match the default for the newly selected template and the invoice's language.
 * Preserves custom labels.
 */
export function selectInvoiceTemplate(
  invoiceData: InvoiceData,
  template: SupportedTemplates,
) {
  const invoiceNumberObject = invoiceData.invoiceNumberObject;

  // Older Stripe drafts stored the default-template label because Stripe used
  // to ignore this field. Treat either template's translated value as a default
  // so those drafts receive the correct heading without changing custom text.
  const hasKnownDefaultInvoiceNumberLabel = SUPPORTED_TEMPLATES.some(
    (supportedTemplate) => {
      return (
        invoiceNumberObject?.label ===
        getDefaultInvoiceNumberLabel(invoiceData.language, supportedTemplate)
      );
    },
  );

  if (!invoiceNumberObject || !hasKnownDefaultInvoiceNumberLabel) {
    return { ...invoiceData, template } satisfies InvoiceData;
  }

  return {
    ...invoiceData,
    template,
    invoiceNumberObject: {
      ...invoiceNumberObject,
      label: getDefaultInvoiceNumberLabel(invoiceData.language, template),
    },
  } satisfies InvoiceData;
}
