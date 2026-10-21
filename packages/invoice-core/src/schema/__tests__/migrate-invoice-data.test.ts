import { describe, expect, it, vi } from "vitest";

import { INVOICE_SCHEMA_VERSION } from "..";
import {
  INVOICE_MIGRATION_STEPS,
  migrateInvoiceData,
} from "../migrate-invoice-data";

const STORED = { language: "en", seller: { name: "Seller Ltd" } };

describe("migrateInvoiceData", () => {
  it("returns an invoice at the current version unchanged", () => {
    expect(INVOICE_SCHEMA_VERSION).toBe(1);

    const result = migrateInvoiceData({ data: STORED, fromVersion: 1 });

    expect(result).toEqual({ success: true, data: STORED, version: 1 });
  });

  it("has a step for every version below the current one", () => {
    for (let version = 1; version < INVOICE_SCHEMA_VERSION; version += 1) {
      expect(INVOICE_MIGRATION_STEPS[version]).toBeTypeOf("function");
    }
  });

  it("runs each step in order up to the target version", () => {
    const steps = {
      0: (data: unknown) => {
        // version 0 kept the seller name in a flat field
        const { sellerName, ...rest } = data as { sellerName: string };

        return { ...rest, seller: { name: sellerName } };
      },
      1: (data: unknown) => {
        return { ...(data as object), language: "en" };
      },
    };

    const result = migrateInvoiceData({
      data: { sellerName: "Seller Ltd" },
      fromVersion: 0,
      toVersion: 2,
      steps,
    });

    expect(result).toEqual({
      success: true,
      data: { seller: { name: "Seller Ltd" }, language: "en" },
      version: 2,
    });
  });

  it("stamps the version reached by a single step", () => {
    const result = migrateInvoiceData({
      data: { old: true },
      fromVersion: 0,
      steps: {
        0: () => {
          return STORED;
        },
      },
    });

    expect(result).toEqual({ success: true, data: STORED, version: 1 });
  });

  it("rejects an invoice saved by a newer version", () => {
    const result = migrateInvoiceData({ data: STORED, fromVersion: 2 });

    expect(result).toMatchObject({ success: false, error: "future_version" });
  });

  it.each([-1, 1.5, Number.NaN])(
    "rejects the invalid version %s",
    (fromVersion) => {
      expect(migrateInvoiceData({ data: STORED, fromVersion })).toMatchObject({
        success: false,
        error: "invalid_version",
      });
    },
  );

  it("reports a missing step instead of skipping it", () => {
    const result = migrateInvoiceData({
      data: STORED,
      fromVersion: 0,
      steps: {},
    });

    expect(result).toMatchObject({ success: false, error: "missing_step" });
  });

  it("reports a step that throws, without throwing itself", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const result = migrateInvoiceData({
      data: STORED,
      fromVersion: 0,
      steps: {
        0: () => {
          throw new Error("bad shape");
        },
      },
    });

    expect(result).toMatchObject({ success: false, error: "step_failed" });
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
