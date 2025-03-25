// @ts-check
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [".next"],
  },
  // next config
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
    },
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
  // Playwright config for e2e tests only
  {
    ...playwright.configs["flat/recommended"],
    files: ["e2e/**"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      // Customize Playwright rules
      // ...
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  }
);
