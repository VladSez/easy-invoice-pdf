import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_TEMPLATES,
  DEFAULT_DATE_FORMAT,
  type InvoiceData,
  type SellerData,
  type BuyerData,
} from "../schema";
import { INVOICE_PDF_TRANSLATIONS } from "../(app)/pdf-i18n-translations/pdf-translations";
import dayjs from "dayjs";

export const TODAY = dayjs().format("YYYY-MM-DD");
export const LAST_DAY_OF_MONTH = dayjs().endOf("month").format("YYYY-MM-DD");
export const PAYMENT_DUE = dayjs(TODAY).add(14, "days").format("YYYY-MM-DD");
const INVOICE_CURRENT_MONTH_AND_YEAR = dayjs().format("MM-YYYY");

const EUR = SUPPORTED_CURRENCIES[0];
const EN = SUPPORTED_LANGUAGES[0];
const DEFAULT_TEMPLATE = SUPPORTED_TEMPLATES[0];

export const INVOICE_DEFAULT_NUMBER_VALUE = `1/${INVOICE_CURRENT_MONTH_AND_YEAR}`;

/**
 * Default seller data
 *
 * This is the default data that will be used if the user doesn't provide their own data
 */
export const DEFAULT_SELLER_DATA = {
  name: "Seller name",
  address: "Seller address",

  vatNo: "Seller vat number",
  vatNoLabelText: "VAT no",
  vatNoFieldIsVisible: true,

  email: "seller@email.com",

  accountNumber: "Seller account number",
  accountNumberFieldIsVisible: true,

  swiftBic: "Seller swift bic",
  swiftBicFieldIsVisible: true,

  // field for additional notes about the seller (not visible by default)
  notes: "",
  notesFieldIsVisible: true,
} as const satisfies Omit<SellerData, "id">;

/**
 * Default buyer data
 *
 * This is the default data that will be used if the user doesn't provide their own data
 */
export const DEFAULT_BUYER_DATA = {
  name: "Buyer name",
  address: "Buyer address",

  vatNo: "Buyer vat number",
  vatNoLabelText: "VAT no",
  vatNoFieldIsVisible: true,

  email: "buyer@email.com",

  // field for additional notes about the buyer (not visible by default)
  notes: "",
  notesFieldIsVisible: true,
} as const satisfies Omit<BuyerData, "id">;

/**
 * Initial invoice data
 *
 * This is the initial data that will be used when the user first opens the app or clears the invoice data
 */
export const INITIAL_INVOICE_DATA = {
  language: EN,
  currency: EUR,
  template: DEFAULT_TEMPLATE,

  logo: "",
  stripePayOnlineUrl: "",

  invoiceNumberObject: {
    label: `${INVOICE_PDF_TRANSLATIONS[EN].invoiceNumber}:`,
    value: INVOICE_DEFAULT_NUMBER_VALUE,
  },

  dateOfIssue: TODAY,
  dateOfService: LAST_DAY_OF_MONTH,
  dateFormat: DEFAULT_DATE_FORMAT,

  invoiceType: "",
  invoiceTypeFieldIsVisible: true,

  seller: DEFAULT_SELLER_DATA,
  buyer: DEFAULT_BUYER_DATA,

  items: [
    {
      invoiceItemNumberIsVisible: true,

      name: "Item name",
      nameFieldIsVisible: true,

      typeOfGTU: "",
      typeOfGTUFieldIsVisible: false, // we hide this field by default because it's not always needed

      amount: 1,
      amountFieldIsVisible: true,

      unit: "service",
      unitFieldIsVisible: true,

      netPrice: 0,
      netPriceFieldIsVisible: true,

      vat: "NP",
      vatFieldIsVisible: true,

      netAmount: 0,
      netAmountFieldIsVisible: true,

      vatAmount: 0.0,
      vatAmountFieldIsVisible: true,

      preTaxAmount: 0,
      preTaxAmountFieldIsVisible: true,
    },
  ],
  total: 0,
  paymentMethod: "wire transfer",

  paymentDue: PAYMENT_DUE,

  notes: "Reverse charge",
  notesFieldIsVisible: true,

  qrCodeData: "",
  qrCodeDescription: "",
  qrCodeIsVisible: true,

  vatTableSummaryIsVisible: true,
  paymentMethodFieldIsVisible: true,
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,

  taxLabelText: "VAT",
} as const satisfies InvoiceData;
