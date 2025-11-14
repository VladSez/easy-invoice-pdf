import { z } from "zod";
import dayjs from "dayjs";

export const SUPPORTED_CURRENCIES = [
  // Top currencies (pinned)
  "EUR", // Euro
  "USD", // US Dollar
  "PLN", // Polish Złoty
  "GBP", // British Pound

  // Major global currencies
  "JPY", // Japanese Yen
  "AUD", // Australian Dollar
  "CAD", // Canadian Dollar
  "CHF", // Swiss Franc
  "CNY", // Chinese Yuan (RMB)
  "HKD", // Hong Kong Dollar
  "SGD", // Singapore Dollar
  "SEK", // Swedish Krona
  "NOK", // Norwegian Krone
  "DKK", // Danish Krone
  "NZD", // New Zealand Dollar

  // Large emerging markets
  "INR", // Indian Rupee
  "KRW", // South Korean Won
  "MXN", // Mexican Peso
  "BRL", // Brazilian Real
  "ZAR", // South African Rand
  "TRY", // Turkish Lira
  "RUB", // Russian Ruble

  // Southeast Asia
  "THB", // Thai Baht
  "MYR", // Malaysian Ringgit
  "IDR", // Indonesian Rupiah
  "PHP", // Philippine Peso
  "VND", // Vietnamese Dong

  // Middle East & Gulf
  "AED", // UAE Dirham
  "SAR", // Saudi Riyal
  "ILS", // Israeli New Shekel
  "QAR", // Qatari Riyal
  "KWD", // Kuwaiti Dinar
  "BHD", // Bahraini Dinar
  "OMR", // Omani Rial
  "JOD", // Jordanian Dinar
  "EGP", // Egyptian Pound
  "LBP", // Lebanese Pound
  "IQD", // Iraqi Dinar

  // Eastern Europe
  "CZK", // Czech Koruna
  "HUF", // Hungarian Forint
  "RON", // Romanian Leu
  "BGN", // Bulgarian Lev
  "HRK", // Croatian Kuna (obsolete since 2023 - retained for historical invoices)
  "RSD", // Serbian Dinar
  "UAH", // Ukrainian Hryvnia
  "BYN", // Belarusian Ruble
  "MDL", // Moldovan Leu
  "GEL", // Georgian Lari
  "KZT", // Kazakhstani Tenge

  // Latin America
  "ARS", // Argentine Peso
  "CLP", // Chilean Peso
  "COP", // Colombian Peso
  "PEN", // Peruvian Sol
  "UYU", // Uruguayan Peso
  "BOB", // Bolivian Boliviano

  // South Asia
  "PKR", // Pakistani Rupee
  "BDT", // Bangladeshi Taka
  "LKR", // Sri Lankan Rupee
  "NPR", // Nepalese Rupee

  // Africa
  "NGN", // Nigerian Naira
  "KES", // Kenyan Shilling
  "GHS", // Ghanaian Cedi
  "ETB", // Ethiopian Birr
  "MAD", // Moroccan Dirham
  "TND", // Tunisian Dinar

  // Other
  "ISK", // Icelandic Króna
  "TWD", // Taiwan Dollar
] as const satisfies string[];

