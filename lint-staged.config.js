module.exports = {
  // Run type-check, lint, security check, knip, format, and vitest on all changes to files
  // https://github.com/okonet/lint-staged
  "*": (stagedFiles) => {
    const tasks = [
      // Format first: everything below then verifies what actually gets committed.
      `pnpm run format`,
      `pnpm run type-check`,
      `pnpm run lint`,
      `pnpm run knip`,
      `pnpm run vitest --run --reporter=verbose`,
    ];

    // zizmor checks GitHub Actions workflows https://docs.zizmor.sh/
    if (
      stagedFiles.some((file) => {
        return file.includes("/.github/");
      })
    ) {
      tasks.push(`pnpm run check-github-actions-security`);
    }

    return tasks;
  },
};
