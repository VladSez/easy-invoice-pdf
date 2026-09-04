import { z } from "zod";

import { SUPPORTED_LANGUAGES } from "../../schema/index";

const customTaxLabelInputSchema = z
  .object({
    customTaxLabel: z.string(),
  })
  .strict();

/**
 * Zod schema for a function that takes an object with a customTaxLabel string property
 * and returns a string. Used to validate custom i18n label functions.
 */
const functionCustomTaxLabelInputSchema = z.function({
  input: [customTaxLabelInputSchema],
  output: z.string(),
});

// Schema for seller translations
const sellerTranslationSchema = z
  .object({
    name: z.string(),
    vatNo: z.string(),
    email: z.string(),
    accountNumber: z.string(),
    swiftBic: z.string(),
  })
  .strict();

// Schema for buyer translations
const buyerTranslationSchema = z
  .object({
    name: z.string(),
    vatNo: z.string(),
    email: z.string(),
  })
  .strict();

// Schema for invoice items table translations
const invoiceItemsTableTranslationSchema = z
  .object({
    no: z.string(),
    nameOfGoodsService: z.string(),
    typeOfGTU: z.string(),
    amount: z.string(),
    unit: z.string(),
    /**
     * You can pass a custom text for the net price label. i.e. for i18n
     * @example
     * netPrice: ({ customTaxLabel: string }) => {
     *   return `Цена без ${customTaxLabel || "НДС"}`;
     * }
     */
    netPrice: functionCustomTaxLabelInputSchema,
    vat: z.string(),
    /**
     * You can pass a custom text for the net amount label. i.e. for i18n
     * @example
     * netAmount: ({ customTaxLabel: string }) => {
     *   return `Сумма без ${customTaxLabel || "НДС"}`;
     * }
     */
    netAmount: functionCustomTaxLabelInputSchema,
    /**
     * You can pass a custom text for the VAT amount label. i.e. for i18n
     * @example
     * vatAmount: ({ customTaxLabel: string }) => {
     *   return `${customTaxLabel || "VAT"} Amount`;
     * }
     */
    vatAmount: functionCustomTaxLabelInputSchema,
    /**
     * You can pass a custom text for the pre-tax amount label. i.e. for i18n
     * @example
     * preTaxAmount: ({ customTaxLabel: string }) => {
     *   return `Сумма с ${customTaxLabel || "НДС"}`;
     * }
     */
    preTaxAmount: functionCustomTaxLabelInputSchema,
    sum: z.string(),
  })
  .strict();

// Schema for payment info translations
const paymentInfoTranslationSchema = z
  .object({
    paymentMethod: z.string(),
    paymentDate: z.string(),
  })
  .strict();

// Schema for VAT summary table translations
const vatSummaryTableTranslationSchema = z
  .object({
    /**
     * You can pass a custom text for the VAT rate label. i.e. for i18n
     * @example
     * vatRate: ({ customTaxLabel: string }) => {
     *   return `Ставка ${customTaxLabel || "НДС"}`;
     * }
     */
    vatRate: functionCustomTaxLabelInputSchema,
    /**
     * You can pass a custom text for the net label. i.e. for i18n
     * @example
     * net: ({ customTaxLabel: string }) => {
     *   return `Без ${customTaxLabel || "НДС"}`;
     * }
     */
    net: functionCustomTaxLabelInputSchema,
    vat: z.string(),
    /**
     * You can pass a custom text for the pre-tax label. i.e. for i18n
     * @example
     * preTax: ({ customTaxLabel: string }) => {
     *   return `С ${customTaxLabel || "НДС"}`;
     * }
     */
    preTax: functionCustomTaxLabelInputSchema,
    total: z.string(),
  })
  .strict();

// Schema for payment totals translations
const paymentTotalsTranslationSchema = z
  .object({
    toPay: z.string(),
    paid: z.string(),
    leftToPay: z.string(),
    amountInWords: z.string(),
  })
  .strict();

// Schema for Stripe-specific translations
const stripeTranslationSchema = z
  .object({
    invoice: z.string(),
    invoiceNumber: z.string(),
    dateOfIssue: z.string(),
    dateDue: z.string(),
    servicePeriod: z.string(),
    billTo: z.string(),
    due: z.string(),
    payOnline: z.string(),
    description: z.string(),
    qty: z.string(),
    unit: z.string(),
    unitPrice: z.string(),
    amount: z.string(),
    tax: z.string(),
    subtotal: z.string(),
    totalExcludingTax: z.string(),
    total: z.string(),
    amountDue: z.string(),
    page: z.string(),
    of: z.string(),
  })
  .strict();

export const translationSchema = z
  .object({
    invoiceNumber: z.string(),
    dateOfIssue: z.string(),
    dateOfService: z.string(),
    servicePeriod: z.string(),
    invoiceType: z.string(),
    seller: sellerTranslationSchema,
    buyer: buyerTranslationSchema,
    invoiceItemsTable: invoiceItemsTableTranslationSchema,
    paymentInfo: paymentInfoTranslationSchema,
    vatSummaryTable: vatSummaryTableTranslationSchema,
    paymentTotals: paymentTotalsTranslationSchema,
    personAuthorizedToReceive: z.string(),
    personAuthorizedToIssue: z.string(),
    createdWith: z.string(),
    stripe: stripeTranslationSchema,
  })
  .strict();

/** Schema for the complete PDF translation catalog. */
export const invoicePDFTranslationsSchema = z.record(
  z.enum(SUPPORTED_LANGUAGES),
  translationSchema,
);

export type TranslationSchema = z.infer<typeof translationSchema>;
