import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import type { STRIPE_TEMPLATE_STYLES } from ".";
import { formatDateWithLocale } from "../../format/format-date-with-locale";
import { INVOICE_PDF_TRANSLATIONS } from "../../pdf-translations/pdf-translations";
import { type InvoiceData } from "../../schema";

export function StripeInvoiceInfo({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  const dateOfIssue = formatDateWithLocale({
    date: invoiceData.dateOfIssue,
    selectedDateFormat: invoiceData.dateFormat,
    language: invoiceData.language,
  });

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const paymentDueDate = formatDateWithLocale({
    date: invoiceData.paymentDue,
    selectedDateFormat: invoiceData.dateFormat,
    language: invoiceData.language,
  });

  // for better readability, we need to adjust the column width based on the language
  const INVOICE_NUMBER_MAX_WIDTH = invoiceData.language === "de" ? 100 : 80;
  const COLUMN_WIDTH = invoiceData.language === "en" ? 90 : 105;

  return (
    <View style={[styles.mb24, { gap: 2 }]}>
      <View style={[styles.mb1, styles.row, { alignItems: "baseline" }]}>
        {/* Invoice number text column */}
        <View style={{ width: COLUMN_WIDTH }}>
          <Text
            style={[
              styles.fontSize9,
              styles.fontBold,
              { maxWidth: INVOICE_NUMBER_MAX_WIDTH },
            ]}
          >
            {t.stripe.invoiceNumber}
          </Text>
        </View>
        {/* Invoice number value column */}
        <Text style={[styles.fontSize9, styles.fontBold]}>
          {invoiceNumberValue}
        </Text>
      </View>

      <View style={[styles.mb1, styles.row, { alignItems: "baseline" }]}>
        {/* Date of issue text column */}
        <View style={{ width: COLUMN_WIDTH }}>
          <Text
            style={[styles.fontSize9, styles.fontMedium, { maxWidth: 120 }]}
          >
            {t.stripe.dateOfIssue}
          </Text>
        </View>
        {/* Date of issue value column */}
        <Text style={[styles.fontSize9, styles.fontMedium]}>{dateOfIssue}</Text>
      </View>

      <View style={[styles.mb1, styles.row, { alignItems: "baseline" }]}>
        {/* Date due text column */}
        <View style={{ width: COLUMN_WIDTH }}>
          <Text
            style={[styles.fontSize9, styles.fontMedium, { maxWidth: 120 }]}
          >
            {t.stripe.dateDue}
          </Text>
        </View>
        {/* Date due value column */}
        <Text style={[styles.fontSize9, styles.fontMedium]}>
          {paymentDueDate}
        </Text>
      </View>

      {/* Header Notes */}
      {invoiceData.invoiceType && invoiceData.invoiceTypeFieldIsVisible ? (
        <View style={[styles.mb1, styles.row, { alignItems: "baseline" }]}>
          <Text style={[styles.fontSize9]}>{invoiceData.invoiceType}</Text>
        </View>
      ) : null}
    </View>
  );
}
