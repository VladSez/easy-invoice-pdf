import type { KnipConfig } from "knip";

// https://knip.dev/reference/configuration#_top
const config: KnipConfig = {
  workspaces: {
    ".": {
      // Trigger.dev entry points (https://trigger.dev/docs/config/config-file)
      entry: [
        "trigger.config.ts",
        "src/trigger/monthly-recurring-invoice.ts",
        // spawned as a child process by e2e/server-render-pdf/server-render-pdf.test.ts
        "e2e/server-render-pdf/render-server-pdf.mjs",
      ],
    },
    // Entries come from the package's `exports` field.
    "packages/invoice-core": {
      // The package's exports are its public API, and some are only used by the
      // private backend repo, so unused entry exports are expected here.
      includeEntryExports: false,
    },
  },
  ignoreDependencies: [
    "shadcn",
    "@radix-ui/react-separator",
    "file-saver",
    "jszip",
    "@types/file-saver",
    // knip's react-email plugin assumes `email dev` needs this package on react-email
    // < 6, but 4.x bundles its preview server and has no @react-email/* dependency.
    "@react-email/preview-server",
    // Sentry resolves these directly when instrumenting Next.js in development.
    "import-in-the-middle",
    "require-in-the-middle",
  ],
  ignore: [
    "src/app/**/invoice-pdf-download-multiple-languages.tsx",
    "src/components/ui/**/*.tsx",
    "global.ts",
    "src/i18n/**/*",
    "src/app/schema/**/*",
    // `*` instead of the literal route-group names: parentheses are glob syntax
    // loaded with a dynamic `import(\`./content/${filename}\`)` in changelog/utils.ts
    "src/app/*/changelog/content/**/*",
  ],
  includeEntryExports: true,
  // ignore tags
  // https://knip.dev/reference/configuration#tags
  tags: ["-@lintignore"],
  ignoreBinaries: ["act", "zizmor", "cloudflared"],
};

export default config;
