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
  const dateOfService = dayjs(invoiceData.dateOfService).format(
    invoiceData.dateFormat
  );

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  // Calculate service period (example: Jan 01 2025 - Jan 31 2025)
  const servicePeriodStart = dayjs(invoiceData.dateOfService).format(
    "MMM DD YYYY"
  );
  const servicePeriodEnd = dayjs(invoiceData.dateOfService)
    .endOf("month")
    .format("MMM DD YYYY");

  return (
    <View style={[styles.mb24]}>
      <View style={[styles.mb1, styles.row]}>
        <Text style={[styles.fontSize9, styles.fontBold, { width: 120 }]}>
          {t.stripe.invoiceNumber}
        </Text>
        <Text style={[styles.fontSize9, styles.fontBold]}>
          {invoiceNumberValue}
        </Text>
      </View>

      <View style={[styles.mb1, styles.row]}>
        <Text style={[styles.fontSize9, styles.fontMedium, { width: 120 }]}>
          {t.stripe.dateOfIssue}
        </Text>
        <Text style={[styles.fontSize9, styles.fontMedium]}>{dateOfIssue}</Text>
      </View>

      <View style={[styles.mb1, styles.row]}>
        <Text style={[styles.fontSize9, styles.fontMedium, { width: 120 }]}>
          {t.stripe.dateDue}
        </Text>
        <Text style={[styles.fontSize9, styles.fontMedium]}>
          {dateOfService}
        </Text>
      </View>

      <View style={[styles.mb1, styles.row]}>
        <Text style={[styles.fontSize9, styles.fontMedium, { width: 120 }]}>
          {t.stripe.servicePeriod}
        </Text>
        <Text style={[styles.fontSize9, styles.fontMedium]}>
          {servicePeriodStart} - {servicePeriodEnd}
        </Text>
      </View>
    </View>
  );
}
