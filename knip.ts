import type { KnipConfig } from "knip";

// https://knip.dev/reference/configuration#_top
const config: KnipConfig = {
  ignoreDependencies: [
    "@radix-ui/react-separator",
    "@types/ua-parser-js",
    "cmdk",
    "eslint-plugin-react-hooks",
    "file-saver",
    "jszip",
    "@next/eslint-plugin-next",
    "@types/file-saver",
    "eslint-config-next",
    "@ianvs/prettier-plugin-sort-imports",
  ],
  ignore: [
    "lint-staged.config.js",
    "src/app/components/invoice-pdf-download-multiple-languages.tsx",
    "src/components/ui/**/*.tsx",
    "global.ts",
    "messages/**/*",
    "src/i18n/**/*",
  ],
  includeEntryExports: true,
  // ignore tags
  // https://knip.dev/reference/configuration#tags
  tags: ["-@lintignore"],
};

export default config;
