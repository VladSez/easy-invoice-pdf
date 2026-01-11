import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import dayjs from "dayjs";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

export function InvoicePaymentInfo({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  const paymentDate = dayjs(invoiceData.paymentDue).format(
    invoiceData.dateFormat,
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
