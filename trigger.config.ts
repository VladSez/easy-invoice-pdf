import { defineConfig } from "@trigger.dev/sdk/v3";

/**
 * @lintignore consumed by the Trigger.dev CLI, not by app code
 */
export default defineConfig({
  project: "proj_fuwfkbtfwembbzndcipt",
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // Max execution time in seconds. Durable waits (wait.until) don't count towards this.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 300, // 300 seconds or 5 minutes
  retries: {
    enabledInDev: true,
    // Non-idempotent tasks must override with retry.maxAttempts: 1 (see monthly-recurring-invoice).
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});
