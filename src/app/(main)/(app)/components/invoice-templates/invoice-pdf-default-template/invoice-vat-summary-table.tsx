import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import { formatAmountChunks } from "../../../utils/format-amount";
import { WrappableAmount } from "../common/wrappable-amount";

/**
 * The rate column is pinned to the width it has always had: a quarter of the table back when
 * the table filled half the printable width, which is 66.9pt and all that a `20%`, an `NP` or
 * the word for "Total" has ever needed. Points rather than a percentage, so that widening the
 * table (see `invoice-body.tsx`) does not widen this column with it.
 *
 * The three money columns take what is left, a third each, which is where the extra width
 * goes -- an equal quarter of the old table had the amounts wrapping a thousands group onto a
 * second line sooner than they had to.
 */
const VAT_RATE_COLUMN_WIDTH = { width: 65 } as const;
const VAT_AMOUNT_COLUMN_WIDTH = { flex: 1 } as const;

export function InvoiceVATSummaryTable({
  invoiceData,
  invoiceTotalChunks,
  styles,
}: {
  invoiceData: InvoiceData;
  /** The invoice total, cut at its thousands boundaries -- see `formatAmountChunks`. */
  invoiceTotalChunks: string[];
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const numberFormatLocale = resolveNumberFormatLocale(invoiceData);
  const t = INVOICE_PDF_TRANSLATIONS[language];

  /**
   * Custom tax label text i.e. "VAT", "Sales Tax", "IVA", "GST", etc.
   */
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  const vatRateColumnLabel = t.vatSummaryTable.vatRate({
    customTaxLabel: taxLabelText,
  });
  const netColumnLabel = t.vatSummaryTable.net({
    customTaxLabel: taxLabelText,
  });
  const preTaxColumnLabel = t.vatSummaryTable.preTax({
    customTaxLabel: taxLabelText,
  });

  const sortedItems = [...(invoiceData?.items ?? [])].sort((a, b) => {
    // Handle cases where either value is a string (NP or OO)
    const isAString = Number.isNaN(Number(a.vat));
    const isBString = Number.isNaN(Number(b.vat));

    if (
      isAString &&
      isBString &&
      typeof a.vat === "string" &&
      typeof b.vat === "string"
    ) {
      return a.vat.localeCompare(b.vat);
    }

    if (isAString) return 1; // Strings go last
    if (isBString) return -1; // Strings go last

    // Both are numbers, sort descending
    return Number(b.vat) - Number(a.vat);
  });

  const totalNetAmount = sortedItems.reduce((acc, item) => {
    return acc + item.netAmount;
  }, 0);
  const totalNetAmountChunks = formatAmountChunks({
    amount: totalNetAmount,
    numberFormatLocale,
  });

  const totalVATAmount = sortedItems.reduce((acc, item) => {
    return acc + item.vatAmount;
  }, 0);
  const totalVatAmountChunks = formatAmountChunks({
    amount: totalVATAmount,
    numberFormatLocale,
  });

  return (
    <View style={[styles.table, { width: "100%" }]}>
      {/*
      START: Table header row (top of the VAT summary table)
      */}
      <View style={[styles.tableRow, { borderTopWidth: 1 }]} fixed>
        <View style={[styles.tableCol, VAT_RATE_COLUMN_WIDTH]}>
          <Text style={styles.tableCellBold}>{vatRateColumnLabel}</Text>
        </View>
        <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
          <Text style={styles.tableCellBold}>{netColumnLabel}</Text>
        </View>
        <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
          <Text style={styles.tableCellBold}>{taxLabelText}</Text>
        </View>
        <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
          <Text style={styles.tableCellBold}>{preTaxColumnLabel}</Text>
        </View>
      </View>
      {/*
      END: Table header row
      */}

      {/*
      START: Table body rows
      */}
      {sortedItems?.map((item, index) => {
        const netAmountChunks = formatAmountChunks({
          amount: item.netAmount,
          numberFormatLocale,
        });

        const preTaxAmountChunks = formatAmountChunks({
          amount: item.preTaxAmount,
          numberFormatLocale,
        });

        const vatAmountChunks = formatAmountChunks({
          amount: item.vatAmount,
          numberFormatLocale,
        });

        // Table row start
        return (
          <View
            style={styles.tableRow}
            key={index}
            wrap={false}
            minPresenceAhead={30}
          >
            {/* VAT rate */}
            <View style={[styles.tableCol, VAT_RATE_COLUMN_WIDTH]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {Number.isNaN(Number(item.vat)) ? item.vat : `${item.vat}%`}
              </Text>
            </View>
            {/* Net */}
            <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
              <WrappableAmount
                chunks={netAmountChunks}
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              />
            </View>
            {/* VAT */}
            <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
              <WrappableAmount
                chunks={vatAmountChunks}
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              />
            </View>
            {/* Pre-tax */}
            <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
              <WrappableAmount
                chunks={preTaxAmountChunks}
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              />
            </View>
          </View>
        );
      })}
      {/*
      END: Table body rows
      */}

      {/*
      START: Total row (bottom of the VAT summary table)
      */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCol, VAT_RATE_COLUMN_WIDTH]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {t.vatSummaryTable.total}
          </Text>
        </View>
        {/* Net */}
        <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
          <WrappableAmount
            chunks={totalNetAmountChunks}
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          />
        </View>
        {/* VAT */}
        <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
          <WrappableAmount
            chunks={totalVatAmountChunks}
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          />
        </View>
        {/* Pre-tax */}
        <View style={[styles.tableCol, VAT_AMOUNT_COLUMN_WIDTH]}>
          <WrappableAmount
            chunks={invoiceTotalChunks}
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          />
        </View>
      </View>
      {/*
      END: Total row
      */}
    </View>
  );
}
