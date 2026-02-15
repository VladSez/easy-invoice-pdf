import { type InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { InvoiceFooter } from "./invoice-footer";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceItemsTable } from "./invoice-items-table";
import { InvoicePaymentInfo } from "./invoice-payment-info";
import { InvoicePaymentTotals } from "./invoice-payment-totals";
import { InvoiceSellerBuyerInfo } from "./invoice-seller-buyer-info";
import { InvoiceVATSummaryTable } from "./invoice-vat-summary-table";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

import dayjs from "dayjs";
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
import { InvoiceQRCode } from "@/app/(app)/components/invoice-templates/common/invoice-qr-code";

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

  const formattedInvoiceTotal =
    typeof invoiceTotal === "number"
      ? invoiceTotal
          .toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          .replaceAll(",", " ")
      : "0.00";

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

        {vatTableSummaryIsVisible && (
          <View style={{ width: "50%" }}>
            <InvoiceVATSummaryTable
              invoiceData={invoiceData}
              formattedInvoiceTotal={formattedInvoiceTotal}
              styles={styles}
            />
          </View>
        )}
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
      {signatureSectionIsVisible && (
        <View
          style={styles.signatureSection}
          wrap={false}
          minPresenceAhead={50}
        >
          {invoiceData.personAuthorizedToReceiveFieldIsVisible && (
            <View style={styles.signatureColumn}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>
                {t.personAuthorizedToReceive}
              </Text>
            </View>
          )}
          {invoiceData.personAuthorizedToIssueFieldIsVisible && (
            <View style={styles.signatureColumn}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>
                {t.personAuthorizedToIssue}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {invoiceData.notesFieldIsVisible && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.fontSize8}>{invoiceData?.notes}</Text>
        </View>
      )}

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
