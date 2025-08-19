module.exports = {
  // Run type-check on all changes to files
  // https://github.com/okonet/lint-staged
  "*": () => [
    `pnpm run type-check:go`,
    `pnpm run lint`,
    // `pnpm run knip`, // TODO: temporarily disabled due to issues with knip
    `pnpm run prettify --write`,
  ],
};
