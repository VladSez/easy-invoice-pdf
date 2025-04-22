import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";

export function InvoiceSellerBuyerInfo({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  const swiftBicFieldIsVisible = invoiceData.seller.swiftBicFieldIsVisible;
  const sellerVatNoFieldIsVisible = invoiceData.seller.vatNoFieldIsVisible;
  const buyerVatNoFieldIsVisible = invoiceData.buyer.vatNoFieldIsVisible;
  const sellerAccountNumberFieldIsVisible =
    invoiceData.seller.accountNumberFieldIsVisible;
  const sellerNotesFieldIsVisible = invoiceData.seller.notesFieldIsVisible;
  const buyerNotesFieldIsVisible = invoiceData.buyer.notesFieldIsVisible;

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        maxWidth: "512px",
      }}
    >
      {/* Seller info */}
      <View style={{ width: "280px", marginRight: 25 }}>
        <Text style={styles.subheader}>{t.seller.name}</Text>
        <View>
          <Text style={[styles.fontBold, styles.fontSize10]}>
            {invoiceData?.seller.name}
          </Text>
          <Text style={[styles.boldText, styles.fontSize8]}>
            {invoiceData?.seller.address}
          </Text>

          <View style={{ marginTop: 2 }}>
            {sellerVatNoFieldIsVisible && (
              <Text style={[styles.fontSize7]}>
                {t.seller.vatNo}:{" "}
                <Text style={[styles.boldText, styles.fontSize8]}>
                  {invoiceData?.seller.vatNo}
                </Text>
              </Text>
            )}
            <Text style={styles.fontSize7}>
              {t.seller.email}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.email}
              </Text>
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          {sellerAccountNumberFieldIsVisible && (
            <Text style={styles.fontSize8}>
              {t.seller.accountNumber} -{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.accountNumber}
              </Text>
            </Text>
          )}
          {swiftBicFieldIsVisible && (
            <Text style={styles.fontSize8}>
              {t.seller.swiftBic}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.swiftBic}
              </Text>
            </Text>
          )}
          {sellerNotesFieldIsVisible && invoiceData?.seller.notes && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.fontSize8]}>
                {invoiceData?.seller.notes}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Buyer info */}
      <View style={{ width: "280px" }}>
        <Text style={styles.subheader}>{t.buyer.name}</Text>
        <Text style={[styles.fontBold, styles.fontSize10]}>
          {invoiceData?.buyer.name}
        </Text>
        <Text
          style={[styles.boldText, styles.fontSize8, { maxWidth: "280px" }]}
        >
          {invoiceData?.buyer.address}
        </Text>

        <View style={{ marginTop: 2 }}>
          {buyerVatNoFieldIsVisible && (
            <Text style={styles.fontSize7}>
              {t.buyer.vatNo}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.buyer.vatNo}
              </Text>
            </Text>
          )}
          <Text style={styles.fontSize7}>
            {t.buyer.email}:{" "}
            <Text style={[styles.boldText, styles.fontSize8]}>
              {invoiceData?.buyer.email}
            </Text>
          </Text>
        </View>

        {buyerNotesFieldIsVisible && invoiceData?.buyer.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.fontSize8]}>{invoiceData?.buyer.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
