import dayjs from "dayjs";
import { z } from "zod";

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
  "MMK", // Myanmar Kyat
  "KHR", // Cambodian Riel
  "LAK", // Lao Kip

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

  // Eastern Europe & Balkans
  "CZK", // Czech Koruna
  "HUF", // Hungarian Forint
  "RON", // Romanian Leu
  "BGN", // Bulgarian Lev
  "HRK", // Croatian Kuna (obsolete since 2023 - retained for historical invoices)
  "RSD", // Serbian Dinar
  "UAH", // Ukrainian Hryvnia
  "BYN", // Belarusian Ruble
  "MDL", // Moldovan Leu
  "ALL", // Albanian Lek
  "MKD", // Macedonian Denar
  "BAM", // Bosnia-Herzegovina Convertible Mark

  // Central Asia & Caucasus
  "GEL", // Georgian Lari
  "KZT", // Kazakhstani Tenge
  "UZS", // Uzbekistani Som
  "TJS", // Tajikistani Somoni
  "TMT", // Turkmenistani Manat

  // East Asia
  "MNT", // Mongolian Tugrik

  // Latin America - South America
  "ARS", // Argentine Peso
  "CLP", // Chilean Peso
  "COP", // Colombian Peso
  "PEN", // Peruvian Sol
  "UYU", // Uruguayan Peso
  "BOB", // Bolivian Boliviano
  "PYG", // Paraguayan Guaraní
  "SRD", // Surinamese Dollar
  "GYD", // Guyanese Dollar

  // Latin America - Central America
  "GTQ", // Guatemalan Quetzal
  "CRC", // Costa Rican Colón
  "PAB", // Panamanian Balboa
  "HNL", // Honduran Lempira
  "NIO", // Nicaraguan Córdoba
  "BZD", // Belize Dollar
  "SVC", // Salvadoran Colón

  // Caribbean
  "DOP", // Dominican Peso
  "JMD", // Jamaican Dollar
  "TTD", // Trinidad and Tobago Dollar
  "BBD", // Barbadian Dollar
  "BSD", // Bahamian Dollar
  "XCD", // East Caribbean Dollar
  "HTG", // Haitian Gourde
  "AWG", // Aruban Florin
  "ANG", // Netherlands Antillean Guilder
  "KYD", // Cayman Islands Dollar

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
  "DZD", // Algerian Dinar
  "LYD", // Libyan Dinar
  "SDG", // Sudanese Pound
  "SSP", // South Sudanese Pound
  "AOA", // Angolan Kwanza
  "XOF", // West African CFA Franc
  "XAF", // Central African CFA Franc
  "CDF", // Congolese Franc
  "UGX", // Ugandan Shilling
  "TZS", // Tanzanian Shilling
  "RWF", // Rwandan Franc
  "ZMW", // Zambian Kwacha
  "MWK", // Malawian Kwacha
  "BWP", // Botswana Pula
  "NAD", // Namibian Dollar
  "SZL", // Swazi Lilangeni
  "LSL", // Lesotho Loti
  "MUR", // Mauritian Rupee
  "MZN", // Mozambican Metical
  "GMD", // Gambian Dalasi
  "MRU", // Mauritanian Ouguiya

  // Pacific
  "FJD", // Fijian Dollar
  "PGK", // Papua New Guinea Kina
  "WST", // Samoan Tala
  "TOP", // Tongan Paʻanga

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
  MMK: "K", // Myanmar Kyat
  KHR: "៛", // Cambodian Riel
  LAK: "₭", // Lao Kip

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

  // Eastern Europe & Balkans
  CZK: "Kč", // Czech Koruna
  HUF: "Ft", // Hungarian Forint
  RON: "lei", // Romanian Leu
  BGN: "лв", // Bulgarian Lev
  HRK: "kn", // Croatian Kuna
  RSD: "дин", // Serbian Dinar
  UAH: "₴", // Ukrainian Hryvnia
  BYN: "Br", // Belarusian Ruble
  MDL: "L", // Moldovan Leu
  ALL: "L", // Albanian Lek
  MKD: "ден", // Macedonian Denar
  BAM: "KM", // Bosnia-Herzegovina Convertible Mark

  // Central Asia & Caucasus
  GEL: "₾", // Georgian Lari
  KZT: "₸", // Kazakhstani Tenge
  UZS: "so'm", // Uzbekistani Som
  TJS: "ЅМ", // Tajikistani Somoni
  TMT: "m", // Turkmenistani Manat

  // East Asia
  MNT: "₮", // Mongolian Tugrik

  // Latin America - South America
  ARS: "$", // Argentine Peso
  CLP: "$", // Chilean Peso
  COP: "$", // Colombian Peso
  PEN: "S/", // Peruvian Sol
  UYU: "$", // Uruguayan Peso
  BOB: "Bs", // Bolivian Boliviano
  PYG: "₲", // Paraguayan Guaraní
  SRD: "$", // Surinamese Dollar
  GYD: "$", // Guyanese Dollar

  // Latin America - Central America
  GTQ: "Q", // Guatemalan Quetzal
  CRC: "₡", // Costa Rican Colón
  PAB: "B/.", // Panamanian Balboa
  HNL: "L", // Honduran Lempira
  NIO: "C$", // Nicaraguan Córdoba
  BZD: "BZ$", // Belize Dollar
  SVC: "₡", // Salvadoran Colón

  // Caribbean
  DOP: "RD$", // Dominican Peso
  JMD: "J$", // Jamaican Dollar
  TTD: "TT$", // Trinidad and Tobago Dollar
  BBD: "Bds$", // Barbadian Dollar
  BSD: "B$", // Bahamian Dollar
  XCD: "EC$", // East Caribbean Dollar
  HTG: "G", // Haitian Gourde
  AWG: "ƒ", // Aruban Florin
  ANG: "ƒ", // Netherlands Antillean Guilder
  KYD: "CI$", // Cayman Islands Dollar

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
  DZD: "دج", // Algerian Dinar
  LYD: "LD", // Libyan Dinar
  SDG: "SDG", // Sudanese Pound
  SSP: "SS£", // South Sudanese Pound
  AOA: "Kz", // Angolan Kwanza
  XOF: "CFA", // West African CFA Franc
  XAF: "FCFA", // Central African CFA Franc
  CDF: "FC", // Congolese Franc
  UGX: "USh", // Ugandan Shilling
  TZS: "TSh", // Tanzanian Shilling
  RWF: "FRw", // Rwandan Franc
  ZMW: "ZK", // Zambian Kwacha
  MWK: "MK", // Malawian Kwacha
  BWP: "P", // Botswana Pula
  NAD: "N$", // Namibian Dollar
  SZL: "L", // Swazi Lilangeni
  LSL: "L", // Lesotho Loti
  MUR: "₨", // Mauritian Rupee
  MZN: "MT", // Mozambican Metical
  GMD: "D", // Gambian Dalasi
  MRU: "UM", // Mauritanian Ouguiya

  // Pacific
  FJD: "FJ$", // Fijian Dollar
  PGK: "K", // Papua New Guinea Kina
  WST: "WS$", // Samoan Tala
  TOP: "T$", // Tongan Paʻanga

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
  MMK: "Myanmar Kyat",
  KHR: "Cambodian Riel",
  LAK: "Lao Kip",

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

  // Eastern Europe & Balkans
  CZK: "Czech Koruna",
  HUF: "Hungarian Forint",
  RON: "Romanian Leu",
  BGN: "Bulgarian Lev",
  HRK: "Croatian Kuna",
  RSD: "Serbian Dinar",
  UAH: "Ukrainian Hryvnia",
  BYN: "Belarusian Ruble",
  MDL: "Moldovan Leu",
  ALL: "Albanian Lek",
  MKD: "Macedonian Denar",
  BAM: "Bosnia-Herzegovina Convertible Mark",

  // Central Asia & Caucasus
  GEL: "Georgian Lari",
  KZT: "Kazakhstani Tenge",
  UZS: "Uzbekistani Som",
  TJS: "Tajikistani Somoni",
  TMT: "Turkmenistani Manat",

  // East Asia
  MNT: "Mongolian Tugrik",

  // Latin America - South America
  ARS: "Argentine Peso",
  CLP: "Chilean Peso",
  COP: "Colombian Peso",
  PEN: "Peruvian Sol",
  UYU: "Uruguayan Peso",
  BOB: "Bolivian Boliviano",
  PYG: "Paraguayan Guaraní",
  SRD: "Surinamese Dollar",
  GYD: "Guyanese Dollar",

  // Latin America - Central America
  GTQ: "Guatemalan Quetzal",
  CRC: "Costa Rican Colón",
  PAB: "Panamanian Balboa",
  HNL: "Honduran Lempira",
  NIO: "Nicaraguan Córdoba",
  BZD: "Belize Dollar",
  SVC: "Salvadoran Colón",

  // Caribbean
  DOP: "Dominican Peso",
  JMD: "Jamaican Dollar",
  TTD: "Trinidad and Tobago Dollar",
  BBD: "Barbadian Dollar",
  BSD: "Bahamian Dollar",
  XCD: "East Caribbean Dollar",
  HTG: "Haitian Gourde",
  AWG: "Aruban Florin",
  ANG: "Netherlands Antillean Guilder",
  KYD: "Cayman Islands Dollar",

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
  DZD: "Algerian Dinar",
  LYD: "Libyan Dinar",
  SDG: "Sudanese Pound",
  SSP: "South Sudanese Pound",
  AOA: "Angolan Kwanza",
  XOF: "West African CFA Franc",
  XAF: "Central African CFA Franc",
  CDF: "Congolese Franc",
  UGX: "Ugandan Shilling",
  TZS: "Tanzanian Shilling",
  RWF: "Rwandan Franc",
  ZMW: "Zambian Kwacha",
  MWK: "Malawian Kwacha",
  BWP: "Botswana Pula",
  NAD: "Namibian Dollar",
  SZL: "Swazi Lilangeni",
  LSL: "Lesotho Loti",
  MUR: "Mauritian Rupee",
  MZN: "Mozambican Metical",
  GMD: "Gambian Dalasi",
  MRU: "Mauritanian Ouguiya",

  // Pacific
  FJD: "Fijian Dollar",
  PGK: "Papua New Guinea Kina",
  WST: "Samoan Tala",
  TOP: "Tongan Paʻanga",

  // Other
  ISK: "Icelandic Króna",
  TWD: "New Taiwan Dollar",
} as const satisfies Record<SupportedCurrencies, string>;

