import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

export function InvoiceSellerBuyerInfo({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

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
            {invoiceData.seller.vatNoFieldIsVisible ? (
              <Text style={[styles.fontSize7]}>
                {invoiceData.seller.vatNoLabelText}:{" "}
                <Text style={[styles.boldText, styles.fontSize8]}>
                  {invoiceData?.seller.vatNo}
                </Text>
              </Text>
            ) : null}
            {invoiceData.seller.emailFieldIsVisible ? (
              <Text style={styles.fontSize7}>
                {t.seller.email}:{" "}
                <Text style={[styles.boldText, styles.fontSize8]}>
                  {invoiceData?.seller.email}
                </Text>
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          {invoiceData.seller.accountNumberFieldIsVisible ? (
            <Text style={styles.fontSize8}>
              {t.seller.accountNumber} -{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.accountNumber}
              </Text>
            </Text>
          ) : null}
          {invoiceData.seller.swiftBicFieldIsVisible ? (
            <Text style={styles.fontSize8}>
              {t.seller.swiftBic}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.swiftBic}
              </Text>
            </Text>
          ) : null}
          {invoiceData.seller.notesFieldIsVisible &&
          invoiceData?.seller.notes ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.fontSize8]}>
                {invoiceData?.seller.notes}
              </Text>
            </View>
          ) : null}
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
          {invoiceData.buyer.vatNoFieldIsVisible ? (
            <Text style={styles.fontSize7}>
              {invoiceData.buyer.vatNoLabelText}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.buyer.vatNo}
              </Text>
            </Text>
          ) : null}
          {invoiceData.buyer.emailFieldIsVisible ? (
            <Text style={styles.fontSize7}>
              {t.buyer.email}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.buyer.email}
              </Text>
            </Text>
          ) : null}
        </View>

        {invoiceData.buyer.notesFieldIsVisible && invoiceData?.buyer.notes ? (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.fontSize8]}>{invoiceData?.buyer.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
