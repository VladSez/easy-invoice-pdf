import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatDateOfServiceEnd,
  formatServicePeriodRange,
  getServicePeriod,
  isFirstDayOfMonth,
  isServicePeriodStartInCurrentMonth,
} from "@/app/(app)/utils/format-service-period";
import type { InvoiceData } from "@/app/schema";

const baseInvoiceData = {
  dateFormat: "YYYY-MM-DD",
} as Pick<InvoiceData, "dateFormat">;

describe("format-service-period", () => {
  describe("getServicePeriod", () => {
    it("should derive start from end month when start is missing", () => {
      const { start, end } = getServicePeriod({
        dateOfService: "2025-06-20",
      });

      expect(start.format("YYYY-MM-DD")).toBe("2025-06-01");
      expect(end.format("YYYY-MM-DD")).toBe("2025-06-20");
    });

    it("should use explicit start when provided", () => {
      const { start, end } = getServicePeriod({
        dateOfServiceStart: "2025-06-14",
        dateOfService: "2025-06-20",
      });

      expect(start.format("YYYY-MM-DD")).toBe("2025-06-14");
      expect(end.format("YYYY-MM-DD")).toBe("2025-06-20");
    });
  });

  describe("formatDateOfServiceEnd", () => {
    it("should always return the formatted end date", () => {
      const result = formatDateOfServiceEnd({
        ...baseInvoiceData,
        dateOfServiceStart: "2025-06-14",
        dateOfService: "2025-06-20",
      } as InvoiceData);

      expect(result).toBe("2025-06-20");
    });
  });

  describe("isFirstDayOfMonth", () => {
    it("should return true for the first day of any month", () => {
      expect(isFirstDayOfMonth("2026-05-01")).toBe(true);
      expect(isFirstDayOfMonth("2025-12-01")).toBe(true);
    });

    it("should return false for non-first days regardless of current month", () => {
      expect(isFirstDayOfMonth("2026-05-11")).toBe(false);
      expect(isFirstDayOfMonth("2025-06-14")).toBe(false);
    });
  });

  describe("isServicePeriodStartInCurrentMonth", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true when start is the first day of the current month", () => {
      expect(isServicePeriodStartInCurrentMonth("2025-06-01")).toBe(true);
    });

    it("should return true when start is mid-month in the current month", () => {
      expect(isServicePeriodStartInCurrentMonth("2025-06-14")).toBe(true);
    });

    it("should return false when start is in a different month of the same year", () => {
      expect(isServicePeriodStartInCurrentMonth("2025-05-01")).toBe(false);
    });

    it("should return false when start is in the same month of a different year", () => {
      expect(isServicePeriodStartInCurrentMonth("2024-06-01")).toBe(false);
    });
  });

  describe("formatServicePeriodRange", () => {
    it("should always show start and end separated by an en dash", () => {
      const result = formatServicePeriodRange({
        ...baseInvoiceData,
        dateOfServiceStart: "2025-06-14",
        dateOfService: "2025-06-20",
      } as InvoiceData);

      expect(result).toBe("2025-06-14 – 2025-06-20");
    });
  });
});
