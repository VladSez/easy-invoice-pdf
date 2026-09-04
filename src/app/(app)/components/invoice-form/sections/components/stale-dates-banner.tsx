import dayjs from "dayjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";

import { formatDateWithLocale } from "@/app/(app)/utils/format-date-with-locale";
import {
  getCurrentMonthAndYear,
  isServicePeriodStartInCurrentMonth,
} from "@/app/(app)/utils/format-service-period";
import type { InvoiceData, SupportedLanguages } from "@/app/schema";
import { Button } from "@/components/ui/button";

interface StaleDatesBannerProps {
  dateOfIssue: string;
  dateOfService: string;
  dateOfServiceStart: string;
  invoiceNumberValue: string;
  paymentDue: string;
  selectedDateFormat: string;
  /** Invoice PDF language — the dates in the banner are formatted in it. */
  language: SupportedLanguages;
  setValue: UseFormSetValue<InvoiceData>;
  isMobile: boolean;
}

interface StaleItem {
  label: string;
  oldValue: string;
  newValue: string;
  hint: string;
}

/**
 * Displays a helper (banner) component that detects and allows updating stale invoice dates.
 *
 * This component checks if the invoice dates (date of issue, service period start/end,
 * payment due) and invoice number are outdated compared to the current date. If any are stale,
 * it displays a banner with a table showing the old vs new values and provides a button to update all dates at once.
 *
 * Dates are rendered in the invoice PDF's language, so the preview of the change
 * matches what the generated PDF will say.
 */
