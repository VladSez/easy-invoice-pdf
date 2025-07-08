import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import type { STRIPE_TEMPLATE_STYLES } from ".";

export function StripeSellerBuyerInfo({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  return (
    <View
      style={{
        flexDirection: "row",
        marginBottom: 24,
      }}
    >
      {/* Seller info */}
      <View style={{ marginRight: 80, width: "150px" }}>
        <Text style={[styles.fontSize10, styles.fontBold, styles.mb3]}>
          {invoiceData.seller.name}
        </Text>
        <Text style={[styles.fontSize9, styles.mb3]}>
          {invoiceData.seller.address}
        </Text>
        <Text style={[styles.fontSize9, styles.mb3]}>
          {invoiceData.seller.email}
        </Text>
        {invoiceData.seller.vatNoFieldIsVisible && (
          <Text style={[styles.fontSize9, styles.mb3]}>
            {t.seller.vatNo}: {invoiceData.seller.vatNo}
          </Text>
        )}
        {invoiceData.seller.accountNumberFieldIsVisible && (
          <Text style={[styles.fontSize9, styles.mb3]}>
            {t.seller.accountNumber}: {invoiceData.seller.accountNumber}
          </Text>
        )}
        {invoiceData.seller.swiftBicFieldIsVisible && (
          <Text style={[styles.fontSize9, styles.mb3]}>
            {t.seller.swiftBic}: {invoiceData.seller.swiftBic}
          </Text>
        )}

        {invoiceData.seller.notesFieldIsVisible && (
          <Text style={[styles.fontSize9, styles.mb3]}>
            {invoiceData.seller.notes}
          </Text>
        )}
      </View>

      {/* Buyer info */}
      <View style={{ width: "150px" }}>
        <Text style={[styles.fontSize10, styles.fontBold, styles.mb3]}>
          {t.stripe.billTo}
        </Text>
        <Text style={[styles.fontSize9, styles.mb3]}>
          {invoiceData.buyer.name}
        </Text>
        <Text style={[styles.fontSize9, styles.mb3]}>
          {invoiceData.buyer.address}
        </Text>
        <Text style={[styles.fontSize9, styles.mb3]}>
          {invoiceData.buyer.email}
        </Text>

        {invoiceData.buyer.vatNoFieldIsVisible && (
          <Text style={[styles.fontSize9, styles.mb3]}>
            {t.buyer.vatNo}: {invoiceData.buyer.vatNo}
          </Text>
        )}

        {invoiceData.buyer.notesFieldIsVisible && (
          <Text style={[styles.fontSize9, styles.mb3]}>
            {invoiceData.buyer.notes}
          </Text>
        )}
      </View>
    </View>
  );
}
