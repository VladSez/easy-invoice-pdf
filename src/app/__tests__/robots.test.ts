import { describe, expect, it } from "vitest";

import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

import robots from "../robots";

/**
 * Shared invoice links carry the whole invoice (names, addresses, amounts) in `?data=`,
 * in every shape the app produces or used to produce.
 */
const SHARED_INVOICE_URLS = [
  "/?data=abc",
  "/?template=default&data=abc",
  "/?data=abc&template=default",
  "/?utm_source=newsletter&template=default&data=abc",
  // legacy links, from before the Stripe template had its own route
  "/?template=stripe&data=abc",
  `${STRIPE_TEMPLATE_PATHNAME}?data=abc`,
  `${STRIPE_TEMPLATE_PATHNAME}?utm_source=newsletter&data=abc`,
] as const;

/** The invoice app itself, which should be crawled. */
const APP_URLS = [
  "/",
  "/?template=default",
  "/?utm_source=newsletter",
  STRIPE_TEMPLATE_PATHNAME,
  `${STRIPE_TEMPLATE_PATHNAME}?utm_source=newsletter`,
] as const;

describe("robots.txt", () => {
  const rules = getRulesForAllCrawlers();

  it.each(SHARED_INVOICE_URLS)(
    "disallows the shared invoice link %s",
    (url) => {
      expect(isAllowedByRobotsTxt({ rules, url })).toBe(false);
    },
  );

  it.each(APP_URLS)("allows the invoice app at %s", (url) => {
    expect(isAllowedByRobotsTxt({ rules, url })).toBe(true);
  });
});

describe("isAllowedByRobotsTxt (the matcher these tests rely on)", () => {
  it("lets the longest matching rule win, and allow win a tie", () => {
    expect(
      isAllowedByRobotsTxt({
        rules: { allow: ["/page"], disallow: ["/page?*secret=*"] },
        url: "/page?secret=1",
      }),
    ).toBe(false);

    expect(
      isAllowedByRobotsTxt({
        rules: { allow: ["/page?a=1"], disallow: ["/page?*"] },
        url: "/page?a=1",
      }),
    ).toBe(true);

    expect(
      isAllowedByRobotsTxt({
        rules: { allow: ["/page"], disallow: ["/page"] },
        url: "/page",
      }),
    ).toBe(true);
  });

  it("supports `*` wildcards and the `$` end anchor", () => {
    const rules = { allow: [], disallow: ["/*.ico$"] };

    expect(isAllowedByRobotsTxt({ rules, url: "/favicon.ico" })).toBe(false);
    expect(isAllowedByRobotsTxt({ rules, url: "/favicon.ico?v=2" })).toBe(true);
  });

  it("allows what no rule matches", () => {
    expect(
      isAllowedByRobotsTxt({
        rules: { allow: [], disallow: ["/private"] },
        url: "/public",
      }),
    ).toBe(true);
  });
});

interface RobotsRules {
  allow: readonly string[];
  disallow: readonly string[];
}

/** The rules `robots()` publishes for `User-agent: *`. */
function getRulesForAllCrawlers(): RobotsRules {
  const { rules } = robots();
  const rule = (Array.isArray(rules) ? rules : [rules]).find(
    ({ userAgent }) => {
      return userAgent === "*";
    },
  );

  if (!rule) {
    throw new Error("robots.txt has no `User-agent: *` group");
  }

  return {
    allow: toArray(rule.allow),
    disallow: toArray(rule.disallow),
  };
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

interface IsAllowedByRobotsTxtParams {
  rules: RobotsRules;
  /** Path plus query string, e.g. `/?data=abc`. */
  url: string;
}

/**
 * Whether a crawler may fetch `url`, following Google's reading of robots.txt
 * (https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt):
 * rules match from the start of the path and query, `*` matches any run of characters
 * and a trailing `$` anchors the end; of the matching rules the longest one wins, and
 * `allow` wins a tie. A URL no rule matches is allowed.
 *
 * @returns `true` when the URL may be crawled.
 */
function isAllowedByRobotsTxt({
  rules,
  url,
}: IsAllowedByRobotsTxtParams): boolean {
  const longestAllow = longestMatchingRule({ patterns: rules.allow, url });
  const longestDisallow = longestMatchingRule({
    patterns: rules.disallow,
    url,
  });

  return longestAllow >= longestDisallow;
}

interface LongestMatchingRuleParams {
  patterns: readonly string[];
  url: string;
}

/** @returns The length of the longest pattern matching `url`, or `-1` when none does. */
function longestMatchingRule({ patterns, url }: LongestMatchingRuleParams) {
  return Math.max(
    -1,
    ...patterns
      .filter((pattern) => {
        return robotsPatternToRegExp(pattern).test(url);
      })
      .map((pattern) => {
        return pattern.length;
      }),
  );
}

function robotsPatternToRegExp(pattern: string) {
  const isAnchored = pattern.endsWith("$");
  const body = isAnchored ? pattern.slice(0, -1) : pattern;

  const source = body
    .split("*")
    .map((part) => {
      return part.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`);
    })
    .join(".*");

  return new RegExp(`^${source}${isAnchored ? "$" : ""}`);
}
