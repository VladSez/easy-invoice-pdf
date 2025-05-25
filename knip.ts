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
    "react-email",
  ],
  ignore: [
    "lint-staged.config.js",
    "src/app/**/invoice-pdf-download-multiple-languages.tsx",
    "src/components/ui/**/*.tsx",
    "global.ts",
    "i18n-messages/**/*",
    "src/i18n/**/*",
    "src/app/schema/**/*",
  ],
  includeEntryExports: true,
  // ignore tags
  // https://knip.dev/reference/configuration#tags
  tags: ["-@lintignore"],
};

export default config;
