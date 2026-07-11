import { describe, it, expect } from "vitest";
import { getNextMondayInWarsaw, getWarsawWeekday } from "../warsaw-time";

// The instants below are the actual moments the schedule fires:
// 13:00 on the 10th, Warsaw wall time.
// Warsaw is UTC+1 (CET) in winter and UTC+2 (CEST) in summer, so
// 13:00 Warsaw = 12:00 UTC in winter and 11:00 UTC in summer.
const SATURDAY_JAN_10_2026 = new Date("2026-01-10T12:00:00Z");
const SUNDAY_MAY_10_2026 = new Date("2026-05-10T11:00:00Z");
const FRIDAY_JUL_10_2026 = new Date("2026-07-10T11:00:00Z");
const MONDAY_AUG_10_2026 = new Date("2026-08-10T11:00:00Z");

describe("getWarsawWeekday", () => {
  it("returns the weekday in Warsaw time, not the process timezone", () => {
    expect(getWarsawWeekday(SATURDAY_JAN_10_2026)).toBe(6); // Saturday
    expect(getWarsawWeekday(SUNDAY_MAY_10_2026)).toBe(0); // Sunday
    expect(getWarsawWeekday(FRIDAY_JUL_10_2026)).toBe(5); // Friday
    expect(getWarsawWeekday(MONDAY_AUG_10_2026)).toBe(1); // Monday
  });

  it("uses the Warsaw calendar day around midnight boundaries", () => {
    // 23:30 UTC on Saturday Jan 10th is already 00:30 on Sunday Jan 11th in Warsaw
    expect(getWarsawWeekday(new Date("2026-01-10T23:30:00Z"))).toBe(0);
  });
});

describe("getNextMondayInWarsaw", () => {
  it("moves Saturday the 10th to Monday the 12th (winter time, UTC+1)", () => {
    expect(getNextMondayInWarsaw(SATURDAY_JAN_10_2026, 13).toISOString()).toBe(
      "2026-01-12T12:00:00.000Z",
    );
  });

  it("moves Sunday the 10th to Monday the 11th, one day later (summer time, UTC+2)", () => {
    // Regression: a plain `8 - getDay()` would jump 8 days from a Sunday,
    // landing on the following week's Monday instead of the next day.
    expect(getNextMondayInWarsaw(SUNDAY_MAY_10_2026, 13).toISOString()).toBe(
      "2026-05-11T11:00:00.000Z",
    );
  });

  it("returns the following Monday when called on a Monday", () => {
    expect(getNextMondayInWarsaw(MONDAY_AUG_10_2026, 13).toISOString()).toBe(
      "2026-08-17T11:00:00.000Z",
    );
  });

  it("handles month rollovers", () => {
    // Saturday, October 31st 2026 -> Monday, November 2nd (winter time, UTC+1)
    const saturdayOct31 = new Date("2026-10-31T12:00:00Z");
    expect(getWarsawWeekday(saturdayOct31)).toBe(6);
    expect(getNextMondayInWarsaw(saturdayOct31, 13).toISOString()).toBe(
      "2026-11-02T12:00:00.000Z",
    );
  });
});
