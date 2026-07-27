import { logger, schedules, wait } from "@trigger.dev/sdk";

import {
  getNextMondayInWarsaw,
  getWarsawWeekday,
  WARSAW_TIME_ZONE,
} from "./warsaw-time";

const APP_URL = process.env.APP_URL ?? `http://localhost:3000`;

const INVOICE_API_URL = `${APP_URL}/api/generate-invoice` as const;

// Hour of the day (Warsaw wall time) at which the invoice is generated.
const INVOICE_GENERATION_HOUR = 15;

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
  // Invoice generation sends email/Drive side effects without idempotency guards.
  // Do not inherit trigger.config default retries until that flow is safe to repeat.
  retry: {
    maxAttempts: 1,
  },
  cron: {
    // 15:00 on the 10th of every month, Warsaw wall time (DST-adjusted automatically)
    pattern: `0 ${INVOICE_GENERATION_HOUR} 27 * *`, // IMPORTANT: we use the 27th only for TESTING. RETURN BACK TO 10TH AFTER TESTING!!!
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
  if (!process.env.AUTH_TOKEN) {
    throw new Error("AUTH_TOKEN is not set");
  }

  logger.log(`Generating monthly recurring invoice: GET ${INVOICE_API_URL}`);

  const response = await fetch(INVOICE_API_URL, {
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
    },
    signal: AbortSignal.timeout(60_000),
  });

  const body = await response.text();

  // Throw on failure so the run is marked as failed and Trigger.dev alerts fire.
  if (!response.ok) {
    throw new Error(
      `Invoice generation failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  logger.log("Invoice generated successfully", {
    body: JSON.stringify(body, null, 2),
  });

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}
