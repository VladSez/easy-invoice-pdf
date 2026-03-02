import type { KnipConfig } from "knip";

// https://knip.dev/reference/configuration#_top
const config: KnipConfig = {
  ignoreDependencies: [
    "shadcn",
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
    "react-scan",
    "pdfjs-dist",
  ],
  ignore: [
    "src/app/**/invoice-pdf-download-multiple-languages.tsx",
    "src/components/ui/**/*.tsx",
    "global.ts",
    "src/i18n/**/*",
    "src/app/schema/**/*",
    "src/**/dev/**/*",
    "src/app/changelog/content/**/*",
    "src/app/(app)/pdf-i18n-translations/pdf-translations.ts",
  ],
  includeEntryExports: true,
  // ignore tags
  // https://knip.dev/reference/configuration#tags
  tags: ["-@lintignore"],
};

export default config;
