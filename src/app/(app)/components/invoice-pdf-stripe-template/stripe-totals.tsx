import {
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer/lib/react-pdf.browser";
import { type InvoiceData } from "@/app/schema";
import { CURRENCY_SYMBOLS } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import type { STRIPE_TEMPLATE_STYLES } from ".";

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
  const currencySymbol = CURRENCY_SYMBOLS[invoiceData.currency];

  // Calculate subtotal (sum of all items)
  const subtotal = invoiceData.items.reduce(
    (sum, item) => sum + item.preTaxAmount,
    0
  );
  const formattedSubtotal = subtotal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={{ alignItems: "flex-end", marginTop: 24 }}>
      <View style={{ width: "40%" }}>
        {/* Subtotal */}
        <View style={[styles.totalRow, styles.borderTop]}>
          <Text style={[styles.fontSize8]}>{t.stripe.subtotal}</Text>
          <Text style={[styles.fontSize8, styles.textDark]}>
            {currencySymbol}
            {formattedSubtotal}
          </Text>
        </View>

        {/* Total */}
        <View style={[styles.totalRow, styles.borderTop]}>
          <Text style={[styles.fontSize8]}>{t.stripe.total}</Text>
          <Text style={[styles.fontSize8, styles.textDark]}>
            {currencySymbol}
            {formattedInvoiceTotal}
          </Text>
        </View>

        {/* Amount due */}
        <View style={[styles.totalRow, styles.borderTop]}>
          <Text style={[styles.fontSize8, styles.fontBold, styles.textDark]}>
            {t.stripe.amountDue}
          </Text>
          <Text style={[styles.fontSize8, styles.fontBold, styles.textDark]}>
            {currencySymbol}
            {formattedInvoiceTotal} {invoiceData.currency}
          </Text>
        </View>
      </View>
    </View>
  );
}
