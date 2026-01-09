import { type InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { PROD_WEBSITE_URL } from "@/config";
import { Link, Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";
import { formatCurrency } from "../../../utils/format-currency";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

export function InvoiceFooter({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const paymentDueDate = dayjs(invoiceData.paymentDue).format(
    invoiceData.dateFormat,
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
            {formattedInvoiceTotal} {t.stripe.due} {paymentDueDate}
          </Text>
          <Text style={[styles.fontSize8]}>·</Text>
          <Text style={[styles.fontSize8]}>
            {t.createdWith}{" "}
            <Link
              style={[styles.fontSize8, { color: "blue" }]}
              src={`${PROD_WEBSITE_URL}?ref=pdf`}
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
