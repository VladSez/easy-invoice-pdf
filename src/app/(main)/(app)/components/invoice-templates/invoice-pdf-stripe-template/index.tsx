"use client";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import { InvoiceQRCode } from "@/app/(main)/(app)/components/invoice-templates/common/invoice-qr-code";
import { formatCurrencyChunks } from "@/app/(main)/(app)/utils/format-currency";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";
import { INVOICE_PDF_FONTS } from "@/config";

import { StripeDueAmount } from "./stripe-due-amount";
import { StripeFooter } from "./stripe-footer";
import { StripeInvoiceHeader } from "./stripe-invoice-header";
import { StripeInvoiceInfo } from "./stripe-invoice-info";
import { StripeItemsTable } from "./stripe-items-table";
import { StripeSellerBuyerInfo } from "./stripe-seller-buyer-info";
import { StripeVatSummaryTableTotals } from "./stripe-totals";

import "dayjs/locale/de";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/nb";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt-br";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/sv";
import "dayjs/locale/uk";

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
    backgroundColor: "#FFFFFF",
    padding: 0,
    fontFamily: fontFamily,
    fontWeight: 400,

    paddingBottom: 30, // to fix overlapping issues with the fixed footer https://github.com/diegomura/react-pdf/issues/774#issuecomment-560069810
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

    marginTop: 16,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  // Column widths for Stripe-style table
  /**
   * The description hands a slice of its width to the quantity beside it. The two grow
   * factors still add up to 3.3, so every column to the right of them keeps the exact
   * width -- and the exact position -- it had before.
   */
  colDescription: { flex: 2.7, textAlign: "left" },
  /**
   * Wide enough for a quantity with a thousands separator in it. At `flex: 0.3` the cell
   * came to 20.7pt, which `999` already fills, so `WrappableAmount` stacked every
   * four-digit quantity onto two lines (`1,` over `000`). `0.6` buys 42.7pt, which holds
   * everything up to `100,000`; a quantity past that still wraps, which is what the
   * wrapping is there for.
   */
  colQty: {
    flex: 0.6,
    textAlign: "right",
    marginRight: 16,
  },
  colUnit: {
    flex: 0.7,
    textAlign: "left",
    marginLeft: 16,
  },
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
  vatTableHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },

  vatTableRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },

  /**
   * The label takes whatever the amount beside it leaves over, and wraps -- it is prose, so
   * it has somewhere to wrap to. See {@link STRIPE_TEMPLATE_STYLES.vatColValue}.
   */
  vatColLabel: {
    flex: 1,
    paddingRight: 8,
  },

  /**
   * The amount column is as wide as the amount in it, not a fixed share of the block.
   *
   * A fixed share made the wrap depend on the row's font weight. Every row here prints the
   * same kind of number, but "Amount due" prints it semibold, which is about 4% wider than
   * the regular rows above it -- enough that a share sized to fit `EUR 10.000.000.000,00`
   * at 400 (87.4pt of a 92pt column) did not fit it at 600 (91.2pt), and the one row a
   * reader actually looks for was the only one that broke across two lines.
   *
   * Sizing each cell to its own content takes the weight out of it: an amount wraps when it
   * is genuinely too wide for the block, not when the column's share happens to fall between
   * one weight's width and another's. The right edge is where it always was, because the
   * cell is the row's last item and its contents are right-aligned, so the rows stay in a
   * column whatever width each one takes.
   *
   * {@link maxWidth} is what the label keeps back for itself. Past it the amount wraps again
   * -- it has to go somewhere -- but by then every row in the block is wrapping, which is
   * the behaviour this is here to get.
   */
  vatColValue: {
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: "60%",
    textAlign: "right",
  },
} as const satisfies Styles);

export function StripeInvoicePdfTemplate({
  invoiceData,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl?: string;
}) {
  const language = invoiceData.language;
  const numberFormatLocale = resolveNumberFormatLocale(invoiceData);

  // Set dayjs locale based on invoice language
  dayjs.locale(language);

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;
  const invoiceNumber = `${invoiceNumberValue}`;

  const invoiceDocTitle =
    `Invoice ${invoiceNumber} | Created with https://easyinvoicepdf.com` as const;

  const invoiceTotalChunks = formatCurrencyChunks({
    amount: invoiceData?.total,
    currency: invoiceData.currency,
    numberFormatLocale,
  });

  const formattedInvoiceTotal = invoiceTotalChunks.join("");

  /**
   * We want to mimic the Stripe invoice format, which prints "$1,234.00 USD": English
   * renders USD as a bare `$`, and that is also the Canadian, Australian and Singapore
   * dollar, so the code goes back on.
   *
   * It follows the *format* locale rather than the invoice language, because that is what
   * decides the symbol -- an English invoice formatted in French already prints `$US`, and a
   * German invoice formatted in English would otherwise print a bare `$`. `international` is
   * built from `en-US`, so it prints that same bare `$`.
   */
  const currencyCode =
    invoiceData.currency === "USD" &&
    (numberFormatLocale === "en" || numberFormatLocale === "international")
      ? " USD"
      : "";

  const formattedInvoiceTotalWithCurrency = `${formattedInvoiceTotal}${currencyCode}`;

  /**
   * The same total for the totals column, which is narrow enough that a large amount has to
   * wrap. The code rides along on the last piece so it can never be left on a line of its own.
   */
  const invoiceTotalWithCurrencyChunks = invoiceTotalChunks.map(
    (chunk, index) => {
      return index === invoiceTotalChunks.length - 1
        ? `${chunk}${currencyCode}`
        : chunk;
    },
  );

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
          <View style={{ marginBottom: -16 }}>
            {/* negative margin to compensate for the marginTop of the items table */}
            <StripeDueAmount
              invoiceData={invoiceData}
              formattedInvoiceTotal={formattedInvoiceTotalWithCurrency}
              styles={STRIPE_TEMPLATE_STYLES}
            />
          </View>

          {/* Items table */}
          <StripeItemsTable
            invoiceData={invoiceData}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* VAT summary table (VAT rates, net amounts, VAT amounts, pre-tax amounts) */}
          <StripeVatSummaryTableTotals
            invoiceData={invoiceData}
            invoiceTotalChunks={invoiceTotalWithCurrencyChunks}
            styles={STRIPE_TEMPLATE_STYLES}
          />

          {/* Notes */}
          {invoiceData.notesFieldIsVisible && invoiceData.notes ? (
            <View
              style={[STRIPE_TEMPLATE_STYLES.mt24]}
              wrap={false}
              minPresenceAhead={50}
            >
              <Text style={[STRIPE_TEMPLATE_STYLES.fontSize10]}>
                {invoiceData.notes}
              </Text>
            </View>
          ) : null}

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
}
