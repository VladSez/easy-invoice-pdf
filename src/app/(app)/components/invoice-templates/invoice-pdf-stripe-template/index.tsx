"use client";

import { type InvoiceData } from "@/app/schema";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer/lib/react-pdf.browser";

import { memo } from "react";
import { StripeDueAmount } from "./stripe-due-amount";
import { StripeFooter } from "./stripe-footer";
import { StripeInvoiceHeader } from "./stripe-invoice-header";
import { StripeInvoiceInfo } from "./stripe-invoice-info";
import { StripeItemsTable } from "./stripe-items-table";
import { StripeSellerBuyerInfo } from "./stripe-seller-buyer-info";
import { StripeTotals } from "./stripe-totals";
import { formatCurrency } from "@/app/(app)/utils/format-currency";
import { INVOICE_PDF_FONTS } from "@/config";

import "dayjs/locale/en";
import "dayjs/locale/pl";
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/uk";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/nl";
import dayjs from "dayjs";
import { InvoiceQRCode } from "@/app/(app)/components/invoice-templates/common/invoice-qr-code";

const fontFamily = "Inter";

Font.register({
  family: fontFamily,
  fonts: [
    {
      src: INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_REGULAR,
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_MEDIUM,
      fontWeight: 500,
      fontStyle: "normal",
    },
    {
      src: INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_SEMIBOLD,
      fontWeight: 600,
      fontStyle: "normal",
    },
  ],
});

// Stripe-inspired styles
export const STRIPE_TEMPLATE_STYLES = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 0,
    fontFamily: fontFamily,
    fontWeight: 400,
  },
  // Yellow header bar
  headerBar: {
    backgroundColor: "#fbbf24", // Yellow color matching screenshot
    height: 4,
    width: "100%",
  },
  // Main content container
  content: {
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 27,
    paddingBottom: 27,
  },
  // Typography
  fontSize8: { fontSize: 8 },
  fontSize9: { fontSize: 9 },
  fontSize10: { fontSize: 10 },
  fontSize11: { fontSize: 11 },
  fontSize12: { fontSize: 12 },
  fontSize14: { fontSize: 14 },
  fontSize16: { fontSize: 16 },
  fontSize18: { fontSize: 18 },
  fontSize24: { fontSize: 24 },
  fontRegular: {
    fontFamily: fontFamily,
    fontWeight: 400,
  },
  fontMedium: {
    fontFamily: fontFamily,
    fontWeight: 500,
  },
  fontBold: {
    fontFamily: fontFamily,
    fontWeight: 600,
  },
  // Colors
  textGray: { color: "#6b7280" },
  textDark: { color: "#111827" },
  // Layout
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Spacing
  mb1: { marginBottom: 1 },
  mb2: { marginBottom: 2 },
  mb3: { marginBottom: 3 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
  // Table styles
  table: {
    display: "flex",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#010000",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  // Column widths for Stripe-style table
  colDescription: { flex: 3 },
  colQty: { flex: 0.8, textAlign: "center" },
  colUnitPrice: { flex: 1.2, textAlign: "right" },
  colTax: { flex: 0.8, textAlign: "right" },
  colAmount: { flex: 1.3, textAlign: "right" },
  // Due amount highlight
  dueAmountBox: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginVertical: 24,
  },
  // Totals section
  totalsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1,
  },
  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  borderTop: {
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
  },
  // Footer styles
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
  },
} as const satisfies Styles);

export const StripeInvoicePdfTemplate = memo(function StripeInvoicePdfTemplate({
  invoiceData,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl?: string;
}) {
  const language = invoiceData.language;

  // Set dayjs locale based on invoice language
  dayjs.locale(language);

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;
  const invoiceNumber = `${invoiceNumberValue}`;
  const invoiceDocTitle = `Invoice ${invoiceNumber} | Created with https://easyinvoicepdf.com`;

  const formattedInvoiceTotal = formatCurrency({
    amount: invoiceData?.total,
    currency: invoiceData.currency,
    language,
  });

  // we want to mimic the Stripe invoice format, so we need to add the currency code only for USD in English
  const currencyCode =
    invoiceData.currency === "USD" && language === "en" ? " USD" : "";

  const formattedInvoiceTotalWithCurrency = `${formattedInvoiceTotal}${currencyCode}`;

  const isQrCodeVisible =
    invoiceData?.qrCodeIsVisible && qrCodeDataUrl && qrCodeDataUrl.length > 0;

  return (
    <Document title={invoiceDocTitle}>
      <Page size={"LETTER"} style={STRIPE_TEMPLATE_STYLES.page}>
        {/* Yellow header bar */}
        <View style={STRIPE_TEMPLATE_STYLES.headerBar} />

        {/* Main content */}
        <View style={STRIPE_TEMPLATE_STYLES.content}>
          {/* Header with Invoice title */}
          <StripeInvoiceHeader
            invoiceData={invoiceData}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Invoice basic info */}
          <StripeInvoiceInfo
            invoiceData={invoiceData}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Seller and buyer info */}
          <StripeSellerBuyerInfo
            invoiceData={invoiceData}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Due amount highlight */}
          <StripeDueAmount
            invoiceData={invoiceData}
            formattedInvoiceTotal={formattedInvoiceTotalWithCurrency}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Items table */}
          <StripeItemsTable
            invoiceData={invoiceData}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Totals */}
          <StripeTotals
            invoiceData={invoiceData}
            formattedInvoiceTotal={formattedInvoiceTotalWithCurrency}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Notes */}
          {invoiceData.notesFieldIsVisible && invoiceData.notes && (
            <View style={[STRIPE_TEMPLATE_STYLES.mt24]}>
              <Text style={[STRIPE_TEMPLATE_STYLES.fontSize10]}>
                {invoiceData.notes}
              </Text>
            </View>
          )}

          {/* QR Code - centered below notes */}
          {isQrCodeVisible ? (
            <InvoiceQRCode
              qrCodeDataUrl={qrCodeDataUrl}
              description={invoiceData.qrCodeDescription}
            />
          ) : null}
        </View>

        {/* Footer */}
        <StripeFooter
          invoiceData={invoiceData}
          formattedInvoiceTotal={formattedInvoiceTotalWithCurrency}
          styles={STRIPE_TEMPLATE_STYLES}
        />
      </Page>
    </Document>
  );
});
