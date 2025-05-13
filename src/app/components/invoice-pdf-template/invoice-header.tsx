import {
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer/lib/react-pdf.browser";
// import { styles } from ".";
import { type InvoiceData } from "@/app/schema";
import dayjs from "dayjs";
import { TRANSLATIONS } from "@/app/schema/translations";

export function InvoiceHeader({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: Styles;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  const dateOfIssue = dayjs(invoiceData.dateOfIssue).format(
    invoiceData.dateFormat
  );
  const dateOfService = dayjs(invoiceData.dateOfService).format(
    invoiceData.dateFormat
  );

  const invoiceNumberLabel = invoiceData?.invoiceNumberObject?.label;

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const invoiceNumber = `${invoiceNumberLabel} ${invoiceNumberValue}`;

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 7,
      }}
    >
      <View>
        <Text style={[styles.header]}>{invoiceNumber}</Text>

        {invoiceData?.invoiceType && invoiceData.invoiceTypeFieldIsVisible && (
          <Text
            style={[styles.fontBold, styles.fontSize8, { maxWidth: "250px" }]}
          >
            {invoiceData?.invoiceType}
          </Text>
        )}
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Text style={styles.fontSize7}>
          {t.dateOfIssue}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>{dateOfIssue}</Text>
        </Text>
        <Text style={styles.fontSize7}>
          {t.dateOfService}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {dateOfService}
          </Text>
        </Text>
      </View>
    </View>
  );
}
