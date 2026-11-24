import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import dayjs from "dayjs";

import {
  CELL_HYPHENATION_PENALTY,
  hyphenateCellWord,
} from "@/app/(main)/(app)/components/invoice-templates/common/hyphenate-cell-word";
import { WrappableAmount } from "@/app/(main)/(app)/components/invoice-templates/common/wrappable-amount";
import type { STRIPE_TEMPLATE_STYLES } from "@/app/(main)/(app)/components/invoice-templates/invoice-pdf-stripe-template";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import { getCustomColumnsInPdf } from "@/app/(main)/(app)/utils/custom-column";
import { formatAmountChunks } from "@/app/(main)/(app)/utils/format-amount";
import {
  formatCurrency,
  formatCurrencyChunks,
} from "@/app/(main)/(app)/utils/format-currency";
import { formatServicePeriodRange } from "@/app/(main)/(app)/utils/format-service-period";
import {
  getItemAmountBeforeDiscount,
  hasAnyItemDiscount,
  formatDiscountPercent,
  hasItemDiscount,
} from "@/app/(main)/(app)/utils/item-discount";
import { type InvoiceData, resolveNumberFormatLocale } from "@/app/schema";

import "dayjs/locale/de";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/uk";

export function StripeItemsTable({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const numberFormatLocale = resolveNumberFormatLocale(invoiceData);
  const t = INVOICE_PDF_TRANSLATIONS[language];
  const taxLabelText = invoiceData.taxLabelText || "VAT";

  // Set dayjs locale based on invoice language
  dayjs.locale(language);

  // Calculate service period (example: Jan 01 2025 - Jan 31 2025)
  const servicePeriod = formatServicePeriodRange(invoiceData);

  const unitFieldIsVisible = invoiceData.items[0].unitFieldIsVisible;

  // The custom columns, once each has a name or a value. The first one's switch is on by
  // default, so without that check every existing Stripe invoice would gain an empty column.
  const customColumns = getCustomColumnsInPdf(invoiceData);
  // One custom column keeps the width it always had. With more, each is wider, so a code
  // like "ACME-24" doesn't run into the next column's, and every column after the first
  // takes more of the description's width.
  const customColumnStyle =
    customColumns.length > 1
      ? [styles.colCustom, { flex: SEVERAL_CUSTOM_COLUMNS_FLEX }]
      : styles.colCustom;
  const descriptionColumnStyle =
    customColumns.length > 0
      ? [
          styles.colDescriptionWithCustom,
          {
            flex:
              styles.colDescriptionWithCustom.flex -
              (customColumns.length - 1) *
                EXTRA_CUSTOM_COLUMN_DESCRIPTION_SHARE,
          },
        ]
      : styles.colDescription;
  const vatAmountFieldIsVisible = invoiceData.items[0].vatFieldIsVisible;
  const taxColumnStyle = hasAnyItemDiscount(invoiceData.items)
    ? styles.colTaxWithDiscount
    : styles.colTax;

  return (
    <View style={[styles.table, styles.mt24]}>
      {/* Fixed Header — repeats on every page (for better layout on page breaks) */}
      <View style={styles.tableHeader} fixed>
        <View style={descriptionColumnStyle}>
          <Text style={styles.fontSize8}>{t.stripe.description}</Text>
        </View>

        {/* named by the user; the first one, unnamed, prints "Type of GTU", which it was
            before it could be named, and a later one, unnamed, prints no header */}
        {customColumns.map((column) => {
          return (
            <View key={column.position} style={customColumnStyle}>
              {/* a long name wraps inside its cell, see `hyphenateCellWord` */}
              <Text
                style={styles.fontSize8}
                hyphenationCallback={hyphenateCellWord}
                hyphenationPenalty={CELL_HYPHENATION_PENALTY}
              >
                {column.label ||
                  (column.position === 0 ? t.invoiceItemsTable.typeOfGTU : "")}
              </Text>
            </View>
          );
        })}

        <View style={styles.colQty}>
          <Text style={styles.fontSize8}>{t.stripe.qty}</Text>
        </View>

        {unitFieldIsVisible ? (
          <View style={styles.colUnit}>
            <Text style={styles.fontSize8}>{t.stripe.unit}</Text>
          </View>
        ) : null}

        <View style={styles.colUnitPrice}>
          <Text style={styles.fontSize8}>{t.stripe.unitPrice}</Text>
        </View>

        {vatAmountFieldIsVisible ? (
          <View style={taxColumnStyle}>
            <Text style={styles.fontSize8}>{taxLabelText}</Text>
          </View>
        ) : null}

        <View style={styles.colAmount}>
          <Text style={styles.fontSize8}>{t.stripe.amount}</Text>
        </View>
      </View>

      {/* Rows */}
      {invoiceData.items.map((item, index) => {
        const netPriceChunks = formatCurrencyChunks({
          amount: item.netPrice,
          currency: invoiceData.currency,
          numberFormatLocale,
        });

        const itemHasDiscount = hasItemDiscount(item);

        // Format VAT value
        const formattedVat = Number.isNaN(Number(item.vat))
          ? item.vat
          : `${Number(item.vat)}%`;

        // the row shows the line before its discount, and the discount row under it takes
        // the discount off, the way Stripe lays out a discounted line
        const preTaxAmountChunks = formatCurrencyChunks({
          amount: getItemAmountBeforeDiscount(item),
          currency: invoiceData.currency,
          numberFormatLocale,
        });

        const discountAmountChunks = formatCurrencyChunks({
          amount: -item.discountAmount,
          currency: invoiceData.currency,
          numberFormatLocale,
        });

        // with a discount, the tax applies to less than the amount on the row, so say what
        // it applies to, always on two lines: "20% (on" over "€9,990.00)". The amount keeps
        // its thousands chunks, so only an amount too wide for the column wraps further.
        const taxBaseAmountChunks =
          itemHasDiscount && typeof item.vat === "number"
            ? formatCurrencyChunks({
                amount: item.netAmount,
                currency: invoiceData.currency,
                numberFormatLocale,
              }).map((chunk, chunkIndex, chunks) => {
                return chunkIndex === chunks.length - 1 ? `${chunk})` : chunk;
              })
            : null;

        // "test discount (10% off)", "Discount (€50.00 off)"
        const discountValueText =
          item.discountType === "percentage"
            ? formatDiscountPercent({
                value: item.discountValue,
                numberFormatLocale,
              })
            : formatCurrency({
                amount: item.discountAmount,
                currency: invoiceData.currency,
                numberFormatLocale,
              });
        const discountLabel = item.discountLabel?.trim() || t.stripe.discount;
        const discountRowText = `${discountLabel} (${discountValueText} ${t.stripe.discountOff})`;

        // a hairline closes the discount row above, before the next item starts
        const isAfterDiscountRow =
          index > 0 && hasItemDiscount(invoiceData.items[index - 1]);

        // The quantity column carries no currency, and the Stripe template rounds it to
        // whole units
        const amountChunks = formatAmountChunks({
          amount: item.amount,
          numberFormatLocale,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });

        return (
          // the item and its discount row move to the next page together
          <View key={index} wrap={false} minPresenceAhead={60}>
            <View
              style={[
                styles.tableRow,
                isAfterDiscountRow ? styles.rowAfterDiscount : {},
              ]}
            >
              <View style={descriptionColumnStyle}>
                <Text style={[styles.fontSize10]}>{item.name}</Text>
                {invoiceData.servicePeriodFieldIsVisible ? (
                  <Text style={[styles.fontSize9, styles.mt4]}>
                    {servicePeriod}
                  </Text>
                ) : null}
              </View>
              {customColumns.map((column) => {
                return (
                  <View key={column.position} style={customColumnStyle}>
                    <Text
                      style={[styles.fontSize10, styles.textDark]}
                      hyphenationCallback={hyphenateCellWord}
                      hyphenationPenalty={CELL_HYPHENATION_PENALTY}
                    >
                      {column.values[index]}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.colQty}>
                <WrappableAmount
                  chunks={amountChunks}
                  style={[styles.fontSize11, styles.textDark]}
                />
              </View>
              {unitFieldIsVisible ? (
                <View style={styles.colUnit}>
                  <Text style={[styles.fontSize11, styles.textDark]}>
                    {item.unit}
                  </Text>
                </View>
              ) : null}
              <View style={styles.colUnitPrice}>
                <WrappableAmount
                  chunks={netPriceChunks}
                  style={[styles.fontSize11, styles.textDark]}
                />
              </View>
              {vatAmountFieldIsVisible ? (
                <View style={taxColumnStyle}>
                  {taxBaseAmountChunks ? (
                    <>
                      <Text style={[styles.fontSize11, styles.textDark]}>
                        {formattedVat} ({t.stripe.taxOn}
                      </Text>
                      <WrappableAmount
                        chunks={taxBaseAmountChunks}
                        style={[styles.fontSize11, styles.textDark]}
                      />
                    </>
                  ) : (
                    <Text style={[styles.fontSize11, styles.textDark]}>
                      {formattedVat}
                    </Text>
                  )}
                </View>
              ) : null}
              <View style={[styles.colAmount]}>
                <WrappableAmount
                  chunks={preTaxAmountChunks}
                  style={[
                    styles.fontSize11,
                    styles.textDark,
                    { paddingLeft: 10 },
                  ]}
                />
              </View>
            </View>

            {itemHasDiscount ? (
              <View style={[styles.tableRow, styles.discountRow]}>
                <View style={[styles.colDescription, styles.discountLabel]}>
                  <Text style={[styles.fontSize10, styles.textDark]}>
                    {discountRowText}
                  </Text>
                </View>
                <View style={styles.colAmount}>
                  <WrappableAmount
                    chunks={discountAmountChunks}
                    style={[
                      styles.fontSize11,
                      styles.textDark,
                      { paddingLeft: 10 },
                    ]}
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** The description width each custom column after the first takes from it. */
const EXTRA_CUSTOM_COLUMN_DESCRIPTION_SHARE = 0.3;

/** Each custom column's grow factor while there is more than one. */
const SEVERAL_CUSTOM_COLUMNS_FLEX = 0.7;
