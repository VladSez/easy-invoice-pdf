import {
  SUPPORTED_LANGUAGES,
  type InvoiceData,
  type SupportedLanguages,
} from "@/app/schema";

interface TemplateInput {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
}

interface EmailTemplate {
  /** Produces the localized subject for an invoice. */
  subject: (input: TemplateInput) => string;
  /** Produces the localized plain-text message body for an invoice. */
  body: (input: TemplateInput) => string;
}

/** Localized subject and message factories for every supported PDF language. */
const templates = {
  en: {
    subject: ({ invoiceNumber }) => {
      return `Invoice ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Hello,\n\nPlease find your invoice attached.\n\nBest regards,\n${businessName}` as const;
    },
  },
  pl: {
    subject: ({ invoiceNumber }) => {
      return `Faktura ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Dzień dobry,\n\nW załączniku przesyłam fakturę.\n\nPozdrawiam,\n${businessName}` as const;
    },
  },
  de: {
    subject: ({ invoiceNumber }) => {
      return `Rechnung ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Hallo,\n\nim Anhang finden Sie Ihre Rechnung.\n\nViele Grüße\n${businessName}` as const;
    },
  },
  es: {
    subject: ({ invoiceNumber }) => {
      return `Factura ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Hola,\n\nAdjuntamos su factura.\n\nUn saludo,\n${businessName}` as const;
    },
  },
  pt: {
    subject: ({ invoiceNumber }) => {
      return `Fatura ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Olá,\n\nSegue a sua fatura em anexo.\n\nAtenciosamente,\n${businessName}` as const;
    },
  },
  ru: {
    subject: ({ invoiceNumber }) => {
      return `Счёт ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Здравствуйте!\n\nСчёт находится во вложении.\n\nС уважением,\n${businessName}` as const;
    },
  },
  uk: {
    subject: ({ invoiceNumber }) => {
      return `Рахунок ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Вітаємо!\n\nРахунок додано до листа.\n\nЗ повагою,\n${businessName}` as const;
    },
  },
  fr: {
    subject: ({ invoiceNumber }) => {
      return `Facture ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Bonjour,\n\nVeuillez trouver votre facture en pièce jointe.\n\nCordialement,\n${businessName}` as const;
    },
  },
  it: {
    subject: ({ invoiceNumber }) => {
      return `Fattura ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Buongiorno,\n\nin allegato trova la fattura.\n\nCordiali saluti,\n${businessName}` as const;
    },
  },
  nl: {
    subject: ({ invoiceNumber }) => {
      return `Factuur ${invoiceNumber}`;
    },
    body: ({ businessName }) => {
      return `Hallo,\n\nUw factuur vindt u in de bijlage.\n\nMet vriendelijke groet,\n${businessName}` as const;
    },
  },
} satisfies Record<SupportedLanguages, EmailTemplate>;

/** Removes header-breaking whitespace and supplies a display-safe fallback. */
function safeValue(value: string | undefined, fallback: string) {
  const trimmed = value?.replaceAll(/[\r\n]+/g, " ").trim();

  return trimmed || fallback;
}

/** Returns localized compose defaults derived from the current invoice. */
export function getDefaultEmailContent(invoiceData: InvoiceData): {
  subject: string;
  body: string;
} {
  const language = SUPPORTED_LANGUAGES.includes(invoiceData.language)
    ? invoiceData.language
    : "en";

  const input = {
    clientName: safeValue(invoiceData.buyer.name, "there"),
    businessName: safeValue(invoiceData.seller.name, "Your supplier"),
    invoiceNumber: safeValue(invoiceData.invoiceNumberObject?.value, ""),
  };

  return {
    subject: templates[language].subject(input).trim(),
    body: templates[language].body(input),
  };
}
