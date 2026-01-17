import { type InvoiceData } from "@/app/schema";
import { INVOICE_PDF_FONTS } from "@/config";
import {
  Document,
  Font,
  Page,
  StyleSheet,
} from "@react-pdf/renderer/lib/react-pdf.browser";
import { memo } from "react";
import { InvoiceBody } from "./invoice-body";

// Open sans seems to be working fine with EN and PL
const fontFamily = "Open Sans";
const fontFamilyBold = "Open Sans";

Font.register({
  family: fontFamily,
  fonts: [
    {
      src: INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_REGULAR,
    },
    {
      src: INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_700,
      fontWeight: 700,
    },
  ],
});

// Styles for the PDF
export const PDF_DEFAULT_TEMPLATE_STYLES = StyleSheet.create({
  wFull: {
    width: "100%",
  },
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: fontFamily,
    fontWeight: 400,
  },
  header: {
    fontSize: 16,
    marginBottom: 0,
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  subheader: {
    fontSize: 12,
    marginBottom: 3,
    borderBottom: "1px solid gray",
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  fontSize7: {
    fontSize: 7,
  },
  fontSize8: {
    fontSize: 8,
  },
  fontSize9: {
    fontSize: 9,
  },
  fontSize10: {
    fontSize: 10,
  },
  fontSize11: {
    fontSize: 11,
  },
  fontBold: {
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  boldText: {
    fontFamily: fontFamilyBold,
    fontWeight: 600,
    fontSize: 7,
  },
  table: {
    display: "flex",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "gray",
  },

  tableRow: {
    flexDirection: "row",
    width: "100%",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "gray",
    textAlign: "center",
  },
  tableCell: {
    marginTop: 1.5,
    marginBottom: 1.5,
    fontSize: 8,
  },
  tableCellBold: {
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 2,
    marginRight: 2,
    fontSize: 8,
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  // styles for specific column widths for invoice items table
  colNo: { flex: 0.45 }, // smallest width for numbers
  colName: { flex: 4.8 }, // larger width for text
  colGTU: { flex: 0.9 }, // small width for codes
  colAmount: { flex: 1.2 }, // medium width for numbers
  colUnit: { flex: 1 }, // medium width for text
  colNetPrice: { flex: 1.5 }, // medium-large for prices
  colVAT: { flex: 0.8 }, // small width for percentages
  colNetAmount: { flex: 1.5 }, // medium-large for amounts
  colVATAmount: { flex: 1.5 }, // medium-large for amounts
  colPreTaxAmount: { flex: 1.5 }, // medium-large for amounts
  signatureSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 70,
    width: "100%",
  },
  signatureColumn: {
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
    marginHorizontal: "5%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "dashed",
    width: "100%",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1px solid #000",
    paddingTop: 5,
  },
  footerText: {
    fontSize: 8,
    color: "#000",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
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
} as const);

// Memoize the PDF Document component
export const InvoicePdfTemplate = memo(function InvoicePdfTemplate({
  invoiceData,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl?: string;
}) {
  const invoiceNumberLabel = invoiceData?.invoiceNumberObject?.label;

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const invoiceNumber = `${invoiceNumberLabel} ${invoiceNumberValue}`;
  const invoiceDocTitle = `${invoiceNumber} | Created with https://easyinvoicepdf.com`;

  return (
    <Document title={invoiceDocTitle}>
      <Page size="A4" style={PDF_DEFAULT_TEMPLATE_STYLES.page}>
        <InvoiceBody
          invoiceData={invoiceData}
          styles={PDF_DEFAULT_TEMPLATE_STYLES}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </Page>
    </Document>
  );
});
