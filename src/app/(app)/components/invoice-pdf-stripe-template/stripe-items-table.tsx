import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { InvoiceData } from "@/app/schema";
import { CURRENCY_SYMBOLS } from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import type { STRIPE_TEMPLATE_STYLES } from ".";

export function StripeItemsTable({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof STRIPE_TEMPLATE_STYLES;
}) {
  const language = invoiceData.language;
  const t = TRANSLATIONS[language];
  const currencySymbol = CURRENCY_SYMBOLS[invoiceData.currency];

  return (
    <View style={[styles.table, styles.mt24]}>
      {/* Table header */}
      <View style={styles.tableHeader}>
        <View style={styles.colDescription}>
          <Text style={[styles.fontSize8]}>{t.stripe.description}</Text>
        </View>
        <View style={styles.colQty}>
          <Text style={[styles.fontSize8]}>{t.stripe.qty}</Text>
        </View>
        <View style={styles.colUnitPrice}>
          <Text style={[styles.fontSize8]}>{t.stripe.unitPrice}</Text>
        </View>
        <View style={styles.colAmount}>
          <Text style={[styles.fontSize8]}>{t.stripe.amount}</Text>
        </View>
      </View>

      {/* Table rows */}
      {invoiceData.items.map((item, index) => {
        const formattedNetPrice = item.netPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 5,
        });

        const formattedPreTaxAmount = item.preTaxAmount.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );

        const formattedAmount = item.amount.toLocaleString("en-US", {
          style: "decimal",
          maximumFractionDigits: 0,
        });

        return (
          <View style={styles.tableRow} key={index}>
            <View style={styles.colDescription}>
              <Text style={[styles.fontSize11]}>{item.name}</Text>
              {/* Add service period if available */}
              <Text style={[styles.fontSize10, styles.mt4]}>
                Jan 1 – Jan 31, 2025
              </Text>
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.fontSize11, styles.textDark]}>
                {formattedAmount}
              </Text>
            </View>
            <View style={styles.colUnitPrice}>
              <Text style={[styles.fontSize11, styles.textDark]}>
                {currencySymbol}
                {formattedNetPrice}
              </Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={[styles.fontSize11, styles.textDark]}>
                {currencySymbol}
                {formattedPreTaxAmount}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
