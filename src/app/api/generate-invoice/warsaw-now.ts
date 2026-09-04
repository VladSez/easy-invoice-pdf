import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Wall-clock timezone every server-generated invoice is dated in. */
const WARSAW_TIME_ZONE = "Europe/Warsaw";

/**
 * `dayjs()` in Europe/Warsaw wall time.
 *
 * The process timezone is UTC on Vercel, so a plain `dayjs()` dates the invoice
 * a day behind Warsaw between midnight and 01:00 (02:00 during CEST), and the
 * invoice number lands in the previous month on the 1st.
 */
export function warsawNow() {
  return dayjs().tz(WARSAW_TIME_ZONE);
}