export type CurrencyLabels =
  (typeof CURRENCY_TO_LABEL)[keyof typeof CURRENCY_TO_LABEL];

interface CurrencyGroup {
  label: string;
  currencies: SupportedCurrencies[];
}

export const CURRENCY_GROUPS = [
  { label: "Most Popular", currencies: ["EUR", "USD", "PLN", "GBP"] },
  {
    label: "Major Global",
    currencies: [
      "JPY",
      "AUD",
      "CAD",
      "CHF",
      "CNY",
      "HKD",
      "SGD",
      "SEK",
      "NOK",
      "DKK",
      "NZD",
    ],
  },
  {
    label: "Europe",
    currencies: [
      "CZK",
      "HUF",
      "RON",
      "BGN",
      "HRK",
      "RSD",
      "UAH",
      "BYN",
      "MDL",
      "ALL",
      "MKD",
      "BAM",
      "ISK",
      "RUB",
      "TRY",
    ],
  },
  {
    label: "Asia & Pacific",
    currencies: [
      "INR",
      "KRW",
      "THB",
      "MYR",
      "IDR",
      "PHP",
      "VND",
      "MMK",
      "KHR",
      "LAK",
      "PKR",
      "BDT",
      "LKR",
      "NPR",
      "MNT",
      "TWD",
      "GEL",
      "KZT",
      "UZS",
      "TJS",
      "TMT",
      "FJD",
      "PGK",
      "WST",
      "TOP",
    ],
  },
  {
    label: "Middle East & Gulf",
    currencies: [
      "AED",
      "SAR",
      "ILS",
      "QAR",
      "KWD",
      "BHD",
      "OMR",
      "JOD",
      "EGP",
      "LBP",
      "IQD",
    ],
  },
  {
    label: "Latin America & Caribbean",
    currencies: [
      "MXN",
      "BRL",
      "ARS",
      "CLP",
      "COP",
      "PEN",
      "UYU",
      "BOB",
      "PYG",
      "SRD",
      "GYD",
      "GTQ",
      "CRC",
      "PAB",
      "HNL",
      "NIO",
      "BZD",
      "SVC",
      "DOP",
      "JMD",
      "TTD",
      "BBD",
      "BSD",
      "XCD",
      "HTG",
      "AWG",
      "ANG",
      "KYD",
    ],
  },
  {
    label: "Africa",
    currencies: [
      "ZAR",
      "NGN",
      "KES",
      "GHS",
      "ETB",
      "MAD",
      "TND",
      "DZD",
      "LYD",
      "SDG",
      "SSP",
      "AOA",
      "XOF",
      "XAF",
      "CDF",
      "UGX",
      "TZS",
      "RWF",
      "ZMW",
      "MWK",
      "BWP",
      "NAD",
      "SZL",
      "LSL",
      "MUR",
      "MZN",
      "GMD",
      "MRU",
    ],
  },
] as const satisfies CurrencyGroup[];

