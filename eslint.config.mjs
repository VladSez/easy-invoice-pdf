// @ts-check
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";
import youMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [".next", "playwright-output"],
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
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              // https://github.com/diegomura/react-pdf/issues/2890#issuecomment-2443831013
              name: "@react-pdf/renderer",
              message:
                "Please use @react-pdf/renderer/lib/react-pdf.browser instead. Check https://github.com/diegomura/react-pdf/issues/2890#issuecomment-2443831013 for more details.",
            },
            {
              name: "node:process",
              message: "Please use @/env.ts instead.",
            },
            {
              name: "process",
              message: "Please use @/env.ts instead.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      "react-you-might-not-need-an-effect": youMightNotNeedAnEffect,
    },
    rules: {
      "react-you-might-not-need-an-effect/you-might-not-need-an-effect": "warn",
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
