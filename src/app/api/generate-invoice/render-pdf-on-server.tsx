import { PDF_DEFAULT_TEMPLATE_STYLES } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import { InvoiceBody } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template/invoice-body";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { INVOICE_DEFAULT_NUMBER_VALUE } from "@/app/constants";
import { type InvoiceData, type SupportedLanguages } from "@/app/schema";
import { INVOICE_PDF_FONTS } from "@/config";
import { env } from "@/env";
import dayjs from "dayjs";

// IMPORTANT: it's fine to use on server directly
// eslint-disable-next-line no-restricted-imports
import { Document, Font, Page, renderToBuffer } from "@react-pdf/renderer";

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
const InvoicePdfTemplateToRenderOnBackend = ({
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

/**
 * Renders invoice data to a PDF buffer for server-side (backend) usage.
 *
 * @param invoiceData - Data for invoice to be rendered.
 */
export function renderInvoicePdfBuffer({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  return renderToBuffer(
    <InvoicePdfTemplateToRenderOnBackend invoiceData={invoiceData} />,
  );
}

/**
 * Returns translated invoice number label based on language.
 *
 * Example:
 * ```typescript
 * const invoiceNumberLabel = translateInvoiceNumberLabel({ language: "en" });
 * // Returns: "Invoice Number:"
 *
 * const invoiceNumberLabel = translateInvoiceNumberLabel({ language: "pl" });
 * // Returns: "Numer faktury:"
 * ```
 *
 * @param language - Supported language key.
 */
const translateInvoiceNumberLabel = ({
  language,
}: {
  language: SupportedLanguages;
}) => {
  const invoiceNumberLabel = `${INVOICE_PDF_TRANSLATIONS[language].invoiceNumber}:`;

  return invoiceNumberLabel;
};

const INVOICE_NET_PRICE = Number(env.INVOICE_NET_PRICE) || 0;

/** Recomputed each call so warm servers do not reuse module-load dates. (to avoid outdated dates in the PDF) */
function getInvoiceDefaultDates(): Pick<
  InvoiceData,
  "dateOfIssue" | "dateOfService" | "paymentDue" | "dateOfServiceStart"
> {
  const now = dayjs();
  const lastDayOfMonth = now.endOf("month").format("YYYY-MM-DD");
  const firstDayOfMonth = now.startOf("month").format("YYYY-MM-DD");

  return {
    dateOfIssue: now.format("YYYY-MM-DD"),
    dateOfServiceStart: firstDayOfMonth,
    dateOfService: lastDayOfMonth,
    // Same as date of service: last day of the month as the default payment due date
    paymentDue: lastDayOfMonth,
  };
}

const ENGLISH_INVOICE_REAL_DATA_BASE = {
  language: "en",
  dateFormat: "YYYY-MM-DD",
  currency: "EUR",

  invoiceNumberObject: {
    label: "Invoice No. of:",
    value: INVOICE_DEFAULT_NUMBER_VALUE,
  },

  servicePeriodFieldIsVisible: false,
  dateOfServiceFieldIsVisible: true,
  servicePeriodLabelText: "Service period",
  dateOfServiceLabelText: "Date of sales/of executing the service",

  invoiceType: "Reverse Charge",
  invoiceTypeFieldIsVisible: true,
  seller: {
    name: env.SELLER_NAME,
    address: env.SELLER_ADDRESS,

    vatNo: env.SELLER_VAT_NO,
    vatNoLabelText: "VAT no",
    vatNoFieldIsVisible: true,

    email: env.SELLER_EMAIL,
    emailFieldIsVisible: true,
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
    emailFieldIsVisible: true,
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

  personAuthorizedToReceiveName: "",
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueName: "",
  personAuthorizedToIssueFieldIsVisible: true,

  template: "default",
  taxLabelText: "VAT",
} satisfies Omit<
  InvoiceData,
  "dateOfIssue" | "dateOfService" | "paymentDue" | "dateOfServiceStart"
>;

/**
 * Get English invoice data with current default dates.
 *
 * Spreads ENGLISH_INVOICE_REAL_DATA_BASE and injects freshly computed date fields
 * using getInvoiceDefaultDates() on each call, ensuring no stale data due to
 * serverless warm starts.
 *
 * @returns {InvoiceData} Invoice data object, ready for English invoice rendering.
 */
export function getEnglishInvoiceRealData(): InvoiceData {
  return {
    ...ENGLISH_INVOICE_REAL_DATA_BASE,
    ...getInvoiceDefaultDates(), // IMPORTANT: recomputed each call so warm servers do not reuse module-load dates (to avoid outdated dates in the PDF)
  };
}

/**
 * Get Polish invoice data with current default dates.
 *
 * Spreads English invoice data and injects freshly computed date fields
 * using getInvoiceDefaultDates() on each call, ensuring no stale data due to
 * serverless warm starts.
 *
 * @param englishInvoiceData - English invoice data to spread.
 * @returns {InvoiceData} Invoice data object, ready for Polish invoice rendering.
 */
export function getPolishInvoiceRealData(
  englishInvoiceData: InvoiceData,
): InvoiceData {
  return {
    ...englishInvoiceData,
    language: "pl",
    invoiceNumberObject: {
      label: translateInvoiceNumberLabel({ language: "pl" }),
      value:
        englishInvoiceData.invoiceNumberObject?.value ??
        INVOICE_DEFAULT_NUMBER_VALUE,
    },
    buyer: {
      ...englishInvoiceData.buyer,
      vatNoLabelText: "NIP",
    },
    seller: {
      ...englishInvoiceData.seller,
      vatNoLabelText: "NIP",
    },
  };
}
