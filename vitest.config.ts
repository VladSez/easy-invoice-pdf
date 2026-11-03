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
    poolOptions: {
      forks: {
        // Node 25+ enables Web Storage by default. Without `--localstorage-file`
        // its global `localStorage` is `undefined`, and it shadows happy-dom's,
        // so every DOM test that touches storage fails.
        execArgv: ["--no-experimental-webstorage"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
