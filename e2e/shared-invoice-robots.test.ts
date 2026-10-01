import { expect, test, type APIResponse } from "@playwright/test";

import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

/**
 * Shared invoice links carry the whole invoice (names, addresses, amounts) in `?data=`,
 * so search engines must never index them.
 *
 * The invoice app is prerendered, so its robots meta tag is the same for every query
 * string (`index, follow` on production): shared links are kept out of the index by the
 * `X-Robots-Tag` header `next.config.mjs` adds when `?data=` is present. Search engines
 * combine the header with the meta tags and apply the most restrictive directive, and
 * that combined result is what these tests check -- the way a crawler sees the response.
 *
 * robots.txt, which stops compliant crawlers from fetching these links at all, is
 * covered by `src/app/__tests__/robots.test.ts`.
 */

const GOOGLEBOT_USER_AGENT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/**
 * Compressed invoice data as the app puts it in a shared link. The directives do not
 * depend on the payload, only on `?data=` being there.
 */
const DATA = "N4IgjCBcIGoIIBUQBoQGYohSALFALgE4CuApqg";

const SHARED_INVOICE_URLS = [
  `/?data=${DATA}`,
  `/?utm_source=newsletter&data=${DATA}`,
  `${STRIPE_TEMPLATE_PATHNAME}?data=${DATA}`,
  `${STRIPE_TEMPLATE_PATHNAME}?utm_source=newsletter&data=${DATA}`,
  // legacy links, from when the template was a query param
  `/?template=default&data=${DATA}`,
  `/?data=${DATA}&template=default`,
  // redirected to `/stripe-template` with its query string
  `/?template=stripe&data=${DATA}`,
] as const;

const APP_URLS = [
  "/",
  STRIPE_TEMPLATE_PATHNAME,
  // legacy link, from when the template was a query param
  "/?template=default",
] as const;

test.describe("Shared invoice links are kept out of search engines", () => {
  // plain HTTP requests, no need to run them once per browser project
  test.beforeEach(({}, testInfo) => {
    // eslint-disable-next-line playwright/no-skipped-test -- HTTP only test, Desktop Chrome only
    test.skip(
      testInfo.project.name !== "Desktop Chrome",
      "robots directives do not depend on the browser",
    );
  });

  for (const url of SHARED_INVOICE_URLS) {
    test(`${url.replace(DATA, "<data>")} is served with noindex, nofollow`, async ({
      request,
    }) => {
      const response = await request.get(url, {
        headers: { "User-Agent": GOOGLEBOT_USER_AGENT },
      });

      expect(response.status()).toBe(200);
      // the data survives any redirect, so the directives are checked on the page that has it
      expect(new URL(response.url()).searchParams.get("data")).toBe(DATA);

      // the header alone is enough, whatever the (prerendered) meta tags say
      expect(parseDirectives(response.headers()["x-robots-tag"])).toEqual(
        expect.arrayContaining(["noindex", "nofollow"]),
      );

      const directives = await getEffectiveRobotsDirectives(response);
      expect(directives).toContain("noindex");
      expect(directives).toContain("nofollow");
    });
  }

  for (const url of APP_URLS) {
    test(`${url} does not get the shared-link header`, async ({ request }) => {
      const response = await request.get(url, {
        headers: { "User-Agent": GOOGLEBOT_USER_AGENT },
      });

      expect(response.status()).toBe(200);

      // Guards against the `?data=` rule in `next.config.mjs` matching every request, which
      // would take the whole app out of the index. Not a plain "no header" check: Vercel
      // sends its own `X-Robots-Tag: noindex` on preview deployments, which is where this
      // suite runs in CI -- but never `nofollow`, which only the shared-link rule adds.
      expect(parseDirectives(response.headers()["x-robots-tag"])).not.toContain(
        "nofollow",
      );

      // The meta tags are not checked here either: they are `index, follow` on production
      // but `noindex, nofollow` on preview deployments.
    });
  }
});

/**
 * Collects every robots directive a crawler reads from a response: the `X-Robots-Tag`
 * header plus the `robots` and `googlebot` meta tags, lowercased and split into single
 * directives (`"noindex, nofollow"` -> `["noindex", "nofollow"]`).
 *
 * @param response - The page response.
 * @returns All directives that apply to Googlebot.
 */
async function getEffectiveRobotsDirectives(response: APIResponse) {
  const html = await response.text();

  const metaContents = [
    ...html.matchAll(
      /<meta[^>]+name="(?:robots|googlebot)"[^>]+content="([^"]*)"/gi,
    ),
  ].map((match) => {
    return match[1];
  });

  return [response.headers()["x-robots-tag"], ...metaContents].flatMap(
    (value) => {
      return parseDirectives(value);
    },
  );
}

/**
 * Splits a robots directive list into single directives. Drops a leading user agent
 * (`googlebot: noindex`), which `X-Robots-Tag` allows.
 */
function parseDirectives(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .replace(/^\s*[\w-]+\s*:(?!\/)/, "")
    .split(",")
    .map((directive) => {
      return directive.trim().toLowerCase();
    })
    .filter(Boolean);
}
