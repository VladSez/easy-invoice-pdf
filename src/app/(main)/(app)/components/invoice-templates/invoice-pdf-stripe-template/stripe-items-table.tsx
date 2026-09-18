import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import type { STRIPE_TEMPLATE_STYLES } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { formatAmount } from "@/app/(main)/(app)/utils/format-amount";
import { formatCurrency } from "@/app/(main)/(app)/utils/format-currency";
import { formatServicePeriodRange } from "@/app/(main)/(app)/utils/format-service-period";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

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
  const numberFormatLocale = resolveNumberFormatLocale(invoiceData);
  const t = INVOICE_PDF_TRANSLATIONS[language];
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  // Set dayjs locale based on invoice language
  dayjs.locale(language);

  // Calculate service period (example: Jan 01 2025 - Jan 31 2025)
  const servicePeriod = formatServicePeriodRange(invoiceData);

  const unitFieldIsVisible = invoiceData.items[0].unitFieldIsVisible;
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

        {unitFieldIsVisible ? (
          <View style={styles.colUnit}>
            <Text style={styles.fontSize8}>{t.stripe.unit}</Text>
          </View>
        ) : null}

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
          numberFormatLocale,
        });

        const formattedPreTaxAmount = formatCurrency({
          amount: item.netAmount,
          currency: invoiceData.currency,
          numberFormatLocale,
        });

        // The quantity column carries no currency, and the Stripe template rounds it to
        // whole units
        const formattedAmount = formatAmount({
          amount: item.amount,
          numberFormatLocale,
          minimumFractionDigits: 0,
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
              {invoiceData.servicePeriodFieldIsVisible ? (
                <Text style={[styles.fontSize9, styles.mt4]}>
                  {servicePeriod}
                </Text>
              ) : null}
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.fontSize11, styles.textDark]}>
                {formattedAmount}
              </Text>
            </View>
            {unitFieldIsVisible ? (
              <View style={styles.colUnit}>
                <Text style={[styles.fontSize11, styles.textDark]}>
                  {item.unit}
                </Text>
              </View>
            ) : null}
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
