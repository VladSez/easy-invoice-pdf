import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

import type { STRIPE_TEMPLATE_STYLES } from ".";
import { formatAmountChunks } from "../../format/format-amount";
import {
  formatCurrency,
  formatCurrencyChunks,
} from "../../format/format-currency";
import { formatServicePeriodRange } from "../../format/format-service-period";
import {
  formatDiscountPercent,
  getItemAmountBeforeDiscount,
  hasAnyItemDiscount,
  hasItemDiscount,
} from "../../format/item-discount";
import { INVOICE_PDF_TRANSLATIONS } from "../../pdf-translations/pdf-translations";
import { type InvoiceData, resolveNumberFormatLocale } from "../../schema";
import { WrappableAmount } from "../common/wrappable-amount";

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

  // Calculate service period (example: Jan 01 2025 - Jan 31 2025)
  const servicePeriod = formatServicePeriodRange(invoiceData);

  const unitFieldIsVisible = invoiceData.items[0].unitFieldIsVisible;
  const vatAmountFieldIsVisible = invoiceData.items[0].vatFieldIsVisible;
  const taxColumnStyle = hasAnyItemDiscount(invoiceData.items)
    ? styles.colTaxWithDiscount
    : styles.colTax;

  return (
    <View style={[styles.table, styles.mt24]}>
      {/* Fixed Header — repeats on every page (for better layout on page breaks) */}
      <View style={styles.tableHeader} fixed>
        <View style={styles.colDescription}>
          <Text style={styles.fontSize8}>{t.stripe.description}</Text>
        </View>

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
              <View style={styles.colDescription}>
                <Text style={[styles.fontSize10]}>{item.name}</Text>
                {invoiceData.servicePeriodFieldIsVisible ? (
                  <Text style={[styles.fontSize9, styles.mt4]}>
                    {servicePeriod}
                  </Text>
                ) : null}
              </View>
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
