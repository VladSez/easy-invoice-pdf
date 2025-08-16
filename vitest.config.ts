import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    dir: "./src",
    exclude: ["**/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
