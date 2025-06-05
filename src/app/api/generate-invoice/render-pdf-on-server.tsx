import { InvoiceHeader } from "@/app/(app)/components/invoice-pdf-template/invoice-header";
import { InvoiceItemsTable } from "@/app/(app)/components/invoice-pdf-template/invoice-items-table";
import { InvoicePaymentInfo } from "@/app/(app)/components/invoice-pdf-template/invoice-payment-info";
import { InvoicePaymentTotals } from "@/app/(app)/components/invoice-pdf-template/invoice-payment-totals";
import { InvoiceSellerBuyerInfo } from "@/app/(app)/components/invoice-pdf-template/invoice-seller-buyer-info";
import { InvoiceVATSummaryTable } from "@/app/(app)/components/invoice-pdf-template/invoice-vat-summary-table";
import {
  INVOICE_DEFAULT_NUMBER_VALUE,
  LAST_DAY_OF_MONTH,
  PAYMENT_DUE,
  TODAY,
} from "@/app/constants";
import type { InvoiceData, SupportedLanguages } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import { STATIC_ASSETS_URL } from "@/config";
import { env } from "@/env";
// eslint-disable-next-line no-restricted-imports
import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// Open sans seems to be working fine with EN and PL
const fontFamily = "Open Sans";
const fontFamilyBold = "Open Sans";

// we need to duplicate font registration from invoice-pdf-template.tsx for some reason
// otherwise fonts are not applied
Font.register({
  family: fontFamily,
  fonts: [
    {
      src: `${STATIC_ASSETS_URL}/open-sans-regular.ttf`,
    },
    {
      src: `${STATIC_ASSETS_URL}/open-sans-700.ttf`,
      fontWeight: 700,
    },
  ],
});

