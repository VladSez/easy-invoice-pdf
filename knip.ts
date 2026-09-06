import type { KnipConfig } from "knip";

// https://knip.dev/reference/configuration#_top
const config: KnipConfig = {
  // Trigger.dev entry points (https://trigger.dev/docs/config/config-file)
  entry: [
    "trigger.config.ts",
    "src/trigger/monthly-recurring-invoice.ts",
    // spawned as a child process by e2e/server-render-pdf/server-render-pdf.test.ts
    "e2e/server-render-pdf/render-server-pdf.mjs",
  ],
  ignoreDependencies: [
    "shadcn",
    "@radix-ui/react-separator",
    "@types/ua-parser-js",
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
    "src/app/*/*/pdf-i18n-translations/pdf-translations-schema.ts",
  ],
  includeEntryExports: true,
  // ignore tags
  // https://knip.dev/reference/configuration#tags
  tags: ["-@lintignore"],
  ignoreBinaries: ["act", "zizmor", "cloudflared"],
};

export default config;
