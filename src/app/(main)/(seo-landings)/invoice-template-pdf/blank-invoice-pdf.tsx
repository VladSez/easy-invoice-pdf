// IMPORTANT: rendered only on the server, at build time, by the route handlers next to
// this file -- the same exception `render-pdf-on-server.tsx` makes
// eslint-disable-next-line no-restricted-imports
import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  TextInput,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { PROD_WEBSITE_URL } from "@/config";

/**
 * Paper sizes the blank template is offered in: A4 for most of the world, Letter for the
 * US and Canada, where "invoice template pdf" searchers print on Letter paper.
 */
export const BLANK_INVOICE_PAGE_SIZES = ["A4", "LETTER"] as const;

type BlankInvoicePageSize = (typeof BLANK_INVOICE_PAGE_SIZES)[number];

/** Empty line-item rows: enough for most invoices without crowding the page. */
const ITEM_ROW_COUNT = 10;

/**
 * Renders the blank invoice template as a PDF buffer.
 *
 * The document is both fillable and printable. Every value is an AcroForm text field,
 * so it can be typed into in any PDF reader, and each field sits on a ruled line, so a
 * printed copy can be filled in by hand. It uses the PDF standard font (Helvetica), so
 * nothing is fetched while rendering and the build has no network dependency.
 *
 * It does not total anything: a form field cannot do the math reliably across PDF
 * readers. The footer points to the generator, which does.
 */
export function renderBlankInvoicePdf({
  pageSize,
}: {
  pageSize: BlankInvoicePageSize;
}) {
  return renderToBuffer(<BlankInvoiceDocument pageSize={pageSize} />);
}

