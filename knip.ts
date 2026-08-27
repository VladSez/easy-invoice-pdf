import type { KnipConfig } from "knip";

// https://knip.dev/reference/configuration#_top
const config: KnipConfig = {
  // Trigger.dev entry points (https://trigger.dev/docs/config/config-file)
  entry: ["trigger.config.ts", "src/trigger/monthly-recurring-invoice.ts"],
  ignoreDependencies: [
    "shadcn",
    "@radix-ui/react-separator",
    "@types/ua-parser-js",
    "file-saver",
    "jszip",
    "@types/file-saver",
    // loaded by oxlint through `jsPlugins` in .oxlintrc.json, never imported
    "eslint-plugin-playwright",
    "eslint-plugin-react",
    "eslint-plugin-react-you-might-not-need-an-effect",
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
    "src/app/changelog/content/**/*",
    "src/app/(app)/pdf-i18n-translations/pdf-translations.ts",
  ],
  includeEntryExports: true,
  // ignore tags
  // https://knip.dev/reference/configuration#tags
  tags: ["-@lintignore"],
  ignoreBinaries: ["act", "zizmor", "printf", "cloudflared"],
};

export default config;
