import { Image, Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import { type InvoiceData } from "@/app/schema";
import dayjs from "dayjs";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import {
  formatDateOfServiceEnd,
  formatServicePeriodRange,
} from "@/app/(app)/utils/format-service-period";
import type { PDF_DEFAULT_TEMPLATE_STYLES } from ".";

function HeaderDates({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const t = INVOICE_PDF_TRANSLATIONS[invoiceData.language];

  const dateOfIssue = dayjs(invoiceData.dateOfIssue).format(
    invoiceData.dateFormat,
  );
  const dateOfServiceEnd = formatDateOfServiceEnd(invoiceData);
  const servicePeriodRange = formatServicePeriodRange(invoiceData);

  const showServicePeriod = invoiceData?.servicePeriodFieldIsVisible;

  const showDateOfService = invoiceData?.dateOfServiceFieldIsVisible;

  const servicePeriodLabel =
    invoiceData.servicePeriodLabelText ?? t.servicePeriod;
  const dateOfServiceLabel =
    invoiceData.dateOfServiceLabelText ?? t.dateOfService;

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <Text style={styles.fontSize7}>
        {t.dateOfIssue}:{" "}
        <Text style={[styles.fontBold, styles.fontSize8]}>{dateOfIssue}</Text>
      </Text>
      {showServicePeriod ? (
        <Text style={styles.fontSize7}>
          {servicePeriodLabel}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {servicePeriodRange}
          </Text>
        </Text>
      ) : null}
      {showDateOfService ? (
        <Text style={styles.fontSize7}>
          {dateOfServiceLabel}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {dateOfServiceEnd}
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Invoice number, date of issue and date of service fields on top of the invoice
 */
export function InvoiceHeader({
  invoiceData,
  styles,
}: {
  invoiceData: InvoiceData;
  styles: typeof PDF_DEFAULT_TEMPLATE_STYLES;
}) {
  const invoiceNumberLabel = invoiceData?.invoiceNumberObject?.label;

  const invoiceNumberValue = invoiceData?.invoiceNumberObject?.value;

  const invoiceNumber = `${invoiceNumberLabel} ${invoiceNumberValue}`;

  const hasLogo = invoiceData.logo && invoiceData.logo.length > 0;

  return (
    <View style={{ marginBottom: 7 }}>
      {/* Logo + Dates row */}
      {hasLogo ? (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 15,
          }}
        >
          <View style={{ alignItems: "flex-start" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={invoiceData.logo}
              style={{
                maxWidth: 110,
                maxHeight: 40,
                objectFit: "contain",
              }}
            />
          </View>
          <HeaderDates invoiceData={invoiceData} styles={styles} />
        </View>
      ) : null}

      {/* Invoice number + Dates (when no logo) row */}
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View>
          <Text style={[styles.header]}>{invoiceNumber}</Text>

          {invoiceData?.invoiceType && invoiceData.invoiceTypeFieldIsVisible ? (
            <Text
              style={[styles.fontBold, styles.fontSize8, { maxWidth: "250px" }]}
            >
              {invoiceData?.invoiceType}
            </Text>
          ) : null}
        </View>
        {!hasLogo ? (
          <HeaderDates invoiceData={invoiceData} styles={styles} />
        ) : null}
      </View>
    </View>
  );
}
