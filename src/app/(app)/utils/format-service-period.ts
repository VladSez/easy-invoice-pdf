import dayjs from "dayjs";

import type { InvoiceData } from "@/app/schema";

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
 * Current month and year in the `MM-YYYY` shape invoice numbers use (e.g. `04-2025`).
 * Computed on call rather than at module load, so a long-lived tab (and a test with
 * mocked timers) sees the month it is actually in.
 * @returns The current month and year, `MM-YYYY`.
 */
export function getCurrentMonthAndYear(): string {
  return dayjs().format("MM-YYYY");
}
