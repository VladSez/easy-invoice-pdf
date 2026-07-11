import { logger, schedules, wait } from "@trigger.dev/sdk";

import {
  getNextMondayInWarsaw,
  getWarsawWeekday,
  WARSAW_TIME_ZONE,
} from "./warsaw-time";

const INVOICE_API_URL = "https://easyinvoicepdf.com/api/generate-invoice";

// Hour of the day (Warsaw wall time) at which the invoice is generated.
const INVOICE_GENERATION_HOUR = 13;

/**
 * Generates the monthly recurring invoice on the 10th of every month
 * (or the next Monday when the 10th falls on a weekend) by calling
 * the /api/generate-invoice endpoint.
 *
 * Replaces the old .github/workflows/monthly-recurring-invoice.yml workflow.
 *
 * @lintignore consumed by the Trigger.dev CLI, not by app code
 */
export const monthlyRecurringInvoice = schedules.task({
  id: "monthly-recurring-invoice",
  cron: {
    // 13:00 on the 10th of every month, Warsaw wall time (DST-adjusted automatically)
    pattern: `0 ${INVOICE_GENERATION_HOUR} 10 * *`,
    timezone: WARSAW_TIME_ZONE,
    environments: ["PRODUCTION"],
  },
  run: async (payload) => {
    const weekday = getWarsawWeekday(payload.timestamp);

    // If the 10th falls on a weekend, invoice on the next Monday instead:
    // Saturday the 10th -> Monday the 12th, Sunday the 10th -> Monday the 11th.
    if (weekday === 0 || weekday === 6) {
      const nextMonday = getNextMondayInWarsaw(
        payload.timestamp,
        INVOICE_GENERATION_HOUR,
      );

      logger.log(
        "The 10th falls on a weekend, waiting until Monday to generate the invoice",
        { scheduledAt: payload.timestamp, resumeAt: nextMonday },
      );

      await wait.until({ date: nextMonday });
    }

    return await generateInvoice();
  },
});

async function generateInvoice() {
  const authToken = process.env.INVOICE_AUTH_TOKEN;

  if (!authToken) {
    throw new Error("INVOICE_AUTH_TOKEN environment variable is not set");
  }

  logger.log(`Generating monthly recurring invoice: GET ${INVOICE_API_URL}`);

  const response = await fetch(INVOICE_API_URL, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    signal: AbortSignal.timeout(60_000),
  });

  const body = await response.text();

  // Throw on failure so the run is marked as failed and Trigger.dev alerts fire.
  if (!response.ok) {
    throw new Error(`Invoice generation failed (${response.status}): ${body}`);
  }

  logger.log("Invoice generated successfully", { body });

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}
