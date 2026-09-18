import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import { formatAmount } from "../../../utils/format-amount";

export function InvoiceVATSummaryTable({
  invoiceData,
  formattedInvoiceTotal,
  styles,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
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
  const formattedTotalNetAmount = formatAmount({
    amount: totalNetAmount,
    numberFormatLocale,
  });

  const totalVATAmount = sortedItems.reduce((acc, item) => {
    return acc + item.vatAmount;
  }, 0);
  const formattedTotalVATAmount = formatAmount({
    amount: totalVATAmount,
    numberFormatLocale,
  });

  return (
    <View style={[styles.table, { width: "100%" }]}>
      {/*
      START: Table header row (top of the VAT summary table)
      */}
      <View style={[styles.tableRow, { borderTopWidth: 1 }]} fixed>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{vatRateColumnLabel}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{netColumnLabel}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{taxLabelText}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
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
        const formattedNetAmount = formatAmount({
          amount: item.netAmount,
          numberFormatLocale,
        });

        const formattedPreTaxAmount = formatAmount({
          amount: item.preTaxAmount,
          numberFormatLocale,
        });

        const formattedVatAmount = formatAmount({
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
            <View style={[styles.tableCol, { width: "25%" }]}>
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
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {formattedNetAmount}
              </Text>
            </View>
            {/* VAT */}
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {formattedVatAmount}
              </Text>
            </View>
            {/* Pre-tax */}
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {formattedPreTaxAmount}
              </Text>
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
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {t.vatSummaryTable.total}
          </Text>
        </View>
        {/* Net */}
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {formattedTotalNetAmount}
          </Text>
        </View>
        {/* VAT */}
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {formattedTotalVATAmount}
          </Text>
        </View>
        {/* Pre-tax */}
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {formattedInvoiceTotal}
          </Text>
        </View>
      </View>
      {/*
      END: Total row
      */}
    </View>
  );
}