export type SupportedCurrencies = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS = {
  // Top currencies (pinned)
  EUR: "€", // Euro
  USD: "$", // US Dollar
  GBP: "£", // British Pound
  PLN: "zł", // Polish Złoty

  // Major global currencies
  JPY: "¥", // Japanese Yen
  AUD: "$", // Australian Dollar
  CAD: "$", // Canadian Dollar
  CHF: "Fr", // Swiss Franc
  CNY: "¥", // Chinese Yuan (RMB)
  HKD: "HK$", // Hong Kong Dollar
  SGD: "S$", // Singapore Dollar
  SEK: "kr", // Swedish Krona
  NOK: "kr", // Norwegian Krone
  DKK: "kr", // Danish Krone
  NZD: "NZ$", // New Zealand Dollar

  // Large emerging markets
  INR: "₹", // Indian Rupee
  KRW: "₩", // South Korean Won
  MXN: "$", // Mexican Peso
  BRL: "R$", // Brazilian Real
  ZAR: "R", // South African Rand
  TRY: "₺", // Turkish Lira
  RUB: "₽", // Russian Ruble

  // Southeast Asia
  THB: "฿", // Thai Baht
  MYR: "RM", // Malaysian Ringgit
  IDR: "Rp", // Indonesian Rupiah
  PHP: "₱", // Philippine Peso
  VND: "₫", // Vietnamese Dong

  // Middle East & Gulf
  AED: "AED", // UAE Dirham
  SAR: "SAR", // Saudi Riyal
  ILS: "₪", // Israeli New Shekel
  QAR: "QR", // Qatari Riyal
  KWD: "KWD", // Kuwaiti Dinar
  BHD: "BHD", // Bahraini Dinar
  OMR: "OMR", // Omani Rial
  JOD: "JOD", // Jordanian Dinar
  EGP: "EGP", // Egyptian Pound
  LBP: "LBP", // Lebanese Pound
  IQD: "IQD", // Iraqi Dinar

  // Eastern Europe
  CZK: "Kč", // Czech Koruna
  HUF: "Ft", // Hungarian Forint
  RON: "lei", // Romanian Leu
  BGN: "лв", // Bulgarian Lev
  HRK: "kn", // Croatian Kuna
  RSD: "дин", // Serbian Dinar
  UAH: "₴", // Ukrainian Hryvnia
  BYN: "Br", // Belarusian Ruble
  MDL: "L", // Moldovan Leu
  GEL: "₾", // Georgian Lari
  KZT: "₸", // Kazakhstani Tenge

  // Latin America
  ARS: "$", // Argentine Peso
  CLP: "$", // Chilean Peso
  COP: "$", // Colombian Peso
  PEN: "S/", // Peruvian Sol
  UYU: "$", // Uruguayan Peso
  BOB: "Bs", // Bolivian Boliviano

  // South Asia
  PKR: "₨", // Pakistani Rupee
  BDT: "৳", // Bangladeshi Taka
  LKR: "Rs", // Sri Lankan Rupee
  NPR: "Rs", // Nepalese Rupee

  // Africa
  NGN: "₦", // Nigerian Naira
  KES: "KSh", // Kenyan Shilling
  GHS: "₵", // Ghanaian Cedi
  ETB: "Br", // Ethiopian Birr
  MAD: "MAD", // Moroccan Dirham
  TND: "TND", // Tunisian Dinar

  // Other
  ISK: "kr", // Icelandic Króna
  TWD: "NT$", // Taiwan Dollar
} as const satisfies Record<SupportedCurrencies, string>;

export type CurrencySymbols =
  (typeof CURRENCY_SYMBOLS)[keyof typeof CURRENCY_SYMBOLS];

export const CURRENCY_TO_LABEL = {
  // Top currencies (pinned)
  EUR: "Euro",
  USD: "United States Dollar",
  GBP: "British Pound Sterling",
  PLN: "Polish Złoty",

  // Major global currencies
  JPY: "Japanese Yen",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan Renminbi",
  HKD: "Hong Kong Dollar",
  SGD: "Singapore Dollar",
  SEK: "Swedish Krona",
  NOK: "Norwegian Krone",
  DKK: "Danish Krone",
  NZD: "New Zealand Dollar",

  // Large emerging markets
  INR: "Indian Rupee",
  KRW: "South Korean Won",
  MXN: "Mexican Peso",
  BRL: "Brazilian Real",
  ZAR: "South African Rand",
  TRY: "Turkish Lira",
  RUB: "Russian Ruble",

  // Southeast Asia
  THB: "Thai Baht",
  MYR: "Malaysian Ringgit",
  IDR: "Indonesian Rupiah",
  PHP: "Philippine Peso",
  VND: "Vietnamese Dong",

  // Middle East & Gulf
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  ILS: "Israeli New Shekel",
  QAR: "Qatari Riyal",
  KWD: "Kuwaiti Dinar",
  BHD: "Bahraini Dinar",
  OMR: "Omani Rial",
  JOD: "Jordanian Dinar",
  EGP: "Egyptian Pound",
  LBP: "Lebanese Pound",
  IQD: "Iraqi Dinar",

  // Eastern Europe
  CZK: "Czech Koruna",
  HUF: "Hungarian Forint",
  RON: "Romanian Leu",
  BGN: "Bulgarian Lev",
  HRK: "Croatian Kuna",
  RSD: "Serbian Dinar",
  UAH: "Ukrainian Hryvnia",
  BYN: "Belarusian Ruble",
  MDL: "Moldovan Leu",
  GEL: "Georgian Lari",
  KZT: "Kazakhstani Tenge",

  // Latin America
  ARS: "Argentine Peso",
  CLP: "Chilean Peso",
  COP: "Colombian Peso",
  PEN: "Peruvian Sol",
  UYU: "Uruguayan Peso",
  BOB: "Bolivian Boliviano",

  // South Asia
  PKR: "Pakistani Rupee",
  BDT: "Bangladeshi Taka",
  LKR: "Sri Lankan Rupee",
  NPR: "Nepalese Rupee",

  // Africa
  NGN: "Nigerian Naira",
  KES: "Kenyan Shilling",
  GHS: "Ghanaian Cedi",
  ETB: "Ethiopian Birr",
  MAD: "Moroccan Dirham",
  TND: "Tunisian Dinar",

  // Other
  ISK: "Icelandic Króna",
  TWD: "New Taiwan Dollar",
} as const satisfies Record<SupportedCurrencies, string>;

