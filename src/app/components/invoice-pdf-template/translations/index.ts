import type { SupportedLanguages } from "@/app/schema/index";

// Add this interface before the translations object
interface TranslationSchema {
  invoiceNumber: string;
  dateOfIssue: string;
  dateOfService: string;
  invoiceType: string;
  seller: {
    name: string;
    vatNo: string;
    email: string;
    accountNumber: string;
    swiftBic: string;
  };
  buyer: {
    name: string;
    vatNo: string;
    email: string;
  };
  invoiceItemsTable: {
    no: string;
    nameOfGoodsService: string;
    typeOfGTU: string;
    amount: string;
    unit: string;
    netPrice: string;
    vat: string;
    netAmount: string;
    vatAmount: string;
    preTaxAmount: string;
    sum: string;
  };
  paymentInfo: {
    paymentMethod: string;
    paymentDate: string;
  };
  vatSummaryTable: {
    vatRate: string;
    net: string;
    vat: string;
    preTax: string;
    total: string;
  };
  paymentTotals: {
    toPay: string;
    paid: string;
    leftToPay: string;
    amountInWords: string;
  };
  personAuthorizedToReceive: string;
  personAuthorizedToIssue: string;
}

// Update the type assertion
export const translations = {
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
      accountNumber: "Número de conta",
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
  },
} as const satisfies Record<SupportedLanguages, TranslationSchema>;
