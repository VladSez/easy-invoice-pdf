import { PDF_DEFAULT_TEMPLATE_STYLES } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import { InvoiceBody } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template/invoice-body";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import {
  INVOICE_DEFAULT_NUMBER_VALUE,
  LAST_DAY_OF_MONTH,
  PAYMENT_DUE,
  TODAY,
} from "@/app/constants";
import { type InvoiceData, type SupportedLanguages } from "@/app/schema";
import { INVOICE_PDF_FONTS } from "@/config";
import { env } from "@/env";

// IMPORTANT: we use @react-pdf/renderer directly here, because we need to render the PDF on the server, not the client
// eslint-disable-next-line no-restricted-imports
import { Document, Font, Page } from "@react-pdf/renderer";

// Open sans seems to be working fine with EN and PL
const fontFamily = "Open Sans";

// we need to duplicate font registration from /invoice-pdf-template/index.tsx due to some technical limitations, otherwise fonts are not applied in the PDF
Font.register({
  family: fontFamily,
  fonts: [
    {
      src: INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_REGULAR,
    },
    {
      src: INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_700,
      fontWeight: 700,
    },
  ],
});

/**
 * This component is used to render the invoice PDF template on the backend
 *
 * It is used to generate the PDF file for the invoice and is DUPLICATED from the frontend component (/invoice-pdf-template/index.tsx), due to technical limitations.
 */
export const InvoicePdfTemplateToRenderOnBackend = ({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) => {
  const invoiceNumberLabel = invoiceData?.invoiceNumberObject?.label;

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const invoiceNumber = `${invoiceNumberLabel} ${invoiceNumberValue}`;
  const invoiceDocTitle = `${invoiceNumber} | Created with https://easyinvoicepdf.com`;

  return (
    <Document title={invoiceDocTitle}>
      <Page size="A4" style={PDF_DEFAULT_TEMPLATE_STYLES.page}>
        <InvoiceBody
          invoiceData={invoiceData}
          styles={PDF_DEFAULT_TEMPLATE_STYLES}
          shouldLocaliseDates={false}
        />
      </Page>
    </Document>
  );
};

const translateInvoiceNumberLabel = ({
  language,
}: {
  language: SupportedLanguages;
}) => {
  const invoiceNumberLabel = `${INVOICE_PDF_TRANSLATIONS[language].invoiceNumber}:`;

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
    vatNoLabelText: "VAT no",
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
    vatNoLabelText: "VAT no",
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

  qrCodeData: "",
  qrCodeDescription: "",
  qrCodeIsVisible: true,

  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,

  template: "default",
  taxLabelText: "VAT",
} as const satisfies InvoiceData;

export const POLISH_INVOICE_REAL_DATA = {
  ...ENGLISH_INVOICE_REAL_DATA,
  language: "pl",
  invoiceNumberObject: {
    label: translateInvoiceNumberLabel({ language: "pl" }),
    value: INVOICE_DEFAULT_NUMBER_VALUE,
  },
} as const satisfies InvoiceData;
