import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { type InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import type { STRIPE_TEMPLATE_STYLES } from ".";

export function StripeInvoiceHeader({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  return (
    <View style={[styles.mb20]}>
      <Text style={[styles.fontSize18, styles.fontBold, styles.textDark]}>
        {t.stripe.invoice}
      </Text>
    </View>
  );
}
