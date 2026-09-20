import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";
import { formatAmountChunks } from "../../../utils/format-amount";
import { WrappableAmount } from "../common/wrappable-amount";

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
  const numberFormatLocale = resolveNumberFormatLocale(invoiceData);
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
                {/* .split("") is used for long text like "Type of Goods/Service" to wrap it in a new line
                https://github.com/diegomura/react-pdf/issues/2243#issuecomment-1778554041
                */}
                {t.invoiceItemsTable.typeOfGTU.split("")}
              </Text>
            </View>
          ) : null}

          {/* Amount column */}
          {isAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colAmount, styles.center]}>
              <Text style={[styles.tableCellBold]}>
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
          // The quantity column is not money: it carries no forced decimals and allows three
          const amountChunks = formatAmountChunks({
            amount: item.amount,
            numberFormatLocale,
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
          });

          const netPriceChunks = formatAmountChunks({
            amount: item.netPrice,
            numberFormatLocale,
          });

          const netAmountChunks = formatAmountChunks({
            amount: item.netAmount,
            numberFormatLocale,
          });

          const vatAmountChunks = formatAmountChunks({
            amount: item.vatAmount,
            numberFormatLocale,
          });

          const preTaxAmountChunks = formatAmountChunks({
            amount: item.preTaxAmount,
            numberFormatLocale,
          });

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
                  <WrappableAmount
                    chunks={amountChunks}
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  />
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
                  <WrappableAmount
                    chunks={netPriceChunks}
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  />
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
                  <WrappableAmount
                    chunks={netAmountChunks}
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  />
                </View>
              ) : null}

              {/* VAT amount */}
              {isVATAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colVATAmount]}>
                  <WrappableAmount
                    chunks={vatAmountChunks}
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  />
                </View>
              ) : null}

              {/* Pre-tax amount */}
              {isPreTaxAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colPreTaxAmount]}>
                  <WrappableAmount
                    chunks={preTaxAmountChunks}
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  />
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
          {/* This section renders the table footer row that displays the total/sum for the invoice,
          with the first nine columns as empty.
          View components serving as placeholders to align the sum to the final column. */}
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>
          <View style={[styles.tableCol, { borderRightWidth: 0 }]}></View>

          {/* The last cell spans the remaining width and contains the sum label and value */}
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
              {/* Renders the sum label (e.g., "Total:") followed by the formatted total */}
              {t.invoiceItemsTable.sum}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {formattedInvoiceTotal}
              </Text>
            </Text>
          </View>
        </View>
        {/*
          END: Table footer row
        */}
      </View>
    </View>
  );
}
