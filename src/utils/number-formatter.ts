/**
 * Formatter for GitHub star counts using compact notation.
 * Converts numbers to abbreviated format (e.g., 1500 -> "1.5K").
 *
 * @example
 * githubStarCountFormatter.format(1500); // "1.5K"
 * githubStarCountFormatter.format(2350); // "2.35K"
 * githubStarCountFormatter.format(1000000); // "1M"
 */
export const githubStarCountFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
});