export interface CurrencyComboboxItem {
  code: SupportedCurrencies;
  searchLabel: string;
}

export interface CurrencyComboboxGroup {
  value: string;
  items: CurrencyComboboxItem[];
}

export const CURRENCY_COMBOBOX_GROUPS = CURRENCY_GROUPS.map((group) => {
  return {
    value: group.label,
    items: group.currencies.map((code) => {
      return {
        code,
        searchLabel: `${code} ${CURRENCY_SYMBOLS[code]} ${CURRENCY_TO_LABEL[code]}`,
      };
    }),
  };
}) satisfies CurrencyComboboxGroup[];

export const SUPPORTED_TEMPLATES = ["default", "stripe"] as const;

export type SupportedTemplates = (typeof SUPPORTED_TEMPLATES)[number];

export const TEMPLATE_TO_LABEL = {
  default: "Default Template",
  stripe: "Stripe Template",
} as const satisfies Record<SupportedTemplates, string>;

export type TemplateLabels =
  (typeof TEMPLATE_TO_LABEL)[keyof typeof TEMPLATE_TO_LABEL];

/**
 * Every language an invoice can be written in.
 *
 * This order is what the language pickers render, so it is sorted the way a reader scans
 * them -- by name rather than by code: English and Polish lead, then the rest alphabetically
 * by their English label ({@link LANGUAGE_TO_LABEL}). That is why the codes below look
 * unsorted; adding a language means slotting its code in where its *name* belongs, and
 * mirroring the position in the maps that follow.
 *
 * `en` has to stay first for a second reason: it is the invoice's default language.
 *
 * This is the PDF's language, not the site's -- see {@link SUPPORTED_I18N_LOCALES}.
 */
export const SUPPORTED_INVOICE_PDF_LANGUAGES = [
  "en",
  "pl",
  "nl",
  "fr",
  "de",
  "it",
  "nb",
  "pt",
  "pt-BR",
  "ru",
  "es",
  "sv",
  "uk",
] as const;
export type SupportedLanguages =
  (typeof SUPPORTED_INVOICE_PDF_LANGUAGES)[number];

/**
 * The languages the *interface* is translated into.
 *
 * Every one of these is a route (`/pt/about`), a `messages/<locale>.json`, a
 * `public/<locale>/about.md`, a sitemap entry and a footer link, so a locale costs a page
 * to write and keep up to date. An invoice language costs a column of labels, which is why
 * the two lists are allowed to differ: `pt-BR` prints a Brazilian invoice without
 * committing the site to a second Portuguese translation.
 *
 * `satisfies` keeps it a subset -- a locale has to be a language the PDF can be written in
 * too, since the about page links straight into the generator.
 *
 * `en` has to stay first: it is read as the default locale (`SUPPORTED_I18N_LOCALES[0]`) by the
 * i18n routing.
 */
export const SUPPORTED_I18N_LOCALES = [
  "en",
  "pl",
  "nl",
  "fr",
  "de",
  "it",
  "nb",
  "pt",
  "ru",
  "es",
  "sv",
  "uk",
] as const satisfies readonly SupportedLanguages[];
export type SupportedLocale = (typeof SUPPORTED_I18N_LOCALES)[number];

export const MAX_INVOICE_ITEMS = 100;

export const LANGUAGE_TO_LABEL = {
  en: "English",
  pl: "Polish",
  nl: "Dutch",
  fr: "French",
  de: "German",
  it: "Italian",
  nb: "Norwegian",
  pt: "Portuguese",
  "pt-BR": "Portuguese (BR)",
  ru: "Russian",
  es: "Spanish",
  sv: "Swedish",
  uk: "Ukrainian",
} as const satisfies Record<SupportedLanguages, string>;

/**
 * The same names as {@link LANGUAGE_TO_LABEL}, with the region spelled out for the
 * languages that are written differently in more than one country.
 *
 * Only Portuguese needs it today, and the two are separate invoices rather than separate
 * spellings: `pt` labels the tax number "NIF" and the tax "IVA", spells "dezasseis" and
 * counts in the long scale ("mil milhões"); `pt-BR` labels them "CNPJ/CPF" and "Imposto",
 * spells "dezesseis" and counts in the short one ("bilhões"). Naming the country lets a
 * reader pick the right one up front, instead of finding out after generating the PDF.
 *
 * This is for pickers only. Everywhere the language is merely stated rather than chosen --
 * the download button, where the name sits inside a fixed-width label -- keeps the short
 * {@link LANGUAGE_TO_LABEL} name.
 */
