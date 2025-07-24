// @ts-check
// import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";
import youMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";
// import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
// import eslintParserTypeScript from "@typescript-eslint/parser";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});
// const compat = new FlatCompat({
//   baseDirectory: import.meta.dirname,
// });

export default tseslint.config(
  {
    ignores: [".next", "playwright-output"],
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
    files: ["src/**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ["src/**/*.{jsx,tsx}"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    rules: {
      // enable all recommended rules to report a warning
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      // enable all recommended rules to report an error
      ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,

      // or configure rules individually
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { printWidth: 100 },
      ],
    },
    settings: {
      "better-tailwindcss": {
        // tailwindcss 3: the path to the tailwind config file (eg: `tailwind.config.js`)
        // tailwindConfig: "tailwind.config.js",
        // tsconfig: "tsconfig.json",
        entryPoint: "src/globals.css",
      },
    },
  },

  // for better-tailwindcss plugin
  {
    files: ["src/**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ["src/**/*.{jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      // https://github.com/schoero/eslint-plugin-better-tailwindcss
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    rules: {
      // enable all recommended rules to report a warning
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      // enable all recommended rules to report an error
      ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,

      // or configure rules individually
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { printWidth: 100 },
      ],
      // "better-tailwindcss/enforce-consistent-class-order": "off",
    },
    settings: {
      "better-tailwindcss": {
        // tailwindcss 4: the path to the entry file of the css based tailwind config (eg: `src/global.css`)
        // entryPoint: "src/global.css",
        // tailwindcss 3: the path to the tailwind config file (eg: `tailwind.config.js`)
        // tailwindConfig: "tailwind.config.js",
        entryPoint: "src/globals.css",
      },
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
  }
);
