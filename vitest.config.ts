import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    dir: "./src",
    exclude: ["**/e2e/**"],
    silent: true, // suppress console.log output in test output
    env: {
      // Unit tests have no `.env` file, so `src/env.ts` would throw on the
      // real variables.
      SKIP_ENV_VALIDATION: "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
