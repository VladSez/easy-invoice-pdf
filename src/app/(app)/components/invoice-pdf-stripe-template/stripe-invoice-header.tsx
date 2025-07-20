import { Image, Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
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
  const hasLogo = invoiceData.logo && invoiceData.logo.length > 0;

  return (
    <View style={[hasLogo ? {} : { marginBottom: 16 }]}>
      {hasLogo ? (
        // Header with logo and title side by side
        <View
          style={[
            styles.spaceBetween,
            {
              alignItems: "flex-start",
              minHeight: 50, // Ensure consistent height
            },
          ]}
        >
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Text style={[styles.fontSize18, styles.fontBold, styles.textDark]}>
              {t.stripe.invoice}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={invoiceData.logo}
              style={{
                maxWidth: 110,
                maxHeight: 40,
                objectFit: "contain",
              }}
            />
          </View>
        </View>
      ) : (
        // Header with title only
        <Text style={[styles.fontSize18, styles.fontBold, styles.textDark]}>
          {t.stripe.invoice}
        </Text>
      )}
    </View>
  );
}
