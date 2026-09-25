import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import { WrappableAmount } from "@/app/(main)/(app)/components/invoice-templates/common/wrappable-amount";
import type { STRIPE_TEMPLATE_STYLES } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import {
  formatCurrency,
  formatCurrencyChunks,
} from "@/app/(main)/(app)/utils/format-currency";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

/**
 * Subtotal, total excluding tax, VAT, total and amount due fields
 */
export function StripeVatSummaryTableTotals({
  invoiceData,
  invoiceTotalChunks,
  styles,
}: {
  invoiceData: InvoiceData;
  /** The amount due, cut at its thousands boundaries -- see `formatCurrencyChunks`. */
  invoiceTotalChunks: string[];
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;

  const numberFormatLocale = resolveNumberFormatLocale(invoiceData);

  const t = INVOICE_PDF_TRANSLATIONS[language];
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  // Calculate subtotal (sum of all items)
  const subtotal = invoiceData.items.reduce((sum, item) => {
    return sum + item.netAmount;
  }, 0);

  const subtotalChunks = formatCurrencyChunks({
    amount: subtotal,
    currency: invoiceData.currency,
    numberFormatLocale,
  });

  const totalChunks = formatCurrencyChunks({
    amount: invoiceData?.total,
    currency: invoiceData.currency,
    numberFormatLocale,
  });

  // Check if any items have numeric VAT values (not "NP" or "OO")
  const hasNumericVat = invoiceData.items.some((item) => {
    return typeof item.vat === "number";
  });

  // we use .reverse() to mimic stripe behavior
  const vatRows = [...(invoiceData?.items ?? [])].reverse();

  return (
    <View style={{ alignItems: "flex-end", marginTop: 24 }}>
      <View style={{ width: "50%" }}>
        {/* Empty header row (for better layout on page breaks) */}
        <View style={styles.vatTableHeader} fixed>
          <View style={styles.vatColLabel}>
            <Text style={styles.fontSize8}> </Text>
          </View>
          <View style={styles.vatColValue}>
            <Text style={styles.fontSize8}> </Text>
          </View>
        </View>

        {/* Subtotal */}
        <View
          style={[styles.vatTableRow, styles.borderTop]}
          wrap={false}
          minPresenceAhead={MIN_PRESENCE_AHEAD}
        >
          <View style={styles.vatColLabel}>
            <Text style={styles.fontSize9}>{t.stripe.subtotal}</Text>
          </View>
          <View style={styles.vatColValue}>
            <WrappableAmount
              chunks={subtotalChunks}
              style={[styles.fontSize9, styles.textDark]}
            />
          </View>
        </View>

        {hasNumericVat ? (
          <>
            {/* Total excluding tax */}
            <View
              style={[styles.vatTableRow, styles.borderTop]}
              wrap={false}
              minPresenceAhead={MIN_PRESENCE_AHEAD}
            >
              <View style={styles.vatColLabel}>
                <Text style={styles.fontSize9}>
                  {t.stripe.totalExcludingTax}
                </Text>
              </View>
              <View style={styles.vatColValue}>
                <WrappableAmount
                  chunks={subtotalChunks}
                  style={[styles.fontSize9, styles.textDark]}
                />
              </View>
            </View>

            {/* VAT rows */}
            {vatRows.map((item, index) => {
              if (typeof item.vat !== "number") return null;

              const vatAmountChunks = formatCurrencyChunks({
                amount: item.vatAmount,
                currency: invoiceData.currency,
                numberFormatLocale,
              });

              const formattedNetAmount = formatCurrency({
                amount: item.netAmount,
                currency: invoiceData.currency,
                numberFormatLocale,
              });

              return (
                <View
                  key={index}
                  style={[styles.vatTableRow, styles.borderTop]}
                  wrap={false}
                  minPresenceAhead={MIN_PRESENCE_AHEAD}
                >
                  <View style={styles.vatColLabel}>
                    <Text style={styles.fontSize9}>
                      {taxLabelText} ({item.vat}% on {formattedNetAmount})
                    </Text>
                  </View>
                  <View style={styles.vatColValue}>
                    <WrappableAmount
                      chunks={vatAmountChunks}
                      style={[styles.fontSize9, styles.textDark]}
                    />
                  </View>
                </View>
              );
            })}
          </>
        ) : null}

        {/* Total */}
        <View
          style={[styles.vatTableRow, styles.borderTop]}
          wrap={false}
          minPresenceAhead={40}
        >
          <View style={styles.vatColLabel}>
            <Text style={styles.fontSize9}>{t.stripe.total}</Text>
          </View>
          <View style={styles.vatColValue}>
            <WrappableAmount
              chunks={totalChunks}
              style={[styles.fontSize9, styles.textDark]}
            />
          </View>
        </View>

        {/* Amount due */}
        <View
          style={[styles.vatTableRow, styles.borderTop]}
          wrap={false}
          minPresenceAhead={40}
        >
          <View style={styles.vatColLabel}>
            <Text style={[styles.fontSize9, styles.fontBold, styles.textDark]}>
              {t.stripe.amountDue}
            </Text>
          </View>
          <View style={[styles.vatColValue]}>
            <WrappableAmount
              chunks={invoiceTotalChunks}
              style={[styles.fontSize9, styles.fontBold, styles.textDark]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const MIN_PRESENCE_AHEAD = 15;
