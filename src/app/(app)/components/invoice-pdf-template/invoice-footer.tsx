import { type InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import { PROD_WEBSITE_URL } from "@/config";
import {
  Link,
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";
import { formatCurrency } from "../../utils/format-currency";

export function InvoiceFooter({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: Styles;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const paymentDueDate = dayjs(invoiceData.paymentDue).format(
    invoiceData.dateFormat
  );

  const invoiceTotal = invoiceData?.total;

  const formattedInvoiceTotal = formatCurrency({
    amount: invoiceTotal,
    currency: invoiceData.currency,
    language,
  });

  return (
    <View style={styles.footer} fixed>
      <View style={styles.spaceBetween}>
        <View style={[styles.row, { gap: 3 }]}>
          {invoiceNumberValue && (
            <>
              <Text style={[styles.fontSize8]}>{invoiceNumberValue}</Text>
              <Text style={[styles.fontSize8]}>·</Text>
            </>
          )}
          <Text style={[styles.fontSize8]}>
            {formattedInvoiceTotal} — {t.stripe.due} {paymentDueDate}
          </Text>
          <Text style={[styles.fontSize8]}>·</Text>
          <Text style={[styles.fontSize8]}>
            {t.createdWith}{" "}
            <Link
              style={[styles.fontSize8, { color: "blue" }]}
              src={PROD_WEBSITE_URL}
            >
              https://easyinvoicepdf.com
            </Link>
          </Text>
        </View>
        <Text
          style={[styles.fontSize8]}
          render={({ pageNumber, totalPages }) =>
            `${t.stripe.page} ${pageNumber} ${t.stripe.of} ${totalPages}`
          }
        />
      </View>
    </View>
  );
}
