import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

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
    const isAString = isNaN(Number(a.vat));
    const isBString = isNaN(Number(b.vat));

    if (isAString && isBString) {
      if (typeof a.vat === "string" && typeof b.vat === "string") {
        return a.vat.localeCompare(b.vat);
      }
    }

    if (isAString) return 1; // Strings go last
    if (isBString) return -1; // Strings go last

    // Both are numbers, sort descending
    return Number(b.vat) - Number(a.vat);
  });

  const totalNetAmount = sortedItems.reduce(
    (acc, item) => acc + item.netAmount,
    0,
  );
  const formattedTotalNetAmount = totalNetAmount
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replaceAll(",", " ");

  const totalVATAmount = sortedItems.reduce(
    (acc, item) => acc + item.vatAmount,
    0,
  );
  const formattedTotalVATAmount = totalVATAmount
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replaceAll(",", " ");

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
        const formattedNetAmount =
          typeof item.netAmount === "number"
            ? item.netAmount
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
                .replaceAll(",", " ")
            : "0.00";

        const formattedPreTaxAmount =
          typeof item.preTaxAmount === "number"
            ? item.preTaxAmount
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
                .replaceAll(",", " ")
            : "0.00";

        const formattedVatAmount =
          typeof item.vatAmount === "number"
            ? item.vatAmount
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
                .replaceAll(",", " ")
            : "0.00";

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
                {isNaN(Number(item.vat)) ? item.vat : `${item.vat}%`}
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
