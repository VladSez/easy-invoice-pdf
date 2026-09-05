import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Wall-clock timezone every server-generated invoice is dated in unless the
 * caller asks for another one via the `timezone` query param.
 */
export const DEFAULT_INVOICE_TIME_ZONE = "Europe/Warsaw";

/**
 * `dayjs()` in the given IANA timezone's wall time.
 *
 * The process timezone is UTC on Vercel, so a plain `dayjs()` dates the invoice
 * a day behind Warsaw between midnight and 01:00 (02:00 during CEST), and the
 * invoice number lands in the previous month on the 1st.
 *
 * @param timeZone - IANA timezone name, already validated by {@link isValidTimeZone}.
 */
export function nowInTimeZone(timeZone: string) {
  return dayjs().tz(timeZone);
}

/**
 * Whether the runtime recognises `value` as an IANA timezone name.
 *
 * `Intl.DateTimeFormat` throws a `RangeError` on anything it cannot resolve,
 * which is the only check that stays in sync with the platform's tz database.
 */
export function isValidTimeZone(value: string): boolean {
  try {
    // constructing it *is* the check - `no-new` has no allowlist for built-ins
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
