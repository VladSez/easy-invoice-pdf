import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { type InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import type { STRIPE_TEMPLATE_STYLES } from ".";
import { formatCurrency } from "../../utils/format-currency";

export function StripeTotals({
  invoiceData,
  formattedInvoiceTotal,
  styles,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

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

  return (
    <View style={{ alignItems: "flex-end", marginTop: 24 }}>
      <View style={{ width: "50%" }}>
        {/* Subtotal */}
        <View
          style={[styles.totalRow, styles.borderTop, { paddingVertical: 1.5 }]}
        >
          <Text style={[styles.fontSize9]}>{t.stripe.subtotal}</Text>
          <Text style={[styles.fontSize9, styles.textDark]}>
            {formattedSubtotal}
          </Text>
        </View>

        {hasNumericVat && (
          <>
            <View
              style={[
                styles.totalRow,
                styles.borderTop,
                { paddingVertical: 1.5 },
              ]}
            >
              <Text style={[styles.fontSize9]}>Total excluding tax</Text>
              <Text style={[styles.fontSize9, styles.textDark]}>
                {formattedSubtotal}
              </Text>
            </View>

            {/* VAT, we use .reverse() to mimic stripe behavior */}
            {[...(invoiceData?.items ?? [])].reverse().map((item, index) => {
              if (typeof item.vat !== "number") {
                return null;
              }

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
                  style={[
                    styles.totalRow,
                    styles.borderTop,
                    { paddingVertical: 1.5 },
                  ]}
                >
                  <Text style={[styles.fontSize9]}>
                    VAT ({item.vat}% on {formattedNetAmount})
                  </Text>
                  <Text style={[styles.fontSize9, styles.textDark]}>
                    {formattedVatAmount}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {/* Total */}
        <View
          style={[styles.totalRow, styles.borderTop, { paddingVertical: 1.5 }]}
        >
          <Text style={[styles.fontSize9]}>{t.stripe.total}</Text>
          <Text style={[styles.fontSize9, styles.textDark]}>
            {/* USD is not needed for the total */}
            {invoiceTotal}
          </Text>
        </View>

        {/* Amount due */}
        <View
          style={[styles.totalRow, styles.borderTop, { paddingVertical: 1.5 }]}
        >
          <Text style={[styles.fontSize9, styles.fontBold, styles.textDark]}>
            {t.stripe.amountDue}
          </Text>
          <Text style={[styles.fontSize9, styles.fontBold, styles.textDark]}>
            {formattedInvoiceTotal}
          </Text>
        </View>
      </View>
    </View>
  );
}
