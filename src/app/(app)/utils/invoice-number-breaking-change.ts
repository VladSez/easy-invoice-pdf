import { SUPPORTED_LANGUAGES } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";

import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { z } from "zod";

/**
 * This function handles the breaking change of the invoice number field.
 * It removes the old "invoiceNumber" field and adds the new "invoiceNumberObject" field with label and value.
 *
 * @example
 * ```typescript
 * const json = { invoiceNumber: "123", language: "en" };
 * const updatedJson = handleInvoiceNumberBreakingChange(json);
 * // Returns: { invoiceNumberObject: { label: "Invoice Number:", value: "123" }
 * ```
 */
export function handleInvoiceNumberBreakingChange(json: unknown) {
  // check if the invoice number is in the json
  if (
    typeof json === "object" &&
    json !== null &&
    "invoiceNumber" in json &&
    typeof json.invoiceNumber === "string" &&
    "language" in json
  ) {
    umamiTrackEvent("breaking_change_detected");

    let lang: keyof typeof INVOICE_PDF_TRANSLATIONS;

    const invoiceLanguage = z
      .enum(SUPPORTED_LANGUAGES)
      .safeParse(json.language);

    if (!invoiceLanguage.success) {
      console.error("Invalid invoice language:", invoiceLanguage.error);

      // fallback to default language
      lang = SUPPORTED_LANGUAGES[0];
    } else {
      lang = invoiceLanguage.data;
    }

    const invoiceNumberLabel = INVOICE_PDF_TRANSLATIONS[lang].invoiceNumber;

    // Create new object without invoiceNumber and with invoiceNumberObject
    const newJson = {
      ...json,
      // assign invoiceNumber to invoiceNumberObject.value
      invoiceNumberObject: {
        label: `${invoiceNumberLabel}:`,
        value: json.invoiceNumber,
      },
    };

    // remove deprecated invoiceNumber from json
    delete (newJson as Record<string, unknown>).invoiceNumber;

    // update json
    json = newJson;

    return json;
  }

  return json;
}
