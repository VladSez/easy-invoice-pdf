/** @type {import('prettier').Config} */
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig*/

const config = {
  trailingComma: "all",
  singleQuote: false,
  semi: true,
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "lf",
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};

module.exports = config;
