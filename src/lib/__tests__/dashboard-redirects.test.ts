import { describe, expect, it } from "vitest";

import { getDashboardRedirects } from "../dashboard-redirects";

/**
 * The `dashboard-entry` scenarios (openspec change `backend-split`). These check the rules
 * `next.config.mjs` registers; that Next.js applies them before any route -- including the
 * `[locale]/[[...rest]]` catch-all -- was checked with curl against `next dev`.
 */
describe("getDashboardRedirects", () => {
  it("adds no rules when no dashboard URL is configured", () => {
    expect(getDashboardRedirects(undefined)).toEqual([]);
    expect(getDashboardRedirects("")).toEqual([]);
  });

  it("sends /dashboard and everything below it to the dashboard origin, permanently", () => {
    expect(getDashboardRedirects("https://app.easyinvoicepdf.com")).toEqual([
      {
        source: "/dashboard/:path*",
        destination: "https://app.easyinvoicepdf.com/:path*",
        permanent: true,
      },
    ]);
  });

  it("does not double the slash when the configured URL ends with one", () => {
    const [rule] = getDashboardRedirects("https://app.easyinvoicepdf.com/");

    expect(rule?.destination).toBe("https://app.easyinvoicepdf.com/:path*");
  });
});