export type CurrencyLabels =
  (typeof CURRENCY_TO_LABEL)[keyof typeof CURRENCY_TO_LABEL];

export const SUPPORTED_TEMPLATES = ["default", "stripe"] as const;

export type SupportedTemplates = (typeof SUPPORTED_TEMPLATES)[number];

export const TEMPLATE_TO_LABEL = {
  default: "Default Template",
  stripe: "Stripe Template",
} as const satisfies Record<SupportedTemplates, string>;

export type TemplateLabels =
  (typeof TEMPLATE_TO_LABEL)[keyof typeof TEMPLATE_TO_LABEL];

export const SUPPORTED_LANGUAGES = [
  "en",
  "pl",
  "de",
  "es",
  "pt",
  "ru",
  "uk",
  "fr",
  "it",
  "nl",
] as const;
export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_TO_LABEL = {
  en: "English",
  pl: "Polish",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  ru: "Russian",
  uk: "Ukrainian",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
} as const satisfies Record<SupportedLanguages, string>;

export const SUPPORTED_DATE_FORMATS = [
  "YYYY-MM-DD", // 2024-03-20
  "DD/MM/YYYY", // 20/03/2024
  "MM/DD/YYYY", // 03/20/2024
  "D MMMM YYYY", // 20 March 2024
  "MMMM D, YYYY", // March 20, 2024
  "DD.MM.YYYY", // 20.03.2024
  "DD-MM-YYYY", // 20-03-2024
  "YYYY.MM.DD", // 2024.03.20
] as const;

export const STRIPE_DEFAULT_DATE_FORMAT = "MMMM D, YYYY";

/**
 * Supported date formats
 *
 * This is the list of date formats that are supported by the invoice form
 *
 *
 *  @lintignore ignore for now in knip
 */
export type SupportedDateFormat = (typeof SUPPORTED_DATE_FORMATS)[number];

export const invoiceItemSchema = z
  .object({
    // Show/hide Number column on PDF
    invoiceItemNumberIsVisible: z.boolean().default(true),

    name: z
      .string()
      .min(1, "Item name is required")
      .max(500, "Item name must not exceed 500 characters")
      .trim(),
    nameFieldIsVisible: z.boolean().default(true),

    typeOfGTU: z
      .string()
      .max(50, "Type of GTU must not exceed 50 characters")
      .trim()
      .optional()
      .default(""),
    typeOfGTUFieldIsVisible: z.boolean().default(true),

    amount: z
      .any()
      .refine((val) => val !== "", {
        message: "Amount is required",
      })
      .transform(Number)
      .refine((val) => val > 0, {
        message: "Amount must be positive",
      })
      .refine((val) => val <= 9_999_999_999.99, {
        message: "Amount must not exceed 9 999 999 999.99",
      }),
    amountFieldIsVisible: z.boolean().default(true),

    unit: z.string().trim().optional(),
    unitFieldIsVisible: z.boolean().default(true),

    netPrice: z
      .any()
      .refine((val) => val !== "", {
        message: "Net price is required",
      })
      .transform(Number)
      .refine((val) => val >= 0, {
        message: "Net price must be >= 0",
      })
      .refine((val) => val <= 100_000_000_000, {
        message: "Net price must not exceed 100 billion",
      }),
    netPriceFieldIsVisible: z.boolean().default(true),

    vat: z.union([
      z.enum(["NP", "OO"]),
      z
        .any()
        .refine((val) => val !== "", {
          message: `VAT is required. Enter a percentage (0-100), "NP" (not applicable), or "OO" (out of scope)`,
        })
        .refine((val) => !isNaN(Number(val)), {
          message: `Must be a valid number (0-100), "NP" (not applicable), or "OO" (out of scope)`,
        })
        .transform(Number)
        .refine((val) => val >= 0 && val <= 100, {
          message: "VAT must be between 0 and 100",
        }),
    ]),
    vatFieldIsVisible: z.boolean().default(true),

    netAmount: z.coerce.number().nonnegative("Net amount must be non-negative"),
    netAmountFieldIsVisible: z.boolean().default(true),

    vatAmount: z.coerce.number().nonnegative("VAT amount must be non-negative"),
    vatAmountFieldIsVisible: z.boolean().default(true),

    preTaxAmount: z.coerce
      .number()
      .nonnegative("Pre-tax amount must be non-negative"),
    preTaxAmountFieldIsVisible: z.boolean().default(true),
  })
  .strict();

