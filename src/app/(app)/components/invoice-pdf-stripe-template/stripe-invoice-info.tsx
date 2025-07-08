import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { type InvoiceData } from "@/app/schema";
import dayjs from "dayjs";

import { TRANSLATIONS } from "@/app/schema/translations";
import type { STRIPE_TEMPLATE_STYLES } from ".";

export function StripeInvoiceInfo({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  const dateOfIssue = dayjs(invoiceData.dateOfIssue).format(
    invoiceData.dateFormat
  );

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  // Calculate service period (example: Jan 01 2025 - Jan 31 2025)
  const servicePeriodStart = dayjs(invoiceData.dateOfService)
    .startOf("month")
    .format(invoiceData.dateFormat);

  const servicePeriodEnd = dayjs(invoiceData.dateOfService).format(
    invoiceData.dateFormat
  );

  const paymentDueDate = dayjs(invoiceData.paymentDue).format(
    invoiceData.dateFormat
  );

  return (
    <View style={[styles.mb24, { gap: 2 }]}>
      <View style={[styles.mb1, styles.row, { alignItems: "baseline" }]}>
        {/* Invoice number text column */}
        <View style={{ width: 90 }}>
          <Text style={[styles.fontSize9, styles.fontBold, { maxWidth: 80 }]}>
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
        <View style={{ width: 90 }}>
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
        <View style={{ width: 90 }}>
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

      <View style={[styles.mb1, styles.row, { alignItems: "baseline" }]}>
        {/* Service period text column */}
        <View style={{ width: 90 }}>
          <Text
            style={[styles.fontSize9, styles.fontMedium, { maxWidth: 120 }]}
          >
            {t.stripe.servicePeriod}
          </Text>
        </View>
        {/* Service period value column */}
        <Text style={[styles.fontSize9, styles.fontMedium]}>
          {servicePeriodStart} - {servicePeriodEnd}
        </Text>
      </View>
    </View>
  );
}
