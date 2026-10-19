import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import { formatDateWithLocale } from "../../format/format-date-with-locale";
import { INVOICE_PDF_TRANSLATIONS } from "../../pdf-translations/pdf-translations";
import type { InvoiceData } from "../../schema";

/**
 * Payment date and payment method fields
 */
export function InvoicePaymentInfo({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  const paymentDate = formatDateWithLocale({
    date: invoiceData.paymentDue,
    selectedDateFormat: invoiceData.dateFormat,
    language: invoiceData.language,
  });

  const paymentMethodIsVisible = invoiceData.paymentMethodFieldIsVisible;

  return (
    <View style={{ maxWidth: "250px" }}>
      {paymentMethodIsVisible ? (
        <Text style={styles.fontSize7}>
          {t.paymentInfo.paymentMethod}:{" "}
          <Text style={[styles.boldText, styles.fontSize8]}>
            {invoiceData?.paymentMethod}
          </Text>
        </Text>
      ) : null}
      <Text
        style={[
          styles.fontSize7,
          { marginLeft: paymentMethodIsVisible ? 9.75 : 0 },
        ]}
      >
        {t.paymentInfo.paymentDate}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>{paymentDate}</Text>
      </Text>
    </View>
  );
}