export const LANGUAGE_TO_LABEL_WITH_REGION = {
  ...LANGUAGE_TO_LABEL,
  pt: "Portuguese (Portugal)",
  "pt-BR": "Portuguese (Brazil)",
} as const satisfies Record<SupportedLanguages, string>;

/**
 * Mapping from language code to its native language label.
 * Used for language selectors, footer, and UI where displaying the language in its native form is preferred.
 * Example: { en: "English", pl: "Polski" }
 */
export const LANGUAGE_TO_NATIVE_LABEL = {
  en: "English",
  pl: "Polski",
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  nb: "Norsk bokmål",
  pt: "Português",
  "pt-BR": "Português (Brasil)",
  ru: "Русский",
  es: "Español",
  sv: "Svenska",
  uk: "Українська",
} as const satisfies Record<SupportedLanguages, string>;

export const SUPPORTED_DATE_FORMATS = [
  "YYYY-MM-DD", // 2024-03-20 (default template date format)
  "YYYY/MM/DD", // 2024/03/20
  "YYYY.MM.DD", // 2024.03.20
  "MM/DD/YYYY", // 03/20/2024
  "MM-DD-YYYY", // 03-20-2024
  "M/D/YYYY", // 3/20/2024
  "D MMMM YYYY", // 20 March 2024
  "D. MMMM YYYY", // 20. März 2024 (German long date)
  "D [de] MMMM [de] YYYY", // 20 de marzo de 2024 (Spanish and Portuguese long date)
  "D MMMM YYYY [г.]", // 20 марта 2024 г. (Russian long date)
  "D MMMM YYYY [р.]", // 20 березня 2024 р. (Ukrainian long date)
  "D MMM YYYY", // 20 Mar 2024
  "MMMM D, YYYY", // March 20, 2024 (Stripe template default date format)
  "MMM D, YYYY", // Mar 20, 2024
  "DD-MM-YYYY", // 20-03-2024
  "DD/MM/YYYY", // 20/03/2024
  "DD.MM.YYYY", // 20.03.2024
  "D/M/YYYY", // 20/3/2024
] as const;

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
export const STRIPE_DEFAULT_DATE_FORMAT = "MMMM D, YYYY";

/**
 * The long date each language writes by convention, used by the Stripe template.
 *
 * English leads with the month ("December 17, 2025"); every other language here leads with
 * the day. That is not only word order: dayjs chooses the grammatical case of the month
 * name from its position, so Polish, Russian and Ukrainian are only correct with the day in
 * front -- "17 grudnia 2025", where "grudzień 17, 2025" puts the month in the nominative
 * and reads like a column heading rather than a date.
 *
 * Five of them carry punctuation the bare day-month-year cannot express, so they get their
 * own tokens: the ordinal period in German's "17. Dezember 2025", the connectors in Spanish
 * and Portuguese's "17 de diciembre de 2025", and the year marker that a spelled-out date
 * takes in a Russian or Ukrainian document -- "17 декабря 2025 г.", "17 грудня 2025 р.",
 * where dropping the "г."/"р." leaves the date reading like a sentence fragment.
 *
 * All five read as nonsense in any other language ("17 de december de 2025"), so a picker
 * only offers a language the ones that belong to it; see {@link getDateFormatsForLanguage}.
 */
export const LANGUAGE_TO_LONG_DATE_FORMAT = {
  en: STRIPE_DEFAULT_DATE_FORMAT,
  pl: "D MMMM YYYY",
  nl: "D MMMM YYYY",
  fr: "D MMMM YYYY",
  de: "D. MMMM YYYY",
  it: "D MMMM YYYY",
  nb: "D. MMMM YYYY",
  pt: "D [de] MMMM [de] YYYY",
  "pt-BR": "D [de] MMMM [de] YYYY",
  ru: "D MMMM YYYY [г.]",
  es: "D [de] MMMM [de] YYYY",
  sv: "D MMMM YYYY",
  uk: "D MMMM YYYY [р.]",
} as const satisfies Record<
  SupportedLanguages,
  (typeof SUPPORTED_DATE_FORMATS)[number]
>;

/**
 * Long date formats that only read correctly in the languages whose convention they are.
 *
 * Everything else in {@link SUPPORTED_DATE_FORMATS} is either numeric or a plain
 * day-month-year that any language can wear, so these are the only ones a picker has to
 * keep out of the wrong hands.
 */
const LANGUAGE_SPECIFIC_DATE_FORMATS = [
  "D. MMMM YYYY",
  "D [de] MMMM [de] YYYY",
  "D MMMM YYYY [г.]",
  "D MMMM YYYY [р.]",
] as const satisfies readonly (typeof SUPPORTED_DATE_FORMATS)[number][];

/**
 * The date formats worth offering in a given language.
 *
 * The full list carries a couple of formats that spell out another language's punctuation,
 * and they do not degrade gracefully: picking Spanish's in Swedish renders "17 de december
 * de 2025". Each language sees the shared formats plus its own long one, so a picker never
 * shows a preview that is not a real date somewhere.
 */
export function getDateFormatsForLanguage(language: SupportedLanguages) {
  const ownLongFormat = LANGUAGE_TO_LONG_DATE_FORMAT[language];
  const languageSpecific: readonly string[] = LANGUAGE_SPECIFIC_DATE_FORMATS;

  return SUPPORTED_DATE_FORMATS.filter((format) => {
    return !languageSpecific.includes(format) || format === ownLongFormat;
  });
}

interface GetDefaultDateFormatArgs {
  /** The invoice PDF language. */
  language: SupportedLanguages;
  /** The template the invoice is rendered with. */
  template: SupportedTemplates;
}

