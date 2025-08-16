import type {
  InvoiceData,
  InvoiceItemData,
  SellerData,
  BuyerData,
} from "@/app/schema";

// Test data fixtures
export const MOCK_SELLER_DATA = {
  id: "seller-123",
  name: "ACME Corp",
  address: "123 Main St, City, 12345",
  vatNo: "VAT123456789",
  vatNoFieldIsVisible: true,
  email: "seller@acme.com",
  accountNumber: "1234567890123456",
  accountNumberFieldIsVisible: true,
  swiftBic: "ABCDUS33XXX",
  swiftBicFieldIsVisible: true,
  notes: "Seller notes",
  notesFieldIsVisible: true,
} as const satisfies SellerData;

export const MOCK_BUYER_DATA = {
  id: "buyer-456",
  name: "XYZ Ltd",
  address: "456 Oak Ave, Town, 67890",
  vatNo: "VAT987654321",
  vatNoFieldIsVisible: true,
  email: "buyer@xyz.com",
  notes: "Buyer notes",
  notesFieldIsVisible: true,
} as const satisfies BuyerData;

export const MOCK_INVOICE_ITEM_DATA = {
  invoiceItemNumberIsVisible: true,
  name: "Product A",
  nameFieldIsVisible: true,
  typeOfGTU: "GTU_01",
  typeOfGTUFieldIsVisible: true,
  amount: 2,
  amountFieldIsVisible: true,
  unit: "pcs",
  unitFieldIsVisible: true,
  netPrice: 100.5,
  netPriceFieldIsVisible: true,
  vat: 23,
  vatFieldIsVisible: true,
  netAmount: 201,
  netAmountFieldIsVisible: true,
  vatAmount: 46.23,
  vatAmountFieldIsVisible: true,
  preTaxAmount: 247.23,
  preTaxAmountFieldIsVisible: true,
} as const satisfies InvoiceItemData;

export const MOCK_INVOICE_DATA = {
  language: "en",
  dateFormat: "YYYY-MM-DD",
  currency: "EUR",
  template: "default",
  logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  invoiceNumberObject: {
    label: "Invoice Number",
    value: "INV-2024-001",
  },
  dateOfIssue: "2024-01-15",
  dateOfService: "2024-01-31",
  invoiceType: "Standard Invoice",
  invoiceTypeFieldIsVisible: true,
  seller: MOCK_SELLER_DATA,
  buyer: MOCK_BUYER_DATA,
  items: [MOCK_INVOICE_ITEM_DATA],
  total: 247.23,
  vatTableSummaryIsVisible: true,
  paymentMethod: "Bank Transfer",
  paymentMethodFieldIsVisible: true,
  paymentDue: "2024-01-29",
  stripePayOnlineUrl: "https://checkout.stripe.com/pay/cs_123",
  notes: "Thank you for your business",
  notesFieldIsVisible: true,
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,
} as const satisfies InvoiceData;