export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;

export const sellerSchema = z
  .object({
    id: z.string().optional(),

    name: z
      .string()
      .min(1, "Seller name is required")
      .max(500, "Seller name must not exceed 500 characters")
      .trim(),
    address: z
      .string()
      .min(1, "Seller address is required")
      .max(500, "Seller address must not exceed 500 characters")
      .trim(),

    vatNo: z
      .string()
      .max(200, "VAT number must not exceed 200 characters")
      .trim()
      .optional(),
    vatNoFieldIsVisible: z.boolean().default(true),

    email: z.string().email("Invalid email address").trim(),

    accountNumber: z
      .string()
      .max(200, "Account number must not exceed 200 characters")
      .trim()
      .optional(),
    accountNumberFieldIsVisible: z.boolean().default(true),

    swiftBic: z
      .string()
      .max(200, "SWIFT/BIC must not exceed 200 characters")
      .trim()
      .optional(),
    swiftBicFieldIsVisible: z.boolean().default(true),

    notes: z
      .string()
      .max(750, "Notes must not exceed 750 characters")
      .trim()
      .optional(),
    notesFieldIsVisible: z.boolean().default(true),
  })
  .strict();

export type SellerData = z.infer<typeof sellerSchema>;

export const buyerSchema = z
  .object({
    id: z.string().optional(),

    name: z
      .string()
      .min(1, "Buyer name is required")
      .max(500, "Buyer name must not exceed 500 characters")
      .trim(),
    address: z
      .string()
      .min(1, "Buyer address is required")
      .max(500, "Buyer address must not exceed 500 characters")
      .trim(),
    vatNo: z
      .string()
      .max(200, "VAT number must not exceed 200 characters")
      .trim()
      .optional(),
    vatNoFieldIsVisible: z.boolean().default(true),

    email: z.string().email("Invalid email address").trim(),

    notes: z
      .string()
      .max(750, "Notes must not exceed 750 characters")
      .trim()
      .optional(),
    notesFieldIsVisible: z.boolean().default(true),
  })
  .strict();

export type BuyerData = z.infer<typeof buyerSchema>;

/**
 * Invoice schema
 *
 * This schema is used to validate the invoice data
 */