/**
 * The date format an invoice starts with, for a language and template.
 *
 * The default template stays on ISO `YYYY-MM-DD` whatever the language: an invoice crosses
 * borders, and it is the one format no reader can misread by a month. (It is also exactly
 * what Swedish writes anyway.) The Stripe template spells the month out, so there it is the
 * language that decides -- see {@link LANGUAGE_TO_LONG_DATE_FORMAT}.
 */
export function getDefaultDateFormat({
  language,
  template,
}: GetDefaultDateFormatArgs) {
  return template === "stripe"
    ? LANGUAGE_TO_LONG_DATE_FORMAT[language]
    : DEFAULT_DATE_FORMAT;
}

/**
 * Supported date formats
 *
 * This is the list of date formats that are supported by the invoice form
 *
 *
 *  @lintignore ignore for now in knip
 */
export type SupportedDateFormat = (typeof SUPPORTED_DATE_FORMATS)[number];

/**
 * The locales an invoice's numbers can be written in, on top of the invoice's own language.
 *
 * `international` is what the default template printed before this setting existed:
 * thousands grouped with a no-break space, the decimal marked with a dot (`321 200.00`). It
 * belongs to no locale on purpose -- `321.200` reads as three hundred thousand in the US and
 * as a fraction of one in Germany, while a space reads the same everywhere, which is what an
 * invoice that crosses a border wants.
 *
 * Every other value is one of the languages the PDF can be written in, because the language
 * of the labels and the way the numbers are punctuated are separate concerns: a Polish
 * issuer writing an English invoice may well want `10 000,00 EUR` under English headings.
 *
 * None of it changes which currency the invoice is in. It does change how that currency is
 * written: the default template prints an ISO 4217 code next to the amount whatever the
 * locale, while the Stripe template prints the symbol where the locale puts it -- `$321,200.00`
 * formatted in English, `321.200,00 $` formatted in German.
 */
export const SUPPORTED_NUMBER_FORMAT_LOCALES = [
  "international",
  ...SUPPORTED_INVOICE_PDF_LANGUAGES,
] as const;

export type SupportedNumberFormatLocale =
  (typeof SUPPORTED_NUMBER_FORMAT_LOCALES)[number];

interface ResolveNumberFormatLocaleArgs {
  /** The invoice PDF language. */
  language: SupportedLanguages;
  /** The override, on the invoices that carry one. */
  numberFormatLocale?: SupportedNumberFormatLocale;
}

/**
 * The locale an invoice writes its numbers in.
 *
 * The form keeps the stored value in step with the invoice language -- picking a language
 * picks its number format too -- so this fallback is for an invoice that carries no value:
 * one saved before the setting existed, or a new one nobody has touched. It is written in
 * its own language, so an English invoice reads `321,200.00`.
 *
 * That is a deliberate change for the default template, which printed every amount
 * `international` (`321 200.00`) whatever the language before this setting existed: such
 * an invoice, re-downloaded, now follows its language instead. The Stripe template always
 * did, so it prints what it always printed.
 */
export function resolveNumberFormatLocale({
  language,
  numberFormatLocale,
}: ResolveNumberFormatLocaleArgs) {
  return numberFormatLocale ?? language;
}

interface GetNumberFormatLocaleAfterLanguageChangeArgs {
  /** The language the invoice is being switched away from. */
  previousLanguage: SupportedLanguages;
  /** The language the invoice is being switched to. */
  nextLanguage: SupportedLanguages;
  /** The format the invoice carries, on the invoices that carry one. */
  numberFormatLocale?: SupportedNumberFormatLocale;
  /**
   * Whether the invoice pins its number format, see
   * {@link invoiceObjectSchema.shape.preserveNumberFormatOnLanguageChange}.
   */
  preserveNumberFormatOnLanguageChange?: boolean;
}

/**
 * The number format an invoice should carry once its language changes.
 *
 * Unpinned, the format follows the language: most invoices want Polish numbers under
 * Polish headings, and the form has moved the two together since the setting shipped.
 *
 * Pinned, it returns the *resolved* previous format rather than the stored one. The
 * difference matters on an invoice that never picked a format: it carries none and
 * {@link resolveNumberFormatLocale} falls back to its language, so returning `undefined`
 * would let the format follow the new language -- the opposite of preserving it. Naming
 * the language being left behind is what actually keeps the numbers on screen unchanged.
 */
export function getNumberFormatLocaleAfterLanguageChange({
  previousLanguage,
  nextLanguage,
  numberFormatLocale,
  preserveNumberFormatOnLanguageChange,
}: GetNumberFormatLocaleAfterLanguageChangeArgs): SupportedNumberFormatLocale {
  if (!preserveNumberFormatOnLanguageChange) {
    return nextLanguage;
  }

  return resolveNumberFormatLocale({
    language: previousLanguage,
    numberFormatLocale,
  });
}

/**
 *
 * This is the version of the app and the schema of the app's data model
 */
export const APP_VERSION = "1.0.0";

/**
 * Schema version
 *
 * This is the version of the schema (zod) of the app's data model
 */
export const SCHEMA_VERSION = "1.0.0";

