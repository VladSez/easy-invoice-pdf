import { Link, Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";
import { PROD_WEBSITE_URL } from "@/config";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import { formatAmount } from "../../../utils/format-amount";

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

  /**
   * The footer writes the total the same way the body does -- it used to be the one place in
   * this template that localised the number and printed a currency symbol, so a German
   * invoice read "321 200.00 EUR" in its totals and "321.200,00 €" at its foot.
   */
  const formattedInvoiceTotal = formatAmount({
    amount: invoiceTotal,
    numberFormatLocale: resolveNumberFormatLocale(invoiceData),
  });

  return (
    <View style={styles.footer} fixed>
      <View style={styles.spaceBetween}>
        <View style={[styles.row, { gap: 3 }]}>
          {invoiceNumberValue ? (
            <>
              <Text style={[styles.fontSize8]}>{invoiceNumberValue}</Text>
              <Text style={[styles.fontSize8]}>·</Text>
            </>
          ) : null}
          <Text style={[styles.fontSize8]}>
            {formattedInvoiceTotal} {invoiceData.currency} {t.stripe.due}{" "}
            {paymentDueDate}
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
