import dayjs from "dayjs";

/** The payment term a new invoice starts with, and the fallback when none can be read. */
export const DEFAULT_PAYMENT_TERM_DAYS = 14;

interface GetPaymentTermDaysArgs {
  /** The invoice's date of issue, as `YYYY-MM-DD`. */
  dateOfIssue: string;
  /** The invoice's payment due date, as `YYYY-MM-DD`. */
  paymentDue: string | undefined;
}

/**
 * How many days after the date of issue the invoice is due ("Due 7 days after issue").
 *
 * Falls back to {@link DEFAULT_PAYMENT_TERM_DAYS} when there is no term to keep: no due
 * date, or one before the date of issue.
 */
export function getPaymentTermDays({
  dateOfIssue,
  paymentDue,
}: GetPaymentTermDaysArgs) {
  if (!paymentDue || !dateOfIssue) {
    return DEFAULT_PAYMENT_TERM_DAYS;
  }

  const days = dayjs(paymentDue).diff(dayjs(dateOfIssue), "day");

  return Number.isNaN(days) || days < 0 ? DEFAULT_PAYMENT_TERM_DAYS : days;
}

interface GetPaymentDueForTermArgs {
  /** The new date of issue, anything dayjs can parse. */
  dateOfIssue: dayjs.ConfigType;
  /** The payment term to keep, in days. */
  paymentTermDays: number;
}

/** The payment due date, as `YYYY-MM-DD`, for a date of issue and a payment term. */
export function getPaymentDueForTerm({
  dateOfIssue,
  paymentTermDays,
}: GetPaymentDueForTermArgs) {
  return dayjs(dateOfIssue).add(paymentTermDays, "days").format("YYYY-MM-DD");
}
