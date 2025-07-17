import { type InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import {
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer/lib/react-pdf.browser";
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
import dayjs from "dayjs";

export const InvoiceBody = ({
  invoiceData,
  styles,
  shouldLocaliseDates = true,
}: {
  invoiceData: InvoiceData;
  styles: Styles;
  shouldLocaliseDates?: boolean;
}) => {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

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

      <View style={{ marginTop: vatTableSummaryIsVisible ? 0 : 15 }}>
        <InvoicePaymentTotals
          invoiceData={invoiceData}
          formattedInvoiceTotal={formattedInvoiceTotal}
          styles={styles}
        />
      </View>

      {/* Signature section */}
      {signatureSectionIsVisible && (
        <View style={styles.signatureSection}>
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

      {/* Footer  */}
      <InvoiceFooter invoiceData={invoiceData} styles={styles} />
    </>
  );
};
