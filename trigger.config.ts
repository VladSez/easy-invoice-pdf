import { defineConfig } from "@trigger.dev/sdk";

// https://trigger.dev/docs/config/config-file
/** @lintignore consumed by the Trigger.dev CLI, not by app code */
export default defineConfig({
  project: "proj_fuwfkbtfwembbzndcipt",
  dirs: ["./src/trigger"],
  // Max execution time in seconds. Durable waits (wait.until) don't count towards this.
  maxDuration: 300,
});