// we need to duplicate styles from invoice-pdf-template.tsx for some reason
// otherwise styles are not applied
const styles = StyleSheet.create({
  wFull: {
    width: "100%",
  },
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: fontFamily,
    fontWeight: 400,
  },
  header: {
    fontSize: 16,
    marginBottom: 0,
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  subheader: {
    fontSize: 12,
    marginBottom: 3,
    borderBottom: "1px solid gray",
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  fontSize7: {
    fontSize: 7,
  },
  fontSize8: {
    fontSize: 8,
  },
  fontSize9: {
    fontSize: 9,
  },
  fontSize10: {
    fontSize: 10,
  },
  fontSize11: {
    fontSize: 11,
  },
  fontBold: {
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  boldText: {
    fontFamily: fontFamilyBold,
    fontWeight: 600,
    fontSize: 7,
  },
  table: {
    display: "flex",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "gray",
  },

  tableRow: {
    flexDirection: "row",
    width: "100%",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "gray",
    textAlign: "center",
  },
  tableCell: {
    marginTop: 1.5,
    marginBottom: 1.5,
    fontSize: 8,
  },
  tableCellBold: {
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 2,
    marginRight: 2,
    fontSize: 8,
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  // styles for specific column widths for invoice items table
  colNo: { flex: 0.45 }, // smallest width for numbers
  colName: { flex: 5 }, // larger width for text
  colGTU: { flex: 0.9 }, // small width for codes
  colAmount: { flex: 1.1 }, // medium width for numbers
  colUnit: { flex: 1 }, // medium width for text
  colNetPrice: { flex: 1.5 }, // medium-large for prices
  colVAT: { flex: 0.7 }, // small width for percentages
  colNetAmount: { flex: 1.5 }, // medium-large for amounts
  colVATAmount: { flex: 1.5 }, // medium-large for amounts
  colPreTaxAmount: { flex: 1.5 }, // medium-large for amounts
  signatureSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 70,
    width: "100%",
  },
  signatureColumn: {
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
    marginHorizontal: "5%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "dashed",
    width: "100%",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1px solid #000",
    paddingTop: 5,
  },
  footerText: {
    fontSize: 8,
    color: "#000",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
} as const);

/**
 * This component is used to render the invoice PDF template on the backend
 *
 * It is used to generate the PDF file for the invoice and is duplicated from the frontend component, due to some issues.
 */
export const InvoicePdfTemplateToRenderOnBackend = ({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) => {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];

  const formattedInvoiceTotal = invoiceData?.total
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replaceAll(",", " ");

  const vatTableSummaryIsVisible = invoiceData.vatTableSummaryIsVisible;

  const signatureSectionIsVisible =
    invoiceData.personAuthorizedToReceiveFieldIsVisible ||
    invoiceData.personAuthorizedToIssueFieldIsVisible;

  const invoiceNumberLabel = invoiceData?.invoiceNumberObject?.label;

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const invoiceNumber = `${invoiceNumberLabel} ${invoiceNumberValue}`;
  const invoiceDocTitle = `${invoiceNumber} | Created with https://easyinvoicepdf.com`;

  return (
    <Document title={invoiceDocTitle}>
      <Page size="A4" style={styles.page}>
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
        <View style={styles.footer}>
          <Text style={[styles.fontSize9]}>
            {t.createdWith}{" "}
            <Link
              style={[styles.fontSize9, { color: "blue" }]}
              src={"https://easyinvoicepdf.com"}
            >
              https://easyinvoicepdf.com
            </Link>
          </Text>
          {/* Page number */}
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

const translateInvoiceNumberLabel = ({
  language,
}: {
  language: SupportedLanguages;
}) => {
  const invoiceNumberLabel = `${TRANSLATIONS[language].invoiceNumber}:`;

  return invoiceNumberLabel;
};

const INVOICE_NET_PRICE = Number(env.INVOICE_NET_PRICE) || 0;

export const ENGLISH_INVOICE_REAL_DATA = {
  language: "en",
  dateFormat: "YYYY-MM-DD",
  currency: "EUR",

  invoiceNumberObject: {
    label: "Invoice No. of:",
    value: INVOICE_DEFAULT_NUMBER_VALUE,
  },

  dateOfIssue: TODAY,
  dateOfService: LAST_DAY_OF_MONTH,
  paymentDue: PAYMENT_DUE,

  invoiceType: "Reverse Charge",
  invoiceTypeFieldIsVisible: true,
  seller: {
    name: env.SELLER_NAME,
    address: env.SELLER_ADDRESS,

    vatNo: env.SELLER_VAT_NO,
    vatNoFieldIsVisible: true,

    email: env.SELLER_EMAIL,
    accountNumber: env.SELLER_ACCOUNT_NUMBER,
    accountNumberFieldIsVisible: true,

    swiftBic: env.SELLER_SWIFT_BIC,
    swiftBicFieldIsVisible: true,

    notesFieldIsVisible: true,
  },
  buyer: {
    name: env.BUYER_NAME,
    address: env.BUYER_ADDRESS,

    vatNo: env.BUYER_VAT_NO,
    vatNoFieldIsVisible: true,

    email: env.BUYER_EMAIL,
    notesFieldIsVisible: true,
  },
  items: [
    {
      invoiceItemNumberIsVisible: true,
      name: "Software Development",
      nameFieldIsVisible: true,
      typeOfGTU: "",
      typeOfGTUFieldIsVisible: false,
      amount: 1,
      amountFieldIsVisible: true,
      unit: "service",
      unitFieldIsVisible: true,
      netPrice: INVOICE_NET_PRICE,
      netPriceFieldIsVisible: true,
      vat: "NP",
      vatFieldIsVisible: true,
      netAmount: INVOICE_NET_PRICE,
      netAmountFieldIsVisible: true,
      vatAmount: 0,
      vatAmountFieldIsVisible: true,
      preTaxAmount: INVOICE_NET_PRICE,
      preTaxAmountFieldIsVisible: true,
    },
  ],
  total: INVOICE_NET_PRICE,
  vatTableSummaryIsVisible: true,
  paymentMethod: "wire transfer",
  paymentMethodFieldIsVisible: true,

  notes: "Reverse charge",
  notesFieldIsVisible: true,
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,

  template: "default",
} as const satisfies InvoiceData;

export const POLISH_INVOICE_REAL_DATA = {
  ...ENGLISH_INVOICE_REAL_DATA,
  language: "pl",
  invoiceNumberObject: {
    label: translateInvoiceNumberLabel({ language: "pl" }),
    value: INVOICE_DEFAULT_NUMBER_VALUE,
  },
} as const satisfies InvoiceData;
