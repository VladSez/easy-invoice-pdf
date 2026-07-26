export const WARSAW_TIME_ZONE = "Europe/Warsaw";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Returns the day of the week (0 = Sunday, 6 = Saturday) for the given instant
 * in the Europe/Warsaw timezone. `Date.prototype.getDay` can't be used here,
 * because it uses the process timezone (UTC on Trigger.dev workers).
 */
export function getWarsawWeekday(date: Date): number {
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: WARSAW_TIME_ZONE,
    weekday: "long",
  }).format(date);

  return WEEKDAY_NAMES.indexOf(weekdayName as (typeof WEEKDAY_NAMES)[number]);
}

/**
 * Returns the UTC instant of the next Monday (strictly after the given
 * instant's Warsaw calendar day) at the given hour, Warsaw wall time.
 * From a Monday this returns the *following* Monday.
 */
export function getNextMondayInWarsaw(date: Date, hour: number): Date {
  const weekday = getWarsawWeekday(date);
  // Never 0: Sunday -> 1 day, Saturday -> 2 days, Monday -> 7 days.
  const daysUntilMonday = (8 - weekday) % 7 || 7;

  const { year, month, day } = getWarsawDateParts(date);

  // Date.UTC normalizes day overflow, so month/year rollovers are handled.
  return warsawWallTimeToUtc({
    year,
    month,
    day: day + daysUntilMonday,
    hour,
  });
}

function getWarsawDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WARSAW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
}

/**
 * Converts a Warsaw wall-clock time to the corresponding UTC instant.
 * A single offset correction is exact here because European DST transitions
 * happen around 2-3am on the last Sunday of March/October, never within a
 * couple of hours of the daytime targets this module produces.
 */
function warsawWallTimeToUtc({
  year,
  month,
  day,
  hour,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
}): Date {
  // First interpret the wall time as if it were UTC...
  const utcGuess = Date.UTC(year, month - 1, day, hour, 0, 0, 0);
  // ...then correct by Warsaw's UTC offset at that moment.
  const offsetMs = getWarsawOffsetMs(new Date(utcGuess));

  return new Date(utcGuess - offsetMs);
}

function getWarsawOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WARSAW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const asUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    // Intl can format midnight as "24" with hour12: false
    getPart("hour") % 24,
    getPart("minute"),
    getPart("second"),
  );

  return asUtc - date.getTime();
}
