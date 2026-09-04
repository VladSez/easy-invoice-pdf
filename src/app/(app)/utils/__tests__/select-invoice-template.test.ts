import { describe, it, expect } from "vitest";

import {
  getDefaultInvoiceNumberLabel,
  INVOICE_PDF_TRANSLATIONS,
} from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { getInitialInvoiceData, INITIAL_INVOICE_DATA } from "@/app/constants";
import type { InvoiceData } from "@/app/schema";

import { selectInvoiceTemplate } from "../select-invoice-template";

describe("selectInvoiceTemplate", () => {
  it("updates the default-template label when switching to Stripe", () => {
    const invoiceData = getInitialInvoiceData("default");

    const result = selectInvoiceTemplate(invoiceData, "stripe");

    expect(result.template).toBe("stripe");
    expect(result.invoiceNumberObject?.label).toBe(
      getDefaultInvoiceNumberLabel("en", "stripe"),
    );
    expect(result.invoiceNumberObject?.value).toBe(
      invoiceData.invoiceNumberObject?.value,
    );
  });

  it("updates the Stripe default label when switching to the default template", () => {
    const invoiceData = getInitialInvoiceData("stripe");

    const result = selectInvoiceTemplate(invoiceData, "default");

    expect(result.template).toBe("default");
    expect(result.invoiceNumberObject?.label).toBe(
      getDefaultInvoiceNumberLabel("en", "default"),
    );
  });

  it("migrates older Stripe drafts that still store the default-template label", () => {
    const invoiceData = {
      ...getInitialInvoiceData("stripe"),
      invoiceNumberObject: {
        ...INITIAL_INVOICE_DATA.invoiceNumberObject,
        label: getDefaultInvoiceNumberLabel("en", "default"),
      },
    };

    const result = selectInvoiceTemplate(invoiceData, "stripe");

    expect(result.template).toBe("stripe");
    expect(result.invoiceNumberObject?.label).toBe(
      getDefaultInvoiceNumberLabel("en", "stripe"),
    );
  });

  it("preserves custom invoice number labels when switching templates", () => {
    const customLabel = "Custom invoice label";
    const invoiceData = {
      ...getInitialInvoiceData("default"),
      invoiceNumberObject: {
        ...getInitialInvoiceData("default").invoiceNumberObject,
        label: customLabel,
      },
    };

    const result = selectInvoiceTemplate(invoiceData, "stripe");

    expect(result.template).toBe("stripe");
    expect(result.invoiceNumberObject?.label).toBe(customLabel);
  });

  it("updates translated default labels when the invoice language changes", () => {
    const invoiceData = {
      ...getInitialInvoiceData("default"),
      language: "pl" as const,
      invoiceNumberObject: {
        ...getInitialInvoiceData("default").invoiceNumberObject,
        label: getDefaultInvoiceNumberLabel("pl", "default"),
      },
    };

    const result = selectInvoiceTemplate(invoiceData, "stripe");

    expect(result.template).toBe("stripe");
    expect(result.invoiceNumberObject?.label).toBe(
      INVOICE_PDF_TRANSLATIONS.pl.stripe.invoice,
    );
  });

  it("only updates the template when invoiceNumberObject is missing", () => {
    const invoiceData = {
      ...getInitialInvoiceData("default"),
      invoiceNumberObject: undefined,
    } as unknown as InvoiceData;

    const result = selectInvoiceTemplate(invoiceData, "stripe");

    expect(result.template).toBe("stripe");
    expect(result.invoiceNumberObject).toBeUndefined();
  });
});