export const invoiceItemSchema = z.object({
  // Show/hide Number column on PDF
  invoiceItemNumberIsVisible: z.boolean().default(true),

  name: z
    .string()
    .max(500, "Item name must not exceed 500 characters")
    .trim()
    .optional(),
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
    .refine(
      (val) => {
        return val !== "";
      },
      {
        message: "Amount is required",
      },
    )
    .transform(Number)
    .refine(
      (val) => {
        return val >= 0;
      },
      {
        message: "Amount must be >= 0",
      },
    )
    .refine(
      (val) => {
        return val <= 999_999.99;
      },
      {
        message: "Amount must not exceed 999 999.99",
      },
    ),
  amountFieldIsVisible: z.boolean().default(true),

  unit: z.string().trim().optional(),
  unitFieldIsVisible: z.boolean().default(true),

  netPrice: z
    .any()
    .refine(
      (val) => {
        return val !== "";
      },
      {
        message: "Net price is required",
      },
    )
    .transform(Number)
    .refine(
      (val) => {
        return val >= 0;
      },
      {
        message: "Net price must be >= 0",
      },
    )
    .refine(
      (val) => {
        return val <= 1_000_000_000;
      },
      {
        message: "Net price must not exceed 1 billion",
      },
    ),
  netPriceFieldIsVisible: z.boolean().default(true),

  // Tax rate. Accepts numbers 0-100 or any text string (i.e. NP, OO, etc)
  // Valid inputs and their outputs:
  // - "23" -> 23 (number)
  // - "100" -> 100 (number)
  // - "NP" -> "NP" (string)
  vat: z
    .preprocess(
      // z.preprocess runs before Zod does any validation, parsing, or type checking on the schema it wraps.
      (raw) => {
        // Handle null/undefined by returning empty string for validation
        if (raw === null || raw === undefined) return "";

        // Trim whitespace from string inputs, pass through other types as-is
        const val = typeof raw === "string" ? raw.trim() : raw;

        // Empty strings should fail the required validation
        if (val === "") return "";

        // Attempt to convert to number
        const num = Number(val);

        // If conversion succeeds, return as number (for 0-100 validation)
        // Otherwise, return as string (for text values like "NP", "OO", etc)
        return Number.isNaN(num) ? val : num;
      },
      z.union(
        [
          z
            .number()
            .min(
              0,
              `Tax rate must be a number between 0-100 or any text (i.e. NP, OO, etc).`,
            )
            .max(
              100,
              `Tax rate must be a number between 0-100 or any text (i.e. NP, OO, etc).`,
            ),
          z
            .string()
            .min(
              1,
              `Tax rate is required. Enter a number (0-100) or any text (i.e. NP, OO, etc).`,
            ),
        ],
        {
          // zod v4 replaced `errorMap` with `error`, which returns the message
          // string directly instead of a `{ message }` object.
          error: () => {
            return "Tax rate is required. Enter a number (0-100) or any text (i.e. NP, OO, etc).";
          },
        },
      ),
    )
    .describe(
      "Tax rate. Accepts numbers 0-100 or any text (i.e. NP, OO, etc).",
    ),

  vatFieldIsVisible: z.boolean().default(true),

  /**
   * Net Amount (**calculated automatically** - read only field in the UI)
   */
  netAmount: z.coerce.number().nonnegative("Net amount must be non-negative"),
  netAmountFieldIsVisible: z.boolean().default(true),

  /**
   * VAT Amount (**calculated automatically** - read only field in the UI)
   */
  vatAmount: z.coerce.number().nonnegative("VAT amount must be non-negative"),
  vatAmountFieldIsVisible: z.boolean().default(true),

  /**
   * Pre-tax Amount (**calculated automatically** - read only field in the UI)
   */
  preTaxAmount: z.coerce
    .number()
    .nonnegative("Pre-tax amount must be non-negative"),
  preTaxAmountFieldIsVisible: z.boolean().default(true),
});

export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;

export const sellerSchema = z.object({
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
  // not really only a vatNo anymore, it's a more general tax number (but we keep the name for simplicity, for now)
  vatNoLabelText: z
    .string()
    .min(1, "Tax number label is required")
    .max(50, "Tax number label must not exceed 50 characters")
    .trim()
    .default("VAT no")
    .describe(
      "Customizable tax number label. Defaults to ‘VAT no’, but you can change it to any text (e.g. Tax no, VAT no, etc.)",
    ),
  vatNoFieldIsVisible: z.boolean().default(true),

  email: z
    .string()
    .trim()
    .refine(
      (val) => {
        return val === "" || z.email().safeParse(val).success;
      },
      {
        message: "Invalid email address",
      },
    )
    .optional(),
  emailFieldIsVisible: z.boolean().default(true),

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
});

export type SellerData = z.infer<typeof sellerSchema>;

export const SELLERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_SELLERS";

export const buyerSchema = z.object({
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
  vatNoLabelText: z
    .string()
    .min(1, "Tax number label is required")
    .max(50, "Tax number label must not exceed 50 characters")
    .trim()
    .default("VAT no")
    .describe(
      "Customizable tax number label. Defaults to ‘VAT no’, but you can change it to any text (e.g. Tax no, VAT no, etc.)",
    ),
  vatNoFieldIsVisible: z.boolean().default(true),

  email: z
    .string()
    .trim()
    .refine(
      (val) => {
        return val === "" || z.email().safeParse(val).success;
      },
      {
        message: "Invalid email address",
      },
    )
    .optional(),
  emailFieldIsVisible: z.boolean().default(true),

  notes: z
    .string()
    .max(750, "Notes must not exceed 750 characters")
    .trim()
    .optional(),
  notesFieldIsVisible: z.boolean().default(true),
});

export type BuyerData = z.infer<typeof buyerSchema>;

export const BUYERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_BUYERS";

/**
 * Invoice object schema (without cross-field transforms)
 *
 * Exported for tests that need access to `.shape` (e.g. URL compression key map).
 */
