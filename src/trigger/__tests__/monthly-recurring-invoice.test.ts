import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const TEST_AUTH_TOKEN = "test-auth-token";

interface ScheduledTaskPayload {
  timestamp: Date;
  lastTimestamp?: Date;
  timezone: string;
  scheduleId: string;
  externalId?: string;
  upcoming: Date[];
}

const mockLoggerLog = vi.fn();
const mockWaitUntil = vi.fn();

type TaskRun = (payload: ScheduledTaskPayload) => Promise<unknown>;

type TaskConfig = {
  run: TaskRun;
  retry?: { maxAttempts: number };
};

let runMonthlyRecurringInvoice: TaskRun | undefined;
let monthlyRecurringInvoiceRetry: TaskConfig["retry"];

vi.mock("@trigger.dev/sdk", () => {
  return {
    logger: {
      log: (...args: unknown[]) => {
        return mockLoggerLog(...args) as void;
      },
    },
    wait: {
      until: (...args: unknown[]) => {
        return mockWaitUntil(...args) as void;
      },
    },
    schedules: {
      task: (config: TaskConfig) => {
        runMonthlyRecurringInvoice = config.run;
        monthlyRecurringInvoiceRetry = config.retry;
        return { id: "monthly-recurring-invoice" };
      },
    },
  };
});

// Saturday/Sunday on the 10th, Warsaw wall time (weekday checks only; hour matches warsaw-time.test.ts payloads).
const SATURDAY_JAN_10_2026 = new Date("2026-01-10T12:00:00Z");
const SUNDAY_MAY_10_2026 = new Date("2026-05-10T11:00:00Z");
const FRIDAY_JUL_10_2026 = new Date("2026-07-10T11:00:00Z");

// Resume-at instants: 13:00 Warsaw on the following Monday (matches INVOICE_GENERATION_HOUR).
const MONDAY_JAN_12_2026_13_WARSAW = new Date("2026-01-12T12:00:00.000Z");
const MONDAY_MAY_11_2026_13_WARSAW = new Date("2026-05-11T11:00:00.000Z");

function createPayload(timestamp: Date): ScheduledTaskPayload {
  return {
    timestamp,
    lastTimestamp: undefined,
    timezone: "Europe/Warsaw",
    scheduleId: "sched_test",
    externalId: undefined,
    upcoming: [],
  };
}

function mockFetchResponse({
  ok,
  status,
  body,
}: {
  ok: boolean;
  status: number;
  body: string;
}) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => {
      return Promise.resolve(body);
    },
  });
}

describe("monthlyRecurringInvoice", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.AUTH_TOKEN = TEST_AUTH_TOKEN;
    mockWaitUntil.mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      mockFetchResponse({ ok: true, status: 200, body: "{}" }),
    );

    vi.resetModules();
    await import("../monthly-recurring-invoice");
  });

  afterEach(() => {
    delete process.env.AUTH_TOKEN;
    vi.unstubAllGlobals();
  });

  it("does not inherit default retries because invoice generation is not idempotent", () => {
    expect(monthlyRecurringInvoiceRetry).toEqual({ maxAttempts: 1 });
  });

  it("generates the invoice immediately on a weekday without waiting", async () => {
    const invoiceResult = { invoiceId: "inv-123" };
    vi.stubGlobal(
      "fetch",
      mockFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify(invoiceResult),
      }),
    );

    const result = await runMonthlyRecurringInvoice!(
      createPayload(FRIDAY_JUL_10_2026),
    );

    expect(mockWaitUntil).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/generate-invoice",
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
        },
      }),
    );
    expect(result).toEqual(invoiceResult);
  });

  it("waits until Monday when the 10th falls on a Saturday", async () => {
    await runMonthlyRecurringInvoice!(createPayload(SATURDAY_JAN_10_2026));

    expect(mockWaitUntil).toHaveBeenCalledWith({
      date: MONDAY_JAN_12_2026_13_WARSAW,
    });
    expect(mockLoggerLog).toHaveBeenCalledWith(
      "The 10th falls on a weekend, waiting until Monday to generate the invoice",
      {
        scheduledAt: SATURDAY_JAN_10_2026,
        resumeAt: MONDAY_JAN_12_2026_13_WARSAW,
      },
    );
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("waits until Monday when the 10th falls on a Sunday", async () => {
    await runMonthlyRecurringInvoice!(createPayload(SUNDAY_MAY_10_2026));

    expect(mockWaitUntil).toHaveBeenCalledWith({
      date: MONDAY_MAY_11_2026_13_WARSAW,
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("throws when invoice generation fails so the run is marked as failed", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse({
        ok: false,
        status: 502,
        body: "Bad gateway from upstream",
      }),
    );

    await expect(
      runMonthlyRecurringInvoice!(createPayload(FRIDAY_JUL_10_2026)),
    ).rejects.toThrow(
      "Invoice generation failed (502): Bad gateway from upstream",
    );
  });

  it("returns the raw response body when it is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse({
        ok: true,
        status: 200,
        body: "ok",
      }),
    );

    const result = await runMonthlyRecurringInvoice!(
      createPayload(FRIDAY_JUL_10_2026),
    );

    expect(result).toBe("ok");
  });
});