export const invoiceSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  dateFormat: z.enum(SUPPORTED_DATE_FORMATS).default("YYYY-MM-DD"),
  currency: z.enum(SUPPORTED_CURRENCIES).default("EUR"),
  template: z.enum(SUPPORTED_TEMPLATES).default("default"),

  /**
   * Logo field for Stripe template
   *
   * Stores base64 image data
   *
   * Max 3MB limit enforced on the client side during upload
   */
  logo: z
    .string()
    .trim()
    .default("")
    .refine((val) => {
      if (!val) return true; // Allow empty string
      // Check if it's a valid base64 data URL
      const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
      return base64Pattern.test(val);
    }, "Logo must be a valid image (JPEG, PNG or WebP) in base64 format")
    .optional()
    .describe(
      "Stripe template specific field. Logo must be a valid image (JPEG, PNG or WebP) in base64 format",
    ),

  /**
   * Invoice number object
   *
   * Contains label and value for invoice number
   *
   * {
   *   label: "Invoice Number",
   *   value: "1234",
   * }
   *
   * Optional field
   */
  invoiceNumberObject: z
    .object({
      label: z
        .string()
        .max(250, "Invoice number label must not exceed 250 characters")
        .trim(),
      value: z
        .string()
        .max(100, "Invoice number must not exceed 100 characters")
        .trim(),
    })
    .optional(),

  dateOfIssue: z
    .string()
    .trim()
    .transform((val) => {
      if (!val) {
        // If no value is provided, set the date of issue to today's date
        return dayjs().format("YYYY-MM-DD");
      }

      return val;
    })
    .describe("Invoice date of issue. Default is today's date"),

  dateOfService: z
    .string()
    .trim()
    .transform((val) => {
      if (!val) {
        // If no value is provided, set the date of service to the last day of the current month
        return dayjs().endOf("month").format("YYYY-MM-DD");
      }
      return val;
    })
    .describe(
      "Invoice date of service. Default is the last day of the current month",
    ),

  invoiceType: z
    .string()
    .max(500, "Invoice type must not exceed 500 characters")
    .trim()
    .optional(),
  invoiceTypeFieldIsVisible: z.boolean().default(true),

  seller: sellerSchema,
  buyer: buyerSchema,

  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  total: z.coerce.number().nonnegative("Total must be non-negative"),

  // Show/hide VAT Table Summary on PDF
  vatTableSummaryIsVisible: z.boolean().default(true),

  paymentMethod: z
    .string()
    .max(500, "Payment method must not exceed 500 characters")
    .trim()
    .optional(),
  paymentMethodFieldIsVisible: z.boolean().default(true),

  paymentDue: z
    .string()
    .trim()
    .transform((val) => {
      if (!val) {
        // If no value is provided, set the payment due date to 14 days from the date of issue
        return dayjs().add(14, "days").format("YYYY-MM-DD");
      }
      return val;
    })
    .describe("Payment due date. Default is 14 days from the date of issue"),

  /**
   * Pay Online URL field for Stripe template only
   *
   * URL field for Stripe payment link that:
   * - Accepts empty string or valid URL
   * - Trims whitespace
   * - Optional field
   * - Validates URL format if non-empty value provided
   */
  stripePayOnlineUrl: z
    .string()
    .trim() // Remove whitespace
    .transform((val) => val) // Pass through value
    .pipe(
      z.union([
        z.literal(""), // Allow empty string
        z
          .string()
          .url("Please enter a valid URL or leave empty")
          .refine(
            (url) => url.startsWith("https://"),
            "URL must start with https://",
          ), // Validate HTTPS URL format
      ]),
    )
    .optional()
    .describe("Stripe template specific field. URL field for payment link"),

  notes: z
    .string()
    .max(3500, "Notes must not exceed 3500 characters")
    .trim()
    .optional(),
  notesFieldIsVisible: z.boolean().default(true),

  personAuthorizedToReceiveFieldIsVisible: z.boolean().default(true),
  personAuthorizedToIssueFieldIsVisible: z.boolean().default(true),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;

export const PDF_DATA_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_DATA";

/**
 * Accordion state schema
 *
 * This schema is used to store the state of the accordion in the local storage
 *
 * The accordion is used to collapse/expand the sections of the invoice form
 *
 *
 */
export const accordionSchema = z
  .object({
    general: z.boolean(),
    seller: z.boolean(),
    buyer: z.boolean(),
    invoiceItems: z.boolean(),
  })
  .strict();

export type AccordionState = z.infer<typeof accordionSchema>;

export const ACCORDION_STATE_LOCAL_STORAGE_KEY = "EASY_INVOICE_ACCORDION_STATE";

// __________________________________________________________
// Validate that currencies are unique
// __________________________________________________________
const uniqueCurrencies = new Set(SUPPORTED_CURRENCIES);

if (uniqueCurrencies.size !== SUPPORTED_CURRENCIES.length) {
  const duplicates = SUPPORTED_CURRENCIES.filter(
    (currency, index) => SUPPORTED_CURRENCIES.indexOf(currency) !== index,
  );

  const currencyFullNames = duplicates.map((currency) => {
    const currencyFullName = CURRENCY_TO_LABEL[currency];

    return `${currency} - ${currencyFullName}`;
  });

  throw new Error(
    `SUPPORTED_CURRENCIES contains duplicate entries: ${currencyFullNames.join(", ")}`,
  );
}