export const invoiceObjectSchema = z.object({
  language: z.enum(SUPPORTED_INVOICE_PDF_LANGUAGES).default("en"),
  dateFormat: z.enum(SUPPORTED_DATE_FORMATS).default("YYYY-MM-DD"),
  currency: z.enum(SUPPORTED_CURRENCIES).default("EUR"),
  /**
   * The locale the numbers are punctuated in. The form writes it alongside `language` and
   * lets it be changed on its own afterwards, so the two can differ; it is absent only on
   * invoices saved before the setting existed, see {@link resolveNumberFormatLocale}.
   *
   * Whether a later language switch overwrites it is up to
   * {@link invoiceObjectSchema.shape.preserveNumberFormatOnLanguageChange}.
   */
  numberFormatLocale: z.enum(SUPPORTED_NUMBER_FORMAT_LOCALES).optional(),
  /**
   * Keep `numberFormatLocale` as it is when the invoice language changes.
   *
   * Off, which is the absence of the field, the two move together: picking Polish picks
   * Polish number formatting, which is what most invoices want. On, the format is pinned
   * and only the labels follow the language -- for the issuer who writes the same
   * `10 000,00` whoever is reading it.
   *
   * Like `numberFormatLocale` it is deliberately not `.default()`ed, so an invoice carries
   * it only once someone has turned it on, and it stays out of every share link and
   * `localStorage` entry that predates the setting.
   */
  preserveNumberFormatOnLanguageChange: z.boolean().optional(),
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

  /**
   * Tax label customization
   *
   * Allows users to customize the tax label text
   * Default is "VAT" but can be changed to any string value i.e. "Sales Tax", "GST", "IVA", etc.
   */
  taxLabelText: z
    .string()
    .min(1, "Tax label is required i.e. 'VAT', 'GST', 'Sales Tax', etc.")
    .max(50, "Tax label must not exceed 50 characters")
    .trim()
    .default("VAT")
    .describe(
      "Customizable tax label. Defaults to ‘VAT’, but you can change it to any text (e.g. Sales Tax, GST, IVA, etc.)",
    ),

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

  dateOfServiceStart: z
    .string()
    .trim()
    .optional()
    .describe(
      "Service period start date. Defaults to the first day of the month containing dateOfService",
    ),

  /**
   * Date of service end. (date of sales/of executing the service)
   * Name retained as "dateOfService" in schema for backwards compatibility.
   */
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
  /**
   * Show/hide the "Date of sales/of executing the service" field in the PDF
   */
  dateOfServiceFieldIsVisible: z.boolean().default(true),

  /**
   * Show/hide the "Service period" (service period start and end date) field in the PDF
   */
  servicePeriodFieldIsVisible: z.boolean().default(false),

  /**
   * Customizable "Service period" label shown in the PDF header
   */
  servicePeriodLabelText: z
    .string()
    .min(1, "Service period label is required")
    .max(250, "Service period label must not exceed 250 characters")
    .trim()
    .default("Service period")
    .describe(
      "Customizable service period label. Defaults to the translated 'Service period' text for the selected language.",
    ),

  /**
   * Customizable "Date of sales/of executing the service" label shown in the PDF header
   */
  dateOfServiceLabelText: z
    .string()
    .min(1, "Date of sales label is required")
    .max(250, "Date of sales label must not exceed 250 characters")
    .trim()
    .default("Date of sales/of executing the service")
    .describe(
      "Customizable date of sales label. Defaults to the translated text for the selected language.",
    ),

  /**
   * Field "Invoice Type" renamed to "Header Notes" in **UI** for clarity; stores invoice header notes.
   */
  invoiceType: z
    .string()
    .max(500, "Invoice type must not exceed 500 characters")
    .trim()
    .optional(),
  /**
   * Field "Invoice Type" renamed to "Header Notes" in **UI** for clarity; toggles visibility of the field in the PDF.
   */
  invoiceTypeFieldIsVisible: z.boolean().default(true),

  seller: sellerSchema,
  buyer: buyerSchema,

  items: z
    .array(invoiceItemSchema)
    .min(1, "At least one item is required")
    .max(
      MAX_INVOICE_ITEMS,
      `Invoices support at most ${MAX_INVOICE_ITEMS} line items`,
    ),

  /**
   * Total (**calculated automatically** - read only field in the UI)
   */
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
    .transform((val) => {
      return val;
    }) // Pass through value
    .pipe(
      z.union([
        z.literal(""), // Allow empty string
        z.url("Please enter a valid URL or leave empty").refine((url) => {
          return url.startsWith("https://");
        }, "URL must start with https://"), // Validate HTTPS URL format
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

  /**
   * QR Code data field
   *
   * Optional text that will be encoded into a QR code and displayed on the invoice PDF
   * Can contain any text like URLs, payment info, etc.
   */
  qrCodeData: z
    .string()
    .max(500, "QR code data must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
  /**
   * QR Code description field
   *
   * Optional text that will be displayed below the QR code on the invoice PDF
   */
  qrCodeDescription: z
    .string()
    .max(500, "QR code description must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
  qrCodeIsVisible: z.boolean().default(true),

  personAuthorizedToReceiveName: z
    .string()
    .max(200, "Name must not exceed 200 characters")
    .trim()
    .optional()
    .default(""),
  personAuthorizedToReceiveFieldIsVisible: z.boolean().default(true),

  personAuthorizedToIssueName: z
    .string()
    .max(200, "Name must not exceed 200 characters")
    .trim()
    .optional()
    .default(""),
  personAuthorizedToIssueFieldIsVisible: z.boolean().default(true),
});

/**
 * Invoice schema
 *
 * This schema is used to validate the invoice data
 */
export const invoiceSchema = invoiceObjectSchema
  .transform((data) => {
    return {
      ...data,
      // Ensure dateOfServiceStart is trimmed and defaults to first day of
      // month containing dateOfService if not set
      dateOfServiceStart:
        data.dateOfServiceStart?.trim() ||
        dayjs(data.dateOfService).startOf("month").format("YYYY-MM-DD"),
    };
  })
  .superRefine((data, ctx) => {
    // Custom validation: dateOfServiceStart must not be after dateOfService
    if (
      dayjs(data.dateOfServiceStart).isAfter(dayjs(data.dateOfService), "day")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Service period start must be on or before the end date",
        path: ["dateOfServiceStart"],
      });
    }
  });

export type InvoiceData = z.infer<typeof invoiceSchema>;

export const PDF_DATA_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_DATA";

/**
 * Accordion state schema
 *
 * This schema is used to store the state of the accordion in the local storage
 *
 * The accordion is used to collapse/expand the sections of the invoice form
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

export const MOBILE_TABS_VALUES = ["invoice-form", "invoice-preview"] as const;
export const DEFAULT_MOBILE_TAB = MOBILE_TABS_VALUES[0];

export type MobileTabsValues = (typeof MOBILE_TABS_VALUES)[number];

/**
 * Metadata schema
 *
 * This schema is used to store the metadata about EasyInvoicePDF web app in the local storage
 */
export const metadataSchema = z.object({
  /** the app version */
  appVersion: z.string().default(APP_VERSION),
  /** the schema (zod) version of the app's data model */
  schemaVersion: z.string().default(SCHEMA_VERSION),
  /** when the invoice was created (i.e. invoice is first created) */
  invoiceCreatedAt: z.iso.datetime().default(() => {
    return dayjs().toISOString();
  }),
  /** when the invoice was last updated (i.e. invoice is regenerated) */
  invoiceLastUpdatedAt: z.iso.datetime().optional(),

  /** the last visited mobile tab (for better UX) */
  lastVisitedMobileTab: z
    .enum(MOBILE_TABS_VALUES)
    .default(DEFAULT_MOBILE_TAB)
    .optional(),

  /** how many times the invoice PDF has been downloaded */
  invoiceDownloadCount: z.number().int().nonnegative().default(0),
  /** how many times the invoice has been shared via link */
  invoiceSharedCount: z.number().int().nonnegative().default(0),
});

export type Metadata = z.infer<typeof metadataSchema>;

export const METADATA_LOCAL_STORAGE_KEY = "EASY_INVOICE_METADATA";

// __________________________________________________________
// Local storage keys
// __________________________________________________________

/**
 * Remembers that the user has already seen the welcome popup. The value is a version
 * marker, so bumping it shows the popup again.
 */
export const WELCOME_POPUP_SEEN_STORAGE_KEY = "EASY_INVOICE_WELCOME_POPUP_SEEN";

/**
 * The value {@link WELCOME_POPUP_SEEN_STORAGE_KEY} holds once the welcome popup has been
 * seen. Exported for `playwright.config.ts`, which marks it seen for every e2e run.
 */
export const WELCOME_POPUP_SEEN_VALUE = "v1";

/** The slug of the newest changelog entry the user has seen. */
export const CHANGELOG_SEEN_STORAGE_KEY =
  "EASY_INVOICE_LAST_SEEN_CHANGELOG_SLUG";

/** When the CTA toast was last shown, as an epoch-milliseconds string. */
export const CTA_TOAST_STORAGE_KEY = "EASY_INVOICE_CTA_LAST_SHOWN_AT";

/**
 * Every key the app is allowed to write to `localStorage`.
 *
 * The keys themselves are declared next to whatever describes their contents (the
 * invoice, seller and metadata schemas above); this is the one list of all of them, and
 * it is what `getAppStorageItem` / `setAppStorageItem` accept. Anything persisted by the
 * app belongs here, so that "what do we store, and can two features collide?" has a
 * single answer.
 */
export const LOCAL_STORAGE_KEYS = [
  PDF_DATA_LOCAL_STORAGE_KEY,
  METADATA_LOCAL_STORAGE_KEY,
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  BUYERS_LOCAL_STORAGE_KEY,
  WELCOME_POPUP_SEEN_STORAGE_KEY,
  CHANGELOG_SEEN_STORAGE_KEY,
  CTA_TOAST_STORAGE_KEY,
] as const;

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[number];

// __________________________________________________________
// Validate that local storage keys are unique
// __________________________________________________________

// Two features sharing a key would silently overwrite each other's data, and the union
// type above cannot catch it - a duplicate literal collapses into the same member.
const uniqueLocalStorageKeys = new Set<string>(LOCAL_STORAGE_KEYS);

if (uniqueLocalStorageKeys.size !== LOCAL_STORAGE_KEYS.length) {
  const duplicates = LOCAL_STORAGE_KEYS.filter((key, index) => {
    return LOCAL_STORAGE_KEYS.indexOf(key) !== index;
  });

  throw new Error(
    `LOCAL_STORAGE_KEYS contains duplicate entries: ${duplicates.join(", ")}`,
  );
}

// __________________________________________________________
// Validate that currencies are unique
// __________________________________________________________

const uniqueCurrencies = new Set(SUPPORTED_CURRENCIES);

if (uniqueCurrencies.size !== SUPPORTED_CURRENCIES.length) {
  const duplicates = SUPPORTED_CURRENCIES.filter((currency, index) => {
    return SUPPORTED_CURRENCIES.indexOf(currency) !== index;
  });

  const currencyFullNames = duplicates.map((currency) => {
    const currencyFullName = CURRENCY_TO_LABEL[currency];

    return `${currency} - ${currencyFullName}`;
  });

  throw new Error(
    `SUPPORTED_CURRENCIES contains duplicate entries: ${currencyFullNames.join(", ")}`,
  );
}

// Validate that all supported currencies are in exactly one group
const currenciesInGroups = CURRENCY_GROUPS.flatMap((g) => {
  return g.currencies;
});
const currenciesInGroupsSet = new Set(currenciesInGroups);

// Check for duplicates within groups
if (currenciesInGroupsSet.size !== currenciesInGroups.length) {
  const duplicates = currenciesInGroups.filter((currency, index) => {
    return currenciesInGroups.indexOf(currency) !== index;
  });
  throw new Error(
    `CURRENCY_GROUPS contains duplicate entries: ${duplicates.join(", ")}`,
  );
}

// Check for missing currencies
const missingCurrencies = SUPPORTED_CURRENCIES.filter((c) => {
  return !currenciesInGroupsSet.has(c);
});
if (missingCurrencies.length > 0) {
  throw new Error(
    `CURRENCY_GROUPS is missing currencies: ${missingCurrencies.join(", ")}`,
  );
}
