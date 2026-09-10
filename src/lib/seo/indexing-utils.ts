import { PROD_WEBSITE_URL } from "@/config";

/**
 * Determine indexing-related flags from request search parameters and environment.
 *
 * @param searchParams - Query params from request URL.
 * @returns Object with:
 *   hasShareableData: Whether query contains 'data' parameter (shareable invoice).
 *   isIndexableEnvironment: True if this deployment is allowed to be indexed at all.
 *   shouldIndex: True if page should be indexed (indexable environment, no share data).
 */
export function computeIndexingFlags(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const hasShareableData = Boolean(searchParams?.data);

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

  const isIndexableEnvironment = isProd || isLocalDevServer;

  const shouldIndex = isIndexableEnvironment && !hasShareableData;

  return { hasShareableData, isIndexableEnvironment, shouldIndex };
}

/**
 * The `content` values Next.js renders for `Metadata.robots` on the invoice app page.
 *
 * Kept here so the client-side sync in `RobotsMetaSync` writes exactly what
 * `resolveAppPageRobots` would have rendered for the same state.
 */
export const ROBOTS_META_CONTENT = {
  indexable: "index, follow",
  nonIndexable: "noindex, nofollow",
} as const;
