import type { InvoiceData } from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

/** Invoice fixture for render-pdf-on-server.test.tsx — no logo. */
export const SERVER_PDF_MOCK_INVOICE_DATA = {
  ...MOCK_INVOICE_DATA,
  logo: "",
  invoiceType: "Reverse Charge",
  notes:
    "Test PDF for server-side rendering using <InvoicePdfTemplateToRenderOnBackend/> in src/app/api/generate-invoice/render-pdf-on-server.tsx. Used to validate server PDF generation.",
  items: MOCK_INVOICE_DATA.items.map((item) => {
    return {
      ...item,
      typeOfGTUFieldIsVisible: false,
      invoiceItemNumberIsVisible: true,
      name: "Software Development",
      nameFieldIsVisible: true,
      amount: 1,
      amountFieldIsVisible: true,
      unit: "service",
      unitFieldIsVisible: true,
      netPrice: 10_000,
      netPriceFieldIsVisible: true,
      vat: "NP",
      vatFieldIsVisible: true,
      netAmount: 10_000,
      netAmountFieldIsVisible: true,
      vatAmount: 0,
      vatAmountFieldIsVisible: true,
      preTaxAmount: 10_000,
      preTaxAmountFieldIsVisible: true,
    };
  }),
  total: 10_000,
} satisfies InvoiceData;
