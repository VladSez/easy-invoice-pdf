import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import { InvoiceQRCode } from "@/app/(main)/(app)/components/invoice-templates/common/invoice-qr-code";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import { formatAmountChunks } from "../../../utils/format-amount";
import { InvoiceFooter } from "./invoice-footer";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceItemsTable } from "./invoice-items-table";
import { InvoicePaymentInfo } from "./invoice-payment-info";
import { InvoicePaymentTotals } from "./invoice-payment-totals";
import { InvoiceSellerBuyerInfo } from "./invoice-seller-buyer-info";
import { InvoiceVATSummaryTable } from "./invoice-vat-summary-table";
import "dayjs/locale/en";
import "dayjs/locale/pl";
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/uk";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/nl";

export const InvoiceBody = ({
  invoiceData,
  styles,
  shouldLocaliseDates = true,
  qrCodeDataUrl = "",
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
  shouldLocaliseDates?: boolean;
  qrCodeDataUrl?: string;
}) => {
  const language = invoiceData.language;
  const t = INVOICE_PDF_TRANSLATIONS[language];

  if (shouldLocaliseDates) {
    dayjs.locale(language);
  }

  const invoiceTotal = invoiceData?.total;

  const invoiceTotalChunks = formatAmountChunks({
    amount: invoiceTotal,
    numberFormatLocale: resolveNumberFormatLocale(invoiceData),
  });

  // The VAT summary prints the total into a 69pt cell and takes the pieces; every other
  // place prints it into running text and takes them joined back up
  const formattedInvoiceTotal = invoiceTotalChunks.join("");

  const signatureSectionIsVisible =
    invoiceData.personAuthorizedToReceiveFieldIsVisible ||
    invoiceData.personAuthorizedToIssueFieldIsVisible;

  const vatTableSummaryIsVisible = invoiceData.vatTableSummaryIsVisible;

  const isQrCodeVisible =
    invoiceData?.qrCodeIsVisible && qrCodeDataUrl && qrCodeDataUrl.length > 0;

  return (
    <>
      <InvoiceHeader invoiceData={invoiceData} styles={styles} />
      <InvoiceSellerBuyerInfo invoiceData={invoiceData} styles={styles} />

      <InvoiceItemsTable
        invoiceData={invoiceData}
        formattedInvoiceTotal={formattedInvoiceTotal}
        styles={styles}
      />

      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ width: "50%" }}>
          {/** Payment date and payment method fields */}
          <InvoicePaymentInfo invoiceData={invoiceData} styles={styles} />
        </View>

        {vatTableSummaryIsVisible ? (
          <View style={{ width: "50%" }}>
            <InvoiceVATSummaryTable
              invoiceData={invoiceData}
              invoiceTotalChunks={invoiceTotalChunks}
              styles={styles}
            />
          </View>
        ) : null}
      </View>

      {/** To pay, paid, left to pay and amount in words fields */}
      <View
        style={{ marginTop: vatTableSummaryIsVisible ? 0 : 15 }}
        wrap={false}
        minPresenceAhead={50}
      >
        <InvoicePaymentTotals
          invoiceData={invoiceData}
          formattedInvoiceTotal={formattedInvoiceTotal}
          styles={styles}
        />
      </View>

      {/* Signature section */}
      {signatureSectionIsVisible ? (
        <View
          style={styles.signatureSection}
          wrap={false}
          minPresenceAhead={50}
        >
          {invoiceData.personAuthorizedToReceiveFieldIsVisible ? (
            <View style={styles.signatureColumn}>
              {invoiceData.personAuthorizedToReceiveName ? (
                <Text style={[styles.signatureText, { marginTop: -13 }]}>
                  {invoiceData.personAuthorizedToReceiveName}
                </Text>
              ) : null}
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>
                {t.personAuthorizedToReceive}
              </Text>
            </View>
          ) : null}
          {invoiceData.personAuthorizedToIssueFieldIsVisible ? (
            <View style={styles.signatureColumn}>
              {invoiceData.personAuthorizedToIssueName ? (
                <Text style={[styles.signatureText, { marginTop: -13 }]}>
                  {invoiceData.personAuthorizedToIssueName}
                </Text>
              ) : null}
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>
                {t.personAuthorizedToIssue}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Notes */}
      {invoiceData.notesFieldIsVisible ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.fontSize8}>{invoiceData?.notes}</Text>
        </View>
      ) : null}

      {/* QR Code - centered below notes */}
      {isQrCodeVisible ? (
        <InvoiceQRCode
          qrCodeDataUrl={qrCodeDataUrl}
          description={invoiceData.qrCodeDescription}
        />
      ) : null}

      {/* Footer  */}
      <InvoiceFooter invoiceData={invoiceData} styles={styles} />
    </>
  );
};
