import { View, Text } from "@react-pdf/renderer/lib/react-pdf.browser";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";
import {
  getAmountInWords,
  getNumberFractionalPart,
} from "@/utils/invoice.utils";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import {
  formatAmount,
  formatAmountInWordsWithCurrency,
} from "../../../utils/format-amount";

/**
 * To pay, paid, left to pay and amount in words fields
 */
export function InvoicePaymentTotals({
  invoiceData,
  formattedInvoiceTotal,
  styles,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  const invoiceTotalInWords = getAmountInWords({
    amount: invoiceData?.total ?? 0,
    language,
  });

  const fractionalPart = getNumberFractionalPart(invoiceData?.total ?? 0);

  const currency = invoiceData.currency;

  /**
   * Nothing is ever paid up front, so the paid line is a hardcoded zero -- but it still has
   * to be punctuated like every other number on the invoice, or a Polish invoice reads
   * "0.00 EUR" one line above "3 300,00 EUR".
   */
  const formattedZero = formatAmount({
    amount: 0,
    numberFormatLocale: resolveNumberFormatLocale(invoiceData),
  });

  const amountInWordsWithCurrency = formatAmountInWordsWithCurrency({
    amountInWords: invoiceTotalInWords,
    currency,
    fractionalPart,
  });

  return (
    <View style={{ maxWidth: "55%" }}>
      <View style={{ width: "auto", alignSelf: "flex-start", marginTop: 0 }}>
        <Text
          style={[
            styles.subheader,
            {
              borderBottom: "1px solid black",
            },
            styles.fontSize11,
            styles.fontBold,
          ]}
        >
          {t.paymentTotals.toPay}: {formattedInvoiceTotal} {currency}
        </Text>
      </View>

      <Text style={styles.fontSize7}>
        {t.paymentTotals.paid}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {formattedZero} {currency}
        </Text>
      </Text>

      <Text style={[styles.boldText, styles.fontSize7]}>
        {t.paymentTotals.leftToPay}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {formattedInvoiceTotal} {currency}
        </Text>
      </Text>

      <Text style={styles.fontSize7}>
        {t.paymentTotals.amountInWords}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {amountInWordsWithCurrency}
        </Text>
      </Text>
    </View>
  );
}
