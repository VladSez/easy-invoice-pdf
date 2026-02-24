import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

export function InvoiceItemsTable({
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

  // we need to check only the first row, because all next rows are the same
  const isInvoiceItemNumberVisible =
    invoiceData.items[0].invoiceItemNumberIsVisible;
  const isNameFieldVisible = invoiceData.items[0].nameFieldIsVisible;
  const isTypeOfGTUFieldVisible = invoiceData.items[0].typeOfGTUFieldIsVisible;
  const isAmountFieldVisible = invoiceData.items[0].amountFieldIsVisible;
  const isUnitFieldVisible = invoiceData.items[0].unitFieldIsVisible;
  const isNetPriceFieldVisible = invoiceData.items[0].netPriceFieldIsVisible;
  const isVATFieldVisible = invoiceData.items[0].vatFieldIsVisible;
  const isNetAmountFieldVisible = invoiceData.items[0].netAmountFieldIsVisible;
  const isVATAmountFieldVisible = invoiceData.items[0].vatAmountFieldIsVisible;
  const isPreTaxAmountFieldVisible =
    invoiceData.items[0].preTaxAmountFieldIsVisible;

  /**
   * Custom tax label text i.e. "VAT", "Sales Tax", "IVA", "GST", etc.
   */
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  /**
   * Column labels
   */
  const vatAmountColumnLabel = t.invoiceItemsTable.vatAmount({
    customTaxLabel: taxLabelText,
  });
  const netPriceColumnLabel = t.invoiceItemsTable.netPrice({
    customTaxLabel: taxLabelText,
  });
  const netAmountColumnLabel = t.invoiceItemsTable.netAmount({
    customTaxLabel: taxLabelText,
  });
  const preTaxAmountColumnLabel = t.invoiceItemsTable.preTaxAmount({
    customTaxLabel: taxLabelText,
  });

  return (
    <View style={{ marginBottom: 5, marginTop: 14 }}>
      <View style={styles.table}>
        {/* 
          START: Table header row with columns
        */}
        <View style={[styles.tableRow, { borderTopWidth: 1 }]} fixed>
          {/* Number column */}
          {isInvoiceItemNumberVisible ? (
            <View style={[styles.tableCol, styles.colNo, styles.center]}>
              <Text style={styles.tableCellBold}>{t.invoiceItemsTable.no}</Text>
            </View>
          ) : null}

          {/* Name of goods/service column */}
          {isNameFieldVisible ? (
            <View style={[styles.tableCol, styles.colName, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.nameOfGoodsService}
              </Text>
            </View>
          ) : null}

          {/* Type of GTU column */}
          {isTypeOfGTUFieldVisible ? (
            <View style={[styles.tableCol, styles.colGTU, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.typeOfGTU.split("")}
              </Text>
            </View>
          ) : null}

          {/* Amount column */}
          {isAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colAmount, styles.center]}>
              <Text style={[styles.tableCellBold]}>
                {/* https://github.com/diegomura/react-pdf/issues/2243#issuecomment-1778554041 */}
                {t.invoiceItemsTable.amount.split("")}
              </Text>
            </View>
          ) : null}

          {/* Unit column */}
          {isUnitFieldVisible ? (
            <View style={[styles.tableCol, styles.colUnit, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.unit.split("")}
              </Text>
            </View>
          ) : null}

          {/* Net price column */}
          {isNetPriceFieldVisible ? (
            <View style={[styles.tableCol, styles.colNetPrice, styles.center]}>
              <Text style={styles.tableCellBold}>{netPriceColumnLabel}</Text>
            </View>
          ) : null}

          {/* VAT column */}
          {isVATFieldVisible ? (
            <View style={[styles.tableCol, styles.colVAT, styles.center]}>
              <Text style={styles.tableCellBold}>{taxLabelText.split("")}</Text>
            </View>
          ) : null}

          {/* Net amount column */}
          {isNetAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colNetAmount, styles.center]}>
              <Text style={styles.tableCellBold}>{netAmountColumnLabel}</Text>
            </View>
          ) : null}

          {/* VAT amount column */}
          {isVATAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colVATAmount, styles.center]}>
              <Text style={styles.tableCellBold}>{vatAmountColumnLabel}</Text>
            </View>
          ) : null}

          {/* Pre-tax amount column */}
          {isPreTaxAmountFieldVisible ? (
            <View
              style={[styles.tableCol, styles.colPreTaxAmount, styles.center]}
            >
              <Text style={[styles.tableCellBold]}>
                {preTaxAmountColumnLabel}
              </Text>
            </View>
          ) : null}
        </View>
        {/* 
            END: Table header columns
        */}

        {/* 
          START: Table body rows
        */}
        {invoiceData?.items.map((item, index) => {
          const formattedAmount = item.amount
            .toLocaleString("en-US", {
              style: "decimal",
              maximumFractionDigits: 3,
            })
            .replaceAll(",", " ");

          const formattedNetPrice = item.netPrice
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .replaceAll(",", " ");

          const formattedNetAmount = item.netAmount
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .replaceAll(",", " ");

          const formattedVATAmount = item.vatAmount
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .replaceAll(",", " ");

          const formattedPreTaxAmount = item.preTaxAmount
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .replaceAll(",", " ");

          const formattedVat = Number.isNaN(Number(item.vat))
            ? item.vat
            : `${Number(item.vat)}%`;

          // Table row
          return (
            <View
              style={styles.tableRow}
              key={index}
              wrap={false}
              minPresenceAhead={60}
            >
              {/* Number */}
              {isInvoiceItemNumberVisible ? (
                <View style={[styles.tableCol, styles.colNo]}>
                  <Text style={styles.tableCell}>{index + 1}.</Text>
                </View>
              ) : null}

              {/* Name of goods/service */}
              {isNameFieldVisible ? (
                <View style={[styles.tableCol, styles.colName]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { textAlign: "left", marginLeft: 2, marginRight: 2 },
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>
              ) : null}

              {/* Type of GTU */}
              {isTypeOfGTUFieldVisible ? (
                <View style={[styles.tableCol, styles.colGTU]}>
                  <Text style={[styles.tableCell]}>{item.typeOfGTU}</Text>
                </View>
              ) : null}

              {/* Amount */}
              {isAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colAmount]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  >
                    {typeof item?.amount === "number"
                      ? formattedAmount
                      : "0.00"}
                  </Text>
                </View>
              ) : null}

              {/* Unit */}
              {isUnitFieldVisible ? (
                <View style={[styles.tableCol, styles.colUnit]}>
                  <Text style={[styles.tableCell, { textAlign: "center" }]}>
                    {item.unit}
                  </Text>
                </View>
              ) : null}

              {/* Net price */}
              {isNetPriceFieldVisible ? (
                <View style={[styles.tableCol, styles.colNetPrice]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  >
                    {typeof item?.netPrice === "number"
                      ? formattedNetPrice
                      : "0.00"}
                  </Text>
                </View>
              ) : null}

              {/* VAT */}
              {isVATFieldVisible ? (
                <View
                  style={[
                    styles.tableCol,
                    styles.colVAT,
                    { textAlign: "center" },
                  ]}
                >
                  <Text style={styles.tableCell}>
                    {String(formattedVat).split("")}
                  </Text>
                </View>
              ) : null}

              {/* Net amount */}
              {isNetAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colNetAmount]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  >
                    {typeof item?.netAmount === "number"
                      ? formattedNetAmount
                      : "0.00"}
                  </Text>
                </View>
              ) : null}

              {/* VAT amount */}
              {isVATAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colVATAmount]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  >
                    {typeof item?.vatAmount === "number"
                      ? formattedVATAmount
                      : "0.00"}
                  </Text>
                </View>
              ) : null}

              {/* Pre-tax amount */}
              {isPreTaxAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colPreTaxAmount]}>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        textAlign: "right",
                        marginRight: 2,
                      },
                    ]}
                  >
                    {typeof item?.preTaxAmount === "number"
                      ? formattedPreTaxAmount
                      : "0.00"}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
        {/* 
          END: Table body rows
        */}

        {/* 
          START: Table footer
        */}
        <View style={styles.tableRow} wrap={false} minPresenceAhead={60}>
          {/* Empty cells */}
          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { width: "100%" }]}>
            <Text
              style={[
                styles.tableCell,
                {
                  marginTop: 2,
                  marginBottom: 2,
                  textAlign: "right",
                  marginRight: 5,
                },
              ]}
            >
              {t.invoiceItemsTable.sum}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {formattedInvoiceTotal}
              </Text>
            </Text>
          </View>
        </View>
        {/* 
          END: Table footer
        */}
      </View>
    </View>
  );
}
