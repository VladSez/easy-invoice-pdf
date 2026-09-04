import { type InvoiceData } from "@/app/schema";

/**
 * A fully hardcoded, obviously-fake invoice used by `/api/generate-invoice/preview?sample=true`.
 *
 * IMPORTANT: this exists so tests never render the real seller/buyer data that
 * `getEnglishInvoiceRealData()` reads from env. The e2e visual snapshots are
 * committed to the repo, so anything they render is public — keep every value
 * here fictional, and never reference `env` from this file.
 *
 * Every date and the invoice number are fixed, which is what makes the committed
 * snapshot stable over time.
 */
export const SAMPLE_INVOICE_DATA = {
  language: "en",
  dateFormat: "YYYY-MM-DD",
  currency: "EUR",

  invoiceNumberObject: {
    label: "Invoice No. of:",
    value: "1/01-2026",
  },

  dateOfIssue: "2026-01-15",
  dateOfServiceStart: "2026-01-01",
  dateOfService: "2026-01-31",
  paymentDue: "2026-01-31",

  servicePeriodFieldIsVisible: false,
  dateOfServiceFieldIsVisible: true,
  servicePeriodLabelText: "Service period",
  dateOfServiceLabelText: "Date of sales/of executing the service",

  invoiceType: "Reverse Charge",
  invoiceTypeFieldIsVisible: true,

  seller: {
    name: "Sample Seller Ltd.",
    address: "1 Example Street, 00-001 Sampletown",

    vatNo: "PL0000000000",
    vatNoLabelText: "VAT no",
    vatNoFieldIsVisible: true,

    email: "seller@example.com",
    emailFieldIsVisible: true,

    accountNumber: "PL00 0000 0000 0000 0000 0000 0000",
    accountNumberFieldIsVisible: true,

    swiftBic: "EXAMPLEBIC",
    swiftBicFieldIsVisible: true,

    notesFieldIsVisible: true,
  },
  buyer: {
    name: "Sample Buyer B.V.",
    address: "2 Placeholder Avenue, 1000 AA Exampleburg",

    vatNo: "NL000000000B00",
    vatNoLabelText: "VAT no",
    vatNoFieldIsVisible: true,

    email: "buyer@example.com",
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
      netPrice: 1000,
      netPriceFieldIsVisible: true,
      vat: "NP",
      vatFieldIsVisible: true,
      netAmount: 1000,
      netAmountFieldIsVisible: true,
      vatAmount: 0,
      vatAmountFieldIsVisible: true,
      preTaxAmount: 1000,
      preTaxAmountFieldIsVisible: true,
    },
  ],
  total: 1000,
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
} as const satisfies InvoiceData;
