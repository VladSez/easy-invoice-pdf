import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { formatCurrency } from "@/app/(app)/utils/format-currency";
import type { InvoiceData } from "@/app/schema";
import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import type { STRIPE_TEMPLATE_STYLES } from "@/app/(app)/components/invoice-templates/invoice-pdf-stripe-template";

import "dayjs/locale/de";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/uk";

export function StripeItemsTable({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  // Set dayjs locale based on invoice language
  dayjs.locale(language);

  // Calculate service period (example: Jan 01 2025 - Jan 31 2025)
  const servicePeriodStart = dayjs(invoiceData.dateOfService)
    .startOf("month")
    .format(invoiceData.dateFormat);

  const servicePeriodEnd = dayjs(invoiceData.dateOfService).format(
    invoiceData.dateFormat,
  );

  const vatAmountFieldIsVisible = invoiceData.items[0].vatFieldIsVisible;

  return (
    <View style={[styles.table, styles.mt24]}>
      {/* Fixed Header — repeats on every page (for better layout on page breaks) */}
      <View style={styles.tableHeader} fixed>
        <View style={styles.colDescription}>
          <Text style={styles.fontSize8}>{t.stripe.description}</Text>
        </View>

        <View style={styles.colQty}>
          <Text style={styles.fontSize8}>{t.stripe.qty}</Text>
        </View>

        <View style={styles.colUnitPrice}>
          <Text style={styles.fontSize8}>{t.stripe.unitPrice}</Text>
        </View>

        {vatAmountFieldIsVisible ? (
          <View style={styles.colTax}>
            <Text style={styles.fontSize8}>{taxLabelText}</Text>
          </View>
        ) : null}

        <View style={styles.colAmount}>
          <Text style={styles.fontSize8}>{t.stripe.amount}</Text>
        </View>
      </View>

      {/* Rows */}
      {invoiceData.items.map((item, index) => {
        const formattedNetPrice = formatCurrency({
          amount: item.netPrice,
          currency: invoiceData.currency,
          language,
        });

        const formattedPreTaxAmount = formatCurrency({
          amount: item.netAmount,
          currency: invoiceData.currency,
          language,
        });

        const formattedAmount = item.amount.toLocaleString("en-US", {
          style: "decimal",
          maximumFractionDigits: 0,
        });

        // Format VAT value
        const formattedVat = Number.isNaN(Number(item.vat))
          ? item.vat
          : `${Number(item.vat)}%`;

        return (
          <View
            key={index}
            style={styles.tableRow}
            wrap={false}
            minPresenceAhead={60}
          >
            <View style={styles.colDescription}>
              <Text style={[styles.fontSize10]}>{item.name}</Text>
              {/* Add service period if available */}
              <Text style={[styles.fontSize9, styles.mt4]}>
                {servicePeriodStart} – {servicePeriodEnd}
              </Text>
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.fontSize11, styles.textDark]}>
                {formattedAmount}
              </Text>
            </View>
            <View style={styles.colUnitPrice}>
              <Text style={[styles.fontSize11, styles.textDark]}>
                {formattedNetPrice}
              </Text>
            </View>
            {vatAmountFieldIsVisible ? (
              <View style={styles.colTax}>
                <Text style={[styles.fontSize11, styles.textDark]}>
                  {formattedVat}
                </Text>
              </View>
            ) : null}
            <View style={[styles.colAmount]}>
              <Text
                style={[
                  styles.fontSize11,
                  styles.textDark,
                  { paddingLeft: 10 },
                ]}
              >
                {formattedPreTaxAmount.split("")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
