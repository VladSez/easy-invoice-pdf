import { z } from "zod";
import { SUPPORTED_LANGUAGES, type SupportedLanguages } from "./index";

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
    netPrice: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
    vat: z.string(),
    /**
     * You can pass a custom text for the net amount label. i.e. for i18n
     * @example
     * netAmount: ({ customTaxLabel: string }) => {
     *   return `Сумма без ${customTaxLabel || "НДС"}`;
     * }
     */
    netAmount: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
    /**
     * You can pass a custom text for the VAT amount label. i.e. for i18n
     * @example
     * vatAmount: ({ customTaxLabel: string }) => {
     *   return `${customTaxLabel || "VAT"} Amount`;
     * }
     */
    vatAmount: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
    /**
     * You can pass a custom text for the pre-tax amount label. i.e. for i18n
     * @example
     * preTaxAmount: ({ customTaxLabel: string }) => {
     *   return `Сумма с ${customTaxLabel || "НДС"}`;
     * }
     */
    preTaxAmount: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
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
    vatRate: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
    /**
     * You can pass a custom text for the net label. i.e. for i18n
     * @example
     * net: ({ customTaxLabel: string }) => {
     *   return `Без ${customTaxLabel || "НДС"}`;
     * }
     */
    net: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
    vat: z.string(),
    /**
     * You can pass a custom text for the pre-tax label. i.e. for i18n
     * @example
     * preTax: ({ customTaxLabel: string }) => {
     *   return `С ${customTaxLabel || "НДС"}`;
     * }
     */
    preTax: z
      .function()
      .args(z.object({ customTaxLabel: z.string() }))
      .returns(z.string()),
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
    unitPrice: z.string(),
    amount: z.string(),
    tax: z.string(),
    subtotal: z.string(),
    total: z.string(),
    amountDue: z.string(),
    page: z.string(),
    of: z.string(),
  })
  .strict();

