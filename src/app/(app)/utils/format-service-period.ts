import type { InvoiceData } from "@/app/schema";
import dayjs from "dayjs";

interface ServicePeriod {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

/**
 * Get service period (start and end Dayjs objects) from invoice data.
 * If dateOfServiceStart is missing, start set to first day of end's month.
 * @param invoiceData - Contains dateOfService and optional dateOfServiceStart.
 * @returns ServicePeriod with Dayjs start and end.
 */
export function getServicePeriod(invoiceData: {
  dateOfService: string;
  dateOfServiceStart?: string;
}): ServicePeriod {
  const end = dayjs(invoiceData.dateOfService);
  const start = dayjs(
    invoiceData.dateOfServiceStart ?? end.startOf("month").format("YYYY-MM-DD"),
  );

  return { start, end };
}

/**
 * Format service period end date using invoice's date format.
 * @param invoiceData - Invoice containing dateFormat and dateOfService.
 * @returns Formatted end date string.
 */
export function formatDateOfServiceEnd(invoiceData: InvoiceData): string {
  const { end } = getServicePeriod(invoiceData);

  return end.format(invoiceData.dateFormat);
}

/**
 * Check if given dateOfServiceStart is first day of current month.
 * @param dateOfServiceStart - ISO date string.
 * @returns True if is first day of current month.
 */
export function isServicePeriodStartFirstDayOfCurrentMonth(
  dateOfServiceStart: string,
): boolean {
  return dayjs(dateOfServiceStart).isSame(dayjs().startOf("month"), "day");
}

/**
 * Check if given dateOfServiceStart is in the current calendar month.
 * @param dateOfServiceStart - ISO date string.
 * @returns True if date is in the current month and year.
 */
export function isServicePeriodStartInCurrentMonth(
  dateOfServiceStart: string,
): boolean {
  return dayjs(dateOfServiceStart).isSame(dayjs(), "month");
}

/**
 * Determine if service period should be shown (not first day of month).
 * @param invoiceData - Invoice containing service period fields.
 * @returns True if start is not first day of its month.
 */
export function shouldShowServicePeriodLine(invoiceData: InvoiceData): boolean {
  const { start } = getServicePeriod(invoiceData);

  return !start.isSame(start.startOf("month"), "day");
}

/**
 * Check if service period field should show in default PDF.
 * @param invoiceData - Invoice containing servicePeriodFieldIsVisible field.
 * @returns True if service period field is visible.
 */
export function shouldShowServicePeriodInDefaultPdf(
  invoiceData: InvoiceData,
): boolean {
  return invoiceData.servicePeriodFieldIsVisible;
}

/**
 * Format start and end of service period as range using invoice's date format.
 * @param invoiceData - Invoice containing dateFormat and service period dates.
 * @returns Range string: 'start – end', formatted.
 */
export function formatServicePeriodRange(
  invoiceData: InvoiceData,
): `${string} – ${string}` {
  const { start, end } = getServicePeriod(invoiceData);

  return `${start.format(invoiceData.dateFormat)} – ${end.format(invoiceData.dateFormat)}`;
}

/**
 * Check if given start/end span full current month.
 * @param dateOfServiceStart - ISO start date string.
 * @param dateOfService - ISO end date string.
 * @returns True if range is entire current month.
 */
export function isCurrentFullMonthServicePeriod(
  dateOfServiceStart: string,
  dateOfService: string,
): boolean {
  const now = dayjs();

  return (
    dayjs(dateOfServiceStart).isSame(now.startOf("month"), "day") &&
    dayjs(dateOfService).isSame(now.endOf("month"), "day")
  );
}
