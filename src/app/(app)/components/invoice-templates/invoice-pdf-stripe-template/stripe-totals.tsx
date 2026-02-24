import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { type InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { formatCurrency } from "@/app/(app)/utils/format-currency";

import type { STRIPE_TEMPLATE_STYLES } from "@/app/(app)/components/invoice-templates/invoice-pdf-stripe-template";

/**
 * Subtotal, total excluding tax, VAT, total and amount due fields
 */
export function StripeVatSummaryTableTotals({
  invoiceData,
  formattedInvoiceTotal,
  styles,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  // Calculate subtotal (sum of all items)
  const subtotal = invoiceData.items.reduce(
    (sum, item) => sum + item.netAmount,
    0,
  );
  const formattedSubtotal = formatCurrency({
    amount: subtotal,
    currency: invoiceData.currency,
    language,
  });

  const invoiceTotal = formatCurrency({
    amount: invoiceData?.total,
    currency: invoiceData.currency,
    language,
  });

  // Check if any items have numeric VAT values (not "NP" or "OO")
  const hasNumericVat = invoiceData.items.some(
    (item) => typeof item.vat === "number",
  );

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
            <Text style={[styles.fontSize9, styles.textDark]}>
              {formattedSubtotal}
            </Text>
          </View>
        </View>

        {hasNumericVat && (
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
                <Text style={[styles.fontSize9, styles.textDark]}>
                  {formattedSubtotal}
                </Text>
              </View>
            </View>

            {/* VAT rows */}
            {vatRows.map((item, index) => {
              if (typeof item.vat !== "number") return null;

              const formattedVatAmount = formatCurrency({
                amount: item.vatAmount,
                currency: invoiceData.currency,
                language,
              });

              const formattedNetAmount = formatCurrency({
                amount: item.netAmount,
                currency: invoiceData.currency,
                language,
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
                    <Text style={[styles.fontSize9, styles.textDark]}>
                      {formattedVatAmount}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

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
            <Text style={[styles.fontSize9, styles.textDark]}>
              {invoiceTotal}
            </Text>
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
          <View style={styles.vatColValue}>
            <Text style={[styles.fontSize9, styles.fontBold, styles.textDark]}>
              {formattedInvoiceTotal}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const MIN_PRESENCE_AHEAD = 15;
