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
    (sum, item) => sum + item.preTaxAmount,
    0
  );
  const formattedSubtotal = formatCurrency({
    amount: subtotal,
    currency: invoiceData.currency,
    language,
  });

  return (
    <View style={{ alignItems: "flex-end", marginTop: 24 }}>
      <View style={{ width: "40%" }}>
        {/* Subtotal */}
        <View
          style={[styles.totalRow, styles.borderTop, { paddingVertical: 1.5 }]}
        >
          <Text style={[styles.fontSize9]}>{t.stripe.subtotal}</Text>
          <Text style={[styles.fontSize9, styles.textDark]}>
            {formattedSubtotal}
          </Text>
        </View>

        {/* Total */}
        <View
          style={[styles.totalRow, styles.borderTop, { paddingVertical: 1.5 }]}
        >
          <Text style={[styles.fontSize9]}>{t.stripe.total}</Text>
          <Text style={[styles.fontSize9, styles.textDark]}>
            {formattedInvoiceTotal}
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