function BlankInvoiceDocument({
  pageSize,
}: {
  pageSize: BlankInvoicePageSize;
}) {
  return (
    <Document
      title="Blank Invoice Template"
      author="EasyInvoicePDF.com"
      subject="A free blank invoice template you can fill in or print"
      creator="EasyInvoicePDF.com"
      producer="EasyInvoicePDF.com"
    >
      <Page size={pageSize} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <View style={styles.headerFields}>
            <LabelledField label="Invoice no." name="invoiceNumber" />
            <LabelledField label="Date of issue" name="dateOfIssue" />
            <LabelledField label="Due date" name="dueDate" />
          </View>
        </View>

        <View style={styles.parties}>
          <PartyBlock heading="From" prefix="seller" />
          <PartyBlock heading="Bill to" prefix="buyer" />
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.tableHead]}>
            <Text style={[styles.cell, styles.colNo]}>#</Text>
            <Text style={[styles.cell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.cell, styles.colQty]}>Qty</Text>
            <Text style={[styles.cell, styles.colPrice]}>Unit price</Text>
            <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
          </View>
          {Array.from({ length: ITEM_ROW_COUNT }, (_, index) => {
            const rowNumber = index + 1;

            return (
              <View key={rowNumber} style={styles.row}>
                <Text style={[styles.cell, styles.colNo, styles.rowNumber]}>
                  {rowNumber}
                </Text>
                <FieldCell
                  name={`item${rowNumber}Description`}
                  style={styles.colDescription}
                />
                <FieldCell
                  name={`item${rowNumber}Quantity`}
                  style={styles.colQty}
                  align="right"
                />
                <FieldCell
                  name={`item${rowNumber}UnitPrice`}
                  style={styles.colPrice}
                  align="right"
                />
                <FieldCell
                  name={`item${rowNumber}Amount`}
                  style={styles.colAmount}
                  align="right"
                />
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <TotalRow label="Subtotal" name="subtotal" />
          <TotalRow label="Tax" name="tax" />
          <TotalRow label="Total due" name="total" isEmphasized />
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomBlock}>
            <Text style={styles.blockHeading}>Payment details</Text>
            <TextInput
              name="paymentDetails"
              multiline
              fontSize={9}
              style={styles.multilineField}
            />
          </View>
          <View style={styles.bottomBlock}>
            <Text style={styles.blockHeading}>Notes</Text>
            <TextInput
              name="notes"
              multiline
              fontSize={9}
              style={styles.multilineField}
            />
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Rather not do the math? Fill it in online and download the PDF, free
          and with no sign up, at{" "}
          <Link src={`${PROD_WEBSITE_URL}/invoice-template-pdf`}>
            easyinvoicepdf.com
          </Link>
        </Text>
      </Page>
    </Document>
  );
}

function LabelledField({ label, name }: { label: string; name: string }) {
  return (
    <View style={styles.labelledField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput name={name} fontSize={9} style={styles.lineField} />
    </View>
  );
}

function PartyBlock({ heading, prefix }: { heading: string; prefix: string }) {
  return (
    <View style={styles.party}>
      <Text style={styles.blockHeading}>{heading}</Text>
      <PartyLine label="Name" name={`${prefix}Name`} />
      <PartyLine label="Address" name={`${prefix}AddressLine1`} />
      <PartyLine label="" name={`${prefix}AddressLine2`} />
      <PartyLine label="Tax ID" name={`${prefix}TaxId`} />
      <PartyLine label="Email" name={`${prefix}Email`} />
    </View>
  );
}

function PartyLine({ label, name }: { label: string; name: string }) {
  return (
    <View style={styles.partyLine}>
      <Text style={styles.partyLabel}>{label}</Text>
      <TextInput name={name} fontSize={9} style={styles.partyField} />
    </View>
  );
}

function FieldCell({
  name,
  style,
  align = "left",
}: {
  name: string;
  style: (typeof styles)[keyof typeof styles];
  align?: "left" | "right";
}) {
  return (
    <View style={[styles.cell, style]}>
      <TextInput
        name={name}
        align={align}
        fontSize={9}
        style={styles.cellField}
      />
    </View>
  );
}

function TotalRow({
  label,
  name,
  isEmphasized = false,
}: {
  label: string;
  name: string;
  isEmphasized?: boolean;
}) {
  return (
    <View
      style={[styles.totalRow, isEmphasized ? styles.totalRowEmphasized : {}]}
    >
      <Text style={[styles.totalLabel, isEmphasized ? styles.bold : {}]}>
        {label}
      </Text>
      <TextInput
        name={name}
        align="right"
        fontSize={isEmphasized ? 11 : 9}
        style={styles.totalField}
      />
    </View>
  );
}

const INK = "#0f172a";
const MUTED = "#64748b";
const RULE = "#cbd5e1";

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    letterSpacing: 2,
  },
  headerFields: {
    width: 220,
    gap: 6,
  },
  labelledField: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  label: {
    width: 80,
    color: MUTED,
  },
  lineField: {
    flex: 1,
    height: 16,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  parties: {
    flexDirection: "row",
    gap: 28,
    marginBottom: 24,
  },
  party: {
    flex: 1,
  },
  blockHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 6,
  },
  partyLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 4,
  },
  partyLabel: {
    width: 46,
    color: MUTED,
  },
  partyField: {
    flex: 1,
    height: 16,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  tableHead: {
    fontFamily: "Helvetica-Bold",
    borderBottomColor: INK,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    minHeight: 22,
    alignItems: "center",
  },
  cell: {
    paddingHorizontal: 4,
  },
  cellField: {
    height: 18,
  },
  rowNumber: {
    color: MUTED,
  },
  colNo: { width: "6%" },
  colDescription: { width: "46%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "18%", textAlign: "right" },
  colAmount: { width: "18%", textAlign: "right" },
  totals: {
    alignSelf: "flex-end",
    width: 220,
    marginTop: 14,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 4,
  },
  totalRowEmphasized: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  totalLabel: {
    width: 90,
    color: MUTED,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  totalField: {
    flex: 1,
    height: 18,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  bottom: {
    flexDirection: "row",
    gap: 28,
    marginTop: 28,
  },
  bottomBlock: {
    flex: 1,
  },
  multilineField: {
    height: 64,
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    textAlign: "center",
    fontSize: 8,
    color: MUTED,
  },
});
