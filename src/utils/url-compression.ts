/**
 * URL Compression Utilities
 *
 * This module provides utilities to compress and decompress invoice data for URL sharing
 * by remapping long JSON keys to shorter identifiers before compression.
 */

import type {
  InvoiceData,
  InvoiceItemData,
  SellerData,
  BuyerData,
} from "@/app/schema";

/**
 * Type that extracts all possible keys from InvoiceData and its nested objects
 */
export type AllInvoiceKeys =
  // Root level InvoiceData keys
  | keyof InvoiceData
  // Invoice number object keys
  | keyof NonNullable<InvoiceData["invoiceNumberObject"]>
  // Seller data keys
  | keyof SellerData
  // Buyer data keys
  | keyof BuyerData
  // Invoice item keys
  | keyof InvoiceItemData;

/**
 * Mapping of full invoice property names to short keys for URL compression
 * This significantly reduces the size of the JSON before compression
 *
 * @example
 * ```typescript
 * const data = { language: "en", dateFormat: "YYYY-MM-DD" };
 * const compressed = remapKeys(data);
 * // Returns: { "a": "en", "b": "YYYY-MM-DD" }
 * ```
 */
export const INVOICE_KEY_COMPRESSION_MAP = {
  // Root level properties
  language: "a",
  dateFormat: "b",
  currency: "c",
  template: "d",
  logo: "e",
  invoiceNumberObject: "f",
  dateOfIssue: "g",
  dateOfService: "h",
  invoiceType: "i",
  invoiceTypeFieldIsVisible: "j",
  seller: "k",
  buyer: "l",
  items: "m",
  total: "n",
  vatTableSummaryIsVisible: "o",
  paymentMethod: "p",
  paymentMethodFieldIsVisible: "q",
  paymentDue: "r",
  stripePayOnlineUrl: "s",
  notes: "t",
  notesFieldIsVisible: "u",
  personAuthorizedToReceiveFieldIsVisible: "v",
  personAuthorizedToIssueFieldIsVisible: "w",

  // Invoice number object properties
  label: "x",
  value: "y",

  // Seller/Buyer properties
  id: "z",
  name: "A",
  address: "B",
  vatNo: "C",
  vatNoFieldIsVisible: "D",
  email: "E",
  accountNumber: "F",
  accountNumberFieldIsVisible: "G",
  swiftBic: "H",
  swiftBicFieldIsVisible: "I",

  // Invoice item properties
  invoiceItemNumberIsVisible: "J",
  nameFieldIsVisible: "K",
  typeOfGTU: "L",
  typeOfGTUFieldIsVisible: "M",
  amount: "N",
  amountFieldIsVisible: "O",
  unit: "P",
  unitFieldIsVisible: "Q",
  netPrice: "R",
  netPriceFieldIsVisible: "S",
  vat: "T",
  vatFieldIsVisible: "U",
  netAmount: "V",
  netAmountFieldIsVisible: "W",
  vatAmount: "X",
  vatAmountFieldIsVisible: "Y",
  preTaxAmount: "Z",
  preTaxAmountFieldIsVisible: "0",
  taxLabelText: "1",
} as const satisfies Record<AllInvoiceKeys, string>;

/**
 * Reverse mapping for decompression
 */
const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(INVOICE_KEY_COMPRESSION_MAP).map(([key, value]) => [
    value,
    key,
  ]),
) as Record<string, keyof typeof INVOICE_KEY_COMPRESSION_MAP>;

/**
 * Recursively remaps object keys using the INVOICE_KEY_COMPRESSION_MAP
 *
 * @example
 * ```typescript
 * const data = { invoiceNumber: "123", dueDate: "2024-01-01" };
 * const compressed = remapKeys(data);
 * // Returns: { "a": "123", "b": "2024-01-01" }
 * ```
 */
function remapKeys<T>(
  obj: T,
): T extends Record<string, unknown>
  ? Record<string, unknown>
  : T extends unknown[]
    ? unknown[]
    : T {
  if (obj === null || typeof obj !== "object") {
    return obj as T extends Record<string, unknown>
      ? Record<string, unknown>
      : T extends unknown[]
        ? unknown[]
        : T;
  }

  if (Array.isArray(obj)) {
    return obj.map(remapKeys) as T extends Record<string, unknown>
      ? Record<string, unknown>
      : T extends unknown[]
        ? unknown[]
        : T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const mappedKey =
      INVOICE_KEY_COMPRESSION_MAP[
        key as keyof typeof INVOICE_KEY_COMPRESSION_MAP
      ] || key;
    result[mappedKey] = remapKeys(value);
  }

  return result as T extends Record<string, unknown>
    ? Record<string, unknown>
    : T extends unknown[]
      ? unknown[]
      : T;
}

/**
 * Recursively restores original keys using the REVERSE_KEY_MAP
 *
 * @example
 * ```typescript
 * const data = { "a": "123", "b": "2024-01-01" };
 * const decompressed = restoreKeys(data);
 * // Returns: { "invoiceNumber": "123", "dueDate": "2024-01-01" }
 * ```
 */
function restoreKeys<T>(
  obj: T,
): T extends Record<string, unknown>
  ? Record<string, unknown>
  : T extends unknown[]
    ? unknown[]
    : T {
  if (obj === null || typeof obj !== "object") {
    return obj as T extends Record<string, unknown>
      ? Record<string, unknown>
      : T extends unknown[]
        ? unknown[]
        : T;
  }

  if (Array.isArray(obj)) {
    return obj.map(restoreKeys) as T extends Record<string, unknown>
      ? Record<string, unknown>
      : T extends unknown[]
        ? unknown[]
        : T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const originalKey = REVERSE_KEY_MAP[key] || key;
    result[originalKey] = restoreKeys(value);
  }

  return result as T extends Record<string, unknown>
    ? Record<string, unknown>
    : T extends unknown[]
      ? unknown[]
      : T;
}

/**
 * Compresses invoice data by remapping keys to shorter identifiers
 *
 * @example
 * ```ts
 * const invoiceData = { invoiceId: "INV-001", amount: 100.50, items: [{ name: "Item 1", quantity: 2 }] };
 * const compressedData = compressInvoiceData(invoiceData);
 * // Result: { i: "INV-001", a: 100.50, it: [{ n: "Item 1", q: 2 }] }
 * ```
 */
export function compressInvoiceData(invoiceData: InvoiceData) {
  const res = remapKeys(invoiceData);

  return res;
}

/**
 * Decompresses invoice data by restoring original keys
 *
 * @example
 * ```ts
 * const compressedData = { i: "INV-001", a: 100.50, it: [{ n: "Item 1", q: 2 }] };
 * const originalData = decompressInvoiceData(compressedData);
 * // Result: { invoiceId: "INV-001", amount: 100.50, items: [{ name: "Item 1", quantity: 2 }] }
 * ```
 */
export function decompressInvoiceData(compressedData: Record<string, unknown>) {
  const res = restoreKeys(compressedData);

  return res;
}
