import { Link, Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import type { STRIPE_TEMPLATE_STYLES } from ".";
import { formatDateWithLocale } from "../../format/format-date-with-locale";
import { INVOICE_PDF_TRANSLATIONS } from "../../pdf-translations/pdf-translations";
import { type InvoiceData } from "../../schema";
import { PROD_WEBSITE_URL } from "../common/pdf-template-config";
import { resolveInvoiceNumber } from "../common/resolve-invoice-number";

export function StripeFooter({
  invoiceData,
  formattedInvoiceTotal,
  styles,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  const { value: invoiceNumber } = resolveInvoiceNumber(invoiceData);

  const paymentDueDate = formatDateWithLocale({
    date: invoiceData.paymentDue,
    selectedDateFormat: invoiceData.dateFormat,
    language: invoiceData.language,
  });

  return (
    <View style={styles.footer} fixed>
      <View style={styles.spaceBetween}>
        <View style={[styles.row, { gap: 3 }]}>
          {invoiceNumber ? (
            <>
              <Text style={[styles.fontSize8]}>{invoiceNumber}</Text>
              <Text style={[styles.fontSize8]}>·</Text>
            </>
          ) : null}
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
          render={({ pageNumber, totalPages }) => {
            return `${t.stripe.page} ${pageNumber} ${t.stripe.of} ${totalPages}`;
          }}
        />
      </View>
    </View>
  );
}