export function StaleDatesBanner({
  dateOfIssue,
  dateOfService,
  dateOfServiceStart,
  invoiceNumberValue,
  paymentDue,
  selectedDateFormat,
  language,
  setValue,
  isMobile,
}: StaleDatesBannerProps) {
  const formatDate = (date: dayjs.ConfigType) => {
    return formatDateWithLocale({ date, selectedDateFormat, language });
  };

  const isDateOfIssueStale = !dayjs(dateOfIssue).isSame(dayjs(), "day");
  const isDateOfServiceStale = !dayjs(dateOfService).isSame(
    dayjs().endOf("month"),
    "day",
  );
  const isDateOfServiceStartStale =
    !!dateOfServiceStart &&
    !isServicePeriodStartInCurrentMonth(dateOfServiceStart);
  const currentMonthAndYear = getCurrentMonthAndYear();
  const extractedMonthYear = /(\d{2}-\d{4})/.exec(invoiceNumberValue)?.[1];
  const isInvoiceNumberStale = extractedMonthYear !== currentMonthAndYear;

  /**
   * Checks if the payment due date is stale (outdated).
   * A payment due date is considered stale if:
   * - It's not set (empty/undefined), OR
   * - It doesn't match the expected date (14 days after the date of issue)
   */
  const isPaymentDueStale =
    !paymentDue ||
    !dayjs(paymentDue).isSame(dayjs(dateOfIssue).add(14, "days"), "day");

  const targetToday = formatDate(dayjs());
  const targetEndOfMonth = formatDate(dayjs().endOf("month"));
  const targetStartOfMonth = formatDate(dayjs().startOf("month"));
  const targetPaymentDue = formatDate(dayjs().add(14, "days"));

  const targetInvoiceNumber = `1/${currentMonthAndYear}`;

  const fallbackValue = "(not set)";

  /**
   * Array of items to check for staleness, in the order they are listed in the
   * banner. That order mirrors the form itself — invoice number, date of issue,
   * service period start, service period end, payment due — so scanning the
   * banner and scanning the fields walk the invoice the same way, and the
   * service period reads as a range rather than backwards.
   *
   * Each item is either false (not stale) or an object containing:
   * - label: Display name of the field
   * - oldValue: Current/outdated value
   * - newValue: Suggested updated value
   * - hint: Description of what the new value represents
   */
  const ITEMS: (boolean | StaleItem)[] = [
    isInvoiceNumberStale && {
      label: "Invoice number",
      oldValue: invoiceNumberValue ? invoiceNumberValue : fallbackValue,
      newValue: targetInvoiceNumber,
      hint: "current month",
    },
    isDateOfIssueStale && {
      label: "Date of issue",
      oldValue: dateOfIssue ? formatDate(dateOfIssue) : fallbackValue,
      newValue: targetToday,
      hint: "today",
    },
    isDateOfServiceStartStale && {
      label: "Service period start",
      oldValue: dateOfServiceStart
        ? formatDate(dateOfServiceStart)
        : fallbackValue,
      newValue: targetStartOfMonth,
      hint: "start of current month",
    },
    isDateOfServiceStale && {
      label: "Service period end",
      oldValue: dateOfService ? formatDate(dateOfService) : fallbackValue,
      newValue: targetEndOfMonth,
      hint: "end of current month",
    },
    isPaymentDueStale && {
      label: "Payment due",
      oldValue: paymentDue ? formatDate(paymentDue) : fallbackValue,
      newValue: targetPaymentDue,
      hint: "date of issue + 14 days",
    },
  ];

  const staleItems = ITEMS.filter(Boolean) as StaleItem[];

  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50/90 px-3 py-4 shadow-sm shadow-amber-200/50 duration-300 animate-in fade-in slide-in-from-bottom-2"
      role="region"
      aria-live="polite"
      data-testid="out-of-date-dates-helper"
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-amber-800">
        <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
        <span>
          {staleItems.length}{" "}
          {staleItems.length === 1 ? "field is" : "fields are"} out of date
        </span>
      </div>

      <table className="w-full border-collapse overflow-hidden rounded border border-amber-300 text-xs">
        <thead>
          <tr className="border-b border-amber-300 bg-amber-100/60 text-left text-amber-800">
            <th className="w-[65px] max-w-[65px] px-2.5 py-1.5 font-semibold">
              Field
            </th>
            <th className="px-2.5 py-1.5 font-semibold">Change</th>
          </tr>
        </thead>

        <tbody>
          {staleItems.map((item) => {
            return (
              <tr
                key={item.label}
                className="border-b border-amber-300 last:border-b-0"
              >
                <td className="w-[65px] max-w-[65px] px-2.5 py-1.5 text-amber-800">
                  {item.label}
                </td>

                <td className="text-pretty px-2.5 py-1.5 pr-0">
                  <span className="bg-red-100 text-amber-800 line-through decoration-amber-700/50">
                    {item.oldValue}
                  </span>
                  <span className="mx-1 text-amber-700">→</span>
                  <span className="bg-green-200 font-semibold text-green-800">
                    {item.newValue}
                  </span>
                  {item.hint ? (
                    <span className="ml-1 font-normal text-green-700">
                      ({item.hint})
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Button
        type="button"
        size="sm"
        className="mt-3.5 gap-1.5 bg-amber-600 text-white shadow-sm hover:bg-amber-600/95"
        onClick={() => {
          const today = dayjs().format("YYYY-MM-DD");

          const firstDayOfCurrentMonth = dayjs()
            .startOf("month")
            .format("YYYY-MM-DD");
          const lastDayOfCurrentMonth = dayjs()
            .endOf("month")
            .format("YYYY-MM-DD");

          setValue("dateOfServiceStart", firstDayOfCurrentMonth);
          setValue("dateOfService", lastDayOfCurrentMonth);
          setValue("dateOfIssue", today);
          setValue("invoiceNumberObject.value", targetInvoiceNumber);

          const newPaymentDue = dayjs(today)
            .add(14, "days")
            .format("YYYY-MM-DD");

          setValue("paymentDue", newPaymentDue);

          toast.success("All dates updated successfully", {
            position: isMobile ? "top-center" : "bottom-right",
          });
        }}
      >
        <RefreshCw className="size-3.5" />
        Update All Dates
      </Button>
    </div>
  );
}
