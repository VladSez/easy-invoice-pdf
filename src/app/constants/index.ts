import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_DATE_FORMATS,
  type InvoiceData,
  type SellerData,
  type BuyerData,
} from "../schema";
import { TRANSLATIONS } from "../schema/translations";
import dayjs from "dayjs";

const today = dayjs().format("YYYY-MM-DD");
const lastDayOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
const invoiceCurrentMonthAndYear = dayjs().format("MM-YYYY");
const paymentDue = dayjs(today).add(14, "days").format("YYYY-MM-DD");

const EUR = SUPPORTED_CURRENCIES[0];
const EN = SUPPORTED_LANGUAGES[0];
const DEFAULT_DATE_FORMAT = SUPPORTED_DATE_FORMATS[0];

/**
 * Default seller data
 *
 * This is the default data that will be used if the user doesn't provide their own data
 */
export const DEFAULT_SELLER_DATA = {
  name: "Seller name",
  address: "Seller address",

  vatNo: "Seller vat number",
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
  invoiceNumberObject: {
    label: `${TRANSLATIONS[EN].invoiceNumber}:`,
    value: `1/${invoiceCurrentMonthAndYear}`,
  },

  dateOfIssue: today,
  dateOfService: lastDayOfMonth,
  dateFormat: DEFAULT_DATE_FORMAT,

  invoiceType: "Reverse Charge",
  invoiceTypeFieldIsVisible: true,

  seller: DEFAULT_SELLER_DATA,
  buyer: DEFAULT_BUYER_DATA,

  items: [
    {
      invoiceItemNumberIsVisible: true,

      name: "Item name",
      nameFieldIsVisible: true,

      typeOfGTU: "",
      typeOfGTUFieldIsVisible: false,

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

  paymentDue: paymentDue,

  notes: "Reverse charge",
  notesFieldIsVisible: true,

  vatTableSummaryIsVisible: true,
  paymentMethodFieldIsVisible: true,
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,
} as const satisfies InvoiceData;
