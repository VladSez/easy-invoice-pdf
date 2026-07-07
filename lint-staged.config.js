module.exports = {
  // Run type-check, lint, security check, knip, prettify, and vitest on all changes to files
  // https://github.com/okonet/lint-staged
  "*": () => [
    `pnpm run type-check:go`,
    `pnpm run lint`,
    `pnpm run check-github-actions-security`, // zizmor is used to check the security of the GitHub Actions workflows https://docs.zizmor.sh/
    `pnpm run knip`,
    `pnpm run vitest --run --reporter=verbose`,
    `pnpm run prettify --write`,
  ],
};
