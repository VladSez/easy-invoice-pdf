import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import dayjs from "dayjs";
import { TRANSLATIONS } from "@/app/schema/translations";

export function InvoicePaymentInfo({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  const paymentDate = dayjs(invoiceData.paymentDue).format(
    invoiceData.dateFormat
  );

  const paymentMethodIsVisible = invoiceData.paymentMethodFieldIsVisible;

  return (
    <View style={{ maxWidth: "250px" }}>
      {paymentMethodIsVisible && (
        <Text style={styles.fontSize7}>
          {t.paymentInfo.paymentMethod}:{" "}
          <Text style={[styles.boldText, styles.fontSize8]}>
            {invoiceData?.paymentMethod}
          </Text>
        </Text>
      )}
      <Text
        style={[
          styles.fontSize7,
          { marginLeft: paymentMethodIsVisible ? 9.75 : 0 },
        ]}
      >
        {t.paymentInfo.paymentDate}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>{paymentDate}</Text>
      </Text>
    </View>
  );
}
