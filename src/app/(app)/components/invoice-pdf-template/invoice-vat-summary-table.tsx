import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
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
  const t = TRANSLATIONS[language];

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
      {/* Header row */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.vatRate}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.net}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.vat}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.preTax}</Text>
        </View>
      </View>

      {/* Table body rows*/}
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

        return (
          <View style={styles.tableRow} key={index}>
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

      {/* Total row */}
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
    </View>
  );
}
