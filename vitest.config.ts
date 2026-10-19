import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    // `src/` is the app; `packages/*/src` holds the workspace packages (invoice-core).
    include: ["src/**/*.test.{ts,tsx}", "packages/*/src/**/*.test.{ts,tsx}"],
    exclude: ["**/e2e/**"],
    silent: true, // suppress console.log output in test output
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
