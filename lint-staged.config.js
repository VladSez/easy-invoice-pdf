module.exports = {
  // Run type-check, lint, security check, knip, format, and vitest on all changes to files
  // https://github.com/okonet/lint-staged
  "*": () => {
    return [
      `pnpm run type-check:fast`,
      `pnpm run lint`,
      `pnpm run check-github-actions-security`, // zizmor is used to check the security of the GitHub Actions workflows https://docs.zizmor.sh/
      `pnpm run knip`,
      `pnpm run vitest --run --reporter=verbose`,
      `pnpm run format`,
    ];
  },
};
