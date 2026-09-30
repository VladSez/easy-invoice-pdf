import { PROD_WEBSITE_URL } from "@/config";

/**
 * Whether this deployment may be indexed at all: the canonical production deployment
 * (or the local dev server, see below). Preview deployments never are.
 *
 * Depends only on the environment, so it is known at build time and prerendered pages
 * can use it. Shared invoice links (`?data=`) are kept out of the index separately, by
 * the `X-Robots-Tag` header in `next.config.mjs`.
 */
export function getIsIndexableEnvironment() {
  const isProd =
    process.env.VERCEL_ENV === "production" &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` === PROD_WEBSITE_URL;

  /**
   * The local dev server renders the same directives production does, so the difference
   * between an indexable page and a shared one can be seen (and tested) on localhost.
   *
   * Nothing crawls localhost, and a deployed build never runs with `NODE_ENV`
   * `development` -- preview deployments stay `noindex, nofollow` either way.
   */
  const isLocalDevServer = process.env.NODE_ENV === "development";

  return isProd || isLocalDevServer;
}
