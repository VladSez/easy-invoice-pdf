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
    netPrice: z.string(),
    vat: z.string(),
    netAmount: z.string(),
    vatAmount: z.string(),
    preTaxAmount: z.string(),
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
    vatRate: z.string(),
    net: z.string(),
    vat: z.string(),
    preTax: z.string(),
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
  })
  .strict();

// Schema for all translations
export const translationsSchema = z.record(
  z.enum(SUPPORTED_LANGUAGES),
  translationSchema
);

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
      netPrice: "Net price",
      vat: "VAT",
      netAmount: "Net\n Amount",
      vatAmount: "VAT Amount",
      preTaxAmount: "Pre-tax amount",
      sum: "SUM",
    },
    paymentInfo: {
      paymentMethod: "Payment method",
      paymentDate: "Payment date",
    },
    vatSummaryTable: {
      vatRate: "VAT rate",
      net: "Net",
      vat: "VAT",
      preTax: "Pre-tax",
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
      netPrice: "Cena\n netto",
      vat: "VAT",
      netAmount: "Kwota\n netto",
      vatAmount: "Kwota VAT",
      preTaxAmount: "Kwota brutto",
      sum: "SUMA",
    },
    paymentInfo: {
      paymentMethod: "Sposób wpłaty",
      paymentDate: "Termin zapłaty",
    },
    vatSummaryTable: {
      vatRate: "Stawka VAT",
      net: "Netto",
      vat: "VAT",
      preTax: "Brutto",
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
      netPrice: "Nettopreis",
      vat: "MwSt",
      netAmount: "Netto\n Betrag",
      vatAmount: "MwSt Betrag",
      preTaxAmount: "Bruttobetrag",
      sum: "SUMME",
    },
    paymentInfo: {
      paymentMethod: "Zahlungsart",
      paymentDate: "Zahlungsdatum",
    },
    vatSummaryTable: {
      vatRate: "MwSt-Satz",
      net: "Netto",
      vat: "MwSt",
      preTax: "Brutto",
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
      typeOfGTU: "Tipo GTU",
      amount: "Cantidad",
      unit: "Unidad",
      netPrice: "Precio neto",
      vat: "IVA",
      netAmount: "Importe\n neto",
      vatAmount: "Importe IVA",
      preTaxAmount: "Importe bruto",
      sum: "TOTAL",
    },
    paymentInfo: {
      paymentMethod: "Forma de pago",
      paymentDate: "Fecha de pago",
    },
    vatSummaryTable: {
      vatRate: "Tipo IVA",
      net: "Neto",
      vat: "IVA",
      preTax: "Bruto",
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
      typeOfGTU: "Tipo GTU",
      amount: "Quantidade",
      unit: "Unidade",
      netPrice: "Preço\n líquido",
      vat: "IVA",
      netAmount: "Valor\n líquido",
      vatAmount: "Valor IVA",
      preTaxAmount: "Valor bruto",
      sum: "TOTAL",
    },
    paymentInfo: {
      paymentMethod: "Forma de pagamento",
      paymentDate: "Data de pagamento",
    },
    vatSummaryTable: {
      vatRate: "Taxa IVA",
      net: "Líquido",
      vat: "IVA",
      preTax: "Bruto",
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
      typeOfGTU: "Тип GTU",
      amount: "Количество",
      unit: "Ед.\n изм.",
      netPrice: "Цена без НДС",
      vat: "НДС",
      netAmount: "Сумма\n без НДС",
      vatAmount: "Сумма НДС",
      preTaxAmount: "Сумма с НДС",
      sum: "ИТОГО",
    },
    paymentInfo: {
      paymentMethod: "Способ оплаты",
      paymentDate: "Дата оплаты",
    },
    vatSummaryTable: {
      vatRate: "Ставка НДС",
      net: "Без НДС",
      vat: "НДС",
      preTax: "С НДС",
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
      typeOfGTU: "Тип GTU",
      amount: "Кількість",
      unit: "Од.\n вим.",
      netPrice: "Ціна без ПДВ",
      vat: "ПДВ",
      netAmount: "Сума\n без ПДВ",
      vatAmount: "Сума ПДВ",
      preTaxAmount: "Сума з ПДВ",
      sum: "РАЗОМ",
    },
    paymentInfo: {
      paymentMethod: "Спосіб оплати",
      paymentDate: "Дата оплати",
    },
    vatSummaryTable: {
      vatRate: "Ставка ПДВ",
      net: "Без ПДВ",
      vat: "ПДВ",
      preTax: "З ПДВ",
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
      typeOfGTU: "Type GTU",
      amount: "Quantité",
      unit: "Unité",
      netPrice: "Prix HT",
      vat: "TVA",
      netAmount: "Montant\n HT",
      vatAmount: "Montant TVA",
      preTaxAmount: "Montant TTC",
      sum: "TOTAL",
    },
    paymentInfo: {
      paymentMethod: "Mode de paiement",
      paymentDate: "Date de paiement",
    },
    vatSummaryTable: {
      vatRate: "Taux TVA",
      net: "HT",
      vat: "TVA",
      preTax: "TTC",
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
      typeOfGTU: "Tipo GTU",
      amount: "Quantità",
      unit: "Unità",
      netPrice: "Prezzo netto",
      vat: "IVA",
      netAmount: "Importo\n netto",
      vatAmount: "Importo IVA",
      preTaxAmount: "Importo lordo",
      sum: "TOTALE",
    },
    paymentInfo: {
      paymentMethod: "Metodo di pagamento",
      paymentDate: "Data di pagamento",
    },
    vatSummaryTable: {
      vatRate: "Aliquota IVA",
      net: "Netto",
      vat: "IVA",
      preTax: "Lordo",
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
      netPrice: "Netto prijs",
      vat: "BTW",
      netAmount: "Netto\n bedrag",
      vatAmount: "BTW bedrag",
      preTaxAmount: "Bruto bedrag",
      sum: "TOTAAL",
    },
    paymentInfo: {
      paymentMethod: "Betaalmethode",
      paymentDate: "Betaaldatum",
    },
    vatSummaryTable: {
      vatRate: "BTW-tarief",
      net: "Netto",
      vat: "BTW",
      preTax: "Bruto",
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
  },
} as const satisfies Record<SupportedLanguages, TranslationSchema>;