// Main translation schema
export const translationSchema = z
  .object({
    invoiceNumber: z.string(),
    dateOfIssue: z.string(),
    dateOfService: z.string(),
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

/**
 * Creates a map of language to schema
 * @example
    {
      en: translationSchema,
      pl: translationSchema,
      de: translationSchema,
      ...etc
    }
 */
const languageToSchemaMap = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((lang) => [lang, translationSchema]),
);
/**
 *Schema for all translations
 **/
export const translationsSchema = z.object(languageToSchemaMap);

// Type for a single language translation
export type TranslationSchema = z.infer<typeof translationSchema>;

// Type for all translations
export type TranslationsSchema = z.infer<typeof translationsSchema>;

export const TRANSLATIONS = {
  en: {
    invoiceNumber: "Invoice No. of",
    dateOfIssue: "Date of issue",
    dateOfService: "Date of sales/of executing the service",
    invoiceType: "Invoice Type",
    seller: {
      name: "Seller",
      vatNo: "VAT no",
      email: "e-mail",
      accountNumber: "Account Number",
      swiftBic: "SWIFT/BIC number",
    },
    buyer: {
      name: "Buyer",
      vatNo: "VAT no",
      email: "e-mail",
    },
    invoiceItemsTable: {
      no: "No",
      nameOfGoodsService: "Name of goods/service",
      typeOfGTU: "Type of GTU",
      amount: "Amount",
      unit: "Unit",
      /**
       * You can pass a custom text for the net price label. i.e. for i18n
       * @example
       * netPrice: ({ customTaxLabel: string }) => {
       *   return `Цена без ${customTaxLabel || "НДС"}`;
       * }
       */
      netPrice: () => {
        return `Net price`;
      },
      vat: "VAT",
      netAmount: () => {
        return `Net\n Amount`;
      },
      /**
       * You can pass a custom text for the VAT amount label. i.e. for i18n
       * @example
       * vatAmount: ({ customTaxLabel: string }) => {
       *   return `${customTaxLabel || "VAT"} Amount`;
       * }
       */
      vatAmount: ({ customTaxLabel }) => {
        return `${customTaxLabel || "VAT"} Amount`;
      },
      preTaxAmount: () => {
        return `Pre-tax amount `;
      },
      sum: "SUM",
    },
    paymentInfo: {
      paymentMethod: "Payment method",
      paymentDate: "Payment date",
    },
    vatSummaryTable: {
      /**
       * You can pass a custom text for the VAT rate label. i.e. for i18n
       * @example
       * vatRate: ({ customTaxLabel: string }) => {
       *   return `Ставка ${customTaxLabel || "НДС"}`;
       * }
       */
      vatRate: ({ customTaxLabel }) => {
        return `${customTaxLabel || "VAT"} rate`;
      },
      /**
       * You can pass a custom text for the net label. i.e. for i18n
       * @example
       * net: ({ customTaxLabel }) => {
       *   return `Без ${customTaxLabel || "НДС"}`;
       * }
       */
      net: () => {
        return `Net`;
      },
      vat: "VAT",
      /**
       * You can pass a custom text for the pre-tax label. i.e. for i18n
       * @example
       * preTax: ({ customTaxLabel: string }) => {
       *   return `С ${customTaxLabel || "НДС"}`;
       * }
       */
      preTax: () => {
        return `Pre-tax`;
      },
      total: "Total",
    },
    paymentTotals: {
      toPay: "To pay",
      paid: "Paid",
      leftToPay: "Left to pay",
      amountInWords: "Amount in words",
    },
    personAuthorizedToReceive: "Person authorized to receive",
    personAuthorizedToIssue: "Person authorized to issue",
    createdWith: "Created with",
    stripe: {
      invoice: "Invoice",
      invoiceNumber: "Invoice number",
      dateOfIssue: "Date of issue",
      dateDue: "Date due",
      servicePeriod: "Service period",
      billTo: "Bill to",
      due: "due",
      payOnline: "Pay Online",
      description: "Description",
      qty: "Qty",
      unitPrice: "Unit Price",
      amount: "Amount",
      tax: "Tax",
      subtotal: "Subtotal",
      total: "Total",
      amountDue: "Amount Due",
      page: "Page",
      of: "of",
    },
  },
  pl: {
    invoiceNumber: "Faktura nr",
    dateOfIssue: "Data wystawienia",
    dateOfService: "Data sprzedaży / wykonania usługi",
    invoiceType: "Typ faktury",
    seller: {
      name: "Sprzedawca",
      vatNo: "NIP",
      email: "E-mail",
      accountNumber: "Nr konta",
      swiftBic: "Nr SWIFT/BIC",
    },
    buyer: {
      name: "Nabywca",
      vatNo: "NIP",
      email: "E-mail",
    },
    invoiceItemsTable: {
      no: "lp.",
      nameOfGoodsService: "Nazwa towaru/usługi",
      typeOfGTU: "Typ\n GTU",
      amount: "Ilość",
      unit: "Jm",
      netPrice: () => {
        return `Cena\n netto`;
      },
      vat: "VAT",
      netAmount: () => {
        return `Kwota\n netto`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Kwota ${customTaxLabel || "VAT"}`;
      },
      preTaxAmount: () => {
        return `Kwota\n brutto`;
      },
      sum: "SUMA",
    },
    paymentInfo: {
      paymentMethod: "Sposób wpłaty",
      paymentDate: "Termin zapłaty",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Stawka ${customTaxLabel || "VAT"}`;
      },
      net: () => {
        return `Netto`;
      },
      vat: "VAT",
      preTax: () => {
        return `Brutto`;
      },
      total: "Razem",
    },
    paymentTotals: {
      toPay: "Razem do zapłaty",
      paid: "Wpłacono",
      leftToPay: "Pozostało do zapłaty",
      amountInWords: "Kwota słownie",
    },
    personAuthorizedToReceive: "Osoba upoważniona do odbioru",
    personAuthorizedToIssue: "Osoba upoważniona do wystawienia",
    createdWith: "Utworzono za pomocą",
    stripe: {
      invoice: "Faktura",
      invoiceNumber: "Numer faktury",
      dateOfIssue: "Data wystawienia",
      dateDue: "Termin płatności",
      servicePeriod: "Okres realizacji",
      billTo: "Nabywca",
      due: "do zapłaty do",
      payOnline: "Płatność online",
      description: "Opis",
      qty: "Ilość",
      unitPrice: "Cena jednostkowa",
      amount: "Kwota",
      tax: "Podatek",
      subtotal: "Podsumowanie",
      total: "Razem",
      amountDue: "Kwota do zapłaty",
      page: "Strona",
      of: "z",
    },
  },
  de: {
    invoiceNumber: "Rechnungsnummer",
    dateOfIssue: "Ausstellungsdatum",
    dateOfService: "Verkaufsdatum/Leistungsdatum",
    invoiceType: "Rechnungstyp",
    seller: {
      name: "Verkäufer",
      vatNo: "USt-IdNr",
      email: "E-Mail",
      accountNumber: "Kontonummer",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Käufer",
      vatNo: "USt-IdNr",
      email: "E-Mail",
    },
    invoiceItemsTable: {
      no: "Nr",
      nameOfGoodsService: "Bezeichnung der Ware/Dienstleistung",
      typeOfGTU: "GTU-Typ",
      amount: "Menge",
      unit: "Einheit",
      netPrice: () => {
        return `Nettopreis`;
      },
      vat: "MwSt.",
      netAmount: () => {
        return `Nettobetrag`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `${customTaxLabel || "MwSt."}-Betrag`;
      },
      preTaxAmount: () => {
        return `Bruttobetrag`;
      },
      sum: "SUMME",
    },
    paymentInfo: {
      paymentMethod: "Zahlungsart",
      paymentDate: "Zahlungsdatum",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `${customTaxLabel || "MwSt."}-Satz`;
      },
      net: () => {
        return `Netto`;
      },
      vat: "MwSt.",
      preTax: () => {
        return `Brutto`;
      },
      total: "Gesamt",
    },
    paymentTotals: {
      toPay: "Zu zahlen",
      paid: "Bezahlt",
      leftToPay: "Restbetrag",
      amountInWords: "Betrag in Worten",
    },
    personAuthorizedToReceive: "Empfangsberechtigte Person",
    personAuthorizedToIssue: "Ausstellungsberechtigte Person",
    createdWith: "Erstellt mit",
    stripe: {
      invoice: "Rechnung",
      invoiceNumber: "Rechnungsnummer",
      dateOfIssue: "Ausstellungsdatum",
      dateDue: "Fälligkeitsdatum",
      servicePeriod: "Leistungszeitraum",
      billTo: "Rechnung an",
      due: "fällig",
      payOnline: "Online-Zahlung",
      description: "Beschreibung",
      qty: "Menge",
      unitPrice: "Einzelpreis",
      amount: "Betrag",
      tax: "Steuer",
      subtotal: "Zwischensumme",
      total: "Gesamt",
      amountDue: "Fälligkeitsbetrag",
      page: "Seite",
      of: "von",
    },
  },
  es: {
    invoiceNumber: "Factura N°",
    dateOfIssue: "Fecha de emisión",
    dateOfService: "Fecha de venta/prestación del servicio",
    invoiceType: "Tipo de factura",
    seller: {
      name: "Vendedor",
      vatNo: "NIF/CIF",
      email: "Correo electrónico",
      accountNumber: "Número de cuenta",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Comprador",
      vatNo: "NIF/CIF",
      email: "Correo electrónico",
    },
    invoiceItemsTable: {
      no: "N°",
      nameOfGoodsService: "Descripción del producto/servicio",
      typeOfGTU: "Tipo\n GTU",
      amount: "Cantidad",
      unit: "Unidad",
      netPrice: () => {
        return `Precio neto`;
      },
      vat: "IVA",
      netAmount: () => {
        return `Importe\n neto`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Importe ${customTaxLabel || "IVA"}`;
      },
      preTaxAmount: () => {
        return `Importe bruto`;
      },
      sum: "TOTAL",
    },
    paymentInfo: {
      paymentMethod: "Forma de pago",
      paymentDate: "Fecha de pago",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Tipo ${customTaxLabel || "IVA"}`;
      },
      net: () => {
        return `Neto`;
      },
      vat: "IVA",
      preTax: () => {
        return `Bruto`;
      },
      total: "Total",
    },
    paymentTotals: {
      toPay: "Total a pagar",
      paid: "Pagado",
      leftToPay: "Pendiente de pago",
      amountInWords: "Importe en letras",
    },
    personAuthorizedToReceive: "Persona autorizada para recibir",
    personAuthorizedToIssue: "Persona autorizada para emitir",
    createdWith: "Creado con",
    stripe: {
      invoice: "Factura",
      invoiceNumber: "Número de factura",
      dateOfIssue: "Fecha de emisión",
      dateDue: "Fecha de vencimiento",
      servicePeriod: "Periodo de servicio",
      billTo: "Facturar a",
      due: "vencimiento",
      payOnline: "Pago en línea",
      description: "Descripción",
      qty: "Cantidad",
      unitPrice: "Precio unitario",
      amount: "Monto",
      tax: "Impuesto",
      subtotal: "Subtotal",
      total: "Total",
      amountDue: "Monto vencido",
      page: "Página",
      of: "de",
    },
  },
  pt: {
    invoiceNumber: "Fatura N°",
    dateOfIssue: "Data de emissão",
    dateOfService: "Data de venda/prestação do serviço",
    invoiceType: "Tipo de fatura",
    seller: {
      name: "Vendedor",
      vatNo: "NIF",
      email: "E-mail",
      accountNumber: "Número da conta",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Comprador",
      vatNo: "NIF",
      email: "E-mail",
    },
    invoiceItemsTable: {
      no: "N°",
      nameOfGoodsService: "Descrição do produto/serviço",
      typeOfGTU: "Tipo\n GTU",
      amount: "Quantidade",
      unit: "Unidade",
      netPrice: () => {
        return `Preço\n líquido`;
      },
      vat: "IVA",
      netAmount: () => {
        return `Valor\n líquido`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Valor ${customTaxLabel || "IVA"}`;
      },
      preTaxAmount: () => {
        return `Valor bruto`;
      },
      sum: "TOTAL",
    },
    paymentInfo: {
      paymentMethod: "Forma de pagamento",
      paymentDate: "Data de pagamento",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Taxa ${customTaxLabel || "IVA"}`;
      },
      net: () => {
        return `Líquido`;
      },
      vat: "IVA",
      preTax: () => {
        return `Bruto`;
      },
      total: "Total",
    },
    paymentTotals: {
      toPay: "Total a pagar",
      paid: "Pago",
      leftToPay: "Valor em falta",
      amountInWords: "Valor por extenso",
    },
    personAuthorizedToReceive: "Pessoa autorizada a receber",
    personAuthorizedToIssue: "Pessoa autorizada a emitir",
    createdWith: "Criado com",
    stripe: {
      invoice: "Fatura",
      invoiceNumber: "Número da fatura",
      dateOfIssue: "Data de emissão",
      dateDue: "Data de vencimento",
      servicePeriod: "Período de serviço",
      billTo: "Cobrar de",
      due: "vencimento",
      payOnline: "Pagamento online",
      description: "Descrição",
      qty: "Quantidade",
      unitPrice: "Preço unitário",
      amount: "Valor",
      tax: "Imposto",
      subtotal: "Subtotal",
      total: "Total",
      amountDue: "Valor vencido",
      page: "Página",
      of: "de",
    },
  },
  ru: {
    invoiceNumber: "Инвойс №",
    dateOfIssue: "Дата выставления",
    dateOfService: "Дата продажи/оказания услуги",
    invoiceType: "Тип счёта",
    seller: {
      name: "Продавец",
      vatNo: "ИНН",
      email: "Эл. почта",
      accountNumber: "Номер счёта",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Покупатель",
      vatNo: "ИНН",
      email: "Эл. почта",
    },
    invoiceItemsTable: {
      no: "№",
      nameOfGoodsService: "Наименование товара/услуги",
      typeOfGTU: "Тип\n GTU",
      amount: "Количество",
      unit: "Ед.\n изм.",
      netPrice: ({ customTaxLabel }) => {
        return `Цена без ${customTaxLabel || "НДС"}`;
      },
      vat: "НДС",
      netAmount: ({ customTaxLabel }) => {
        return `Сумма без ${customTaxLabel || "НДС"}`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Сумма ${customTaxLabel || "НДС"}`;
      },
      preTaxAmount: ({ customTaxLabel }) => {
        return `Сумма с ${customTaxLabel || "НДС"}`;
      },
      sum: "ИТОГО",
    },
    paymentInfo: {
      paymentMethod: "Способ оплаты",
      paymentDate: "Дата оплаты",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Ставка ${customTaxLabel || "НДС"}`;
      },
      net: ({ customTaxLabel }) => {
        return `Без ${customTaxLabel || "НДС"}`;
      },
      vat: "НДС",
      preTax: ({ customTaxLabel }) => {
        return `С ${customTaxLabel || "НДС"}`;
      },
      total: "Всего",
    },
    paymentTotals: {
      toPay: "Итого к оплате",
      paid: "Оплачено",
      leftToPay: "Осталось оплатить",
      amountInWords: "Сумма прописью",
    },
    personAuthorizedToReceive: "Уполномоченное лицо на получение",
    personAuthorizedToIssue: "Уполномоченное лицо на выставление",
    createdWith: "Создано с помощью",
    stripe: {
      invoice: "Счет",
      invoiceNumber: "Номер счета",
      dateOfIssue: "Дата выставления",
      dateDue: "Дата оплаты",
      servicePeriod: "Период оказания услуг",
      billTo: "Плательщик",
      due: "оплатить до",
      payOnline: "Оплатить онлайн",
      description: "Описание",
      qty: "Количество",
      unitPrice: "Цена за единицу",
      amount: "Сумма",
      tax: "Налог",
      subtotal: "Промежуточный итог",
      total: "Итого",
      amountDue: "Сумма к оплате",
      page: "Страница",
      of: "из",
    },
  },
  uk: {
    invoiceNumber: "Рахунок-фактура №",
    dateOfIssue: "Дата виставлення",
    dateOfService: "Дата продажу/надання послуги",
    invoiceType: "Тип рахунку",
    seller: {
      name: "Продавець",
      vatNo: "ІПН",
      email: "Ел. пошта",
      accountNumber: "Номер рахунку",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Покупець",
      vatNo: "ІПН",
      email: "Ел. пошта",
    },
    invoiceItemsTable: {
      no: "№",
      nameOfGoodsService: "Найменування товару/послуги",
      typeOfGTU: "Тип\n GTU",
      amount: "Кількість",
      unit: "Од.\n вим.",
      netPrice: ({ customTaxLabel }) => {
        return `Ціна без ${customTaxLabel || "ПДВ"}`;
      },
      vat: "ПДВ",
      netAmount: ({ customTaxLabel }) => {
        return `Сума без ${customTaxLabel || "ПДВ"}`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Сума ${customTaxLabel || "ПДВ"}`;
      },
      preTaxAmount: ({ customTaxLabel }) => {
        return `Сума з ${customTaxLabel || "ПДВ"}`;
      },
      sum: "РАЗОМ",
    },
    paymentInfo: {
      paymentMethod: "Спосіб оплати",
      paymentDate: "Дата оплати",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Ставка ${customTaxLabel || "ПДВ"}`;
      },
      net: ({ customTaxLabel }) => {
        return `Без ${customTaxLabel || "ПДВ"}`;
      },
      vat: "ПДВ",
      preTax: ({ customTaxLabel }) => {
        return `З ${customTaxLabel || "ПДВ"}`;
      },
      total: "Всього",
    },
    paymentTotals: {
      toPay: "Разом до сплати",
      paid: "Сплачено",
      leftToPay: "Залишилось сплатити",
      amountInWords: "Сума прописом",
    },
    personAuthorizedToReceive: "Уповноважена особа на отримання",
    personAuthorizedToIssue: "Уповноважена особа на виставлення",
    createdWith: "Створено за допомогою",
    stripe: {
      invoice: "Рахунок",
      invoiceNumber: "Номер рахунку",
      dateOfIssue: "Дата виставлення",
      dateDue: "Дата оплати",
      servicePeriod: "Період надання послуги",
      billTo: "Платник",
      due: "оплатити до",
      payOnline: "Оплатити онлайн",
      description: "Опис",
      qty: "Кількість",
      unitPrice: "Ціна за одиницю",
      amount: "Сума",
      tax: "Податок",
      subtotal: "Проміжний ітог",
      total: "Всього",
      amountDue: "Сума до сплати",
      page: "Сторінка",
      of: "з",
    },
  },
  fr: {
    invoiceNumber: "Facture N°",
    dateOfIssue: "Date d'émission",
    dateOfService: "Date de vente/prestation de service",
    invoiceType: "Type de facture",
    seller: {
      name: "Vendeur",
      vatNo: "N° TVA",
      email: "E-mail",
      accountNumber: "Numéro de compte",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Acheteur",
      vatNo: "N° TVA",
      email: "E-mail",
    },
    invoiceItemsTable: {
      no: "N°",
      nameOfGoodsService: "Désignation du produit/service",
      typeOfGTU: "Type\n GTU",
      amount: "Quantité",
      unit: "Unité",
      netPrice: () => {
        return `Prix HT`;
      },
      vat: "TVA",
      netAmount: () => {
        return `Montant\n HT`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Montant de la ${customTaxLabel || "TVA"}`;
      },
      preTaxAmount: () => {
        return `Total TTC`;
      },
      sum: "TOTAL",
    },
    paymentInfo: {
      paymentMethod: "Mode de paiement",
      paymentDate: "Date de paiement",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Taux ${customTaxLabel || "TVA"}`;
      },
      net: () => {
        return `HT`;
      },
      vat: "TVA",
      preTax: () => {
        return `TTC`;
      },
      total: "Total",
    },
    paymentTotals: {
      toPay: "Total à payer",
      paid: "Payé",
      leftToPay: "Reste à payer",
      amountInWords: "Montant en lettres",
    },
    personAuthorizedToReceive: "Personne autorisée à recevoir",
    personAuthorizedToIssue: "Personne autorisée à émettre",
    createdWith: "Créé avec",
    stripe: {
      invoice: "Facture",
      invoiceNumber: "Numéro de facture",
      dateOfIssue: "Date d'émission",
      dateDue: "Date d'échéance",
      servicePeriod: "Période de service",
      billTo: "Facturé à",
      due: "échéance",
      payOnline: "Payer en ligne",
      description: "Description",
      qty: "Quantité",
      unitPrice: "Prix unitaire",
      amount: "Montant",
      tax: "Taxe",
      subtotal: "Sous-total",
      total: "Total",
      amountDue: "Montant échéant",
      page: "Page",
      of: "de",
    },
  },
  it: {
    invoiceNumber: "Fattura N°",
    dateOfIssue: "Data di emissione",
    dateOfService: "Data di vendita/prestazione del servizio",
    invoiceType: "Tipo di fattura",
    seller: {
      name: "Venditore",
      vatNo: "P.IVA",
      email: "E-mail",
      accountNumber: "Numero di conto",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Acquirente",
      vatNo: "P.IVA",
      email: "E-mail",
    },
    invoiceItemsTable: {
      no: "N°",
      nameOfGoodsService: "Descrizione del prodotto/servizio",
      typeOfGTU: "Tipo\n GTU",
      amount: "Quantità",
      unit: "Unità",
      netPrice: () => {
        return `Prezzo netto`;
      },
      vat: "IVA",
      netAmount: () => {
        return `Importo\n netto`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `Importo ${customTaxLabel || "IVA"}`;
      },
      preTaxAmount: () => {
        return `Importo lordo`;
      },
      sum: "TOTALE",
    },
    paymentInfo: {
      paymentMethod: "Metodo di pagamento",
      paymentDate: "Data di pagamento",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `Aliquota ${customTaxLabel || "IVA"}`;
      },
      net: () => {
        return `Netto`;
      },
      vat: "IVA",
      preTax: () => {
        return `Lordo`;
      },
      total: "Totale",
    },
    paymentTotals: {
      toPay: "Totale da pagare",
      paid: "Pagato",
      leftToPay: "Rimanente da pagare",
      amountInWords: "Importo in lettere",
    },
    personAuthorizedToReceive: "Persona autorizzata a ricevere",
    personAuthorizedToIssue: "Persona autorizzata a emettere",
    createdWith: "Creato con",
    stripe: {
      invoice: "Fattura",
      invoiceNumber: "Numero di fattura",
      dateOfIssue: "Data di emissione",
      dateDue: "Data di scadenza",
      servicePeriod: "Periodo di servizio",
      billTo: "Fatturare a",
      due: "scadenza",
      payOnline: "Pagare online",
      description: "Descrizione",
      qty: "Quantità",
      unitPrice: "Prezzo unitario",
      amount: "Importo",
      tax: "Imposta",
      subtotal: "Totale parziale",
      total: "Totale",
      amountDue: "Importo scaduto",
      page: "Pagina",
      of: "di",
    },
  },
  nl: {
    invoiceNumber: "Factuurnummer",
    dateOfIssue: "Uitgiftedatum",
    dateOfService: "Datum van verkoop/dienstverlening",
    invoiceType: "Factuurtype",
    seller: {
      name: "Verkoper",
      vatNo: "BTW-nummer",
      email: "E-mail",
      accountNumber: "Rekeningnummer",
      swiftBic: "SWIFT/BIC",
    },
    buyer: {
      name: "Koper",
      vatNo: "BTW-nummer",
      email: "E-mail",
    },
    invoiceItemsTable: {
      no: "Nr",
      nameOfGoodsService: "Omschrijving product/dienst",
      typeOfGTU: "GTU-type",
      amount: "Aantal",
      unit: "Eenheid",
      netPrice: () => {
        return `Netto prijs`;
      },
      vat: "BTW",
      netAmount: () => {
        return `Nettobedrag`;
      },
      vatAmount: ({ customTaxLabel }) => {
        return `${customTaxLabel || "BTW"}-bedrag`;
      },
      preTaxAmount: () => {
        return `Brutobedrag`;
      },
      sum: "TOTAAL",
    },
    paymentInfo: {
      paymentMethod: "Betaalmethode",
      paymentDate: "Betaaldatum",
    },
    vatSummaryTable: {
      vatRate: ({ customTaxLabel }) => {
        return `${customTaxLabel || "BTW"}-tarief`;
      },
      net: () => {
        return `Netto`;
      },
      vat: "BTW",
      preTax: () => {
        return `Bruto`;
      },
      total: "Totaal",
    },
    paymentTotals: {
      toPay: "Te betalen",
      paid: "Betaald",
      leftToPay: "Nog te betalen",
      amountInWords: "Bedrag in woorden",
    },
    personAuthorizedToReceive: "Persoon gemachtigd voor ontvangst",
    personAuthorizedToIssue: "Persoon gemachtigd voor uitgifte",
    createdWith: "Gemaakt met",
    stripe: {
      invoice: "Factuur",
      invoiceNumber: "Factuurnummer",
      dateOfIssue: "Uitgiftedatum",
      dateDue: "Vervaldatum",
      servicePeriod: "Dienstverleningperiode",
      billTo: "Factuur aan",
      due: "verval",
      payOnline: "Online betalen",
      description: "Omschrijving",
      qty: "Aantal",
      unitPrice: "Netto prijs",
      amount: "Bedrag",
      tax: "Belasting",
      subtotal: "Subtotaal",
      total: "Totaal",
      amountDue: "Bedrag te betalen",
      page: "Pagina",
      of: "van",
    },
  },
} as const satisfies Record<SupportedLanguages, TranslationSchema>;
